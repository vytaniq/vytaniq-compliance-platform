import { z } from 'zod';

/**
 * Readiness Score Report - GET /api/v1/readiness
 * Retrieves the latest calculated compliance readiness score
 */
export const getReadinessScoreSchema = z.object({
  // No request body - all params from query if needed
});

/**
 * Generate Readiness Report - POST /api/v1/readiness/report
 * Calculates and generates a new compliance readiness report for export
 */
export const generateReadinessReportSchema = z.object({
  format: z.enum(['json', 'pdf']).default('json').optional(),
  includeRecommendations: z.boolean().default(true).optional(),
  period: z.enum(['last_month', 'last_quarter', 'last_year', 'all_time']).default('last_quarter').optional(),
});

export type GetReadinessScoreInput = z.infer<typeof getReadinessScoreSchema>;
export type GenerateReadinessReportInput = z.infer<typeof generateReadinessReportSchema>;
