// apps/web/src/app/api/v1/onboarding/complete/route.ts
// POST /api/v1/onboarding/complete
// Completes the multi-step onboarding process described in PRD 4.1
// - Saves license configuration, business activities, and optional evidence preferences
// - Triggers obligation engine to populate applicable obligations
// - Generates initial report calendar entries
// - Calculates and saves the initial readiness score

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/middleware/withAuth'
import { completeOnboardingSchema, CompleteOnboardingInput } from '@/validators/onboarding'
import { createInitialOrgObligations } from '@/lib/obligation-engine'
import { computeNextDueDates } from '@/lib/deadline'
import { calculateReadinessScore, saveReadinessScore } from '@/lib/score'
import { writeAuditLog } from '@/lib/audit'

/**
 * Request body example:
 * {
 *   "licenseTypes": ["PSP", "MMO"],
 *   "licenseNumber": "CBN-PSP-12345",
 *   "licenseIssueDate": "2025-01-01",
 *   "licenseRenewalDate": "2026-01-01",
 *   "activityFlags": ["PAYMENTS", "WALLET"]
 * }
 */
export const POST = withAuth(
  async (req: NextRequest, context) => {
    try {
      const body = await req.json()

      // 1. validate input
      const parsed = completeOnboardingSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: parsed.error.flatten() },
          { status: 400 }
        )
      }

      const {
        licenseTypes,
        licenseNumber,
        licenseIssueDate,
        licenseRenewalDate,
        activityFlags,
      } = parsed.data as CompleteOnboardingInput

      const { orgId, userId } = context

      // 2. Perform everything inside a transaction to maintain consistency
      const result = await prisma.$transaction(async (tx) => {
        // update organization configuration
        const org = await tx.organization.update({
          where: { id: orgId },
          data: {
            licenseTypes,
            licenseNumber,
            licenseIssueDate,
            licenseRenewalDate,
            activityFlags,
          },
        })

        // 3. Populate obligations
        const obligationCount = await createInitialOrgObligations(orgId)

        // 4. Populate report calendar for each obligation
        //    fetch newly created org obligations including the master definition
        const orgObligations = await tx.orgObligation.findMany({
          where: { orgId },
          include: { obligation: true },
        })

        const calendarRecords: Array<{
          orgId: string
          obligationId: string
          dueDate: Date
          status: string
        }> = []

        orgObligations.forEach((oo) => {
          const logic = oo.obligation.deadlineLogic
          if (logic) {
            const dates = computeNextDueDates(logic as any, new Date(), 12)
            dates.forEach((d) => {
              calendarRecords.push({
                orgId,
                obligationId: oo.id,
                dueDate: d,
                status: 'PENDING',
              })
            })
          }
        })

        if (calendarRecords.length > 0) {
          // bulk insert, skip duplicates just in case
          await tx.reportCalendar.createMany({
            data: calendarRecords,
            skipDuplicates: true,
          })
        }

        // 5. Calculate initial readiness score and save it
        const score = await calculateReadinessScore(orgId)
        await saveReadinessScore(orgId, score)

        return {
          obligationsCreated: obligationCount,
          score,
        }
      })

      // 6. Audit the configuration event
      await writeAuditLog({
        orgId,
        userId,
        actionType: 'ORGANIZATION_CONFIGURED',
        entityType: 'organization',
        entityId: orgId,
        metadata: {
          licenseTypes,
          activityFlags,
          obligationsCreated: result.obligationsCreated,
        },
      })

      return NextResponse.json(
        {
          success: true,
          obligationsCreated: result.obligationsCreated,
          readinessScore: result.score,
        },
        { status: 200 }
      )
    } catch (error) {
      console.error('Onboarding error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  },
  { requiredRole: 'ADMIN' } // only admins may configure org settings
)

// Note: rate limiting is recommended in production to prevent abuse of onboarding endpoint.
