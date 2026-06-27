// VERSION: 1.0.0
// Path: artifacts/api-server/src/routes/auth.ts
import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { db, usersTable, passwordResetsTable, accessTokensTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import {
  RegisterBody,
  LoginBody,
  UpdateMeBody,
  ChangePasswordBody,
  ForgotPasswordBody,
  ResetPasswordBody,
} from "@workspace/api-zod";
import {
  hashPassword,
  verifyPassword,
  createAccessToken,
  revokeToken,
  requireAuth,
  hashToken,
} from "../lib/auth.js";
import { logAction } from "../lib/audit.js";

const router = Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const { email, password, firstName, lastName, middleName, language, theme } = parsed.data;
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
  if (existing.length > 0) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }
  const passwordHash = await hashPassword(password);
  const userId = uuidv4();
  await db.insert(usersTable).values({
    id: userId,
    email: email.toLowerCase(),
    passwordHash,
    firstName,
    lastName,
    middleName: middleName ?? null,
    language: language ?? "ru",
    theme: theme ?? "light",
    role: "user",
  });
  const token = await createAccessToken(userId, req.socket.remoteAddress, req.headers["user-agent"]);
  const user = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  await logAction({ req, userId, action: "register" });
  res.status(201).json({ token, user: formatUser(user[0]!) });
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { email, password } = parsed.data;
  const users = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
  const user = users[0];
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  if (!user.isActive) {
    res.status(401).json({ error: "Account is disabled" });
    return;
  }
  await db.update(usersTable).set({ lastLoginAt: new Date(), updatedAt: new Date() }).where(eq(usersTable.id, user.id));
  const token = await createAccessToken(user.id, req.socket.remoteAddress, req.headers["user-agent"]);
  await logAction({ req, userId: user.id, action: "login" });
  res.json({ token, user: formatUser(user) });
});

// POST /api/auth/logout
router.post("/logout", requireAuth, async (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.slice(7) ?? "";
  await revokeToken(token);
  await logAction({ req, action: "logout" });
  res.json({ message: "Logged out" });
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req, res) => {
  const user = (req as any).user;
  res.json(formatUser(user));
});

// PATCH /api/auth/me
router.patch("/me", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const updates: Record<string, any> = { updatedAt: new Date() };
  const d = parsed.data;
  if (d.firstName !== undefined) updates["firstName"] = d.firstName;
  if (d.lastName !== undefined) updates["lastName"] = d.lastName;
  if (d.middleName !== undefined) updates["middleName"] = d.middleName;
  if (d.recoveryEmail !== undefined) updates["recoveryEmail"] = d.recoveryEmail;
  if (d.language !== undefined) updates["language"] = d.language;
  if (d.theme !== undefined) updates["theme"] = d.theme;
  await db.update(usersTable).set(updates).where(eq(usersTable.id, user.id));
  const updated = await db.select().from(usersTable).where(eq(usersTable.id, user.id)).limit(1);
  res.json(formatUser(updated[0]!));
});

// POST /api/auth/change-password
router.post("/change-password", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const parsed = ChangePasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { currentPassword, newPassword } = parsed.data;
  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    res.status(400).json({ error: "Current password is incorrect" });
    return;
  }
  const newHash = await hashPassword(newPassword);
  await db.update(usersTable).set({ passwordHash: newHash, updatedAt: new Date() }).where(eq(usersTable.id, user.id));
  // Revoke all other tokens
  await db.delete(accessTokensTable).where(eq(accessTokensTable.userId, user.id));
  await logAction({ req, action: "change_password" });
  res.json({ message: "Password changed" });
});

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  const parsed = ForgotPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { email } = parsed.data;
  const users = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
  // Always return success to prevent email enumeration
  if (users.length > 0) {
    const { generateToken } = await import("../lib/auth.js");
    const token = generateToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await db.insert(passwordResetsTable).values({
      id: uuidv4(),
      userId: users[0]!.id,
      tokenHash,
      expiresAt,
    });
    // In production send email; for now log it
    req.log?.info({ token, email }, "Password reset token generated");
  }
  res.json({ message: "If this email is registered, a reset link has been sent" });
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  const parsed = ResetPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { token, newPassword } = parsed.data;
  const tokenHash = hashToken(token);
  const now = new Date();
  const resets = await db
    .select()
    .from(passwordResetsTable)
    .where(and(eq(passwordResetsTable.tokenHash, tokenHash), gt(passwordResetsTable.expiresAt, now)))
    .limit(1);
  const reset = resets[0];
  if (!reset || reset.usedAt) {
    res.status(400).json({ error: "Invalid or expired reset token" });
    return;
  }
  const newHash = await hashPassword(newPassword);
  await db.update(usersTable).set({ passwordHash: newHash, updatedAt: new Date() }).where(eq(usersTable.id, reset.userId));
  await db.update(passwordResetsTable).set({ usedAt: now }).where(eq(passwordResetsTable.id, reset.id));
  await logAction({ userId: reset.userId, action: "reset_password" });
  res.json({ message: "Password reset successful" });
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
