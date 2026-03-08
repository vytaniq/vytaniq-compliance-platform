// apps/web/src/lib/score.ts
// Readiness Score Engine (PRD 4.6, Appendix A6.1)
// Calculates compliance health: 0-100 with 5 weighted components
// Score bands: Investor Ready (85-100), Audit Ready (70-84), Work Required (50-69), At Risk (<50)

import { prisma } from './prisma'
// ScoreBand enum defined here to match prisma schema
export type ScoreBand =
  | 'INVESTOR_READY'
  | 'AUDIT_READY'
  | 'WORK_REQUIRED'
  | 'AT_RISK'

export interface ComponentScores {
  obligationCoverage: number // 0-1
  reportSubmission: number // 0-1
  circularAcknowledgment: number // 0-1
  evidenceCompleteness: number // 0-1
  licenseCurrency: number // 0-1
}

export interface ReadinessScoreResult {
  totalScore: number
  band: ScoreBand
  components: ComponentScores
  computedAt: Date
}

// Score component weights (PRD 4.6.2)
const WEIGHTS = {
  obligationCoverage: 0.35,
  reportSubmission: 0.30,
  circularAcknowledgment: 0.15,
  evidenceCompleteness: 0.10,
  licenseCurrency: 0.10,
} as const

/**
 * Calculate readiness score for an organization
 * Returns 0-100 score with breakdown by component and score band
 */
export async function calculateReadinessScore(orgId: string): Promise<ReadinessScoreResult> {
  // Get organization
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
  })

  if (!org) {
    throw new Error(`Organization not found: ${orgId}`)
  }

  // COMPONENT 1: Obligation Coverage (35%)
  // % of applicable obligations with status 'Met' or 'Partial'
  const obligations = await prisma.orgObligation.findMany({
    where: { orgId },
  })

  const metOrPartialObligations = obligations.filter(
    (o: { status: string }) => o.status === 'MET' || o.status === 'PARTIAL'
  )

  const obligationCoverage =
    obligations.length > 0 ? metOrPartialObligations.length / obligations.length : 0

  // COMPONENT 2: Report Submission Rate (30%)
  // % of periodic reports submitted on time in trailing 12 months
  const last12MonthsStart = new Date()
  last12MonthsStart.setMonth(last12MonthsStart.getMonth() - 12)

  const reportEntries = await prisma.reportCalendar.findMany({
    where: {
      orgId,
      dueDate: {
        gte: last12MonthsStart,
      },
    },
  })

  const submittedReports = reportEntries.filter((e: { submittedAt?: Date }) => e.submittedAt).length
  const reportSubmission =
    reportEntries.length > 0 ? submittedReports / reportEntries.length : 1 // No reports = 100%

  // COMPONENT 3: Circular Acknowledgment (15%)
  // % of applicable CBN circulars acknowledged within 14 days
  const applicableCirculars = await prisma.orgCircular.findMany({
    where: {
      orgId,
      relevanceTag: 'APPLIES_TO_YOU',
    },
    include: {
      circular: true,
    },
  })

  const acknowledgedCirculars = applicableCirculars.filter((oc: any) => {
    if (!oc.acknowledgedAt) return false

    // Acknowledge within 14 days of circular date
    const daysToAcknowledge = Math.floor(
      (oc.acknowledgedAt.getTime() - oc.circular.date.getTime()) / (1000 * 60 * 60 * 24)
    )

    return daysToAcknowledge <= 14
  }).length

  const circularAcknowledgment =
    applicableCirculars.length > 0
      ? acknowledgedCirculars / applicableCirculars.length
      : 1 // No circulars = 100%

  // COMPONENT 4: Evidence Completeness (10%)
  // % of obligations with at least one evidence document
  const obligationsWithEvidence = obligations.filter(
    (o) => o.evidenceUrls && o.evidenceUrls.length > 0
  ).length

  const evidenceCompleteness =
    obligations.length > 0 ? obligationsWithEvidence / obligations.length : 0

  // COMPONENT 5: License Currency (10%)
  // License not expired and renewal initiated with >60 days to expiry
  let licenseCurrency = 0
  if (org.licenseRenewalDate) {
    const now = new Date()
    const daysUntilExpiry = Math.floor(
      (org.licenseRenewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysUntilExpiry > 60) {
      licenseCurrency = 1
    }
  }

  // CALCULATE WEIGHTED TOTAL (0-100)
  const components: ComponentScores = {
    obligationCoverage,
    reportSubmission,
    circularAcknowledgment,
    evidenceCompleteness,
    licenseCurrency,
  }

  const weightedSum =
    obligationCoverage * WEIGHTS.obligationCoverage +
    reportSubmission * WEIGHTS.reportSubmission +
    circularAcknowledgment * WEIGHTS.circularAcknowledgment +
    evidenceCompleteness * WEIGHTS.evidenceCompleteness +
    licenseCurrency * WEIGHTS.licenseCurrency

  const totalScore = Math.round(weightedSum * 100)

  // DETERMINE SCORE BAND (PRD 4.6.2)
  const band: ScoreBand =
    totalScore >= 85
      ? 'INVESTOR_READY'
      : totalScore >= 70
        ? 'AUDIT_READY'
        : totalScore >= 50
          ? 'WORK_REQUIRED'
          : 'AT_RISK'

  return {
    totalScore,
    band,
    components,
    computedAt: new Date(),
  }
}

