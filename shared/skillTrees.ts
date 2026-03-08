export type RechargeType = "at-will" | "per-encounter" | "per-rest" | "per-day" | "per-session";

export const RECHARGE_LABELS: Record<RechargeType, string> = {
  "at-will": "At Will",
  "per-encounter": "Per Encounter",
  "per-rest": "Per Rest",
  "per-day": "Per Day",
  "per-session": "Per Session",
};

export interface SkillOption {
  id: string;
  name: string;
  description: string;
  mechanicalEffect: string;
}

export interface SkillTier {
  level: number;
  choices: SkillOption[];
  pick: number;
}

export const CLASS_SKILL_TREES: Record<string, SkillTier[]> = {
  fighter: [
    {
      level: 5,
      pick: 1,
      choices: [
        { id: "extra_attack", name: "Extra Attack", description: "Strike twice when you take the Attack action.", mechanicalEffect: "+1 attack per attack action (passive)" },
        { id: "weapon_master", name: "Weapon Master", description: "Your critical hits deal devastating bonus damage.", mechanicalEffect: "+1d8 crit damage" },
        { id: "iron_will", name: "Iron Will", description: "Your discipline grants resistance to fear and charm effects.", mechanicalEffect: "Advantage on fear/charm saves" },
      ],
    },
    {
      level: 10,
      pick: 1,
      choices: [
        { id: "battle_hardened", name: "Battle Hardened", description: "Shrug off blows that would fell a lesser warrior.", mechanicalEffect: "Reduce incoming damage by 2" },
        { id: "tactical_surge", name: "Tactical Surge", description: "Take an additional action on your turn (recharges after a rest).", mechanicalEffect: "Bonus action, per rest" },
        { id: "whirlwind_strike", name: "Whirlwind Strike", description: "Attack all adjacent enemies in a sweeping arc.", mechanicalEffect: "AoE melee attack" },
      ],
    },
    {
      level: 15,
      pick: 1,
      choices: [
        { id: "indomitable", name: "Indomitable", description: "Reroll a failed saving throw (recharges after a rest).", mechanicalEffect: "Reroll 1 save, per rest" },
        { id: "champion_strike", name: "Champion's Strike", description: "Your attacks crit on 18-20, not just 20.", mechanicalEffect: "Expanded crit range 18-20" },
      ],
    },
    {
      level: 20,
      pick: 1,
      choices: [
        { id: "legendary_warrior", name: "Legendary Warrior", description: "Your presence alone turns the tide. Allies near you fight with renewed vigor.", mechanicalEffect: "+2 to all ally attack rolls nearby" },
        { id: "unstoppable", name: "Unstoppable", description: "When reduced to 0 HP, return to half health instead (recharges after a long rest).", mechanicalEffect: "Cheat death, per day" },
      ],
    },
  ],
  rogue: [
    {
      level: 5,
      pick: 1,
      choices: [
        { id: "evasion", name: "Evasion", description: "Nimbly dodge area effects, taking no damage on a successful save.", mechanicalEffect: "No damage on successful DEX save" },
        { id: "assassinate", name: "Assassinate", description: "Attacks against surprised enemies automatically crit.", mechanicalEffect: "Auto-crit on surprise" },
        { id: "silver_tongue", name: "Silver Tongue", description: "Your honeyed words can convince almost anyone of almost anything.", mechanicalEffect: "+4 to persuasion/deception" },
      ],
    },
    {
      level: 10,
      pick: 1,
      choices: [
        { id: "shadow_step", name: "Shadow Step", description: "Teleport between shadows up to 30 feet as a bonus action.", mechanicalEffect: "30ft shadow teleport" },
        { id: "poisoner", name: "Master Poisoner", description: "Apply deadly toxins to your blades that sap enemy strength.", mechanicalEffect: "+1d6 poison damage on attacks" },
        { id: "uncanny_dodge", name: "Uncanny Dodge", description: "Halve damage from an attack you can see coming (once per combat round).", mechanicalEffect: "Halve 1 attack's damage per round (passive)" },
      ],
    },
    {
      level: 15,
      pick: 1,
      choices: [
        { id: "death_strike", name: "Death Strike", description: "A devastating blow against an unaware target that doubles all damage.", mechanicalEffect: "Double damage on surprise attacks" },
        { id: "slippery_mind", name: "Slippery Mind", description: "Your mind is as slippery as your body. Gain proficiency in Wisdom saves.", mechanicalEffect: "Advantage on all mental saves" },
      ],
    },
    {
      level: 20,
      pick: 1,
      choices: [
        { id: "phantom_thief", name: "Phantom Thief", description: "You become virtually invisible in dim light and can pick any lock.", mechanicalEffect: "Auto-stealth in dim light, auto-pick locks" },
        { id: "stroke_of_luck", name: "Stroke of Luck", description: "Turn any missed attack into a hit, or any failed check into a success (recharges after a rest).", mechanicalEffect: "Auto-success, per rest" },
      ],
    },
  ],
  wizard: [
    {
      level: 5,
      pick: 1,
      choices: [
        { id: "fireball", name: "Fireball", description: "Hurl a bead of fire that detonates in a massive explosion.", mechanicalEffect: "8d6 fire AoE damage" },
        { id: "counterspell", name: "Counterspell", description: "React instantly to negate an enemy's spell before it takes effect (once per combat round).", mechanicalEffect: "Cancel 1 enemy spell per round (passive)" },
        { id: "arcane_ward", name: "Arcane Ward", description: "A shimmering barrier of force that absorbs damage.", mechanicalEffect: "Temp HP shield equal to level x2" },
      ],
    },
    {
      level: 10,
      pick: 1,
      choices: [
        { id: "teleport", name: "Teleport", description: "Instantly transport yourself and allies to a known location.", mechanicalEffect: "Party teleportation to known places" },
        { id: "elemental_mastery", name: "Elemental Mastery", description: "Choose fire, ice, or lightning — your spells of that element deal +50% damage.", mechanicalEffect: "+50% damage for chosen element" },
        { id: "spell_sculpting", name: "Spell Sculpting", description: "Shape area spells to avoid allies caught in the blast.", mechanicalEffect: "Exclude allies from AoE spells" },
      ],
    },
    {
      level: 15,
      pick: 1,
      choices: [
        { id: "time_stop", name: "Time Stop", description: "Briefly freeze time, allowing you to act while all others are frozen (recharges after a rest).", mechanicalEffect: "2 free actions, per rest" },
        { id: "spell_absorption", name: "Spell Absorption", description: "Convert incoming magical damage into restored spell energy.", mechanicalEffect: "Absorb spell damage to restore Focus" },
      ],
    },
    {
      level: 20,
      pick: 1,
      choices: [
        { id: "archmage", name: "Archmage", description: "Your mastery of magic is legendary. Cast your most powerful spells at will.", mechanicalEffect: "Cast 1st-3rd level spells without Focus cost" },
        { id: "wish", name: "Wish", description: "Channel raw magical force to reshape reality itself (recharges after a long rest).", mechanicalEffect: "Wish spell, per day" },
      ],
    },
  ],
  cleric: [
    {
      level: 5,
      pick: 1,
      choices: [
        { id: "spirit_guardians", name: "Spirit Guardians", description: "Summon spectral protectors that damage nearby enemies.", mechanicalEffect: "3d8 radiant AoE around you" },
        { id: "mass_healing", name: "Mass Healing Word", description: "Heal multiple allies with a single prayer.", mechanicalEffect: "Heal up to 3 allies for 1d4+WIL" },
        { id: "channel_divinity", name: "Channel Divinity", description: "Turn undead or empower your next attack with divine radiance.", mechanicalEffect: "Turn Undead or +2d8 radiant damage" },
      ],
    },
    {
      level: 10,
      pick: 1,
      choices: [
        { id: "divine_intervention", name: "Divine Intervention", description: "Call upon your deity for a miraculous intervention in desperate times (recharges after a long rest).", mechanicalEffect: "Call for divine aid, per day" },
        { id: "beacon_of_hope", name: "Beacon of Hope", description: "Allies in your presence heal for maximum when receiving healing.", mechanicalEffect: "Max healing for all allies nearby" },
        { id: "holy_aura", name: "Holy Aura", description: "A radiant aura that grants advantage on saves to nearby allies.", mechanicalEffect: "Allies get advantage on saves within 30ft" },
      ],
    },
    {
      level: 15,
      pick: 1,
      choices: [
        { id: "resurrection", name: "Resurrection", description: "Return a fallen ally to life, restoring them fully (recharges after a long rest).", mechanicalEffect: "Revive 1 dead ally, per day" },
        { id: "divine_shield", name: "Divine Shield", description: "An impenetrable barrier of holy light that blocks all damage for one round (recharges after a rest).", mechanicalEffect: "Immunity to damage for 1 round, per rest" },
      ],
    },
    {
      level: 20,
      pick: 1,
      choices: [
        { id: "avatar", name: "Divine Avatar", description: "Channel your god's full power, becoming an avatar of divine might (recharges after a long rest).", mechanicalEffect: "+4 to all stats, fly, radiant damage aura for 1 min, per day" },
        { id: "miracle", name: "Miracle", description: "Your faith can move mountains. Perform one miracle (recharges after a long rest).", mechanicalEffect: "Miracle spell, per day" },
      ],
    },
  ],
  ranger: [
    {
      level: 5,
      pick: 1,
      choices: [
        { id: "multishot", name: "Multishot", description: "Fire two arrows simultaneously at different targets.", mechanicalEffect: "2 ranged attacks per attack action (passive)" },
        { id: "beast_companion", name: "Beast Companion", description: "A loyal animal companion fights alongside you in battle.", mechanicalEffect: "Summon combat pet (wolf, hawk, or bear)" },
        { id: "snare_expert", name: "Snare Expert", description: "Set deadly traps that restrain and damage enemies.", mechanicalEffect: "Place traps that deal 2d6 + restrain" },
      ],
    },
    {
      level: 10,
      pick: 1,
      choices: [
        { id: "vanish", name: "Vanish", description: "Meld into your surroundings, becoming invisible in natural terrain.", mechanicalEffect: "Invisible in natural terrain as bonus action" },
        { id: "swift_quiver", name: "Swift Quiver", description: "Your quiver never empties, and you fire with supernatural speed.", mechanicalEffect: "+2 bonus ranged attacks per attack action (passive)" },
        { id: "terrain_master", name: "Terrain Master", description: "You move through any terrain as if it were open ground, and gain advantage on tracking.", mechanicalEffect: "Ignore difficult terrain, +4 tracking" },
      ],
    },
    {
      level: 15,
      pick: 1,
      choices: [
        { id: "legendary_hunter", name: "Legendary Hunter", description: "Your attacks against your quarry are devastatingly precise.", mechanicalEffect: "+2d6 damage against marked targets" },
        { id: "natures_veil", name: "Nature's Veil", description: "The wilds themselves protect you. Gain resistance to elemental damage.", mechanicalEffect: "Resistance to fire/cold/lightning damage" },
      ],
    },
    {
      level: 20,
      pick: 1,
      choices: [
        { id: "apex_predator", name: "Apex Predator", description: "You are the ultimate hunter. Your first attack each combat round auto-hits.", mechanicalEffect: "First attack auto-hits each round (passive)" },
        { id: "foe_slayer", name: "Foe Slayer", description: "Add your Intellect modifier to all attack and damage rolls.", mechanicalEffect: "+INT to attack and damage" },
      ],
    },
  ],
  paladin: [
    {
      level: 5,
      pick: 1,
      choices: [
        { id: "extra_attack_paladin", name: "Extra Attack", description: "Make two attacks when you take the Attack action.", mechanicalEffect: "+1 attack per attack action (passive)" },
        { id: "aura_of_courage", name: "Aura of Courage", description: "You and nearby allies are immune to the frightened condition.", mechanicalEffect: "Fear immunity 10ft aura" },
        { id: "smite_empowered", name: "Empowered Smite", description: "Your Divine Smite deals additional radiant damage.", mechanicalEffect: "+1d8 to Divine Smite damage" },
      ],
    },
    {
      level: 10,
      pick: 1,
      choices: [
        { id: "aura_of_protection", name: "Aura of Protection", description: "Allies within 10 feet add your Will modifier to their saving throws.", mechanicalEffect: "+WIL mod to ally saves in 10ft" },
        { id: "cleansing_touch", name: "Cleansing Touch", description: "End one spell effect on a willing creature with a touch (recharges after a rest).", mechanicalEffect: "Dispel 1 effect, per rest" },
        { id: "radiant_strikes", name: "Radiant Strikes", description: "All your weapon attacks deal bonus radiant damage.", mechanicalEffect: "+1d4 radiant on every hit" },
      ],
    },
    {
      level: 15,
      pick: 1,
      choices: [
        { id: "holy_nimbus", name: "Holy Nimbus", description: "Emanate a blinding radiance that damages enemies and heals allies.", mechanicalEffect: "10 radiant damage/round to enemies, 10 HP/round to allies nearby" },
        { id: "oath_champion", name: "Oath Champion", description: "Your oath grants supernatural resilience. Gain resistance to all non-magical damage.", mechanicalEffect: "Resistance to non-magical physical damage" },
      ],
    },
    {
      level: 20,
      pick: 1,
      choices: [
        { id: "celestial_form", name: "Celestial Form", description: "Sprout radiant wings and become a beacon of divine power (recharges after a long rest).", mechanicalEffect: "Fly, +30 max HP, radiant aura for 1 min, per day" },
        { id: "supreme_smite", name: "Supreme Smite", description: "Your smites become legendary, dealing massive damage to any foe.", mechanicalEffect: "Divine Smite deals 6d8 radiant" },
      ],
    },
  ],
  barbarian: [
    {
      level: 5,
      pick: 1,
      choices: [
        { id: "extra_attack_barb", name: "Extra Attack", description: "Make two attacks when you take the Attack action.", mechanicalEffect: "+1 attack per attack action (passive)" },
        { id: "feral_instinct", name: "Feral Instinct", description: "Your senses are preternaturally sharp. You cannot be surprised.", mechanicalEffect: "Can't be surprised, +4 initiative" },
        { id: "intimidating_presence", name: "Intimidating Presence", description: "Your sheer fury terrifies enemies, causing them to flee.", mechanicalEffect: "Frighten enemies within 30ft" },
      ],
    },
    {
      level: 10,
      pick: 1,
      choices: [
        { id: "brutal_critical", name: "Brutal Critical", description: "Your critical hits deal an additional weapon die of damage.", mechanicalEffect: "+1 weapon die on crits" },
        { id: "relentless_rage", name: "Relentless Rage", description: "If you drop to 0 HP while raging, make a save to stay at 1 HP instead.", mechanicalEffect: "Stay at 1 HP when dropped while raging" },
        { id: "primal_path", name: "Primal Path", description: "Your rage takes on elemental properties — fire, frost, or storm.", mechanicalEffect: "+1d6 elemental damage while raging" },
      ],
    },
    {
      level: 15,
      pick: 1,
      choices: [
        { id: "persistent_rage", name: "Persistent Rage", description: "Your rage never ends early unless you choose to end it.", mechanicalEffect: "Rage doesn't end early" },
        { id: "devastating_blow", name: "Devastating Blow", description: "Deliver a blow so powerful it stuns the target (once per rage).", mechanicalEffect: "Stun on hit, per encounter" },
      ],
    },
    {
      level: 20,
      pick: 1,
      choices: [
        { id: "primal_champion", name: "Primal Champion", description: "Your body reaches the peak of physical perfection.", mechanicalEffect: "+4 Might, +4 Endurance" },
        { id: "fury_incarnate", name: "Fury Incarnate", description: "Your rage becomes an unstoppable force of nature.", mechanicalEffect: "Unlimited rage, +2 to all damage" },
      ],
    },
  ],
  bard: [
    {
      level: 5,
      pick: 1,
      choices: [
        { id: "font_of_inspiration", name: "Font of Inspiration", description: "Your Bardic Inspiration dice recharge after a short rest instead of a long rest.", mechanicalEffect: "Bardic Inspiration recharges on short rest" },
        { id: "hypnotic_pattern", name: "Hypnotic Pattern", description: "Create a mesmerizing pattern that charms and incapacitates enemies.", mechanicalEffect: "AoE charm/incapacitate" },
        { id: "lore_master", name: "Lore Master", description: "Your vast knowledge grants proficiency in any skill you choose.", mechanicalEffect: "+3 to any 3 skill checks" },
      ],
    },
    {
      level: 10,
      pick: 1,
      choices: [
        { id: "magical_secrets", name: "Magical Secrets", description: "Learn spells from any class's spell list.", mechanicalEffect: "Learn 2 spells from any class" },
        { id: "countercharm", name: "Countercharm", description: "Your music dispels charm and fear effects on allies.", mechanicalEffect: "Remove charm/fear from all allies" },
        { id: "song_of_rest", name: "Song of Rest", description: "Allies who rest while you play heal additional hit points.", mechanicalEffect: "Allies heal +1d8 on rest" },
      ],
    },
    {
      level: 15,
      pick: 1,
      choices: [
        { id: "master_performer", name: "Master Performer", description: "Your performances can sway entire crowds and even influence reality.", mechanicalEffect: "Mass charm/persuasion, auto-succeed social checks" },
        { id: "power_word", name: "Power Word", description: "Speak a single word of power that stuns or kills a weakened foe.", mechanicalEffect: "Stun (>100 HP) or kill (<100 HP) single target" },
      ],
    },
    {
      level: 20,
      pick: 1,
      choices: [
        { id: "superior_inspiration", name: "Superior Inspiration", description: "You start every encounter with full Bardic Inspiration dice.", mechanicalEffect: "Full inspiration at start of every encounter" },
        { id: "song_of_creation", name: "Song of Creation", description: "Your music can reshape reality itself, creating objects and effects at will.", mechanicalEffect: "Create any object or minor effect at will" },
      ],
    },
  ],
};

