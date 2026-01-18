# Tasks: OKR Management API

**Input**: Design documents from `/specs/001-okr-crud-api/`  
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/openapi.yaml ✓

**Tests**: Not explicitly requested in spec. Tests omitted per template guidelines.

**Organization**: Tasks grouped by user story (P1 → P4) for independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Exact file paths included in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and NestJS scaffold

- [x] T001 Initialize NestJS project with TypeScript strict mode in `package.json` and `tsconfig.json`
- [x] T002 [P] Install dependencies: @nestjs/typeorm, typeorm, pg, class-validator, class-transformer, @nestjs/swagger in `package.json`
- [x] T003 [P] Configure ESLint and Prettier with zero-warning rules in `.eslintrc.js` and `.prettierrc`
- [x] T004 [P] Create environment configuration in `src/config/env.validation.ts` with Joi schema
- [x] T005 [P] Create docker-compose.yml for PostgreSQL local development

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure required before ANY user story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Configure TypeORM module with PostgreSQL connection in `src/config/database.config.ts`
- [x] T007 Create enum definitions in `src/common/enums/index.ts`: OwnerType, MetricType, TimePeriodStatus, ObjectiveStatus
- [x] T008 [P] Create TenantAwareEntity base class with common fields in `src/common/entities/tenant-aware.entity.ts`
- [x] T009 [P] Create ErrorResponseDto with `{ error: { code, message, details? } }` format in `src/common/dto/error-response.dto.ts`
- [x] T010 [P] Create PaginatedResponseDto with cursor/hasMore in `src/common/dto/paginated-response.dto.ts`
- [x] T011 [P] Implement cursor encoding/decoding utilities in `src/common/utils/pagination.util.ts`
- [x] T012 Implement GlobalExceptionFilter with standardized error format in `src/common/filters/global-exception.filter.ts`
- [x] T013 [P] Implement LoggingInterceptor with correlation IDs in `src/common/interceptors/logging.interceptor.ts`
- [x] T014 [P] Create TenantInterceptor for tenant context extraction in `src/common/interceptors/tenant.interceptor.ts`
- [x] T015 Register global filters, interceptors, and validation pipe in `src/main.ts`
- [x] T016 Configure Swagger/OpenAPI module in `src/main.ts`
- [x] T017 Create AppModule with TypeORM async configuration in `src/app.module.ts`

**Checkpoint**: Foundation ready — user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Create and Manage Objectives (Priority: P1) 🎯 MVP

**Goal**: Enable users to create, retrieve, update, list, and delete objectives with hierarchical alignment

**Independent Test**: Create objective → Retrieve by ID → Update title → List with pagination → Delete (no KRs)

### Implementation for User Story 1

- [x] T018 [P] [US1] Create TimePeriod entity in `src/time-periods/entities/time-period.entity.ts`
- [x] T019 [P] [US1] Create Objective entity with self-referencing parent FK in `src/objectives/entities/objective.entity.ts`
- [x] T020 [US1] Create CreateObjectiveDto with class-validator decorators in `src/objectives/dto/create-objective.dto.ts`
- [x] T021 [P] [US1] Create UpdateObjectiveDto with version field for optimistic locking in `src/objectives/dto/update-objective.dto.ts`
- [x] T022 [P] [US1] Create ObjectiveResponseDto with computed progress/status in `src/objectives/dto/objective-response.dto.ts`
- [x] T023 [US1] Create ObjectiveQueryDto for filtering (timePeriodId, ownerType, ownerId, status) in `src/objectives/dto/objective-query.dto.ts`
- [x] T024 [US1] Implement ObjectivesService with CRUD operations in `src/objectives/objectives.service.ts`
- [x] T025 [US1] Add calculateProgress method to ObjectivesService in `src/objectives/objectives.service.ts`
- [x] T026 [US1] Add calculateStatus method (on-track/at-risk/behind/complete) to ObjectivesService in `src/objectives/objectives.service.ts`
- [x] T027 [US1] Add cursor-based pagination to ObjectivesService.findAll() in `src/objectives/objectives.service.ts`
- [x] T028 [US1] Implement ObjectivesController with REST endpoints in `src/objectives/objectives.controller.ts`
- [x] T029 [US1] Add @ApiTags, @ApiOperation, @ApiResponse decorators to ObjectivesController in `src/objectives/objectives.controller.ts`
- [x] T030 [US1] Create ObjectivesModule and register in AppModule in `src/objectives/objectives.module.ts`
- [x] T031 [US1] Generate database migration for TimePeriod and Objective tables

**Checkpoint**: User Story 1 complete — objectives can be created, retrieved, updated, listed, and deleted

---

## Phase 4: User Story 2 - Define and Track Key Results (Priority: P2)

**Goal**: Enable users to create key results with typed metrics, track progress, and see completion percentages

