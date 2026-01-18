import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ReportsService } from './reports.service.js';
import { ProgressSummaryDto, StatusDistributionDto, ReportQueryDto } from './dto/index.js';

/**
 * Controller for OKR reports and analytics.
 */
@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * Get aggregated progress summary.
   */
  @Get('progress-summary')
  @ApiOperation({
    summary: 'Get progress summary',
    description: 'Returns aggregated progress metrics for objectives in scope',
  })
  @ApiResponse({
    status: 200,
    description: 'Progress summary',
    type: ProgressSummaryDto,
  })
  async getProgressSummary(@Query() query: ReportQueryDto): Promise<ProgressSummaryDto> {
    return this.reportsService.getProgressSummary(query);
  }

  /**
   * Get status distribution.
   */
  @Get('status-distribution')
  @ApiOperation({
    summary: 'Get status distribution',
    description: 'Returns distribution of objectives by computed status',
  })
  @ApiResponse({
    status: 200,
    description: 'Status distribution',
    type: StatusDistributionDto,
  })
  async getStatusDistribution(@Query() query: ReportQueryDto): Promise<StatusDistributionDto> {
    return this.reportsService.getStatusDistribution(query);
  }
}
