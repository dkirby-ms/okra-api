import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { OwnerType } from '../../common/enums/index.js';

/**
 * DTO for creating a new objective.
 * Validates required fields and date ordering.
 */
export class CreateObjectiveDto {
  @ApiProperty({
    description: 'Objective title',
    example: 'Increase customer retention',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the objective',
    example: 'Focus on reducing churn by improving customer support response times',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Type of owner (user, team, or organization)',
    enum: OwnerType,
    example: OwnerType.TEAM,
  })
  @IsEnum(OwnerType)
  ownerType!: OwnerType;

  @ApiProperty({
    description: 'UUID of the owner entity',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  ownerId!: string;

  @ApiPropertyOptional({
    description: 'Parent objective ID for hierarchical alignment',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID()
  @ValidateIf((o: CreateObjectiveDto) => o.parentId !== null)
  parentId?: string | null;

  @ApiPropertyOptional({
    description: 'Time period ID to associate the objective with',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsOptional()
  @IsUUID()
  @ValidateIf((o: CreateObjectiveDto) => o.timePeriodId !== null)
  timePeriodId?: string | null;

  @ApiProperty({
    description: 'Start date of the objective (ISO 8601)',
    example: '2026-01-01',
  })
  @IsDateString()
  startDate!: string;

  @ApiProperty({
    description: 'End date of the objective (ISO 8601, must be after start date)',
    example: '2026-03-31',
  })
  @IsDateString()
  endDate!: string;
}
