import { ApiProperty } from '@nestjs/swagger';
import { TimePeriodStatus } from '../../common/enums/index.js';

/**
 * Response DTO for time period data.
 */
export class TimePeriodResponseDto {
  @ApiProperty({
    description: 'Unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({
    description: 'Time period name',
    example: 'Q1 2026',
  })
  name!: string;

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
    description: 'Time period status',
    enum: TimePeriodStatus,
  })
  status!: TimePeriodStatus;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2026-01-01T10:30:00Z',
  })
  createdAt!: string;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2026-01-01T10:30:00Z',
  })
  updatedAt!: string;

  @ApiProperty({
    description: 'Version for optimistic locking',
    example: 1,
  })
  version!: number;
}
