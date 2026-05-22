// Mythweave Lite – Deterministic Rules Engine

export type Die = "d4" | "d6" | "d8" | "d10" | "d12" | "d20" | "d100";
export type AdvantageState = "normal" | "advantage" | "disadvantage";

export interface DiceRollResult {
  die: Die;
  count: number;
  modifier: number;
  advantageState: AdvantageState;
  rolls: number[];
  kept: number[];
  total: number;
  label?: string;
}

function rollOne(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

function dieSides(die: Die): number {
  const map: Record<Die, number> = {
    d4: 4, d6: 6, d8: 8, d10: 10, d12: 12, d20: 20, d100: 100,
  };
  return map[die];
}

export function parseDieString(raw: string): { die: Die; count: number; modifier: number } {
  const m = raw.match(/^(\d+)?d(\d+)([+-]\d+)?$/i);
  if (!m) return { die: (raw as Die) || "d20", count: 1, modifier: 0 };
  const count = m[1] ? parseInt(m[1]) : 1;
  const die = `d${m[2]}` as Die;
  const modifier = m[3] ? parseInt(m[3]) : 0;
  return { die, count, modifier };
}

export function rollDice(
  die: Die,
  count: number,
  modifier: number = 0,
  advantageState: AdvantageState = "normal",
  label?: string,
): DiceRollResult {
  const sides = dieSides(die);
  let rolls: number[] = [];
  let kept: number[] = [];

  if (die === "d20" && advantageState !== "normal") {
    // Roll twice, keep based on advantage/disadvantage
    const r1 = rollOne(sides);
    const r2 = rollOne(sides);
    rolls = [r1, r2];
    if (advantageState === "advantage") {
      kept = [Math.max(r1, r2)];
    } else {
      kept = [Math.min(r1, r2)];
    }
  } else {
    for (let i = 0; i < count; i++) {
      rolls.push(rollOne(sides));
    }
    kept = [...rolls];
  }

  const total = kept.reduce((a, b) => a + b, 0) + modifier;

  return { die, count, modifier, advantageState, rolls, kept, total, label };
}

// DC table from Mythweave Lite
export const DC_TABLE = {
  trivial: 5,
  easy: 8,
  moderate: 12,
  hard: 16,
  veryHard: 20,
  legendary: 25,
};

export function abilityCheck(
  modifier: number,
  dc: number,
  advantageState: AdvantageState = "normal",
): { result: DiceRollResult; success: boolean; margin: number } {
  const result = rollDice("d20", 1, modifier, advantageState, "ability check");
  const success = result.total >= dc;
  return { result, success, margin: result.total - dc };
}

// Stats → modifier (like D&D style but for Mythweave)
export function statModifier(statValue: number): number {
  return Math.floor((statValue - 10) / 2);
}

// ─── Legacy fantasy-only shims ───────────────────────────────────────────────
// These four exports used to hard-code fantasy classes; they now delegate to
// the genre registry so the rest of the engine keeps working unchanged for
// fantasy campaigns. New code should call the genre-aware helpers in
// `@shared/genres` directly with an explicit genreId.
import {
  DEFAULT_GENRE_ID,
  getClassBaseHp as _getClassBaseHpForGenre,
  getClassBaseMp as _getClassBaseMpForGenre,
  getDefaultStatsForClass as _getDefaultStatsForGenre,
  getStartingInventoryForClass as _getStartingInventoryForGenre,
  getStartingAbilitiesForClass as _getStartingAbilitiesForGenre,
  getRaceBonusesFor as _getRaceBonusesForGenre,
  getClassesForGenre,
} from "@shared/genres";

function _fantasyClassIds(): string[] {
  return getClassesForGenre(DEFAULT_GENRE_ID).map(c => c.id);
}

export const CLASS_BASE_HP: Record<string, number> = Object.fromEntries(
  _fantasyClassIds().map(id => [id, _getClassBaseHpForGenre(DEFAULT_GENRE_ID, id)]),
);

export const CLASS_BASE_MP: Record<string, number> = Object.fromEntries(
  _fantasyClassIds().map(id => [id, _getClassBaseMpForGenre(DEFAULT_GENRE_ID, id)]),
);

export function getDefaultStats(cls: string): Record<string, number> {
  return _getDefaultStatsForGenre(DEFAULT_GENRE_ID, cls);
}

// Starting inventory by class — fantasy default; for other genres call the
// registry helper directly with the campaign's genreId.
export function getStartingInventory(cls: string): any[] {
  return _getStartingInventoryForGenre(DEFAULT_GENRE_ID, cls);
}


// Starting abilities by class — fantasy default; for other genres call the
// registry helper directly with the campaign's genreId.
export function getStartingAbilities(cls: string): any[] {
  return _getStartingAbilitiesForGenre(DEFAULT_GENRE_ID, cls);
}

// Racial stat bonuses — fantasy default; for other genres call the registry
// helper directly with the campaign's genreId.
export function getRaceBonuses(race: string): Record<string, number> {
  return _getRaceBonusesForGenre(DEFAULT_GENRE_ID, race);
}

// Background ability — one bonus ability tied to character background
export function getBackgroundAbility(background: string, cls: string): any {
  const bg = background.toLowerCase().replace(/\s+/g, "_");
  switch (bg) {
    case "soldier":
      return {
        id: "battle_hardened",
        name: "Battle-Hardened",
        description: "Advantage on Might saves against fear and exhaustion. Call out a rallying order to grant an ally +1d6 on their next attack roll (recharges after a rest).",
        usesMax: 1, usesLeft: 1, recharge: "per-rest",
        source: "background",
      };
    case "scholar":
      return {
        id: "wealth_of_knowledge",
        name: "Wealth of Knowledge",
        description: "Identify magical items and recall obscure lore without rolling. +2 bonus to all Intellect checks when researching a topic with access to texts.",
        usesMax: -1, usesLeft: -1, recharge: "at-will",
        source: "background",
      };
    case "criminal":
      return {
        id: "street_network",
        name: "Street Network",
        description: "Locate a criminal contact in the current settlement who can provide information, fenced goods, or a safe house (recharges per session).",
        usesMax: 1, usesLeft: 1, recharge: "per-session",
        source: "background",
      };
    case "acolyte":
      return {
        id: "deitys_favor",
        name: "Deity's Favor",
        description: "Spend 10 minutes in prayer. The GM truthfully answers one yes/no question about the safest or most righteous path forward (recharges after a long rest).",
        usesMax: 1, usesLeft: 1, recharge: "per-day",
        source: "background",
      };
    case "merchant":
      return {
        id: "appraisers_eye",
        name: "Appraiser's Eye",
        description: "Determine exact market value of any item at a glance. Advantage on Presence checks to negotiate prices, debts, or favors.",
        usesMax: -1, usesLeft: -1, recharge: "at-will",
        source: "background",
      };
    case "noble":
      return {
        id: "noble_authority",
        name: "Noble Authority",
        description: "Aristocrats and officials treat you as a social equal. Invoke your noble status to gain an audience, dismiss minor threats, or avoid arrest (recharges per session).",
        usesMax: 1, usesLeft: 1, recharge: "per-session",
        source: "background",
      };
    case "outlander":
      return {
        id: "pathfinder",
        name: "Pathfinder",
        description: "Never lost in wilderness. Always locate food, water, and shelter outdoors without rolling. Advantage on checks to track creatures across natural terrain.",
        usesMax: -1, usesLeft: -1, recharge: "at-will",
        source: "background",
      };
    case "sailor":
      return {
        id: "salt_and_sinew",
        name: "Salt & Sinew",
        description: "Immune to sea sickness and unstable footing aboard vessels. Advantage on Agility checks made on ships, in storms, or on treacherous wet terrain.",
        usesMax: -1, usesLeft: -1, recharge: "at-will",
        source: "background",
      };
    case "folk_hero":
      return {
        id: "champions_welcome",
        name: "Champion's Welcome",
        description: "Common folk are predisposed to trust and shelter you. A willing commoner provides unexpected aid — shelter, information, or a diversion (recharges per session).",
        usesMax: 1, usesLeft: 1, recharge: "per-session",
        source: "background",
      };
    case "hermit":
      return {
        id: "still_mind",
        name: "Still Mind",
        description: "Advantage on Will saves against mind-affecting magic and illusions. Meditate for 10 minutes to gain advantage on your next Will or Intellect check (recharges after a long rest).",
        usesMax: 1, usesLeft: 1, recharge: "per-day",
        source: "background",
      };
    case "charlatan":
      return {
        id: "thousand_faces",
        name: "Thousand Faces",
        description: "Advantage on Presence checks to deceive, impersonate, or bluff. Can maintain a convincing false identity for up to one week without active effort.",
        usesMax: -1, usesLeft: -1, recharge: "at-will",
        source: "background",
      };
    case "guild_artisan":
      return {
        id: "master_crafter",
        name: "Master Crafter",
        description: "Craft, identify, or repair any mundane item given materials and time. Advantage on all Intellect checks relating to your craft or trade.",
        usesMax: -1, usesLeft: -1, recharge: "at-will",
        source: "background",
      };
    default:
      return {
        id: "worldly_experience",
        name: "Worldly Experience",
        description: "Your varied past gives you advantage on one Presence or Intellect check when drawing on life experience outside your class training (recharges per session).",
        usesMax: 1, usesLeft: 1, recharge: "per-session",
        source: "background",
      };
  }
}

// XP thresholds per level (Mythweave Lite)
export const XP_THRESHOLDS = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000];

export function xpToLevel(xp: number): number {
  for (let lvl = XP_THRESHOLDS.length; lvl >= 1; lvl--) {
    if (xp >= (XP_THRESHOLDS[lvl - 1] ?? 0)) return lvl;
  }
  return 1;
}

export function enforceHandLimits(inv: any[], protectedIdx?: number): any[] {
  const result = [...inv];
  const handItems: { idx: number; hands: number }[] = [];
  result.forEach((it: any, idx: number) => {
    if (!it.equipped) return;
    if (it.type === "jewelry") return;
    const isW = it.type === "weapon";
    const isS = it.type === "armor" && !!it.properties?.ac_bonus && !it.properties?.slot;
    if (isW || isS) {
      handItems.push({ idx, hands: it.properties?.two_handed ? 2 : 1 });
    }
  });
  let handsUsed = handItems.reduce((sum: number, h: { hands: number }) => sum + h.hands, 0);
  const unprotected = handItems.filter(h => h.idx !== protectedIdx);
  let i = 0;
  while (handsUsed > 2 && i < unprotected.length) {
    result[unprotected[i].idx] = { ...result[unprotected[i].idx], equipped: false };
    handsUsed -= unprotected[i].hands;
    i++;
  }
  return result;
}
