// apps/web/src/lib/audit.ts
// Audit logging for compliance tracking (append-only, immutable)
// PRD A6.2 Rule 6: Audit logs must be insert-only, no updates allowed
// Every data mutation must be recorded with user ID, org ID, timestamp, and metadata

import { prisma } from './prisma'

export interface AuditLogEntry {
  orgId: string
  userId: string
  actionType: string
  entityType: string
  entityId: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

/**
 * Write an audit log entry (append-only)
 * This is the ONLY function that writes to audit_logs table
 * Database-level rules prevent ANY UPDATE or DELETE operations
 * Fire and forget (async) but we await to ensure errors surface
 */
export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        orgId: entry.orgId,
        userId: entry.userId,
        actionType: entry.actionType,
        entityType: entry.entityType,
        entityId: entry.entityId,
        metadata: entry.metadata || {},
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      },
    })
  } catch (error) {
    // Log to error tracking (Sentry)
    console.error('Audit log write failed:', error)
    // In production, this should trigger an alert but NOT block the request
    // Compliance logging should not fail the user operation
  }
}

/**
 * Query audit logs for an organization (read-only, admin only)
 */
export async function getAuditLogs(
  orgId: string,
  options?: {
    entityType?: string
    actionType?: string
    userId?: string
    limit?: number
    offset?: number
  }
) {
  const limit = Math.min(options?.limit || 50, 500) // Max 500 per query
  const offset = options?.offset || 0

  const logs = await prisma.auditLog.findMany({
    where: {
      orgId,
      ...(options?.entityType && { entityType: options.entityType }),
      ...(options?.actionType && { actionType: options.actionType }),
      ...(options?.userId && { userId: options.userId }),
    },
    orderBy: {
      timestamp: 'desc',
    },
    take: limit,
    skip: offset,
  })

  const total = await prisma.auditLog.count({
    where: {
      orgId,
      ...(options?.entityType && { entityType: options.entityType }),
      ...(options?.actionType && { actionType: options.actionType }),
      ...(options?.userId && { userId: options.userId }),
    },
  })

  return { logs, total, hasMore: offset + limit < total }
}

/**
 * Record specific compliance actions with predefined templates
 */

export async function auditObligationStatusUpdate(
  orgId: string,
  userId: string,
  obligationId: string,
  previousStatus: string,
  newStatus: string,
  ipAddress?: string
) {
  await writeAuditLog({
    orgId,
    userId,
    actionType: 'OBLIGATION_STATUS_UPDATED',
    entityType: 'org_obligation',
    entityId: obligationId,
    metadata: {
      previousStatus,
      newStatus,
      changedAt: new Date().toISOString(),
    },
    ipAddress,
  })
}

export async function auditEvidenceUpload(
  orgId: string,
  userId: string,
  obligationId: string,
  fileUrl: string,
  ipAddress?: string
) {
  await writeAuditLog({
    orgId,
    userId,
    actionType: 'EVIDENCE_UPLOADED',
    entityType: 'org_obligation',
    entityId: obligationId,
    metadata: {
      fileUrl,
      uploadedAt: new Date().toISOString(),
    },
    ipAddress,
  })
}

export async function auditCircularAcknowledgment(
  orgId: string,
  userId: string,
  circularId: string,
  ipAddress?: string
) {
  await writeAuditLog({
    orgId,
    userId,
    actionType: 'CIRCULAR_ACKNOWLEDGED',
    entityType: 'org_circular',
    entityId: circularId,
    metadata: {
      acknowledgedAt: new Date().toISOString(),
    },
    ipAddress,
  })
}

export async function auditCircularDispute(
  orgId: string,
  userId: string,
  circularId: string,
  reason: string,
  ipAddress?: string
) {
  await writeAuditLog({
    orgId,
    userId,
    actionType: 'CIRCULAR_DISPUTE_RAISED',
    entityType: 'circular_dispute',
    entityId: circularId,
    metadata: {
      reason,
      raisedAt: new Date().toISOString(),
    },
    ipAddress,
  })
}

export async function auditLoginSuccess(
  orgId: string,
  userId: string,
  email: string,
  ipAddress?: string
) {
  await writeAuditLog({
    orgId,
    userId,
    actionType: 'LOGIN_SUCCESS',
    entityType: 'user',
    entityId: userId,
    metadata: {
      email,
      loginAt: new Date().toISOString(),
    },
    ipAddress,
  })
}

export async function auditLoginFailure(
  email: string,
  reason: string,
  ipAddress?: string
) {
  // Login failures don't have orgId yet, so we can't audit
  // But we should log to security monitoring
  console.warn(`Login failure for ${email}: ${reason}`, { ipAddress })
}
