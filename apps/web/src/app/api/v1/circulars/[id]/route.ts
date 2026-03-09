import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/withAuth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/v1/circulars/[id]
 * Get detailed information about a specific circular including full content and impact analysis
 */
export const GET = withAuth(async (req: NextRequest, context: any) => {
  try {
    const { orgId, userId } = context;
    const circularId = req.nextUrl.pathname.split('/')[4]; // Extract id from URL: /api/v1/circulars/[id]

    if (!circularId) {
      return NextResponse.json(
        { error: 'Circular ID is required' },
        { status: 400 }
      );
    }

    // Fetch the OrgCircular with circular details
    const orgCircular = await prisma.orgCircular.findFirst({
      where: {
        circularId,
        orgId // Ensure it belongs to the user's org
      },
      include: {
        circular: true
      }
    });

    if (!orgCircular) {
      return NextResponse.json(
        { error: 'Circular not found' },
        { status: 404 }
      );
    }

    // Format response with full circular content
    const circular = {
      id: orgCircular.id,
      circularId: orgCircular.circularId,
      relevanceTag: orgCircular.relevanceTag,
      acknowledgedAt: orgCircular.acknowledgedAt,
      acknowledgedBy: orgCircular.acknowledgedBy,
      disputed: orgCircular.disputed,
      circular: {
        id: orgCircular.circular.id,
        title: orgCircular.circular.title,
        summary: orgCircular.circular.summary,
        content: orgCircular.circular.content,
        url: orgCircular.circular.url,
        publishedAt: orgCircular.circular.publishedAt,
        date: orgCircular.circular.date,
        urgency: orgCircular.circular.urgency,
        affectedLicenseTypes: orgCircular.circular.affectedLicenseTypes,
        affectedObligationIds: orgCircular.circular.affectedObligationIds,
        taggingConfidence: orgCircular.circular.taggingConfidence
      }
    };

    return NextResponse.json({ circular });
  } catch (error) {
    console.error('Error getting circular details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});