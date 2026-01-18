# OKR Management API

A RESTful API for managing Objectives and Key Results (OKRs) built with NestJS, TypeORM, and PostgreSQL.

## Features

- **Objectives Management**: Create, read, update, delete objectives with hierarchical alignment
- **Key Results Tracking**: Define measurable outcomes with typed metrics (number, percentage, currency, boolean)
- **Time Periods**: Organize OKRs into planning cycles (quarters, years)
- **Progress Reports**: Aggregated progress summaries and status distributions
- **Multi-tenancy**: Built-in tenant isolation for SaaS deployment
- **Optimistic Locking**: Version-based conflict resolution for concurrent updates
- **Soft Deletes**: Recoverable deletions with audit trail

## Tech Stack

- **Runtime**: Node.js 20.x LTS
- **Framework**: NestJS 11.x
- **Database**: PostgreSQL 15+
- **ORM**: TypeORM
- **Validation**: class-validator + class-transformer
- **API Documentation**: Swagger/OpenAPI

## Prerequisites

- Node.js 20.x LTS or higher
- PostgreSQL 15+
- pnpm (recommended) or npm

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=okra_dev
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
PORT=3000
NODE_ENV=development
```

### 3. Start Database (Docker)

```bash
docker compose up -d postgres
```

### 4. Run Migrations

```bash
pnpm migration:run
```

### 5. Start Development Server

```bash
pnpm start:dev
```

The API will be available at `http://localhost:3000`.

## API Documentation

Swagger UI is available at `http://localhost:3000/api/docs` when the server is running.

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/objectives` | Create an objective |
| `GET` | `/objectives` | List objectives (paginated) |
| `GET` | `/objectives/:id` | Get objective by ID |
| `PATCH` | `/objectives/:id` | Update objective |
| `DELETE` | `/objectives/:id` | Delete objective |
| `POST` | `/key-results` | Create a key result |
| `GET` | `/key-results/:id` | Get key result by ID |
| `PATCH` | `/key-results/:id` | Update key result |
| `DELETE` | `/key-results/:id` | Delete key result |
| `GET` | `/objectives/:id/key-results` | List key results for objective |
| `POST` | `/time-periods` | Create a time period |
| `GET` | `/time-periods` | List time periods |
| `POST` | `/time-periods/:id/archive` | Archive a time period |
| `GET` | `/reports/progress-summary` | Get progress summary |
| `GET` | `/reports/status-distribution` | Get status distribution |

### Request Headers

All requests must include:

```
X-Tenant-ID: <uuid>  # Required for multi-tenancy
```

### Pagination

List endpoints support cursor-based pagination:

```
GET /objectives?limit=20&cursor=<encoded_cursor>
```

Response includes:
```json
{
  "data": [...],
  "pagination": {
    "nextCursor": "encoded_cursor_string",
    "hasMore": true
  }
}
```

## Project Structure

```
src/
├── common/              # Shared utilities, DTOs, filters
│   ├── dto/             # Base DTOs (pagination, error responses)
│   ├── entities/        # Base entity classes
│   ├── enums/           # Shared enumerations
│   ├── filters/         # Exception filters
│   ├── interceptors/    # Request/response interceptors
│   └── utils/           # Utility functions
├── config/              # Configuration modules
├── objectives/          # Objectives feature module
│   ├── dto/
│   ├── entities/
│   ├── objectives.controller.ts
│   ├── objectives.module.ts
│   └── objectives.service.ts
├── key-results/         # Key Results feature module
├── time-periods/        # Time Periods feature module
├── reports/             # Reports feature module
├── migrations/          # Database migrations
├── app.module.ts        # Root module
└── main.ts              # Application entry point
```

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm start` | Start production server |
| `pnpm start:dev` | Start development server with hot reload |
| `pnpm build` | Build for production |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run unit tests |
| `pnpm test:e2e` | Run end-to-end tests |
| `pnpm migration:run` | Execute pending migrations |
| `pnpm migration:revert` | Revert last migration |
| `pnpm migration:show` | Show migration status |

## Development

### Code Style

The project uses ESLint and Prettier for code formatting:

```bash
pnpm lint        # Check and fix linting issues
pnpm format      # Format code with Prettier
```

### Testing

```bash
pnpm test              # Run unit tests
pnpm test:watch        # Run tests in watch mode
pnpm test:cov          # Generate coverage report
pnpm test:e2e          # Run e2e tests
```

### Database Migrations

```bash
# Run migrations
pnpm migration:run

# Revert last migration
pnpm migration:revert

# Show migration status
pnpm migration:show
```

## Error Handling

All errors follow a consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "title",
        "message": "title should not be empty"
      }
    ]
  }
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request (validation errors) |
| `404` | Not Found |
| `409` | Conflict (optimistic lock failure) |
| `500` | Internal Server Error |

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

UNLICENSED - Private repository
