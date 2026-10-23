import { YardPlan } from '../../types';
import { migratePlan } from '../migrations';
import { yardPlanSchema } from '../validation/yardPlanSchema';

/**
 * Robust plan import: Migrates legacy or unversioned data to CURRENT_SCHEMA_VERSION first,
 * and then validates the migrated result against the strict Zod yardPlanSchema.
 * Order is strictly: migrate -> validate.
 */
export function importPlan(raw: unknown): YardPlan {
  const migrated = migratePlan(raw); // viib CURRENT_SCHEMA_VERSION-ni
  return yardPlanSchema.parse(migrated) as YardPlan; // valideerib AINULT praegust versiooni
}
