import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsInt, Min, MaxLength, ValidateIf } from 'class-validator';

/**
 * DTO for updating an existing key result.
 * Version is required for optimistic locking.
 */
export class UpdateKeyResultDto {
  @ApiPropertyOptional({
    description: 'Updated title',
    example: 'Reduce customer churn rate to under 3%',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({
    description: 'Updated description',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({
    description: 'Updated current value',
    example: 4.2,
  })
  @IsOptional()
  @IsNumber()
  currentValue?: number;

  @ApiPropertyOptional({
    description: 'Updated target value',
    example: 2.5,
  })
  @IsOptional()
  @IsNumber()
  targetValue?: number;

  @ApiPropertyOptional({
    description: 'Updated unit',
    maxLength: 50,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @ValidateIf((o: UpdateKeyResultDto) => o.unit !== null)
  unit?: string | null;

  @ApiProperty({
    description: 'Current version for optimistic locking',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  version!: number;
}