/**
 * Save computed score to database
 */
export async function saveReadinessScore(
  orgId: string,
  score: ReadinessScoreResult
): Promise<void> {
  await prisma.readinessScore.create({
    data: {
      orgId,
      totalScore: score.totalScore,
      band: score.band,
      components: score.components,
    },
  })
}

/**
 * Get latest saved score for an organization
 */
export async function getLatestReadinessScore(orgId: string): Promise<ReadinessScoreResult | null> {
  const latest = await prisma.readinessScore.findFirst({
    where: { orgId },
    orderBy: { computedAt: 'desc' },
  })

  if (!latest) {
    return null
  }

  return {
    totalScore: latest.totalScore,
    band: latest.band,
    components: latest.components as ComponentScores,
    computedAt: latest.computedAt,
  }
}

/**
 * Get score improvement recommendations
 * Identifies gaps and suggests highest-leverage actions
 */
export async function getScoreGaps(orgId: string): Promise<Array<{
  component: keyof ComponentScores
  currentValue: number
  maximumValue: number
  impact: number // How much score would improve if fixed
}>> {
  const score = await calculateReadinessScore(orgId)

  if (!score) {
    throw new Error(`Could not calculate score for org ${orgId}`)
  }

  const gaps: Array<{ component: string; impact: number; actionItems: string[] }> = []

  // Identify underperforming components
  Object.entries(score.components).forEach(([component, value]) => {
    const weight = WEIGHTS[component as keyof typeof WEIGHTS]
    const gap = 1 - value // How far from 100%
    const impact = Math.round(gap * weight * 100) // Score points that could be gained

    if (gap > 0) {
      gaps.push({
        component: component as keyof ComponentScores,
        currentValue: Math.round(value * 100),
        maximumValue: 100,
        impact,
      })
    }
  })

  // Sort by highest impact first
  return gaps.sort((a, b) => b.impact - a.impact)
}

/**
 * Get score band description
 */
export function getScoreBandDescription(band: ScoreBand): {
  name: string
  description: string
  color: string
} {
  const descriptions: Record<ScoreBand, { name: string; description: string; color: string }> = {
    INVESTOR_READY: {
      name: 'Investor Ready',
      description: 'Suitable for due diligence. Strong compliance posture.',
      color: 'green',
    },
    AUDIT_READY: {
      name: 'Audit Ready',
      description: 'Can pass CBN examination with minor preparation.',
      color: 'blue',
    },
    WORK_REQUIRED: {
      name: 'Work Required',
      description: 'Material gaps. Targeted remediation needed.',
      color: 'amber',
    },
    AT_RISK: {
      name: 'At Risk',
      description: 'High likelihood of CBN inquiry or sanction. Urgent action required.',
      color: 'red',
    },
  }

  return descriptions[band]
}
