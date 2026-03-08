// apps/web/src/validators/obligation.ts
// Zod validation schemas for obligation operations

import { z } from 'zod'

/**
 * Update obligation status schema
 */
export const updateObligationStatusSchema = z.object({
  orgObligationId: z.string().uuid('Invalid obligation ID'),
  status: z.enum([
    'MET',
    'PARTIAL',
    'NOT_STARTED',
    'AT_RISK',
    'WAIVED',
  ]),
  notes: z
    .string()
    .max(1000, 'Notes cannot exceed 1000 characters')
    .optional(),
})

export type UpdateObligationStatusInput = z.infer<typeof updateObligationStatusSchema>

/**
 * Upload evidence schema
 */
export const uploadEvidenceSchema = z.object({
  orgObligationId: z.string().uuid('Invalid obligation ID'),
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

export type UploadEvidenceInput = z.infer<typeof uploadEvidenceSchema>

/**
 * Mark evidence removed schema
 */
export const removeEvidenceSchema = z.object({
  orgObligationId: z.string().uuid('Invalid obligation ID'),
  evidenceUrl: z.string().url('Invalid evidence URL'),
})

export type RemoveEvidenceInput = z.infer<typeof removeEvidenceSchema>
