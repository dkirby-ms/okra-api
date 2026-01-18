import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsEnum } from 'class-validator';
import { OwnerType } from '../../common/enums/index.js';

/**
 * Query parameters for filtering report data.
 */
export class ReportQueryDto {
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
}
