import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ObjectiveStatus } from '../../common/enums/index.js';

/**
 * Status bucket for distribution reporting.
 */
export class StatusBucketDto {
  @ApiProperty({
    description: 'Status value',
    enum: ObjectiveStatus,
  })
  status!: ObjectiveStatus;

  @ApiProperty({
    description: 'Number of objectives with this status',
    example: 12,
  })
  count!: number;

  @ApiProperty({
    description: 'Percentage of total objectives',
    example: 48.0,
  })
  percentage!: number;
}

/**
 * Distribution of objectives by status.
 */
export class StatusDistributionDto {
  @ApiProperty({
    description: 'Total number of objectives in scope',
    example: 25,
  })
  totalObjectives!: number;

  @ApiProperty({
    description: 'Breakdown by status',
    type: [StatusBucketDto],
  })
  distribution!: StatusBucketDto[];

  @ApiPropertyOptional({
    description: 'Filter context - time period ID if filtered',
    nullable: true,
  })
  timePeriodId?: string | null;

  @ApiPropertyOptional({
    description: 'Filter context - owner type if filtered',
    nullable: true,
  })
  ownerType?: string | null;

  @ApiPropertyOptional({
    description: 'Filter context - owner ID if filtered',
    nullable: true,
  })
  ownerId?: string | null;
}
