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
import { KeyResultsService } from './key-results.service.js';
import {
  CreateKeyResultDto,
  UpdateKeyResultDto,
  UpdateKeyResultProgressDto,
  KeyResultResponseDto,
  KeyResultQueryDto,
} from './dto/index.js';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto.js';
import { ErrorResponseDto } from '../common/dto/error-response.dto.js';

/**
 * Controller for Key Results CRUD operations.
 */
@ApiTags('key-results')
@Controller('key-results')
export class KeyResultsController {
  constructor(private readonly keyResultsService: KeyResultsService) {}

  /**
   * Create a new key result.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new key result',
    description: 'Creates a new key result for a specific objective',
  })
  @ApiBody({ type: CreateKeyResultDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Key result created successfully',
    type: KeyResultResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or invalid data',
    type: ErrorResponseDto,
  })
  async create(@Body() dto: CreateKeyResultDto): Promise<KeyResultResponseDto> {
    return this.keyResultsService.create(dto);
  }

  /**
   * List all key results with optional filters and pagination.
   */
  @Get()
  @ApiOperation({
    summary: 'List key results',
    description: 'Returns paginated list of key results with optional filtering',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of key results',
  })
  async findAll(
    @Query() query: KeyResultQueryDto,
  ): Promise<PaginatedResponseDto<KeyResultResponseDto>> {
    return this.keyResultsService.findAll(query);
  }

  /**
   * Get a single key result by ID.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get key result by ID',
    description: 'Returns a single key result with computed completion percentage',
  })
  @ApiParam({
    name: 'id',
    description: 'Key result UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Key result found',
    type: KeyResultResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Key result not found',
    type: ErrorResponseDto,
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<KeyResultResponseDto> {
    return this.keyResultsService.findOne(id);
  }

  /**
   * Update an existing key result.
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update key result',
    description: 'Updates an existing key result. Requires version for optimistic locking.',
  })
  @ApiParam({
    name: 'id',
    description: 'Key result UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiBody({ type: UpdateKeyResultDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Key result updated successfully',
    type: KeyResultResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Key result not found',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Version conflict - resource was modified',
    type: ErrorResponseDto,
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateKeyResultDto,
  ): Promise<KeyResultResponseDto> {
    return this.keyResultsService.update(id, dto);
  }

  /**
   * Delete a key result (soft delete).
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete key result',
    description: 'Soft deletes a key result',
  })
  @ApiParam({
    name: 'id',
    description: 'Key result UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Key result deleted successfully',
  })
  @ApiNotFoundResponse({
    description: 'Key result not found',
    type: ErrorResponseDto,
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.keyResultsService.remove(id);
  }

  /**
   * Update key result progress (currentValue only).
   */
  @Patch(':id/progress')
  @ApiOperation({
    summary: 'Update key result progress',
    description: 'Convenience endpoint for updating only the current value',
  })
  @ApiParam({
    name: 'id',
    description: 'Key result UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiBody({ type: UpdateKeyResultProgressDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Progress updated successfully',
    type: KeyResultResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Key result not found',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Version conflict - resource was modified',
    type: ErrorResponseDto,
  })
  async updateProgress(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateKeyResultProgressDto,
  ): Promise<KeyResultResponseDto> {
    return this.keyResultsService.updateProgress(id, dto.currentValue, dto.version);
  }
}
