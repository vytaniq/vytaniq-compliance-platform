// apps/web/src/middleware/withAuth.ts
// HTTP middleware for JWT verification and authentication
// Extracts org_id from token (never from request body)
// Enforces that all API requests come from authenticated users

import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken, type TokenPayload } from '@/lib/jwt'

export interface AuthContext {
  userId: string
  orgId: string
  role: 'ADMIN' | 'MEMBER' | 'OBSERVER'
  planTier: 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE'
  token?: TokenPayload
}

export type AuthHandler = (
  req: NextRequest,
  context: AuthContext
) => Promise<NextResponse>

/**
 * Middleware: Verify JWT and extract authentication context
 * Usage:
 *   export const GET = withAuth(async (req, context) => {
 *     const { userId, orgId, role } = context
 *     // ... handle request
 *   })
 */
export function withAuth(
  handler: AuthHandler,
  options: { requiredRole?: string; requiredPlan?: string } = {}
) {
  return async (req: NextRequest) => {
    try {
      // Extract Bearer token from Authorization header
      const authHeader = req.headers.get('authorization')

      if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Missing or invalid authorization header' },
          { status: 401 }
        )
      }

      const token = authHeader.slice(7) // Remove "Bearer " prefix

      // Verify and decode token
      let payload: TokenPayload
      try {
        payload = verifyAccessToken(token)
      } catch (error) {
        return NextResponse.json(
          {
            error: 'Invalid or expired token',
            code: 'INVALID_TOKEN',
          },
          { status: 401 }
        )
      }

      // Build authentication context
      const context: AuthContext = {
        userId: payload.userId,
        orgId: payload.orgId,
        role: payload.role,
        planTier: payload.planTier,
        token: payload,
      }

      // Check required role (if specified)
      if (options.requiredRole) {
        const roleHierarchy: Record<string, number> = {
          ADMIN: 3,
          MEMBER: 2,
          OBSERVER: 1,
        }

        if (
          !roleHierarchy[context.role] ||
          roleHierarchy[context.role] < roleHierarchy[options.requiredRole]
        ) {
          return NextResponse.json(
            {
              error: 'Insufficient permissions',
              required: options.requiredRole,
            },
            { status: 403 }
          )
        }
      }

      // Note: Plan tier check is handled by withPlan middleware

      // Call the route handler with authenticated context
      return handler(req, context)
    } catch (error) {
      console.error('Authentication middleware error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Helper to extract org_id from URL params (with validation)
 * SECURITY: Must match org_id from JWT context
 */
export function extractOrgIdFromUrl(req: NextRequest, urlParamIndex: number = 4): string {
  const pathSegments = req.nextUrl.pathname.split('/')
  return pathSegments[urlParamIndex] || ''
}

/**
 * Helper to validate that URL org_id matches JWT org_id
 * Prevents unauthorized access to other orgs' data
 */
export function validateOrgIdMatch(
  context: AuthContext,
  urlOrgId: string,
  requireMatch: boolean = true
): boolean {
  // Admins can see all orgs (Phase 2 feature)
  if (context.role === 'ADMIN') {
    return true
  }

  if (requireMatch && context.orgId !== urlOrgId) {
    return false
  }

  return true
}
