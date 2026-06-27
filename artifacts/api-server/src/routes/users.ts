// VERSION: 1.0.0
// Path: artifacts/api-server/src/routes/users.ts
import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, ilike, or, desc, count } from "drizzle-orm";
import { requireAdmin, requireAuth } from "../lib/auth.js";
import { logAction } from "../lib/audit.js";
import { UpdateUserBody, ListUsersQueryParams } from "@workspace/api-zod";

const router = Router();

// GET /api/users
router.get("/", requireAdmin, async (req, res) => {
  const parsed = ListUsersQueryParams.safeParse(req.query);
  const page = parsed.data?.page ?? 1;
  const limit = parsed.data?.limit ?? 20;
  const rawSearch = parsed.data?.search;
  const search = Array.isArray(rawSearch) ? rawSearch[0] : rawSearch;
  const offset = (page - 1) * limit;

  let query = db.select().from(usersTable).orderBy(desc(usersTable.createdAt)).limit(limit).offset(offset);
  let countQuery = db.select({ total: count() }).from(usersTable);

  if (search) {
    const like = `%${search}%`;
    const cond = or(ilike(usersTable.email, like), ilike(usersTable.firstName, like), ilike(usersTable.lastName, like));
    query = (query as any).where(cond);
    countQuery = (countQuery as any).where(cond);
  }

  const [rows, totals] = await Promise.all([query, countQuery]);
  res.json({
    users: rows.map(formatUser),
    total: totals[0]?.total ?? 0,
    page,
    limit,
  });
});

// GET /api/users/:userId
router.get("/:userId", requireAdmin, async (req, res) => {
  const userId = req.params.userId as string;
  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!users[0]) { res.status(404).json({ error: "User not found" }); return; }
  res.json(formatUser(users[0]));
});

// PATCH /api/users/:userId
router.patch("/:userId", requireAdmin, async (req, res) => {
  const userId = req.params.userId as string;
  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const d = parsed.data as any;
  const updates: Record<string, any> = { updatedAt: new Date() };
  if (d.firstName !== undefined) updates["firstName"] = d.firstName;
  if (d.lastName !== undefined) updates["lastName"] = d.lastName;
  if (d.isActive !== undefined) updates["isActive"] = d.isActive;
  if (d.role !== undefined) updates["role"] = d.role;
  await db.update(usersTable).set(updates).where(eq(usersTable.id, userId));
  const updated = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!updated[0]) { res.status(404).json({ error: "User not found" }); return; }
  await logAction({ req, action: "update_user", entityType: "user", entityId: userId });
  res.json(formatUser(updated[0]));
});

// DELETE /api/users/:userId
router.delete("/:userId", requireAdmin, async (req, res) => {
  const userId = req.params.userId as string;
  await db.update(usersTable).set({ isActive: false, updatedAt: new Date() }).where(eq(usersTable.id, userId));
  await logAction({ req, action: "deactivate_user", entityType: "user", entityId: userId });
  res.json({ message: "User deactivated" });
});

function formatUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    middleName: user.middleName ?? null,
    recoveryEmail: user.recoveryEmail ?? null,
    isActive: user.isActive,
    role: user.role,
    language: user.language,
    theme: user.theme,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt?.toISOString() ?? "",
  };
}

export default router;
