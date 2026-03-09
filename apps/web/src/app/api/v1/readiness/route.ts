import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/withAuth';
import { prisma } from '@/lib/prisma';
import { calculateReadinessScore, getLatestReadinessScore, saveReadinessScore } from '@/lib/score';
import { generateReadinessReportSchema } from '@/validators/readiness';

/**
 * GET /api/v1/readiness
 * Retrieve the latest compliance readiness score for the organization
 */
export const GET = withAuth(async (req: NextRequest, context: any) => {
  try {
    const { orgId, userId } = context;

    // Get the latest saved readiness score
    const latestScore = await getLatestReadinessScore(orgId);

    if (!latestScore) {
      return NextResponse.json(
        { 
          message: 'No readiness score calculated yet',
          score: null 
        },
        { status: 200 }
      );
    }

    // Return the score with component breakdown
    return NextResponse.json({
      score: {
        totalScore: latestScore.totalScore,
        band: latestScore.band,
        components: latestScore.components,
        computedAt: latestScore.computedAt,
        interpretation: getScoreInterpretation(latestScore.totalScore, latestScore.band),
        recommendations: getScoreRecommendations(latestScore.components),
      }
    });
  } catch (error) {
    console.error('Error retrieving readiness score:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/v1/readiness/report
 * Calculate a fresh compliance readiness score and optionally generate a report
 * Admin-only endpoint to refresh score calculations
 */
export const POST = withAuth(async (req: NextRequest, context: any) => {
  try {
    const { orgId, userId } = context;

    // Parse and validate request body
    const body = await req.json();
    const validation = generateReadinessReportSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { format = 'json', includeRecommendations = true, period = 'last_quarter' } = validation.data;

    // Check if org exists and user has access
    const org = await prisma.organization.findUnique({
      where: { id: orgId }
    });

    if (!org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Calculate the fresh readiness score
    const newScore = await calculateReadinessScore(orgId);

    // Save the new score to history
    await saveReadinessScore(orgId, newScore);

    // Prepare the report data
    const reportData: any = {
      organizationId: orgId,
      organizationName: org.name,
      reportGeneratedAt: new Date(),
      scoringPeriod: period,
      score: {
        totalScore: newScore.totalScore,
        band: newScore.band,
        components: newScore.components,
        computedAt: newScore.computedAt,
        interpretation: getScoreInterpretation(newScore.totalScore, newScore.band),
      },
      generatedBy: userId,
    };

    // Add recommendations if requested
    if (includeRecommendations) {
      reportData.recommendations = getScoreRecommendations(newScore.components);
    }

    // Format response based on requested format
    if (format === 'pdf') {
      // For now, return JSON with note about PDF generation
      // In production, would use a library like puppeteer or pdfkit
      return NextResponse.json({
        message: 'PDF generation not yet implemented. Returning JSON report.',
        report: reportData,
        format: 'json'
      });
    }

    return NextResponse.json({
      message: 'Readiness report generated successfully',
      report: reportData,
      format: 'json'
    });
  } catch (error) {
    console.error('Error generating readiness report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

/**
 * Get human-readable interpretation of the score band
 */
function getScoreInterpretation(score: number, band: string): string {
  const interpretations: Record<string, string> = {
    INVESTOR_READY: 'Your compliance posture is strong and demonstrates investor-grade readiness. Continue maintaining current practices.',
    AUDIT_READY: 'Your compliance framework is solid and audit-ready. Focus on the gaps identified below.',
    WORK_REQUIRED: 'Significant compliance improvements needed. Prioritize the high-impact recommendations.',
    AT_RISK: 'Urgent compliance action required. Start with critical recommendations immediately.'
  };

  return interpretations[band] || 'Score interpretation unavailable';
}

/**
 * Generate targeted recommendations based on component scores
 */
function getScoreRecommendations(components: any): any[] {
  const recommendations = [];
  const threshold = 0.7; // 70% threshold

  // Obligation Coverage recommendations
  if (components.obligationCoverage < threshold) {
    recommendations.push({
      priority: 'HIGH',
      component: 'Obligation Coverage',
      gap: Math.round((1 - components.obligationCoverage) * 100),
      recommendation: 'Increase coverage of compliance obligations. Review unmapped regulations and add missing requirements.',
      impact: 'Improves readiness by up to 35%'
    });
  }

  // Report Submission recommendations
  if (components.reportSubmission < threshold) {
    recommendations.push({
      priority: 'HIGH',
      component: 'Report Submission',
      gap: Math.round((1 - components.reportSubmission) * 100),
      recommendation: 'Improve timeliness of regulatory report submissions. Automate submission workflows.',
      impact: 'Improves readiness by up to 30%'
    });
  }

  // Circular Acknowledgment recommendations
  if (components.circularAcknowledgment < threshold) {
    recommendations.push({
      priority: 'MEDIUM',
      component: 'Circular Acknowledgment',
      gap: Math.round((1 - components.circularAcknowledgment) * 100),
      recommendation: 'Acknowledge regulatory circulars within SLA. Set up automated alerts for new circulars.',
      impact: 'Improves readiness by up to 15%'
    });
  }

  // Evidence Completeness recommendations
  if (components.evidenceCompleteness < threshold) {
    recommendations.push({
      priority: 'MEDIUM',
      component: 'Evidence Completeness',
      gap: Math.round((1 - components.evidenceCompleteness) * 100),
      recommendation: 'Ensure all obligations have supporting evidence. Use document management system.',
      impact: 'Improves readiness by up to 10%'
    });
  }

  // License Currency recommendations
  if (components.licenseCurrency < threshold) {
    recommendations.push({
      priority: 'HIGH',
      component: 'License Currency',
      gap: Math.round((1 - components.licenseCurrency) * 100),
      recommendation: 'Renew expiring licenses before deadline. Check license expiration dates.',
      impact: 'Improves readiness by up to 10%'
    });
  }

  // Sort by priority
  const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  recommendations.sort((a, b) => priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]);

  return recommendations;
}
