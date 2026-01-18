# OKR API - Quickstart Guide

A developer's guide to getting the OKR Management API up and running locally.

## Prerequisites

- **Node.js** 20.x LTS or higher
- **PostgreSQL** 15+ (local or Docker)
- **pnpm** (recommended) or npm

## Initial Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd okra-api

# Install dependencies
pnpm install
```

### 2. Environment Configuration

Create `.env` from template:

```bash
cp .env.example .env
```

Required environment variables:

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=okra_dev
DATABASE_USER=postgres
DATABASE_PASSWORD=<your-password>

# Application
PORT=3000
NODE_ENV=development

# JWT (for auth middleware)
JWT_SECRET=<your-secret-key>
JWT_EXPIRES_IN=24h
```

### 3. Database Setup

**Option A: Docker (Recommended)**

```bash
docker compose up -d postgres
```

**Option B: Local PostgreSQL**

```bash
createdb okra_dev
```

### 4. Run Migrations

```bash
# Generate migrations from entities (first time only)
pnpm migration:generate

# Run pending migrations
pnpm migration:run
```

## Development Workflow

### Start Development Server

```bash
pnpm start:dev
```

The API will be available at `http://localhost:3000`.

### Access API Documentation

Swagger UI is available at:

```
http://localhost:3000/api/docs
```

### Run Tests

```bash
# Unit tests
pnpm test

# Unit tests with watch
pnpm test:watch

# Integration tests
pnpm test:e2e

# Test coverage
pnpm test:cov
```

### Linting & Formatting

```bash
# Lint
pnpm lint

# Format
pnpm format
```

## Project Structure

```
src/
├── modules/
│   ├── objectives/           # Objectives feature module
│   │   ├── dto/              # Request/response DTOs
│   │   ├── entities/         # TypeORM entities
│   │   ├── objectives.controller.ts
│   │   ├── objectives.service.ts
│   │   └── objectives.module.ts
│   ├── key-results/          # Key Results feature module
│   ├── time-periods/         # Time Periods feature module
│   └── reports/              # Reporting feature module
├── shared/
│   ├── decorators/           # Custom decorators
│   ├── filters/              # Exception filters
│   ├── guards/               # Auth guards
│   ├── interceptors/         # Response interceptors
│   └── pagination/           # Pagination utilities
├── config/                   # Configuration modules
├── database/
│   └── migrations/           # TypeORM migrations
├── app.module.ts
└── main.ts
```

## Common Tasks

### Create a New Module

```bash
nest generate module modules/my-feature
nest generate controller modules/my-feature
nest generate service modules/my-feature
```

### Create an Entity

1. Add entity file in `src/modules/<feature>/entities/`
2. Import in the feature module via `TypeOrmModule.forFeature([Entity])`
3. Generate migration: `pnpm migration:generate`
4. Run migration: `pnpm migration:run`

### Add a New Endpoint

1. Define DTO in `src/modules/<feature>/dto/`
2. Add method to service
3. Add route to controller with decorators:
   - `@ApiOperation()` - Swagger description
   - `@ApiResponse()` - Response types
   - `@Body()`, `@Param()`, `@Query()` - Input validation

## API Conventions

| Convention | Example |
|------------|---------|
| URL paths | `kebab-case`: `/time-periods`, `/key-results` |
| JSON fields | `camelCase`: `startDate`, `ownerType` |
| IDs | UUID v4: `550e8400-e29b-41d4-a716-446655440000` |
| Dates | ISO 8601: `2024-01-15` (date), `2024-01-15T10:30:00Z` (datetime) |
| Pagination | Cursor-based: `?limit=20&cursor=<base64>` |

## Error Handling

All errors follow a consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": { }
  }
}
```

Common error codes:
- `VALIDATION_ERROR` - Request validation failed
- `NOT_FOUND` - Resource doesn't exist
- `CONFLICT` - Optimistic locking failure
- `UNAUTHORIZED` - Missing/invalid auth token
- `FORBIDDEN` - Insufficient permissions

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Check connection string
psql "postgresql://postgres:password@localhost:5432/okra_dev"
```

### Migration Errors

```bash
# Show migration status
pnpm migration:show

# Revert last migration
pnpm migration:revert
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

## Useful Commands Reference

| Command | Description |
|---------|-------------|
| `pnpm start:dev` | Start with hot reload |
| `pnpm start:debug` | Start with debugger |
| `pnpm build` | Build for production |
| `pnpm start:prod` | Run production build |
| `pnpm test` | Run unit tests |
| `pnpm test:e2e` | Run e2e tests |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Run Prettier |
| `pnpm migration:generate` | Generate migration from entities |
| `pnpm migration:run` | Apply pending migrations |
| `pnpm migration:revert` | Revert last migration |

## Next Steps

1. Review the OpenAPI spec at `specs/001-okr-crud-api/contracts/openapi.yaml`
2. Check the data model at `specs/001-okr-crud-api/data-model.md`
3. Review functional requirements in `specs/001-okr-crud-api/spec.md`
4. Run the implementation tasks from `specs/001-okr-crud-api/tasks.md`
