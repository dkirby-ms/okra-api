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
  ParseBoolPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { ObjectivesService } from './objectives.service.js';
import {
  CreateObjectiveDto,
  UpdateObjectiveDto,
  ObjectiveResponseDto,
  ObjectiveQueryDto,
} from './dto/index.js';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto.js';
import { ErrorResponseDto } from '../common/dto/error-response.dto.js';

/**
 * Controller for Objectives CRUD operations.
 * All endpoints are tenant-scoped via TenantInterceptor.
 */
@ApiTags('objectives')
@Controller('objectives')
export class ObjectivesController {
  constructor(private readonly objectivesService: ObjectivesService) {}

  /**
   * Create a new objective.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new objective',
    description: 'Creates a new objective for the current tenant',
  })
  @ApiBody({ type: CreateObjectiveDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Objective created successfully',
    type: ObjectiveResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or invalid data',
    type: ErrorResponseDto,
  })
  async create(@Body() dto: CreateObjectiveDto): Promise<ObjectiveResponseDto> {
    return this.objectivesService.create(dto);
  }

  /**
   * List all objectives with optional filters and pagination.
   */
  @Get()
  @ApiOperation({
    summary: 'List objectives',
    description: 'Returns paginated list of objectives with optional filtering',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of objectives',
  })
  async findAll(
    @Query() query: ObjectiveQueryDto,
  ): Promise<PaginatedResponseDto<ObjectiveResponseDto>> {
    return this.objectivesService.findAll(query);
  }

  /**
   * Get a single objective by ID.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get objective by ID',
    description: 'Returns a single objective with computed progress and status',
  })
  @ApiParam({
    name: 'id',
    description: 'Objective UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Objective found',
    type: ObjectiveResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Objective not found',
    type: ErrorResponseDto,
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ObjectiveResponseDto> {
    return this.objectivesService.findOne(id);
  }

  /**
   * Update an existing objective.
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update objective',
    description: 'Updates an existing objective. Requires version for optimistic locking.',
  })
  @ApiParam({
    name: 'id',
    description: 'Objective UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiBody({ type: UpdateObjectiveDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Objective updated successfully',
    type: ObjectiveResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Objective not found',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Version conflict - resource was modified',
    type: ErrorResponseDto,
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateObjectiveDto,
  ): Promise<ObjectiveResponseDto> {
    return this.objectivesService.update(id, dto);
  }

  /**
   * Delete an objective (soft delete).
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete objective',
    description: 'Soft deletes an objective. Use force=true to delete with children.',
  })
  @ApiParam({
    name: 'id',
    description: 'Objective UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiQuery({
    name: 'force',
    description: 'Force delete including child objectives',
    required: false,
    type: 'boolean',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Objective deleted successfully',
  })
  @ApiNotFoundResponse({
    description: 'Objective not found',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Objective has children and force=false',
    type: ErrorResponseDto,
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('force', new DefaultValuePipe(false), ParseBoolPipe) force: boolean,
  ): Promise<void> {
    return this.objectivesService.remove(id, force);
  }
}
