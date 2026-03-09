import { z } from 'zod';

/**
 * Admin: Create Obligation - POST /api/v1/admin/obligations
 */
export const createObligationSchema = z.object({
  title: z.string().min(5).max(255),
  description: z.string().min(20),
  legalSource: z.string(), // "CBN Circular 2025/03, Section 4.2"
  category: z.enum([
    'KYC',
    'AML',
    'REPORTING',
    'GOVERNANCE',
    'TECHNOLOGY',
    'CONSUMER_PROTECTION',
    'CAPITAL',
  ]),
  licenseTypes: z.array(z.string()).min(1), // ["PSP", "MMO"]
  activityFlags: z.array(z.string()).min(1), // ["payments", "lending"]
  frequency: z.enum([
    'ONE_TIME',
    'MONTHLY',
    'QUARTERLY',
    'ANNUAL',
    'EVENT_TRIGGERED',
  ]),
  deadlineLogic: z.record(z.any()), // { frequency, anchor, offsetDays }
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  evidenceRequired: z.array(z.object({
    docType: z.string(),
    mandatory: z.boolean(),
    acceptedFormats: z.array(z.string()),
    maxAgeMonths: z.number().optional(),
  })).min(1),
  autoFillMappings: z.record(z.any()).optional(),
});

/**
 * Admin: Update Obligation - PATCH /api/v1/admin/obligations/[id]
 */
export const updateObligationSchema = z.object({
  title: z.string().min(5).max(255).optional(),
  description: z.string().min(20).optional(),
  legalSource: z.string().optional(),
  category: z.enum([
    'KYC',
    'AML',
    'REPORTING',
    'GOVERNANCE',
    'TECHNOLOGY',
    'CONSUMER_PROTECTION',
    'CAPITAL',
  ]).optional(),
  licenseTypes: z.array(z.string()).optional(),
  activityFlags: z.array(z.string()).optional(),
  frequency: z.enum([
    'ONE_TIME',
    'MONTHLY',
    'QUARTERLY',
    'ANNUAL',
    'EVENT_TRIGGERED',
  ]).optional(),
  deadlineLogic: z.record(z.any()).optional(),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
  evidenceRequired: z.array(z.object({
    docType: z.string(),
    mandatory: z.boolean(),
    acceptedFormats: z.array(z.string()),
    maxAgeMonths: z.number().optional(),
  })).optional(),
  autoFillMappings: z.record(z.any()).optional(),
  changeSummary: z.string().optional(), // What changed in this version
});

/**
 * Admin: Ingest Circular - POST /api/v1/admin/circulars/ingest
 */
export const ingestCircularSchema = z.object({
  title: z.string().min(5).max(255),
  summary: z.string().min(10),
  content: z.string().min(50),
  url: z.string().url().optional(),
  date: z.coerce.date().refine((date) => date instanceof Date, 'Invalid date'),
  urgency: z.enum(['CRITICAL', 'HIGH', 'MONITOR']),
  affectedLicenseTypes: z.array(z.string()).min(1),
  affectedObligationIds: z.array(z.string()),
  taggingConfidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
});

/**
 * Admin: Curate Circular (Update Relevance Tags) - PATCH /api/v1/admin/circulars/[id]
 */
export const curateCircularSchema = z.object({
  affectedLicenseTypes: z.array(z.string()).optional(),
  affectedObligationIds: z.array(z.string()).optional(),
  taggingConfidence: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  urgency: z.enum(['CRITICAL', 'HIGH', 'MONITOR']).optional(),
});

export type CreateObligationInput = z.infer<typeof createObligationSchema>;
export type UpdateObligationInput = z.infer<typeof updateObligationSchema>;
export type IngestCircularInput = z.infer<typeof ingestCircularSchema>;
export type CurateCircularInput = z.infer<typeof curateCircularSchema>;
