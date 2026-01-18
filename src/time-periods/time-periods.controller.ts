import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { TimePeriodsService } from './time-periods.service.js';
import {
  CreateTimePeriodDto,
  UpdateTimePeriodDto,
  TimePeriodResponseDto,
  TimePeriodQueryDto,
} from './dto/index.js';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto.js';
import { ErrorResponseDto } from '../common/dto/error-response.dto.js';

/**
 * Controller for Time Periods CRUD operations.
 */
@ApiTags('time-periods')
@Controller('time-periods')
export class TimePeriodsController {
  constructor(private readonly timePeriodsService: TimePeriodsService) {}

  /**
   * Create a new time period.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new time period',
    description: 'Creates a new time period for the current tenant',
  })
  @ApiBody({ type: CreateTimePeriodDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Time period created successfully',
    type: TimePeriodResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or invalid data',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Time period with same name already exists',
    type: ErrorResponseDto,
  })
  async create(@Body() dto: CreateTimePeriodDto): Promise<TimePeriodResponseDto> {
    return this.timePeriodsService.create(dto);
  }

  /**
   * List all time periods with optional filters and pagination.
   */
  @Get()
  @ApiOperation({
    summary: 'List time periods',
    description: 'Returns paginated list of time periods with optional filtering',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of time periods',
  })
  async findAll(
    @Query() query: TimePeriodQueryDto,
  ): Promise<PaginatedResponseDto<TimePeriodResponseDto>> {
    return this.timePeriodsService.findAll(query);
  }

  /**
   * Get a single time period by ID.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get time period by ID',
    description: 'Returns a single time period',
  })
  @ApiParam({
    name: 'id',
    description: 'Time period UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Time period found',
    type: TimePeriodResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Time period not found',
    type: ErrorResponseDto,
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<TimePeriodResponseDto> {
    return this.timePeriodsService.findOne(id);
  }

  /**
   * Update an existing time period.
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update time period',
    description: 'Updates an existing time period. Requires version for optimistic locking.',
  })
  @ApiParam({
    name: 'id',
    description: 'Time period UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiBody({ type: UpdateTimePeriodDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Time period updated successfully',
    type: TimePeriodResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Time period not found',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Version conflict or duplicate name',
    type: ErrorResponseDto,
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTimePeriodDto,
  ): Promise<TimePeriodResponseDto> {
    return this.timePeriodsService.update(id, dto);
  }

  /**
   * Delete a time period.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete time period',
    description: 'Soft deletes a time period',
  })
  @ApiParam({
    name: 'id',
    description: 'Time period UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Time period deleted successfully',
  })
  @ApiNotFoundResponse({
    description: 'Time period not found',
    type: ErrorResponseDto,
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.timePeriodsService.remove(id);
  }

  /**
   * Archive a time period.
   */
  @Post(':id/archive')
  @ApiOperation({
    summary: 'Archive time period',
    description: 'Archives a time period, making it read-only for historical purposes',
  })
  @ApiParam({
    name: 'id',
    description: 'Time period UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Time period archived successfully',
    type: TimePeriodResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Time period not found',
    type: ErrorResponseDto,
  })
  async archive(@Param('id', ParseUUIDPipe) id: string): Promise<TimePeriodResponseDto> {
    return this.timePeriodsService.archive(id);
  }
}
