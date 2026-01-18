<!--
  SYNC IMPACT REPORT
  ==================
  Version change: 1.0.0 → 1.1.0 (minor: expanded type safety guidance)
  Modified principles:
    - I. Code Quality: Expanded Type Safety into comprehensive strong typing requirements
  Added sections: None
  Removed sections: None
  Templates requiring updates:
    - plan-template.md: ✅ Constitution Check section compatible
    - spec-template.md: ✅ User story structure compatible
    - tasks-template.md: ✅ Phase structure compatible
  Follow-up TODOs: None
-->

# Okra API Constitution

## Core Principles

### I. Code Quality (NON-NEGOTIABLE)

All code MUST meet rigorous quality standards before merging to main:

- **Test Coverage**: Every feature MUST have unit tests; critical paths MUST have integration tests
- **Strong Typing (NON-NEGOTIABLE)**: All code MUST be strongly typed end-to-end:
  - TypeScript MUST use `strict: true` with no `any` types except when interfacing with untyped external libraries (must be isolated and documented)
  - Python MUST use type hints on all function signatures and class attributes; `mypy --strict` MUST pass
  - Database schemas MUST use explicit types; no implicit conversions or `text` fields for structured data
  - API contracts MUST define explicit types for all request/response fields via OpenAPI schemas
  - DTOs and domain models MUST NOT use generic `object` or `dict` types; all fields MUST be explicitly typed
- **Linting**: All code MUST pass configured linters with zero warnings; no suppression without documented justification
- **Code Review**: All changes MUST be peer-reviewed; reviewers MUST verify adherence to this constitution
- **Documentation**: Public APIs MUST have docstrings/JSDoc; complex logic MUST have inline comments explaining "why"

**Rationale**: Technical debt compounds exponentially. Strong typing catches errors at compile time rather than runtime, enables better IDE support and refactoring, and serves as living documentation. Investing in quality upfront prevents costly rewrites and ensures maintainability as the system scales.

### II. UX Consistency

All user-facing interfaces MUST deliver a consistent, predictable experience:

- **API Contracts**: All endpoints MUST follow RESTful conventions with consistent naming (kebab-case paths, camelCase JSON)
- **Error Responses**: All errors MUST use a standardized format: `{ "error": { "code": string, "message": string, "details"?: object } }`
- **Pagination**: All list endpoints MUST support cursor-based pagination with consistent parameters (`limit`, `cursor`)
- **Versioning**: All breaking API changes MUST increment the major version; deprecations MUST provide migration paths
- **Response Times**: All synchronous endpoints MUST respond within 500ms p95; long operations MUST use async patterns

**Rationale**: Consistent APIs reduce integration friction, minimize client-side bugs, and build developer trust. Predictable behavior accelerates adoption.

### III. Microservices Architecture

All services MUST be designed for independent deployment and horizontal scalability:

- **Service Boundaries**: Each service MUST own its data; cross-service data access MUST use APIs, never direct database queries
- **Loose Coupling**: Services MUST communicate via well-defined contracts (OpenAPI specs); shared libraries MUST be versioned
- **Resilience**: All inter-service calls MUST implement timeouts, retries with exponential backoff, and circuit breakers
- **Observability**: All services MUST emit structured logs, metrics, and distributed traces (correlation IDs required)
- **Statelessness**: All services MUST be stateless; session state MUST be externalized to shared stores (Redis, database)

**Rationale**: Microservices enable independent scaling, deployment, and team autonomy. Proper boundaries prevent cascading failures and enable graceful degradation.

## Quality Gates

All pull requests MUST pass these gates before merge:

1. **Build**: Clean compilation with zero warnings
2. **Tests**: All tests pass; coverage MUST NOT decrease for modified files
3. **Lint**: Zero linting errors or warnings
4. **Type Check**: Zero type errors; `strict` mode required; no `any` escape hatches without documented justification
5. **Contract Validation**: API changes MUST update OpenAPI specs; breaking changes MUST be flagged
6. **Security Scan**: No new high/critical vulnerabilities introduced

## Development Workflow

The following workflow MUST be followed for all feature development:

1. **Specification**: Create feature spec using `/speckit.specify` before implementation
2. **Planning**: Generate implementation plan using `/speckit.plan` with constitution compliance check
3. **Task Breakdown**: Create granular tasks using `/speckit.tasks` organized by user story
4. **Implementation**: Follow TDD cycle—write failing tests first, then implement, then refactor
5. **Review**: Peer review MUST verify constitution compliance alongside code correctness
6. **Documentation**: Update relevant docs before marking complete

## Governance

This constitution is the authoritative source for development standards. All practices MUST align with these principles.

**Amendment Process**:
- Proposed changes MUST be documented with rationale and impact analysis
- Changes MUST be reviewed by at least two senior team members
- Breaking changes to principles MUST include migration plans for existing code
- Version MUST be incremented per semantic versioning rules

**Compliance**:
- All PRs MUST include a constitution compliance statement in the description
- Violations MUST be documented and remediated within the current sprint
- Repeated violations trigger process review

**Version**: 1.1.0 | **Ratified**: 2026-01-18 | **Last Amended**: 2026-01-18
