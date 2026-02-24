import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { setupLocalAuth, registerLocalAuthRoutes } from "./localAuth";
import { requireAuth, getUserId, getCurrentUser } from "./authMiddleware";
import {
  createCharacter, getUserCharacters, getCharacter, updateCharacter,
  createCampaign, getCampaign, getUserCampaigns,
  createParty, getParty, getPartyByInviteCode, getCampaignParties, getUserParties,
  joinParty, getPartyMembers, setMemberReady,
  saveChatMessage, getPartyMessages, getWorldState,
} from "./storage";
import { rollDice } from "./gameEngine";
import { runGM, generateLocationBackground, generateHallBackground } from "./gmOrchestrator";
import { db } from "./db";
import { locationScenes, partyMembers } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

// WebSocket connections per party
const partyConnections = new Map<string, Set<WebSocket>>();

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
      const { name, cls, race, background, personality, motivation, flaw } = req.body;
      if (!cls || !race || !background) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      const prompt = [
        `Write a compelling 2–3 paragraph backstory for a fantasy RPG character with the following details:`,
        `Name: ${name || "Unknown"}`,
        `Race: ${race}`,
        `Class: ${cls}`,
        `Background: ${background}`,
        personality ? `Personality traits: ${personality}` : null,
        motivation ? `Core motivation: ${motivation}` : null,
        flaw ? `Flaw or dark secret: ${flaw}` : null,
        ``,
        `Write in third person. Make it vivid, immersive, and true to high fantasy. Focus on formative events, key relationships, and the moment that set them on an adventuring path. Do not include game stats or mechanics. 2–3 paragraphs only.`,
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
      const { name, class: cls, race, background, appearance, backstory, customBaseStats } = req.body;
      if (!name || !cls || !race || !background) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const char = await createCharacter(userId, { name, class: cls, race, background, appearance, backstory, customBaseStats });
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

      const outfitHint = classOutfitMap[char.class as string] ?? "detailed fantasy adventurer outfit";
      const bgAtmosphere = backgroundAtmosphereMap[char.background as string] ?? "dramatic fantasy environment with atmospheric depth";

      const prompt = [
        `Cinematic fantasy portrait painting of a ${levelDesc} ${char.race} ${char.class} named ${char.name},`,
        appearanceParts ? `${appearanceParts},` : "",
        `wearing ${outfitHint},`,
        `set against ${bgAtmosphere},`,
        `ultra-detailed luminous digital painting, photorealistic expressive face, dramatic volumetric rim lighting,`,
        `deep cinematic colour palette with rich shadows and glowing highlights, intricate fabric and armour detail,`,
        `painterly fine brushwork, cinematic depth of field, atmospheric bokeh background, portrait to waist framing,`,
        `fantasy concept art, high quality illustration`,
      ].filter(Boolean).join(" ");

      const fs = await import("fs");
      const path = await import("path");
      const styleRefPath = path.join(process.cwd(), "attached_assets", "Snip20260221_1_1771705188223.png");
      const styleRefBase64 = fs.existsSync(styleRefPath)
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
      const { name, description, setting, themes, contentRating, noRomance, noHorror, fadeToBlack, gmMode, stylePack } = req.body;
      if (!name) return res.status(400).json({ error: "Name required" });
      const campaign = await createCampaign(userId, { name, description, setting, themes, contentRating, noRomance, noHorror, fadeToBlack, gmMode, stylePack });
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
      const campaign = await getCampaign(party.campaignId);
      const worldSnap = await getWorldState(party.id);
      res.json({ party, members, campaign, worldState: worldSnap });
    } catch (e) { res.status(500).json({ error: "Failed to get party" }); }
  });

  app.get("/api/system/hall-background", async (_req, res) => {
    try {
      const [row] = await db.select({ imageData: locationScenes.imageData })
        .from(locationScenes)
        .where(and(eq(locationScenes.partyId, "system"), eq(locationScenes.locationName, "adventurers_hall")));
      if (row) {
        res.set("Cache-Control", "public, max-age=604800, immutable");
        return res.json({ imageData: row.imageData, pending: false });
      }
      generateHallBackground().catch(console.error);
      res.json({ imageData: null, pending: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch hall background" });
    }
  });

  app.get("/api/parties/:id/scene-background", requireAuth, async (req: any, res) => {
    try {
      res.set("Cache-Control", "no-store, no-cache, must-revalidate");
      res.set("Pragma", "no-cache");

      const worldSnap = await getWorldState(req.params.id);
      const currentLocation: string = (worldSnap?.state as any)?.currentLocation ?? "";
      if (!currentLocation) return res.json({ pending: false, imageData: null });

      const [row] = await db.select()
        .from(locationScenes)
        .where(and(eq(locationScenes.partyId, req.params.id), eq(locationScenes.locationName, currentLocation)));

      if (row) {
        res.json({ pending: false, imageData: row.imageData, locationName: currentLocation });
      } else {
        // Trigger generation if not started yet — handles existing campaigns
        // Find scene title and campaign setting from worldState / campaign
        const state = (worldSnap?.state as any) ?? {};
        const locationMeta = (state.locations ?? []).find((l: any) => l.name === currentLocation);
        const party = await getParty(req.params.id);
        const campaign = party ? await getCampaign(party.campaignId) : null;
        const settingCtx = [(campaign as any)?.setting ?? "", (campaign as any)?.description ?? ""].join(" ");
        generateLocationBackground(
          req.params.id,
          currentLocation,
          locationMeta?.title ?? currentLocation,
          settingCtx,
        ).catch(console.error);
        res.json({ pending: true, imageData: null, locationName: currentLocation });
      }
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch scene background" });
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
      res.json({ party, member });
    } catch (e) { res.status(500).json({ error: "Failed to join party" }); }
  });

  app.post("/api/parties/:id/ready", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const { isReady } = req.body;
      await setMemberReady(req.params.id, userId, isReady);

      const members = await getPartyMembers(req.params.id);
      broadcastToParty(req.params.id, { type: "MEMBER_UPDATE", members });
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Failed to update ready state" }); }
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
      res.json(npcs);
      // Fire-and-forget portrait generation for any NPCs that don't have one yet
      const missing = npcs.filter((n: any) => !n.portrait);
      if (missing.length > 0) {
        const { generateNpcPortrait } = await import("./gmOrchestrator");
        for (const npc of missing) {
          generateNpcPortrait(npc.id, {
            name: npc.name,
            role: npc.role,
            description: npc.description,
            relationship: npc.relationship,
            lastSeen: npc.lastSeen,
          }).catch(console.error);
        }
      }
    } catch (e) { res.status(500).json({ error: "Failed to get NPC log" }); }
  });

  // Player action → GM response (streaming)
  app.post("/api/parties/:id/action", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const partyId = req.params.id;
      const { content, playerName, mode = "action" } = req.body;
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
        async (fullText, updates) => {
          // Save GM message
          const gmMsg = await saveChatMessage({
            partyId,
            userId: undefined,
            role: "gm",
            content: fullText,
            metadata: { updates },
          });

          // Broadcast GM message and any updates
          broadcastToParty(partyId, { type: "MESSAGE", message: gmMsg });
          if (updates.length > 0) {
            broadcastToParty(partyId, { type: "STATE_UPDATE", updates });
          }

          res.write(`data: ${JSON.stringify({ type: "done", message: gmMsg, updates })}\n\n`);
          res.end();
        },
      );
    } catch (e: any) {
      if (!res.headersSent) {
        res.status(500).json({ error: "GM action failed" });
      } else {
        res.write(`data: ${JSON.stringify({ type: "error", error: e.message })}\n\n`);
        res.end();
      }
    }
  });

  // Dice roll endpoint
  app.post("/api/dice/roll", requireAuth, async (req: any, res) => {
    try {
      const { die, count = 1, modifier = 0, advantageState = "normal", label } = req.body;
      if (!die) return res.status(400).json({ error: "die required" });
      const result = rollDice(die, count, modifier, advantageState, label);
      res.json(result);
    } catch (e) { res.status(500).json({ error: "Roll failed" }); }
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
