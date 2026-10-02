import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { Public } from '../common/decorators/public';
import { CurrentUser } from '../common/decorators/current-user';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { COOKIE_NAME } from '../common/config/constants';
import {
  RegisterSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from '@history-learning/shared';
import type { User } from '../generated/prisma/client';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly cookieName: string;
  private readonly isProd: boolean;
  private readonly cookieDomain: string | undefined;

  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {
    this.cookieName = config.get<string>('COOKIE_NAME') ?? COOKIE_NAME;
    this.isProd = config.get<string>('NODE_ENV') === 'production';
    this.cookieDomain = config.get<string>('COOKIE_DOMAIN') || undefined;
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() body: unknown) {
    const dto = RegisterSchema.parse(body);
    return this.auth.register(dto);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login and receive a session cookie' })
  async login(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const dto = LoginSchema.parse(body);
    const { token } = await this.auth.login(dto);

    res.cookie(this.cookieName, token, {
      httpOnly: true,
      secure: this.isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      domain: this.cookieDomain,
    });

    return { message: 'Logged in successfully' };
  }

  @Post('logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'Clear the session cookie' })
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(this.cookieName, { path: '/' });
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user' })
  async me(@CurrentUser() user: User) {
    return this.auth.me(user.id);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @Post('forgot-password')
  @HttpCode(200)
  @ApiOperation({ summary: 'Request a password reset email' })
  async forgotPassword(@Body() body: unknown) {
    const dto = ForgotPasswordSchema.parse(body);
    await this.auth.forgotPassword(dto.email);
    return { message: 'If an account exists, a reset email has been sent' };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(200)
  @ApiOperation({ summary: 'Reset password with a valid token' })
  async resetPassword(@Body() body: unknown) {
    const dto = ResetPasswordSchema.parse(body);
    await this.auth.resetPassword(dto.token, dto.password);
    return { message: 'Password reset successfully' };
  }
}
