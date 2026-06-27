// VERSION: 1.0.0
// Path: artifacts/api-server/src/routes/dashboards.ts
import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { db, dashboardsTable } from "@workspace/db";
import { eq, desc, or } from "drizzle-orm";
import { requireAuth, optionalAuth } from "../lib/auth.js";
import { CreateDashboardBody, UpdateDashboardBody } from "@workspace/api-zod";
import { logAction } from "../lib/audit.js";

const router = Router();

// GET /api/dashboards
router.get("/", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const rows = await db.select().from(dashboardsTable)
    .where(or(eq(dashboardsTable.userId, user.id), eq(dashboardsTable.isPublic, true)))
    .orderBy(desc(dashboardsTable.createdAt));
  res.json(rows.map(fmt));
});

// POST /api/dashboards
router.post("/", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const parsed = CreateDashboardBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const d = parsed.data as any;
  const id = uuidv4();
  await db.insert(dashboardsTable).values({
    id, userId: user.id, name: d.name, description: d.description ?? null,
    config: d.config ?? {}, isPublic: d.isPublic ?? false,
  });
  const row = await db.select().from(dashboardsTable).where(eq(dashboardsTable.id, id)).limit(1);
  res.status(201).json(fmt(row[0]!));
});

// GET /api/dashboards/:dashboardId
router.get("/:dashboardId", optionalAuth, async (req, res) => {
  const dashboardId = req.params.dashboardId as string;
  const rows = await db.select().from(dashboardsTable).where(eq(dashboardsTable.id, dashboardId)).limit(1);
  if (!rows[0]) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmt(rows[0]));
});

// PATCH /api/dashboards/:dashboardId
router.patch("/:dashboardId", requireAuth, async (req, res) => {
  const dashboardId = req.params.dashboardId as string;
  const user = (req as any).user;
  const parsed = UpdateDashboardBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const d = parsed.data as any;
  const updates: any = { updatedAt: new Date() };
  if (d.name !== undefined) updates.name = d.name;
  if (d.description !== undefined) updates.description = d.description;
  if (d.config !== undefined) updates.config = d.config;
  if (d.isPublic !== undefined) updates.isPublic = d.isPublic;
  await db.update(dashboardsTable).set(updates).where(eq(dashboardsTable.id, dashboardId));
  const row = await db.select().from(dashboardsTable).where(eq(dashboardsTable.id, dashboardId)).limit(1);
  if (!row[0]) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmt(row[0]));
});

// DELETE /api/dashboards/:dashboardId
router.delete("/:dashboardId", requireAuth, async (req, res) => {
  const dashboardId = req.params.dashboardId as string;
  await db.delete(dashboardsTable).where(eq(dashboardsTable.id, dashboardId));
  await logAction({ req, action: "delete_dashboard", entityType: "dashboard", entityId: dashboardId });
  res.json({ message: "Dashboard deleted" });
});

function fmt(d: any) {
  return {
    id: d.id, userId: d.userId, name: d.name, description: d.description ?? null,
    config: d.config ?? {}, isPublic: d.isPublic,
    createdAt: d.createdAt?.toISOString() ?? "", updatedAt: d.updatedAt?.toISOString() ?? "",
  };
}

export default router;
