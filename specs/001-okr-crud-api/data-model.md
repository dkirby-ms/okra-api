# Data Model: OKR Management API

**Feature**: 001-okr-crud-api  
**Date**: 2026-01-18  
**Database**: PostgreSQL 15+

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              ORGANIZATION                                │
│  (external - not managed by this service, referenced via tenant_id)     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 1:N (tenant isolation)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              TIME_PERIOD                                 │
├─────────────────────────────────────────────────────────────────────────┤
│ id: UUID [PK]                                                           │
│ tenant_id: UUID [FK, NOT NULL, INDEX]                                   │
│ name: VARCHAR(100) [NOT NULL]                                           │
│ start_date: DATE [NOT NULL]                                             │
│ end_date: DATE [NOT NULL]                                               │
│ status: ENUM('active', 'archived') [DEFAULT: 'active']                  │
│ created_at: TIMESTAMPTZ [NOT NULL]                                      │
│ updated_at: TIMESTAMPTZ [NOT NULL]                                      │
│ deleted_at: TIMESTAMPTZ [NULL] (soft delete)                            │
│ version: INTEGER [NOT NULL, DEFAULT: 1]                                 │
├─────────────────────────────────────────────────────────────────────────┤
│ CONSTRAINTS:                                                            │
│   - CHECK(end_date > start_date)                                        │
│   - UNIQUE(tenant_id, name) WHERE deleted_at IS NULL                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 1:N
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                               OBJECTIVE                                  │
├─────────────────────────────────────────────────────────────────────────┤
│ id: UUID [PK]                                                           │
│ tenant_id: UUID [FK, NOT NULL, INDEX]                                   │
│ title: VARCHAR(255) [NOT NULL]                                          │
│ description: TEXT [NULL]                                                │
│ owner_type: ENUM('user', 'team', 'organization') [NOT NULL]             │
│ owner_id: UUID [NOT NULL, INDEX]                                        │
│ parent_id: UUID [FK → OBJECTIVE.id, NULL] (hierarchical alignment)      │
│ time_period_id: UUID [FK → TIME_PERIOD.id, NULL]                        │
│ start_date: DATE [NOT NULL]                                             │
│ end_date: DATE [NOT NULL]                                               │
│ created_at: TIMESTAMPTZ [NOT NULL]                                      │
│ updated_at: TIMESTAMPTZ [NOT NULL]                                      │
│ deleted_at: TIMESTAMPTZ [NULL] (soft delete)                            │
│ version: INTEGER [NOT NULL, DEFAULT: 1]                                 │
├─────────────────────────────────────────────────────────────────────────┤
│ CONSTRAINTS:                                                            │
│   - CHECK(end_date > start_date)                                        │
│ INDEXES:                                                                │
│   - (tenant_id, start_date, end_date) for time-period queries           │
│   - (tenant_id, owner_type, owner_id) for ownership queries             │
│   - (parent_id) for hierarchy traversal                                 │
└─────────────────────────────────────────────────────────────────────────┘
                │                              │
                │ 1:N                          │ self-reference (0:N)
                ▼                              │
┌─────────────────────────────────────────────┐│
│              KEY_RESULT                      ││
├─────────────────────────────────────────────┤│
│ id: UUID [PK]                               ││
│ tenant_id: UUID [FK, NOT NULL, INDEX]       ││
│ objective_id: UUID [FK, NOT NULL, INDEX]    ││
│ title: VARCHAR(255) [NOT NULL]              ││
│ metric_type: ENUM('number', 'percentage',   ││
│              'currency', 'boolean') [NOT NULL]│
│ target_value: DECIMAL(15,2) [NOT NULL]      ││
│ current_value: DECIMAL(15,2) [DEFAULT: 0]   ││
│ unit_label: VARCHAR(50) [NULL]              ││
│   (e.g., "USD", "users", "deals")           ││
│ created_at: TIMESTAMPTZ [NOT NULL]          ││
│ updated_at: TIMESTAMPTZ [NOT NULL]          ││
│ deleted_at: TIMESTAMPTZ [NULL] (soft delete)││
│ version: INTEGER [NOT NULL, DEFAULT: 1]     ││
├─────────────────────────────────────────────┤│
│ CONSTRAINTS:                                ││
│   - CHECK(target_value > 0)                 ││
│   - CHECK for metric_type validation:       ││
│     - percentage: target_value <= 100       ││
│     - boolean: target_value IN (0, 1)       ││
│ ON DELETE (objective): RESTRICT default,    ││
│   CASCADE only with force flag              ││
└─────────────────────────────────────────────┘│
                                               │
                          ┌────────────────────┘
                          ▼
              (child objectives via parent_id)
