// apps/web/src/app/api/v1/obligations/[id]/evidence/[fileId]/route.ts
// DELETE /api/v1/obligations/[id]/evidence/[fileId]
// Remove an evidence URL from an obligation record

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middleware/withAuth'
import { withRole } from '@/middleware/withRole'
import { withPlan } from '@/middleware/withPlan'
import { prisma } from '@/lib/prisma'
import { writeAuditLog } from '@/lib/audit'

export const DELETE = withAuth(
  withRole(
    withPlan(async (req: NextRequest, context) => {
      const { orgId, userId } = context
      const urlParts = req.nextUrl.pathname.split('/')
      const id = urlParts[5] // /api/v1/obligations/[id]/evidence/[fileId]
      const fileId = urlParts[7]

      if (!id || !fileId) {
        return NextResponse.json(
          { error: 'Obligation ID and file ID are required' },
          { status: 400 }
        )
      }

      // fileId is expected to be the URL encoded as URI component
      const evidenceUrl = decodeURIComponent(fileId)

      // fetch obligation
      const existing = await prisma.orgObligation.findUnique({ where: { id } })
      if (!existing || existing.orgId !== orgId) {
        return NextResponse.json({ error: 'Obligation not found' }, { status: 404 })
      }

      const updatedUrls = existing.evidenceUrls.filter((u: any) => u !== evidenceUrl)
      if (updatedUrls.length === existing.evidenceUrls.length) {
        return NextResponse.json({ error: 'Evidence not found' }, { status: 404 })
      }

      const updated = await prisma.orgObligation.update({
        where: { id },
        data: { evidenceUrls: updatedUrls },
      })

      // audit removal
      await writeAuditLog({
        orgId,
        userId,
        actionType: 'EVIDENCE_REMOVED',
        entityType: 'org_obligation',
        entityId: id,
        metadata: { evidenceUrl },
      })

      return NextResponse.json({ success: true, obligation: updated }, { status: 200 })
    }, 'EVIDENCE_VAULT')
    , 'OBLIGATION_UPDATE'
  )
)
