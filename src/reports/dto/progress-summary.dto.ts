import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Summary of objectives progress within a filtered scope.
 */
export class ProgressSummaryDto {
  @ApiProperty({
    description: 'Total number of objectives in scope',
    example: 25,
  })
  totalObjectives!: number;

  @ApiProperty({
    description: 'Average progress percentage across all objectives',
    example: 67.5,
    minimum: 0,
  })
  averageProgress!: number;

  @ApiProperty({
    description: 'Number of objectives that are complete (>= 100%)',
    example: 8,
  })
  completedObjectives!: number;

  @ApiProperty({
    description: 'Total number of key results across all objectives',
    example: 75,
  })
  totalKeyResults!: number;

  @ApiProperty({
    description: 'Number of key results that are complete (>= 100%)',
    example: 32,
  })
  completedKeyResults!: number;

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
