import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/withAuth';
import { withRole } from '@/middleware/withRole';
import { prisma } from '@/lib/prisma';
import { updateObligationSchema } from '@/validators/admin';
import { writeAuditLog } from '@/lib/audit';

/**
 * PATCH /api/v1/admin/obligations/[id]
 * Update an existing obligation (admin only)
 */
export const PATCH = withAuth(withRole(async (req: NextRequest, context: any) => {
  try {
    const { orgId, userId } = context;
    const obligationId = req.nextUrl.pathname.split('/')[4]; // Extract id from URL: /api/v1/admin/obligations/[id]

    if (!obligationId) {
      return NextResponse.json(
        { error: 'Obligation ID is required' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = updateObligationSchema.safeParse(body);

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
      changeSummary,
    } = validation.data;

    // Get the obligation
    const obligation = await prisma.obligation.findUnique({
      where: { id: obligationId },
      include: { versions: { where: { isCurrent: true } } },
    });

    if (!obligation) {
      return NextResponse.json(
        { error: 'Obligation not found' },
        { status: 404 }
      );
    }

    const currentVersion = obligation.versions[0];

    // Update the obligation
    const updatedObligation = await prisma.obligation.update({
      where: { id: obligationId },
      data: {
        title: title ?? obligation.title,
        description: description ?? obligation.description,
        legalSource: legalSource ?? obligation.legalSource,
        category: category ?? obligation.category,
        licenseTypes: licenseTypes ?? obligation.licenseTypes,
        activityFlags: activityFlags ?? obligation.activityFlags,
        frequency: frequency ?? obligation.frequency,
        deadlineLogic: (deadlineLogic ?? obligation.deadlineLogic) as any,
        severity: severity ?? obligation.severity,
        evidenceRequired: (evidenceRequired ?? obligation.evidenceRequired) as any,
        autoFillMappings: (autoFillMappings ?? obligation.autoFillMappings) as any,
      },
    });

    // Create new version if substantial changes
    const newVersion = await prisma.obligationVersion.create({
      data: {
        obligationId,
        versionNumber: currentVersion ? currentVersion.versionNumber + 1 : 2,
        changeType: 'REQUIREMENT_UPDATED',
        changeSummary: changeSummary || 'Obligation updated',
        changedBy: userId,
        changedAt: new Date(),
        effectiveFrom: new Date(),
        isCurrent: true,
        title: updatedObligation.title,
        description: updatedObligation.description,
        legalSource: updatedObligation.legalSource,
        category: updatedObligation.category,
        licenseTypes: updatedObligation.licenseTypes,
        activityFlags: updatedObligation.activityFlags,
        frequency: updatedObligation.frequency,
        deadlineLogic: updatedObligation.deadlineLogic as any,
        severity: updatedObligation.severity,
        evidenceRequired: updatedObligation.evidenceRequired as any,
        previousVersionId: currentVersion?.id,
      },
    });

    // Mark old version as not current
    if (currentVersion) {
      await prisma.obligationVersion.update({
        where: { id: currentVersion.id },
        data: { isCurrent: false },
      });
    }

    // Audit log
    await writeAuditLog({
      orgId,
      userId,
      actionType: 'UPDATE_OBLIGATION',
      entityType: 'Obligation',
      entityId: obligationId,
      metadata: { versionNumber: newVersion.versionNumber, title: updatedObligation.title },
    });

    return NextResponse.json({
      message: 'Obligation updated successfully',
      obligation: {
        id: updatedObligation.id,
        title: updatedObligation.title,
        category: updatedObligation.category,
        severity: updatedObligation.severity,
        frequency: updatedObligation.frequency,
        updatedAt: updatedObligation.createdAt, // Note: Obligation doesn't have updatedAt in schema, but using createdAt as shown
        versionNumber: newVersion.versionNumber,
      },
    });
  } catch (error) {
    console.error('Error updating obligation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}, 'ADMIN'));

/**
 * DELETE /api/v1/admin/obligations/[id]
 * Archive/soft delete an obligation (admin only)
 */
export const DELETE = withAuth(withRole(async (req: NextRequest, context: any) => {
  try {
    const { orgId, userId } = context;
    const obligationId = req.nextUrl.pathname.split('/')[4]; // Extract id from URL

    if (!obligationId) {
      return NextResponse.json(
        { error: 'Obligation ID is required' },
        { status: 400 }
      );
    }

    // Get the obligation
    const obligation = await prisma.obligation.findUnique({
      where: { id: obligationId },
    });

    if (!obligation) {
      return NextResponse.json(
        { error: 'Obligation not found' },
        { status: 404 }
      );
    }

    // Mark all org obligations as deprecated
    await prisma.obligationVersion.updateMany({
      where: { obligationId },
      data: { changeType: 'DEPRECATED' },
    });

    // Note: In a production system, you might do a soft delete or archive.
    // For now, we're just deprecating the versions and not deleting the obligation itself
    // to maintain audit trail integrity.

    // Audit log
    await writeAuditLog({
      orgId,
      userId,
      actionType: 'ARCHIVE_OBLIGATION',
      entityType: 'Obligation',
      entityId: obligationId,
      metadata: { title: obligation.title },
    });

    return NextResponse.json({
      message: 'Obligation archived successfully',
      obligationId,
    });
  } catch (error) {
    console.error('Error archiving obligation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}, 'ADMIN'));
