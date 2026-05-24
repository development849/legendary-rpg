import { db } from "./db";
import {
  characters, campaigns, parties, partyMembers, chatMessages,
  gameEvents, worldState, sceneSummaries, arcs, friendships, users, locationScenes,
  campaignSoundtracks,
  type Character, type InsertCharacter,
  type Campaign, type InsertCampaign,
  type Party, type InsertParty,
  type PartyMember, type InsertPartyMember,
  type ChatMessage, type InsertChatMessage,
  type Friendship,
  type CampaignSoundtrack,
  eraIdForGenre,
} from "@shared/schema";
import { eq, and, or, desc, sql, ilike } from "drizzle-orm";
import { randomUUID } from "crypto";
import { getBackgroundAbility } from "./gameEngine";
import {
  DEFAULT_GENRE_ID,
  getClassBaseHp,
  getClassBaseMp,
  getDefaultStatsForClass,
  getStartingInventoryForClass,
  getStartingInventoryForRace,
  getStartingAbilitiesForClass,
  getRaceBonusesFor,
} from "@shared/genres";

// ─── Character Storage ─────────────────────────────────────────────────────────

export async function createCharacter(userId: string, data: {
  name: string; class: string; race: string; background: string; appearance?: string; backstory?: string;
  customBaseStats?: Record<string, number>; gender?: string; era?: string; genre?: string;
}): Promise<Character> {
  const cls = data.class;
  const genre = data.genre ?? DEFAULT_GENRE_ID;
  const baseHp = getClassBaseHp(genre, cls);
  const baseMp = getClassBaseMp(genre, cls);
  const baseStats = data.customBaseStats ?? getDefaultStatsForClass(genre, cls);
  const raceBonuses = getRaceBonusesFor(genre, data.race);
  const stats = Object.fromEntries(
    Object.entries(baseStats).map(([k, v]) => [k, v + (raceBonuses[k] ?? 0)])
  );
  const inventory = [
    ...getStartingInventoryForClass(genre, cls),
    ...getStartingInventoryForRace(genre, data.race),
  ];
  const classAbilities = getStartingAbilitiesForClass(genre, cls);
  const backgroundAbility = getBackgroundAbility(data.background, cls);
  const abilities = [...classAbilities, backgroundAbility];

  const [char] = await db.insert(characters).values({
    userId,
    name: data.name,
    class: cls,
    race: data.race,
    background: data.background,
    era: eraIdForGenre(genre),
    genre,
    appearance: data.appearance ?? "",
    backstory: data.backstory ?? "",
    gender: data.gender ?? "",
    level: 1,
    xp: 0,
    maxHp: baseHp,
    currentHp: baseHp,
    maxMp: baseMp,
    currentMp: baseMp,
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
  worldName?: string | null; worldDescription?: string | null;
  worldSeed?: string | null;
  themes?: string[];
  contentRating?: string; noRomance?: boolean; noHorror?: boolean;
  fadeToBlack?: boolean; gmMode?: string; stylePack?: string;
  npcControl?: string; era?: string; genre?: string;
}): Promise<Campaign> {
  const [campaign] = await db.insert(campaigns).values({
    ownerId,
    name: data.name,
    description: data.description,
    setting: data.setting,
    era: eraIdForGenre(data.genre ?? DEFAULT_GENRE_ID),
    genre: data.genre ?? DEFAULT_GENRE_ID,
    worldName: data.worldName ?? null,
    worldDescription: data.worldDescription ?? null,
    worldSeed: data.worldSeed ?? null,
    themes: data.themes ?? [],
    contentRating: data.contentRating,
    noRomance: data.noRomance,
    noHorror: data.noHorror,
    fadeToBlack: data.fadeToBlack,
    gmMode: data.gmMode,
    stylePack: data.stylePack,
    npcControl: data.npcControl,
  }).returning();
  return campaign;
}

export async function getCampaign(id: string): Promise<Campaign | undefined> {
  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
  return campaign;
}

export async function updateCampaign(id: string, data: Partial<{ contentRating: string; noRomance: boolean; noHorror: boolean; fadeToBlack: boolean; gmMode: string; themes: string[]; npcControl: string; soundtrackEnabled: boolean; name: string; physicalDice: boolean }>): Promise<Campaign | undefined> {
  const [updated] = await db.update(campaigns).set(data).where(eq(campaigns.id, id)).returning();
  return updated;
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
      const [scene] = await db.select({ imageData: locationScenes.imageData })
        .from(locationScenes)
        .where(eq(locationScenes.partyId, pid))
        .orderBy(locationScenes.createdAt)
        .limit(1);
      result.push({ ...p, campaign: c, thumbnail: scene?.imageData ?? null });
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

// ─── Friendship Storage ──────────────────────────────────────────────────────

export async function sendFriendRequest(requesterId: string, addresseeId: string): Promise<Friendship> {
  const existing = await db.select().from(friendships).where(
    or(
      and(eq(friendships.requesterId, requesterId), eq(friendships.addresseeId, addresseeId)),
      and(eq(friendships.requesterId, addresseeId), eq(friendships.addresseeId, requesterId)),
    )
  );
  if (existing.length > 0) {
    const f = existing[0];
    if (f.status === "accepted") throw new Error("Already friends");
    if (f.status === "pending") throw new Error("Friend request already pending");
    if (f.status === "declined") {
      const [updated] = await db.update(friendships)
        .set({ status: "pending", requesterId, addresseeId })
        .where(eq(friendships.id, f.id))
        .returning();
      return updated;
    }
  }
  const [friendship] = await db.insert(friendships).values({
    requesterId,
    addresseeId,
    status: "pending",
  }).returning();
  return friendship;
}

export async function acceptFriendRequest(friendshipId: string, userId: string): Promise<Friendship> {
  const [f] = await db.select().from(friendships).where(eq(friendships.id, friendshipId));
  if (!f) throw new Error("Friend request not found");
  if (f.addresseeId !== userId) throw new Error("Only the recipient can accept");
  if (f.status !== "pending") throw new Error("Request is not pending");
  const [updated] = await db.update(friendships)
    .set({ status: "accepted" })
    .where(eq(friendships.id, friendshipId))
    .returning();
  return updated;
}

export async function declineFriendRequest(friendshipId: string, userId: string): Promise<void> {
  const [f] = await db.select().from(friendships).where(eq(friendships.id, friendshipId));
  if (!f) throw new Error("Friend request not found");
  if (f.addresseeId !== userId) throw new Error("Only the recipient can decline");
  await db.update(friendships)
    .set({ status: "declined" })
    .where(eq(friendships.id, friendshipId));
}

export async function removeFriend(friendshipId: string, userId: string): Promise<void> {
  const [f] = await db.select().from(friendships).where(eq(friendships.id, friendshipId));
  if (!f) throw new Error("Friendship not found");
  if (f.requesterId !== userId && f.addresseeId !== userId) throw new Error("Not your friendship");
  await db.delete(friendships).where(eq(friendships.id, friendshipId));
}

export async function getFriends(userId: string): Promise<Array<Friendship & { friend: { id: string; username: string | null; profileImageUrl: string | null } }>> {
  const rows = await db.select().from(friendships).where(
    and(
      or(eq(friendships.requesterId, userId), eq(friendships.addresseeId, userId)),
      eq(friendships.status, "accepted"),
    )
  );
  const result = [];
  for (const f of rows) {
    const friendId = f.requesterId === userId ? f.addresseeId : f.requesterId;
    const [u] = await db.select({ id: users.id, username: users.username, profileImageUrl: users.profileImageUrl })
      .from(users).where(eq(users.id, friendId));
    if (u) result.push({ ...f, friend: u });
  }
  return result;
}

export async function getPendingRequests(userId: string): Promise<Array<Friendship & { from: { id: string; username: string | null; profileImageUrl: string | null } }>> {
  const rows = await db.select().from(friendships).where(
    and(eq(friendships.addresseeId, userId), eq(friendships.status, "pending"))
  );
  const result = [];
  for (const f of rows) {
    const [u] = await db.select({ id: users.id, username: users.username, profileImageUrl: users.profileImageUrl })
      .from(users).where(eq(users.id, f.requesterId));
    if (u) result.push({ ...f, from: u });
  }
  return result;
}

export async function getSentRequests(userId: string): Promise<Array<Friendship & { to: { id: string; username: string | null; profileImageUrl: string | null } }>> {
  const rows = await db.select().from(friendships).where(
    and(eq(friendships.requesterId, userId), eq(friendships.status, "pending"))
  );
  const result = [];
  for (const f of rows) {
    const [u] = await db.select({ id: users.id, username: users.username, profileImageUrl: users.profileImageUrl })
      .from(users).where(eq(users.id, f.addresseeId));
    if (u) result.push({ ...f, to: u });
  }
  return result;
}

export async function searchUsers(query: string, excludeUserId: string): Promise<Array<{ id: string; username: string | null; profileImageUrl: string | null }>> {
  if (!query || query.length < 2) return [];
  return db.select({ id: users.id, username: users.username, profileImageUrl: users.profileImageUrl })
    .from(users)
    .where(and(
      ilike(users.username, `%${query}%`),
      sql`${users.id} != ${excludeUserId}`,
    ))
    .limit(10);
}

// ─── Campaign Soundtrack Storage ──────────────────────────────────────────────

export async function getCampaignSoundtracks(campaignId: string): Promise<CampaignSoundtrack[]> {
  return db.select().from(campaignSoundtracks)
    .where(eq(campaignSoundtracks.campaignId, campaignId));
}

export async function saveCampaignSoundtrack(campaignId: string, mood: string, musicalParams: any): Promise<CampaignSoundtrack> {
  const existing = await db.select().from(campaignSoundtracks)
    .where(and(eq(campaignSoundtracks.campaignId, campaignId), eq(campaignSoundtracks.mood, mood)));
  if (existing.length > 0) {
    const [updated] = await db.update(campaignSoundtracks)
      .set({ musicalParams })
      .where(eq(campaignSoundtracks.id, existing[0].id))
      .returning();
    return updated;
  }
  const [row] = await db.insert(campaignSoundtracks).values({ campaignId, mood, musicalParams }).returning();
  return row;
}

export async function deleteCampaignSoundtracks(campaignId: string): Promise<void> {
  await db.delete(campaignSoundtracks).where(eq(campaignSoundtracks.campaignId, campaignId));
}
