import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginatedQueryDto } from '../../common/dto/paginated-response.dto.js';

/**
 * Query parameters for filtering and paginating key results.
 */
export class KeyResultQueryDto extends PaginatedQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by objective ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  objectiveId?: string;

  @ApiPropertyOptional({
    description: 'Filter by completion status',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isComplete?: boolean;
}
