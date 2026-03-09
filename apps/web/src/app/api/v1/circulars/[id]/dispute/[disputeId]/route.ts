import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/withAuth';
import { withRole } from '@/middleware/withRole';
import { prisma } from '@/lib/prisma';
import { resolveDisputeSchema } from '@/validators/circular';

/**
 * PATCH /api/v1/circulars/[id]/dispute/[disputeId]
 * Admin resolution of a circular relevance dispute
 */
const resolveDisputeHandler = async (req: NextRequest, context: any) => {
  try {
    const { orgId, userId } = context;
    const urlParts = req.nextUrl.pathname.split('/');
    const circularId = urlParts[5]; // /api/v1/circulars/[id]/dispute/[disputeId]
    const disputeId = urlParts[7];

    if (!circularId || !disputeId) {
      return NextResponse.json(
        { error: 'Circular ID and dispute ID are required' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = resolveDisputeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { outcome, resolutionNote } = validation.data;

    // Find the CircularDispute by ID
    const dispute = await prisma.circularDispute.findUnique({
      where: { id: disputeId }
    });

    if (!dispute || dispute.circularId !== circularId) {
      return NextResponse.json(
        { error: 'Dispute not found' },
        { status: 404 }
      );
    }

    if (dispute.status !== 'OPEN' && dispute.status !== 'UNDER_REVIEW') {
      return NextResponse.json(
        { error: 'Dispute has already been resolved' },
        { status: 400 }
      );
    }

    // Resolve the dispute
    const updatedDispute = await prisma.circularDispute.update({
      where: { id: disputeId },
      data: {
        status: 'RESOLVED_CONFIRMED',
        reviewedBy: userId,
        reviewedAt: new Date(),
        outcome,
        resolutionNote
      }
    });

    return NextResponse.json({
      message: 'Circular dispute resolved successfully',
      dispute: {
        id: updatedDispute.id,
        outcome: updatedDispute.outcome,
        resolutionNote: updatedDispute.resolutionNote,
        resolvedAt: updatedDispute.reviewedAt
      }
    });
  } catch (error) {
    console.error('Error resolving circular dispute:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

export const PATCH = withAuth(withRole(resolveDisputeHandler, 'ADMIN_DISPUTE_REVIEW'));