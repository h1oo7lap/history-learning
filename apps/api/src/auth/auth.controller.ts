import { Controller, Post, Get, Body, Res, HttpCode } from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { ZodValidationPipe } from 'nestjs-zod';
import { AuthService } from './auth.service';
import { Public } from '../common/decorators/public';
import { CurrentUser } from '../common/decorators/current-user';
import { COOKIE_NAME } from '../common/config/constants';
import {
  RegisterSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  type RegisterDto,
  type LoginDto,
  type ForgotPasswordDto,
  type ResetPasswordDto,
} from '@history-learning/shared';
import type { User } from '../generated/prisma/client';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

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

  private baseCookieOptions() {
    return {
      httpOnly: true,
      secure: this.isProd,
      sameSite: 'lax' as const,
      path: '/',
      domain: this.cookieDomain,
    };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body(new ZodValidationPipe(RegisterSchema)) dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login and receive a session cookie' })
  async login(
    @Body(new ZodValidationPipe(LoginSchema)) dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token } = await this.auth.login(dto);
    res.cookie(this.cookieName, token, { ...this.baseCookieOptions(), maxAge: SEVEN_DAYS_MS });
    return { message: 'Logged in successfully' };
  }

  // Public để luôn xóa được cookie, kể cả khi token đã hết hạn
  @Public()
  @Post('logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'Clear the session cookie' })
  async logout(@Res({ passthrough: true }) res: Response) {
    // Phải dùng đúng path/domain đã đặt lúc login thì trình duyệt mới xóa được
    res.clearCookie(this.cookieName, this.baseCookieOptions());
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
  async forgotPassword(@Body(new ZodValidationPipe(ForgotPasswordSchema)) dto: ForgotPasswordDto) {
    await this.auth.forgotPassword(dto.email);
    return { message: 'If an account exists, a reset email has been sent' };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('reset-password')
  @HttpCode(200)
  @ApiOperation({ summary: 'Reset password with a valid token' })
  async resetPassword(@Body(new ZodValidationPipe(ResetPasswordSchema)) dto: ResetPasswordDto) {
    await this.auth.resetPassword(dto.token, dto.password);
    return { message: 'Password reset successfully' };
  }
}