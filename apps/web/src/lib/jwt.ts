// apps/web/src/lib/jwt.ts
// JWT token handling: sign, verify, decode
// Uses environment variables for secrets (PRD Security)

import jwt from 'jsonwebtoken'

export interface TokenPayload {
  userId: string
  orgId: string
  role: 'ADMIN' | 'MEMBER' | 'OBSERVER'
  planTier: 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE'
  iat: number
  exp: number
}

const JWT_SECRET = (process.env.JWT_SECRET || 'CHANGE_ME_64_CHAR_RANDOM_STRING') as string
const JWT_REFRESH_SECRET = (process.env.JWT_REFRESH_SECRET || 'CHANGE_ME_DIFFERENT_64_CHAR_RANDOM') as string
const JWT_ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '15m'
const JWT_REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '7d'

/**
 * Sign an access token (short-lived, 15 minutes)
 */
export function signAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET as string, {
    expiresIn: JWT_ACCESS_EXPIRES,
    algorithm: 'HS256',
  } as any)
}

/**
 * Sign a refresh token (long-lived, 7 days)
 * Should be stored in httpOnly cookie
 */
export function signRefreshToken(userId: string, orgId: string): string {
  return jwt.sign({ userId, orgId }, JWT_REFRESH_SECRET as string, {
    expiresIn: JWT_REFRESH_EXPIRES,
    algorithm: 'HS256',
  } as any)
}

/**
 * Verify and decode an access token
 * Throws if token is invalid or expired
 */
export function verifyAccessToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    })
    return decoded as TokenPayload
  } catch (error) {
    throw new Error(`Invalid or expired access token: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Verify and decode a refresh token
 */
export function verifyRefreshToken(token: string): { userId: string; orgId: string } {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      algorithms: ['HS256'],
    })
    return decoded as { userId: string; orgId: string }
  } catch (error) {
    throw new Error(`Invalid or expired refresh token`)
  }
}

/**
 * Decode token without verification (for debugging/logging)
 */
export function decodeToken(token: string): any {
  try {
    return jwt.decode(token)
  } catch {
    return null
  }
}
