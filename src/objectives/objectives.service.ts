import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Objective } from './entities/objective.entity.js';
import { KeyResult } from '../key-results/entities/key-result.entity.js';
import { CreateObjectiveDto } from './dto/create-objective.dto.js';
import { UpdateObjectiveDto } from './dto/update-objective.dto.js';
import { ObjectiveResponseDto } from './dto/objective-response.dto.js';
import { ObjectiveQueryDto } from './dto/objective-query.dto.js';
import { ObjectiveStatus } from '../common/enums/index.js';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto.js';
import { encodeCursor, decodeCursor } from '../common/utils/pagination.util.js';
import { getCurrentTenantId } from '../common/interceptors/tenant.interceptor.js';

/**
 * Service for managing Objectives (CRUD, progress/status calculation, pagination).
 */
@Injectable()
export class ObjectivesService {
  private readonly logger = new Logger(ObjectivesService.name);

  constructor(
    @InjectRepository(Objective)
    private readonly objectiveRepository: Repository<Objective>,
    @InjectRepository(KeyResult)
    private readonly keyResultRepository: Repository<KeyResult>,
  ) {}

  /**
   * Create a new objective.
   */
  async create(dto: CreateObjectiveDto): Promise<ObjectiveResponseDto> {
    const tenantId = getCurrentTenantId();

    // Validate dates
    if (new Date(dto.startDate) >= new Date(dto.endDate)) {
      throw new BadRequestException('startDate must be before endDate');
    }

    // Validate parent exists and belongs to same tenant if provided
    if (dto.parentId) {
      const parent = await this.objectiveRepository.findOne({
        where: { id: dto.parentId, tenantId },
      });
      if (!parent) {
        throw new BadRequestException('Parent objective not found');
      }
    }

    const objective = this.objectiveRepository.create({
      ...dto,
      tenantId,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
    });

    const saved = await this.objectiveRepository.save(objective);
    this.logger.log(`Created objective ${saved.id} for tenant ${tenantId}`);
    return this.toResponseDto(saved);
  }

  /**
   * Find all objectives with filtering and pagination.
   */
  async findAll(query: ObjectiveQueryDto): Promise<PaginatedResponseDto<ObjectiveResponseDto>> {
    const tenantId = getCurrentTenantId();
    const limit = query.limit ?? 20;

    const qb = this.objectiveRepository
      .createQueryBuilder('objective')
      .where('objective.tenantId = :tenantId', { tenantId })
      .andWhere('objective.deletedAt IS NULL');

    // Apply filters
    if (query.timePeriodId) {
      qb.andWhere('objective.timePeriodId = :timePeriodId', { timePeriodId: query.timePeriodId });
    }
    if (query.ownerType) {
      qb.andWhere('objective.ownerType = :ownerType', { ownerType: query.ownerType });
    }
    if (query.ownerId) {
      qb.andWhere('objective.ownerId = :ownerId', { ownerId: query.ownerId });
    }

    // Cursor pagination (createdAt, id)
    if (query.cursor) {
      const decoded = decodeCursor(query.cursor);
      if (decoded) {
        qb.andWhere(
          '(objective.createdAt < :cursorDate OR (objective.createdAt = :cursorDate AND objective.id < :cursorId))',
          { cursorDate: decoded.createdAt, cursorId: decoded.id },
        );
      }
    }

    // Order by createdAt desc, then id desc for stable pagination
    qb.orderBy('objective.createdAt', 'DESC').addOrderBy('objective.id', 'DESC');

    // Fetch limit + 1 to determine hasMore
    qb.take(limit + 1);

    const objectives = await qb.getMany();
    const hasMore = objectives.length > limit;
    if (hasMore) {
      objectives.pop();
    }

    // Filter by computed status if requested (must be done in-memory)
    let filteredObjectives = objectives;
    if (query.status) {
      const withProgress = await Promise.all(
        objectives.map(async (obj) => ({
          objective: obj,
          progress: await this.calculateProgress(obj.id),
        })),
      );
      filteredObjectives = withProgress
        .filter(({ objective, progress }) => {
          const status = this.calculateStatus(objective, progress);
          return status === query.status;
        })
        .map(({ objective }) => objective);
    }

    const dtos = await Promise.all(filteredObjectives.map((obj) => this.toResponseDto(obj)));
    const lastItem = objectives[objectives.length - 1];
    const cursor = lastItem ? encodeCursor(lastItem.createdAt, lastItem.id) : null;

    return PaginatedResponseDto.create(dtos, hasMore ? cursor : null, hasMore);
  }

