import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { QueryFailedError } from 'typeorm';
import { ErrorResponseDto, ErrorCodes, ErrorDetails } from '../dto/error-response.dto.js';

/**
 * Global exception filter that transforms all exceptions into the
 * standardized error format: { error: { code, message, details? } }
 * Per constitution II. UX Consistency - Error Responses.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, code, message, details } = this.extractErrorInfo(exception);

    // Log the error with context
    this.logger.error(
      `${request.method} ${request.url} - ${code}: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    const errorResponse = ErrorResponseDto.create(code, message, details);
    response.status(status).json(errorResponse);
  }

  private extractErrorInfo(exception: unknown): {
    status: number;
    code: string;
    message: string;
    details?: ErrorDetails;
  } {
    // Handle NestJS HttpException
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Handle validation errors from class-validator
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, unknown>;

        if (Array.isArray(responseObj['message'])) {
          return {
            status,
            code: ErrorCodes.VALIDATION_ERROR,
            message: 'Request validation failed',
            details: {
              violations: (responseObj['message'] as string[]).map((msg) => ({
                field: this.extractFieldFromMessage(msg),
                message: msg,
              })),
            },
          };
        }

        const messageValue = responseObj['message'];
        const messageStr = typeof messageValue === 'string' ? messageValue : exception.message;

        return {
          status,
          code: this.statusToErrorCode(status),
          message: messageStr,
          details: responseObj['details'] as ErrorDetails | undefined,
        };
      }

      return {
        status,
        code: this.statusToErrorCode(status),
        message: exception.message,
      };
    }

    // Handle TypeORM QueryFailedError
    if (exception instanceof QueryFailedError) {
      const pgError = exception as QueryFailedError & { code?: string };

      // Handle unique constraint violations
      if (pgError.code === '23505') {
        return {
          status: HttpStatus.CONFLICT,
          code: ErrorCodes.CONFLICT,
          message: 'A resource with this value already exists',
        };
      }

      // Handle foreign key violations
      if (pgError.code === '23503') {
        return {
          status: HttpStatus.BAD_REQUEST,
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Referenced resource does not exist',
        };
      }

      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        code: ErrorCodes.INTERNAL_ERROR,
        message: 'Database operation failed',
      };
    }

    // Handle generic errors
    if (exception instanceof Error) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        code: ErrorCodes.INTERNAL_ERROR,
        message:
          process.env.NODE_ENV === 'production'
            ? 'An unexpected error occurred'
            : exception.message,
      };
    }

    // Fallback for unknown exceptions
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ErrorCodes.INTERNAL_ERROR,
      message: 'An unexpected error occurred',
    };
  }

  private statusToErrorCode(status: HttpStatus): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCodes.VALIDATION_ERROR;
      case HttpStatus.UNAUTHORIZED:
        return ErrorCodes.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ErrorCodes.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ErrorCodes.NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ErrorCodes.CONFLICT;
      default:
        return ErrorCodes.INTERNAL_ERROR;
    }
  }

  private extractFieldFromMessage(message: string): string {
    // Try to extract field name from validation messages like "title must be..."
    const match = message.match(/^(\w+)\s/);
    return match ? match[1] : 'unknown';
  }
}
