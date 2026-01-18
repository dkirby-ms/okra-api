import { Entity, Column, Index, Check, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { TenantAwareEntity } from '../../common/entities/tenant-aware.entity.js';
import { OwnerType } from '../../common/enums/index.js';
import { TimePeriod } from '../../time-periods/entities/time-period.entity.js';
import type { KeyResult } from '../../key-results/entities/key-result.entity.js';

/**
 * Objective entity represents a high-level goal in the OKR framework.
 * Supports hierarchical alignment via self-referencing parent_id.
 */
@Entity('objective')
@Check('"end_date" > "start_date"')
@Index(['tenantId', 'startDate', 'endDate'])
@Index(['tenantId', 'ownerType', 'ownerId'])
@Index(['parentId'], { where: '"parent_id" IS NOT NULL' })
export class Objective extends TenantAwareEntity {
  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({
    type: 'enum',
    enum: OwnerType,
    name: 'owner_type',
  })
  ownerType!: OwnerType;

  @Column({ type: 'uuid', name: 'owner_id' })
  @Index()
  ownerId!: string;

  @Column({ type: 'uuid', name: 'parent_id', nullable: true })
  parentId!: string | null;

  @ManyToOne(() => Objective, (objective) => objective.children, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent!: Objective | null;

  @OneToMany(() => Objective, (objective) => objective.parent)
  children!: Objective[];

  @Column({ type: 'uuid', name: 'time_period_id', nullable: true })
  timePeriodId!: string | null;

  @ManyToOne(() => TimePeriod, { nullable: true })
  @JoinColumn({ name: 'time_period_id' })
  timePeriod!: TimePeriod | null;

  @Column({ type: 'date', name: 'start_date' })
  startDate!: Date;

  @Column({ type: 'date', name: 'end_date' })
  endDate!: Date;

  @OneToMany('KeyResult', 'objective')
  keyResults!: KeyResult[];
}
