// ─── Sci-Fi / Space Opera Genre Pack ─────────────────────────────────────────
// Crewed-starship space opera in the tradition of Mass Effect, The Expanse,
// and the original Star Wars — high-tech, alien-rich, mostly-grounded science
// fiction. This file is the SINGLE source of truth for sci-fi content; both
// the character-creation UI and the server-side character bootstrap read
// from here.
//
// Tone: parsecs not leagues, ship's bridge not tavern, AI co-pilots not bards.
// No swords, no chainmail, no "milord". Sidearms, vacc-suits, datapads.

import type { GenreDefinition, ClassDef, RaceDef } from "./types";

// Shared baseline gear every crew member ships out with — practical, not
// flavour-class-specific. Mirrors the role COMMON_INVENTORY plays in the
// fantasy pack.
const COMMON_INVENTORY = [
  { name: "Ration Bars (3 days)", type: "consumable", qty: 1, properties: {} },
  { name: "Glow-Stick", type: "tool", qty: 3, properties: {} },
  { name: "Credit Chip (250cr)", type: "treasure", qty: 1, properties: { value: 250 } },
  { name: "Datapad", type: "tool", qty: 1, properties: {} },
];

const BASE_STATS = { might: 10, agility: 10, endurance: 10, intellect: 10, will: 10, presence: 10 };

