import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/withAuth';
import { prisma } from '@/lib/prisma';
import { auditCircularAcknowledgment } from '@/lib/audit';

/**
 * PATCH /api/v1/circulars/[id]/acknowledge
 * Mark a circular as acknowledged/reviewed by the organization
 */
export const PATCH = withAuth(async (req: NextRequest, context: any) => {
  try {
    const { orgId, userId } = context;
    const id = req.nextUrl.pathname.split('/')[6]; // Extract id from URL: /api/v1/circulars/[id]/acknowledge

    if (!id) {
      return NextResponse.json(
        { error: 'Circular ID is required' },
        { status: 400 }
      );
    }

    // Check if the OrgCircular exists and belongs to the org
    const existingOrgCircular = await prisma.orgCircular.findFirst({
      where: {
        id,
        orgId
      }
    });

    if (!existingOrgCircular) {
      return NextResponse.json(
        { error: 'Circular not found' },
        { status: 404 }
      );
    }

    if (existingOrgCircular.acknowledgedAt) {
      return NextResponse.json(
        { error: 'Circular already acknowledged' },
        { status: 400 }
      );
    }

    // Update the acknowledgment
    const updatedOrgCircular = await prisma.orgCircular.update({
      where: { id },
      data: {
        acknowledgedAt: new Date()
      }
    });

    await auditCircularAcknowledgment(orgId, userId, id);

    return NextResponse.json({
      message: 'Circular acknowledged successfully',
      acknowledgedAt: updatedOrgCircular.acknowledgedAt
    });
  } catch (error) {
    console.error('Error acknowledging circular:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});