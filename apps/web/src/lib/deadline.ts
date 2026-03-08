// apps/web/src/lib/deadline.ts
// Deadline computation from deadline_logic JSON (PRD A6.1)
// Parses deadline_logic and computes next due dates for reports
// Handles business days, anchors (month-end, quarter-end, fiscal year-end)

import { add, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, endOfYear, isWeekend } from 'date-fns'

export interface DeadlineLogic {
  frequency: 'Monthly' | 'Quarterly' | 'Annual' | 'One-time' | 'Event-triggered'
  anchor: 'month_end' | 'quarter_end' | 'fiscal_year_end' | 'license_anniversary'
  offsetDays: number
  offsetDirection: 'before' | 'after'
  businessDaysOnly: boolean
  triggerEvent?: string // For event-triggered deadlines
}

/**
 * Compute next due date for an obligation based on deadline_logic
 * Called during onboarding to populate report calendar
 */
export function computeNextDueDate(
  deadlineLogic: DeadlineLogic,
  fromDate: Date = new Date()
): Date {
  let anchor: Date

  switch (deadlineLogic.anchor) {
    case 'month_end':
      anchor = endOfMonth(fromDate)
      break

    case 'quarter_end':
      anchor = endOfQuarter(fromDate)
      break

    case 'fiscal_year_end':
      // For Nigerian orgs, typically Dec 31 (calendar year)
      anchor = endOfYear(fromDate)
      break

    case 'license_anniversary':
      // This would need org's license_issue_date
      // For now, assume month_end
      anchor = endOfMonth(fromDate)
      break

    default:
      anchor = fromDate
  }

  // Apply offset
  const offsetMs = deadlineLogic.offsetDays * 24 * 60 * 60 * 1000
  let dueDate = new Date(anchor.getTime())

  if (deadlineLogic.offsetDirection === 'after') {
    dueDate = add(anchor, { days: deadlineLogic.offsetDays })
  } else {
    // Before
    dueDate = new Date(anchor.getTime() - offsetMs)
  }

  // If businessDaysOnly, skip weekends
  if (deadlineLogic.businessDaysOnly) {
    while (isWeekend(dueDate)) {
      dueDate = add(dueDate, { days: deadlineLogic.offsetDirection === 'after' ? 1 : -1 })
    }
  }

  return dueDate
}

/**
 * Compute next due date in a series (for recurring obligations)
 * Used to populate multi-month calendar
 */
export function computeNextDueDates(
  deadlineLogic: DeadlineLogic,
  fromDate: Date,
  months: number = 12
): Date[] {
  const dates: Date[] = []

  let current = fromDate

  for (let i = 0; i < months; i++) {
    const due = computeNextDueDate(deadlineLogic, current)
    dates.push(due)

    // Move to next anchor period
    switch (deadlineLogic.frequency) {
      case 'Monthly':
        current = add(current, { months: 1 })
        break

      case 'Quarterly':
        current = add(current, { months: 3 })
        break

      case 'Annual':
        current = add(current, { years: 1 })
        break

      case 'One-time':
        // Only one date
        return dates

      case 'Event-triggered':
        // No next date until event occurs
        return dates

      default:
        // Skip unknown frequency
        break
    }
  }

  return dates
}

/**
 * Classify deadline urgency
 */
export function getDeadlineUrgency(dueDate: Date): 'OVERDUE' | 'URGENT' | 'WARNING' | 'SAFE' {
  const now = new Date()
  const daysUntilDue = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (daysUntilDue < 0) {
    return 'OVERDUE'
  } else if (daysUntilDue <= 7) {
    return 'URGENT'
  } else if (daysUntilDue <= 30) {
    return 'WARNING'
  } else {
    return 'SAFE'
  }
}

/**
 * Get deadline color for UI (dashboard, calendar)
 */
export function getDeadlineColor(urgency: string): string {
  switch (urgency) {
    case 'OVERDUE':
      return '#EF4444' // Red
    case 'URGENT':
      return '#EF4444' // Red (7 days)
    case 'WARNING':
      return '#F59E0B' // Amber (30 days)
    case 'SAFE':
      return '#10B981' // Green (90+ days)
    default:
      return '#6B7280' // Gray
  }
}

/**
 * Check if deadline should trigger a reminder
 */
export function shouldTriggerReminder(dueDate: Date, reminderDays: number): boolean {
  const now = new Date()
  const daysUntilDue = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  return daysUntilDue === reminderDays
}

/**
 * Calculate business days between two dates
 */
export function countBusinessDays(startDate: Date, endDate: Date): number {
  let count = 0
  let current = new Date(startDate)

  while (current <= endDate) {
    if (isBusinessDay(current)) {
      count++
    }
    current = add(current, { days: 1 })
  }

  return count
}
