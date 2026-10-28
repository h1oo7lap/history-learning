import { ExecutionContext, Injectable, HttpStatus } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';
import { AppError } from '../errors/app-error';
import { ErrorCodes } from '../errors/error-codes';

@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Track rate limit by authenticated user ID (supporting multiple users sharing an IP)
    return req.user?.id ? `user:${req.user.id}` : req.ip || 'anonymous';
  }

  protected generateKey(_context: ExecutionContext, suffix: string, _name: string): string {
    return `user-throttler:${suffix}`;
  }

  protected async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    const handler = requestProps.context.getHandler();
    const classRef = requestProps.context.getClass();

    // Support @Throttle({ default: { limit: 10, ttl: 60000 } }) even when root throttler is named 'global'
    const overrideLimit =
      this.reflector.getAllAndOverride('THROTTLER:LIMITdefault', [handler, classRef]) ??
      this.reflector.getAllAndOverride('THROTTLER:LIMITglobal', [handler, classRef]);

    const overrideTtl =
      this.reflector.getAllAndOverride('THROTTLER:TTLdefault', [handler, classRef]) ??
      this.reflector.getAllAndOverride('THROTTLER:TTLglobal', [handler, classRef]);

    const limit = overrideLimit !== undefined ? Number(overrideLimit) : requestProps.limit;
    const ttl = overrideTtl !== undefined ? Number(overrideTtl) : requestProps.ttl;

    return super.handleRequest({
      ...requestProps,
      limit,
      ttl,
    });
  }

  protected async throwThrottlingException(_context: ExecutionContext): Promise<void> {
    throw new AppError(
      ErrorCodes.AI_RATE_LIMITED,
      HttpStatus.TOO_MANY_REQUESTS,
      'Bạn đang gửi câu hỏi quá nhanh. Vui lòng thử lại sau ít phút.',
    );
  }
}
