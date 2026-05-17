import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { setupLocalAuth, registerLocalAuthRoutes } from "./localAuth";
import { requireAuth, getUserId, getCurrentUser } from "./authMiddleware";
import {
  createCharacter, getUserCharacters, getCharacter, updateCharacter,
  createCampaign, getCampaign, getUserCampaigns, updateCampaign,
  createParty, getParty, getPartyByInviteCode, getCampaignParties, getUserParties,
  joinParty, getPartyMembers, setMemberReady,
  saveChatMessage, getPartyMessages, getWorldState,
  sendFriendRequest, acceptFriendRequest, declineFriendRequest, removeFriend,
  getFriends, getPendingRequests, getSentRequests, searchUsers,
  getCampaignSoundtracks, saveCampaignSoundtrack,
} from "./storage";
import { rollDice, parseDieString, enforceHandLimits } from "./gameEngine";
import { runGM, generateLocationBackground, generateCampaignWorldImage, generateRegionMap, generateLocationMap, isLocationMapGenerating, assignLocationCoords, assignAllLocationCoords, isCoinItem, consolidateCoins, sortInventory, generateSoundtrackProfiles } from "./gmOrchestrator";
import { registerAdminRoutes } from "./adminRoutes";
import { db } from "./db";
import { characters, characters as charsTable, locationScenes, locationMaps, partyMembers, characterSituations, parties, campaigns, chatMessages, gameEvents, worldState, sceneSummaries, npcLog, arcs, campaignSoundtracks } from "@shared/schema";
import { eq, and, desc, inArray, gt, gte, sql } from "drizzle-orm";

// WebSocket connections per party
const partyConnections = new Map<string, Set<WebSocket>>();

function detectLocationType(name: string): string {
  const n = name.toLowerCase();
  if (/crypt|tomb|catacomb|mausoleum/.test(n)) return "crypt";
  if (/dungeon|lair|stronghold/.test(n)) return "dungeon";
  if (/cave|cavern|grotto|mine|quarry/.test(n)) return "cave";
  if (/castle|fortress|citadel|keep|tower/.test(n)) return "castle";
  if (/town|city|village|hamlet|market|gate|district/.test(n)) return "town";
  if (/forest|wood|grove|thicket|wilder/.test(n)) return "forest";
  if (/temple|shrine|sanctuary|chapel/.test(n)) return "dungeon";
  if (/ruin|ancient|abandoned/.test(n)) return "dungeon";
  return "generic";
}

