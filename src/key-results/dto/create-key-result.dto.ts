import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
  IsNumber,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { MetricType } from '../../common/enums/index.js';

/**
 * DTO for creating a new key result.
 */
export class CreateKeyResultDto {
  @ApiProperty({
    description: 'Key result title',
    example: 'Reduce customer churn rate',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({
    description: 'Detailed description',
    example: 'Measure monthly churn rate across all customer segments',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Parent objective ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  objectiveId!: string;

  @ApiPropertyOptional({
    description: 'Metric type for tracking progress',
    enum: MetricType,
    default: MetricType.NUMBER,
  })
  @IsOptional()
  @IsEnum(MetricType)
  metricType?: MetricType = MetricType.NUMBER;

  @ApiPropertyOptional({
    description: 'Starting value (default: 0)',
    example: 5.5,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  startValue?: number = 0;

  @ApiPropertyOptional({
    description: 'Current value (default: equals startValue)',
    example: 5.5,
  })
  @IsOptional()
  @IsNumber()
  currentValue?: number;

  @ApiProperty({
    description: 'Target value (must differ from startValue)',
    example: 3.0,
  })
  @IsNumber()
  targetValue!: number;

  @ApiPropertyOptional({
    description: 'Unit of measurement',
    example: '%',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @ValidateIf((o: CreateKeyResultDto) => o.unit !== null)
  unit?: string | null;
}
