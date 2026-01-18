import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { TimePeriodStatus } from '../../common/enums/index.js';

/**
 * DTO for creating a new time period.
 */
export class CreateTimePeriodDto {
  @ApiProperty({
    description: 'Time period name (must be unique per tenant)',
    example: 'Q1 2026',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    description: 'Start date of the time period (ISO 8601)',
    example: '2026-01-01',
  })
  @IsDateString()
  startDate!: string;

  @ApiProperty({
    description: 'End date of the time period (ISO 8601, must be after start date)',
    example: '2026-03-31',
  })
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional({
    description: 'Initial status of the time period',
    enum: TimePeriodStatus,
    default: TimePeriodStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(TimePeriodStatus)
  status?: TimePeriodStatus = TimePeriodStatus.ACTIVE;
}
