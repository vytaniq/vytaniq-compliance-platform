// apps/web/src/app/api/v1/auth/refresh/route.ts
// POST /api/v1/auth/refresh
// Refresh access token using refresh token (7-day cookie)
// Returns new access token (15 min)

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRefreshToken, signAccessToken } from '@/lib/jwt'

/**
 * POST /api/v1/auth/refresh
 * Refresh access token
 * 
 * Expects: refreshToken in httpOnly cookie
 * 
 * Response: { accessToken, expiresIn }
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Get refresh token from cookie
    const refreshToken = req.cookies.get('refreshToken')?.value

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token not found' },
        { status: 401 }
      )
    }

    // 2. Verify token signature
    let payload
    try {
      payload = verifyRefreshToken(refreshToken)
    } catch {
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      )
    }

    // 3. Check if token is revoked in DB
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    })

    if (!storedToken || storedToken.revokedAt) {
      return NextResponse.json(
        { error: 'Refresh token has been revoked' },
        { status: 401 }
      )
    }

    if (new Date() > storedToken.expiresAt) {
      return NextResponse.json(
        { error: 'Refresh token has expired' },
        { status: 401 }
      )
    }

    // 4. Get user and org
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { organization: true },
    })

    if (!user || user.orgId !== payload.orgId) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // 5. Generate new access token
    const newAccessToken = signAccessToken({
      userId: user.id,
      orgId: user.orgId,
      role: user.role as any,
      planTier: user.organization.planTier as any,
    })

    return NextResponse.json(
      {
        success: true,
        accessToken: newAccessToken,
        expiresIn: 900, // 15 minutes
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Refresh token error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
