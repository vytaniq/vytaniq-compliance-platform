import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/withAuth';
import { withRole } from '@/middleware/withRole';
import { prisma } from '@/lib/prisma';
import { curateCircularSchema } from '@/validators/admin';
import { writeAuditLog } from '@/lib/audit';

/**
 * PATCH /api/v1/admin/circulars/[id]
 * Curate a circular - update relevance tags and affected obligations (admin only)
 */
export const PATCH = withAuth(withRole(async (req: NextRequest, context: any) => {
  try {
    const { orgId, userId } = context;
    const circularId = req.nextUrl.pathname.split('/')[4]; // Extract id from URL: /api/v1/admin/circulars/[id]

    if (!circularId) {
      return NextResponse.json(
        { error: 'Circular ID is required' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = curateCircularSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const {
      affectedLicenseTypes,
      affectedObligationIds,
      taggingConfidence,
      urgency,
    } = validation.data;

    // Get the circular
    const circular = await prisma.circular.findUnique({
      where: { id: circularId },
    });

    if (!circular) {
      return NextResponse.json(
        { error: 'Circular not found' },
        { status: 404 }
      );
    }

    // Update the circular metadata
    const updatedCircular = await prisma.circular.update({
      where: { id: circularId },
      data: {
        affectedLicenseTypes: affectedLicenseTypes ?? circular.affectedLicenseTypes,
        affectedObligationIds: affectedObligationIds ?? circular.affectedObligationIds,
        taggingConfidence: taggingConfidence ?? circular.taggingConfidence,
        urgency: urgency ?? circular.urgency,
      },
    });

    // If license types changed, update OrgCircular relevance for affected orgs
    if (affectedLicenseTypes) {
      // Get current OrgCircular entries
      const currentOrgCirculars = await prisma.orgCircular.findMany({
        where: { circularId },
        include: { organization: true },
      });

      // Get organizations with new license types
      const newMatchingOrgs = await prisma.organization.findMany({
        where: {
          licenseTypes: {
            hasSome: affectedLicenseTypes,
          },
        },
      });

      // Create entries for new matching orgs that don't have one
      const existingOrgIds = new Set(currentOrgCirculars.map((oc: any) => oc.orgId));
      const newOrgCircularPromises = newMatchingOrgs
        .filter((org: any) => !existingOrgIds.has(org.id))
        .map((org: any) =>
          prisma.orgCircular.create({
            data: {
              orgId: org.id,
              circularId,
              relevanceTag: 'APPLIES_TO_YOU',
              disputed: false,
            },
          })
        );

      await Promise.all(newOrgCircularPromises);
    }

    // Audit log
    await writeAuditLog({
      orgId,
      userId,
      actionType: 'CURATE_CIRCULAR',
      entityType: 'Circular',
      entityId: circularId,
      metadata: { 
        title: updatedCircular.title,
        affectedLicenseTypes, 
        affectedObligationIds, 
        taggingConfidence, 
        urgency 
      },
    });

    return NextResponse.json({
      message: 'Circular curated successfully',
      circular: {
        id: updatedCircular.id,
        title: updatedCircular.title,
        urgency: updatedCircular.urgency,
        affectedLicenseTypes: updatedCircular.affectedLicenseTypes,
        affectedObligationIds: updatedCircular.affectedObligationIds,
        taggingConfidence: updatedCircular.taggingConfidence,
      },
    });
  } catch (error) {
    console.error('Error curating circular:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}, 'ADMIN'));
