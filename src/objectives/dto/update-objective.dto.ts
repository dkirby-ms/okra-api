import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  MaxLength,
  IsInt,
  Min,
  ValidateIf,
} from 'class-validator';

/**
 * DTO for updating an existing objective.
 * All fields except version are optional.
 * Version is required for optimistic locking (FR-020).
 */
export class UpdateObjectiveDto {
  @ApiPropertyOptional({
    description: 'Updated objective title',
    example: 'Increase customer retention by 25%',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({
    description: 'Updated description',
    example: 'Focus on reducing churn through improved support and proactive outreach',
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({
    description: 'Updated parent objective ID (null to remove parent)',
    example: '550e8400-e29b-41d4-a716-446655440001',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  @ValidateIf((o: UpdateObjectiveDto) => o.parentId !== null)
  parentId?: string | null;

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

  @ApiProperty({
    description: 'Current version for optimistic locking',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  version!: number;
}
