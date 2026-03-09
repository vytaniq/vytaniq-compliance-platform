// apps/web/src/validators/calendar.ts
// Zod validation schemas for calendar/report operations

import { z } from 'zod'

/**
 * Create calendar event schema
 */
export const createCalendarEventSchema = z.object({
  obligationId: z.string().uuid('Invalid obligation ID'),
  dueDate: z.coerce.date().refine(
    (date) => date instanceof Date,
    'Invalid due date'
  ),
  notes: z.string().max(2000, 'Notes cannot exceed 2000 characters').optional(),
})

export type CreateCalendarEventInput = z.infer<typeof createCalendarEventSchema>

/**
 * Update calendar event schema
 */
export const updateCalendarEventSchema = z.object({
  dueDate: z
    .coerce
    .date()
    .refine((date) => date instanceof Date, 'Invalid due date')
    .optional(),
  notes: z.string().max(2000, 'Notes cannot exceed 2000 characters').optional(),
  status: z
    .enum(['PENDING', 'SUBMITTED', 'OVERDUE', 'ACKNOWLEDGED_BY_CBN'])
    .optional(),
})

export type UpdateCalendarEventInput = z.infer<typeof updateCalendarEventSchema>

/**
 * Submit report schema
 */
export const submitReportSchema = z.object({
  submissionEvidenceUrl: z.string().url('Invalid submission evidence URL'),
  notes: z.string().max(2000, 'Notes cannot exceed 2000 characters').optional(),
})

export type SubmitReportInput = z.infer<typeof submitReportSchema>
