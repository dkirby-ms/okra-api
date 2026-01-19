import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { AsyncLocalStorage } from 'async_hooks';

/**
 * Interface for tenant context stored in AsyncLocalStorage.
 */
export interface TenantContext {
  tenantId: string;
  userId?: string;
}

/**
 * AsyncLocalStorage instance for tenant context.
 * Services can access this to get the current tenant.
 */
export const tenantStorage = new AsyncLocalStorage<TenantContext>();

/**
 * Extended Request interface with tenant information.
 */
export interface TenantRequest extends Request {
  tenantId?: string;
  userId?: string;
  user?: {
    tenantId?: string;
    sub?: string;
    [key: string]: unknown;
  };
}

/**
 * Interceptor that extracts tenant context from the authenticated user.
 * The tenant ID is stored in AsyncLocalStorage for access in repositories.
 *
 * NOTE: This assumes authentication middleware has already validated the JWT
 * and attached the user to the request. Authentication itself is out of scope.
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<TenantRequest>();

    // Extract tenant ID from user context (set by auth middleware)
    const tenantId = request.user?.tenantId;
    const userId = request.user?.sub;

    // For development, allow header-based tenant ID if no user context
    const devTenantId = request.headers['x-tenant-id'] as string | undefined;
    const effectiveTenantId = tenantId || devTenantId;

    if (!effectiveTenantId) {
      // In production, this would be an error. For development, we allow it.
      if (process.env.NODE_ENV === 'production') {
        throw new UnauthorizedException('Tenant context is required');
      }
      // Use a default tenant ID for development (must be valid UUID format)
      request.tenantId = '00000000-0000-0000-0000-000000000000';
    } else {
      request.tenantId = effectiveTenantId;
    }

    request.userId = userId;

    // Store in AsyncLocalStorage for service/repository access
    const tenantContext: TenantContext = {
      tenantId: request.tenantId,
      userId: request.userId,
    };

    return new Observable((subscriber) => {
      tenantStorage.run(tenantContext, () => {
        next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}

/**
 * Get the current tenant context from AsyncLocalStorage.
 * @throws Error if called outside of a request context
 */
export function getCurrentTenant(): TenantContext {
  const context = tenantStorage.getStore();
  if (!context) {
    throw new Error('Tenant context not available. Ensure TenantInterceptor is applied.');
  }
  return context;
}

/**
 * Get the current tenant ID from AsyncLocalStorage.
 * @throws Error if called outside of a request context
 */
export function getCurrentTenantId(): string {
  return getCurrentTenant().tenantId;
}