  /**
   * Find a single objective by ID.
   */
  async findOne(id: string): Promise<ObjectiveResponseDto> {
    const tenantId = getCurrentTenantId();

    const objective = await this.objectiveRepository.findOne({
      where: { id, tenantId },
    });

    if (!objective) {
      throw new NotFoundException(`Objective with ID ${id} not found`);
    }

    return this.toResponseDto(objective);
  }

  /**
   * Update an objective (optimistic locking via version).
   */
  async update(id: string, dto: UpdateObjectiveDto): Promise<ObjectiveResponseDto> {
    const tenantId = getCurrentTenantId();

    const objective = await this.objectiveRepository.findOne({
      where: { id, tenantId },
    });

    if (!objective) {
      throw new NotFoundException(`Objective with ID ${id} not found`);
    }

    // Optimistic locking check
    if (objective.version !== dto.version) {
      throw new ConflictException({
        code: 'CONFLICT',
        message: 'Resource was modified by another request',
        details: {
          expectedVersion: dto.version,
          currentVersion: objective.version,
        },
      });
    }

    // Validate dates if both provided or mixed with existing
    const newStartDate = dto.startDate ? new Date(dto.startDate) : objective.startDate;
    const newEndDate = dto.endDate ? new Date(dto.endDate) : objective.endDate;
    if (newStartDate >= newEndDate) {
      throw new BadRequestException('startDate must be before endDate');
    }

    // Validate parent if changing
    if (dto.parentId !== undefined) {
      if (dto.parentId === id) {
        throw new BadRequestException('An objective cannot be its own parent');
      }
      if (dto.parentId !== null) {
        const parent = await this.objectiveRepository.findOne({
          where: { id: dto.parentId, tenantId },
        });
        if (!parent) {
          throw new BadRequestException('Parent objective not found');
        }
        // Check for circular reference
        if (await this.wouldCreateCycle(id, dto.parentId, tenantId)) {
          throw new BadRequestException('Circular parent reference detected');
        }
      }
    }

    // Apply updates
    Object.assign(objective, {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.parentId !== undefined && { parentId: dto.parentId }),
      ...(dto.startDate !== undefined && { startDate: new Date(dto.startDate) }),
      ...(dto.endDate !== undefined && { endDate: new Date(dto.endDate) }),
    });

