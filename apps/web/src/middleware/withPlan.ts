// apps/web/src/middleware/withPlan.ts
// Server-side feature gating by subscription plan
// PRD A4: Enforces freemium paywall at API level (not just UI)
// Prevents free users from accessing premium features

import { NextResponse } from 'next/server'
import type { AuthContext } from './withAuth'
import type { AuthHandler } from './withAuth'

export type PlanTier = 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE'

// Feature matrix: which plans have access to which features
export const FEATURE_MATRIX: Record<string, PlanTier[]> = {
  // Track obligations (not free)
  OBLIGATION_TRACKING: ['STARTER', 'GROWTH', 'ENTERPRISE'],

  // Evidence upload (GROWTH only)
  EVIDENCE_VAULT: ['GROWTH', 'ENTERPRISE'],

  // Team management (STARTER+)
  TEAM_MANAGEMENT: ['STARTER', 'GROWTH', 'ENTERPRISE'],

  // Readiness score (STARTER+)
  READINESS_SCORE: ['STARTER', 'GROWTH', 'ENTERPRISE'],

  // Circular alerts (STARTER+)
  CIRCULAR_ALERTS: ['STARTER', 'GROWTH', 'ENTERPRISE'],

  // Circular disputes (STARTER+)
  CIRCULAR_DISPUTES: ['STARTER', 'GROWTH', 'ENTERPRISE'],

  // Calendar tracking (STARTER+)
  CALENDAR_TRACKING: ['STARTER', 'GROWTH', 'ENTERPRISE'],

  // PDF reports (GROWTH+)
  READINESS_REPORT_PDF: ['GROWTH', 'ENTERPRISE'],

  // API access (ENTERPRISE only)
  API_ACCESS: ['ENTERPRISE'],

  // Priority support (ENTERPRISE only)
  PRIORITY_SUPPORT: ['ENTERPRISE'],
}

/**
 * Wrap a route handler with plan tier check
 * Rejects requests from users with insufficient plan
 */
export function withPlan(
  handler: AuthHandler,
  requiredFeature: keyof typeof FEATURE_MATRIX
) {
  return async (req: any, context: AuthContext) => {
    // Check if user's plan has access to this feature
    const allowedPlans = FEATURE_MATRIX[requiredFeature]

    if (!allowedPlans || !allowedPlans.includes(context.planTier)) {
      return NextResponse.json(
        {
          error: 'Feature not available on your plan',
          feature: requiredFeature,
          requiredPlan: allowedPlans?.[0] || 'ENTERPRISE',
          currentPlan: context.planTier,
          message: `Upgrade to ${allowedPlans?.[0] || 'Enterprise'} plan to access this feature`,
          href: 'https://app.vytaniq.com/settings/billing',
        },
        { status: 403 }
      )
    }

    // User has access, proceed to handler
    return handler(req, context)
  }
}

/**
 * Compose multiple feature checks
 * Usage: withPlan(handler, ['FEATURE_1', 'FEATURE_2', ...])
 */
export function withPlanMultiple(
  handler: AuthHandler,
  requiredFeatures: (keyof typeof FEATURE_MATRIX)[]
) {
  return async (req: any, context: AuthContext) => {
    for (const feature of requiredFeatures) {
      const allowedPlans = FEATURE_MATRIX[feature]

      if (!allowedPlans || !allowedPlans.includes(context.planTier)) {
        return NextResponse.json(
          {
            error: 'Feature not available on your plan',
            feature,
            requiredPlan: allowedPlans?.[0] || 'ENTERPRISE',
            currentPlan: context.planTier,
          },
          { status: 403 }
        )
      }
    }

    return handler(req, context)
  }
}

/**
 * Get user limits based on plan
 */
export function getPlanLimits(planTier: PlanTier): Record<string, number> {
  const limits: Record<PlanTier, Record<string, number>> = {
    FREE: {
      maxUsers: 1,
      maxTeamMembers: 0,
      maxEvidenceFiles: 0,
      maxAPICallsPerDay: 0,
    },
    STARTER: {
      maxUsers: 3,
      maxTeamMembers: 2,
      maxEvidenceFiles: 100,
      maxAPICallsPerDay: 0,
    },
    GROWTH: {
      maxUsers: 10,
      maxTeamMembers: 9,
      maxEvidenceFiles: 1000,
      maxAPICallsPerDay: 0,
    },
    ENTERPRISE: {
      maxUsers: 9999,
      maxTeamMembers: 9998,
      maxEvidenceFiles: 99999,
      maxAPICallsPerDay: 999999,
    },
  }

  return limits[planTier]
}