export const RACE_BONUS_SKILLS: Record<string, SkillOption[]> = {
  Human: [
    { id: "human_adaptability", name: "Adaptability", description: "Humans learn faster than any other race.", mechanicalEffect: "+10% XP gain" },
  ],
  Elf: [
    { id: "elf_trance_mastery", name: "Trance Mastery", description: "Your elven meditation deepens, granting visions of useful knowledge.", mechanicalEffect: "+2 to Intellect checks after rest" },
  ],
  Dwarf: [
    { id: "dwarf_stone_resilience", name: "Stone Resilience", description: "Your dwarven constitution hardens further against harm.", mechanicalEffect: "+2 AC vs physical attacks" },
  ],
  Halfling: [
    { id: "halfling_fortune", name: "Halfling Fortune", description: "Your luck grows stronger — reroll any natural 1 or 2.", mechanicalEffect: "Reroll 1s and 2s on d20" },
  ],
  "Half-Orc": [
    { id: "orc_fury", name: "Orcish Fury", description: "When bloodied, your attacks deal extra damage.", mechanicalEffect: "+1d6 damage when below half HP" },
  ],
  Tiefling: [
    { id: "tiefling_hellfire", name: "Hellfire Mastery", description: "Your infernal flame burns hotter, dealing enhanced fire damage.", mechanicalEffect: "+2 fire spell damage, fire resistance" },
  ],
  Dragonborn: [
    { id: "dragon_wings", name: "Dragon Wings", description: "Vestigial draconic wings grant short bursts of flight (recharges after a rest).", mechanicalEffect: "Fly 30ft as bonus action, per rest" },
  ],
  Gnome: [
    { id: "gnome_inventor", name: "Gnomish Invention", description: "Craft a unique gadget that aids you in creative ways (recharges after a long rest).", mechanicalEffect: "Create 1 utility gadget, per day" },
  ],
  Aasimar: [
    { id: "celestial_radiance", name: "Celestial Radiance", description: "Your divine heritage manifests as a radiant transformation (recharges after a long rest).", mechanicalEffect: "Radiant form: fly + 1d6 radiant damage aura for 1 min, per day" },
  ],
  Tabaxi: [
    { id: "nine_lives", name: "Nine Lives", description: "Feline luck grants you a second chance at death's door (recharges after a long rest).", mechanicalEffect: "Survive lethal damage at 1 HP, per day" },
  ],
};

export function getAvailableSkills(
  characterClass: string,
  race: string,
  level: number,
  existingSkillIds: string[],
): { classSkills: SkillTier | null; racialSkill: SkillOption | null } {
  const classTiers = CLASS_SKILL_TREES[characterClass.toLowerCase()] ?? [];
  const tier = classTiers.find(t => t.level === level);
  const classSkills = tier && !tier.choices.every(c => existingSkillIds.includes(c.id))
    ? tier
    : null;

  const racialOptions = RACE_BONUS_SKILLS[race] ?? [];
  const racialSkill = level === 5 && racialOptions.length > 0 && !racialOptions.some(r => existingSkillIds.includes(r.id))
    ? racialOptions[0]
    : null;

  return { classSkills, racialSkill };
}

export const SKILL_MILESTONE_LEVELS = [5, 10, 15, 20];
