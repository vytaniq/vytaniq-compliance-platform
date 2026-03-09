// apps/web/src/app/api/v1/auth/verify-otp/route.ts
// POST /api/v1/auth/verify-otp
// Verify 6-digit OTP, issue JWT tokens
// Returns access token (15 min) + refresh token (7 days, httpOnly cookie)

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyOTP } from '@/lib/otp'
import { signAccessToken, signRefreshToken } from '@/lib/jwt'
import { verifyOTPSchema } from '@/validators/auth'

/**
 * POST /api/v1/auth/verify-otp
 * Verify OTP and issue JWT tokens
 * 
 * Request body:
 * {
 *   email: "compliance@pspcorp.com",
 *   otp: "123456"
 * }
 * 
 * Response:
 * {
 *   accessToken: "eyJhbGc...",
 *   expiresIn: 900,
 *   user: { userId, email, role, orgId }
 * }
 * 
 * (Refresh token set in httpOnly cookie)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // 1. Validate input
    const parseResult = verifyOTPSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten() },
        { status: 400 }
      )
    }

    const { email, otp } = parseResult.data

    // 2. Get OTP record
    const otpRecord = await prisma.otpVerification.findUnique({
      where: { email },
    })

    if (!otpRecord || otpRecord.verified) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 401 }
      )
    }

    // 3. Check if max attempts exceeded (anti-brute-force)
    if (otpRecord.attempts >= 5) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Request a new OTP.' },
        { status: 429 }
      )
    }

    // 4. Verify OTP (timing-safe comparison)
    const { valid, expired } = await verifyOTP(otp as string, otpRecord.otpHash, otpRecord.expiresAt)

    if (expired) {
      return NextResponse.json(
        { error: 'OTP has expired' },
        { status: 401 }
      )
    }

    if (!valid) {
      // Increment failed attempts
      await prisma.otpVerification.update({
        where: { email },
        data: { attempts: otpRecord.attempts + 1 },
      })

      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 401 }
      )
    }

    // 5. Mark OTP as verified
    await prisma.otpVerification.update({
      where: { email },
      data: { verified: true },
    })

    // 6. Get user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { organization: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // 7. Update user: emailVerified = true, lastLogin = now
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        lastLogin: new Date(),
      },
    })

    // 8. Generate JWT tokens
    const accessToken = signAccessToken({
      userId: user.id,
      orgId: user.orgId,
      role: user.role as any,
      planTier: user.organization.planTier as any,
    })

    const refreshToken = signRefreshToken(user.id, user.orgId)

    // 9. Save refresh token to DB (for revocation)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    })

    // 10. Return response with tokens
    const response = NextResponse.json(
      {
        success: true,
        accessToken,
        expiresIn: 900, // 15 minutes
        user: {
          userId: user.id,
          email: user.email,
          firstName: user.firstName,
          role: user.role,
          orgId: user.orgId,
        },
      },
      { status: 200 }
    )

    // Set refresh token in secure httpOnly cookie
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('OTP verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
