import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middleware/withAuth'
import { prisma } from '@/lib/prisma'
import { createCalendarEventSchema } from '@/validators/calendar'
import { writeAuditLog } from '@/lib/audit'

/**
 * GET /api/v1/calendar
 * List all compliance calendar events/deadlines for the organization
 * Includes status (PENDING, SUBMITTED, OVERDUE, ACKNOWLEDGED_BY_CBN)
 */
export const GET = withAuth(async (req: NextRequest, context: any) => {
  try {
    const { orgId, userId } = context

    // Optional query filters
    const url = new URL(req.url)
    const status = url.searchParams.get('status')
    const obligationId = url.searchParams.get('obligationId')

    // Fetch calendar events with filters
    const events = await prisma.reportCalendar.findMany({
      where: {
        orgId,
        ...(status && { status: status as any }),
        ...(obligationId && { obligationId }),
      },
      include: {
        organization: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    })

    // Format response
    const formattedEvents = events.map((event: any) => ({
      id: event.id,
      obligationId: event.obligationId,
      dueDate: event.dueDate,
      submittedAt: event.submittedAt,
      submissionEvidenceUrl: event.submissionEvidenceUrl,
      status: event.status,
      notes: event.notes,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    }))

    await writeAuditLog({
      orgId,
      userId,
      actionType: 'CALENDAR_LIST',
      entityType: 'report_calendar',
      entityId: 'multiple',
      metadata: { count: formattedEvents.length, status },
    })

    return NextResponse.json({ events: formattedEvents })
  } catch (error) {
    console.error('Error listing calendar events:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

/**
 * POST /api/v1/calendar
 * Create a new compliance calendar event/deadline
 */
export const POST = withAuth(async (req: NextRequest, context: any) => {
  try {
    const { orgId, userId } = context

    const body = await req.json()
    const validation = createCalendarEventSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { obligationId, dueDate, notes } = validation.data

    // Verify obligation exists and belongs to the org
    const obligation = await prisma.orgObligation.findFirst({
      where: { id: obligationId, orgId },
    })

    if (!obligation) {
      return NextResponse.json(
        { error: 'Obligation not found' },
        { status: 404 }
      )
    }

    // Get the obligation version for reference
    const obligationVersion = await prisma.obligationVersion.findFirst({
      where: { obligationId },
      orderBy: { versionNumber: 'desc' },
    })

    if (!obligationVersion) {
      return NextResponse.json(
        { error: 'Obligation version not found' },
        { status: 404 }
      )
    }

    // Create the calendar event
    const event = await prisma.reportCalendar.create({
      data: {
        orgId,
        obligationId,
        obligationVersionId: obligationVersion.id,
        dueDate,
        notes: notes || null,
        status: 'PENDING',
      },
    })

    await writeAuditLog({
      orgId,
      userId,
      actionType: 'CALENDAR_CREATED',
      entityType: 'report_calendar',
      entityId: event.id,
      metadata: {
        obligationId,
        dueDate: dueDate.toISOString(),
      },
    })

    return NextResponse.json(
      {
        message: 'Calendar event created successfully',
        event: {
          id: event.id,
          obligationId: event.obligationId,
          dueDate: event.dueDate,
          status: event.status,
          notes: event.notes,
          createdAt: event.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating calendar event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
