// ─── Steampunk Genre Pack ────────────────────────────────────────────────────
// Victorian alternate history. Aether engines, clockwork prosthetics, airship
// piracy, soot-thick streets, gas-lit drawing rooms. Bioshock Infinite,
// Arcane, Mortal Engines, The Difference Engine.
//
// The wonderful collides with the grimy. Class consciousness is the air the
// PCs breathe; the GM should never let them forget it.

import type { GenreDefinition, ClassDef, RaceDef } from "./types";

const COMMON_INVENTORY = [
  { name: "Brass-Cased Pocket Compendium", type: "tool", qty: 1, properties: { note: "Pocket reference — schedules, ciphers, gentleman's notes, telegraph codes." } },
  { name: "Tinted Goggles", type: "tool", qty: 1, properties: {} },
  { name: "Telegraph Fob", type: "tool", qty: 1, properties: { note: "A pocket telegraph receiver, fashionable and useful in equal measure." } },
  { name: "Pocket Watch", type: "misc", qty: 1, properties: {} },
  { name: "Vial of Compound", type: "consumable", qty: 3, properties: { note: "Aether-tincture, smelling-salts, or stim — useful for the unwell." } },
  { name: "Coin Purse (£8 sterling)", type: "treasure", qty: 1, properties: { value: 8 } },
];

const BASE_STATS = { might: 10, agility: 10, endurance: 10, intellect: 10, will: 10, presence: 10 };

