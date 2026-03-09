// apps/web/src/app/api/v1/obligations/route.ts
// GET /api/v1/obligations
// Returns list of obligations for the authenticated organization

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/middleware/withAuth'

/**
 * Response format:
 * {
 *   obligations: Array<{
 *     id: string,
 *     status: string,
 *     obligation: { title, description, severity, category, frequency, ... }
 *     evidenceUrls: string[],
 *     completedAt?: Date,
 *   }>
 * }
 */
export const GET = withAuth(async (_req: NextRequest, context) => {
  const { orgId } = context

  const orgObligations = await prisma.orgObligation.findMany({
    where: { orgId },
    include: {
      obligation: true,
      obligationVersion: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // strip out sensitive fields if necessary
  const result = orgObligations.map((oo: any) => ({
    id: oo.id,
    status: oo.status,
    notes: oo.notes,
    evidenceUrls: oo.evidenceUrls,
    completedAt: oo.completedAt,
    obligation: {
      title: oo.obligation.title,
      description: oo.obligation.description,
      category: oo.obligation.category,
      severity: oo.obligation.severity,
      frequency: oo.obligation.frequency,
      legalSource: oo.obligation.legalSource,
      deadlineLogic: oo.obligation.deadlineLogic,
    },
  }))

  return NextResponse.json({ obligations: result }, { status: 200 })
})
