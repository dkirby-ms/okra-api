import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Objective } from '../objectives/entities/objective.entity.js';
import { KeyResult } from '../key-results/entities/key-result.entity.js';
import { ProgressSummaryDto } from './dto/progress-summary.dto.js';
import { StatusDistributionDto, StatusBucketDto } from './dto/status-distribution.dto.js';
import { ReportQueryDto } from './dto/report-query.dto.js';
import { ObjectiveStatus } from '../common/enums/index.js';
import { getCurrentTenantId } from '../common/interceptors/tenant.interceptor.js';
import { parseLocalDate, formatDateString } from '../common/utils/date.util.js';

/**
 * Service for generating OKR progress reports and analytics.
 */
@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Objective)
    private readonly objectiveRepository: Repository<Objective>,
    @InjectRepository(KeyResult)
    private readonly keyResultRepository: Repository<KeyResult>,
  ) {}

  /**
   * Get aggregated progress summary for objectives in scope.
   */
  async getProgressSummary(query: ReportQueryDto): Promise<ProgressSummaryDto> {
    const tenantId = getCurrentTenantId();

    // Get objectives matching filters
    const objectives = await this.getFilteredObjectives(tenantId, query);
    const objectiveIds = objectives.map((o) => o.id);

    // Get key results for these objectives
    const keyResults =
      objectiveIds.length > 0
        ? await this.keyResultRepository
            .createQueryBuilder('kr')
            .where('kr.tenantId = :tenantId', { tenantId })
            .andWhere('kr.objectiveId IN (:...objectiveIds)', { objectiveIds })
            .andWhere('kr.deletedAt IS NULL')
            .getMany()
        : [];

    // Calculate progress for each objective
    const progressByObjective = new Map<string, number>();
    for (const objective of objectives) {
      const objKeyResults = keyResults.filter((kr) => kr.objectiveId === objective.id);
      if (objKeyResults.length === 0) {
        progressByObjective.set(objective.id, 0);
      } else {
        const avgProgress =
          objKeyResults.reduce((sum, kr) => {
            const denom = Number(kr.targetValue) - Number(kr.startValue);
            if (denom === 0) return sum;
            const numer = Number(kr.currentValue) - Number(kr.startValue);
            return sum + (numer / denom) * 100;
          }, 0) / objKeyResults.length;
        progressByObjective.set(objective.id, avgProgress);
      }
    }

    // Calculate completed objectives and key results
    const completedObjectives = Array.from(progressByObjective.values()).filter(
      (p) => p >= 100,
    ).length;

    const completedKeyResults = keyResults.filter((kr) => {
      const denom = Number(kr.targetValue) - Number(kr.startValue);
      if (denom === 0) return false;
      const numer = Number(kr.currentValue) - Number(kr.startValue);
      return (numer / denom) * 100 >= 100;
    }).length;

    // Calculate average progress
    const totalProgress = Array.from(progressByObjective.values()).reduce((a, b) => a + b, 0);
    const averageProgress =
      objectives.length > 0 ? Math.round((totalProgress / objectives.length) * 100) / 100 : 0;

    return {
      totalObjectives: objectives.length,
      averageProgress,
      completedObjectives,
      totalKeyResults: keyResults.length,
      completedKeyResults,
      timePeriodId: query.timePeriodId ?? null,
      ownerType: query.ownerType ?? null,
      ownerId: query.ownerId ?? null,
    };
  }

  /**
   * Get distribution of objectives by computed status.
   */
  async getStatusDistribution(query: ReportQueryDto): Promise<StatusDistributionDto> {
    const tenantId = getCurrentTenantId();

    // Get objectives matching filters
    const objectives = await this.getFilteredObjectives(tenantId, query);
    const objectiveIds = objectives.map((o) => o.id);

    // Get key results for these objectives
    const keyResults =
      objectiveIds.length > 0
        ? await this.keyResultRepository
            .createQueryBuilder('kr')
            .where('kr.tenantId = :tenantId', { tenantId })
            .andWhere('kr.objectiveId IN (:...objectiveIds)', { objectiveIds })
            .andWhere('kr.deletedAt IS NULL')
            .getMany()
        : [];

    // Calculate status for each objective
    const statusCounts: Record<ObjectiveStatus, number> = {
      [ObjectiveStatus.ON_TRACK]: 0,
      [ObjectiveStatus.AT_RISK]: 0,
      [ObjectiveStatus.BEHIND]: 0,
      [ObjectiveStatus.COMPLETE]: 0,
    };

    for (const objective of objectives) {
      const objKeyResults = keyResults.filter((kr) => kr.objectiveId === objective.id);
      let progress = 0;
      if (objKeyResults.length > 0) {
        progress =
          objKeyResults.reduce((sum, kr) => {
            const denom = Number(kr.targetValue) - Number(kr.startValue);
            if (denom === 0) return sum;
            const numer = Number(kr.currentValue) - Number(kr.startValue);
            return sum + (numer / denom) * 100;
          }, 0) / objKeyResults.length;
      }

      const status = this.calculateStatus(objective, progress);
      statusCounts[status]++;
    }

    // Build distribution array
    const distribution: StatusBucketDto[] = Object.entries(statusCounts).map(([status, count]) => ({
      status: status as ObjectiveStatus,
      count,
      percentage: objectives.length > 0 ? Math.round((count / objectives.length) * 10000) / 100 : 0,
    }));

    return {
      totalObjectives: objectives.length,
      distribution,
      timePeriodId: query.timePeriodId ?? null,
      ownerType: query.ownerType ?? null,
      ownerId: query.ownerId ?? null,
    };
  }

  /**
   * Get filtered objectives based on query parameters.
   */
  private async getFilteredObjectives(
    tenantId: string,
    query: ReportQueryDto,
  ): Promise<Objective[]> {
    const qb = this.objectiveRepository
      .createQueryBuilder('objective')
      .where('objective.tenantId = :tenantId', { tenantId })
      .andWhere('objective.deletedAt IS NULL');

    if (query.timePeriodId) {
      qb.andWhere('objective.timePeriodId = :timePeriodId', {
        timePeriodId: query.timePeriodId,
      });
    }
    if (query.ownerType) {
      qb.andWhere('objective.ownerType = :ownerType', { ownerType: query.ownerType });
    }
    if (query.ownerId) {
      qb.andWhere('objective.ownerId = :ownerId', { ownerId: query.ownerId });
    }

    return qb.getMany();
  }

  /**
   * Calculate status based on time elapsed vs expected progress.
   */
  private calculateStatus(objective: Objective, progress: number): ObjectiveStatus {
    if (progress >= 100) {
      return ObjectiveStatus.COMPLETE;
    }

    const now = new Date();
    const start = parseLocalDate(formatDateString(objective.startDate));
    const end = parseLocalDate(formatDateString(objective.endDate));

    if (now < start) {
      return ObjectiveStatus.ON_TRACK;
    }

    if (now > end) {
      return ObjectiveStatus.BEHIND;
    }

    const totalDuration = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    const expectedProgress = (elapsed / totalDuration) * 100;

    const difference = progress - expectedProgress;

    if (difference >= 0) {
      return ObjectiveStatus.ON_TRACK;
    } else if (difference >= -10) {
      return ObjectiveStatus.AT_RISK;
    } else {
      return ObjectiveStatus.BEHIND;
    }
  }
}
