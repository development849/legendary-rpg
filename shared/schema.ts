import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

// ─── Characters ───────────────────────────────────────────────────────────────

export const characters = pgTable("characters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  class: text("class").notNull(), // fighter, rogue, wizard, cleric
  race: text("race").notNull(),
  background: text("background").notNull(),
  appearance: text("appearance").default(""),
  backstory: text("backstory").default(""),
  profilePicture: text("profile_picture").default(""),
  level: integer("level").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  maxHp: integer("max_hp").notNull().default(10),
  currentHp: integer("current_hp").notNull().default(10),
  stats: jsonb("stats").notNull().default(sql`'{}'::jsonb`), // might, agility, endurance, intellect, will, presence
  skills: jsonb("skills").notNull().default(sql`'[]'::jsonb`),
  abilities: jsonb("abilities").notNull().default(sql`'[]'::jsonb`),
  inventory: jsonb("inventory").notNull().default(sql`'[]'::jsonb`),
  conditions: jsonb("conditions").notNull().default(sql`'[]'::jsonb`),
  isRetired: boolean("is_retired").notNull().default(false),
  createdAt: timestamp("created_at").default(sql`NOW()`).notNull(),
});

export const insertCharacterSchema = createInsertSchema(characters).omit({ id: true, createdAt: true });
export type InsertCharacter = z.infer<typeof insertCharacterSchema>;
export type Character = typeof characters.$inferSelect;

// ─── Campaigns ────────────────────────────────────────────────────────────────

export const campaigns = pgTable("campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull(),
  name: text("name").notNull(),
  description: text("description").default(""),
  setting: text("setting").default(""),
  contentRating: text("content_rating").notNull().default("pg13"),
  themes: jsonb("themes").notNull().default(sql`'[]'::jsonb`),
  noRomance: boolean("no_romance").notNull().default(false),
  noHorror: boolean("no_horror").notNull().default(false),
  fadeToBlack: boolean("fade_to_black").notNull().default(true),
  gmMode: text("gm_mode").notNull().default("balanced"),
  stylePack: text("style_pack").notNull().default("luminous_painterly_fantasy"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").default(sql`NOW()`).notNull(),
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({ id: true, createdAt: true });
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;

// ─── Parties ──────────────────────────────────────────────────────────────────

export const parties = pgTable("parties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull(),
  name: text("name").notNull(),
  inviteCode: varchar("invite_code").notNull().unique(),
  status: text("status").notNull().default("lobby"), // lobby, active, paused, ended
  currentScene: jsonb("current_scene").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").default(sql`NOW()`).notNull(),
});

export const insertPartySchema = createInsertSchema(parties).omit({ id: true, createdAt: true });
export type InsertParty = z.infer<typeof insertPartySchema>;
export type Party = typeof parties.$inferSelect;

// ─── Party Members ────────────────────────────────────────────────────────────

export const partyMembers = pgTable("party_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partyId: varchar("party_id").notNull(),
  userId: varchar("user_id").notNull(),
  characterId: varchar("character_id").notNull(),
  isReady: boolean("is_ready").notNull().default(false),
  joinedAt: timestamp("joined_at").default(sql`NOW()`).notNull(),
});

export const insertPartyMemberSchema = createInsertSchema(partyMembers).omit({ id: true, joinedAt: true });
export type InsertPartyMember = z.infer<typeof insertPartyMemberSchema>;
export type PartyMember = typeof partyMembers.$inferSelect;

// ─── Game Events (append-only log) ────────────────────────────────────────────

export const gameEvents = pgTable("game_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partyId: varchar("party_id").notNull(),
  campaignId: varchar("campaign_id").notNull(),
  eventType: text("event_type").notNull(),
  actorId: varchar("actor_id"), // user_id or 'gm'
  payload: jsonb("payload").notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").default(sql`NOW()`).notNull(),
}, (t) => [
  index("idx_game_events_party").on(t.partyId, t.createdAt),
]);

export type GameEvent = typeof gameEvents.$inferSelect;

// ─── World State (snapshot) ───────────────────────────────────────────────────

export const worldState = pgTable("world_state", {
  partyId: varchar("party_id").primaryKey(),
  state: jsonb("state").notNull().default(sql`'{}'::jsonb`),
  turnNumber: integer("turn_number").notNull().default(0),
  updatedAt: timestamp("updated_at").default(sql`NOW()`).notNull(),
});

export type WorldState = typeof worldState.$inferSelect;

// ─── Scene Summaries ──────────────────────────────────────────────────────────

export const sceneSummaries = pgTable("scene_summaries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partyId: varchar("party_id").notNull(),
  summary: text("summary").notNull(),
  turnStart: integer("turn_start").notNull(),
  turnEnd: integer("turn_end").notNull(),
  createdAt: timestamp("created_at").default(sql`NOW()`).notNull(),
});

export type SceneSummary = typeof sceneSummaries.$inferSelect;

// ─── Chat Messages ────────────────────────────────────────────────────────────

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partyId: varchar("party_id").notNull(),
  userId: varchar("user_id"), // null for GM
  role: text("role").notNull(), // 'player', 'gm', 'system'
  content: text("content").notNull(),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").default(sql`NOW()`).notNull(),
}, (t) => [
  index("idx_chat_messages_party").on(t.partyId, t.createdAt),
]);

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, createdAt: true });
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

// ─── Location Scene Backgrounds ───────────────────────────────────────────────

export const locationScenes = pgTable("location_scenes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partyId: varchar("party_id").notNull(),
  locationName: text("location_name").notNull(),
  imageData: text("image_data").notNull(),
  createdAt: timestamp("created_at").default(sql`NOW()`).notNull(),
});

export const insertLocationSceneSchema = createInsertSchema(locationScenes).omit({ id: true, createdAt: true });
export type InsertLocationScene = z.infer<typeof insertLocationSceneSchema>;
export type LocationScene = typeof locationScenes.$inferSelect;

// ─── Arcs ─────────────────────────────────────────────────────────────────────

export const arcs = pgTable("arcs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partyId: varchar("party_id").notNull(),
  campaignId: varchar("campaign_id").notNull(),
  title: text("title").notNull(),
  goals: jsonb("goals").notNull().default(sql`'[]'::jsonb`),
  status: text("status").notNull().default("active"), // planned, active, completed, abandoned
  outcomeSummary: text("outcome_summary"),
  createdAt: timestamp("created_at").default(sql`NOW()`).notNull(),
});

export type Arc = typeof arcs.$inferSelect;
