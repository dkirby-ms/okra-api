import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Query parameters for cursor-based pagination.
 * Per constitution II. UX Consistency - Pagination.
 */
export class PaginatedQueryDto {
  @ApiPropertyOptional({
    description: 'Maximum number of items to return',
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Pagination cursor from previous response' })
  @IsOptional()
  @IsString()
  cursor?: string;
}

/**
 * Generic paginated response wrapper.
 */
export class PaginatedResponseDto<T> {
  @ApiProperty({ description: 'Array of items', isArray: true })
  data!: T[];

  @ApiPropertyOptional({
    description: 'Cursor for next page, null if no more results',
    nullable: true,
  })
  cursor!: string | null;

  @ApiProperty({ description: 'Whether there are more results available' })
  hasMore!: boolean;

  static create<T>(data: T[], cursor: string | null, hasMore: boolean): PaginatedResponseDto<T> {
    const response = new PaginatedResponseDto<T>();
    response.data = data;
    response.cursor = cursor;
    response.hasMore = hasMore;
    return response;
  }
}
