import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsEnum, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { OwnerType, ObjectiveStatus } from '../../common/enums/index.js';
import { PaginatedQueryDto } from '../../common/dto/paginated-response.dto.js';

/**
 * Query parameters for filtering and paginating objectives.
 */
export class ObjectiveQueryDto extends PaginatedQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by time period ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  timePeriodId?: string;

  @ApiPropertyOptional({
    description: 'Filter by owner type',
    enum: OwnerType,
  })
  @IsOptional()
  @IsEnum(OwnerType)
  ownerType?: OwnerType;

  @ApiPropertyOptional({
    description: 'Filter by owner ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({
    description: 'Filter by computed status',
    enum: ObjectiveStatus,
  })
  @IsOptional()
  @IsEnum(ObjectiveStatus)
  status?: ObjectiveStatus;

  @ApiPropertyOptional({
    description: 'Include key results in response',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeKeyResults?: boolean = false;
}
