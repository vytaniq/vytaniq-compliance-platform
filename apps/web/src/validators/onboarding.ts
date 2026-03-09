// apps/web/src/validators/onboarding.ts
// Zod validation schemas for multi-step onboarding flow (PRD 4.1)

import { z } from 'zod'

/**
 * Step 2: License configuration schema
 */
export const licensConfigSchema = z.object({
  licenseTypes: z
    .array(z.enum(['PSP', 'MMO', 'SWITCHING', 'PSSB']))
    .min(1, 'At least one license type required')
    .max(4),
  licenseNumber: z
    .string()
    .min(5, 'License number required')
    .regex(/^[A-Z0-9\-\/]+$/, 'Invalid license number format'),
  licenseIssueDate: z
    .coerce
    .date()
    .refine((date) => date instanceof Date, 'Invalid issue date'),
  licenseRenewalDate: z
    .coerce
    .date()
    .refine((date) => date instanceof Date, 'Invalid renewal date'),
})

export type LicenseConfigInput = z.infer<typeof licensConfigSchema>

/**
 * Step 3: Business activities schema
 */
export const businessActivitiesSchema = z.object({
  activityFlags: z
    .array(
      z.enum([
        'PAYMENTS',
        'LENDING',
        'FX_TRADING',
        'BILL_PAYMENT',
        'REMITTANCE',
        'WALLET',
        'CARD_ISSUANCE',
      ])
    )
    .min(1, 'At least one business activity required'),
})

export type BusinessActivitiesInput = z.infer<typeof businessActivitiesSchema>

/**
 * Step 4: Evidence upload schema (optional)
 */
export const evidenceUploadSchema = z.object({
  fileName: z
    .string()
    .max(255)
    .refine(
      (name) => {
        const ext = name.split('.').pop()?.toLowerCase()
        return ['pdf', 'docx', 'xlsx'].includes(ext || '')
      },
      'File must be PDF, DOCX, or XLSX'
    ),
  fileSize: z
    .number()
    .max(25 * 1024 * 1024, 'File size cannot exceed 25MB'),
})

export type EvidenceUploadInput = z.infer<typeof evidenceUploadSchema>

/**
 * Complete onboarding schema
 */
export const completeOnboardingSchema = z.object({
  licenseTypes: z
    .array(z.enum(['PSP', 'MMO', 'SWITCHING', 'PSSB']))
    .min(1),
  licenseNumber: z.string().min(5),
  licenseIssueDate: z.coerce.date(),
  licenseRenewalDate: z.coerce.date(),
  activityFlags: z
    .array(z.enum([
      'PAYMENTS',
      'LENDING',
      'FX_TRADING',
      'BILL_PAYMENT',
      'REMITTANCE',
      'WALLET',
      'CARD_ISSUANCE',
    ]))
    .min(1),
})

export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>
