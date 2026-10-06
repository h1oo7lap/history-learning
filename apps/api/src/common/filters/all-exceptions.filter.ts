import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ThrottlerException } from '@nestjs/throttler';
import { AppError } from '../errors/app-error';

type Issue = { path: (string | number)[]; message: string };

// Đối chiếu theo tên, không dùng instanceof, vì pnpm có thể cài hai bản zod
const isZodError = (e: unknown): e is { name: string; issues: Issue[] } =>
  typeof e === 'object' &&
  e !== null &&
  (e as { name?: unknown }).name === 'ZodError' &&
  Array.isArray((e as { issues?: unknown }).issues);

const codeForStatus = (status: number): string => {
  switch (status) {
    case 400: return 'VALIDATION_ERROR';
    case 401: return 'UNAUTHORIZED';
    case 403: return 'FORBIDDEN';
    case 404: return 'NOT_FOUND';
    case 429: return 'RATE_LIMITED';
    default: return 'INTERNAL_ERROR';
  }
};

const toDetails = (issues: Issue[]) =>
  issues.map((i) => ({ path: i.path.join('.'), message: i.message }));

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof AppError) {
      return response.status(exception.status).json({
        success: false,
        message: exception.message,
        errorCode: exception.code,
      });
    }

    if (exception instanceof ThrottlerException) {
      return response.status(429).json({
        success: false,
        message: 'Too many requests',
        errorCode: 'RATE_LIMITED',
      });
    }

    // Lưới an toàn: ZodError thô (ai đó gọi .parse() trực tiếp) vẫn là lỗi 400, không phải 500
    if (isZodError(exception)) {
      const details = toDetails(exception.issues);
      return response.status(400).json({
        success: false,
        message: details.map((d) => `${d.path}: ${d.message}`).join('; ') || 'Validation failed',
        errorCode: 'VALIDATION_ERROR',
        details,
      });
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      let message = exception.message;
      let errorCode = codeForStatus(status);
      let details: ReturnType<typeof toDetails> | undefined;

      if (typeof body === 'object' && body !== null) {
        const resp = body as Record<string, unknown>;

        // nestjs-zod: { message: 'Validation failed', errors: ZodIssue[] }
        if (resp['message'] === 'Validation failed' && Array.isArray(resp['errors'])) {
          const issues = resp['errors'] as Issue[];
          details = toDetails(issues);
          message = details.map((d) => `${d.path}: ${d.message}`).join('; ') || 'Validation failed';
        } else if (typeof resp['message'] === 'string') {
          message = resp['message'];
        } else if (Array.isArray(resp['message'])) {
          message = (resp['message'] as string[]).join('; ');
        }

        if (typeof resp['errorCode'] === 'string') errorCode = resp['errorCode'];
      }

      return response.status(status).json({
        success: false,
        message,
        errorCode,
        ...(details ? { details } : {}),
      });
    }

    this.logger.error(
      'Unhandled exception',
      exception instanceof Error ? exception.stack : String(exception),
    );
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      errorCode: 'INTERNAL_ERROR',
    });
  }
}