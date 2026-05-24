import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, timestamp, boolean, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

// ─── Eras / Settings ──────────────────────────────────────────────────────────
// Shared between character + campaign creation, AI prompts, and join-time warnings.

export const ERAS = [
  {
    id: "high-fantasy",
    label: "High Fantasy",
    blurb: "Swords, sorcery, dragons. Classic medieval magic.",
    promptHint: "high fantasy (medieval swords, sorcery, dragons, knights, wizards)",
  },
  {
    id: "dark-ages",
    label: "Dark Ages",
    blurb: "Gritty sword & sorcery. Low magic, hard living.",
    promptHint: "dark ages sword & sorcery (gritty medieval, low magic, grim, weathered)",
  },
  {
    id: "steampunk",
    label: "Steampunk",
    blurb: "Victorian gears, brass, steam, and clockwork.",
    promptHint: "steampunk victorian (brass gears, steam machinery, top hats, goggles, clockwork)",
  },
  {
    id: "modern",
    label: "Modern Day",
    blurb: "Present day. Phones, cars, suits, denim.",
    promptHint: "modern day contemporary (smartphones, cars, jeans, jackets, urban)",
  },
  {
    id: "cyberpunk",
    label: "Cyberpunk",
    blurb: "Neon-lit megacities. Implants, corps, rain.",
    promptHint: "cyberpunk near-future (neon city, cybernetic implants, megacorps, rain, holograms)",
  },
  {
    id: "sci-fi",
    label: "Sci-Fi",
    blurb: "Starships, alien worlds, energy weapons.",
    promptHint: "science fiction space opera (starships, alien worlds, energy weapons, futuristic)",
  },
  {
    id: "post-apocalyptic",
    label: "Post-Apocalyptic",
    blurb: "Ruined world. Scavenged gear. Hard choices.",
    promptHint: "post-apocalyptic wasteland (ruined cities, scavenged gear, dust, makeshift armour)",
  },
  {
    id: "weird-west",
    label: "Weird West",
    blurb: "Six-guns, dust, and frontier spirits.",
    promptHint: "weird west frontier (six-guns, dusters, saloons, frontier towns, dark folk magic)",
  },
  {
    id: "custom",
    label: "Custom",
    blurb: "Describe your own setting.",
    promptHint: "custom setting",
  },
] as const;

export type EraId = typeof ERAS[number]["id"];

export function getEra(id: string | null | undefined) {
  return ERAS.find(e => e.id === id) ?? ERAS[0];
}

// Genre → Era map. Genre is now the authoritative setting selector in the UI;
// era is derived from it server-side so existing era-based prompts (portrait,
// backstory, GM context) automatically match the chosen genre.
export const GENRE_TO_ERA: Record<string, EraId> = {
  fantasy: "high-fantasy",
  scifi: "sci-fi",
  cyberpunk: "cyberpunk",
  supernatural: "modern",
  postapoc: "post-apocalyptic",
  cosmichorror: "modern",
  superhero: "modern",
  steampunk: "steampunk",
  weirdwest: "weird-west",
};

export function eraIdForGenre(genreId: string | null | undefined): EraId {
  if (!genreId) return "high-fantasy";
  return GENRE_TO_ERA[genreId] ?? "high-fantasy";
}

// ─── Characters ───────────────────────────────────────────────────────────────

export const characters = pgTable("characters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  class: text("class").notNull(), // fighter, rogue, wizard, cleric
  race: text("race").notNull(),
  gender: text("gender").default(""),
  background: text("background").notNull(),
  era: text("era").notNull().default("high-fantasy"),
  genre: text("genre").notNull().default("fantasy"),
  appearance: text("appearance").default(""),
  backstory: text("backstory").default(""),
  profilePicture: text("profile_picture").default(""),
  level: integer("level").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  maxHp: integer("max_hp").notNull().default(10),
  currentHp: integer("current_hp").notNull().default(10),
  maxMp: integer("max_mp").notNull().default(0),
  currentMp: integer("current_mp").notNull().default(0),
  stats: jsonb("stats").notNull().default(sql`'{}'::jsonb`), // might, agility, endurance, intellect, will, presence
  skills: jsonb("skills").notNull().default(sql`'[]'::jsonb`),
  abilities: jsonb("abilities").notNull().default(sql`'[]'::jsonb`),
  inventory: jsonb("inventory").notNull().default(sql`'[]'::jsonb`),
  conditions: jsonb("conditions").notNull().default(sql`'[]'::jsonb`),
  achievements: jsonb("achievements").notNull().default(sql`'[]'::jsonb`),
  unclaimedLevelUps: integer("unclaimed_level_ups").notNull().default(0),
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
  era: text("era").notNull().default("high-fantasy"),
  genre: text("genre").notNull().default("fantasy"),
  worldName: text("world_name"),
  worldDescription: text("world_description"),
  worldImage: text("world_image"),
  worldSeed: text("world_seed"),
  contentRating: text("content_rating").notNull().default("pg13"),
  themes: jsonb("themes").notNull().default(sql`'[]'::jsonb`),
  noRomance: boolean("no_romance").notNull().default(false),
  noHorror: boolean("no_horror").notNull().default(false),
  fadeToBlack: boolean("fade_to_black").notNull().default(true),
  gmMode: text("gm_mode").notNull().default("balanced"),
  npcControl: text("npc_control").notNull().default("gm"),
  physicalDice: boolean("physical_dice").notNull().default(false),
  stylePack: text("style_pack").notNull().default("luminous_painterly_fantasy"),
  soundtrackEnabled: boolean("soundtrack_enabled").notNull().default(true),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").default(sql`NOW()`).notNull(),
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({ id: true, createdAt: true });
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;

// ─── Campaign Soundtracks ────────────────────────────────────────────────────

export const campaignSoundtracks = pgTable("campaign_soundtracks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull(),
  mood: text("mood").notNull(),
  musicalParams: jsonb("musical_params").notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").default(sql`NOW()`).notNull(),
}, (t) => [
  uniqueIndex("campaign_soundtracks_campaign_mood_idx").on(t.campaignId, t.mood),
]);

