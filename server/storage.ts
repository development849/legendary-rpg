import { db } from "./db";
import {
  characters, campaigns, parties, partyMembers, chatMessages,
  gameEvents, worldState, sceneSummaries, arcs,
  type Character, type InsertCharacter,
  type Campaign, type InsertCampaign,
  type Party, type InsertParty,
  type PartyMember, type InsertPartyMember,
  type ChatMessage, type InsertChatMessage,
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { getDefaultStats, getStartingInventory, getStartingAbilities, getBackgroundAbility, CLASS_BASE_HP, getRaceBonuses } from "./gameEngine";

// ─── Character Storage ─────────────────────────────────────────────────────────

export async function createCharacter(userId: string, data: {
  name: string; class: string; race: string; background: string; appearance?: string; backstory?: string;
  customBaseStats?: Record<string, number>;
}): Promise<Character> {
  const cls = data.class;
  const baseHp = CLASS_BASE_HP[cls] ?? 10;
  const baseStats = data.customBaseStats ?? getDefaultStats(cls);
  const raceBonuses = getRaceBonuses(data.race);
  const stats = Object.fromEntries(
    Object.entries(baseStats).map(([k, v]) => [k, v + (raceBonuses[k] ?? 0)])
  );
  const inventory = getStartingInventory(cls);
  const classAbilities = getStartingAbilities(cls);
  const backgroundAbility = getBackgroundAbility(data.background, cls);
  const abilities = [...classAbilities, backgroundAbility];

  const [char] = await db.insert(characters).values({
    userId,
    name: data.name,
    class: cls,
    race: data.race,
    background: data.background,
    appearance: data.appearance ?? "",
    backstory: data.backstory ?? "",
    level: 1,
    xp: 0,
    maxHp: baseHp,
    currentHp: baseHp,
    stats,
    skills: [],
    abilities,
    inventory,
    conditions: [],
    isRetired: false,
  }).returning();
  return char;
}

export async function getUserCharacters(userId: string): Promise<Character[]> {
  return db.select().from(characters)
    .where(and(eq(characters.userId, userId), eq(characters.isRetired, false)))
    .orderBy(desc(characters.createdAt));
}

export async function getCharacter(id: string): Promise<Character | undefined> {
  const [char] = await db.select().from(characters).where(eq(characters.id, id));
  return char;
}

export async function updateCharacter(id: string, data: Partial<Character>): Promise<Character> {
  const [char] = await db.update(characters).set(data).where(eq(characters.id, id)).returning();
  return char;
}

// ─── Campaign Storage ─────────────────────────────────────────────────────────

export async function createCampaign(ownerId: string, data: {
  name: string; description?: string; setting?: string;
  contentRating?: string; noRomance?: boolean; noHorror?: boolean;
  fadeToBlack?: boolean; gmMode?: string; stylePack?: string;
}): Promise<Campaign> {
  const [campaign] = await db.insert(campaigns).values({
    ownerId,
    ...data,
  }).returning();
  return campaign;
}

export async function getCampaign(id: string): Promise<Campaign | undefined> {
  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
  return campaign;
}

export async function getUserCampaigns(userId: string): Promise<Campaign[]> {
  return db.select().from(campaigns)
    .where(eq(campaigns.ownerId, userId))
    .orderBy(desc(campaigns.createdAt));
}

// ─── Party Storage ─────────────────────────────────────────────────────────────

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function createParty(campaignId: string, name: string): Promise<Party> {
  const [party] = await db.insert(parties).values({
    campaignId,
    name,
    inviteCode: generateInviteCode(),
    status: "lobby",
  }).returning();
  return party;
}

export async function getParty(id: string): Promise<Party | undefined> {
  const [party] = await db.select().from(parties).where(eq(parties.id, id));
  return party;
}

export async function getPartyByInviteCode(code: string): Promise<Party | undefined> {
  const [party] = await db.select().from(parties).where(eq(parties.inviteCode, code));
  return party;
}

export async function getCampaignParties(campaignId: string): Promise<Party[]> {
  return db.select().from(parties)
    .where(eq(parties.campaignId, campaignId))
    .orderBy(desc(parties.createdAt));
}

export async function getUserParties(userId: string): Promise<any[]> {
  const members = await db.select().from(partyMembers).where(eq(partyMembers.userId, userId));
  const partyIds = members.map(m => m.partyId);
  if (!partyIds.length) return [];

  const result = [];
  for (const pid of partyIds) {
    const [p] = await db.select().from(parties).where(eq(parties.id, pid));
    if (p) {
      const [c] = await db.select().from(campaigns).where(eq(campaigns.id, p.campaignId));
      result.push({ ...p, campaign: c });
    }
  }
  return result;
}

// ─── Party Member Storage ─────────────────────────────────────────────────────

export async function joinParty(partyId: string, userId: string, characterId: string): Promise<PartyMember> {
  // Check if already a member
  const existing = await db.select().from(partyMembers)
    .where(and(eq(partyMembers.partyId, partyId), eq(partyMembers.userId, userId)));
  if (existing.length > 0) {
    return existing[0];
  }

  const [member] = await db.insert(partyMembers).values({
    partyId, userId, characterId, isReady: false,
  }).returning();

  // Initialize world state if first member
  const existing_ws = await db.select().from(worldState).where(eq(worldState.partyId, partyId));
  if (!existing_ws.length) {
    await db.insert(worldState).values({
      partyId,
      state: {},
      turnNumber: 0,
    });
  }

  return member;
}

export async function getPartyMembers(partyId: string): Promise<any[]> {
  const members = await db.select().from(partyMembers).where(eq(partyMembers.partyId, partyId));
  const result = [];
  for (const m of members) {
    const [char] = await db.select().from(characters).where(eq(characters.id, m.characterId));
    result.push({ ...m, character: char });
  }
  return result;
}

export async function setMemberReady(partyId: string, userId: string, isReady: boolean): Promise<void> {
  await db.update(partyMembers)
    .set({ isReady })
    .where(and(eq(partyMembers.partyId, partyId), eq(partyMembers.userId, userId)));
}

// ─── Chat Message Storage ─────────────────────────────────────────────────────

export async function saveChatMessage(data: InsertChatMessage): Promise<ChatMessage> {
  const [msg] = await db.insert(chatMessages).values(data).returning();
  return msg;
}

export async function getPartyMessages(partyId: string, limit = 50): Promise<ChatMessage[]> {
  return db.select().from(chatMessages)
    .where(eq(chatMessages.partyId, partyId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit)
    .then(rows => rows.reverse());
}

// ─── World State ──────────────────────────────────────────────────────────────

export async function getWorldState(partyId: string) {
  const [ws] = await db.select().from(worldState).where(eq(worldState.partyId, partyId));
  return ws;
}
