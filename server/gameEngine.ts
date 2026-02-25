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
  ranger: 10,
  paladin: 10,
  barbarian: 12,
  bard: 8,
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
    case "ranger":
      return { ...base, agility: 14, endurance: 12 };
    case "paladin":
      return { ...base, might: 14, will: 12 };
    case "barbarian":
      return { ...base, might: 14, endurance: 14 };
    case "bard":
      return { ...base, presence: 14, will: 12 };
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
        { name: "Longsword", type: "weapon", qty: 1, rarity: "common", equipped: true, properties: { damage: "1d8", bonus: 2 } },
        { name: "Chain Mail", type: "armor", qty: 1, rarity: "common", equipped: true, properties: { ac: 14 } },
        { name: "Shield", type: "armor", qty: 1, rarity: "common", equipped: true, properties: { ac_bonus: 2 } },
      ];
    case "rogue":
      return [...common,
        { name: "Short Sword", type: "weapon", qty: 1, rarity: "common", equipped: true, properties: { damage: "1d6", bonus: 2 } },
        { name: "Daggers", type: "weapon", qty: 3, rarity: "common", properties: { damage: "1d4", thrown: true } },
        { name: "Leather Armor", type: "armor", qty: 1, rarity: "common", equipped: true, properties: { ac: 11 } },
        { name: "Thieves' Tools", type: "tool", qty: 1, properties: {} },
      ];
    case "wizard":
      return [...common,
        { name: "Arcane Staff", type: "weapon", qty: 1, rarity: "common", equipped: true, properties: { damage: "1d6" } },
        { name: "Spellbook", type: "tool", qty: 1, properties: {} },
        { name: "Robes", type: "armor", qty: 1, rarity: "common", equipped: true, properties: { ac: 10 } },
        { name: "Focus Crystal", type: "misc", qty: 1, properties: { focus: 3 } },
      ];
    case "cleric":
      return [...common,
        { name: "Mace", type: "weapon", qty: 1, rarity: "common", equipped: true, properties: { damage: "1d6", bonus: 1 } },
        { name: "Scale Mail", type: "armor", qty: 1, rarity: "common", equipped: true, properties: { ac: 13 } },
        { name: "Holy Symbol", type: "misc", qty: 1, properties: {} },
        { name: "Prayer Beads", type: "misc", qty: 1, properties: { focus: 2 } },
      ];
    case "ranger":
      return [...common,
        { name: "Longbow", type: "weapon", qty: 1, rarity: "common", equipped: true, properties: { damage: "1d8", range: 150 } },
        { name: "Arrows", type: "consumable", qty: 20, properties: {} },
        { name: "Short Sword", type: "weapon", qty: 1, rarity: "common", properties: { damage: "1d6", bonus: 1 } },
        { name: "Studded Leather Armor", type: "armor", qty: 1, rarity: "common", equipped: true, properties: { ac: 12 } },
        { name: "Herbalism Kit", type: "tool", qty: 1, properties: {} },
      ];
    case "paladin":
      return [...common,
        { name: "Longsword", type: "weapon", qty: 1, rarity: "common", equipped: true, properties: { damage: "1d8", bonus: 2 } },
        { name: "Shield", type: "armor", qty: 1, rarity: "common", equipped: true, properties: { ac_bonus: 2 } },
        { name: "Half-Plate", type: "armor", qty: 1, rarity: "common", equipped: true, properties: { ac: 15 } },
        { name: "Holy Symbol", type: "misc", qty: 1, properties: { focus: 3 } },
        { name: "Healing Potion", type: "consumable", qty: 1, properties: { heal: "2d4+2" } },
      ];
    case "barbarian":
      return [...common,
        { name: "Greataxe", type: "weapon", qty: 1, rarity: "common", equipped: true, properties: { damage: "1d12", bonus: 2, two_handed: true } },
        { name: "Handaxe", type: "weapon", qty: 2, rarity: "common", properties: { damage: "1d6", thrown: true } },
        { name: "Hide Armor", type: "armor", qty: 1, rarity: "common", equipped: true, properties: { ac: 12 } },
        { name: "Hunting Trap", type: "tool", qty: 1, properties: {} },
      ];
    case "bard":
      return [...common,
        { name: "Rapier", type: "weapon", qty: 1, rarity: "common", equipped: true, properties: { damage: "1d8", bonus: 1, finesse: true } },
        { name: "Lute", type: "misc", qty: 1, properties: { focus: 3 } },
        { name: "Leather Armor", type: "armor", qty: 1, rarity: "common", equipped: true, properties: { ac: 11 } },
        { name: "Component Pouch", type: "misc", qty: 1, properties: {} },
        { name: "Disguise Kit", type: "tool", qty: 1, properties: {} },
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
    case "ranger":
      return [
        { id: "hunters_mark", name: "Hunter's Mark", description: "Mark a creature as your quarry. Deal 1d6 extra damage against it and track it unerringly (concentration)", usesMax: -1, usesLeft: -1 },
        { id: "volley", name: "Volley", description: "Fire a hail of arrows in a 10ft radius; each creature makes an Agility save (DC 13) or takes 1d8 damage", usesMax: 2, usesLeft: 2 },
        { id: "natural_explorer", name: "Natural Explorer", description: "Advantage on Endurance checks in wilderness, never lost outdoors, double rations foraged", usesMax: -1, usesLeft: -1 },
      ];
    case "paladin":
      return [
        { id: "lay_on_hands", name: "Lay on Hands", description: "Touch a creature to restore up to 5 HP from a shared pool (pool refreshes on rest)", usesMax: 5, usesLeft: 5 },
        { id: "paladin_divine_smite", name: "Divine Smite", description: "After hitting with a melee weapon, expend 1 Focus to deal an extra 2d8 radiant damage", usesMax: -1, usesLeft: -1 },
        { id: "aura_of_protection", name: "Aura of Protection", description: "Allies within 10ft add your Will modifier to all saving throws", usesMax: -1, usesLeft: -1 },
      ];
    case "barbarian":
      return [
        { id: "rage", name: "Rage", description: "Enter a furious rage for 1 minute: +2 damage on melee attacks, resistance to physical damage, advantage on Might checks (2 uses per rest)", usesMax: 2, usesLeft: 2 },
        { id: "reckless_attack", name: "Reckless Attack", description: "Attack with advantage, but enemies also have advantage against you until your next turn", usesMax: -1, usesLeft: -1 },
        { id: "danger_sense", name: "Danger Sense", description: "Advantage on Agility saving throws against effects you can see (traps, spells, hazards)", usesMax: -1, usesLeft: -1 },
      ];
    case "bard":
      return [
        { id: "bardic_inspiration", name: "Bardic Inspiration", description: "Grant an ally a d6 they can add to any roll in the next 10 minutes (Presence modifier uses per rest)", usesMax: 3, usesLeft: 3 },
        { id: "cutting_words", name: "Cutting Words", description: "Spend Bardic Inspiration to reduce an enemy's attack roll, damage roll, or ability check by 1d6", usesMax: -1, usesLeft: -1 },
        { id: "vicious_mockery", name: "Vicious Mockery", description: "Psychic insult deals 1d4 damage and gives the target disadvantage on its next attack (Will save DC 13 to resist)", usesMax: -1, usesLeft: -1 },
      ];
    default:
      return [];
  }
}

