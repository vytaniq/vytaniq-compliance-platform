// apps/web/src/validators/circular.ts
// Zod validation schemas for circular tracker operations

import { z } from 'zod'

/**
 * Acknowledge circular schema
 */
export const acknowledgeCircularSchema = z.object({
  circularId: z.string().uuid('Invalid circular ID'),
})

export type AcknowledgeCircularInput = z.infer<typeof acknowledgeCircularSchema>

/**
 * Dispute circular schema (PRD A3)
 */
export const disputeCircularSchema = z.object({
  circularId: z.string().uuid('Invalid circular ID'),
  reason: z
    .string()
    .min(10, 'Reason must be at least 10 characters')
    .max(2000, 'Reason cannot exceed 2000 characters'),
})

export type DisputeCircularInput = z.infer<typeof disputeCircularSchema>

/**
 * Resolve circular dispute schema (admin only)
 */
export const resolveDisputeSchema = z.object({
  disputeId: z.string().uuid('Invalid dispute ID'),
  outcome: z.enum([
    'RELEVANCE_CONFIRMED',
    'RELEVANCE_WITHDRAWN',
    'PARTIAL_RELEVANCE',
  ]),
  resolutionNote: z
    .string()
    .min(10, 'Resolution note required')
    .max(2000),
})

export type ResolveDisputeInput = z.infer<typeof resolveDisputeSchema>

/**
 * Ingest new circular schema (admin only)
 */
export const ingestCircularSchema = z.object({
  title: z
    .string()
    .min(5, 'Title required')
    .max(255),
  summary: z
    .string()
    .min(20, 'Summary required')
    .max(5000),
  content: z.string().optional(),
  date: z.coerce.date('Invalid date'),
  url: z.string().url('Invalid URL').optional(),
  affectedLicenseTypes: z
    .array(z.enum(['PSP', 'MMO', 'SWITCHING', 'PSSB']))
    .min(1, 'At least one license type required'),
  affectedObligationIds: z
    .array(z.string().uuid())
    .min(1, 'At least one obligation must be affected'),
  urgency: z.enum(['CRITICAL', 'HIGH', 'MONITOR']).default('MONITOR'),
  taggingConfidence: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
})

export type IngestCircularInput = z.infer<typeof ingestCircularSchema>