    const saved = await this.objectiveRepository.save(objective);
    this.logger.log(`Updated objective ${id} for tenant ${tenantId}`);
    return this.toResponseDto(saved);
  }

  /**
   * Soft delete an objective.
   * With force=true, also deletes children and key results (FR-005/FR-012 cascade delete).
   */
  async remove(id: string, force: boolean = false): Promise<void> {
    const tenantId = getCurrentTenantId();

    const objective = await this.objectiveRepository.findOne({
      where: { id, tenantId },
    });

    if (!objective) {
      throw new NotFoundException(`Objective with ID ${id} not found`);
    }

    // Check for children
    const childCount = await this.objectiveRepository.count({
      where: { parentId: id, tenantId },
    });

    // Check for key results
    const keyResultCount = await this.keyResultRepository.count({
      where: { objectiveId: id, tenantId },
    });

    if ((childCount > 0 || keyResultCount > 0) && !force) {
      throw new ConflictException({
        code: 'HAS_DEPENDENCIES',
        message: 'Objective has child objectives or key results. Use force=true to delete all.',
        details: { childCount, keyResultCount },
      });
    }

    if (force) {
      // Delete key results first
      if (keyResultCount > 0) {
        await this.keyResultRepository.softDelete({ objectiveId: id });
      }
      // Then recursively delete children
      if (childCount > 0) {
        await this.deleteChildrenRecursively(id, tenantId);
      }
    }

    await this.objectiveRepository.softDelete(id);
    this.logger.log(`Deleted objective ${id} for tenant ${tenantId}${force ? ' (force)' : ''}`);
  }

  /**
   * Calculate progress as average of key results completion percentages (0-100+).
   * Returns 0 when no key results exist.
   */
  async calculateProgress(objectiveId: string): Promise<number> {
    const tenantId = getCurrentTenantId();

    const keyResults = await this.keyResultRepository.find({
      where: { objectiveId, tenantId },
    });

    if (keyResults.length === 0) {
      return 0;
    }

    // Calculate average completion percentage
    const totalCompletion = keyResults.reduce((sum, kr) => {
      const denominator = Number(kr.targetValue) - Number(kr.startValue);
      if (denominator === 0) return sum;
      const numerator = Number(kr.currentValue) - Number(kr.startValue);
      return sum + (numerator / denominator) * 100;
    }, 0);

    return Math.round((totalCompletion / keyResults.length) * 100) / 100;
  }

  /**
   * Calculate status based on time elapsed vs expected progress.
   * Per specification:
   * - complete: progress >= 100%
   * - on-track: progress >= expected (time elapsed %)
   * - at-risk: progress within 10% of expected
   * - behind: progress < expected - 10%
   */
  calculateStatus(objective: Objective, progress: number): ObjectiveStatus {
    // If progress is 100% or more, it's complete
    if (progress >= 100) {
      return ObjectiveStatus.COMPLETE;
    }

    const now = new Date();
    const start = new Date(objective.startDate);
    const end = new Date(objective.endDate);

    // If not started yet, on-track
    if (now < start) {
      return ObjectiveStatus.ON_TRACK;
    }

    // If past end date and not complete, behind
    if (now > end) {
      return ObjectiveStatus.BEHIND;
    }

    // Calculate expected progress based on time elapsed
    const totalDuration = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    const expectedProgress = (elapsed / totalDuration) * 100;

    // Compare actual vs expected
    const difference = progress - expectedProgress;

    if (difference >= 0) {
      return ObjectiveStatus.ON_TRACK;
    } else if (difference >= -10) {
      return ObjectiveStatus.AT_RISK;
    } else {
      return ObjectiveStatus.BEHIND;
    }
  }

  /**
   * Convert entity to response DTO with computed fields.
   */
  private async toResponseDto(objective: Objective): Promise<ObjectiveResponseDto> {
    const progress = await this.calculateProgress(objective.id);
    const status = this.calculateStatus(objective, progress);

    return {
      id: objective.id,
      title: objective.title,
      description: objective.description,
      ownerType: objective.ownerType,
      ownerId: objective.ownerId,
      parentId: objective.parentId,
      timePeriodId: objective.timePeriodId,
      startDate: objective.startDate.toISOString().split('T')[0],
      endDate: objective.endDate.toISOString().split('T')[0],
      progress,
      status,
      createdAt: objective.createdAt.toISOString(),
      updatedAt: objective.updatedAt.toISOString(),
      version: objective.version,
    };
  }

  /**
   * Check if setting parentId would create a cycle.
   */
  private async wouldCreateCycle(
    objectiveId: string,
    newParentId: string,
    tenantId: string,
  ): Promise<boolean> {
    let currentId: string | null = newParentId;
    const visited = new Set<string>();

    while (currentId) {
      if (currentId === objectiveId) {
        return true;
      }
      if (visited.has(currentId)) {
        break; // Already visited, no cycle through our objective
      }
      visited.add(currentId);

      const parent = await this.objectiveRepository.findOne({
        where: { id: currentId, tenantId },
        select: ['parentId'],
      });
      currentId = parent?.parentId ?? null;
    }

    return false;
  }

  /**
   * Recursively soft delete all children of an objective (and their key results).
   */
  private async deleteChildrenRecursively(parentId: string, tenantId: string): Promise<void> {
    const children = await this.objectiveRepository.find({
      where: { parentId, tenantId },
      select: ['id'],
    });

    for (const child of children) {
      // Delete child's key results first
      await this.keyResultRepository.softDelete({ objectiveId: child.id });
      // Recurse to grandchildren
      await this.deleteChildrenRecursively(child.id, tenantId);
      // Delete the child objective
      await this.objectiveRepository.softDelete(child.id);
    }
  }
}
