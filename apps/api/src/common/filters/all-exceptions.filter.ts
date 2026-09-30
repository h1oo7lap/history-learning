import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { AppError } from '../errors/app-error';
import { ThrottlerException } from '@nestjs/throttler';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

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

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      let message = exception.message;
      let errorCode = 'VALIDATION_ERROR';

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        if (typeof resp['message'] === 'string') {
          message = resp['message'];
        } else if (Array.isArray(resp['message'])) {
          message = (resp['message'] as string[]).join('; ');
        }
        if (typeof resp['errorCode'] === 'string') {
          errorCode = resp['errorCode'];
        } else if (status === 401) {
          errorCode = 'UNAUTHORIZED';
        } else if (status === 403) {
          errorCode = 'FORBIDDEN';
        } else if (status === 404) {
          errorCode = 'NOT_FOUND';
        }
      }

      return response.status(status).json({
        success: false,
        message,
        errorCode,
      });
    }

    console.error('Unhandled exception:', exception);
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      errorCode: 'INTERNAL_ERROR',
    });
  }
}