export const insertCampaignSoundtrackSchema = createInsertSchema(campaignSoundtracks).omit({ id: true, createdAt: true });
export type InsertCampaignSoundtrack = z.infer<typeof insertCampaignSoundtrackSchema>;
export type CampaignSoundtrack = typeof campaignSoundtracks.$inferSelect;

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
  mapImageData: text("map_image_data"),
  mapCoords: jsonb("map_coords").default(sql`'{}'::jsonb`),
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

// ─── Session Feedback ─────────────────────────────────────────────────────────

export const sessionFeedback = pgTable("session_feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  partyId: varchar("party_id"),
  campaignId: varchar("campaign_id"),
  rating: integer("rating").notNull(), // 1-5
  category: text("category").notNull().default("general"), // bug, balance, narrative, ux, general
  comment: text("comment").notNull().default(""),
  createdAt: timestamp("created_at").default(sql`NOW()`).notNull(),
}, (t) => [
  index("idx_session_feedback_created").on(t.createdAt),
]);

export const insertSessionFeedbackSchema = createInsertSchema(sessionFeedback).omit({ id: true, createdAt: true });
export type InsertSessionFeedback = z.infer<typeof insertSessionFeedbackSchema>;
export type SessionFeedback = typeof sessionFeedback.$inferSelect;

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

// ─── Character Situations (per-character narrative state for split-party tracking) ─────────

export const characterSituations = pgTable("character_situations", {
  partyId: varchar("party_id").notNull(),
  characterId: varchar("character_id").notNull().primaryKey(),
  location: text("location").notNull().default("Unknown"),
  situation: text("situation").notNull().default(""),
  activeNpcs: jsonb("active_npcs").notNull().default(sql`'[]'::jsonb`),
  companions: jsonb("companions").notNull().default(sql`'[]'::jsonb`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`).notNull(),
});

export type CharacterSituation = typeof characterSituations.$inferSelect;

// ─── NPC Log (named characters encountered) ───────────────────────────────────

export const npcLog = pgTable("npc_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partyId: varchar("party_id").notNull(),
  name: text("name").notNull(),
  pronouns: text("pronouns").notNull().default("they/them"),
  role: text("role").notNull().default(""),
  description: text("description").notNull().default(""),
  lastSeen: text("last_seen").notNull().default(""),
  relationship: text("relationship").notNull().default("neutral"),
  notes: text("notes").notNull().default(""),
  portrait: text("portrait"),
  isPartyMember: boolean("is_party_member").notNull().default(false),
  partyJoinedAt: timestamp("party_joined_at"),
  level: integer("level").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  maxHp: integer("max_hp").notNull().default(10),
  currentHp: integer("current_hp").notNull().default(10),
  ac: integer("ac").notNull().default(10),
  stats: jsonb("stats").notNull().default(sql`'{}'::jsonb`),
  abilities: jsonb("abilities").notNull().default(sql`'[]'::jsonb`),
  inventory: jsonb("inventory").notNull().default(sql`'[]'::jsonb`),
  firstMet: timestamp("first_met").default(sql`NOW()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`NOW()`).notNull(),
}, (t) => [uniqueIndex("npc_log_party_name_idx").on(t.partyId, t.name)]);

export type NpcEntry = typeof npcLog.$inferSelect;

// ─── Friendships ─────────────────────────────────────────────────────────────

export const friendships = pgTable("friendships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requesterId: varchar("requester_id").notNull(),
  addresseeId: varchar("addressee_id").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").default(sql`NOW()`).notNull(),
}, (t) => [
  uniqueIndex("friendships_pair_idx").on(t.requesterId, t.addresseeId),
  index("friendships_addressee_idx").on(t.addresseeId),
]);

export const insertFriendshipSchema = createInsertSchema(friendships).omit({ id: true, createdAt: true });
export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;
export type Friendship = typeof friendships.$inferSelect;

// ─── Location Maps (dungeon/town/delve maps saved per location) ──────────────

export const locationMaps = pgTable("location_maps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partyId: varchar("party_id").notNull(),
  locationName: text("location_name").notNull(),
  locationType: text("location_type").notNull().default("generic"),
  mapImageData: text("map_image_data").notNull(),
  pointsOfInterest: jsonb("points_of_interest").notNull().default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at").default(sql`NOW()`).notNull(),
}, (t) => [
  uniqueIndex("location_maps_party_location_idx").on(t.partyId, t.locationName),
]);

export const insertLocationMapSchema = createInsertSchema(locationMaps).omit({ id: true, createdAt: true });
export type InsertLocationMap = z.infer<typeof insertLocationMapSchema>;
export type LocationMap = typeof locationMaps.$inferSelect;

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
