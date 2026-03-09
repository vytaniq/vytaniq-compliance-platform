import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/withAuth';
import { withRole } from '@/middleware/withRole';
import { prisma } from '@/lib/prisma';
import { ingestCircularSchema } from '@/validators/admin';
import { writeAuditLog } from '@/lib/audit';

/**
 * POST /api/v1/admin/circulars/ingest
 * Ingest a new regulatory circular (admin only)
 */
export const POST = withAuth(withRole(async (req: NextRequest, context: any) => {
  try {
    const { orgId, userId } = context;

    // Parse and validate request body
    const body = await req.json();
    const validation = ingestCircularSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const {
      title,
      summary,
      content,
      url,
      date,
      urgency,
      affectedLicenseTypes,
      affectedObligationIds,
      taggingConfidence,
    } = validation.data;

    // Create the new circular in the global registry
    const newCircular = await prisma.circular.create({
      data: {
        title,
        summary,
        content,
        url,
        date,
        urgency,
        affectedLicenseTypes,
        affectedObligationIds,
        taggingConfidence,
        publishedAt: new Date(),
      },
    });

    // Find all organizations with matching license types
    const matchingOrgs = await prisma.organization.findMany({
      where: {
        licenseTypes: {
          hasSome: affectedLicenseTypes,
        },
      },
    });

    // Create OrgCircular entries for each matching org
    const orgCircularPromises = matchingOrgs.map((org: any) =>
      prisma.orgCircular.create({
        data: {
          orgId: org.id,
          circularId: newCircular.id,
          relevanceTag: 'APPLIES_TO_YOU',
          disputed: false,
        },
      })
    );

    await Promise.all(orgCircularPromises);

    // Audit log
    await writeAuditLog({
      orgId,
      userId,
      actionType: 'INGEST_CIRCULAR',
      entityType: 'Circular',
      entityId: newCircular.id,
      metadata: { title, affectedOrgs: matchingOrgs.length },
    });

    return NextResponse.json({
      message: 'Circular ingested successfully',
      circular: {
        id: newCircular.id,
        title: newCircular.title,
        date: newCircular.date,
        urgency: newCircular.urgency,
        affectedOrgsCount: matchingOrgs.length,
        publishedAt: newCircular.publishedAt,
      },
    });
  } catch (error) {
    console.error('Error ingesting circular:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}, 'ADMIN'));
