// VERSION: 1.0.0
// Path: artifacts/api-server/src/routes/notifications.ts
import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { db, notificationsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();

// GET /api/notifications
router.get("/", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const rows = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, user.id))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);
  res.json(rows.map(fmt));
});

// PATCH /api/notifications/:id/read
router.patch("/:notificationId/read", requireAuth, async (req, res) => {
  const notificationId = req.params.notificationId as string;
  const user = (req as any).user;
  await db
    .update(notificationsTable)
    .set({ isRead: "true" })
    .where(and(eq(notificationsTable.id, notificationId), eq(notificationsTable.userId, user.id)));
  res.json({ message: "Marked as read" });
});

// PATCH /api/notifications/read-all
router.patch("/read-all", requireAuth, async (req, res) => {
  const user = (req as any).user;
  await db
    .update(notificationsTable)
    .set({ isRead: "true" })
    .where(eq(notificationsTable.userId, user.id));
  res.json({ message: "All marked as read" });
});

function fmt(n: any) {
  return {
    id: n.id,
    userId: n.userId,
    event: n.event,
    title: n.title,
    body: n.body ?? null,
    link: n.link ?? null,
    isRead: n.isRead === "true",
    createdAt: n.createdAt?.toISOString() ?? "",
  };
}

export default router;
