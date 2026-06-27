// VERSION: 1.0.0
// Path: artifacts/api-server/src/routes/audit.ts
import { Router } from "express";
import { db, auditLogTable } from "@workspace/db";
import { eq, desc, count } from "drizzle-orm";
import { requireAdmin } from "../lib/auth.js";
import { ListAuditLogQueryParams } from "@workspace/api-zod";

const router = Router();

// GET /api/audit
router.get("/", requireAdmin, async (req, res) => {
  const parsed = ListAuditLogQueryParams.safeParse(req.query);
  const page = parsed.data?.page ?? 1;
  const limit = parsed.data?.limit ?? 50;
  const offset = (page - 1) * limit;

  const [rows, totals] = await Promise.all([
    db.select().from(auditLogTable).orderBy(desc(auditLogTable.createdAt)).limit(limit).offset(offset),
    db.select({ total: count() }).from(auditLogTable),
  ]);

  res.json({
    entries: rows.map((e) => ({
      id: e.id,
      userId: e.userId,
      action: e.action,
      entityType: e.entityType ?? null,
      entityId: e.entityId ?? null,
      detail: e.detail ?? null,
      ipAddress: e.ipAddress ?? null,
      createdAt: e.createdAt?.toISOString() ?? "",
    })),
    total: totals[0]?.total ?? 0,
    page,
    limit,
  });
});

export default router;
