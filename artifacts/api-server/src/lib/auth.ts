// VERSION: 1.0.0
// Path: artifacts/api-server/src/lib/auth.ts
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db, accessTokensTable, usersTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";

const BCRYPT_ROUNDS = parseInt(process.env["AUTH_BCRYPT_ROUNDS"] ?? "12", 10);
const TOKEN_TTL_DAYS = parseInt(process.env["AUTH_TOKEN_TTL_DAYS"] ?? "30", 10);

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHmac("sha256", process.env["SESSION_SECRET"] ?? "fallback-secret").update(token).digest("hex");
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createAccessToken(userId: string, ipAddress?: string, userAgent?: string): Promise<string> {
  const { v4: uuidv4 } = await import("uuid");
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(accessTokensTable).values({
    id: uuidv4(),
    userId,
    tokenHash,
    expiresAt,
    ipAddress,
    userAgent,
  });
  return token;
}

export async function validateToken(token: string) {
  const tokenHash = hashToken(token);
  const now = new Date();
  const rows = await db
    .select({ token: accessTokensTable, user: usersTable })
    .from(accessTokensTable)
    .innerJoin(usersTable, eq(accessTokensTable.userId, usersTable.id))
    .where(and(eq(accessTokensTable.tokenHash, tokenHash), gt(accessTokensTable.expiresAt, now)))
    .limit(1);
  if (!rows[0]) return null;
  const { token: tok, user } = rows[0];
  if (!user.isActive) return null;
  // update lastUsedAt
  await db.update(accessTokensTable).set({ lastUsedAt: now }).where(eq(accessTokensTable.id, tok.id));
  return user;
}

export async function revokeToken(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await db.delete(accessTokensTable).where(eq(accessTokensTable.tokenHash, tokenHash));
}

// Express middleware
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const user = await validateToken(token);
  if (!user) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
  (req as any).user = user;
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  await requireAuth(req, res, async () => {
    const user = (req as any).user;
    if (user?.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  });
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (token) {
    const user = await validateToken(token);
    if (user) (req as any).user = user;
  }
  next();
}
