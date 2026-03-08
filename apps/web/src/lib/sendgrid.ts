// apps/web/src/lib/sendgrid.ts
// Email service via Sendgrid
// Sends OTP codes, deadline reminders, and notifications

import sgMail from '@sendgrid/mail'

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || ''
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@vytaniq.com'
const FROM_NAME = process.env.SENDGRID_FROM_NAME || 'Vytaniq'

sgMail.setApiKey(SENDGRID_API_KEY)

/**
 * Send OTP email
 * PRD 4.1: OTP-based authentication with 10-minute expiry
 */
export async function sendOTPEmail(
  email: string,
  otp: string,
  companyName?: string
): Promise<void> {
  try {
    await sgMail.send({
      to: email,
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject: 'Your Vytaniq Verification Code',
      html: `
        <div style="font-family: DM Sans, sans-serif; color: #1f2937;">
          <h2 style="color: #0a0e1a;">Verify Your Email</h2>
          <p>Hi ${companyName || 'there'},</p>
          <p>Your Vytaniq verification code is:</p>
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <span style="font-family: 'JetBrains Mono', monospace; font-size: 24px; font-weight: bold; letter-spacing: 2px;">
              ${otp}
            </span>
          </div>
          <p style="color: #6b7280;">This code expires in 10 minutes.</p>
          <p style="color: #6b7280;">If you didn't request this code, you can safely ignore this email.</p>
          <p style="margin-top: 40px; color: #9ca3af; font-size: 12px;">
            © 2026 Vytaniq. All rights reserved.
          </p>
        </div>
      `,
    })
  } catch (error) {
    console.error('Failed to send OTP email:', error)
    throw new Error(`Email send failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Send 30-day deadline reminder
 */
export async function send30DayReminder(
  email: string,
  reports: Array<{
    name: string
    dueDate: string
  }>
): Promise<void> {
  const reportList = reports.map((r) => `<li>${r.name} – Due ${r.dueDate}</li>`).join('')

  try {
    await sgMail.send({
      to: email,
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject: 'CBN Reporting Deadlines Coming Up',
      html: `
        <div style="font-family: DM Sans, sans-serif; color: #1f2937;">
          <h2 style="color: #0a0e1a;">Upcoming CBN Report Deadlines</h2>
          <p>Hi there,</p>
          <p>You have the following CBN reports coming due in the next 30 days:</p>
          <ul style="margin: 20px 0;">
            ${reportList}
          </ul>
          <p>
            <a href="https://app.vytaniq.com/calendar" style="background-color: #00d4b8; color: #0a0e1a; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Calendar
            </a>
          </p>
          <p style="color: #6b7280; margin-top: 30px; font-size: 12px;">
            © 2026 Vytaniq. All rights reserved.
          </p>
        </div>
      `,
    })
  } catch (error) {
    console.error('Failed to send 30-day reminder:', error)
    throw new Error(`Email send failed`)
  }
}

/**
 * Send 7-day urgent deadline alert
 */
export async function send7DayUrgentAlert(
  email: string,
  reports: Array<{
    name: string
    dueDate: string
  }>
): Promise<void> {
  const reportList = reports.map((r) => `<li style="color: #ef4444;">${r.name} – Due ${r.dueDate}</li>`).join('')

  try {
    await sgMail.send({
      to: email,
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject: '⚠️ URGENT: CBN Reports Due Within 7 Days',
      html: `
        <div style="font-family: DM Sans, sans-serif; color: #1f2937;">
          <h2 style="color: #ef4444;">⚠️ Urgent: Reports Due Soon</h2>
          <p>Hi there,</p>
          <p>The following CBN reports are due within the next 7 days:</p>
          <ul style="margin: 20px 0;">
            ${reportList}
          </ul>
          <p style="color: #ef4444; font-weight: bold;">
            Missed deadlines can result in CBN sanctions. Please submit immediately.
          </p>
          <p>
            <a href="https://app.vytaniq.com/calendar" style="background-color: #ef4444; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Submit Report
            </a>
          </p>
          <p style="color: #6b7280; margin-top: 30px; font-size: 12px;">
            © 2026 Vytaniq. All rights reserved.
          </p>
        </div>
      `,
    })
  } catch (error) {
    console.error('Failed to send 7-day alert:', error)
    throw new Error(`Email send failed`)
  }
}

/**
 * Send circular alert: "New CBN circular affects you"
 */
export async function sendCircularAlert(
  email: string,
  circular: {
    title: string
    summary: string
    affectedObligations: number
  }
): Promise<void> {
  try {
    await sgMail.send({
      to: email,
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject: `📋 New CBN Circular: ${circular.title}`,
      html: `
        <div style="font-family: DM Sans, sans-serif; color: #1f2937;">
          <h2 style="color: #0a0e1a;">New CBN Circular Published</h2>
          <p>Hi there,</p>
          <p style="font-weight: bold; font-size: 16px;">${circular.title}</p>
          <p style="margin: 20px 0; color: #4b5563;">
            ${circular.summary}
          </p>
          <p>This circular affects <strong>${circular.affectedObligations} of your obligations</strong>.</p>
          <p>
            <a href="https://app.vytaniq.com/circulars" style="background-color: #00d4b8; color: #0a0e1a; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Review Impact Analysis
            </a>
          </p>
          <p style="color: #6b7280; margin-top: 30px; font-size: 12px;">
            © 2026 Vytaniq. All rights reserved.
          </p>
        </div>
      `,
    })
  } catch (error) {
    console.error('Failed to send circular alert:', error)
    throw new Error(`Email send failed`)
  }
}

/**
 * Send dispute resolution notification
 */
export async function sendDisputeResolution(
  email: string,
  outcome: 'CONFIRMED' | 'WITHDRAWN' | 'PARTIAL',
  circular: {
    title: string
  }
): Promise<void> {
  const outcomeText =
    outcome === 'CONFIRMED'
      ? 'The relevance of this circular to your organization has been confirmed.'
      : outcome === 'WITHDRAWN'
        ? 'This circular has been removed from your compliance list. It does not apply to your organization.'
        : 'This circular has been partially applied. Check your obligations list for details.'

  try {
    await sgMail.send({
      to: email,
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject: `Circular Dispute Resolution: ${circular.title}`,
      html: `
        <div style="font-family: DM Sans, sans-serif; color: #1f2937;">
          <h2 style="color: #0a0e1a;">Dispute Resolution Complete</h2>
          <p>Hi there,</p>
          <p>Your dispute regarding the following circular has been reviewed:</p>
          <p style="font-weight: bold; margin: 20px 0;">"${circular.title}"</p>
          <p style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 16px;">
            ${outcomeText}
          </p>
          <p>
            <a href="https://app.vytaniq.com/circulars" style="background-color: #00d4b8; color: #0a0e1a; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Updated Circulars
            </a>
          </p>
          <p style="color: #6b7280; margin-top: 30px; font-size: 12px;">
            © 2026 Vytaniq. All rights reserved.
          </p>
        </div>
      `,
    })
  } catch (error) {
    console.error('Failed to send dispute resolution email:', error)
    throw new Error(`Email send failed`)
  }
}

export { sgMail }
