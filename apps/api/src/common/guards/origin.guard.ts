import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { AppError } from '../errors/app-error';
import { COOKIE_NAME } from '../config/constants';

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

@Injectable()
export class OriginGuard implements CanActivate {
  private readonly webOrigin: string;

  constructor(config: ConfigService) {
    this.webOrigin = config.getOrThrow<string>('WEB_ORIGIN');
  }

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    // Only apply CSRF check for mutating requests that use cookie auth
    if (SAFE_METHODS.includes(req.method) || !req.cookies?.[COOKIE_NAME]) {
      return true;
    }

    const origin =
      req.headers['origin'] ?? new URL(req.headers['referer'] ?? 'http://x').origin;

    if (origin !== this.webOrigin) {
      throw new AppError('FORBIDDEN', 403, 'Invalid origin');
    }
    return true;
  }
}
