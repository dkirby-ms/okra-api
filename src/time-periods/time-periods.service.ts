import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimePeriod } from './entities/time-period.entity.js';
import { CreateTimePeriodDto } from './dto/create-time-period.dto.js';
import { UpdateTimePeriodDto } from './dto/update-time-period.dto.js';
import { TimePeriodResponseDto } from './dto/time-period-response.dto.js';
import { TimePeriodQueryDto } from './dto/time-period-query.dto.js';
import { TimePeriodStatus } from '../common/enums/index.js';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto.js';
import { encodeCursor, decodeCursor } from '../common/utils/pagination.util.js';
import { getCurrentTenantId } from '../common/interceptors/tenant.interceptor.js';

/**
 * Service for managing Time Periods.
 */
@Injectable()
export class TimePeriodsService {
  private readonly logger = new Logger(TimePeriodsService.name);

  constructor(
    @InjectRepository(TimePeriod)
    private readonly timePeriodRepository: Repository<TimePeriod>,
  ) {}

  /**
   * Create a new time period.
   */
  async create(dto: CreateTimePeriodDto): Promise<TimePeriodResponseDto> {
    const tenantId = getCurrentTenantId();

    // Validate dates
    if (new Date(dto.startDate) >= new Date(dto.endDate)) {
      throw new BadRequestException('startDate must be before endDate');
    }

    // Check for duplicate name
    const existing = await this.timePeriodRepository.findOne({
      where: { name: dto.name, tenantId },
    });
    if (existing) {
      throw new ConflictException({
        code: 'DUPLICATE_NAME',
        message: `Time period with name "${dto.name}" already exists`,
      });
    }

    const timePeriod = this.timePeriodRepository.create({
      ...dto,
      tenantId,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
    });

    const saved = await this.timePeriodRepository.save(timePeriod);
    this.logger.log(`Created time period ${saved.id} for tenant ${tenantId}`);
    return this.toResponseDto(saved);
  }

  /**
   * Find all time periods with filtering and pagination.
   */
  async findAll(query: TimePeriodQueryDto): Promise<PaginatedResponseDto<TimePeriodResponseDto>> {
    const tenantId = getCurrentTenantId();
    const limit = query.limit ?? 20;

    const qb = this.timePeriodRepository
      .createQueryBuilder('timePeriod')
      .where('timePeriod.tenantId = :tenantId', { tenantId })
      .andWhere('timePeriod.deletedAt IS NULL');

    // Apply status filter
    if (query.status) {
      qb.andWhere('timePeriod.status = :status', { status: query.status });
    }

    // Cursor pagination
    if (query.cursor) {
      const decoded = decodeCursor(query.cursor);
      if (decoded) {
        qb.andWhere(
          '(timePeriod.createdAt < :cursorDate OR (timePeriod.createdAt = :cursorDate AND timePeriod.id < :cursorId))',
          { cursorDate: decoded.createdAt, cursorId: decoded.id },
        );
      }
    }

    qb.orderBy('timePeriod.createdAt', 'DESC').addOrderBy('timePeriod.id', 'DESC');
    qb.take(limit + 1);

    const timePeriods = await qb.getMany();
    const hasMore = timePeriods.length > limit;
    if (hasMore) {
      timePeriods.pop();
    }

    const dtos = timePeriods.map((tp) => this.toResponseDto(tp));
    const lastItem = timePeriods[timePeriods.length - 1];
    const cursor = lastItem ? encodeCursor(lastItem.createdAt, lastItem.id) : null;

    return PaginatedResponseDto.create(dtos, hasMore ? cursor : null, hasMore);
  }

  /**
   * Find a single time period by ID.
   */
  async findOne(id: string): Promise<TimePeriodResponseDto> {
    const tenantId = getCurrentTenantId();

    const timePeriod = await this.timePeriodRepository.findOne({
      where: { id, tenantId },
    });

    if (!timePeriod) {
      throw new NotFoundException(`Time period with ID ${id} not found`);
    }

    return this.toResponseDto(timePeriod);
  }

  /**
   * Update an existing time period.
   */
  async update(id: string, dto: UpdateTimePeriodDto): Promise<TimePeriodResponseDto> {
    const tenantId = getCurrentTenantId();

    const timePeriod = await this.timePeriodRepository.findOne({
      where: { id, tenantId },
    });

    if (!timePeriod) {
      throw new NotFoundException(`Time period with ID ${id} not found`);
    }

    // Optimistic locking
    if (timePeriod.version !== dto.version) {
      throw new ConflictException({
        code: 'CONFLICT',
        message: 'Resource was modified by another request',
        details: {
          expectedVersion: dto.version,
          currentVersion: timePeriod.version,
        },
      });
    }

    // Validate dates
    const newStartDate = dto.startDate ? new Date(dto.startDate) : timePeriod.startDate;
    const newEndDate = dto.endDate ? new Date(dto.endDate) : timePeriod.endDate;
    if (newStartDate >= newEndDate) {
      throw new BadRequestException('startDate must be before endDate');
    }

    // Check for duplicate name if changing
    if (dto.name && dto.name !== timePeriod.name) {
      const existing = await this.timePeriodRepository.findOne({
        where: { name: dto.name, tenantId },
      });
      if (existing) {
        throw new ConflictException({
          code: 'DUPLICATE_NAME',
          message: `Time period with name "${dto.name}" already exists`,
        });
      }
    }

    // Apply updates
    Object.assign(timePeriod, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.startDate !== undefined && { startDate: new Date(dto.startDate) }),
      ...(dto.endDate !== undefined && { endDate: new Date(dto.endDate) }),
      ...(dto.status !== undefined && { status: dto.status }),
    });

    const saved = await this.timePeriodRepository.save(timePeriod);
    this.logger.log(`Updated time period ${id} for tenant ${tenantId}`);
    return this.toResponseDto(saved);
  }

  /**
   * Delete a time period.
   */
  async remove(id: string): Promise<void> {
    const tenantId = getCurrentTenantId();

    const timePeriod = await this.timePeriodRepository.findOne({
      where: { id, tenantId },
    });

    if (!timePeriod) {
      throw new NotFoundException(`Time period with ID ${id} not found`);
    }

    await this.timePeriodRepository.softDelete(id);
    this.logger.log(`Deleted time period ${id} for tenant ${tenantId}`);
  }

  /**
   * Archive a time period (changes status to ARCHIVED).
   */
  async archive(id: string): Promise<TimePeriodResponseDto> {
    const tenantId = getCurrentTenantId();

    const timePeriod = await this.timePeriodRepository.findOne({
      where: { id, tenantId },
    });

    if (!timePeriod) {
      throw new NotFoundException(`Time period with ID ${id} not found`);
    }

    timePeriod.status = TimePeriodStatus.ARCHIVED;
    const saved = await this.timePeriodRepository.save(timePeriod);
    this.logger.log(`Archived time period ${id} for tenant ${tenantId}`);
    return this.toResponseDto(saved);
  }

  /**
   * Convert entity to response DTO.
   */
  private toResponseDto(timePeriod: TimePeriod): TimePeriodResponseDto {
    return {
      id: timePeriod.id,
      name: timePeriod.name,
      startDate: timePeriod.startDate.toISOString().split('T')[0],
      endDate: timePeriod.endDate.toISOString().split('T')[0],
      status: timePeriod.status,
      createdAt: timePeriod.createdAt.toISOString(),
      updatedAt: timePeriod.updatedAt.toISOString(),
      version: timePeriod.version,
    };
  }
}
