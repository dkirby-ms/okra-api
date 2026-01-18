import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Header name for correlation ID.
 */
export const CORRELATION_ID_HEADER = 'x-correlation-id';

/**
 * Logging interceptor that adds correlation IDs and logs request/response.
 * Per constitution III. Microservices - Observability.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    // Get or generate correlation ID
    const correlationId =
      (request.headers[CORRELATION_ID_HEADER] as string | undefined) || uuidv4();

    // Attach correlation ID to request for downstream use
    (request as Request & { correlationId: string }).correlationId = correlationId;

    // Set correlation ID in response headers
    response.setHeader(CORRELATION_ID_HEADER, correlationId);

    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const startTime = Date.now();

    this.logger.log(`[${correlationId}] --> ${method} ${url} - ${ip} - ${userAgent}`);

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const { statusCode } = response;
          this.logger.log(`[${correlationId}] <-- ${method} ${url} ${statusCode} - ${duration}ms`);
        },
        error: (error: Error) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            `[${correlationId}] <-- ${method} ${url} ERROR - ${duration}ms - ${error.message}`,
          );
        },
      }),
    );
  }
}
