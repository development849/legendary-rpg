import OpenAI from "openai";
import { z } from "zod";

/**
 * The Chronicler is the second pass of the GM pipeline. It receives the
 * narrator's just-streamed narrative and is responsible for *all* entity
 * bookkeeping — who was actually met, what locations were merely mentioned vs
 * visited, what plot facts were established, what relationships shifted. The
 * narrator stays focused on prose; the chronicler stays focused on the world
 * state ledger.
 *
 * Why split: the narrator was producing structured updates as a side-effect of
 * streaming prose, which caused systematic disambiguation failures — e.g.
 * "Braegad's Hollow" produced both a phantom NPC "Hollow" and no location;
 * a note signed "J." spawned an NPC literally named "J"; locations the party
 * heard about but never visited never appeared on the journey map.
 *
 * The chronicler is a deterministic, JSON-only pass with a focused prompt and
 * a strict schema. It is the sole source of truth for:
 *   NPC_MET, NPC_RELATIONSHIP_CHANGED, PLOT_FACT_SET, LOCATION_MENTIONED.
 */

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const NpcMet = z.object({
  type: z.literal("NPC_MET"),
  name: z.string().min(2),
  pronouns: z.string().nullish().transform(v => v ?? "they/them"),
  role: z.string().nullish().transform(v => v ?? ""),
  description: z.string().nullish().transform(v => v ?? ""),
  location: z.string().nullish().transform(v => v ?? "Unknown"),
  relationship: z.enum(["friendly", "neutral", "hostile"]).nullish().transform(v => v ?? "neutral"),
  notes: z.string().nullish().transform(v => v ?? ""),
  replaces: z.string().nullable().default(null),
});

const NpcRel = z.object({
  type: z.literal("NPC_RELATIONSHIP_CHANGED"),
  name: z.string().min(2),
  relationship: z.enum(["friendly", "neutral", "hostile", "unknown", "deceased"]),
  reason: z.string().nullish().transform(v => v ?? undefined),
});

const PlotFact = z.object({
  type: z.literal("PLOT_FACT_SET"),
  key: z.string().min(1),
  value: z.string().min(1),
});

const LocationMentioned = z.object({
  type: z.literal("LOCATION_MENTIONED"),
  name: z.string().min(2),
  region: z.string().nullish().transform(v => v ?? undefined),
  source: z.string().nullish().transform(v => v ?? undefined),
});

const ChroniclerUpdate = z.discriminatedUnion("type", [NpcMet, NpcRel, PlotFact, LocationMentioned]);
const ChroniclerOutput = z.object({
  updates: z.array(ChroniclerUpdate).default([]),
});

export type ChroniclerUpdateT = z.infer<typeof ChroniclerUpdate>;

export interface ChroniclerContext {
  playerIntent: string;
  narrative: string;
  previousNarrative?: string | null;
  knownNpcs: Array<{ name: string; role?: string | null }>;
  knownPlayerChars: Array<{ name: string }>;
  knownLocations: Array<{ name: string; region?: string | null; rumored?: boolean }>;
  currentLocation?: string | null;
  currentRegion?: string | null;
}

