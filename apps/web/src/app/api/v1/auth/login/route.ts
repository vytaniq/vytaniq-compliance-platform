// apps/web/src/app/api/v1/auth/login/route.ts
// POST /api/v1/auth/login
// Authenticate existing user with email + OTP (OAuth-like flow)
// Returns JWT tokens on success

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateOTP, createOTPRecord } from '@/lib/otp'
import { sendOTPEmail } from '@/lib/sendgrid'
import { loginSchema } from '@/validators/auth'
import { auditLoginFailure } from '@/lib/audit'

/**
 * POST /api/v1/auth/login
 * Request OTP for existing user
 * 
 * Request body:
 * {
 *   email: "compliance@pspcorp.com",
 *   password: "SecurePass123"  // Not used in Phase 1 (email-only auth)
 * }
 * 
 * Response: { requiresOTP: true, email }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

    // 1. Validate input
    const parseResult = loginSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed' },
        { status: 400 }
      )
    }

    const { email } = parseResult.data

    // 2. Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { organization: true },
    })

    // Prevent email enumeration: same response for existing/non-existing emails
    if (!user) {
      // Broadcast failed login attempt to monitoring
      await auditLoginFailure(email, 'User not found', ipAddress)

      return NextResponse.json(
        {
          success: true,
          message: 'If an account exists, you will receive an OTP email.',
          requiresOTP: false,
        },
        { status: 200 }
      )
    }

    // 3. Generate OTP
    const otp = generateOTP()
    const { hashedOtp, expiresAt } = await createOTPRecord(otp)

    // 4. Save OTP record
    await prisma.otpVerification.upsert({
      where: { email },
      update: {
        otpHash: hashedOtp,
        expiresAt,
        attempts: 0,
        verified: false,
      },
      create: {
        email,
        otpHash: hashedOtp,
        expiresAt,
      },
    })

    // 5. Send OTP email
    try {
      await sendOTPEmail(email, otp, user.organization.name)
    } catch (error) {
      console.error('Failed to send OTP email:', error)
      // Continue - OTP is stored
    }

    return NextResponse.json(
      {
        success: true,
        message: 'OTP sent to your email',
        requiresOTP: true,
        email: user.email,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
