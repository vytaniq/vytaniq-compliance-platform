// apps/web/src/middleware/withRole.ts
// Role-Based Access Control (RBAC) middleware
// Enforces role hierarchy: ADMIN > MEMBER > OBSERVER

import { NextResponse } from 'next/server'
import type { AuthContext, AuthHandler } from './withAuth'

export type UserRole = 'ADMIN' | 'MEMBER' | 'OBSERVER'

// Role hierarchy (higher number = more permissions)
const ROLE_HIERARCHY: Record<UserRole, number> = {
  ADMIN: 3,
  MEMBER: 2,
  OBSERVER: 1,
}

// Permission matrix: which roles can perform which actions
export const PERMISSION_MATRIX: Record<string, UserRole[]> = {
  // Organization management
  ORG_CREATE: ['ADMIN'],
  ORG_READ: ['ADMIN', 'MEMBER', 'OBSERVER'],
  ORG_UPDATE: ['ADMIN'],
  ORG_DELETE: ['ADMIN'],

  // User management
  USER_CREATE: ['ADMIN'],
  USER_READ: ['ADMIN', 'MEMBER', 'OBSERVER'],
  USER_UPDATE_SELF: ['ADMIN', 'MEMBER', 'OBSERVER'],
  USER_UPDATE_OTHERS: ['ADMIN'],
  USER_DELETE: ['ADMIN'],

  // Obligation management
  OBLIGATION_READ: ['ADMIN', 'MEMBER', 'OBSERVER'],
  OBLIGATION_UPDATE: ['ADMIN', 'MEMBER'],
  OBLIGATION_DELETE: ['ADMIN'],

  // Circular management
  CIRCULAR_READ: ['ADMIN', 'MEMBER', 'OBSERVER'],
  CIRCULAR_ACKNOWLEDGE: ['ADMIN', 'MEMBER'],
  CIRCULAR_DISPUTE: ['ADMIN', 'MEMBER'],

  // Admin functions (obligation/circular curation)
  ADMIN_OBLIGATION_MANAGE: ['ADMIN'],
  ADMIN_CIRCULAR_INGEST: ['ADMIN'],
  ADMIN_DISPUTE_REVIEW: ['ADMIN'],
  ADMIN_ORG_MANAGEMENT: ['ADMIN'],

  // Audit logs (admins only)
  AUDIT_LOG_READ: ['ADMIN'],
}

/**
 * Middleware: Enforce role-based access control
 * Usage:
 *   export const POST = withRole(handler, 'OBLIGATION_UPDATE')
 */
export function withRole(
  handler: AuthHandler,
  requiredPermission: keyof typeof PERMISSION_MATRIX
) {
  return async (req: any, context: AuthContext) => {
    // Get required roles for this permission
    const requiredRoles = PERMISSION_MATRIX[requiredPermission]

    if (!requiredRoles || !requiredRoles.includes(context.role)) {
      return NextResponse.json(
        {
          error: 'Insufficient permissions',
          permission: requiredPermission,
          required: requiredRoles?.[0] || 'ADMIN',
          current: context.role,
        },
        { status: 403 }
      )
    }

    // User has required role, proceed
    return handler(req, context)
  }
}

/**
 * Compose multiple permission checks
 */
export function withRoleMultiple(
  handler: AuthHandler,
  requiredPermissions: (keyof typeof PERMISSION_MATRIX)[]
) {
  return async (req: any, context: AuthContext) => {
    for (const permission of requiredPermissions) {
      const requiredRoles = PERMISSION_MATRIX[permission]

      if (!requiredRoles || !requiredRoles.includes(context.role)) {
        return NextResponse.json(
          {
            error: 'Insufficient permissions',
            permission,
            required: requiredRoles?.[0] || 'ADMIN',
            current: context.role,
          },
          { status: 403 }
        )
      }
    }

    return handler(req, context)
  }
}

/**
 * Check if a role has higher or equal permissions than another role
 */
export function hasRoleHierarchy(userRole: UserRole, minRequiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRequiredRole]
}

/**
 * Get role description
 */
export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    ADMIN: 'Has full access to organization settings, team management, and compliance curation.',
    MEMBER: 'Can track obligations, acknowledge circulars, and upload evidence.',
    OBSERVER: 'Read-only access to compliance status and reports.',
  }

  return descriptions[role]
}
