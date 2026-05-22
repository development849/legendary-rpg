// ─── Cyberpunk / Near-Future Genre Pack ──────────────────────────────────────
// Neon-soaked corporate dystopia in the tradition of Neuromancer, Blade Runner,
// and Cyberpunk 2077. Megacorps, the Net, chrome, the edge.
//
// Tone: corps, choom, the Net, ICE, the city, the sprawl. No "milord", no
// "captain", no swords or starships — pistols, monowire, cyberdecks.

import type { GenreDefinition, ClassDef, RaceDef } from "./types";

const COMMON_INVENTORY = [
  { name: "Synth-Ramen Pack (3 meals)", type: "consumable", qty: 1, properties: {} },
  { name: "Glow-Tab", type: "tool", qty: 3, properties: {} },
  { name: "Eddies (250€$)", type: "treasure", qty: 1, properties: { value: 250 } },
  { name: "Burner Phone", type: "tool", qty: 1, properties: {} },
];

const BASE_STATS = { might: 10, agility: 10, endurance: 10, intellect: 10, will: 10, presence: 10 };

const CLASSES: ClassDef[] = [
  {
    id: "netrunner",
    name: "Netrunner",
    iconName: "Network",
    color: "text-cyan-400",
    description: "Console cowboys who jack into the Net and hunt through corporate ICE. The genre's caster slot — dataspike attacks, defensive subroutines, and digital warfare.",
    stats: "Intellect 14, Will 12",
    abilities: "Dataspike, Black ICE Breaker, Ghost Protocol",
    gear: "Cyberdeck, Neural Jack, Hold-Out Pistol",
    baseHp: 6,
    baseMp: 20,
    baseStats: { ...BASE_STATS, intellect: 14, will: 12 },
    startingInventory: [
      ...COMMON_INVENTORY,
      { name: "Cyberdeck", type: "tool", qty: 1, properties: { focus: 3 } },
      { name: "Neural Jack", type: "misc", qty: 1, properties: {} },
      { name: "Hold-Out Pistol", type: "weapon", qty: 1, rarity: "common", equipped: true, properties: { damage: "1d6", range: 30 } },
      { name: "Light Body Armor", type: "armor", qty: 1, rarity: "common", equipped: true, properties: { ac: 11, slot: "body" } },
      { name: "ICE Breaker Daemon", type: "misc", qty: 1, properties: {} },
    ],
    startingAbilities: [
      { id: "dataspike", name: "Dataspike", description: "Ranged netrun attack — 1d10 cyber damage to a target jacked into a network.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "ice_breaker", name: "Black ICE Breaker", description: "Tear through one tier of corporate intrusion countermeasures (uses 1 Focus).", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "ghost_protocol", name: "Ghost Protocol", description: "Mask your digital trail; security AIs lose your scent for 1 hour (uses 2 Focus).", usesMax: 2, usesLeft: 2, recharge: "per-rest" },
    ],
  },
  {
    id: "street_samurai",
    name: "Street Samurai",
    iconName: "Swords",
    color: "text-red-400",
    description: "Chromed-up combat specialist — equally lethal with monowire at arm's length and a SMG across the alley. The muscle of any crew.",
    stats: "Might 14, Agility 12",
    abilities: "Reflex Boost, Monowire Strike",
    gear: "Monowire, SMG, Subdermal Plating",
    baseHp: 12,
    baseMp: 0,
    baseStats: { ...BASE_STATS, might: 14, agility: 12 },
    startingInventory: [
      ...COMMON_INVENTORY,
      { name: "Monowire", type: "weapon", qty: 1, rarity: "common", equipped: true, properties: { damage: "1d8", bonus: 2, finesse: true } },
      { name: "Compact SMG", type: "weapon", qty: 1, rarity: "common", properties: { damage: "1d8", range: 60 } },
      { name: "Subdermal Plating", type: "armor", qty: 1, rarity: "common", equipped: true, properties: { ac: 14, slot: "body" } },
      { name: "Combat Stim", type: "consumable", qty: 2, properties: { heal: "1d8+2" } },
    ],
    startingAbilities: [
      { id: "reflex_boost", name: "Reflex Boost", description: "Activate your wired reflexes for a burst of speed — take an extra attack on your turn (2 uses, recharges after a rest).", usesMax: 2, usesLeft: 2, recharge: "per-rest" },
      { id: "monowire_strike", name: "Monowire Strike", description: "A precise cut with monomolecular wire that ignores 3 points of armour.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
    ],
  },
  {
    id: "fixer",
    name: "Fixer",
    iconName: "Users",
    color: "text-amber-400",
    description: "Information brokers and middlemen who know everybody. They land the jobs, fence the goods, and talk crews out of more trouble than they shoot their way through.",
    stats: "Presence 14, Intellect 12",
    abilities: "Contact Web, Read the Room",
    gear: "Designer Jacket, Hold-Out Pistol, Burner Phones",
    baseHp: 8,
    baseMp: 0,
    baseStats: { ...BASE_STATS, presence: 14, intellect: 12 },
    startingInventory: [
      ...COMMON_INVENTORY,
      { name: "Hold-Out Pistol", type: "weapon", qty: 1, rarity: "common", equipped: true, properties: { damage: "1d6", range: 30 } },
      { name: "Designer Jacket (Lined)", type: "armor", qty: 1, rarity: "common", equipped: true, properties: { ac: 12, slot: "body" } },
      { name: "Burner Phones", type: "tool", qty: 3, properties: {} },
      { name: "Chrome Briefcase", type: "tool", qty: 1, properties: {} },
      { name: "Forged Credchip", type: "misc", qty: 1, properties: {} },
    ],
    startingAbilities: [
      { id: "contact_web", name: "Contact Web", description: "Once per session, declare that you know someone here — name a useful contact and a debt they owe you.", usesMax: 1, usesLeft: 1, recharge: "per-session" },
      { id: "read_the_room", name: "Read the Room", description: "Glance at a crowd or NPC and read motive, allegiance, and the most likely lie.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "talk_them_down", name: "Talk Them Down", description: "Advantage on persuasion / deception checks against anyone who hasn't fired a shot yet.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
    ],
  },
  {
    id: "techie",
    name: "Techie",
    iconName: "Wrench",
    color: "text-emerald-400",
    description: "Gearhead specialists — drone-op, repair, gadgetry, demolitions. If it has a wire, a circuit, or a fuse, the techie owns it.",
    stats: "Intellect 14, Agility 12",
    abilities: "Drone Operator, Jury-Rig",
    gear: "Engineer's Multitool, Pistol, Combat Drone",
    baseHp: 10,
    baseMp: 0,
    baseStats: { ...BASE_STATS, intellect: 14, agility: 12 },
    startingInventory: [
      ...COMMON_INVENTORY,
      { name: "Engineer's Multitool", type: "tool", qty: 1, properties: {} },
      { name: "Pistol", type: "weapon", qty: 1, rarity: "common", equipped: true, properties: { damage: "1d6", bonus: 1, range: 40 } },
      { name: "Combat Drone", type: "misc", qty: 1, properties: { damage: "1d6", range: 60 } },
      { name: "Heavy Workwear", type: "armor", qty: 1, rarity: "common", equipped: true, properties: { ac: 12, slot: "body" } },
      { name: "EMP Grenade", type: "consumable", qty: 2, properties: { area: 10 } },
    ],
    startingAbilities: [
      { id: "drone_operator", name: "Drone Operator", description: "Direct your combat drone — it acts on your turn and can attack at 60ft range.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "jury_rig", name: "Jury-Rig", description: "Spend 1 minute and a few parts to fix a broken device or build a one-shot gadget.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "emp_strike", name: "EMP Strike", description: "Disable electronics, drones, and basic cyberware in a 10ft radius for 1 minute (2 uses, recharges after a rest).", usesMax: 2, usesLeft: 2, recharge: "per-rest" },
    ],
  },
];

const RACES: RaceDef[] = [
  {
    name: "Mostly-Flesh",
    description: "Baseline human, lightly chromed or not at all. Adaptable, balanced, and not yet committed to any one corporate vendor's stack.",
    traits: "+1 to all stats · Bonus Skill Proficiency · Extra Spoken Language",
    bonuses: { might: 1, agility: 1, endurance: 1, intellect: 1, will: 1, presence: 1 },
  },
  {
    name: "Wired",
    description: "Cyberware everywhere — reflex boosters, optic implants, neural ports. Frighteningly fast and frighteningly fragile if the immune suppressors ever lapse.",
    traits: "+2 Agility · +1 Intellect · Wired Reflexes (advantage on initiative) · Cyber-Frail (-1 max HP per level)",
    bonuses: { agility: 2, intellect: 1 },
  },
  {
    name: "Borg",
    description: "Full-body conversion. The original meat is mostly memory now, riding in a chassis the size of a small car. Hits like a freight train; charms like one too.",
    traits: "+2 Endurance · +1 Might · +10 max HP · -1 Presence · Built-In Armor (+2 AC, passive)",
    bonuses: { endurance: 2, might: 1, presence: -1 },
  },
  {
    name: "Clone",
    description: "Corporate-grown vat clone, walked out of a tank with a forged service record and a head full of skills they don't quite remember learning.",
    traits: "+2 Will · +1 Endurance · Quick Learner (+1 to any skill check, once per scene) · Memory Gaps (DM may declare a forgotten fact)",
    bonuses: { will: 2, endurance: 1 },
  },
  {
    name: "Edgerunner",
    description: "Street-rat survivor who grew up on the wrong side of every wall. Scrappy, paranoid, and dangerous to people who underestimate them.",
    traits: "+2 Agility · +1 Presence · Street Smart (advantage on perception in urban) · Always Has An Out",
    bonuses: { agility: 2, presence: 1 },
  },
  {
    name: "Corpo-Defector",
    description: "Raised inside the gleaming arcology of a megacorp — and then they left, or were pushed. Highly educated, well-connected, and quietly hunted.",
    traits: "+2 Intellect · +1 Presence · Corp Education (+2 to knowledge checks) · Hunted (corp agents may appear)",
    bonuses: { intellect: 2, presence: 1 },
  },
];

export const CYBERPUNK: GenreDefinition = {
  id: "cyberpunk",
  label: "Cyberpunk",
  tagline: "Neon, chrome, and corporate sin.",
  description: "Dystopian near-future. Hack the megacorps, jack into the net, and survive the streets of the sprawl.",
  iconName: "Cpu",
  comingSoon: false,
  classes: CLASSES,
  races: RACES,
  raceLabel: "Lineage",
  backgrounds: [
    "Corporate Defector", "Gang Veteran", "Black-Clinic Doctor", "Media Operator",
    "Solo for Hire", "Rocker", "Nomad", "Detective",
    "Smuggler", "Tech Cultist", "Fixer's Protégé", "Ex-Cop",
  ],
  personalityTraits: [
    "Paranoid", "Sardonic", "Idealistic", "Burnt-out", "Ruthless", "Loyal-to-crew",
    "Glamorous", "Stoic", "Wisecracking", "Coldly precise", "Reckless", "Romantic",
    "Hungry", "Watchful", "Volatile", "Quietly furious",
  ],
  motivations: [
    "Burn down a megacorp", "Pay off a black-clinic debt",
    "Find a disappeared loved one", "Get out of the city alive",
    "Take down a rival fixer", "Score the legendary deck",
    "Avenge a dead crew", "Become a street legend",
    "Protect the neighbourhood", "Reach the top of the tower",
    "Recover lost memories", "Just one more big score",
  ],
  flaws: [
    "Hooked on combat stims", "Owes a yakuza chapter big",
    "Wanted by Arasaka security", "Cyberpsychosis creeping in",
    "Burned every bridge they ever had", "Trusts the wrong AI",
    "Has a kill-switch in their spine they don't know about",
    "Can't pull the trigger on civilians", "Allergic to their own immune suppressors",
    "Carries a memchip they can't decrypt", "Lost a partner and won't talk about it",
    "Refuses to jack into the Net since the last bad run",
  ],
  names: [
    "Vik", "Judy", "Rogue", "Saburo", "Lucy", "Rebecca", "David", "Adam",
    "Maine", "Pilar", "Kiwi", "T-Bug", "Jackie", "Panam", "River", "Goro",
    "Hanako", "Yorinobu", "Misty", "Evelyn", "Solomon", "Anders", "Brigitte", "Nix",
    "Smasher", "Falco", "Kerry", "Henry", "Alt", "Bes", "Cypher", "Hex",
    "Jinx", "Mox", "Neon", "Reaper", "Vox", "Zero", "Cinder", "Static",
  ],
  gmVoice: "You are running a neon-soaked corporate-dystopia campaign in the tradition of Neuromancer, Blade Runner, and Cyberpunk 2077. The world is owned by megacorps; the streets are owned by no one. Use cyberpunk register: chrome, the Net, ICE, daemon, deck, jack in, corp, choom, eddies, sprawl, ripperdoc, edgerunner, output, the city. Avoid all fantasy and pure-sci-fi register — no 'milord', no 'starship', no 'captain', no 'parsecs'. Technology is everyday, oppressive, and intimate (in someone's skull, in someone's spine). Combat is short and lethal — pistols, SMGs, monowire, drones, dataspikes. Corporations are villains by default; the law is a service the rich subscribe to. Narrate with rain on neon, advertising overhead, and the constant hum of the city.",
  portraitStyle: "Gritty neon-noir character art in the tradition of Cyberpunk 2077 promo work and modern cyberpunk concept illustration. Cinematic digital painting with hard, saturated lighting — magenta, cyan, and electric blue spill, deep blacks, hot specular highlights on chrome. Lived-in costuming: tactical leather, urban streetwear, designer corporate cuts, visible cybernetics (optic implants, neural ports, subdermal plating, monowire fingers). Wet pavement, neon advertising reflecting in puddles, distant arcology silhouettes, mist and atmospheric haze. Portrait-to-waist framing, shallow depth of field, cinematic composition. Photoreal-leaning but stylised; high contrast, dirty, beautiful. Never bright or hopeful. No text, no HUD, no UI overlays.",
};