const CLASSES: ClassDef[] = [
  {
    id: "starfarer",
    name: "Starfarer",
    iconName: "Rocket",
    color: "text-sky-400",
    description: "Versatile spacers — pilots, scouts, and gun-hands who thrive in the void. Adaptable, quick on the trigger, and at home on any deck.",
    stats: "Agility 14, Presence 12",
    abilities: "Quick Draw, Pilot's Reflexes",
    gear: "Pulse Pistol, Vacc-Suit, Multitool",
    baseHp: 10,
    baseMp: 0,
    baseStats: { ...BASE_STATS, agility: 14, presence: 12 },
    startingInventory: [
      ...COMMON_INVENTORY,
      { name: "Pulse Pistol", type: "weapon", qty: 1, rarity: "common", equipped: true, properties: { damage: "1d8", bonus: 2, range: 60 } },
      { name: "Vacc-Suit", type: "armor", qty: 1, rarity: "common", equipped: true, properties: { ac: 12, slot: "body" } },
      { name: "Multitool", type: "tool", qty: 1, properties: {} },
      { name: "Medkit", type: "consumable", qty: 1, properties: { heal: "1d8+2" } },
    ],
    startingAbilities: [
      { id: "quick_draw", name: "Quick Draw", description: "Draw and fire your sidearm as a bonus action with advantage on initiative.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "pilots_reflexes", name: "Pilot's Reflexes", description: "Once per rest, reroll a failed Agility save or piloting check.", usesMax: 1, usesLeft: 1, recharge: "per-rest" },
    ],
  },
  {
    id: "xeno_biologist",
    name: "Xeno-Biologist",
    iconName: "Microscope",
    color: "text-emerald-400",
    description: "Field scientists who read alien ecosystems the way others read a map. Quick analysis, biotech know-how, and a steady hand under pressure.",
    stats: "Intellect 14, Will 12",
    abilities: "Field Analysis, Biotech Stim",
    gear: "Scanner, Sidearm, Field Medkit",
    baseHp: 8,
    baseMp: 12,
    baseStats: { ...BASE_STATS, intellect: 14, will: 12 },
    startingInventory: [
      ...COMMON_INVENTORY,
      { name: "Hand Scanner", type: "tool", qty: 1, properties: {} },
      { name: "Compact Sidearm", type: "weapon", qty: 1, rarity: "common", equipped: true, properties: { damage: "1d6", bonus: 1, range: 40 } },
      { name: "Light Field Suit", type: "armor", qty: 1, rarity: "common", equipped: true, properties: { ac: 11, slot: "body" } },
      { name: "Field Medkit", type: "consumable", qty: 2, properties: { heal: "1d8+2" } },
      { name: "Sample Vials", type: "misc", qty: 6, properties: {} },
    ],
    startingAbilities: [
      { id: "field_analysis", name: "Field Analysis", description: "Spend 1 minute scanning a creature, plant, or device to learn its key weaknesses and a useful trait.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "biotech_stim", name: "Biotech Stim", description: "Inject an ally with an adrenal stim, restoring 2d6 HP and clearing one condition (costs 2 charges).", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "xeno_lore", name: "Xeno Lore", description: "Advantage on Intellect checks involving alien biology, biotech, or unfamiliar lifeforms.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
    ],
  },
  {
    id: "mech_pilot",
    name: "Mech Pilot",
    iconName: "Bot",
    color: "text-amber-400",
    description: "Heavy-combat specialists trained to walk and fight inside armoured exo-frames. Hits hard, soaks fire, and keeps the squad moving under pressure.",
    stats: "Might 14, Endurance 12",
    abilities: "Exo-Frame, Suppressing Fire",
    gear: "Heavy Rifle, Combat Exo-Frame, Repair Kit",
    baseHp: 12,
    baseMp: 0,
    baseStats: { ...BASE_STATS, might: 14, endurance: 12 },
    startingInventory: [
      ...COMMON_INVENTORY,
      { name: "Heavy Rifle", type: "weapon", qty: 1, rarity: "common", equipped: true, properties: { damage: "1d10", bonus: 2, range: 120, two_handed: true } },
      { name: "Combat Exo-Frame", type: "armor", qty: 1, rarity: "common", equipped: true, properties: { ac: 15, slot: "body" } },
      { name: "Sidearm", type: "weapon", qty: 1, rarity: "common", properties: { damage: "1d6", range: 40 } },
      { name: "Repair Kit", type: "tool", qty: 1, properties: {} },
      { name: "Frag Grenade", type: "consumable", qty: 2, properties: { damage: "2d6", area: 10 } },
    ],
    startingAbilities: [
      { id: "exo_frame", name: "Exo-Frame", description: "Your suit reduces incoming physical damage by 2 and lets you carry heavy gear without penalty.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "suppressing_fire", name: "Suppressing Fire", description: "Spray a 15ft cone with rifle fire — every creature in it makes an Agility save (DC 13) or takes 1d8 damage and has disadvantage on its next attack.", usesMax: 2, usesLeft: 2, recharge: "per-rest" },
    ],
  },
  {
    id: "psion",
    name: "Psion",
    iconName: "Brain",
    color: "text-violet-400",
    description: "Rare individuals who channel raw cognitive force — lifting objects with a thought, brushing minds across a room, igniting kinetic flares in midair. The 'caster' slot of the sci-fi roster.",
    stats: "Will 14, Presence 12",
    abilities: "Kinetic Push, Mind Touch, Psionic Lance",
    gear: "Compact Sidearm, Neural Focus, Light Vacc-Suit",
    baseHp: 6,
    baseMp: 20,
    baseStats: { ...BASE_STATS, will: 14, presence: 12 },
    startingInventory: [
      ...COMMON_INVENTORY,
      { name: "Compact Sidearm", type: "weapon", qty: 1, rarity: "common", equipped: true, properties: { damage: "1d6", range: 40 } },
      { name: "Light Vacc-Suit", type: "armor", qty: 1, rarity: "common", equipped: true, properties: { ac: 11, slot: "body" } },
      { name: "Neural Focus", type: "misc", qty: 1, properties: { focus: 3 } },
      { name: "Inhibitor Patch", type: "consumable", qty: 2, properties: {} },
    ],
    startingAbilities: [
      { id: "kinetic_push", name: "Kinetic Push", description: "Ranged psionic attack — 1d10 force damage and the target is shoved 10ft.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "mind_touch", name: "Mind Touch", description: "Read a creature's surface thoughts for 1 round (Will save DC 13 to resist).", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "psionic_lance", name: "Psionic Lance", description: "Hurl a piercing lance of thought through a line up to 60ft — every creature in the line takes 2d8 psychic damage (uses 2 Focus).", usesMax: 2, usesLeft: 2, recharge: "per-rest" },
    ],
  },
];

const RACES: RaceDef[] = [
  {
    name: "Human",
    description: "The colonising mongrels of the spacelanes. Adaptable, ambitious, and absolutely everywhere — you'll find a human on any station, in any uniform.",
    traits: "+1 to all stats · Bonus Skill Proficiency · Extra Spoken Language",
    bonuses: { might: 1, agility: 1, endurance: 1, intellect: 1, will: 1, presence: 1 },
  },
  {
    name: "Synthetic",
    description: "A self-aware android — chassis-built, factory-stamped, and recently freed from its original purpose. Tireless, precise, and uncannily literal.",
    traits: "+2 Endurance · +1 Intellect · No need to eat/sleep · Resistance to poison · Vulnerable to ion damage",
    bonuses: { endurance: 2, intellect: 1 },
  },
  {
    name: "Uplifted",
    description: "Descended from a non-human animal lineage that was genetically modified to sapience generations ago. Carries the instincts of the original line — keen senses, fast reflexes, and a body built for the work.",
    traits: "+2 Agility · +1 Might · Keen Senses (advantage on perception) · Natural Weapons (claws/fangs, 1d4)",
    bonuses: { agility: 2, might: 1 },
  },
  {
    name: "Voidborn",
    description: "Born and raised in zero-g aboard deep-space habitats. Elongated, frail-boned, eerily graceful — and absolutely lethal in a microgravity firefight.",
    traits: "+2 Agility · +1 Intellect · Zero-G Native (immune to microgravity penalties) · Frail (-1 max HP per level)",
    bonuses: { agility: 2, intellect: 1 },
  },
  {
    name: "Symbiote-Bonded",
    description: "A host paired with a sentient alien parasite woven through their nervous system. The two minds murmur to each other constantly — sometimes in agreement, often not.",
    traits: "+2 Will · +1 Presence · Inner Voice (advantage on Will saves vs. mind-affecting effects) · Shared Senses",
    bonuses: { will: 2, presence: 1 },
  },
  {
    name: "Cogniform",
    description: "A consciousness — originally human, alien, or unknown — uploaded into a purpose-built constructed body. Memories of a former life linger; the new chassis is still being learned.",
    traits: "+2 Intellect · +1 Will · Constructed Body (immune to disease, poison, suffocation) · Re-Sleeve (recover a backup on death once per campaign)",
    bonuses: { intellect: 2, will: 1 },
  },
];

export const SCIFI: GenreDefinition = {
  id: "scifi",
  label: "Sci-Fi",
  tagline: "Starships, alien worlds, and the long dark between stars.",
  description: "Hard-edged space opera. Pilot starships, broker peace with alien empires, and explore the deep frontier.",
  iconName: "Rocket",
  comingSoon: false,
  classes: CLASSES,
  races: RACES,
  raceLabel: "Origin",
  backgrounds: [
    "Naval Officer", "Colonial Marine", "Frontier Doctor", "Smuggler",
    "Corporate Agent", "Salvager", "Diplomat", "Drifter",
    "Engineer", "Bounty Hunter", "Researcher", "Belter",
  ],
  personalityTraits: [
    "Pragmatic", "Sardonic", "Idealistic", "Paranoid", "Disciplined", "Reckless",
    "Cool-headed", "Curious", "Haunted", "Wisecracking", "Stoic", "Defiant",
    "Loyal-to-crew", "Restless", "Calculating", "Hopeful",
  ],
  motivations: [
    "Find a lost colony", "Pay off a debt", "Expose a corporation",
    "Map the unknown", "Protect the crew", "Bring a fugitive in",
    "Avenge a destroyed ship", "Unify a fractured people", "Strike it rich",
    "Reach Earth again", "Free a captive", "Survive the next jump",
  ],
  flaws: [
    "Court-martialled and quietly discharged", "Hooked on stims",
    "Owes a syndicate big", "Implanted with a tracker they don't know about",
    "Lost crew to their own bad call", "Vacuum-phobic",
    "Disowned by their lineage", "Carries a forbidden AI fragment",
    "Wanted on three systems", "Refuses to kill — at any cost",
    "Trusts no synthetic", "Cannot stand still for long",
  ],
  names: [
    "Vega", "Orion", "Nyx", "Cassia", "Rook", "Hale", "Sable", "Idris",
    "Quinn", "Mira", "Rho", "Zane", "Sol", "Calix", "Renn", "Tev",
    "Asha", "Bex", "Cipher", "Drix", "Echo", "Faro", "Gale", "Halo",
    "Iko", "Jax", "Kira", "Lior", "Mox", "Nova", "Onyx", "Pax",
    "Quill", "Rey", "Sigma", "Talon", "Ursa", "Vex", "Wren", "Xen",
  ],
  gmVoice: "You are running a crewed-starship space opera in the tradition of Mass Effect, The Expanse, and classic Star Wars. Lean into the texture of an inhabited galaxy — alien empires, corporate fleets, frontier colonies, ancient ruins on dead worlds, the slow grind of life-support on long jumps. Use sci-fi vocabulary: parsecs, light-years, jump-gate, bridge, airlock, hull breach, captain, commander, crew. Avoid all fantasy register — never 'milord', 'tavern', 'sorcery', 'kingdom', or 'leagues'. Technology is everyday, not magical. Aliens are people, not monsters by default. Combat is ranged-first: pistols, rifles, exo-frames, psionic flares — not swords. When narrating, default to hard-edged but humane: this is a lived-in galaxy where the heat sinks tick and the coffee is bad.",
  portraitStyle: "Semi-realistic sci-fi concept art in the tradition of Mass Effect promo art and modern cinematic key frames. Crisp digital painting with believable lighting — cool LED spill, warm console glow, hard rim light from an unseen star. Practical, lived-in costuming: vacc-suits, flight harnesses, exo-frame undersuits, utility belts, holstered sidearms. Visible tech detail without going cyberpunk-neon. Subtle sci-fi flourishes — visor reflections, biotech tattoos, faint psionic glow, subdermal implants. Backgrounds suggest a starship interior, a colony hab, or an alien horizon. Cinematic composition, portrait-to-waist framing, shallow depth of field. Photoreal-leaning but still painterly; never anime, never fantasy-painterly. No text, no HUD, no UI overlays.",
};
