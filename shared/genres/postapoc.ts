// ─── Post-Apocalyptic Genre Pack ─────────────────────────────────────────────
// Survivors picking through the ruins after the world ended. Tone: Fallout,
// The Road, Mad Max, A Boy and His Dog. The world burned. What remains is
// yours to claim — if you can hold it.
//
// Spare, grim register. Things are scarce. Every bullet matters. People will
// kill you for a can of beans.

import type { GenreDefinition, ClassDef, RaceDef } from "./types";

const COMMON_INVENTORY = [
  { name: "Canned Food (3 days)", type: "consumable", qty: 1, properties: {} },
  { name: "Water Canteen", type: "tool", qty: 1, properties: {} },
  { name: "Bedroll (Threadbare)", type: "tool", qty: 1, properties: {} },
  { name: "Gas Mask", type: "tool", qty: 1, properties: {} },
  { name: "Scrip & Bottlecaps (50)", type: "treasure", qty: 1, properties: { value: 50 } },
];

const BASE_STATS = { might: 10, agility: 10, endurance: 10, intellect: 10, will: 10, presence: 10 };

const CLASSES: ClassDef[] = [
  {
    id: "scavenger",
    name: "Scavenger",
    iconName: "Package",
    color: "text-amber-400",
    description: "Knows where the cans of beans hide and which buildings still have working wiring. Eyes like a hawk, fingers like a tinker, light on their feet and lighter on their footprint.",
    stats: "Agility 14, Intellect 12",
    abilities: "Sharp Eye, Jury-Rig, Light Step",
    gear: "Pipe Pistol, Pry Bar, Patched Leathers",
    baseHp: 8,
    baseMp: 0,
    baseStats: { ...BASE_STATS, agility: 14, intellect: 12 },
    startingInventory: [
      ...COMMON_INVENTORY,
      { name: "Pipe Pistol", type: "weapon", qty: 1, rarity: "common", equipped: true, properties: { damage: "1d6", range: 30 } },
      { name: "Pry Bar", type: "weapon", qty: 1, rarity: "common", properties: { damage: "1d6", bonus: 1 } },
      { name: "Patched Leathers", type: "armor", qty: 1, rarity: "common", equipped: true, properties: { ac: 12, slot: "body" } },
      { name: "Toolkit (Junk)", type: "tool", qty: 1, properties: {} },
      { name: "Scrap Bullets", type: "consumable", qty: 12, properties: {} },
    ],
    startingAbilities: [
      { id: "sharp_eye", name: "Sharp Eye", description: "Spot loot, traps, and useful debris others walk past — advantage on searching ruins.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "jury_rig", name: "Jury-Rig", description: "Spend 1 minute and a handful of scrap to fix a broken device or make a one-shot tool.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "light_step", name: "Light Step", description: "Move silently across rubble, broken glass, and rust — advantage on stealth in ruined terrain.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
    ],
  },
  {
    id: "wastelander",
    name: "Wastelander",
    iconName: "Axe",
    color: "text-red-400",
    description: "Hardened survivor who has walked every dust road there is and outlasted every fight that found them. Hits like a sledgehammer, drinks worse than one.",
    stats: "Might 14, Endurance 12",
    abilities: "Brutal Swing, Iron Gut, Sleep Light",
    gear: "Machete, Sawn-Off Shotgun, Riveted Hide",
    baseHp: 12,
    baseMp: 0,
    baseStats: { ...BASE_STATS, might: 14, endurance: 12 },
    startingInventory: [
      ...COMMON_INVENTORY,
      { name: "Machete", type: "weapon", qty: 1, rarity: "common", equipped: true, properties: { damage: "1d8", bonus: 2 } },
      { name: "Sawn-Off Shotgun", type: "weapon", qty: 1, rarity: "common", properties: { damage: "1d10", range: 20 } },
      { name: "Riveted Hide Armor", type: "armor", qty: 1, rarity: "common", equipped: true, properties: { ac: 13, slot: "body" } },
      { name: "Shotgun Shells", type: "consumable", qty: 6, properties: {} },
      { name: "Bandages", type: "consumable", qty: 3, properties: { heal: "1d4" } },
    ],
    startingAbilities: [
      { id: "brutal_swing", name: "Brutal Swing", description: "Bring a heavy melee weapon down with full body weight — +1d6 damage on a successful melee hit.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "iron_gut", name: "Iron Gut", description: "Your stomach handles bad water, half-rotten food, and worse. Advantage on saves vs. poison and disease.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "sleep_light", name: "Sleep Light", description: "Years on the road taught you to wake at the wrong sound. You cannot be surprised while resting.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
    ],
  },
  {
    id: "survivor_medic",
    name: "Survivor-Medic",
    iconName: "Syringe",
    color: "text-emerald-400",
    description: "Half-trained, half-improvised, fully essential. Uses the genre's caster slot — Med Supplies instead of mana — to stim allies, brew counter-toxins, and patch wounds with whatever's at hand.",
    stats: "Intellect 14, Will 12",
    abilities: "Field Stim, Patch Up, Antidote",
    gear: "Surgical Kit, Hold-Out Pistol, Reinforced Coat",
    baseHp: 10,
    baseMp: 20,
    baseStats: { ...BASE_STATS, intellect: 14, will: 12 },
    startingInventory: [
      ...COMMON_INVENTORY,
      { name: "Surgical Kit", type: "tool", qty: 1, properties: { focus: 3 } },
      { name: "Hold-Out Pistol", type: "weapon", qty: 1, rarity: "common", equipped: true, properties: { damage: "1d6", range: 30 } },
      { name: "Reinforced Coat", type: "armor", qty: 1, rarity: "common", equipped: true, properties: { ac: 12, slot: "body" } },
      { name: "Stimpaks", type: "consumable", qty: 3, properties: { heal: "2d6+2" } },
      { name: "Rad-Away", type: "consumable", qty: 2, properties: {} },
    ],
    startingAbilities: [
      { id: "field_stim", name: "Field Stim", description: "Inject yourself or an ally with a stim cocktail — restore 2d6 HP (uses 1 Med Supply).", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "patch_up", name: "Patch Up", description: "Stop a bleeding wound and remove one minor condition (uses 1 Med Supply).", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "antidote", name: "Antidote", description: "Brew a counter to any poison, venom, or contaminant in the field (uses 2 Med Supplies).", usesMax: -1, usesLeft: -1, recharge: "at-will" },
    ],
  },
  {
    id: "raider",
    name: "Raider",
    iconName: "Crosshair",
    color: "text-orange-400",
    description: "Ranged killer with a reputation that goes ahead of them — the kind of person settlements bar their doors against. Pistols, intimidation, and the quiet certainty that they'll outlive whoever they're talking to.",
    stats: "Agility 14, Presence 12",
    abilities: "Gun-Fu, Intimidate, Mark for Death",
    gear: "Pipe Rifle, .44 Revolver, Spiked Leathers",
    baseHp: 10,
    baseMp: 0,
    baseStats: { ...BASE_STATS, agility: 14, presence: 12 },
    startingInventory: [
      ...COMMON_INVENTORY,
      { name: "Pipe Rifle", type: "weapon", qty: 1, rarity: "common", equipped: true, properties: { damage: "1d8", range: 80 } },
      { name: ".44 Revolver", type: "weapon", qty: 1, rarity: "common", properties: { damage: "1d8", range: 40 } },
      { name: "Spiked Leathers", type: "armor", qty: 1, rarity: "common", equipped: true, properties: { ac: 13, slot: "body" } },
      { name: "Rifle Rounds (Scarce)", type: "consumable", qty: 8, properties: {} },
      { name: ".44 Rounds", type: "consumable", qty: 12, properties: {} },
    ],
    startingAbilities: [
      { id: "gun_fu", name: "Gun-Fu", description: "Two pistols, both barking. Fire your sidearm twice in a single attack action.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "raider_intimidate", name: "Intimidate", description: "Drop your voice, show your scars — advantage on intimidation, and weaker NPCs may break and flee.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "mark_for_death", name: "Mark for Death", description: "Mark a target — your attacks against it deal +1d6 damage until it drops or escapes.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
    ],
  },
];

const RACES: RaceDef[] = [
  {
    name: "Pre-Fall Survivor",
    description: "Old enough to remember the world that was — the supermarkets, the highways, the lights staying on. Knows things nobody else knows, and is tired in a way younger survivors don't understand.",
    traits: "+2 Intellect · +1 Will · Pre-Fall Lore (recognise tech, brands, places) · -1 Endurance (the body is tired)",
    bonuses: { intellect: 2, will: 1, endurance: -1 },
  },
  {
    name: "Vault-Born",
    description: "Raised in a shelter — concrete walls, scheduled meals, a recording on loop. The wasteland is the second world they've ever seen and they're still not used to weather.",
    traits: "+2 Will · +1 Intellect · Sheltered Education (literate, numerate) · -1 Presence (naive in social situations)",
    bonuses: { will: 2, intellect: 1, presence: -1 },
  },
  {
    name: "Wasteland-Born",
    description: "Lifetime exposure. Born in a tent or under a rusted overpass, weaned on dust and bad water. The wasteland fits them like an old coat — and they trust no one they didn't grow up with.",
    traits: "+2 Endurance · +1 Agility · Adapted to Hardship (advantage vs. environment) · -1 Presence (mistrusts outsiders)",
    bonuses: { endurance: 2, agility: 1, presence: -1 },
  },
  {
    name: "Mutant",
    description: "Visible mutation — a third arm, gill-slits, patches of bark-like skin, eyes a wrong colour. The body works, mostly. People recoil.",
    traits: "+2 Endurance · +1 Might · Mutant Resilience (resistance to radiation/poison) · -1 Presence (people fear them)",
    bonuses: { endurance: 2, might: 1, presence: -1 },
  },
  {
    name: "Ghoul-Touched",
    description: "Radiation didn't kill them — it changed them. Skin leathery, voice cracked, healing slow but ageing slower. They have time the others don't.",
    traits: "+3 Endurance · Radiation Healing (rads heal you instead of harming) · Slow-Aged (lifespan extended) · -1 Presence (visibly inhuman)",
    bonuses: { endurance: 3, presence: -1 },
  },
  {
    name: "Cult Refugee",
    description: "Escaped from one of the wasteland's many bad churches — atomic, cannibal, machine-worshipping, worse. Carries scripture in their head and scars under their clothes.",
    traits: "+2 Presence · +1 Will · Cult Doctrine (recognise wasteland cults and their rituals) · Paranoid (advantage on saves vs. charm)",
    bonuses: { presence: 2, will: 1 },
  },
];

export const POSTAPOC: GenreDefinition = {
  id: "postapoc",
  label: "Post-Apocalyptic",
  tagline: "After the end — scavenge, build, endure.",
  description: "The world burned and what remains is yours to claim. Wasteland survival amid the ruins of the old world.",
  iconName: "Skull",
  comingSoon: false,
  classes: CLASSES,
  races: RACES,
  raceLabel: "Origin",
  backgrounds: [
    "Caravan Guard", "Vault Tech", "Wasteland Doc", "Scrapper",
    "Settlement Sheriff", "Tribal Hunter", "Ex-Raider", "Trader",
    "Brotherhood Initiate", "Drifter", "Farmhand (Irradiated)", "Radio Operator",
  ],
  personalityTraits: [
    "Grim", "Laconic", "Wary", "Stubborn", "Patient", "Bitter",
    "Pragmatic", "Quietly kind", "Hard-eyed", "Loyal-to-few", "Worn down", "Hopeful anyway",
    "Sardonic", "Watchful", "Self-reliant", "Slow to anger",
  ],
  motivations: [
    "Find a working radio signal — there has to be one",
    "Get back to the settlement before winter",
    "Track down the raider chief who took someone",
    "Build something that outlasts you",
    "Find clean water for the kids",
    "Pay off a caravan debt before they collect",
    "Avenge a burned-out homestead",
    "Reach the coast — they say it's different there",
    "Recover a pre-fall artifact for a buyer",
    "Get out of the wasteland for good",
    "Prove the rumours about the old facility",
    "Just survive one more season",
  ],
  flaws: [
    "Hooked on chems",
    "Owes a caravan boss more than they can pay",
    "Wanted by raiders for an old job",
    "Carries radiation sickness, hides it",
    "Watched a settlement burn and did nothing",
    "Can't sleep without a loaded weapon",
    "Refuses to enter pre-fall buildings",
    "Drinks bad water out of habit",
    "Left someone behind once and lies about it",
    "Trusts the wrong faction",
    "Lost a hand and resents the prosthetic",
    "Carries a pre-fall photograph they won't show",
  ],
  names: [
    "Dust", "Cinder", "Ash", "Mara", "Cole", "Wren", "Joss", "Rook",
    "Reno", "Vee", "Hark", "Tig", "Sable", "Murph", "Jax", "Bram",
    "Kit", "Doc", "Hawk", "Sully", "Vance", "Tess", "Rance", "Mick",
    "Buck", "Cass", "Dell", "Eli", "Faye", "Gus", "Hale", "Iris",
    "Jude", "Kira", "Lonnie", "Marlow", "Nell", "Otis", "Pike", "Rust",
  ],
  gmVoice: "You are running a post-apocalyptic survival campaign in the tradition of Fallout, The Road, Mad Max, and A Boy and His Dog. The world ended a long time ago; the survivors are still working out what comes next. Tone is spare, grim, weather-beaten. Use post-apocalyptic register: settlement, caravan, raiders, brahmin, rad-storm, scrap, scrip, bottlecaps, the ruins, the wastes, the highway, pre-fall. Avoid all fantasy register — no 'milord', no 'tavern', no 'spell'. Avoid clean sci-fi register — no 'starship', no 'parsec'. Resources are scarce: every bullet, every can of food, every dose of clean water matters and is narrated as such. Most NPCs are tired, suspicious, and one bad week from desperate. Combat is short, ugly, and often resolved by who shoots first. Help arrives rarely. Mercy is a luxury. Hope is a private thing.",
  portraitStyle: "Weathered, dust-caked, photo-realistic concept art in the post-industrial-decay tradition of Fallout, Mad Max, and Stalker promo work. Cinematic digital painting with overcast or low-angled sun, blowing dust and ash, harsh shadows. Palette of rust, bone, faded olive drab, sun-bleached denim, oxidised copper, ochre, and dirty grey — almost no saturated colour. Costuming is improvised survival gear: stitched-together leathers, patched coats, scarves pulled up against grit, rebreathers, jury-rigged armour from sheet metal and tyres, dog-tags, bandoliers of scarce ammo. Skin shows the work — windburn, scars, sunken eyes, chapped lips. Backgrounds suggest ruined freeways, collapsed buildings, a rad-storm on the horizon. Portrait-to-waist framing, shallow depth of field, gritty texture. Never glamorous, never glowing, never clean. No text, no HUD, no UI overlays.",
};