const CLASSES: ClassDef[] = [
  {
    id: "aetherist",
    name: "Aetherist",
    iconName: "Sparkles",
    color: "text-cyan-300",
    description: "Channeller of aether currents — the unseen lattice that powers airships, lamp-posts, and the rare gentleman's parlour trick. Each working draws on Aether Charge (the genre's name for MP).",
    stats: "Intellect 14, Will 12",
    abilities: "Aether Bolt, Aetheric Veil, Read the Currents",
    gear: "Aether Wand, Brass-Plated Coat, Charge Capacitor",
    baseHp: 6,
    baseMp: 20,
    baseStats: { ...BASE_STATS, intellect: 14, will: 12 },
    startingInventory: [
      ...COMMON_INVENTORY,
      { name: "Aether Wand", type: "weapon", qty: 1, rarity: "common", equipped: true, properties: { damage: "1d8", note: "Concentrated lance of aether — used as a sidearm and a focus." } },
      { name: "Brass-Plated Coat", type: "armor", qty: 1, rarity: "common", equipped: true, properties: { ac: 11, slot: "body" } },
      { name: "Charge Capacitor (Belt-Mounted)", type: "misc", qty: 1, properties: { focus: 3 } },
      { name: "Walking-Stick", type: "weapon", qty: 1, rarity: "common", properties: { damage: "1d4" } },
    ],
    startingAbilities: [
      { id: "aether_bolt", name: "Aether Bolt", description: "A focused blue-white arc launched from the wand — 1d10 force damage at range (costs 1 Aether Charge).", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "aetheric_veil", name: "Aetheric Veil", description: "A shimmering curtain of aether dampens incoming attacks against you for 1 minute (+3 AC, costs 2 Aether Charge).", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "read_the_currents", name: "Read the Currents", description: "Sense the flow of aether around you — detect engines, working aetheric devices, and active workings within 100ft.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
    ],
  },
  {
    id: "clockwright",
    name: "Clockwright",
    iconName: "Cog",
    color: "text-amber-400",
    description: "Builds clockwork contraptions in the field with no more than a satchel of springs, a watchmaker's loupe, and the patience for very small components. The kit makes the artisan.",
    stats: "Intellect 14, Agility 12",
    abilities: "Field Contraption, Wind the Mechanism, Diagnose",
    gear: "Watchmaker's Kit, Clockwork Owl (Companion), Service Revolver",
    baseHp: 8,
    baseMp: 0,
    baseStats: { ...BASE_STATS, intellect: 14, agility: 12 },
    startingInventory: [
      ...COMMON_INVENTORY,
      { name: "Service Revolver", type: "weapon", qty: 1, rarity: "common", equipped: true, properties: { damage: "1d8", range: 40 } },
      { name: "Sword-Cane", type: "weapon", qty: 1, rarity: "common", equipped: true, properties: { damage: "1d6", finesse: true, note: "A walking-stick that draws a slim blade — gentleman's etiquette." } },
      { name: "Tweed Suit (Reinforced)", type: "armor", qty: 1, rarity: "common", equipped: true, properties: { ac: 11, slot: "body" } },
      { name: "Watchmaker's Kit", type: "tool", qty: 1, properties: {} },
      { name: "Clockwork Owl (Companion)", type: "tool", qty: 1, properties: { note: "Small brass companion — scouts, carries notes, distracts." } },
      { name: "Spring & Gear Satchel", type: "tool", qty: 1, properties: {} },
    ],
    startingAbilities: [
      { id: "field_contraption", name: "Field Contraption", description: "Spend a minute and any reasonable scrap to build a one-shot clockwork device — a smoke-emitter, a chiming distractor, a wind-up lockpick.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "wind_the_mechanism", name: "Wind the Mechanism", description: "Reset and re-arm one of your contraptions, or send your clockwork owl on a scouting circuit.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "diagnose", name: "Diagnose", description: "Look at any mechanical or aetheric device and surface one true fact about its make, faults, or hidden compartments.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
    ],
  },
  {
    id: "airship_pilot",
    name: "Airship Pilot",
    iconName: "Anchor",
    color: "text-sky-400",
    description: "Sky-ace — equal parts gunfighter and helmsman, with the steady hands of a duellist and the swagger of a privateer. The deck is yours; so is the engine room, if the engineer's drunk.",
    stats: "Agility 14, Endurance 12",
    abilities: "Daring Manoeuvre, Twin Shot, Helmsman's Eye",
    gear: "Brace of Revolvers, Bandolier, Aviator's Greatcoat",
    baseHp: 10,
    baseMp: 0,
    baseStats: { ...BASE_STATS, agility: 14, endurance: 12 },
    startingInventory: [
      ...COMMON_INVENTORY,
      { name: "Service Revolver", type: "weapon", qty: 2, rarity: "common", equipped: true, properties: { damage: "1d8", range: 40 } },
      { name: "Cartridge Bandolier", type: "consumable", qty: 24, properties: {} },
      { name: "Cutlass", type: "weapon", qty: 1, rarity: "common", properties: { damage: "1d6", bonus: 1 } },
      { name: "Aviator's Greatcoat", type: "armor", qty: 1, rarity: "common", equipped: true, properties: { ac: 12, slot: "body" } },
      { name: "Spyglass", type: "tool", qty: 1, properties: {} },
    ],
    startingAbilities: [
      { id: "daring_manoeuvre", name: "Daring Manoeuvre", description: "A reckless dive, vault, or slide — close 20ft, ignore difficult terrain, and gain advantage on the next attack this turn.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "twin_shot", name: "Twin Shot", description: "Fire both revolvers in a single attack action against one or two targets.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "helmsmans_eye", name: "Helmsman's Eye", description: "Read a ship, a crowd, or a duel for the angle of attack — gain one true tactical detail the GM had not planned to share.", usesMax: 1, usesLeft: 1, recharge: "per-rest" },
    ],
  },
  {
    id: "alchemist",
    name: "Alchemist",
    iconName: "FlaskConical",
    color: "text-emerald-400",
    description: "Brews tinctures, salves, and worse from a portable laboratory. The party's healer and chemist — every working draws on a stock of Reagents (the genre's name for MP, ticked down vial by vial).",
    stats: "Intellect 14, Will 12",
    abilities: "Restorative Tincture, Smoke Phial, Acid Flask",
    gear: "Alchemist's Satchel, Hold-Out Pistol, Apothecary's Coat",
    baseHp: 8,
    baseMp: 18,
    baseStats: { ...BASE_STATS, intellect: 14, will: 12 },
    startingInventory: [
      ...COMMON_INVENTORY,
      { name: "Alchemist's Satchel", type: "tool", qty: 1, properties: { focus: 3, note: "Vials, dropper, burner, mortar — everything one needs to brew on the move." } },
      { name: "Hold-Out Pistol", type: "weapon", qty: 1, rarity: "common", equipped: true, properties: { damage: "1d6", range: 20 } },
      { name: "Apothecary's Coat", type: "armor", qty: 1, rarity: "common", equipped: true, properties: { ac: 11, slot: "body" } },
      { name: "Sword-Cane", type: "weapon", qty: 1, rarity: "common", properties: { damage: "1d6", finesse: true } },
      { name: "Acid Phial (Spare)", type: "consumable", qty: 2, properties: { damage: "1d6" } },
    ],
    startingAbilities: [
      { id: "restorative_tincture", name: "Restorative Tincture", description: "A green-glass vial pressed to an ally's lips — heals 1d8 + Will modifier HP (costs 1 Reagent).", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "smoke_phial", name: "Smoke Phial", description: "A glass sphere shatters into a thick, choking cloud — 15ft radius of obscurement for 1 minute (costs 1 Reagent).", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "acid_flask", name: "Acid Flask", description: "A hurled flask — 2d6 acid damage to a target (DC 13 Agility save for half), costs 2 Reagents.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
    ],
  },
];

const RACES: RaceDef[] = [
  {
    name: "Gentry",
    description: "Well-bred, well-spoken, and well-educated. Drawing rooms and clubs are home; honest labour is something other people do.",
    traits: "+2 Presence · +1 Intellect · Letters of Introduction (open most polite doors) · -1 Endurance (the body is not used to honest exertion)",
    bonuses: { presence: 2, intellect: 1, endurance: -1 },
    startingInventory: [
      { name: "Letters of Introduction", type: "tool", qty: 1, properties: { note: "Calling cards, a banker's recommendation, a sealed envelope from a peer." } },
      { name: "Gentleman's (or Lady's) Attire", type: "tool", qty: 1, properties: { note: "Tailored frock coat or walking-dress; suitable for any drawing-room." } },
    ],
  },
  {
    name: "Brass-Limb",
    description: "A clockwork prosthetic — an arm of hinged brass, a steel-and-leather leg, or a copper-mesh hand. The work was masterful; the surgery was not. Per design constraint the prosthetic is narrative-only and never added to inventory.",
    traits: "+2 Endurance · +1 Might · Clockwork Prosthetic (narrative-only — never disarmed, never removed; the GM may exploit it in cold or wet weather) · -1 Presence (the brass is loud and people stare)",
    bonuses: { endurance: 2, might: 1, presence: -1 },
  },
  {
    name: "Tinker-Kin",
    description: "Raised in the back-rooms of foundries, workshops, and clock-towers. The first toy was a real cog; the first language was the language of gears.",
    traits: "+2 Intellect · +1 Agility · Workshop-Raised (advantage on any check involving clockwork, aether-engines, or mechanical traps)",
    bonuses: { intellect: 2, agility: 1 },
    startingInventory: [
      { name: "Inherited Tinker's Loupe", type: "tool", qty: 1, properties: {} },
    ],
  },
  {
    name: "Sky-Born",
    description: "Raised on the decks of merchant airships, mail clippers, or sky-pirate frigates. Cabin-boy at eight, helmsman by fifteen, and never quite at home on solid ground.",
    traits: "+2 Agility · +1 Presence · Sky-Legs (immune to vertigo, advantage on balance and climbing in rigging) · Knot-Lore",
    bonuses: { agility: 2, presence: 1 },
    startingInventory: [
      { name: "Length of Rigging Rope", type: "tool", qty: 1, properties: {} },
    ],
  },
  {
    name: "Aether-Touched",
    description: "Exposed to a leak — a ruptured engine, a foundry vent, a back-alley experiment — and never quite the same after. The eyes glow faintly in dim light. So do the fingertips, on bad days.",
    traits: "+2 Will · +1 Intellect · Faint Glow (a soft blue-white halo betrays you in the dark) · Aether Sense (perceive working aetheric devices and currents)",
    bonuses: { will: 2, intellect: 1 },
  },
  {
    name: "Foundry-Forged",
    description: "Worker-class, hardened in the heat and noise of the great industrial halls. Hands that have lifted molten brass with the right tongs and known when to step back.",
    traits: "+2 Endurance · +2 Might · Hardened (resistance to fire and heat; advantage on Endurance saves) · -1 Presence (the trade leaves marks on the voice and the hands)",
    bonuses: { endurance: 2, might: 2, presence: -1 },
    startingInventory: [
      { name: "Heavy Leather Apron", type: "armor", qty: 1, rarity: "common", properties: { note: "Foundry-issue protective wear, still useful." } },
      { name: "Foundry Hammer", type: "weapon", qty: 1, rarity: "common", properties: { damage: "1d8" } },
    ],
  },
];

export const STEAMPUNK: GenreDefinition = {
  id: "steampunk",
  label: "Steampunk",
  tagline: "Brass, steam, and impossible machines.",
  description: "Victorian-era invention run wild. Airships, automatons, and arcane engineering in a soot-stained world.",
  iconName: "Cog",
  comingSoon: false,
  classes: CLASSES,
  races: RACES,
  raceLabel: "Origin",
  backgrounds: [
    "Aether Engineer", "Royal Navy (Sky Service)", "Detective Inspector", "Apothecary",
    "Music-Hall Performer", "Cab-Driver (Steam-Hansom)", "Foundry Foreman", "Cartographer",
    "Society Reporter", "University Lecturer", "Dock-Master", "Sky-Pirate (Retired)",
  ],
  personalityTraits: [
    "Punctilious", "Sardonic", "Earnest", "Class-conscious", "Tinkering",
    "Reserved", "Theatrical", "Driven", "Soft-spoken", "Quietly furious",
    "Curious-past-reason", "Honourable", "Disreputable", "Polite to a fault",
    "Coal-stained", "Diplomatic",
  ],
  motivations: [
    "Restore the family name after the patent scandal",
    "Find the engineer who designed the prosthetic and ask why it grinds",
    "Track down the airship that took your sister",
    "Prove the aether is finite before it runs out",
    "Buy back the workshop the bank took",
    "Earn a captain's commission in the Sky Service",
    "Bring a corrupt magistrate to justice in open court",
    "Recover a stolen patent before the rival firm publishes",
    "Atone for the foundry accident that was your fault",
    "Map the unmapped corner of the Empire",
    "Escape the marriage your parents arranged",
    "Get rich enough to never be polite to a magistrate again",
  ],
  flaws: [
    "Owes a foundry-boss more than a year's wages",
    "Cannot enter a particular city without a warrant being served",
    "Drinks gin in the small hours and pretends not to",
    "Cannot speak in court without trembling",
    "Carries a patent stolen from a colleague",
    "Estranged from a noble family who will not speak the name",
    "Addicted to aether-tincture",
    "Has accidentally killed a man with a contraption and not told anyone",
    "Cannot lie convincingly to a constable",
    "Already wanted for sky-piracy in two cities",
    "Lost a clockwork prosthetic in a card game",
    "Trusts the wrong industrialist",
  ],
  names: [
    "Alistair", "Ambrose", "Bartholomew", "Cornelius", "Edmund", "Gideon", "Horatio",
    "Jasper", "Lucius", "Mortimer", "Nathaniel", "Octavian", "Percival", "Reginald",
    "Sebastian", "Thaddeus", "Wendell", "Winston",
    "Adelaide", "Beatrix", "Clementine", "Dorothea", "Esmeralda", "Florence", "Genevieve",
    "Henrietta", "Imogen", "Josephine", "Lavinia", "Millicent", "Octavia", "Penelope",
    "Prudence", "Rosalind", "Theodora", "Victoria", "Wilhelmina", "Winifred",
    // Surnames usable as solo handles for working-class or sky-crew PCs
    "Ashcroft", "Blackwell", "Carrington", "Greaves", "Holloway", "Pembroke",
    "Sinclair", "Whitcombe",
  ],
  gmVoice: "You are running a Victorian-era steampunk campaign in the tradition of Bioshock Infinite, Arcane, Mortal Engines, and The Difference Engine. The world is the long nineteenth century, but cleaner-air-where-the-rich-live and filthy-where-the-poor-work. Speak in Victorian register — 'gas-lamp', 'aether engine', 'sky-frigate', 'foundry', 'parlour', 'inspector', 'magistrate', 'hansom', 'broadsheet', 'sterling', 'shilling', 'tuppence', 'sir', 'madam', 'milord/milady' where appropriate. Lean into polite menace: the villain's threats are made over tea, the duel is fought in white gloves, the constable's bribe is folded into a calling card. Class consciousness is the air the PCs breathe — a working-class Foundry-Forged is treated differently from a Gentry in the same drawing-room, and the GM should never let that fade into the background. The wonderful and the grimy collide: a soot-stained street ends at a chromium-bright aether tram-stop; an airship's brass figurehead is bolted to a hull patched with salvage. Avoid modern register entirely — no smartphones, no internet, no 'okay'. Avoid pure high-fantasy register — no 'milord' to a passing peasant, no incantations in dead languages. Combat is loud (revolvers, rifles, aether arcs) but rarely instantly fatal — a duel may be settled by first blood, a brawl by the arrival of the constabulary. Track aether/reagent supply via the existing MP system; do not introduce a new resource.",
  portraitStyle: "Ornate Victorian portraiture in the tradition of Royal Academy oil painting crossed with the engraved-plate aesthetic of mid-nineteenth-century broadsheets and patent diagrams — Sargent's brushwork meeting a copperplate etching. Rich brown-and-amber palette with brass highlights, soot in the shadows, and a single cool teal-green note where aether is present. Sitter wears period dress: tailored frock coat, high collar, cravat or four-in-hand tie, waistcoat with a watch-chain; or a high-necked walking-dress with leg-of-mutton sleeves, gloves, and a cameo brooch. Goggles pushed up onto the brow are common; tinted lenses if the role demands it. Brass-Limb origins show a hinged prosthetic, never as spectacle. Aether-Touched origins show a faint blue-white halo at the eyes or fingertips, subtle. Background suggests a dim drawing-room, a foundry floor at night, the bridge of a brass-and-glass airship, or a gas-lit cobblestone street with a tram-cable visible. Lighting is low, warm key light from gas-lamps with cool fill from the open sky; rim-light from any aether device present. Subjects are composed, slightly formal, occasionally amused; never grinning. Texture suggests oil paint and engraver's line — visible brushwork, a hint of crosshatching in the deeper shadows. Portrait-to-waist framing, three-quarter pose. No text, no HUD, no UI overlays.",
};
