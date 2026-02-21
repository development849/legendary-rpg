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
import { runGM } from "./gmOrchestrator";

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

      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      const baseDesc = [char.appearance, appearanceDetails].filter(Boolean).join(", ");
      const prompt = [
        `Detailed fantasy portrait of a ${char.race} ${char.class},`,
        baseDesc ? baseDesc + "," : "",
        `digital painting in the style of WLOP, luminous ethereal atmosphere, dramatic cinematic lighting from above,`,
        `richly detailed face and eyes, intricate fantasy costume, painterly brushwork, soft glowing edges,`,
        `deep dramatic background with misty bokeh, masterpiece quality illustration, high detail, 4K`,
      ].filter(Boolean).join(" ");

      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1024",
        response_format: "b64_json",
        quality: "hd",
      });

      const b64 = response.data[0]?.b64_json;
      if (!b64) return res.status(500).json({ error: "No image returned" });

      const dataUrl = `data:image/png;base64,${b64}`;
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
      const { name, description, setting, contentRating, noRomance, noHorror, fadeToBlack, gmMode, stylePack } = req.body;
      if (!name) return res.status(400).json({ error: "Name required" });
      const campaign = await createCampaign(userId, { name, description, setting, contentRating, noRomance, noHorror, fadeToBlack, gmMode, stylePack });
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

  // Player action → GM response (streaming)
  app.post("/api/parties/:id/action", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const partyId = req.params.id;
      const { content, playerName } = req.body;
      if (!content) return res.status(400).json({ error: "content required" });

      // Get party to find campaign
      const party = await getParty(partyId);
      if (!party) return res.status(404).json({ error: "Party not found" });

      // Save player message
      const playerMsg = await saveChatMessage({
        partyId,
        userId,
        role: "player",
        content,
        metadata: { playerName: playerName || "Adventurer" },
      });

      // Broadcast player message
      broadcastToParty(partyId, { type: "MESSAGE", message: playerMsg });

      // Set up SSE for streaming GM response
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      let gmFullText = "";

      await runGM(
        {
          partyId,
          campaignId: party.campaignId,
          userId,
          userName: playerName || "Adventurer",
          playerIntent: content,
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