**Independent Test**: Create KR under objective → Set initial value → Update current value → Verify completion % → Delete KR

### Implementation for User Story 2

- [x] T032 [P] [US2] Create KeyResult entity with metricType enum and decimal columns in `src/key-results/entities/key-result.entity.ts`
- [x] T033 [US2] Create CreateKeyResultDto with conditional validation per metric type in `src/key-results/dto/create-key-result.dto.ts`
- [x] T034 [P] [US2] Create UpdateKeyResultDto with version field in `src/key-results/dto/update-key-result.dto.ts`
- [x] T035 [P] [US2] Create UpdateKeyResultProgressDto for progress-only updates in `src/key-results/dto/update-key-result-progress.dto.ts`
- [x] T036 [P] [US2] Create KeyResultResponseDto with computed completionPercentage and isComplete in `src/key-results/dto/key-result-response.dto.ts`
- [x] T037 [US2] Implement KeyResultsService with CRUD operations in `src/key-results/key-results.service.ts`
- [x] T038 [US2] Add calculateCompletionPercentage method (capped at 100 for display) in `src/key-results/key-results.service.ts`
- [x] T039 [US2] Add metric-type validation logic in KeyResultsService.create() in `src/key-results/key-results.service.ts`
- [x] T040 [US2] Implement KeyResultsController with nested route (/objectives/:id/key-results) in `src/key-results/key-results.controller.ts`
- [x] T041 [US2] Add direct routes (/key-results/:id, /key-results/:id/progress) to KeyResultsController in `src/key-results/key-results.controller.ts`
- [x] T042 [US2] Add @ApiTags, @ApiOperation, @ApiResponse decorators to KeyResultsController in `src/key-results/key-results.controller.ts`
- [x] T043 [US2] Create KeyResultsModule and register in AppModule in `src/key-results/key-results.module.ts`
- [x] T044 [US2] Update Objective entity with @OneToMany relation to KeyResult in `src/objectives/entities/objective.entity.ts`
- [x] T045 [US2] Add hasKeyResults check to ObjectivesService.delete() (FR-004/FR-012) in `src/objectives/objectives.service.ts`
- [x] T046 [US2] Implement force-delete cascade logic with `force=true` param in `src/objectives/objectives.service.ts`
- [x] T047 [US2] Generate database migration for KeyResult table and Objective relation

**Checkpoint**: User Story 2 complete — key results with typed metrics can be managed under objectives

---

## Phase 5: User Story 3 - View OKR Progress Reports (Priority: P3)

**Goal**: Enable managers to see aggregated progress summaries and status distributions

**Independent Test**: Create objectives with varied KR progress → Request progress summary → Verify aggregations → Request status distribution

### Implementation for User Story 3

- [x] T048 [P] [US3] Create ProgressSummaryDto in `src/reports/dto/progress-summary.dto.ts`
- [x] T049 [P] [US3] Create StatusDistributionDto in `src/reports/dto/status-distribution.dto.ts`
- [x] T050 [P] [US3] Create ReportQueryDto for filtering (timePeriodId, ownerType, ownerId) in `src/reports/dto/report-query.dto.ts`
- [x] T051 [US3] Implement ReportsService with getProgressSummary method in `src/reports/reports.service.ts`
- [x] T052 [US3] Add getStatusDistribution method to ReportsService in `src/reports/reports.service.ts`
- [x] T053 [US3] Add aggregation queries using QueryBuilder in `src/reports/reports.service.ts`
- [x] T054 [US3] Implement ReportsController with GET /reports/progress-summary endpoint in `src/reports/reports.controller.ts`
- [x] T055 [US3] Add GET /reports/status-distribution endpoint to ReportsController in `src/reports/reports.controller.ts`
- [x] T056 [US3] Add @ApiTags, @ApiOperation, @ApiResponse decorators to ReportsController in `src/reports/reports.controller.ts`
- [x] T057 [US3] Create ReportsModule and register in AppModule in `src/reports/reports.module.ts`

**Checkpoint**: User Story 3 complete — progress summaries and status distributions available

---

## Phase 6: User Story 4 - Organize OKRs by Time Period (Priority: P4)

**Goal**: Enable users to create and manage time periods, filter objectives by period, and archive completed periods

**Independent Test**: Create time period → Create objectives in period → Filter by period → Archive period → Verify read-only

### Implementation for User Story 4

