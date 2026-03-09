import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middleware/withAuth'
import { withRole } from '@/middleware/withRole'
import { prisma } from '@/lib/prisma'
import { updateCalendarEventSchema } from '@/validators/calendar'
import { writeAuditLog } from '@/lib/audit'

/**
 * GET /api/v1/calendar/[id]
 * Get a specific calendar event/deadline
 */
export const GET = withAuth(async (req: NextRequest, context: any) => {
  try {
    const { orgId, userId } = context
    const id = req.nextUrl.pathname.split('/')[4] // /api/v1/calendar/[id]

    if (!id) {
      return NextResponse.json(
        { error: 'Calendar event ID is required' },
        { status: 400 }
      )
    }

    // Fetch the calendar event
    const event = await prisma.reportCalendar.findFirst({
      where: { id, orgId },
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Calendar event not found' },
        { status: 404 }
      )
    }

    await writeAuditLog({
      orgId,
      userId,
      actionType: 'CALENDAR_VIEWED',
      entityType: 'report_calendar',
      entityId: id,
    })

    return NextResponse.json({
      event: {
        id: event.id,
        obligationId: event.obligationId,
        dueDate: event.dueDate,
        submittedAt: event.submittedAt,
        submissionEvidenceUrl: event.submissionEvidenceUrl,
        status: event.status,
        notes: event.notes,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
      },
    })
  } catch (error) {
    console.error('Error fetching calendar event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

/**
 * PATCH /api/v1/calendar/[id]
 * Update a calendar event (due date, status, notes)
 */
export const PATCH = withAuth(async (req: NextRequest, context: any) => {
  try {
    const { orgId, userId } = context
    const id = req.nextUrl.pathname.split('/')[4] // /api/v1/calendar/[id]

    if (!id) {
      return NextResponse.json(
        { error: 'Calendar event ID is required' },
        { status: 400 }
      )
    }

    // Verify event exists
    const existing = await prisma.reportCalendar.findFirst({
      where: { id, orgId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Calendar event not found' },
        { status: 404 }
      )
    }

    const body = await req.json()
    const validation = updateCalendarEventSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { dueDate, status, notes } = validation.data

    // Update the event
    const updated = await prisma.reportCalendar.update({
      where: { id },
      data: {
        ...(dueDate && { dueDate }),
        ...(status && { status }),
        ...(notes !== undefined && { notes: notes || null }),
        updatedAt: new Date(),
      },
    })

    await writeAuditLog({
      orgId,
      userId,
      actionType: 'CALENDAR_UPDATED',
      entityType: 'report_calendar',
      entityId: id,
      metadata: {
        changes: {
          dueDate: dueDate ? dueDate.toISOString() : undefined,
          status,
          notes,
        },
      },
    })

    return NextResponse.json({
      message: 'Calendar event updated successfully',
      event: {
        id: updated.id,
        obligationId: updated.obligationId,
        dueDate: updated.dueDate,
        submittedAt: updated.submittedAt,
        submissionEvidenceUrl: updated.submissionEvidenceUrl,
        status: updated.status,
        notes: updated.notes,
        updatedAt: updated.updatedAt,
      },
    })
  } catch (error) {
    console.error('Error updating calendar event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

/**
 * DELETE /api/v1/calendar/[id]
 * Delete a calendar event (admin only)
 */
export const DELETE = withAuth(async (req: NextRequest, context: any) => {
  try {
    const { orgId, userId, role } = context
    const id = req.nextUrl.pathname.split('/')[4] // /api/v1/calendar/[id]

    if (!id) {
      return NextResponse.json(
        { error: 'Calendar event ID is required' },
        { status: 400 }
      )
    }

    // Only admins can delete
    if (role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Verify event exists
    const existing = await prisma.reportCalendar.findFirst({
      where: { id, orgId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Calendar event not found' },
        { status: 404 }
      )
    }

    // Delete the event
    await prisma.reportCalendar.delete({
      where: { id },
    })

    await writeAuditLog({
      orgId,
      userId,
      actionType: 'CALENDAR_DELETED',
      entityType: 'report_calendar',
      entityId: id,
      metadata: {
        obligationId: existing.obligationId,
        dueDate: existing.dueDate.toISOString(),
      },
    })

    return NextResponse.json({
      message: 'Calendar event deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting calendar event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