const SYSTEM_PROMPT = `You are the CHRONICLER for an AI-driven fantasy RPG. The Game Master has just narrated a scene; your job is to read that prose and the player's intent, then extract a structured ledger of bookkeeping updates for the world state.

You are NOT a writer. You are a careful, conservative records clerk. You return ONLY a JSON object with one key, "updates", whose value is an array of update objects. Empty array is valid and often correct.

ALLOWED UPDATE TYPES (and ONLY these):
  - NPC_MET — a named, on-screen character was just introduced/encountered. {name, pronouns, role, description, location, relationship, notes, replaces?}
  - NPC_RELATIONSHIP_CHANGED — a previously-known NPC's relationship shifted. {name, relationship, reason}
  - PLOT_FACT_SET — a concrete narrative fact was just established (a name, a location for something, a quest reward, a reveal). {key, value} — key is snake_case.
  - LOCATION_MENTIONED — a place was named/referenced but the party did NOT visit it this turn. {name, region?, source?}

DISAMBIGUATION RULES (these are the failure modes you must avoid):

1. POSSESSIVE OVERLAP. In phrases like "Braegad's Hollow", "Arden's Reach", "Marek's Rest" — the FULL phrase is the LOCATION NAME. The possessor ("Braegad", "Arden", "Marek") is NOT automatically an NPC. Only treat the possessor as an NPC if the narrative independently introduces them as a living, on-screen person ("Braegad himself stepped out of the door"). A mere place name is just a place name. Emit LOCATION_MENTIONED for the full phrase if the party hasn't visited it; emit nothing for the possessor.

2. MET vs MENTIONED. Only emit NPC_MET when an actual character is PRESENT in the scene — visible, audible, interactable. References in dialogue or rumor ("the Sheriff has put up a bounty", "they say Brother Aldric leads the cult") are PLOT_FACT_SET, never NPC_MET. The test: would the player be able to address this character right now? If not, it's a fact, not a meeting.

3. INITIALS AND PARTIAL NAMES. A single letter or initial on a note, letter, or scrap ("signed only 'J.'", "the letter ends with 'M.'") is NOT an NPC name. Do NOT emit NPC_MET for "J" or "J.". You may emit PLOT_FACT_SET like {key: "mystery_correspondent_initial", value: "J"} to record the clue. If the full name is later revealed, that is when NPC_MET fires (with replaces if it disambiguates).

4. GROUPS AND CROWDS. "the guards", "a band of bandits", "the patrons", "the crowd" are NOT NPCs. Skip them unless one is given a proper name and singled out.

5. ANIMALS AND CREATURES. Common animals (cat, rat, seagull, horse, wolf) are NOT NPCs unless they are clearly intelligent, named, and speaking. Skip them.

6. LOCATION_MENTIONED vs CURRENT LOCATION. The CURRENT_LOCATION (where the party physically is right now) is tracked separately by the narrator's scene object. Do NOT emit LOCATION_MENTIONED for the current location. Only emit it for places that are TALKED ABOUT, POINTED TO, or LEARNED ABOUT but not visited this turn.

7. DEDUP. If a name is already in the KNOWN list, do NOT re-emit NPC_MET or LOCATION_MENTIONED for it — unless you have a relationship change (then use NPC_RELATIONSHIP_CHANGED) or a name reveal (then NPC_MET with the "replaces" field set to the old alias).

8. BE CONSERVATIVE. When in doubt, emit nothing. A missed NPC is recoverable; a phantom NPC pollutes the ledger.

Return ONLY a JSON object: {"updates": [...]} with no markdown fences, no commentary.

EVERY object in the updates array MUST include the "type" field. Do not omit it. Concrete example of a valid response:

{"updates": [
  {"type":"NPC_MET","name":"Mara Holloway","pronouns":"she/her","role":"caravan guard","description":"A wiry woman with a scar across her cheek and quick, watchful eyes.","location":"The Salted Rose Inn","relationship":"neutral","notes":"Claims to know the back roads better than the merchants."},
  {"type":"LOCATION_MENTIONED","name":"Thornwick Bridge","region":"The Greylands","source":"Mara's warning about bandits"},
  {"type":"PLOT_FACT_SET","key":"bandit_bounty","value":"Sheriff Boren has placed a 100gp bounty on the bandit leader"}
]}

When a place is named that the party did not visit this turn, PREFER "LOCATION_MENTIONED" over "PLOT_FACT_SET" so the journey map can record it.`;

