import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KeyResult } from './entities/key-result.entity.js';
import { Objective } from '../objectives/entities/objective.entity.js';
import { CreateKeyResultDto } from './dto/create-key-result.dto.js';
import { UpdateKeyResultDto } from './dto/update-key-result.dto.js';
import { KeyResultResponseDto } from './dto/key-result-response.dto.js';
import { KeyResultQueryDto } from './dto/key-result-query.dto.js';
import { MetricType } from '../common/enums/index.js';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto.js';
import { encodeCursor, decodeCursor } from '../common/utils/pagination.util.js';
import { getCurrentTenantId } from '../common/interceptors/tenant.interceptor.js';

/**
 * Service for managing Key Results (CRUD, completion calculation).
 */
@Injectable()
export class KeyResultsService {
  private readonly logger = new Logger(KeyResultsService.name);

  constructor(
    @InjectRepository(KeyResult)
    private readonly keyResultRepository: Repository<KeyResult>,
    @InjectRepository(Objective)
    private readonly objectiveRepository: Repository<Objective>,
  ) {}

  /**
   * Create a new key result.
   */
  async create(dto: CreateKeyResultDto): Promise<KeyResultResponseDto> {
    const tenantId = getCurrentTenantId();

    // Validate objective exists and belongs to tenant
    const objective = await this.objectiveRepository.findOne({
      where: { id: dto.objectiveId, tenantId },
    });
    if (!objective) {
      throw new BadRequestException('Objective not found');
    }

    // Validate startValue != targetValue
    const startValue = dto.startValue ?? 0;
    if (startValue === dto.targetValue) {
      throw new BadRequestException('targetValue must differ from startValue');
    }

    // For boolean metrics, validate values are 0 or 1
    if (dto.metricType === MetricType.BOOLEAN) {
      if (![0, 1].includes(startValue) || ![0, 1].includes(dto.targetValue)) {
        throw new BadRequestException(
          'Boolean metrics must have startValue and targetValue of 0 or 1',
        );
      }
    }

    const currentValue = dto.currentValue ?? startValue;

    const keyResult = this.keyResultRepository.create({
      ...dto,
      tenantId,
      startValue,
      currentValue,
    });

    const saved = await this.keyResultRepository.save(keyResult);
    this.logger.log(`Created key result ${saved.id} for objective ${dto.objectiveId}`);
    return this.toResponseDto(saved);
  }

  /**
   * Find all key results with filtering and pagination.
   */
  async findAll(query: KeyResultQueryDto): Promise<PaginatedResponseDto<KeyResultResponseDto>> {
    const tenantId = getCurrentTenantId();
    const limit = query.limit ?? 20;

    const qb = this.keyResultRepository
      .createQueryBuilder('keyResult')
      .where('keyResult.tenantId = :tenantId', { tenantId })
      .andWhere('keyResult.deletedAt IS NULL');

    // Apply filters
    if (query.objectiveId) {
      qb.andWhere('keyResult.objectiveId = :objectiveId', { objectiveId: query.objectiveId });
    }

    // Cursor pagination
    if (query.cursor) {
      const decoded = decodeCursor(query.cursor);
      if (decoded) {
        qb.andWhere(
          '(keyResult.createdAt < :cursorDate OR (keyResult.createdAt = :cursorDate AND keyResult.id < :cursorId))',
          { cursorDate: decoded.createdAt, cursorId: decoded.id },
        );
      }
    }

    qb.orderBy('keyResult.createdAt', 'DESC').addOrderBy('keyResult.id', 'DESC');
    qb.take(limit + 1);

    const keyResults = await qb.getMany();
    const hasMore = keyResults.length > limit;
    if (hasMore) {
      keyResults.pop();
    }

    // Filter by completion status in memory if requested
    let filteredResults = keyResults;
    if (query.isComplete !== undefined) {
      filteredResults = keyResults.filter((kr) => {
        const completionPct = this.calculateCompletionPercentage(kr);
        const isComplete = completionPct >= 100;
        return isComplete === query.isComplete;
      });
    }

    const dtos = filteredResults.map((kr) => this.toResponseDto(kr));
    const lastItem = keyResults[keyResults.length - 1];
    const cursor = lastItem ? encodeCursor(lastItem.createdAt, lastItem.id) : null;

    return PaginatedResponseDto.create(dtos, hasMore ? cursor : null, hasMore);
  }

  /**
   * Find key results by objective ID (for progress calculation).
   */
  async findByObjectiveId(objectiveId: string): Promise<KeyResult[]> {
    const tenantId = getCurrentTenantId();
    return this.keyResultRepository.find({
      where: { objectiveId, tenantId },
    });
  }

