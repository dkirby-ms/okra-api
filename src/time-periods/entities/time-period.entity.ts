import { Entity, Column, Index, Check } from 'typeorm';
import { TenantAwareEntity } from '../../common/entities/tenant-aware.entity.js';
import { TimePeriodStatus } from '../../common/enums/index.js';

/**
 * TimePeriod entity represents a planning cycle (e.g., Q1 2026).
 * Objectives can be associated with time periods for organization.
 */
@Entity('time_period')
@Check('"end_date" > "start_date"')
@Index(['tenantId', 'name'], { unique: true, where: '"deletedAt" IS NULL' })
export class TimePeriod extends TenantAwareEntity {
  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'date', name: 'start_date' })
  startDate!: Date;

  @Column({ type: 'date', name: 'end_date' })
  endDate!: Date;

  @Column({
    type: 'enum',
    enum: TimePeriodStatus,
    default: TimePeriodStatus.ACTIVE,
  })
  status!: TimePeriodStatus;
}
