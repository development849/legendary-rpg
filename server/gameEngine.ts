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

// Character classes base HP
export const CLASS_BASE_HP: Record<string, number> = {
  fighter: 12,
  rogue: 8,
  wizard: 6,
  cleric: 10,
};

// Default stats by class
export function getDefaultStats(cls: string): Record<string, number> {
  const base = { might: 10, agility: 10, endurance: 10, intellect: 10, will: 10, presence: 10 };
  switch (cls) {
    case "fighter":
      return { ...base, might: 14, endurance: 12 };
    case "rogue":
      return { ...base, agility: 14, presence: 12 };
    case "wizard":
      return { ...base, intellect: 14, will: 12 };
    case "cleric":
      return { ...base, will: 14, presence: 12 };
    default:
      return base;
  }
}

// Starting inventory by class
export function getStartingInventory(cls: string): any[] {
  const common = [
    { name: "Rations (3 days)", type: "consumable", qty: 1, properties: {} },
    { name: "Torch", type: "tool", qty: 3, properties: {} },
    { name: "Coin Pouch (10gp)", type: "treasure", qty: 1, properties: { value: 10 } },
  ];
  switch (cls) {
    case "fighter":
      return [...common,
        { name: "Longsword", type: "weapon", qty: 1, properties: { damage: "1d8", bonus: 2 } },
        { name: "Chain Mail", type: "armor", qty: 1, properties: { ac: 14 } },
        { name: "Shield", type: "armor", qty: 1, properties: { ac_bonus: 2 } },
      ];
    case "rogue":
      return [...common,
        { name: "Short Sword", type: "weapon", qty: 1, properties: { damage: "1d6", bonus: 2 } },
        { name: "Daggers", type: "weapon", qty: 3, properties: { damage: "1d4", thrown: true } },
        { name: "Leather Armor", type: "armor", qty: 1, properties: { ac: 11 } },
        { name: "Thieves' Tools", type: "tool", qty: 1, properties: {} },
      ];
    case "wizard":
      return [...common,
        { name: "Arcane Staff", type: "weapon", qty: 1, properties: { damage: "1d6" } },
        { name: "Spellbook", type: "tool", qty: 1, properties: {} },
        { name: "Robes", type: "armor", qty: 1, properties: { ac: 10 } },
        { name: "Focus Crystal", type: "misc", qty: 1, properties: { focus: 3 } },
      ];
    case "cleric":
      return [...common,
        { name: "Mace", type: "weapon", qty: 1, properties: { damage: "1d6", bonus: 1 } },
        { name: "Scale Mail", type: "armor", qty: 1, properties: { ac: 13 } },
        { name: "Holy Symbol", type: "misc", qty: 1, properties: {} },
        { name: "Prayer Beads", type: "misc", qty: 1, properties: { focus: 2 } },
      ];
    default:
      return common;
  }
}

// Starting abilities by class
export function getStartingAbilities(cls: string): any[] {
  switch (cls) {
    case "fighter":
      return [
        { id: "second_wind", name: "Second Wind", description: "Regain 1d10+level HP as a bonus action (once per rest)", usesMax: 1, usesLeft: 1 },
        { id: "action_surge", name: "Action Surge", description: "Take an extra action on your turn (once per rest)", usesMax: 1, usesLeft: 1 },
      ];
    case "rogue":
      return [
        { id: "sneak_attack", name: "Sneak Attack", description: "Deal 1d6 extra damage when you have advantage or an ally nearby", usesMax: -1, usesLeft: -1 },
        { id: "cunning_action", name: "Cunning Action", description: "Dash, Disengage, or Hide as a bonus action", usesMax: -1, usesLeft: -1 },
      ];
    case "wizard":
      return [
        { id: "arcane_blast", name: "Arcane Blast", description: "Ranged spell attack dealing 1d10 force damage", usesMax: -1, usesLeft: -1 },
        { id: "mage_armor", name: "Mage Armor", description: "Set AC to 13+agility modifier for 8 hours (uses 1 Focus)", usesMax: -1, usesLeft: -1 },
        { id: "sleep_spell", name: "Sleep", description: "Put creatures in a 20ft radius to sleep (uses 1 Focus). Affects up to 5d8 HP worth of creatures", usesMax: 2, usesLeft: 2 },
      ];
    case "cleric":
      return [
        { id: "sacred_flame", name: "Sacred Flame", description: "Ranged spell attack dealing 1d8 radiant damage", usesMax: -1, usesLeft: -1 },
        { id: "healing_word", name: "Healing Word", description: "Heal a creature for 1d4+will modifier HP (uses 1 Focus)", usesMax: -1, usesLeft: -1 },
        { id: "divine_smite", name: "Divine Smite", description: "Add 2d8 radiant damage to a melee hit (uses 1 Focus)", usesMax: -1, usesLeft: -1 },
      ];
    default:
      return [];
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
