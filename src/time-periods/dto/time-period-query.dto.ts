import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { TimePeriodStatus } from '../../common/enums/index.js';
import { PaginatedQueryDto } from '../../common/dto/paginated-response.dto.js';

/**
 * Query parameters for filtering and paginating time periods.
 */
export class TimePeriodQueryDto extends PaginatedQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: TimePeriodStatus,
  })
  @IsOptional()
  @IsEnum(TimePeriodStatus)
  status?: TimePeriodStatus;
}
