import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MetricType } from '../../common/enums/index.js';

/**
 * Response DTO for key result data.
 * Includes computed completion percentage.
 */
export class KeyResultResponseDto {
  @ApiProperty({
    description: 'Unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({
    description: 'Key result title',
    example: 'Reduce customer churn rate',
  })
  title!: string;

  @ApiPropertyOptional({
    description: 'Detailed description',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({
    description: 'Parent objective ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  objectiveId!: string;

  @ApiProperty({
    description: 'Metric type',
    enum: MetricType,
  })
  metricType!: MetricType;

  @ApiProperty({
    description: 'Starting value',
    example: 5.5,
  })
  startValue!: number;

  @ApiProperty({
    description: 'Current value',
    example: 4.2,
  })
  currentValue!: number;

  @ApiProperty({
    description: 'Target value',
    example: 3.0,
  })
  targetValue!: number;

  @ApiPropertyOptional({
    description: 'Unit of measurement',
    nullable: true,
    example: '%',
  })
  unit!: string | null;

  @ApiProperty({
    description: 'Computed completion percentage (0-100+)',
    example: 52.0,
    minimum: 0,
  })
  completionPercentage!: number;

  @ApiProperty({
    description: 'Whether the key result is complete (>= 100%)',
    example: false,
  })
  isComplete!: boolean;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2026-01-15T10:30:00Z',
  })
  createdAt!: string;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2026-01-20T14:45:00Z',
  })
  updatedAt!: string;

  @ApiProperty({
    description: 'Version for optimistic locking',
    example: 1,
  })
  version!: number;
}
