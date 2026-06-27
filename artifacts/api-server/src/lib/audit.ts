// VERSION: 1.0.0
// Path: artifacts/api-server/src/lib/audit.ts
import { db, auditLogTable } from "@workspace/db";
import { v4 as uuidv4 } from "uuid";
import type { Request } from "express";

export async function logAction(params: {
  req?: Request;
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  detail?: string;
}) {
  try {
    const ipAddress = params.req
      ? (params.req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || params.req.socket.remoteAddress
      : undefined;
    const userAgent = params.req?.headers["user-agent"];
    await db.insert(auditLogTable).values({
      id: uuidv4(),
      userId: params.userId ?? (params.req as any)?.user?.id ?? null,
      action: params.action,
      entityType: params.entityType ?? null,
      entityId: params.entityId ?? null,
      detail: params.detail ?? null,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
    });
  } catch {
    // audit failures must not break the main request
  }
}
