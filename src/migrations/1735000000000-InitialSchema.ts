import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Initial migration: Creates all core OKR tables
 * - time_period: Planning cycles (quarters, years, etc.)
 * - objective: High-level OKR goals with hierarchical alignment
 * - key_results: Measurable outcomes under objectives
 */
export class InitialSchema1735000000000 implements MigrationInterface {
  name = 'InitialSchema1735000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create TimePeriodStatus enum
    await queryRunner.query(`
      CREATE TYPE "time_period_status_enum" AS ENUM('ACTIVE', 'ARCHIVED')
    `);

    // Create OwnerType enum
    await queryRunner.query(`
      CREATE TYPE "owner_type_enum" AS ENUM('USER', 'TEAM', 'ORGANIZATION')
    `);

    // Create time_period table
    await queryRunner.query(`
      CREATE TABLE "time_period" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "version" integer NOT NULL DEFAULT 1,
        "name" character varying(100) NOT NULL,
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        "status" "time_period_status_enum" NOT NULL DEFAULT 'ACTIVE',
        CONSTRAINT "CHK_time_period_dates" CHECK ("end_date" > "start_date"),
        CONSTRAINT "PK_time_period" PRIMARY KEY ("id")
      )
    `);

    // Create indexes for time_period
    await queryRunner.query(`
      CREATE INDEX "IDX_time_period_tenant_id" ON "time_period" ("tenant_id")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_time_period_tenant_name" ON "time_period" ("tenant_id", "name") WHERE "deleted_at" IS NULL
    `);

    // Create objective table
    await queryRunner.query(`
      CREATE TABLE "objective" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "version" integer NOT NULL DEFAULT 1,
        "title" character varying(255) NOT NULL,
        "description" text,
        "owner_type" "owner_type_enum" NOT NULL,
        "owner_id" uuid NOT NULL,
        "parent_id" uuid,
        "time_period_id" uuid,
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        CONSTRAINT "CHK_objective_dates" CHECK ("end_date" > "start_date"),
        CONSTRAINT "PK_objective" PRIMARY KEY ("id"),
        CONSTRAINT "FK_objective_parent" FOREIGN KEY ("parent_id") REFERENCES "objective"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_objective_time_period" FOREIGN KEY ("time_period_id") REFERENCES "time_period"("id") ON DELETE SET NULL
      )
    `);

    // Create indexes for objective
    await queryRunner.query(`
      CREATE INDEX "IDX_objective_tenant_id" ON "objective" ("tenant_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_objective_owner" ON "objective" ("tenant_id", "owner_type", "owner_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_objective_dates" ON "objective" ("tenant_id", "start_date", "end_date")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_objective_parent" ON "objective" ("parent_id") WHERE "parent_id" IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_objective_owner_id" ON "objective" ("owner_id")
    `);

    // Create key_results table
    await queryRunner.query(`
      CREATE TABLE "key_results" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "version" integer NOT NULL DEFAULT 1,
        "title" character varying(255) NOT NULL,
        "description" text,
        "objective_id" uuid NOT NULL,
        "metric_type" character varying(20) NOT NULL DEFAULT 'NUMBER',
        "start_value" decimal(15,2) NOT NULL DEFAULT 0,
        "current_value" decimal(15,2) NOT NULL DEFAULT 0,
        "target_value" decimal(15,2) NOT NULL,
        "unit" character varying(50),
        CONSTRAINT "CHK_key_results_values" CHECK ("start_value" <> "target_value"),
        CONSTRAINT "PK_key_results" PRIMARY KEY ("id"),
        CONSTRAINT "FK_key_results_objective" FOREIGN KEY ("objective_id") REFERENCES "objective"("id") ON DELETE CASCADE
      )
    `);

    // Create indexes for key_results
    await queryRunner.query(`
      CREATE INDEX "IDX_key_results_tenant_id" ON "key_results" ("tenant_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_key_results_objective" ON "key_results" ("tenant_id", "objective_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order (respecting foreign keys)
    await queryRunner.query(`DROP TABLE "key_results"`);
    await queryRunner.query(`DROP TABLE "objective"`);
    await queryRunner.query(`DROP TABLE "time_period"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE "owner_type_enum"`);
    await queryRunner.query(`DROP TYPE "time_period_status_enum"`);
  }
}
