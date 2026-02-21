import bcrypt from "bcryptjs";
import { Strategy as LocalStrategy } from "passport-local";
import passport from "passport";
import type { Express, RequestHandler } from "express";
import { db } from "./db";
import { users } from "@shared/models/auth";
import { eq, or } from "drizzle-orm";
import { z } from "zod";

const SALT_ROUNDS = 12;

export const registerSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password too long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  displayName: z.string().min(1, "Display name required").max(50, "Display name too long").optional(),
});

export const loginSchema = z.object({
  identifier: z.string().min(1, "Email or username required"),
  password: z.string().min(1, "Password required"),
});

export function setupLocalAuth(app: Express) {
  passport.use(
    "local",
    new LocalStrategy(
      { usernameField: "identifier", passwordField: "password" },
      async (identifier, password, done) => {
        try {
          const [user] = await db
            .select()
            .from(users)
            .where(
              or(
                eq(users.email, identifier.toLowerCase()),
                eq(users.username, identifier.toLowerCase())
              )
            );

          if (!user) {
            return done(null, false, { message: "No account found with that email or username." });
          }

          if (user.authProvider !== "local" || !user.passwordHash) {
            return done(null, false, {
              message: "This account uses a different sign-in method. Try signing in with Replit.",
            });
          }

          const valid = await bcrypt.compare(password, user.passwordHash);
          if (!valid) {
            return done(null, false, { message: "Incorrect password." });
          }

          return done(null, { id: user.id, email: user.email, provider: "local" });
        } catch (err) {
          return done(err);
        }
      }
    )
  );
}

export function registerLocalAuthRoutes(app: Express) {
  app.post("/api/auth/register", async (req, res) => {
    try {
      const result = registerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          error: "Validation failed",
          issues: result.error.flatten().fieldErrors,
        });
      }

      const { username, email, password, displayName } = result.data;

      const [existingEmail] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
      if (existingEmail) {
        return res.status(409).json({ error: "An account with this email already exists." });
      }

      const [existingUsername] = await db.select().from(users).where(eq(users.username, username.toLowerCase()));
      if (existingUsername) {
        return res.status(409).json({ error: "This username is already taken." });
      }

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      const [newUser] = await db
        .insert(users)
        .values({
          email: email.toLowerCase(),
          username: username.toLowerCase(),
          firstName: displayName || username,
          passwordHash,
          authProvider: "local",
        })
        .returning();

      req.login({ id: newUser.id, email: newUser.email, provider: "local" }, (err) => {
        if (err) return res.status(500).json({ error: "Login after registration failed." });
        res.status(201).json({
          user: {
            id: newUser.id,
            email: newUser.email,
            username: newUser.username,
            firstName: newUser.firstName,
          },
        });
      });
    } catch (err: any) {
      console.error("Registration error:", err);
      res.status(500).json({ error: "Registration failed. Please try again." });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "Validation failed",
        issues: result.error.flatten().fieldErrors,
      });
    }

    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return res.status(500).json({ error: "Authentication error." });
      if (!user) return res.status(401).json({ error: info?.message ?? "Invalid credentials." });

      req.login(user, async (loginErr) => {
        if (loginErr) return res.status(500).json({ error: "Session error." });

        const [dbUser] = await db.select().from(users).where(eq(users.id, user.id));
        res.json({
          user: {
            id: dbUser?.id,
            email: dbUser?.email,
            username: dbUser?.username,
            firstName: dbUser?.firstName,
          },
        });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout-local", (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });
}

export const isLocalAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: "Unauthorized" });
};
