import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/withAuth';
import { prisma } from '@/lib/prisma';
import { auditCircularDispute } from '@/lib/audit';
import { disputeCircularSchema } from '@/validators/circular';

/**
 * POST /api/v1/circulars/[id]/dispute
 * File a dispute against the relevance assessment of a circular
 */
export const POST = withAuth(async (req: NextRequest, context: any) => {
  try {
    const { orgId, userId } = context;
    const circularId = req.nextUrl.pathname.split('/')[4]; // Extract id from URL: /api/v1/circulars/[id]/dispute

    if (!circularId) {
      return NextResponse.json(
        { error: 'Circular ID is required' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = disputeCircularSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { reason } = validation.data;

    // Check if the OrgCircular exists and belongs to the org
    const existingOrgCircular = await prisma.orgCircular.findFirst({
      where: {
        circularId,
        orgId
      }
    });

    if (!existingOrgCircular) {
      return NextResponse.json(
        { error: 'Circular not found for this organization' },
        { status: 404 }
      );
    }

    // Check if there's already an open dispute for this circular
    const existingDispute = await prisma.circularDispute.findFirst({
      where: {
        circularId,
        orgId,
        status: { in: ['OPEN', 'UNDER_REVIEW'] }
      }
    });

    if (existingDispute) {
      return NextResponse.json(
        { error: 'An active dispute already exists for this circular' },
        { status: 400 }
      );
    }

    // Create a new dispute
    const newDispute = await prisma.circularDispute.create({
      data: {
        circularId,
        orgId,
        raisedBy: userId,
        reason,
        status: 'OPEN'
      }
    });

    // Update OrgCircular to mark as disputed
    await prisma.orgCircular.update({
      where: { id: existingOrgCircular.id },
      data: { disputed: true, relevanceTag: 'DISPUTED_PENDING' }
    });

    await auditCircularDispute(orgId, userId, circularId, reason);

    return NextResponse.json({
      message: 'Circular dispute filed successfully',
      dispute: {
        id: newDispute.id,
        circularId: newDispute.circularId,
        raisedAt: newDispute.raisedAt,
        reason: newDispute.reason,
        status: newDispute.status
      }
    });
  } catch (error) {
    console.error('Error filing circular dispute:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});