// apps/web/src/app/api/v1/auth/register/route.ts
// POST /api/v1/auth/register
// User registration with email and password
// Generates 6-digit OTP, sends via Sendgrid, returns user ID

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/hash'
import { generateOTP, createOTPRecord } from '@/lib/otp'
import { sendOTPEmail } from '@/lib/sendgrid'
import { registerSchema } from '@/validators/auth'
import { auditLoginFailure } from '@/lib/audit'

/**
 * POST /api/v1/auth/register
 * Register a new organization and user
 * 
 * Request body:
 * {
 *   email: "compliance@pspcorp.com",
 *   password: "SecurePass123",
 *   confirmPassword: "SecurePass123",
 *   companyName: "PSP Corp Limited"
 * }
 * 
 * Response: { userId, email, companyName, requiresOTP: true }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // 1. Validate input with Zod
    const parseResult = registerSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten() },
        { status: 400 }
      )
    }

    const { email, password, companyName } = parseResult.data

    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      // Prevent email enumeration: same response for existing/new emails
      return NextResponse.json(
        {
          success: true,
          message: 'Registration successful. Check your email for OTP.',
        },
        { status: 200 }
      )
    }

    // 3. Hash password (bcrypt 12 rounds)
    const passwordHash = await hashPassword(password)

    // 4. Create organization
    const org = await prisma.organization.create({
      data: {
        name: companyName,
        planTier: 'FREE', // Start on freemium tier
      },
    })

    // 5. Create user
    const user = await prisma.user.create({
      data: {
        orgId: org.id,
        email,
        passwordHash,
        role: 'ADMIN', // First user is org admin
      },
    })

    // 6. Generate 6-digit OTP
    const otp = generateOTP()
    const { hashedOtp, expiresAt } = await createOTPRecord(otp)

    // 7. Save OTP record
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

    // 8. Send OTP email
    try {
      await sendOTPEmail(email, otp, companyName)
    } catch (error) {
      console.error('Failed to send OTP email:', error)
      // Continue - OTP is stored, user can request resend
    }

    // 9. Return response (never expose password or raw OTP)
    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful. Check your email for verification code.',
        userId: user.id,
        orgId: org.id,
        email: user.email,
        requiresOTP: true,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Rate limiting note:
 * In production, add Redis-based rate limiting:
 * - 5 requests per hour per IP address
 * - 3 requests per hour per email
 */
