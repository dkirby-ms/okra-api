# Research: OKR Management API

**Feature**: 001-okr-crud-api  
**Date**: 2026-01-18  
**Status**: Complete

## Research Tasks

### 1. NestJS + TypeORM Best Practices

**Decision**: Use NestJS modular architecture with TypeORM repository pattern

**Rationale**:
- NestJS provides built-in dependency injection, decorators for validation/OpenAPI, and modular structure
- TypeORM integrates seamlessly via `@nestjs/typeorm` with repository injection
- `autoLoadEntities: true` simplifies entity registration
- Custom repositories extend `Repository<T>` for complex queries

**Alternatives Considered**:
- Prisma: Rejected due to less mature NestJS integration and different migration paradigm
- MikroORM: Rejected due to smaller community and documentation

**Key Patterns**:
```typescript
// Entity registration per module
@Module({
  imports: [TypeOrmModule.forFeature([Objective, KeyResult])],
  providers: [ObjectivesService],
  controllers: [ObjectivesController],
})
export class ObjectivesModule {}

// Repository injection
@Injectable()
export class ObjectivesService {
  constructor(
    @InjectRepository(Objective)
    private readonly objectiveRepository: Repository<Objective>,
  ) {}
}
```

---

### 2. Cursor-Based Pagination with TypeORM

**Decision**: Implement cursor-based pagination using encoded `id` or `createdAt` as cursor

**Rationale**:
- Cursor pagination is more performant than offset for large datasets
- Prevents issues with data shifting between pages
- Aligns with constitution requirement (II. UX Consistency - Pagination)

**Alternatives Considered**:
- Offset-based: Rejected due to performance degradation at scale and duplicate/skip issues
- Keyset with composite keys: Overkill for this use case

**Implementation Pattern**:
```typescript
// Cursor is base64-encoded ID or timestamp
interface PaginatedResult<T> {
  data: T[];
  cursor: string | null;
  hasMore: boolean;
}

async findWithCursor(limit: number, cursor?: string): Promise<PaginatedResult<Objective>> {
  const query = this.repository
    .createQueryBuilder('obj')
    .orderBy('obj.createdAt', 'DESC')
    .take(limit + 1); // Fetch one extra to detect hasMore

  if (cursor) {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    query.where('obj.createdAt < :cursor', { cursor: decoded });
  }

  const results = await query.getMany();
  const hasMore = results.length > limit;
  const data = hasMore ? results.slice(0, -1) : results;
  const nextCursor = hasMore 
    ? Buffer.from(data[data.length - 1].createdAt.toISOString()).toString('base64')
    : null;

  return { data, cursor: nextCursor, hasMore };
}
```

---

### 3. Optimistic Locking with TypeORM

**Decision**: Use `@VersionColumn()` decorator for optimistic locking

**Rationale**:
- Native TypeORM support via `@VersionColumn()`
- Automatically increments version on save
- Throws `OptimisticLockVersionMismatchError` on conflict
- Per FR-020: Required for concurrent update handling

**Implementation Pattern**:
```typescript
@Entity()
export class KeyResult {
  @VersionColumn()
  version: number;
}

// In service - version passed from client
async update(id: string, dto: UpdateKeyResultDto, version: number): Promise<KeyResult> {
  const existing = await this.repository.findOneBy({ id });
  if (existing.version !== version) {
    throw new ConflictException('Resource was modified. Please refresh and retry.');
  }
  return this.repository.save({ ...existing, ...dto });
}
```

---

### 4. Hierarchical Data (Parent Objectives)

**Decision**: Self-referencing foreign key with nullable `parentId`

**Rationale**:
- Simple to implement with TypeORM `@ManyToOne` / `@OneToMany`
- Supports individual → team → org hierarchy via parent references
- Queries can traverse hierarchy with recursive CTEs if needed

**Alternatives Considered**:
- Nested sets: Overkill and complex for simple parent-child
- Materialized path: More complex for updates

