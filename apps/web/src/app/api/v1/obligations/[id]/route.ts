// apps/web/src/app/api/v1/obligations/[id]/route.ts
// GET  /api/v1/obligations/[id]   -> detail
// PATCH /api/v1/obligations/[id]   -> update status/notes

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middleware/withAuth'
import { withRole } from '@/middleware/withRole'
import { withPlan } from '@/middleware/withPlan'
import { prisma } from '@/lib/prisma'
import { updateObligationStatusSchema } from '@/validators/obligation'
import { auditObligationStatusUpdate } from '@/lib/audit'

/**
 * GET returns detailed obligation record
 */
export const GET = withAuth(async (_req: NextRequest, context) => {
  const { orgId } = context
  const { id } = context.params as { id: string }

  const oo = await prisma.orgObligation.findUnique({
    where: { id },
    include: { obligation: true, obligationVersion: true },
  })

  if (!oo || oo.orgId !== orgId) {
    return NextResponse.json({ error: 'Obligation not found' }, { status: 404 })
  }

  return NextResponse.json({ obligation: oo }, { status: 200 })
})

/**
 * PATCH updates status/notes
 */
export const PATCH = withAuth(
  withRole(
    withPlan(async (req: NextRequest, context) => {
      const { orgId, userId } = context
      const { id } = context.params as { id: string }

      const body = await req.json()
      // include path id in payload for validation
      const parseResult = updateObligationStatusSchema.safeParse({
        ...body,
        orgObligationId: id,
      })
      if (!parseResult.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: parseResult.error.flatten() },
          { status: 400 }
        )
      }

      const { status, notes } = parseResult.data

      // fetch record and ensure org matches
      const existing = await prisma.orgObligation.findUnique({ where: { id } })
      if (!existing || existing.orgId !== orgId) {
        return NextResponse.json({ error: 'Obligation not found' }, { status: 404 })
      }

      // update fields
      const updateData: any = { status }
      if (notes !== undefined) updateData.notes = notes
      if (status === 'MET') {
        updateData.completedAt = new Date()
        updateData.completedBy = userId
      }

      const updated = await prisma.orgObligation.update({
        where: { id },
        data: updateData,
      })

      // audit
      await auditObligationStatusUpdate(
        orgId,
        userId,
        id,
        existing.status,
        status,
        req.ip || ''
      )

      // recalc score (fire and forget)
      calculateReadinessScore(orgId).then(async (score) => {
        await saveReadinessScore(orgId, score)
      })

      return NextResponse.json({ success: true, obligation: updated }, { status: 200 })
    }, 'OBLIGATION_TRACKING'),
    'OBLIGATION_UPDATE'
  )
)
