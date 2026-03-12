import type { RequestHandler, Request } from "express";
import { db } from "./db";
import { users } from "@shared/models/auth";
import { eq } from "drizzle-orm";
import { isAuthenticated as replitIsAuthenticated } from "./replit_integrations/auth/replitAuth";

export function isLocalUser(req: Request): boolean {
  const user = req.user as any;
  return user?.provider === "local";
}

export function getUserId(req: Request): string | null {
  const user = req.user as any;
  if (!user) return null;
  if (user.provider === "local") return user.id;
  // Replit OAuth fallback
  return user.claims?.sub ?? null;
}

export const requireAuth: RequestHandler = (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = req.user as any;

  // Local email/password user — session is sufficient proof
  if (user.provider === "local") {
    return next();
  }

  // Replit OAuth user — delegate to the Replit handler which handles token refresh
  return replitIsAuthenticated(req, res, next);
};

export async function getCurrentUser(req: Request): Promise<any | null> {
  const userId = getUserId(req);
  if (!userId) return null;
  const [dbUser] = await db.select().from(users).where(eq(users.id, userId));
  if (!dbUser) return null;
  const { passwordHash, ...safeUser } = dbUser;
  return safeUser;
}
