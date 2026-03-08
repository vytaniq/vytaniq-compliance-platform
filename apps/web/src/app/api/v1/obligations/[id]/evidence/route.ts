// apps/web/src/app/api/v1/obligations/[id]/evidence/route.ts
// POST /api/v1/obligations/[id]/evidence
// Generate a presigned S3 upload URL for evidence

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middleware/withAuth'
import { withPlan } from '@/middleware/withPlan'
import { prisma } from '@/lib/prisma'
import { uploadEvidenceSchema } from '@/validators/obligation'
import { generatePresignedUploadUrl } from '@/lib/s3'
import { writeAuditLog } from '@/lib/audit'

export const POST = withAuth(
  withPlan(async (req: NextRequest, context) => {
    const { orgId, userId } = context
    const { id } = context.params as { id: string }

    const body = await req.json()
    const parseResult = uploadEvidenceSchema.safeParse({
      ...body,
      orgObligationId: id,
    })
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten() },
        { status: 400 }
      )
    }

    const { fileName } = parseResult.data

    // ensure obligation exists and belongs to org
    const existing = await prisma.orgObligation.findUnique({ where: { id } })
    if (!existing || existing.orgId !== orgId) {
      return NextResponse.json({ error: 'Obligation not found' }, { status: 404 })
    }

    try {
      const url = await generatePresignedUploadUrl(orgId, id, fileName)

      // audit generation of upload URL
      await writeAuditLog({
        orgId,
        userId,
        actionType: 'EVIDENCE_UPLOAD_URL_GENERATED',
        entityType: 'org_obligation',
        entityId: id,
        metadata: { fileName },
      })

      return NextResponse.json({ presignedUrl: url, expiresIn: 900 }, { status: 200 })
    } catch (error) {
      console.error('Presigned URL error:', error)
      return NextResponse.json({ error: 'Unable to generate upload URL' }, { status: 500 })
    }
  }, 'EVIDENCE_VAULT')
)
