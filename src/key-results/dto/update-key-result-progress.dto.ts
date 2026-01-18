import { IsNotEmpty, IsNumber, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for updating key result progress (currentValue only).
 * Convenience endpoint for quick progress updates.
 */
export class UpdateKeyResultProgressDto {
  @ApiProperty({
    description: 'New current value',
    example: 75,
  })
  @IsNotEmpty()
  @IsNumber()
  currentValue!: number;

  @ApiProperty({
    description: 'Current version for optimistic locking',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  version!: number;
}