function buildUserPrompt(ctx: ChroniclerContext): string {
  const knownNpcList = ctx.knownNpcs.length
    ? ctx.knownNpcs.slice(0, 30).map(n => `- ${n.name}${n.role ? ` (${n.role})` : ""}`).join("\n")
    : "- (none known yet)";
  const knownLocList = ctx.knownLocations.length
    ? ctx.knownLocations.slice(0, 40).map(l => `- ${l.name}${l.region ? ` [${l.region}]` : ""}${l.rumored ? " (rumored)" : ""}`).join("\n")
    : "- (none known yet)";
  const knownPcList = ctx.knownPlayerChars.length
    ? ctx.knownPlayerChars.map(c => `- ${c.name}`).join("\n")
    : "- (none)";

  return `KNOWN PLAYER CHARACTERS (never emit NPC_MET for these):
${knownPcList}

KNOWN NPCs (do NOT re-emit NPC_MET; use NPC_RELATIONSHIP_CHANGED if relationship shifts):
${knownNpcList}

KNOWN LOCATIONS (do NOT re-emit LOCATION_MENTIONED for these):
${knownLocList}

CURRENT LOCATION: ${ctx.currentLocation ?? "(unknown)"}
CURRENT REGION:   ${ctx.currentRegion ?? "(unknown)"}

${ctx.previousNarrative ? `PREVIOUS GM NARRATIVE (for context, do not extract from this — only the new narrative below):\n${ctx.previousNarrative.slice(0, 800)}\n\n` : ""}PLAYER INTENT THIS TURN:
${ctx.playerIntent.slice(0, 600)}

NEW GM NARRATIVE TO CHRONICLE:
${ctx.narrative.slice(0, 2500)}

Return the JSON ledger object now.`;
}

export interface ChroniclerResult {
  /** True only when the chronicler completed end-to-end. Callers MUST check this
   *  before replacing narrator-emitted entity updates — a false `ok` means the
   *  chronicler errored or produced unusable output, and the narrator's own
   *  updates should be kept as the fallback ledger for that turn. */
  ok: boolean;
  updates: ChroniclerUpdateT[];
  reason?: string;
}

/** Hard ceiling on how long the chronicler can hold up the `done` SSE event.
 *  Better to surface narrator updates a beat sooner than make the player wait. */
const CHRONICLER_TIMEOUT_MS = 8000;

export async function runChronicler(ctx: ChroniclerContext): Promise<ChroniclerResult> {
  if (!ctx.narrative || ctx.narrative.trim().length < 20) {
    return { ok: true, updates: [] };
  }

  let raw = "";
  try {
    const callPromise = openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 800,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(ctx) },
      ],
    });
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`chronicler timeout after ${CHRONICLER_TIMEOUT_MS}ms`)), CHRONICLER_TIMEOUT_MS),
    );
    const response = await Promise.race([callPromise, timeoutPromise]);
    raw = response.choices[0]?.message?.content?.trim() ?? "{}";
  } catch (err: any) {
    console.error("[Chronicler] LLM call failed:", err?.message ?? err);
    return { ok: false, updates: [], reason: `llm_call_failed: ${err?.message ?? "unknown"}` };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error("[Chronicler] Failed to JSON.parse model output:", raw.slice(0, 200));
    return { ok: false, updates: [], reason: "json_parse_failed" };
  }

  const result = ChroniclerOutput.safeParse(parsed);
  if (result.success) {
    return { ok: true, updates: applyDisambiguation(result.data.updates, ctx) };
  }

  // Best-effort salvage: infer missing `type` from object shape, parse each entry individually.
  const maybeArr = (parsed as any)?.updates;
  if (Array.isArray(maybeArr)) {
    const salvaged: ChroniclerUpdateT[] = [];
    for (const u of maybeArr) {
      const inferred = inferUpdateType(u);
      const r = ChroniclerUpdate.safeParse(inferred);
      if (r.success) salvaged.push(r.data);
    }
    // Salvage succeeded only if we recovered all entries — partial recovery is
    // unsafe because we may have lost an NPC_MET that the narrator was relying
    // on us to register. Returning ok:false in that case lets runGM keep the
    // narrator's full ledger instead of a half-rewritten one.
    if (salvaged.length === maybeArr.length && salvaged.length > 0) {
      console.log(`[Chronicler] Salvaged ${salvaged.length} updates via shape inference.`);
      return { ok: true, updates: applyDisambiguation(salvaged, ctx) };
    }
    if (salvaged.length > 0) {
      console.error(`[Chronicler] Partial salvage (${salvaged.length}/${maybeArr.length}) — treating as failure to avoid losing entity updates.`);
    }
  }
  console.error("[Chronicler] Output failed schema:", result.error.message);
  console.error("[Chronicler] Raw model output was:", raw.slice(0, 600));
  return { ok: false, updates: [], reason: "schema_failed" };
}