// Racial stat bonuses
export function getRaceBonuses(race: string): Record<string, number> {
  const r = race.toLowerCase();
  switch (r) {
    case "human":
      return { might: 1, agility: 1, endurance: 1, intellect: 1, will: 1, presence: 1 };
    case "elf":
      return { agility: 2 };
    case "dwarf":
      return { endurance: 2 };
    case "halfling":
      return { agility: 2 };
    case "half-orc":
      return { might: 2, endurance: 1 };
    case "tiefling":
      return { presence: 2, intellect: 1 };
    case "dragonborn":
      return { might: 2, presence: 1 };
    case "gnome":
      return { intellect: 2 };
    case "aasimar":
      return { will: 2, presence: 1 };
    case "tabaxi":
      return { agility: 2, presence: 1 };
    case "genasi":
      return { intellect: 2, endurance: 1 };
    case "firbolg":
      return { will: 2, might: 1 };
    default:
      return {};
  }
}

// Background ability — one bonus ability tied to character background
export function getBackgroundAbility(background: string, cls: string): any {
  const bg = background.toLowerCase().replace(/\s+/g, "_");
  switch (bg) {
    case "soldier":
      return {
        id: "battle_hardened",
        name: "Battle-Hardened",
        description: "Advantage on Might saves against fear and exhaustion. Once per rest, call out a rallying order to grant an ally +1d6 on their next attack roll.",
        usesMax: -1, usesLeft: -1,
        source: "background",
      };
    case "scholar":
      return {
        id: "wealth_of_knowledge",
        name: "Wealth of Knowledge",
        description: "Identify magical items and recall obscure lore without rolling. +2 bonus to all Intellect checks when researching a topic with access to texts.",
        usesMax: -1, usesLeft: -1,
        source: "background",
      };
    case "criminal":
      return {
        id: "street_network",
        name: "Street Network",
        description: "Once per session, locate a criminal contact in the current settlement who can provide information, fenced goods, or a safe house.",
        usesMax: -1, usesLeft: -1,
        source: "background",
      };
    case "acolyte":
      return {
        id: "deitys_favor",
        name: "Deity's Favor",
        description: "Once per day, spend 10 minutes in prayer. The GM truthfully answers one yes/no question about the safest or most righteous path forward.",
        usesMax: 1, usesLeft: 1,
        source: "background",
      };
    case "merchant":
      return {
        id: "appraisers_eye",
        name: "Appraiser's Eye",
        description: "Determine exact market value of any item at a glance. Advantage on Presence checks to negotiate prices, debts, or favors.",
        usesMax: -1, usesLeft: -1,
        source: "background",
      };
    case "noble":
      return {
        id: "noble_authority",
        name: "Noble Authority",
        description: "Aristocrats and officials treat you as a social equal. Once per session, invoke your noble status to gain an audience, dismiss minor threats, or avoid arrest.",
        usesMax: -1, usesLeft: -1,
        source: "background",
      };
    case "outlander":
      return {
        id: "pathfinder",
        name: "Pathfinder",
        description: "Never lost in wilderness. Always locate food, water, and shelter outdoors without rolling. Advantage on checks to track creatures across natural terrain.",
        usesMax: -1, usesLeft: -1,
        source: "background",
      };
    case "sailor":
      return {
        id: "salt_and_sinew",
        name: "Salt & Sinew",
        description: "Immune to sea sickness and unstable footing aboard vessels. Advantage on Agility checks made on ships, in storms, or on treacherous wet terrain.",
        usesMax: -1, usesLeft: -1,
        source: "background",
      };
    case "folk_hero":
      return {
        id: "champions_welcome",
        name: "Champion's Welcome",
        description: "Common folk are predisposed to trust and shelter you. Once per session, a willing commoner provides unexpected aid — shelter, information, or a diversion.",
        usesMax: -1, usesLeft: -1,
        source: "background",
      };
    case "hermit":
      return {
        id: "still_mind",
        name: "Still Mind",
        description: "Advantage on Will saves against mind-affecting magic and illusions. Once per day, meditate for 10 minutes to gain advantage on your next Will or Intellect check.",
        usesMax: 1, usesLeft: 1,
        source: "background",
      };
    case "charlatan":
      return {
        id: "thousand_faces",
        name: "Thousand Faces",
        description: "Advantage on Presence checks to deceive, impersonate, or bluff. Can maintain a convincing false identity for up to one week without active effort.",
        usesMax: -1, usesLeft: -1,
        source: "background",
      };
    case "guild_artisan":
      return {
        id: "master_crafter",
        name: "Master Crafter",
        description: "Craft, identify, or repair any mundane item given materials and time. Advantage on all Intellect checks relating to your craft or trade.",
        usesMax: -1, usesLeft: -1,
        source: "background",
      };
    default:
      return {
        id: "worldly_experience",
        name: "Worldly Experience",
        description: "Your varied past gives you advantage on one Presence or Intellect check per session when drawing on life experience outside your class training.",
        usesMax: -1, usesLeft: -1,
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
