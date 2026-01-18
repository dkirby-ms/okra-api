import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsDateString, IsOptional, IsEnum, IsInt, Min, MaxLength } from 'class-validator';
import { TimePeriodStatus } from '../../common/enums/index.js';

/**
 * DTO for updating an existing time period.
 * Version is required for optimistic locking.
 */
export class UpdateTimePeriodDto {
  @ApiPropertyOptional({
    description: 'Updated time period name',
    example: 'Q1 2026 - Extended',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated start date (ISO 8601)',
    example: '2026-01-15',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Updated end date (ISO 8601)',
    example: '2026-04-15',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Updated status',
    enum: TimePeriodStatus,
  })
  @IsOptional()
  @IsEnum(TimePeriodStatus)
  status?: TimePeriodStatus;

  @ApiProperty({
    description: 'Current version for optimistic locking',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  version!: number;
}