/**
 * Salvage helper: if the model produced an update object without a "type"
 * field, infer the type from its shape. gpt-4o-mini occasionally drops the
 * discriminator and just emits `{key, value}` or `{name, region}` directly.
 */
function inferUpdateType(u: any): any {
  if (!u || typeof u !== "object") return u;
  if (typeof u.type === "string") return u;
  if (typeof u.key === "string" && (typeof u.value === "string" || typeof u.value === "number")) {
    return { ...u, type: "PLOT_FACT_SET", value: String(u.value) };
  }
  if (typeof u.name === "string" && (typeof u.region === "string" || typeof u.source === "string") && !u.role && !u.pronouns) {
    return { ...u, type: "LOCATION_MENTIONED" };
  }
  if (typeof u.name === "string" && typeof u.relationship === "string" && !u.role && !u.description) {
    return { ...u, type: "NPC_RELATIONSHIP_CHANGED" };
  }
  if (typeof u.name === "string" && (typeof u.role === "string" || typeof u.description === "string")) {
    return { ...u, type: "NPC_MET" };
  }
  return u;
}

/**
 * Final server-side guard. Even with the prompt, the model occasionally
 * regresses on edge cases — this is the deterministic safety belt.
 */
function applyDisambiguation(updates: ChroniclerUpdateT[], ctx: ChroniclerContext): ChroniclerUpdateT[] {
  const knownNpcLower = new Set(ctx.knownNpcs.map(n => n.name.toLowerCase()));
  const knownPcLower = new Set(ctx.knownPlayerChars.map(c => c.name.toLowerCase()));
  const knownLocLower = new Set(ctx.knownLocations.map(l => l.name.toLowerCase()));
  const currentLocLower = (ctx.currentLocation ?? "").toLowerCase();
  const narrative = ctx.narrative;

  // Build a map: "hollow" -> "Braegad's Hollow" so we can detect when a
  // proposed NPC name is actually the place-noun half of a possessive location.
  const possessivePlaceTails = new Map<string, string>();
  const possessiveRe = /\b([A-Z][a-z]+)'s\s+([A-Z][a-z]+)\b/g;
  let m: RegExpExecArray | null;
  while ((m = possessiveRe.exec(narrative)) !== null) {
    possessivePlaceTails.set(m[2].toLowerCase(), `${m[1]}'s ${m[2]}`);
  }

  const out: ChroniclerUpdateT[] = [];
  for (const u of updates) {
    if (u.type === "NPC_MET") {
      const lower = u.name.toLowerCase();
      // Already known — drop (the chronicler is supposed to dedup, but belt-and-braces).
      if (knownNpcLower.has(lower) || knownPcLower.has(lower)) continue;
      // Reject single-initial names like "J", "J.", "M.".
      if (/^[A-Za-z]\.?$/.test(u.name.trim())) continue;
      // Reject names that are the place-noun half of a "X's Y" location in this narrative.
      if (possessivePlaceTails.has(lower)) {
        console.log(`[Chronicler] Rejected NPC_MET "${u.name}" — appears as the place noun of location "${possessivePlaceTails.get(lower)}"`);
        continue;
      }
      // Reject names that exactly match a known location word.
      if (knownLocLower.has(lower)) continue;
      out.push(u);
    } else if (u.type === "LOCATION_MENTIONED") {
      const lower = u.name.toLowerCase();
      if (knownLocLower.has(lower)) continue;
      if (lower === currentLocLower) continue;
      out.push(u);
    } else {
      out.push(u);
    }
  }
  return out;
}
