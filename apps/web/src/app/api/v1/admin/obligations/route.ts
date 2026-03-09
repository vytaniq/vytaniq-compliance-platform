import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/withAuth';
import { withRole } from '@/middleware/withRole';
import { prisma } from '@/lib/prisma';
import { createObligationSchema } from '@/validators/admin';
import { writeAuditLog } from '@/lib/audit';

/**
 * POST /api/v1/admin/obligations
 * Create a new compliance obligation (admin only)
 */
export const POST = withAuth(withRole(async (req: NextRequest, context: any) => {
  try {
    const { orgId, userId } = context;

    // Parse and validate request body
    const body = await req.json();
    const validation = createObligationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      legalSource,
      category,
      licenseTypes,
      activityFlags,
      frequency,
      deadlineLogic,
      severity,
      evidenceRequired,
      autoFillMappings,
    } = validation.data;

    // Create the new obligation
    const newObligation = await prisma.obligation.create({
      data: {
        title,
        description,
        legalSource,
        category,
        licenseTypes,
        activityFlags,
        frequency,
        deadlineLogic,
        severity,
        evidenceRequired,
        autoFillMappings,
        versions: {
          create: {
            versionNumber: 1,
            changeType: 'CREATED',
            changeSummary: 'Initial obligation created',
            changedBy: userId,
            changedAt: new Date(),
            effectiveFrom: new Date(),
            isCurrent: true,
            title,
            description,
            legalSource,
            category,
            licenseTypes,
            activityFlags,
            frequency,
            deadlineLogic,
            severity,
            evidenceRequired,
          },
        },
      },
      include: {
        versions: true,
      },
    });

    // Audit log
    await writeAuditLog({
      orgId,
      userId,
      actionType: 'CREATE_OBLIGATION',
      entityType: 'Obligation',
      entityId: newObligation.id,
      metadata: { title },
    });

    return NextResponse.json({
      message: 'Obligation created successfully',
      obligation: {
        id: newObligation.id,
        title: newObligation.title,
        category: newObligation.category,
        severity: newObligation.severity,
        frequency: newObligation.frequency,
        createdAt: newObligation.createdAt,
        versionId: newObligation.versions[0]?.id,
      },
    });
  } catch (error) {
    console.error('Error creating obligation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}, 'ADMIN'));
