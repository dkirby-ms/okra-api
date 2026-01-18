import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OwnerType, ObjectiveStatus } from '../../common/enums/index.js';

/**
 * DTO for key result summary in objective response.
 * Full KeyResultResponseDto will be defined in Phase 4.
 */
export class KeyResultSummaryDto {
  @ApiProperty({ description: 'Key result ID' })
  id!: string;

  @ApiProperty({ description: 'Key result title' })
  title!: string;

  @ApiProperty({ description: 'Completion percentage (0-100)' })
  completionPercentage!: number;

  @ApiProperty({ description: 'Whether the key result is complete' })
  isComplete!: boolean;
}

/**
 * Response DTO for objective data.
 * Includes computed progress and status (calculated on-demand).
 */
export class ObjectiveResponseDto {
  @ApiProperty({
    description: 'Unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({
    description: 'Objective title',
    example: 'Increase customer retention',
  })
  title!: string;

  @ApiPropertyOptional({
    description: 'Detailed description',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({
    description: 'Owner type',
    enum: OwnerType,
  })
  ownerType!: OwnerType;

  @ApiProperty({
    description: 'Owner ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  ownerId!: string;

  @ApiPropertyOptional({
    description: 'Parent objective ID for hierarchical alignment',
    nullable: true,
  })
  parentId!: string | null;

  @ApiPropertyOptional({
    description: 'Time period ID',
    nullable: true,
  })
  timePeriodId!: string | null;

  @ApiProperty({
    description: 'Start date',
    example: '2026-01-01',
  })
  startDate!: string;

  @ApiProperty({
    description: 'End date',
    example: '2026-03-31',
  })
  endDate!: string;

  @ApiProperty({
    description: 'Computed progress percentage (0-100+)',
    example: 65.5,
    minimum: 0,
  })
  progress!: number;

  @ApiProperty({
    description: 'Computed status based on progress vs expected',
    enum: ObjectiveStatus,
  })
  status!: ObjectiveStatus;

  @ApiPropertyOptional({
    description: 'Associated key results (included when requested)',
    type: [KeyResultSummaryDto],
  })
  keyResults?: KeyResultSummaryDto[];

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