function broadcastToParty(partyId: string, data: any) {
  const connections = partyConnections.get(partyId);
  if (!connections) return;
  const msg = JSON.stringify(data);
  Array.from(connections).forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  });
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Auth — Replit OIDC
  await setupAuth(app);
  // Note: registerAuthRoutes is intentionally skipped; /api/auth/user is handled below
  // Auth — Local email/password
  setupLocalAuth(app);
  registerLocalAuthRoutes(app);

  // Admin panel routes
  registerAdminRoutes(app);

  // Unified /api/auth/user — works for both local and Replit auth
  app.get("/api/auth/user", requireAuth, async (req: any, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user);
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ── Characters ──────────────────────────────────────────────────────────────

  app.get("/api/characters", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const chars = await getUserCharacters(userId);
      res.json(chars);
    } catch (e) { res.status(500).json({ error: "Failed to get characters" }); }
  });

  app.post("/api/characters/generate-backstory", requireAuth, async (req: any, res) => {
    try {
      const { name, cls, race, background, personality, motivation, flaw, gender, era } = req.body;
      if (!cls || !race || !background) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const { ERAS: ERAS_ALLOW } = await import("@shared/schema");
      if (era !== undefined && era !== null && !ERAS_ALLOW.some(e => e.id === era)) {
        return res.status(400).json({ error: "Invalid era" });
      }

      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      const pronounMap: Record<string, string> = {
        male: "he/him/his",
        female: "she/her/hers",
        "non-binary": "they/them/theirs",
        agender: "they/them/theirs",
        genderfluid: "they/them/theirs",
      };
      const pronouns = gender && pronounMap[gender] ? pronounMap[gender] : null;
      const genderLabel = gender && gender !== "prefer-not-to-say" ? gender : null;

      const { getEra } = await import("@shared/schema");
      const eraDef = getEra(era);

      const prompt = [
        `Write a compelling 2–3 paragraph backstory for an RPG character set in ${eraDef.promptHint}.`,
        `Setting era: ${eraDef.label} — ${eraDef.blurb}`,
        `Use clothing, technology, vocabulary, locations, and references appropriate to this era.`,
        ``,
        `Character details:`,
        `Name: ${name || "Unknown"}`,
        `Race: ${race}`,
        `Class: ${cls}`,
        genderLabel ? `Gender: ${genderLabel}` : null,
        pronouns ? `Pronouns: ${pronouns} — you MUST use these pronouns consistently throughout the backstory.` : null,
        `Background: ${background}`,
        personality ? `Personality traits: ${personality}` : null,
        motivation ? `Core motivation: ${motivation}` : null,
        flaw ? `Flaw or dark secret: ${flaw}` : null,
        ``,
        `Write in third person. Make it vivid and immersive, true to the ${eraDef.label} setting. Focus on formative events, key relationships, and the moment that set them on an adventuring path. Do not include game stats or mechanics. 2–3 paragraphs only.${pronouns ? ` Use the character's specified pronouns (${pronouns}) throughout — never use opposite-gender pronouns.` : ""}`,
      ].filter(Boolean).join("\n");

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 400,
        temperature: 0.85,
      });

      const backstory = completion.choices[0]?.message?.content?.trim() ?? "";
      res.json({ backstory });
    } catch (e: any) {
      console.error("Backstory generation error:", e);
      res.status(500).json({ error: "Failed to generate backstory" });
    }
  });

  app.get("/api/game/class-defaults/:cls", (req, res) => {
    const { getDefaultStats, CLASS_BASE_HP } = require("./gameEngine");
    const cls = req.params.cls;
    res.json({ stats: getDefaultStats(cls), hp: CLASS_BASE_HP[cls] ?? 10 });
  });

  app.post("/api/characters", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const { name, class: cls, race, background, appearance, backstory, customBaseStats, gender, era } = req.body;
      if (!name || !cls || !race || !background) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const { ERAS: ERAS_ALLOW } = await import("@shared/schema");
      if (era !== undefined && era !== null && !ERAS_ALLOW.some(e => e.id === era)) {
        return res.status(400).json({ error: "Invalid era" });
      }
      const char = await createCharacter(userId, { name, class: cls, race, background, appearance, backstory, customBaseStats, gender, era });
      res.status(201).json(char);
    } catch (e) { res.status(500).json({ error: "Failed to create character" }); }
  });

  app.get("/api/characters/:id", requireAuth, async (req: any, res) => {
    try {
      const char = await getCharacter(req.params.id);
      if (!char) return res.status(404).json({ error: "Not found" });
      res.json(char);
    } catch (e) { res.status(500).json({ error: "Failed to get character" }); }
  });

  app.delete("/api/characters/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const char = await getCharacter(req.params.id);
      if (!char) return res.status(404).json({ error: "Character not found" });
      if (char.userId !== userId) return res.status(403).json({ error: "Not your character" });
      await db.delete(partyMembers).where(eq(partyMembers.characterId, char.id));
      await db.delete(characterSituations).where(eq(characterSituations.characterId, char.id));
      await db.delete(characters).where(eq(characters.id, char.id));
      res.json({ success: true });
    } catch (e) {
      console.error("Delete character error:", e);
      res.status(500).json({ error: "Failed to delete character" });
    }
  });

  app.post("/api/characters/:id/generate-portrait", requireAuth, async (req: any, res) => {
    try {
      const char = await getCharacter(req.params.id);
      if (!char) return res.status(404).json({ error: "Character not found" });

      const { appearanceDetails } = req.body;

      const { GoogleGenAI, Modality } = await import("@google/genai");
      const ai = new GoogleGenAI({
        apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
        httpOptions: {
          apiVersion: "",
          baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
        },
      });

      const stats = (char.stats as Record<string, number>) || {};

      const { getEra } = await import("@shared/schema");
      const eraDef = getEra((char as any).era);
      const isFantasy = eraDef.id === "high-fantasy" || eraDef.id === "dark-ages";

      const classOutfitMap: Record<string, string> = {
        fighter: "storied full plate armour with engraved pauldrons, a longsword at their hip",
        barbarian: "fur-trimmed leather vest, runic tribal tattoos, athletic muscular build",
        rogue: "fitted dark leather traveller's coat, hood half-raised, swift agile posture",
        wizard: "flowing arcane robes with glowing sigils, long elegant sleeves, a mystical tome nearby",
        cleric: "ornate ceremonial vestments with holy emblems embossed in gold, radiant light at their hands",
        ranger: "layered forest leather, a recurve bow over one shoulder, weathered travelling cloaks",
        paladin: "shining ceremonial plate adorned with sacred emblems, a faint aura of divine light",
        bard: "flamboyant traveller's coat with fine embroidery, charismatic poised bearing",
      };

      const backgroundAtmosphereMap: Record<string, string> = {
        soldier: "a weathered military camp at night, distant torchlight, regimental banners in a dramatic sky",
        criminal: "rain-slicked cobblestone alley, dim lantern glow, atmospheric urban shadows",
        scholar: "ancient candlelit library, spiralling stone arches, dusty arcane manuscripts",
        noble: "opulent palace interior, arched stone columns, silk drapes, candlelit chandeliers",
        hunter: "misty forest edge at dusk, gnarled ancient trees, fading golden amber light",
        hermit: "remote mountain cliffside, vast starlit sky, wind-swept rocky landscape",
        acolyte: "sacred temple interior, coloured light streaming through high stained windows",
        merchant: "grand bazaar at twilight, rich fabrics, lantern-lit market stalls",
        entertainer: "ornate theatre stage, velvet curtains, warm dramatic spotlighting",
        sailor: "a ship's prow at sea, churning ocean waves, salt-spray and open sky",
        folk_hero: "cobblestone village square at golden hour, warm community atmosphere",
        outlander: "vast ancient wilderness, towering rock formations, enormous dramatic sky",
      };

      const physique: string[] = [];
      if ((stats.might ?? 10) >= 15) physique.push("athletic powerful build, broad shoulders");
      if ((stats.agility ?? 10) >= 15) physique.push("lithe graceful posture, light on their feet");
      if ((stats.presence ?? 10) >= 15) physique.push("commanding charismatic bearing");
      if ((stats.intellect ?? 10) >= 15) physique.push("sharp perceptive gaze");
      if ((stats.will ?? 10) >= 15) physique.push("composed unwavering expression");

      const levelDesc = char.level >= 8 ? "legendary experienced" :
                        char.level >= 5 ? "seasoned" :
                        char.level >= 3 ? "capable young" :
                        "resolute novice";

      const appearanceParts = [
        char.appearance,
        physique.join(", "),
        appearanceDetails,
      ].filter(Boolean).join(", ");

      const outfitHint = isFantasy
        ? (classOutfitMap[char.class as string] ?? "detailed fantasy adventurer outfit")
        : `era-appropriate ${eraDef.label} outfit suited to a ${char.class}`;
      const bgAtmosphere = isFantasy
        ? (backgroundAtmosphereMap[char.background as string] ?? "dramatic fantasy environment with atmospheric depth")
        : `era-appropriate ${eraDef.label} setting`;

      const genderDesc = char.gender && char.gender !== "prefer-not-to-say"
        ? ` ${char.gender}` : "";
      const styleOpener = isFantasy
        ? `Cinematic fantasy portrait painting`
        : `Cinematic ${eraDef.label} portrait`;
      const styleCloser = isFantasy
        ? `painterly fine brushwork, cinematic depth of field, atmospheric bokeh background, portrait to waist framing, fantasy concept art, high quality illustration`
        : `cinematic depth of field, atmospheric bokeh background, portrait to waist framing, ${eraDef.promptHint}, high quality concept art`;
      const prompt = [
        `${styleOpener} of a${genderDesc} ${levelDesc} ${char.race} ${char.class} named ${char.name},`,
        `Setting era: ${eraDef.promptHint} — visuals, clothing, and props MUST match this era.`,
        appearanceParts ? `${appearanceParts},` : "",
        `wearing ${outfitHint},`,
        `set against ${bgAtmosphere},`,
        `ultra-detailed luminous digital painting, photorealistic expressive face, dramatic volumetric rim lighting,`,
        `deep cinematic colour palette with rich shadows and glowing highlights, intricate fabric and material detail,`,
        styleCloser,
      ].filter(Boolean).join(" ");

      const fs = await import("fs");
      const path = await import("path");
      const styleRefPath = path.join(process.cwd(), "attached_assets", "Snip20260221_1_1771705188223.png");
      const styleRefBase64 = isFantasy && fs.existsSync(styleRefPath)
        ? fs.readFileSync(styleRefPath).toString("base64")
        : null;

      const parts: any[] = [];
      if (styleRefBase64) {
        parts.push({ text: "Use this image as the visual style reference for the portrait you generate:" });
        parts.push({ inlineData: { mimeType: "image/png", data: styleRefBase64 } });
      }
      parts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: "gemini-3-pro-image-preview",
        contents: [{ role: "user", parts }],
        config: { responseModalities: [Modality.TEXT, Modality.IMAGE] },
      });

      const imagePart = response.candidates?.[0]?.content?.parts?.find(
        (p: any) => p.inlineData?.data
      );

      if (!imagePart?.inlineData?.data) {
        return res.status(500).json({ error: "No image returned" });
      }

      const mimeType = imagePart.inlineData.mimeType || "image/png";
      const dataUrl = `data:${mimeType};base64,${imagePart.inlineData.data}`;
      res.json({ portrait: dataUrl });
    } catch (e: any) {
      console.error("Portrait generation error:", e);
      res.status(500).json({ error: "Failed to generate portrait" });
    }
  });

  app.patch("/api/characters/:id/name", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const char = await getCharacter(req.params.id);
      if (!char) return res.status(404).json({ error: "Not found" });
      if (char.userId !== userId) return res.status(403).json({ error: "Forbidden" });
      const { name } = req.body;
      if (typeof name !== "string" || !name.trim()) return res.status(400).json({ error: "Name required" });
      const updated = await updateCharacter(req.params.id, { name: name.trim() } as any);
      res.json(updated);
    } catch (e) {
      res.status(500).json({ error: "Failed to rename character" });
    }
  });

  app.patch("/api/characters/:id/portrait", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const char = await getCharacter(req.params.id);
      if (!char) return res.status(404).json({ error: "Not found" });
      if (char.userId !== userId) return res.status(403).json({ error: "Forbidden" });

      const { portrait } = req.body;
      if (!portrait) return res.status(400).json({ error: "Portrait data required" });

      const updated = await updateCharacter(req.params.id, { profilePicture: portrait } as any);
      res.json(updated);
    } catch (e) {
      res.status(500).json({ error: "Failed to save portrait" });
    }
  });

  app.patch("/api/characters/:id/appearance", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const char = await getCharacter(req.params.id);
      if (!char) return res.status(404).json({ error: "Not found" });
      if (char.userId !== userId) return res.status(403).json({ error: "Forbidden" });

      const { appearance } = req.body;
      if (typeof appearance !== "string") return res.status(400).json({ error: "Appearance text required" });

      const updated = await updateCharacter(req.params.id, { appearance } as any);
      res.json(updated);
    } catch (e) {
      res.status(500).json({ error: "Failed to save appearance" });
    }
  });

  app.patch("/api/characters/:id/level-up", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const char = await getCharacter(req.params.id);
      if (!char) return res.status(404).json({ error: "Not found" });
      if (char.userId !== userId) return res.status(403).json({ error: "Forbidden" });

      // LR-015: server-side XP / unclaimed-level-up verification.
      // Players may only spend stat points that were earned through XP.
      // The XP grant path bumps `level` first, then sets unclaimedLevelUps,
      // so by the time we get here the player's `level` already reflects the
      // earned tier. We verify they actually meet the XP threshold for the
      // level they currently hold (defense-in-depth alongside unclaimedLevelUps).
      const XP_THRESHOLDS = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000];
      const unclaimed = (char as any).unclaimedLevelUps ?? 0;
      const currentLevelThreshold = XP_THRESHOLDS[Math.max(0, char.level - 1)] ?? 0;
      if (unclaimed <= 0 || char.xp < currentLevelThreshold) {
        return res.status(403).json({ error: "No level-up available to claim." });
      }

      const { statAllocations, selectedSkills } = req.body;
      if (!statAllocations || typeof statAllocations !== "object") {
        return res.status(400).json({ error: "statAllocations required" });
      }

      const stats = { ...(char.stats as Record<string, number>) };
      const totalPoints = Object.values(statAllocations as Record<string, number>).reduce((sum: number, v: number) => sum + v, 0);
      if (totalPoints !== 2) {
        return res.status(400).json({ error: "Must allocate exactly 2 stat points" });
      }

      for (const [key, amount] of Object.entries(statAllocations as Record<string, number>)) {
        if (!["might", "agility", "endurance", "intellect", "will", "presence"].includes(key)) {
          return res.status(400).json({ error: `Invalid stat: ${key}` });
        }
        if (typeof amount !== "number" || amount < 0 || amount > 2) {
          return res.status(400).json({ error: `Invalid allocation for ${key}` });
        }
        stats[key] = (stats[key] ?? 10) + amount;
      }

      const existingSkills = (char.skills as any[]) ?? [];
      const existingIds = existingSkills.map((s: any) => s.id);
      let validatedSkills: any[] = [];
      if (selectedSkills && Array.isArray(selectedSkills)) {
        for (const sk of selectedSkills) {
          if (!sk.id || !sk.name || existingIds.includes(sk.id)) continue;
          validatedSkills.push({ id: sk.id, name: sk.name, description: sk.description ?? "", mechanicalEffect: sk.mechanicalEffect ?? "" });
        }
      }
      const newSkills = [...existingSkills, ...validatedSkills];

      // LR-015 race-safety: atomic conditional UPDATE — only succeeds if the
      // claim is still available. Two concurrent /level-up requests cannot
      // both decrement the same slot.
      const claimResult = await db
        .update(characters)
        .set({ stats, skills: newSkills, unclaimedLevelUps: sql`${characters.unclaimedLevelUps} - 1` })
        .where(and(eq(characters.id, req.params.id), gt(characters.unclaimedLevelUps, 0)))
        .returning();
      if (claimResult.length === 0) {
        return res.status(409).json({ error: "Level-up claim no longer available." });
      }
      const updated = claimResult[0];

      if (validatedSkills.length > 0) {
        const partyMember = await db.select().from(partyMembers)
          .where(eq(partyMembers.characterId, char.id));
        if (partyMember.length > 0) {
          broadcastToParty(partyMember[0].partyId, {
            type: "STATE_UPDATE",
            updates: [{ type: "SKILL_LEARNED", characterId: char.id, skills: validatedSkills }],
          });
        }
      }

      res.json(updated);
    } catch (e) {
      res.status(500).json({ error: "Failed to apply level-up" });
    }
  });

  app.patch("/api/characters/:id/equip", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const char = await getCharacter(req.params.id);
      if (!char) return res.status(404).json({ error: "Not found" });
      if (char.userId !== userId) return res.status(403).json({ error: "Forbidden" });

      const { itemIndex, equipped } = req.body;
      if (typeof itemIndex !== "number" || typeof equipped !== "boolean") {
        return res.status(400).json({ error: "itemIndex (number) and equipped (boolean) required" });
      }

      const inv = [...(char.inventory as any[])];
      if (itemIndex < 0 || itemIndex >= inv.length) {
        return res.status(400).json({ error: "Invalid item index" });
      }

      const item = inv[itemIndex];
      const equippableTypes = new Set([
        "weapon", "armor", "jewelry", "accessory", "ring", "amulet", "necklace",
        "bracelet", "trinket", "wondrous", "shell", "pendant", "brooch", "circlet", "crown", "tiara",
        "belt", "cloak", "cape", "boots", "gloves", "gauntlets", "helm", "helmet", "hat", "headband",
      ]);
      if (!equippableTypes.has(item.type)) {
        return res.status(400).json({ error: "Only weapons, armor, and jewelry can be equipped" });
      }

      const isJewelryLike = (t: string) => ["jewelry", "accessory", "ring", "amulet", "necklace", "bracelet", "trinket", "wondrous", "shell", "pendant", "brooch", "circlet", "crown", "tiara"].includes(t);
      const isArmorLike = (t: string) => ["armor", "belt", "cloak", "cape", "boots", "gloves", "gauntlets", "helm", "helmet", "hat", "headband"].includes(t);

      if (equipped && (isArmorLike(item.type) || isJewelryLike(item.type))) {
        const getEquipSlot = (it: any): string | null => {
          if (it.properties?.slot) return it.properties.slot;
          if (it.type === "armor" && it.properties?.ac) return "body";
          if (it.type === "armor" && it.properties?.ac_bonus) return null;
          if (it.type === "amulet" || it.type === "necklace" || it.type === "pendant") return "necklace";
          if (it.type === "ring") return "ring";
          if (it.type === "helm" || it.type === "helmet" || it.type === "hat" || it.type === "headband" || it.type === "circlet" || it.type === "crown" || it.type === "tiara") return "head";
          if (it.type === "belt") return "waist";
          if (it.type === "cloak" || it.type === "cape") return "back";
          if (it.type === "boots") return "feet";
          if (it.type === "gloves" || it.type === "gauntlets") return "hands";
          if (it.type === "bracelet") return "wrist";
          if (isJewelryLike(it.type)) return "accessory";
          if (isArmorLike(it.type)) return "body";
          return null;
        };
        const effectiveSlot = getEquipSlot(item);

        if (effectiveSlot === "ring") {
          const equippedRings = inv.filter((it: any, idx: number) => idx !== itemIndex && it.equipped && (isJewelryLike(it.type) || isArmorLike(it.type)) && getEquipSlot(it) === "ring");
          if (equippedRings.length >= 2) {
            const oldestRingIdx = inv.findIndex((it: any) => it.equipped && (isJewelryLike(it.type) || isArmorLike(it.type)) && getEquipSlot(it) === "ring");
            if (oldestRingIdx >= 0) inv[oldestRingIdx] = { ...inv[oldestRingIdx], equipped: false };
          }
        } else if (effectiveSlot) {
          inv.forEach((it: any, idx: number) => {
            if (idx === itemIndex || !it.equipped) return;
            if (!isArmorLike(it.type) && !isJewelryLike(it.type)) return;
            if (getEquipSlot(it) === effectiveSlot) {
              inv[idx] = { ...inv[idx], equipped: false };
            }
          });
        }
      }

      inv[itemIndex] = { ...item, equipped };

      const enforced = enforceHandLimits(inv, equipped ? itemIndex : undefined);
      for (let j = 0; j < inv.length; j++) inv[j] = enforced[j];
      const updated = await updateCharacter(req.params.id, { inventory: inv } as any);
      res.json(updated);
    } catch (e) {
      res.status(500).json({ error: "Failed to equip item" });
    }
  });

  // LR-012: Drop an item from a character's inventory. Properly decrements qty
  // (or splices the stack at qty 1) and re-sorts. The Coin Pouch cannot be
  // dropped — gold is removed via shop or GM GOLD_CHANGED only.
  app.post("/api/characters/:id/drop-item", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const char = await getCharacter(req.params.id);
      if (!char) return res.status(404).json({ error: "Not found" });
      if (char.userId !== userId) return res.status(403).json({ error: "Forbidden" });

      const { itemIndex, qty } = req.body;
      if (typeof itemIndex !== "number") {
        return res.status(400).json({ error: "itemIndex (number) required" });
      }

      const inv = [...(char.inventory as any[])];
      if (itemIndex < 0 || itemIndex >= inv.length) {
        return res.status(400).json({ error: "Invalid item index" });
      }
      const item = inv[itemIndex];
      if (isCoinItem(item)) {
        return res.status(400).json({ error: "The Coin Pouch cannot be dropped." });
      }
      if (item.equipped) {
        return res.status(400).json({ error: "Unequip the item before dropping it." });
      }

      const removeQty = Math.max(1, typeof qty === "number" ? qty : 1);
      const currentQty = item.qty ?? 1;
      if (currentQty <= removeQty) {
        inv.splice(itemIndex, 1);
      } else {
        inv[itemIndex] = { ...item, qty: currentQty - removeQty };
      }
      const sorted = sortInventory(inv);
      const updated = await updateCharacter(req.params.id, { inventory: sorted } as any);
      res.json(updated);
    } catch (e) {
      console.error("Drop item error:", e);
      res.status(500).json({ error: "Failed to drop item" });
    }
  });

  // ── Campaigns ───────────────────────────────────────────────────────────────

  app.get("/api/campaigns", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const camps = await getUserCampaigns(userId);
      res.json(camps);
    } catch (e) { res.status(500).json({ error: "Failed to get campaigns" }); }
  });

  app.post("/api/campaigns", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const { name, description, setting, worldName, worldDescription, worldSeed, themes, contentRating, noRomance, noHorror, fadeToBlack, gmMode, stylePack, era } = req.body;
      if (!name) return res.status(400).json({ error: "Name required" });
      const { ERAS: ERAS_ALLOW } = await import("@shared/schema");
      if (era !== undefined && era !== null && !ERAS_ALLOW.some(e => e.id === era)) {
        return res.status(400).json({ error: "Invalid era" });
      }
      const campaign = await createCampaign(userId, { name, description, setting, worldName, worldDescription, worldSeed, themes, contentRating, noRomance, noHorror, fadeToBlack, gmMode, stylePack, era });
      const party = await createParty(campaign.id, "The Company");
      res.status(201).json({ campaign, party });
    } catch (e) { res.status(500).json({ error: "Failed to create campaign" }); }
  });

  app.get("/api/campaigns/:id", requireAuth, async (req: any, res) => {
    try {
      const campaign = await getCampaign(req.params.id);
      if (!campaign) return res.status(404).json({ error: "Not found" });
      const partyList = await getCampaignParties(campaign.id);
      res.json({ campaign, parties: partyList });
    } catch (e) { res.status(500).json({ error: "Failed to get campaign" }); }
  });

  app.delete("/api/campaigns/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const campaign = await getCampaign(req.params.id);
      if (!campaign) return res.status(404).json({ error: "Campaign not found" });
      if (campaign.ownerId !== userId) return res.status(403).json({ error: "Not your campaign" });

      const campaignParties = await getCampaignParties(campaign.id);
      const partyIds = campaignParties.map(p => p.id);

      for (const pid of partyIds) {
        await db.delete(chatMessages).where(eq(chatMessages.partyId, pid));
        await db.delete(gameEvents).where(eq(gameEvents.partyId, pid));
        await db.delete(worldState).where(eq(worldState.partyId, pid));
        await db.delete(sceneSummaries).where(eq(sceneSummaries.partyId, pid));
        await db.delete(locationScenes).where(eq(locationScenes.partyId, pid));
        await db.delete(npcLog).where(eq(npcLog.partyId, pid));
        await db.delete(characterSituations).where(eq(characterSituations.partyId, pid));
        await db.delete(partyMembers).where(eq(partyMembers.partyId, pid));
      }
      await db.delete(arcs).where(eq(arcs.campaignId, campaign.id));
      await db.delete(campaignSoundtracks).where(eq(campaignSoundtracks.campaignId, campaign.id));
      for (const pid of partyIds) {
        await db.delete(parties).where(eq(parties.id, pid));
      }
      await db.delete(campaigns).where(eq(campaigns.id, campaign.id));

      res.json({ success: true });
    } catch (e) {
      console.error("Delete campaign error:", e);
      res.status(500).json({ error: "Failed to delete campaign" });
    }
  });

  app.patch("/api/campaigns/:id/settings", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const campaign = await getCampaign(req.params.id);
      if (!campaign) return res.status(404).json({ error: "Not found" });
      if (campaign.ownerId !== userId) return res.status(403).json({ error: "Forbidden" });

      const { contentRating, noRomance, noHorror, fadeToBlack, gmMode, themes, npcControl, name, physicalDice, soundtrackEnabled } = req.body;
      const updates: any = {};
      if (typeof name === "string" && name.trim()) updates.name = name.trim();
      if (contentRating !== undefined) updates.contentRating = contentRating;
      if (noRomance !== undefined) updates.noRomance = noRomance;
      if (noHorror !== undefined) updates.noHorror = noHorror;
      if (fadeToBlack !== undefined) updates.fadeToBlack = fadeToBlack;
      if (gmMode !== undefined) updates.gmMode = gmMode;
      if (themes !== undefined) updates.themes = themes;
      if (npcControl !== undefined && (npcControl === "gm" || npcControl === "player")) updates.npcControl = npcControl;
      if (physicalDice !== undefined) updates.physicalDice = !!physicalDice;
      if (soundtrackEnabled !== undefined) updates.soundtrackEnabled = !!soundtrackEnabled;

      const updated = await updateCampaign(req.params.id, updates);
      res.json(updated);
    } catch (e) {
      res.status(500).json({ error: "Failed to update campaign settings" });
    }
  });

  // ── Campaign Soundtracks ────────────────────────────────────────────────────

  const soundtrackGenerating = new Set<string>();

  app.get("/api/campaigns/:id/soundtracks", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const campaign = await getCampaign(req.params.id);
      if (!campaign) return res.status(404).json({ error: "Not found" });
      if (campaign.ownerId !== userId) {
        const userParties = await getUserParties(userId);
        const isMember = userParties.some((p: any) => p.campaignId === campaign.id);
        if (!isMember) return res.status(403).json({ error: "Forbidden" });
      }
      const soundtracks = await getCampaignSoundtracks(campaign.id);
      if (soundtracks.length === 0 && campaign.soundtrackEnabled && campaign.status === "active" && !soundtrackGenerating.has(campaign.id)) {
        soundtrackGenerating.add(campaign.id);
        generateSoundtrackProfiles(campaign).then(() => {
          soundtrackGenerating.delete(campaign.id);
        }).catch(err => {
          soundtrackGenerating.delete(campaign.id);
          console.error("[Soundtrack auto-generation error]", err);
        });
      }
      res.json({ soundtracks, soundtrackEnabled: campaign.soundtrackEnabled });
    } catch (e) {
      res.status(500).json({ error: "Failed to get soundtracks" });
    }
  });

  app.post("/api/campaigns/:id/soundtracks/generate", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const campaign = await getCampaign(req.params.id);
      if (!campaign) return res.status(404).json({ error: "Not found" });
      if (campaign.ownerId !== userId) return res.status(403).json({ error: "Forbidden" });

      const existing = await getCampaignSoundtracks(campaign.id);
      if (existing.length > 0) {
        return res.json({ soundtracks: existing, cached: true });
      }

      generateSoundtrackProfiles(campaign).catch(err => {
        console.error("[Soundtrack generation error]", err);
      });

      res.json({ soundtracks: [], generating: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to generate soundtracks" });
    }
  });

  // ── Parties ─────────────────────────────────────────────────────────────────

  app.get("/api/parties", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const parties = await getUserParties(userId);
      res.json(parties);
    } catch (e) { res.status(500).json({ error: "Failed to get parties" }); }
  });

  app.get("/api/parties/:id", requireAuth, async (req: any, res) => {
    try {
      const party = await getParty(req.params.id);
      if (!party) return res.status(404).json({ error: "Not found" });
      const members = await getPartyMembers(party.id);
      for (const m of members) {
        if (m.character?.inventory) {
          const inv = m.character.inventory as any[];
          const fixed = enforceHandLimits(inv);
          const changed = inv.some((it: any, idx: number) => it.equipped !== fixed[idx].equipped);
          if (changed) {
            await db.update(charsTable).set({ inventory: fixed }).where(eq(charsTable.id, m.character.id));
            (m.character as any).inventory = fixed;
          }
        }
      }
      const campaign = await getCampaign(party.campaignId);
      const worldSnap = await getWorldState(party.id);
      res.json({ party, members, campaign, worldState: worldSnap });
    } catch (e) { res.status(500).json({ error: "Failed to get party" }); }
  });

  // Bespoke per-campaign world image (used as the party-lobby backdrop and
  // anywhere else we want to evoke "this specific world"). Generated lazily
  // from worldName + worldDescription, then cached on campaigns.worldImage.
  app.get("/api/campaigns/:id/world-image", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const campaign = await getCampaign(req.params.id);
      if (!campaign) return res.status(404).json({ error: "Campaign not found" });

      // Allow if owner, or member of any party in this campaign.
      if (campaign.ownerId !== userId) {
        const partyRows = await db.select({ id: parties.id }).from(parties).where(eq(parties.campaignId, campaign.id));
        const partyIds = partyRows.map(p => p.id);
        let isMember = false;
        if (partyIds.length) {
          const memberRows = await db.select({ id: partyMembers.id })
            .from(partyMembers)
            .where(and(eq(partyMembers.userId, userId), inArray(partyMembers.partyId, partyIds)));
          isMember = memberRows.length > 0;
        }
        if (!isMember) return res.status(403).json({ error: "Forbidden" });
      }

      if ((campaign as any).worldImage) {
        res.set("Cache-Control", "private, max-age=3600");
        return res.json({ imageData: (campaign as any).worldImage, pending: false });
      }
      generateCampaignWorldImage(campaign.id).catch(console.error);
      res.json({ imageData: null, pending: true });
    } catch (e) {
      console.error("world-image fetch error:", e);
      res.status(500).json({ error: "Failed to fetch world image" });
    }
  });

  app.get("/api/parties/:id/scene-background", requireAuth, async (req: any, res) => {
    try {
      res.set("Cache-Control", "no-store, no-cache, must-revalidate");
      res.set("Pragma", "no-cache");

      const worldSnap = await getWorldState(req.params.id);
      const state = (worldSnap?.state as any) ?? {};
      const currentLocation: string = state.currentLocation ?? "";
      const currentSceneTitle: string = state.currentSceneTitle ?? "";
      if (!currentLocation) return res.json({ pending: false, imageData: null });

      const bgKey = currentSceneTitle || currentLocation;
      const [row] = await db.select()
        .from(locationScenes)
        .where(and(eq(locationScenes.partyId, req.params.id), eq(locationScenes.locationName, bgKey)));

      if (row) {
        res.json({ pending: false, imageData: row.imageData, locationName: bgKey });
      } else {
        const [fallbackRow] = await db.select()
          .from(locationScenes)
          .where(and(eq(locationScenes.partyId, req.params.id), eq(locationScenes.locationName, currentLocation)));

        const party = await getParty(req.params.id);
        const campaign = party ? await getCampaign(party.campaignId) : null;
        const settingCtx = [(campaign as any)?.setting ?? "", (campaign as any)?.description ?? ""].join(" ");

        const locations: any[] = state.locations ?? [];
        const locData = locations.find((l: any) => l.name === currentLocation);
        const locDesc = locData?.description ?? "";

        generateLocationBackground(
          req.params.id,
          currentLocation,
          bgKey,
          settingCtx,
          locDesc,
        ).catch(console.error);
        if (fallbackRow) {
          res.json({ pending: true, imageData: fallbackRow.imageData, locationName: bgKey });
        } else {
          res.json({ pending: true, imageData: null, locationName: bgKey });
        }
      }
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch scene background" });
    }
  });

  app.post("/api/parties/:id/scene-background/regenerate", requireAuth, async (req: any, res) => {
    try {
      const partyId = req.params.id;
      const userId = getUserId(req)!;
      const members = await getPartyMembers(partyId);
      if (!members.some((m: any) => m.userId === userId)) {
        return res.status(403).json({ error: "Not a member of this party" });
      }

      const worldSnap = await getWorldState(partyId);
      const state = (worldSnap?.state as any) ?? {};
      const currentLocation: string = state.currentLocation ?? "";
      const currentSceneTitle: string = state.currentSceneTitle ?? "";
      if (!currentLocation) return res.json({ ok: false, error: "No location" });

      const bgKey = currentSceneTitle || currentLocation;

      await db.delete(locationScenes)
        .where(and(eq(locationScenes.partyId, partyId), eq(locationScenes.locationName, bgKey)));
      if (bgKey !== currentLocation) {
        await db.delete(locationScenes)
          .where(and(eq(locationScenes.partyId, partyId), eq(locationScenes.locationName, currentLocation)));
      }

      const party = await getParty(partyId);
      const campaign = party ? await getCampaign(party.campaignId) : null;
      const settingCtx = [(campaign as any)?.setting ?? "", (campaign as any)?.description ?? ""].join(" ");
      const locations: any[] = state.locations ?? [];
      const locData = locations.find((l: any) => l.name === currentLocation);
      const locDesc = locData?.description ?? "";

      generateLocationBackground(partyId, currentLocation, bgKey, settingCtx, locDesc).catch(console.error);

      res.json({ ok: true, pending: true, locationName: bgKey });
    } catch (e) {
      res.status(500).json({ error: "Failed to regenerate background" });
    }
  });

  app.get("/api/parties/:id/scene-thumbnails", requireAuth, async (req: any, res) => {
    try {
      res.set("Cache-Control", "no-store, no-cache, must-revalidate");
      const partyId = req.params.id;
      const userId = getUserId(req)!;
      const members = await getPartyMembers(partyId);
      if (!members.some((m: any) => m.userId === userId)) {
        return res.status(403).json({ error: "Not a member of this party" });
      }
      const rows = await db.select({
        locationName: locationScenes.locationName,
        imageData: locationScenes.imageData,
      })
        .from(locationScenes)
        .where(eq(locationScenes.partyId, partyId));
      const thumbnails: Record<string, string> = {};
      for (const row of rows) {
        thumbnails[row.locationName] = row.imageData;
      }
      res.json({ thumbnails });
    } catch (e) {
      console.error("Scene thumbnails API error:", e);
      res.status(500).json({ error: "Failed to fetch scene thumbnails" });
    }
  });

  app.get("/api/parties/:id/map", requireAuth, async (req: any, res) => {
    try {
      res.set("Cache-Control", "no-store, no-cache, must-revalidate");
      const partyId = req.params.id;
      const userId = getUserId(req)!;
      const members = await getPartyMembers(partyId);
      if (!members.some((m: any) => m.userId === userId)) {
        return res.status(403).json({ error: "Not a member of this party" });
      }
      const worldSnap = await getWorldState(partyId);
      const state = (worldSnap?.state as any) ?? {};
      const locations: any[] = state.locations ?? [];
      const currentLocation: string = state.currentLocation ?? "";
      const mapCoords: Record<string, { x: number; y: number }> = (worldSnap as any)?.mapCoords ?? {};

      let needsCoordBackfill = false;
      let coordsCopy = { ...mapCoords };
      const forceRecalc = req.query.recalculate === "1";
      const missingCoords = locations.some((loc: any) => !coordsCopy[loc.name]);
      if (forceRecalc) {
        coordsCopy = assignAllLocationCoords(locations);
        needsCoordBackfill = true;
      } else if (missingCoords) {
        coordsCopy = assignAllLocationCoords(locations, coordsCopy);
        needsCoordBackfill = true;
      }
      if (needsCoordBackfill && worldSnap) {
        await db.update(worldState)
          .set({ mapCoords: coordsCopy, updatedAt: new Date() })
          .where(eq(worldState.partyId, partyId));
      }

      const sceneRows = await db.select({ locationName: locationScenes.locationName })
        .from(locationScenes)
        .where(eq(locationScenes.partyId, partyId));
      const sceneSet = new Set(sceneRows.map(r => r.locationName));

      const mapLocations = locations.map((loc: any) => ({
        name: loc.name,
        title: loc.title,
        region: loc.region,
        threat: loc.threat,
        firstVisitedTurn: loc.firstVisitedTurn,
        x: coordsCopy[loc.name]?.x ?? 50,
        y: coordsCopy[loc.name]?.y ?? 50,
        isCurrent: loc.name === currentLocation,
        hasSceneImage: sceneSet.has(loc.title || loc.name) || sceneSet.has(loc.name),
      }));

      const mapImage = (worldSnap as any)?.mapImageData ?? null;

      const regenerateMap = req.query.regenerate_map === "1";
      if (regenerateMap && mapImage) {
        await db.update(worldState)
          .set({ mapImageData: null, updatedAt: new Date() })
          .where(eq(worldState.partyId, partyId));
      }

      const effectiveMapImage = regenerateMap ? null : mapImage;
      if (!effectiveMapImage && locations.length > 0) {
        const party = await getParty(partyId);
        const campaign = party ? await getCampaign(party.campaignId) : null;
        const setting = [(campaign as any)?.setting ?? "", (campaign as any)?.description ?? ""].join(" ").trim();
        generateRegionMap(partyId, setting).catch(console.error);
      }

      res.json({ mapImage: effectiveMapImage, locations: mapLocations, generating: !effectiveMapImage && locations.length > 0 });
    } catch (e) {
      console.error("Map API error:", e);
      res.status(500).json({ error: "Failed to fetch map data" });
    }
  });

  app.get("/api/parties/:id/location-maps", requireAuth, async (req: any, res) => {
    try {
      const partyId = req.params.id;
      const userId = getUserId(req)!;
      const members = await getPartyMembers(partyId);
      if (!members.some((m: any) => m.userId === userId)) {
        return res.status(403).json({ error: "Not a member of this party" });
      }
      const rows = await db.select({
        id: locationMaps.id,
        locationName: locationMaps.locationName,
        locationType: locationMaps.locationType,
        createdAt: locationMaps.createdAt,
      }).from(locationMaps).where(eq(locationMaps.partyId, partyId));
      res.json(rows);
    } catch (e) {
      console.error("Location maps list error:", e);
      res.status(500).json({ error: "Failed to fetch location maps" });
    }
  });

  app.get("/api/parties/:id/location-maps/:locationName", requireAuth, async (req: any, res) => {
    try {
      res.set("Cache-Control", "no-store, no-cache, must-revalidate");
      const partyId = req.params.id;
      const locationName = decodeURIComponent(req.params.locationName);
      const userId = getUserId(req)!;
      const members = await getPartyMembers(partyId);
      if (!members.some((m: any) => m.userId === userId)) {
        return res.status(403).json({ error: "Not a member of this party" });
      }

      const [row] = await db.select()
        .from(locationMaps)
        .where(and(eq(locationMaps.partyId, partyId), eq(locationMaps.locationName, locationName)));

      if (row) {
        return res.json({
          mapImage: row.mapImageData,
          locationType: row.locationType,
          pointsOfInterest: row.pointsOfInterest,
          generating: false,
        });
      }

      const generating = isLocationMapGenerating(partyId, locationName);
      res.json({ mapImage: null, locationType: null, pointsOfInterest: [], generating });
    } catch (e) {
      console.error("Location map fetch error:", e);
      res.status(500).json({ error: "Failed to fetch location map" });
    }
  });

  app.post("/api/parties/:id/location-maps/:locationName/generate", requireAuth, async (req: any, res) => {
    try {
      const partyId = req.params.id;
      const locationName = decodeURIComponent(req.params.locationName);
      const userId = getUserId(req)!;
      const members = await getPartyMembers(partyId);
      if (!members.some((m: any) => m.userId === userId)) {
        return res.status(403).json({ error: "Not a member of this party" });
      }

      const [existing] = await db.select({ id: locationMaps.id })
        .from(locationMaps)
        .where(and(eq(locationMaps.partyId, partyId), eq(locationMaps.locationName, locationName)));
      if (existing) {
        return res.json({ status: "exists" });
      }

      const locationType = detectLocationType(locationName);

      const party = await getParty(partyId);
      const campaign = party ? await getCampaign(party.campaignId) : null;
      const setting = [(campaign as any)?.setting ?? "", (campaign as any)?.description ?? ""].join(" ").trim();

      const worldSnap = await getWorldState(partyId);
      const state = (worldSnap?.state as any) ?? {};
      const locData = (state.locations ?? []).find((l: any) => l.name === locationName);
      const context = locData?.title || "";

      generateLocationMap(partyId, locationName, locationType, setting, context).catch(console.error);
      res.json({ status: "generating" });
    } catch (e) {
      console.error("Location map generate error:", e);
      res.status(500).json({ error: "Failed to generate location map" });
    }
  });

  app.delete("/api/parties/:id/location-maps/:locationName", requireAuth, async (req: any, res) => {
    try {
      const partyId = req.params.id;
      const locationName = decodeURIComponent(req.params.locationName);
      const userId = getUserId(req)!;
      const members = await getPartyMembers(partyId);
      if (!members.some((m: any) => m.userId === userId)) {
        return res.status(403).json({ error: "Not a member of this party" });
      }
      await db.delete(locationMaps)
        .where(and(eq(locationMaps.partyId, partyId), eq(locationMaps.locationName, locationName)));
      res.json({ status: "deleted" });
    } catch (e) {
      console.error("Location map delete error:", e);
      res.status(500).json({ error: "Failed to delete location map" });
    }
  });

  app.post("/api/parties/join", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const { inviteCode, characterId } = req.body;
      if (!inviteCode || !characterId) return res.status(400).json({ error: "Missing fields" });

      const party = await getPartyByInviteCode(inviteCode.toUpperCase());
      if (!party) return res.status(404).json({ error: "Invalid invite code" });

      const member = await joinParty(party.id, userId, characterId);
      const members = await getPartyMembers(party.id);
      broadcastToParty(party.id, { type: "MEMBER_UPDATE", members });
      res.json({ party, member });
    } catch (e) { res.status(500).json({ error: "Failed to join party" }); }
  });

  app.post("/api/parties/:id/join", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const { characterId } = req.body;
      if (!characterId) return res.status(400).json({ error: "characterId required" });

      const party = await getParty(req.params.id);
      if (!party) return res.status(404).json({ error: "Party not found" });

      const member = await joinParty(party.id, userId, characterId);
      const members = await getPartyMembers(party.id);
      broadcastToParty(party.id, { type: "MEMBER_UPDATE", members });
      res.json({ party, member });
    } catch (e) { res.status(500).json({ error: "Failed to join party" }); }
  });

  app.post("/api/parties/:id/ready", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const { isReady } = req.body;
      await setMemberReady(req.params.id, userId, isReady);

      if (isReady) {
        const party = await getParty(req.params.id);
        if (party) {
          const campaign = await getCampaign(party.campaignId);
          if (campaign && campaign.soundtrackEnabled) {
            getCampaignSoundtracks(campaign.id).then(existing => {
              if (existing.length === 0) {
                generateSoundtrackProfiles(campaign).catch(err => {
                  console.error("[Soundtrack generation error]", err);
                });
              }
            }).catch(() => {});
          }
        }
      }

      const members = await getPartyMembers(req.params.id);
      broadcastToParty(req.params.id, { type: "MEMBER_UPDATE", members });
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Failed to update ready state" }); }
  });

  // ── Shop Buy / Sell ──────────────────────────────────────────────────────────

  app.post("/api/parties/:id/shop/buy", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const partyId = req.params.id;
      const { characterId, item, price } = req.body;
      if (!characterId || !item || typeof price !== "number" || price < 0)
        return res.status(400).json({ error: "Missing characterId, item, or price" });
      const [char] = await db.select().from(charsTable).where(eq(charsTable.id, characterId));
      if (!char) return res.status(404).json({ error: "Character not found" });
      let inv = [...(char.inventory as any[])];
      inv = consolidateCoins(inv);
      const pouchIdx = inv.findIndex((i: any) => isCoinItem(i));
      const gold = pouchIdx >= 0 ? (inv[pouchIdx].properties?.value ?? 0) : 0;
      if (gold < price) return res.status(400).json({ error: "Not enough gold" });
      const newGold = gold - price;
      if (pouchIdx >= 0) {
        // LR-013: keep the Coin Pouch in inventory even at 0gp so the player
        // can see they're broke instead of the pouch silently disappearing.
        inv[pouchIdx] = { ...inv[pouchIdx], name: `Coin Pouch (${newGold}gp)`, properties: { ...inv[pouchIdx].properties, value: newGold } };
      }
      const newItem: any = { qty: item.qty ?? 1, name: item.name, type: item.type ?? "misc", rarity: item.rarity ?? "common", equipped: false, properties: item.properties ?? {}, price };
      if (item.description) newItem.description = item.description;
      inv.push(newItem);
      inv = sortInventory(inv);
      console.log(`[Shop Buy] Adding "${newItem.name}" to char ${characterId}. Inventory: ${inv.length} items. Gold remaining: ${newGold}gp`);
      await db.update(charsTable).set({ inventory: inv }).where(eq(charsTable.id, characterId));
      broadcastToParty(partyId, { type: "STATE_UPDATE", updates: [{ type: "SHOP_BUY" }] });
      res.json({ ok: true, gold: newGold, item: newItem });
    } catch (e: any) { res.status(500).json({ error: "Buy failed" }); }
  });

  app.post("/api/parties/:id/shop/sell", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const partyId = req.params.id;
      const { characterId, itemIndex, sellPrice, itemName } = req.body;
      if (!characterId || typeof itemIndex !== "number" || typeof sellPrice !== "number")
        return res.status(400).json({ error: "Missing characterId, itemIndex, or sellPrice" });
      const [char] = await db.select().from(charsTable).where(eq(charsTable.id, characterId));
      if (!char) return res.status(404).json({ error: "Character not found" });
      let inv = [...(char.inventory as any[])];
      if (itemIndex < 0 || itemIndex >= inv.length) return res.status(400).json({ error: "Invalid item index" });
      const soldItem = inv[itemIndex];
      if (itemName && soldItem.name !== itemName) {
        console.log(`[Shop Sell] INDEX MISMATCH: expected "${itemName}" at idx=${itemIndex}, found "${soldItem.name}". Searching by name.`);
        const nameIdx = inv.findIndex((i: any) => i.name === itemName && !i.equipped);
        if (nameIdx < 0) return res.status(400).json({ error: "Item not found in inventory" });
        const actual = inv[nameIdx];
        const currentQty = actual.qty ?? 1;
        if (currentQty <= 1) inv.splice(nameIdx, 1);
        else inv[nameIdx] = { ...actual, qty: currentQty - 1 };
        inv = consolidateCoins(inv);
        if (sellPrice > 0) {
          const pouchIdx = inv.findIndex((i: any) => isCoinItem(i));
          if (pouchIdx >= 0) {
            const newGold = (inv[pouchIdx].properties?.value ?? 0) + sellPrice;
            inv[pouchIdx] = { ...inv[pouchIdx], name: `Coin Pouch (${newGold}gp)`, properties: { ...inv[pouchIdx].properties, value: newGold } };
          } else {
            inv.push({ qty: 1, name: `Coin Pouch (${sellPrice}gp)`, type: "treasure", properties: { value: sellPrice } });
          }
        }
        inv = sortInventory(inv);
        console.log(`[Shop Sell] Fallback: Removed "${itemName}" (found at idx=${nameIdx}). Inventory: ${inv.length} items remaining.`);
        await db.update(charsTable).set({ inventory: inv }).where(eq(charsTable.id, characterId));
        broadcastToParty(partyId, { type: "STATE_UPDATE", updates: [{ type: "SHOP_SELL" }] });
        return res.json({ ok: true, soldItem: itemName, sellPrice });
      }
      if (soldItem.equipped) return res.status(400).json({ error: "Unequip item before selling" });
      const currentQty = soldItem.qty ?? 1;
      if (currentQty <= 1) inv.splice(itemIndex, 1);
      else inv[itemIndex] = { ...soldItem, qty: currentQty - 1 };
      inv = consolidateCoins(inv);
      if (sellPrice > 0) {
        const pouchIdx = inv.findIndex((i: any) => isCoinItem(i));
        if (pouchIdx >= 0) {
          const newGold = (inv[pouchIdx].properties?.value ?? 0) + sellPrice;
          inv[pouchIdx] = { ...inv[pouchIdx], name: `Coin Pouch (${newGold}gp)`, properties: { ...inv[pouchIdx].properties, value: newGold } };
        } else {
          inv.push({ qty: 1, name: `Coin Pouch (${sellPrice}gp)`, type: "treasure", properties: { value: sellPrice } });
        }
      }
      inv = sortInventory(inv);
      console.log(`[Shop Sell] Removing "${soldItem.name}" (idx=${itemIndex}) from char ${characterId}. Inventory: ${inv.length} items remaining. Gold added: ${sellPrice}gp`);
      await db.update(charsTable).set({ inventory: inv }).where(eq(charsTable.id, characterId));
      broadcastToParty(partyId, { type: "STATE_UPDATE", updates: [{ type: "SHOP_SELL" }] });
      res.json({ ok: true, soldItem: soldItem.name, sellPrice });
    } catch (e: any) { res.status(500).json({ error: "Sell failed" }); }
  });

  // ── Messages ────────────────────────────────────────────────────────────────

  app.get("/api/parties/:id/messages", requireAuth, async (req, res) => {
    try {
      const msgs = await getPartyMessages(req.params.id as string, 100);
      res.json(msgs);
    } catch (e) { res.status(500).json({ error: "Failed to get messages" }); }
  });

  // Party member situations for split-party tracking
  app.get("/api/parties/:id/situations", requireAuth, async (req: any, res) => {
    try {
      const partyId = req.params.id;
      const members = await db.select().from(partyMembers).where(eq(partyMembers.partyId, partyId));
      const charIds = members.map(m => m.characterId).filter(Boolean);
      if (!charIds.length) return res.json([]);
      const { characterSituations } = await import("@shared/schema");
      const { inArray: inArr } = await import("drizzle-orm");
      const sits = await db.select().from(characterSituations).where(inArr(characterSituations.characterId, charIds));
      res.json(sits);
    } catch (e) { res.status(500).json({ error: "Failed to get situations" }); }
  });

  app.get("/api/parties/:id/npcs", requireAuth, async (req: any, res) => {
    try {
      const { npcLog } = await import("@shared/schema");
      const npcs = await db.select().from(npcLog)
        .where(eq(npcLog.partyId, req.params.id))
        .orderBy(desc(npcLog.updatedAt));
      const lite = npcs.map((n: any) => {
        const { portrait, ...rest } = n;
        return { ...rest, hasPortrait: !!portrait };
      });
      res.json(lite);
      const missing = npcs.filter((n: any) => !n.portrait);
      if (missing.length > 0) {
        const { generateNpcPortrait } = await import("./gmOrchestrator");
        for (const npc of missing) {
          generateNpcPortrait(npc.id, {
            name: npc.name,
            pronouns: npc.pronouns,
            role: npc.role,
            description: npc.description,
            relationship: npc.relationship,
            lastSeen: npc.lastSeen,
          }).catch(console.error);
        }
      }
    } catch (e) { res.status(500).json({ error: "Failed to get NPC log" }); }
  });

  app.delete("/api/npcs/:id", requireAuth, async (req: any, res) => {
    try {
      const { npcLog } = await import("@shared/schema");
      const [npc] = await db.select({ id: npcLog.id, partyId: npcLog.partyId })
        .from(npcLog).where(eq(npcLog.id, req.params.id)).limit(1);
      if (!npc) return res.status(404).json({ error: "NPC not found" });
      const userId = getUserId(req)!;
      const members = await getPartyMembers(npc.partyId);
      if (!members.some((m: any) => m.userId === userId)) {
        return res.status(403).json({ error: "Not a member of this party" });
      }
      await db.delete(npcLog).where(eq(npcLog.id, req.params.id));
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: "Failed to delete NPC" }); }
  });

  app.get("/api/npcs/:id/portrait", requireAuth, async (req: any, res) => {
    try {
      const { npcLog } = await import("@shared/schema");
      const [npc] = await db.select({ portrait: npcLog.portrait })
        .from(npcLog).where(eq(npcLog.id, req.params.id)).limit(1);
      if (!npc?.portrait) return res.status(404).json({ error: "No portrait" });
      const match = npc.portrait.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        const buf = Buffer.from(match[2], "base64");
        res.set({ "Content-Type": match[1], "Cache-Control": "public, max-age=86400" });
        return res.send(buf);
      }
      res.set({ "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" });
      res.send(Buffer.from(npc.portrait, "base64"));
    } catch (e) { res.status(500).json({ error: "Failed to get portrait" }); }
  });

  // Player action → GM response (streaming)
  app.post("/api/parties/:id/action", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const partyId = req.params.id;
      const { content, playerName } = req.body;
      // LR-014 hardening: normalize mode to a strict enum so a malformed mode
      // can't bypass downstream gating (e.g. the Downed check).
      const rawMode = req.body?.mode;
      const mode: "action" | "dialogue" | "ooc" =
        rawMode === "dialogue" || rawMode === "ooc" ? rawMode : "action";
      if (!content) return res.status(400).json({ error: "content required" });

      // Get party to find campaign
      const party = await getParty(partyId);
      if (!party) return res.status(404).json({ error: "Party not found" });

      // Save player message with mode in metadata
      const playerMsg = await saveChatMessage({
        partyId,
        userId,
        role: "player",
        content,
        metadata: { playerName: playerName || "Adventurer", msgType: mode },
      });

      // Broadcast player message
      broadcastToParty(partyId, { type: "MESSAGE", message: playerMsg });

      // OOC: no GM response, just acknowledge
      if (mode === "ooc") {
        return res.json({ ok: true, message: playerMsg });
      }

      // Set up SSE for streaming GM response
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Frame intent for dialogue mode
      const playerIntent = mode === "dialogue"
        ? `[DIALOGUE] ${playerName || "The player"} says aloud: "${content}"`
        : content;

      // Look up the acting character for split-party tracking
      const [actingMember] = await db.select()
        .from(partyMembers)
        .where(and(eq(partyMembers.partyId, partyId), eq(partyMembers.userId, userId)));
      const actingCharacterId = actingMember?.characterId ?? undefined;

      // LR-014: enforce a Downed state at 0 HP. Players can still talk OOC or
      // narrate dialogue (last words, calls for help) but cannot take heroic
      // actions until they're stabilised/healed back above 0 HP.
      if (mode === "action" && actingCharacterId) {
        const actingChar = await getCharacter(actingCharacterId);
        if (actingChar && actingChar.currentHp <= 0) {
          return res.status(409).json({
            error: "You are Downed at 0 HP. You can speak (Say), but you cannot act until an ally stabilises or heals you.",
            code: "DOWNED",
          });
        }
      }

      let gmFullText = "";

      await runGM(
        {
          partyId,
          campaignId: party.campaignId,
          userId,
          userName: playerName || "Adventurer",
          playerIntent,
          mode: mode === "dialogue" ? "dialogue" : "action",
          actingCharacterId,
        },
        (chunk) => {
          gmFullText += chunk;
          res.write(`data: ${JSON.stringify({ type: "chunk", content: chunk })}\n\n`);
        },
        async (fullText, updates, diceRequests, quickActions, turnHint, levelUps, sceneMood, combatStall) => {
          const gmMsg = await saveChatMessage({
            partyId,
            userId: undefined,
            role: "gm",
            content: fullText,
            metadata: { updates, diceRequests, quickActions, turnHint, levelUps, sceneMood, combatStall: combatStall ?? null },
          });

          broadcastToParty(partyId, { type: "MESSAGE", message: gmMsg });
          if (updates.length > 0) {
            broadcastToParty(partyId, { type: "STATE_UPDATE", updates });
          }
          if (turnHint) {
            broadcastToParty(partyId, { type: "TURN_HINT", turnHint });
          }
          if (levelUps && levelUps.length > 0) {
            broadcastToParty(partyId, { type: "LEVEL_UP", levelUps });
          }

          res.write(`data: ${JSON.stringify({ type: "done", message: gmMsg, updates, diceRequests, quickActions, turnHint, levelUps, sceneMood, combatStall: combatStall ?? null })}\n\n`);
          res.end();
        },
      );
    } catch (e: any) {
      console.error("[GM action error]", e.message ?? e);
      if (!res.headersSent) {
        res.status(500).json({ error: e.message || "GM action failed" });
      } else {
        res.write(`data: ${JSON.stringify({ type: "error", error: e.message || "GM action failed" })}\n\n`);
        res.end();
      }
    }
  });

  // Dice roll endpoint
  app.post("/api/dice/roll", requireAuth, async (req: any, res) => {
    try {
      const { die: rawDie, count: rawCount = 1, modifier: rawMod = 0, advantageState = "normal", label } = req.body;
      if (!rawDie) return res.status(400).json({ error: "die required" });
      const parsed = parseDieString(String(rawDie));
      const die = parsed.die;
      const count = parsed.count || rawCount;
      const modifier = (parsed.modifier || 0) + (rawMod || 0);
      const result = rollDice(die, count, modifier, advantageState, label);
      res.json(result);
    } catch (e) { res.status(500).json({ error: "Roll failed" }); }
  });

  // ── Friends ─────────────────────────────────────────────────────────────────

  app.get("/api/friends", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const friends = await getFriends(userId);
      res.json(friends);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/friends/requests", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const requests = await getPendingRequests(userId);
      res.json(requests);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/friends/sent", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const sent = await getSentRequests(userId);
      res.json(sent);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/friends/request", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { username } = req.body;
      if (!username) return res.status(400).json({ error: "Username required" });

      const results = await searchUsers(username, userId);
      const target = results.find(u => u.username?.toLowerCase() === username.toLowerCase());
      if (!target) return res.status(404).json({ error: "User not found" });
      if (target.id === userId) return res.status(400).json({ error: "Cannot add yourself" });

      const friendship = await sendFriendRequest(userId, target.id);
      res.json(friendship);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/friends/:id/accept", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const friendship = await acceptFriendRequest(req.params.id, userId);
      res.json(friendship);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  app.post("/api/friends/:id/decline", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      await declineFriendRequest(req.params.id, userId);
      res.json({ success: true });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  app.delete("/api/friends/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      await removeFriend(req.params.id, userId);
      res.json({ success: true });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  app.get("/api/users/search", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const q = (req.query.q as string) ?? "";
      const results = await searchUsers(q, userId);
      res.json(results);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── Session Feedback ─────────────────────────────────────────────────────────

  app.post("/api/feedback", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { sessionFeedback, insertSessionFeedbackSchema } = await import("@shared/schema");
      const parsed = insertSessionFeedbackSchema.safeParse({ ...req.body, userId });
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid feedback", details: parsed.error.flatten() });
      }
      const rating = parsed.data.rating;
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Rating must be 1–5" });
      }
      const comment = (parsed.data.comment ?? "").slice(0, 2000);
      const [row] = await db.insert(sessionFeedback).values({
        ...parsed.data,
        comment,
      }).returning();
      res.json({ success: true, id: row.id });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── WebSocket ────────────────────────────────────────────────────────────────

  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws, req) => {
    let partyId: string | null = null;

    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === "JOIN_PARTY") {
          partyId = msg.partyId;
          if (!partyConnections.has(partyId!)) {
            partyConnections.set(partyId!, new Set());
          }
          partyConnections.get(partyId!)!.add(ws);
          ws.send(JSON.stringify({ type: "JOINED", partyId }));
        } else if (msg.type === "PING") {
          ws.send(JSON.stringify({ type: "PONG" }));
        }
      } catch (_) {}
    });

    ws.on("close", () => {
      if (partyId) {
        partyConnections.get(partyId)?.delete(ws);
      }
    });
  });

  return httpServer;
}
