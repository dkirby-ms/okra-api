import { Entity, Column, ManyToOne, JoinColumn, Check, Index } from 'typeorm';
import { TenantAwareEntity } from '../../common/entities/tenant-aware.entity.js';
import { Objective } from '../../objectives/entities/objective.entity.js';
import { MetricType } from '../../common/enums/index.js';

/**
 * KeyResult entity for tracking measurable outcomes (FR-008, FR-009, FR-010).
 * Belongs to an Objective and tracks progress via typed metrics.
 */
@Entity('key_results')
@Check('"start_value" <> "target_value"') // Target must differ from start
@Index(['tenantId', 'objectiveId'])
export class KeyResult extends TenantAwareEntity {
  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'objective_id', type: 'uuid' })
  objectiveId!: string;

  @ManyToOne(() => Objective, (objective) => objective.keyResults, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'objective_id' })
  objective!: Objective;

  @Column({
    name: 'metric_type',
    type: 'varchar',
    length: 20,
    default: MetricType.NUMBER,
  })
  metricType!: MetricType;

  @Column({
    name: 'start_value',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  startValue!: number;

  @Column({
    name: 'current_value',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  currentValue!: number;

  @Column({
    name: 'target_value',
    type: 'decimal',
    precision: 15,
    scale: 2,
  })
  targetValue!: number;

  @Column({ name: 'unit', type: 'varchar', length: 50, nullable: true })
  unit!: string | null;
}
