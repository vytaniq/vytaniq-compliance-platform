import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/withAuth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/v1/circulars
 * List all applicable circulars for the organization with relevance tags and acknowledgment status
 */
export const GET = withAuth(async (req: NextRequest, context: any) => {
  try {
    const { orgId, userId } = context;

    // Fetch all OrgCirculars for the organization, excluding NOT_APPLICABLE
    const orgCirculars = await prisma.orgCircular.findMany({
      where: {
        orgId,
        relevanceTag: {
          not: 'NOT_APPLICABLE'
        }
      },
      include: {
        circular: true
      },
      orderBy: [
        { relevanceTag: 'asc' }, // Sort by relevance
        { circular: { date: 'desc' } } // Sort by date descending
      ]
    });

    // Format response
    const circulars = orgCirculars.map((orgCircular: any) => ({
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
    }));

    return NextResponse.json({ circulars });
  } catch (error) {
    console.error('Error listing circulars:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});