import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Error details for structured error responses.
 */
export class ErrorDetails {
  @ApiPropertyOptional({ description: 'Field-level validation errors' })
  violations?: Array<{ field: string; message: string }>;

  @ApiPropertyOptional({ description: 'Current version for conflict errors' })
  currentVersion?: number;

  /** Additional context-specific details */
  [key: string]: unknown;
}

/**
 * Error object following constitution-mandated format.
 */
export class ErrorObject {
  @ApiProperty({ description: 'Machine-readable error code', example: 'VALIDATION_ERROR' })
  code!: string;

  @ApiProperty({
    description: 'Human-readable error message',
    example: 'Request validation failed',
  })
  message!: string;

  @ApiPropertyOptional({ type: ErrorDetails, description: 'Additional error context' })
  details?: ErrorDetails;
}

/**
 * Standard error response DTO.
 * Format: { error: { code, message, details? } }
 * Per constitution II. UX Consistency.
 */
export class ErrorResponseDto {
  @ApiProperty({ type: ErrorObject })
  error!: ErrorObject;

  static create(code: string, message: string, details?: ErrorDetails): ErrorResponseDto {
    const response = new ErrorResponseDto();
    response.error = { code, message, details };
    return response;
  }
}

/**
 * Common error codes used throughout the application.
 */
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  HAS_DEPENDENCIES: 'HAS_DEPENDENCIES',
} as const;
