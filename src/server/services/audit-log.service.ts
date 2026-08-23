import "server-only";
import { db } from "@/lib/db";

export interface AuditEntry {
  workspaceId: string;
  userId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Fire-and-forget audit logging — a failure here must never break the
 * calling business operation, so errors are swallowed and logged.
 */
export async function logAudit(entry: AuditEntry) {
  try {
    await db.auditLog.create({
      data: {
        workspaceId: entry.workspaceId,
        userId: entry.userId ?? null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        metadata: entry.metadata as any,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log", entry.action, error);
  }
}

export async function listAuditLog(workspaceId: string, limit = 50) {
  return db.auditLog.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { user: { select: { id: true, name: true, email: true } } },
  });
}
