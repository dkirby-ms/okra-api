/**
 * Owner type for objectives - defines the ownership level in the hierarchy.
 * Objectives can belong to individuals, teams, or the organization.
 */
export enum OwnerType {
  USER = 'user',
  TEAM = 'team',
  ORGANIZATION = 'organization',
}

/**
 * Metric type for key results - determines validation rules and display format.
 */
export enum MetricType {
  NUMBER = 'number',
  PERCENTAGE = 'percentage',
  CURRENCY = 'currency',
  BOOLEAN = 'boolean',
}

/**
 * Status for time periods - active periods can be edited, archived are read-only.
 */
export enum TimePeriodStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

/**
 * Computed status for objectives - calculated on-demand based on progress vs expected.
 * Never persisted to database.
 */
export enum ObjectiveStatus {
  ON_TRACK = 'on-track',
  AT_RISK = 'at-risk',
  BEHIND = 'behind',
  COMPLETE = 'complete',
}
