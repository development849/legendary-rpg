import type { Express, RequestHandler } from "express";
import { requireAuth, getUserId, getCurrentUser } from "./authMiddleware";
import { db } from "./db";
import { users, sessions } from "@shared/models/auth";
import {
  characters, campaigns, parties, partyMembers,
  chatMessages, gameEvents, worldState, sceneSummaries,
  characterSituations, npcLog, friendships, locationMaps,
  locationScenes, arcs,
} from "@shared/schema";
import { eq, desc, sql, count } from "drizzle-orm";

const ADMIN_TABLES: Record<string, any> = {
  users, characters, campaigns, parties, party_members: partyMembers,
  chat_messages: chatMessages, game_events: gameEvents,
  world_state: worldState, scene_summaries: sceneSummaries,
  character_situations: characterSituations, npc_log: npcLog,
  friendships, location_maps: locationMaps, location_scenes: locationScenes, arcs,
};

const REDACTED_COLUMNS = new Set(["passwordHash", "password_hash"]);

function redactRow(row: Record<string, any>): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [key, val] of Object.entries(row)) {
    clean[key] = REDACTED_COLUMNS.has(key) ? "[REDACTED]" : val;
  }
  return clean;
}

function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw.split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
}

export const requireAdmin: RequestHandler = async (req, res, next) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const adminEmails = getAdminEmails();
    if (adminEmails.length === 0) {
      return res.status(403).json({ message: "No admin emails configured. Set the ADMIN_EMAILS environment variable." });
    }

    if (user.authProvider === "local") {
      return res.status(403).json({ message: "Admin access requires Replit authentication" });
    }

    const userEmail = (user.email ?? "").toLowerCase();
    if (!adminEmails.includes(userEmail)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export function registerAdminRoutes(app: Express) {
  app.get("/api/admin/stats", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const [userCount] = await db.select({ count: count() }).from(users);
      const [charCount] = await db.select({ count: count() }).from(characters);
      const [campaignCount] = await db.select({ count: count() }).from(campaigns);
      const [partyCount] = await db.select({ count: count() }).from(parties);
      const [messageCount] = await db.select({ count: count() }).from(chatMessages);
      const [eventCount] = await db.select({ count: count() }).from(gameEvents);
      const [npcCount] = await db.select({ count: count() }).from(npcLog);
      const [friendCount] = await db.select({ count: count() }).from(friendships);
      const [arcCount] = await db.select({ count: count() }).from(arcs);

      const recentUsers = await db.select({
        id: users.id,
        email: users.email,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        authProvider: users.authProvider,
        createdAt: users.createdAt,
      }).from(users).orderBy(desc(users.createdAt)).limit(20);

      const activeParties = await db.select({
        id: parties.id,
        campaignId: parties.campaignId,
        status: parties.status,
        inviteCode: parties.inviteCode,
        createdAt: parties.createdAt,
      }).from(parties).orderBy(desc(parties.createdAt)).limit(20);

      const topCharacters = await db.select({
        id: characters.id,
        name: characters.name,
        class: characters.class,
        race: characters.race,
        level: characters.level,
        xp: characters.xp,
        userId: characters.userId,
      }).from(characters).orderBy(desc(characters.level)).limit(20);

      res.json({
        counts: {
          users: userCount.count,
          characters: charCount.count,
          campaigns: campaignCount.count,
          parties: partyCount.count,
          messages: messageCount.count,
          events: eventCount.count,
          npcs: npcCount.count,
          friendships: friendCount.count,
          arcs: arcCount.count,
        },
        recentUsers,
        activeParties,
        topCharacters,
      });
    } catch {
      res.status(500).json({ message: "Failed to load stats" });
    }
  });

  app.get("/api/admin/tables", requireAuth, requireAdmin, (_req, res) => {
    res.json({ tables: Object.keys(ADMIN_TABLES) });
  });

  app.get("/api/admin/tables/:table", requireAuth, requireAdmin, async (req, res) => {
    const tableName = req.params.table;
    const table = ADMIN_TABLES[tableName];
    if (!table) return res.status(404).json({ message: "Table not found" });

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = (page - 1) * limit;

    try {
      const [totalResult] = await db.select({ count: count() }).from(table);
      const rows = await db.select().from(table).limit(limit).offset(offset);
      const redactedRows = rows.map(redactRow);
      const columns = redactedRows.length > 0 ? Object.keys(redactedRows[0]) : [];

      res.json({
        table: tableName,
        columns,
        rows: redactedRows,
        total: totalResult.count,
        page,
        limit,
        totalPages: Math.ceil(Number(totalResult.count) / limit),
      });
    } catch {
      res.status(500).json({ message: "Failed to load table data" });
    }
  });

  app.post("/api/admin/query", requireAuth, requireAdmin, async (req, res) => {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.status(400).json({ message: "Query is required" });
    }

    const trimmed = query.trim().toLowerCase();
    if (!trimmed.startsWith("select")) {
      return res.status(400).json({ message: "Only SELECT queries are allowed" });
    }

    const forbidden = ["drop", "delete", "update", "insert", "alter", "truncate", "create", "grant", "revoke", "copy", "pg_", "set ", "do ", "call "];
    for (const word of forbidden) {
      const regex = new RegExp(`\\b${word.trim()}\\b`, "i");
      if (regex.test(trimmed)) {
        return res.status(400).json({ message: `Forbidden keyword detected` });
      }
    }

    if (/;/.test(trimmed.slice(0, -1))) {
      return res.status(400).json({ message: "Multiple statements are not allowed" });
    }

    try {
      await db.execute(sql`SET LOCAL statement_timeout = '10s'`);
      const result = await db.execute(sql.raw(query));
      const rows = Array.isArray(result) ? result : (result as any).rows ?? [];
      const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
      const redactedRows = rows.slice(0, 500).map((r: any) => redactRow(r));
      res.json({ columns, rows: redactedRows, total: rows.length });
    } catch (err: any) {
      const msg = err.message?.includes("statement timeout") ? "Query timed out (10s limit)" : "Query failed — check syntax";
      res.status(400).json({ message: msg });
    }
  });

  app.get("/api/admin/check", requireAuth, requireAdmin, async (req, res) => {
    const user = await getCurrentUser(req);
    res.json({ isAdmin: true, email: user?.email });
  });

  app.get("/api/admin/feedback", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { sessionFeedback } = await import("@shared/schema");
      const limit = Math.min(parseInt((req.query.limit as string) ?? "100", 10) || 100, 500);
      const rows = await db.select().from(sessionFeedback).orderBy(desc(sessionFeedback.createdAt)).limit(limit);
      res.json({ rows, total: rows.length });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
}