**Implementation Pattern**:
```typescript
@Entity()
export class Objective {
  @ManyToOne(() => Objective, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: Objective | null;

  @OneToMany(() => Objective, (obj) => obj.parent)
  children: Objective[];
}
```

---

### 5. Typed Metrics Validation

**Decision**: Use discriminated union pattern with class-validator

**Rationale**:
- Metric type determines validation rules
- class-validator supports conditional validation via `ValidateIf`
- Strongly typed DTOs prevent invalid combinations

**Implementation Pattern**:
```typescript
enum MetricType {
  NUMBER = 'number',
  PERCENTAGE = 'percentage',
  CURRENCY = 'currency',
  BOOLEAN = 'boolean',
}

@Entity()
export class KeyResult {
  @Column({ type: 'enum', enum: MetricType })
  metricType: MetricType;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  targetValue: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  currentValue: number;
}

// DTO validation
export class CreateKeyResultDto {
  @IsEnum(MetricType)
  metricType: MetricType;

  @ValidateIf((o) => o.metricType === MetricType.PERCENTAGE)
  @Min(0)
  @Max(100)
  targetValue: number;

  @ValidateIf((o) => o.metricType === MetricType.BOOLEAN)
  @IsIn([0, 1])
  targetValue: number;
}
```

---

### 6. On-Demand Status Calculation

**Decision**: Compute status in service layer at query time; never persist

**Rationale**:
- Per FR-014: Status must be computed on-demand
- Avoids data inconsistency from stale cached status
- Simple implementation with computed property pattern

**Implementation Pattern**:
```typescript
// In service or entity method
calculateStatus(objective: Objective): ObjectiveStatus {
  const now = new Date();
  const start = objective.startDate;
  const end = objective.endDate;
  
  const totalDuration = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  const expectedProgress = Math.min(100, (elapsed / totalDuration) * 100);
  
  const actualProgress = this.calculateProgress(objective.keyResults);
  
  if (actualProgress >= 100) return ObjectiveStatus.COMPLETE;
  if (actualProgress >= expectedProgress) return ObjectiveStatus.ON_TRACK;
  if (actualProgress >= expectedProgress * 0.7) return ObjectiveStatus.AT_RISK;
  return ObjectiveStatus.BEHIND;
}
```

---

### 7. Error Response Format

**Decision**: Global exception filter with standardized error DTO

**Rationale**:
- Constitution requires `{ error: { code, message, details? } }` format
- NestJS exception filters intercept all errors
- Consistent format across all endpoints

**Implementation Pattern**:
```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';
    let details: Record<string, unknown> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      // Extract structured info from NestJS exceptions
    }

    response.status(status).json({
      error: { code, message, details },
    });
  }
}
```

---

### 8. Multi-Tenancy Isolation

**Decision**: Tenant ID column on all entities with global query filter

**Rationale**:
- Row-level isolation via `tenantId` column
- TypeORM subscribers or query scope can auto-filter
- Derived from JWT claim at request time

**Implementation Pattern**:
```typescript
// Base entity
export abstract class TenantAwareEntity {
  @Column()
  @Index()
  tenantId: string;
}

// Interceptor sets tenant context
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.user?.tenantId;
    // Store in AsyncLocalStorage for repository access
    return next.handle();
  }
}
```

---

## Summary

All technical unknowns from the Technical Context have been resolved:

| Question | Resolution |
|----------|------------|
| ORM patterns | TypeORM with repository injection |
| Pagination | Cursor-based with base64-encoded timestamps |
| Optimistic locking | `@VersionColumn()` with client version check |
| Hierarchy | Self-referencing FK with nullable parent |
| Metric validation | Discriminated union + conditional validators |
| Status calculation | On-demand in service layer |
| Error format | Global exception filter |
| Multi-tenancy | Tenant column + request-scoped filter |