```

## Entity Definitions

### 1. TimePeriod

Represents a planning cycle (e.g., Q1 2026).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Unique identifier |
| tenantId | UUID | NOT NULL, indexed | Organization isolation |
| name | VARCHAR(100) | NOT NULL | Display name (e.g., "Q1 2026") |
| startDate | DATE | NOT NULL | Period start (inclusive) |
| endDate | DATE | NOT NULL | Period end (inclusive) |
| status | ENUM | DEFAULT 'active' | 'active' or 'archived' |
| createdAt | TIMESTAMPTZ | NOT NULL | Creation timestamp |
| updatedAt | TIMESTAMPTZ | NOT NULL | Last update timestamp |
| deletedAt | TIMESTAMPTZ | NULL | Soft delete timestamp |
| version | INTEGER | DEFAULT 1 | Optimistic lock version |

### 2. Objective

Represents a high-level goal.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Unique identifier |
| tenantId | UUID | NOT NULL, indexed | Organization isolation |
| title | VARCHAR(255) | NOT NULL | Objective title |
| description | TEXT | NULL | Optional detailed description |
| ownerType | ENUM | NOT NULL | 'user', 'team', or 'organization' |
| ownerId | UUID | NOT NULL, indexed | Reference to owner entity |
| parentId | UUID | FK → Objective, NULL | Parent for hierarchical alignment |
| timePeriodId | UUID | FK → TimePeriod, NULL | Associated planning period |
| startDate | DATE | NOT NULL | Objective start date |
| endDate | DATE | NOT NULL | Objective end date |
| createdAt | TIMESTAMPTZ | NOT NULL | Creation timestamp |
| updatedAt | TIMESTAMPTZ | NOT NULL | Last update timestamp |
| deletedAt | TIMESTAMPTZ | NULL | Soft delete timestamp |
| version | INTEGER | DEFAULT 1 | Optimistic lock version |

**Computed Properties** (not stored):
- `progress`: Average of key results' completion percentages (0-100)
- `status`: Calculated on-demand ('on-track', 'at-risk', 'behind', 'complete')

### 3. KeyResult

Represents a measurable outcome under an objective.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Unique identifier |
| tenantId | UUID | NOT NULL, indexed | Organization isolation |
| objectiveId | UUID | FK → Objective, NOT NULL | Parent objective |
| title | VARCHAR(255) | NOT NULL | Key result title |
| metricType | ENUM | NOT NULL | 'number', 'percentage', 'currency', 'boolean' |
| targetValue | DECIMAL(15,2) | NOT NULL, > 0 | Target to achieve |
| currentValue | DECIMAL(15,2) | DEFAULT 0 | Current progress |
| unitLabel | VARCHAR(50) | NULL | Unit display label |
| createdAt | TIMESTAMPTZ | NOT NULL | Creation timestamp |
| updatedAt | TIMESTAMPTZ | NOT NULL | Last update timestamp |
| deletedAt | TIMESTAMPTZ | NULL | Soft delete timestamp |
| version | INTEGER | DEFAULT 1 | Optimistic lock version |

**Computed Properties** (not stored):
- `completionPercentage`: (currentValue / targetValue) × 100, capped at 100 for display
- `isComplete`: true if currentValue >= targetValue

## Validation Rules

### TimePeriod
- `endDate` MUST be after `startDate`
- `name` MUST be unique per tenant (among non-deleted records)

### Objective
- `endDate` MUST be after `startDate`
- `parentId` MUST reference an objective in the same tenant
- `parentId` MUST NOT create circular references

### KeyResult
- `targetValue` MUST be > 0
- If `metricType` = 'percentage': `targetValue` MUST be ≤ 100
- If `metricType` = 'boolean': `targetValue` MUST be 0 or 1
- If `metricType` = 'currency': `targetValue` uses 2 decimal places

## State Transitions

### TimePeriod Status
```
active ──(archive)──> archived
archived ──(reactivate)──> active
```

### Objective Lifecycle
```
created ──(update)──> updated
updated ──(delete, no KRs)──> soft-deleted
updated ──(force-delete)──> soft-deleted + cascade KRs
```

## Indexes

```sql
-- Tenant isolation (all tables)
CREATE INDEX idx_time_period_tenant ON time_period(tenant_id);
CREATE INDEX idx_objective_tenant ON objective(tenant_id);
CREATE INDEX idx_key_result_tenant ON key_result(tenant_id);

-- Time period queries
CREATE INDEX idx_objective_dates ON objective(tenant_id, start_date, end_date);

-- Ownership queries
CREATE INDEX idx_objective_owner ON objective(tenant_id, owner_type, owner_id);

-- Hierarchy traversal
CREATE INDEX idx_objective_parent ON objective(parent_id) WHERE parent_id IS NOT NULL;

-- Key result lookup by objective
CREATE INDEX idx_key_result_objective ON key_result(objective_id);

-- Soft delete filtering
CREATE INDEX idx_objective_active ON objective(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_key_result_active ON key_result(objective_id) WHERE deleted_at IS NULL;
```

## TypeORM Entity Mapping

```typescript
// Enum definitions
export enum OwnerType {
  USER = 'user',
  TEAM = 'team',
  ORGANIZATION = 'organization',
}

export enum MetricType {
  NUMBER = 'number',
  PERCENTAGE = 'percentage',
  CURRENCY = 'currency',
  BOOLEAN = 'boolean',
}

export enum TimePeriodStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

// Base entity with common fields
@Entity()
export abstract class TenantAwareEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  tenantId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date | null;

  @VersionColumn()
  version: number;
}
```
