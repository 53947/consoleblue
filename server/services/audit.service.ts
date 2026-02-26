import { eq, desc, and, SQL } from "drizzle-orm";
import { auditLog } from "../../shared/schema";
import type { AuditAction } from "../../shared/types";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

interface AuditEntry {
  userId?: number | null;
  action: AuditAction;
  entityType: string;
  entityId?: number | null;
  entitySlug?: string | null;
  previousValue?: unknown;
  newValue?: unknown;
  metadata?: Record<string, unknown>;
}

export class AuditService {
  constructor(private db: NodePgDatabase) {}

  async log(entry: AuditEntry): Promise<void> {
    await this.db.insert(auditLog).values({
      userId: entry.userId ?? null,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      entitySlug: entry.entitySlug ?? null,
      previousValue: entry.previousValue ?? null,
      newValue: entry.newValue ?? null,
      metadata: entry.metadata ?? null,
    });
  }

  async query(filters: {
    entityType?: string;
    entityId?: number;
    action?: AuditAction;
    limit?: number;
    offset?: number;
  }) {
    const conditions: SQL[] = [];

    if (filters.entityType) {
      conditions.push(eq(auditLog.entityType, filters.entityType));
    }
    if (filters.entityId) {
      conditions.push(eq(auditLog.entityId, filters.entityId));
    }
    if (filters.action) {
      conditions.push(eq(auditLog.action, filters.action));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const entries = await this.db
      .select()
      .from(auditLog)
      .where(where)
      .orderBy(desc(auditLog.createdAt))
      .limit(filters.limit || 50)
      .offset(filters.offset || 0);

    // Get total count for pagination
    const allMatching = await this.db
      .select({ id: auditLog.id })
      .from(auditLog)
      .where(where);

    return {
      entries,
      total: allMatching.length,
    };
  }
}