  /**
   * Find a single key result by ID.
   */
  async findOne(id: string): Promise<KeyResultResponseDto> {
    const tenantId = getCurrentTenantId();

    const keyResult = await this.keyResultRepository.findOne({
      where: { id, tenantId },
    });

    if (!keyResult) {
      throw new NotFoundException(`Key result with ID ${id} not found`);
    }

    return this.toResponseDto(keyResult);
  }

  /**
   * Update an existing key result.
   */
  async update(id: string, dto: UpdateKeyResultDto): Promise<KeyResultResponseDto> {
    const tenantId = getCurrentTenantId();

    const keyResult = await this.keyResultRepository.findOne({
      where: { id, tenantId },
    });

    if (!keyResult) {
      throw new NotFoundException(`Key result with ID ${id} not found`);
    }

    // Optimistic locking check
    if (keyResult.version !== dto.version) {
      throw new ConflictException({
        code: 'CONFLICT',
        message: 'Resource was modified by another request',
        details: {
          expectedVersion: dto.version,
          currentVersion: keyResult.version,
        },
      });
    }

    // Validate targetValue != startValue if changing target
    if (dto.targetValue !== undefined && dto.targetValue === keyResult.startValue) {
      throw new BadRequestException('targetValue must differ from startValue');
    }

    // Apply updates
    Object.assign(keyResult, {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.currentValue !== undefined && { currentValue: dto.currentValue }),
      ...(dto.targetValue !== undefined && { targetValue: dto.targetValue }),
      ...(dto.unit !== undefined && { unit: dto.unit }),
    });

    const saved = await this.keyResultRepository.save(keyResult);
    this.logger.log(`Updated key result ${id}`);
    return this.toResponseDto(saved);
  }

  /**
   * Update only the current value of a key result (progress update).
   * @param id Key result ID
   * @param currentValue New current value
   * @param version Current version for optimistic locking
   */
  async updateProgress(
    id: string,
    currentValue: number,
    version: number,
  ): Promise<KeyResultResponseDto> {
    const tenantId = getCurrentTenantId();

    const keyResult = await this.keyResultRepository.findOne({
      where: { id, tenantId },
    });

    if (!keyResult) {
      throw new NotFoundException(`Key result with ID ${id} not found`);
    }

    // Optimistic locking check
    if (keyResult.version !== version) {
      throw new ConflictException({
        code: 'CONFLICT',
        message: 'Resource was modified by another request',
        details: {
          expectedVersion: version,
          currentVersion: keyResult.version,
        },
      });
    }

    keyResult.currentValue = currentValue;
    const saved = await this.keyResultRepository.save(keyResult);
    this.logger.log(`Updated progress for key result ${id}: ${currentValue}`);
    return this.toResponseDto(saved);
  }

  /**
   * Delete a key result (soft delete).
   */
  async remove(id: string): Promise<void> {
    const tenantId = getCurrentTenantId();

    const keyResult = await this.keyResultRepository.findOne({
      where: { id, tenantId },
    });

    if (!keyResult) {
      throw new NotFoundException(`Key result with ID ${id} not found`);
    }

    await this.keyResultRepository.softDelete(id);
    this.logger.log(`Deleted key result ${id}`);
  }

  /**
   * Calculate completion percentage for a key result.
   * Formula: ((currentValue - startValue) / (targetValue - startValue)) * 100
   */
  calculateCompletionPercentage(keyResult: KeyResult): number {
    const { startValue, currentValue, targetValue } = keyResult;

    // Handle edge case where start equals target (shouldn't happen due to validation)
    const denominator = targetValue - startValue;
    if (denominator === 0) {
      return 0;
    }

    const numerator = currentValue - startValue;
    const percentage = (numerator / denominator) * 100;

    // Round to 2 decimal places
    return Math.round(percentage * 100) / 100;
  }

  /**
   * Convert entity to response DTO with computed fields.
   */
  private toResponseDto(keyResult: KeyResult): KeyResultResponseDto {
    const completionPercentage = this.calculateCompletionPercentage(keyResult);

    return {
      id: keyResult.id,
      title: keyResult.title,
      description: keyResult.description,
      objectiveId: keyResult.objectiveId,
      metricType: keyResult.metricType,
      startValue: Number(keyResult.startValue),
      currentValue: Number(keyResult.currentValue),
      targetValue: Number(keyResult.targetValue),
      unit: keyResult.unit,
      completionPercentage,
      isComplete: completionPercentage >= 100,
      createdAt: keyResult.createdAt.toISOString(),
      updatedAt: keyResult.updatedAt.toISOString(),
      version: keyResult.version,
    };
  }
}