- [x] T058 [P] [US4] Create CreateTimePeriodDto with date validation in `src/time-periods/dto/create-time-period.dto.ts`
- [x] T059 [P] [US4] Create UpdateTimePeriodDto with version field in `src/time-periods/dto/update-time-period.dto.ts`
- [x] T060 [P] [US4] Create TimePeriodResponseDto in `src/time-periods/dto/time-period-response.dto.ts`
- [x] T061 [P] [US4] Create TimePeriodQueryDto for status filter in `src/time-periods/dto/time-period-query.dto.ts`
- [x] T062 [US4] Implement TimePeriodsService with CRUD operations in `src/time-periods/time-periods.service.ts`
- [x] T063 [US4] Add archive() method to TimePeriodsService in `src/time-periods/time-periods.service.ts`
- [x] T064 [US4] Implement TimePeriodsController with REST endpoints in `src/time-periods/time-periods.controller.ts`
- [x] T065 [US4] Add POST /time-periods/:id/archive endpoint to TimePeriodsController in `src/time-periods/time-periods.controller.ts`
- [x] T066 [US4] Add @ApiTags, @ApiOperation, @ApiResponse decorators to TimePeriodsController in `src/time-periods/time-periods.controller.ts`
- [x] T067 [US4] Create TimePeriodsModule and register in AppModule in `src/time-periods/time-periods.module.ts`
- [x] T068 [US4] Add timePeriod relation eager-loading option to ObjectivesService in `src/objectives/objectives.service.ts`
- [x] T069 [US4] Generate database migration for TimePeriod unique constraint (tenant_id, name)

**Checkpoint**: User Story 4 complete — time periods can be managed with archival support

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, validation, and production readiness

- [x] T070 [P] Update README.md with setup and API documentation at repository root
- [x] T071 [P] Add JSDoc comments to all public service methods
- [x] T072 [P] Create sample .env.example with all required variables
- [x] T073 Validate all OpenAPI annotations match contracts/openapi.yaml
- [x] T074 [P] Add health check endpoint GET /health in `src/app.controller.ts`
- [x] T075 Run ESLint and fix any warnings
- [x] T076 Run quickstart.md validation (start server, hit endpoints)
- [x] T077 [P] Add pagination limit validation (1-100) to PaginatedQueryDto in `src/common/dto/paginated-query.dto.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS all user stories**
- **User Stories (Phases 3-6)**: All depend on Foundational completion
  - Can proceed sequentially (P1 → P2 → P3 → P4) or in parallel if staffed
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

| Story | Depends On | Notes |
|-------|------------|-------|
| US1 (Objectives) | Foundational only | TimePeriod entity created here but full CRUD in US4 |
| US2 (Key Results) | US1 | KeyResults reference Objectives; adds delete protection |
| US3 (Reports) | US1, US2 | Aggregates data from Objectives and KeyResults |
| US4 (Time Periods) | US1 | Extends TimePeriod with full management endpoints |

### Within Each User Story

1. Entities before DTOs
2. DTOs before Services
3. Services before Controllers
4. Controllers before Module registration
5. Migration generation after all entities defined

### Parallel Opportunities per Phase

**Phase 1 (Setup)**:
```
T002 ─┬─ (dependencies install)
T003 ─┼─ (linting config)
T004 ─┼─ (env config)
T005 ─┘ (docker-compose)
```

**Phase 2 (Foundational)**:
```
T008 ─┬─ (base entity)
T009 ─┼─ (error DTO)
T010 ─┼─ (pagination DTO)
T011 ─┼─ (pagination utils)
T013 ─┼─ (logging interceptor)
T014 ─┘ (tenant interceptor)
```

**Phase 3 (US1 - Objectives)**:
```
T018 ─┬─ (TimePeriod entity)
T019 ─┘ (Objective entity)
       │
       ▼
T020 ─┬─ (CreateDto)
T021 ─┼─ (UpdateDto)
T022 ─┘ (ResponseDto)
```

---

## Parallel Example: User Story 2

```bash
# Launch all DTOs for User Story 2 in parallel:
T034: UpdateKeyResultDto
T035: UpdateKeyResultProgressDto
T036: KeyResultResponseDto

# Then service implementation (sequential):
T037 → T038 → T039

# Then controller (sequential):
T040 → T041 → T042
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (**CRITICAL - blocks all stories**)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Create, update, list, delete objectives
5. Deploy/demo if ready — users can capture objectives

### Incremental Delivery

| Increment | Stories | Capability Added |
|-----------|---------|------------------|
| MVP | US1 | Objective management |
| v0.2 | +US2 | Key results with typed metrics |
| v0.3 | +US3 | Progress reports and status distribution |
| v1.0 | +US4 | Time period organization and archival |

### Parallel Team Strategy

With 2+ developers after Foundational phase:

- **Developer A**: User Story 1 → User Story 3
- **Developer B**: User Story 2 → User Story 4

Stories can integrate without breaking previous work.

---

## Notes

- All file paths assume `src/` at repository root per plan.md
- [P] tasks have no file conflicts — safe for parallel execution
- Migrations run in a single batch after all entity work complete per story
- Commit after each phase or logical task group
- Stop at any checkpoint to validate story independently
- Each story adds value without breaking previous stories
