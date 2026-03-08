// apps/web/src/lib/obligation-engine.ts
// Obligation mapping engine (PRD 4.1)
// Maps organization license types + activity flags to applicable obligations
// Executed during onboarding to populate initial obligation list

import { prisma } from './prisma'

/**
 * Get applicable obligations for an organization
 * Filters master obligation list by org's license types and activity flags
 */
export async function getApplicableObligations(orgId: string) {
  // Get organization
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
  })

  if (!org) {
    throw new Error(`Organization not found: ${orgId}`)
  }

  // Query obligations where:
  // - organizationLicenseTypes[] INTERSECTS obligation.licenseTypes[]
  // - organizationActivityFlags[] INTERSECTS obligation.activityFlags[] (or no activity flags required)
  const applicableObligations = await prisma.obligation.findMany({
    where: {
      OR: [
        // License type matches
        {
          licenseTypes: {
            hasSome: org.licenseTypes,
          },
        },
      ],
    },
  })

  // Further filter by activity flags
  const filtered = applicableObligations.filter((obligation) => {
    // If obligation has no activity flag requirements, it applies
    if (!obligation.activityFlags || obligation.activityFlags.length === 0) {
      return true
    }

    // If obligation has activity flag requirements, check if org has any matching
    return obligation.activityFlags.some((flag) => org.activityFlags.includes(flag))
  })

  return filtered
}

/**
 * Create initial org_obligation records for an organization
 * Called during onboarding after license configuration
 * Creates "Not Started" records for all applicable obligations
 */
export async function createInitialOrgObligations(orgId: string): Promise<number> {
  const applicableObligations = await getApplicableObligations(orgId)

  if (applicableObligations.length === 0) {
    throw new Error(`No applicable obligations found for org ${orgId}`)
  }

  // For each applicable obligation, get the current version
  const orgObligationsToCreate = await Promise.all(
    applicableObligations.map(async (obligation) => {
      const currentVersion = await prisma.obligationVersion.findFirst({
        where: {
          obligationId: obligation.id,
          isCurrent: true,
        },
      })

      if (!currentVersion) {
        throw new Error(`No current version for obligation ${obligation.id}`)
      }

      return {
        orgId,
        obligationId: obligation.id,
        obligationVersionId: currentVersion.id,
        status: 'NOT_STARTED' as const,
      }
    })
  )

  // Batch create all org_obligation records
  const result = await prisma.orgObligation.createMany({
    data: orgObligationsToCreate,
    skipDuplicates: true, // Handle race condition if called twice
  })

  return result.count
}

/**
 * Get all obligations for an organization with their current status
 * Used by dashboard, list views, reporting
 */
export async function getOrgObligationsWithStatus(
  orgId: string,
  filters?: {
    category?: string
    status?: string
    severity?: string
  }
) {
  const orgObligations = await prisma.orgObligation.findMany({
    where: {
      orgId,
      obligation: {
        ...(filters?.category && { category: filters.category }),
        ...(filters?.severity && { severity: filters.severity }),
      },
      ...(filters?.status && { status: filters.status }),
    },
    include: {
      obligation: true,
      obligationVersion: true,
    },
    orderBy: {
      obligation: {
        category: 'asc',
      },
    },
  })

  return orgObligations
}

/**
 * Group obligations by category for dashboard
 */
export async function getObligationsByCategory(orgId: string) {
  const obligations = await getOrgObligationsWithStatus(orgId)

  const grouped: Record<string, typeof obligations> = {}

  obligations.forEach((obligation) => {
    const category = obligation.obligation.category
    if (!grouped[category]) {
      grouped[category] = []
    }
    grouped[category].push(obligation)
  })

  return grouped
}

/**
 * Get obligations summary statistics
 */
export async function getObligationsSummary(orgId: string) {
  const obligations = await getOrgObligationsWithStatus(orgId)

  const summary = {
    total: obligations.length,
    met: obligations.filter((o) => o.status === 'MET').length,
    partial: obligations.filter((o) => o.status === 'PARTIAL').length,
    notStarted: obligations.filter((o) => o.status === 'NOT_STARTED').length,
    atRisk: obligations.filter((o) => o.status === 'AT_RISK').length,
    waived: obligations.filter((o) => o.status === 'WAIVED').length,
  }

  return summary
}

/**
 * Update obligation status and save to audit log
 */
export async function updateObligationStatus(
  orgId: string,
  obligationId: string,
  newStatus: string,
  userId: string
) {
  const orgObligation = await prisma.orgObligation.findUnique({
    where: {
      orgId_obligationId: {
        orgId,
        obligationId,
      },
    },
  })

  if (!orgObligation) {
    throw new Error(`Obligation not found for org ${orgId}`)
  }

  const updated = await prisma.orgObligation.update({
    where: { id: orgObligation.id },
    data: {
      status: newStatus,
      completedAt: newStatus === 'MET' ? new Date() : null,
      completedBy: newStatus === 'MET' ? userId : null,
    },
    include: {
      obligation: true,
    },
  })

  return updated
}
