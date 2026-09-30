import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '../common/prisma/prisma.service';
import { COOKIE_NAME } from '../common/config/constants';
import { AppError } from '../common/errors/app-error';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.[COOKIE_NAME] as string | null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
      ignoreExpiration: false,
    });
  }

  async validate(payload: { sub: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException('User not found');
    if (user.status === 'BANNED') throw new AppError('ACCOUNT_BANNED', 401, 'Account banned');
    if (user.status === 'INACTIVE') throw new AppError('ACCOUNT_INACTIVE', 401, 'Account inactive');
    return user; // attached to req.user (without passwordHash concerns - but do not return it)
  }
}
