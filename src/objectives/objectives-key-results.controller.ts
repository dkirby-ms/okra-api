import { Controller, Get, Param, ParseUUIDPipe, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiNotFoundResponse } from '@nestjs/swagger';
import { KeyResultsService } from '../key-results/key-results.service.js';
import { KeyResultResponseDto } from '../key-results/dto/key-result-response.dto.js';
import { ErrorResponseDto } from '../common/dto/error-response.dto.js';

/**
 * Controller for nested key results routes under objectives.
 */
@ApiTags('key-results')
@Controller('objectives/:objectiveId/key-results')
export class ObjectivesKeyResultsController {
  constructor(private readonly keyResultsService: KeyResultsService) {}

  /**
   * List key results for a specific objective.
   */
  @Get()
  @ApiOperation({
    summary: 'List key results for an objective',
    description: 'Returns all key results belonging to the specified objective',
  })
  @ApiParam({
    name: 'objectiveId',
    description: 'Objective UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of key results',
    type: [KeyResultResponseDto],
  })
  @ApiNotFoundResponse({
    description: 'Objective not found',
    type: ErrorResponseDto,
  })
  async findByObjective(
    @Param('objectiveId', ParseUUIDPipe) objectiveId: string,
  ): Promise<{ data: KeyResultResponseDto[] }> {
    const keyResults = await this.keyResultsService.findByObjectiveId(objectiveId);
    const dtos = keyResults.map((kr) => this.toResponseDto(kr));
    return { data: dtos };
  }

  /**
   * Convert entity to response DTO.
   */
  private toResponseDto(keyResult: {
    id: string;
    title: string;
    description: string | null;
    objectiveId: string;
    metricType: string;
    startValue: number;
    currentValue: number;
    targetValue: number;
    unit: string | null;
    createdAt: Date;
    updatedAt: Date;
    version: number;
  }): KeyResultResponseDto {
    const start = Number(keyResult.startValue);
    const current = Number(keyResult.currentValue);
    const target = Number(keyResult.targetValue);
    const denominator = target - start;
    const completionPercentage =
      denominator !== 0 ? Math.round(((current - start) / denominator) * 10000) / 100 : 0;

    return {
      id: keyResult.id,
      title: keyResult.title,
      description: keyResult.description,
      objectiveId: keyResult.objectiveId,
      metricType: keyResult.metricType as KeyResultResponseDto['metricType'],
      startValue: start,
      currentValue: current,
      targetValue: target,
      unit: keyResult.unit,
      completionPercentage,
      isComplete: completionPercentage >= 100,
      createdAt: keyResult.createdAt.toISOString(),
      updatedAt: keyResult.updatedAt.toISOString(),
      version: keyResult.version,
    };
  }
}
