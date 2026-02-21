import type { RequestHandler, Request } from "express";
import { isAuthenticated as replitIsAuthenticated } from "./replit_integrations/auth";
import { db } from "./db";
import { users } from "@shared/models/auth";
import { eq } from "drizzle-orm";

export function isLocalUser(req: Request): boolean {
  const user = req.user as any;
  return user?.provider === "local";
}

export function getUserId(req: Request): string | null {
  const user = req.user as any;
  if (!user) return null;
  if (user.provider === "local") return user.id;
  return user.claims?.sub ?? null;
}

export const requireAuth: RequestHandler = (req, res, next) => {
  const user = req.user as any;

  if (user?.provider === "local") {
    if (req.isAuthenticated()) return next();
    return res.status(401).json({ message: "Unauthorized" });
  }

  return replitIsAuthenticated(req, res, next);
};

export async function getCurrentUser(req: Request): Promise<any | null> {
  const userId = getUserId(req);
  if (!userId) return null;
  const [dbUser] = await db.select().from(users).where(eq(users.id, userId));
  return dbUser ?? null;
}
