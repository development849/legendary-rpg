// ─── Superhero Genre Pack ────────────────────────────────────────────────────
// Modern-day capes, secret identities, escalating stakes. Marvel/DC, The Boys,
// Worm, Wild Cards. Cinematic, banter-heavy, splash-page combat — and a
// life under the mask that costs as much as it pays.
//
// The GM narrates powers; there is no separate power-points editor. Mentalist
// is the only MP-using class (MP rebranded narratively as Mental Strain).
// Secret-identity exposure is tracked narratively via PLOT_FACT_SET
// (`secret_id_known_by`); no UI for it.

import type { GenreDefinition, ClassDef, RaceDef } from "./types";

const COMMON_INVENTORY = [
  { name: "Costume", type: "armor", qty: 1, rarity: "common", equipped: true, properties: { ac: 11, slot: "body" } },
  { name: "Secret-Identity ID & Wallet", type: "misc", qty: 1, properties: { note: "Driver's licence, civilian cash, the keys to a life nobody at the scene knows about." } },
  { name: "Team Communicator (Earpiece)", type: "tool", qty: 1, properties: {} },
  { name: "Civilian Phone", type: "tool", qty: 1, properties: {} },
  { name: "Cash ($60)", type: "treasure", qty: 1, properties: { value: 60 } },
];

const BASE_STATS = { might: 10, agility: 10, endurance: 10, intellect: 10, will: 10, presence: 10 };

const CLASSES: ClassDef[] = [
  {
    id: "brawler",
    name: "Brawler",
    iconName: "Shield",
    color: "text-red-400",
    description: "Super-strength, super-durability, and the willingness to step between the bus and the bystanders. The one the GM calls when a building falls.",
    stats: "Might 14, Endurance 14",
    abilities: "Super-Strength, Tough Hide, Catch It",
    gear: "Reinforced Costume, Spare Civvies, Comm Earpiece",
    baseHp: 14,
    baseMp: 0,
    baseStats: { ...BASE_STATS, might: 14, endurance: 14 },
    startingInventory: [
      ...COMMON_INVENTORY,
      { name: "Reinforced Costume (Upgrade)", type: "armor", qty: 1, rarity: "common", equipped: true, properties: { ac: 13, slot: "body" } },
      { name: "Spare Civvies", type: "tool", qty: 1, properties: { note: "A change of street clothes carried in a small backpack." } },
    ],
    startingAbilities: [
      { id: "super_strength", name: "Super-Strength", description: "Lift, throw, or shove objects far beyond mortal strength — cars, girders, the occasional small helicopter.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "tough_hide", name: "Tough Hide", description: "Bullets, blades, and the second-storey landing barely register — resistance to non-energy physical damage.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "catch_it", name: "Catch It", description: "Step between an attack and an ally or bystander — take the hit yourself with advantage on the soak.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
    ],
  },
  {
    id: "speedster",
    name: "Speedster",
    iconName: "Zap",
    color: "text-yellow-300",
    description: "The world arrives at normal speed. You don't. You're early, you're already there, and you're back with the kid before the building has finished collapsing.",
    stats: "Agility 14, Endurance 12",
    abilities: "Super-Speed, Sprint-Attack, Reroute",
    gear: "Streamlined Costume, Energy-Bar Pouch, Comm Earpiece",
    baseHp: 10,
    baseMp: 0,
    baseStats: { ...BASE_STATS, agility: 14, endurance: 12 },
    startingInventory: [
      ...COMMON_INVENTORY,
      { name: "Streamlined Costume", type: "armor", qty: 1, rarity: "common", equipped: true, properties: { ac: 12, slot: "body" } },
      { name: "Energy-Bar Pouch", type: "consumable", qty: 6, properties: { note: "Speedsters burn calories. A lot of them." } },
    ],
    startingAbilities: [
      { id: "super_speed", name: "Super-Speed", description: "Move at superhuman speed — cross a city block, evacuate a room, or arrive before you're called.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "sprint_attack", name: "Sprint-Attack", description: "Strike twice when you take the Attack action: speed is its own multiplier.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "reroute", name: "Reroute", description: "Move an ally, civilian, or thrown object up to 60ft as a bonus action.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
    ],
  },
  {
    id: "mentalist",
    name: "Mentalist",
    iconName: "Brain",
    color: "text-violet-400",
    description: "The genre's caster slot — telepathy and telekinesis fuelled by raw concentration. Every use costs Mental Strain (the genre's name for MP); push too hard and the nosebleed starts.",
    stats: "Will 14, Intellect 12",
    abilities: "Telepathic Probe, Telekinetic Hand, Psychic Bolt",
    gear: "Civilian Suit (Bulletproof Liner), Hold-Out Pistol, Comm Earpiece",
    baseHp: 7,
    baseMp: 20,
    baseStats: { ...BASE_STATS, will: 14, intellect: 12 },
    startingInventory: [
      ...COMMON_INVENTORY,
      { name: "Civilian Suit (Bulletproof Liner)", type: "armor", qty: 1, rarity: "common", equipped: true, properties: { ac: 12, slot: "body" } },
      { name: "Hold-Out Pistol", type: "weapon", qty: 1, rarity: "common", properties: { damage: "1d6", range: 20 } },
      { name: "Migraine Medication", type: "consumable", qty: 6, properties: { note: "For the after." } },
    ],
    startingAbilities: [
      { id: "telepathic_probe", name: "Telepathic Probe", description: "Reach into a target's surface thoughts — gain one true fact they know (costs 1 Mental Strain).", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "telekinetic_hand", name: "Telekinetic Hand", description: "Lift, throw, or shove objects up to your own weight at a distance (costs 1 Mental Strain).", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "psychic_bolt", name: "Psychic Bolt", description: "A focused mental blast — 1d10 psychic damage, Will save (DC 13) for half (costs 2 Mental Strain).", usesMax: -1, usesLeft: -1, recharge: "at-will" },
    ],
  },
  {
    id: "gadgeteer",
    name: "Gadgeteer",
    iconName: "Wrench",
    color: "text-cyan-400",
    description: "No powers. A workshop, a frightening level of intellect, and a utility belt that has a small answer to most problems. The kit makes the hero.",
    stats: "Intellect 14, Agility 12",
    abilities: "Utility Belt, Analyse, Field Improvisation",
    gear: "Powered Suit, Utility Belt, Grapple Launcher, Comm Earpiece",
    baseHp: 8,
    baseMp: 0,
    baseStats: { ...BASE_STATS, intellect: 14, agility: 12 },
    startingInventory: [
      ...COMMON_INVENTORY,
      { name: "Powered Suit (Light)", type: "armor", qty: 1, rarity: "common", equipped: true, properties: { ac: 14, slot: "body" } },
      { name: "Utility Belt", type: "tool", qty: 1, properties: { note: "Smoke pellets, flash-bangs, restraint cuffs, lock-picks, mini-thermite, EMP slug — three uses each, refilled at the workshop." } },
      { name: "Grapple Launcher", type: "tool", qty: 1, properties: {} },
      { name: "Tactical Stun-Baton", type: "weapon", qty: 1, rarity: "common", equipped: true, properties: { damage: "1d8" } },
      { name: "Hold-Out Pistol", type: "weapon", qty: 1, rarity: "common", properties: { damage: "1d6", range: 20 } },
      { name: "Multi-Tool Kit", type: "tool", qty: 1, properties: {} },
    ],
    startingAbilities: [
      { id: "utility_belt", name: "Utility Belt", description: "Draw the right gadget for the moment: smoke, flash, restraints, EMP, thermite — one belt-item use per scene.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "analyse", name: "Analyse", description: "Scan a person, device, or scene — surface one technical or tactical insight the others missed.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "field_improvisation", name: "Field Improvisation", description: "Spend a minute and any reasonable scrap to build a one-shot custom device.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
    ],
  },
];

const RACES: RaceDef[] = [
  {
    name: "Mutate",
    description: "Born with the gene, the lineage, or the inexplicable. The powers have been there since adolescence — never trained for, never paid for, simply yours.",
    traits: "+2 to one stat tied to your power · +1 Endurance · Native Power (always-on, never disarmed)",
    bonuses: { endurance: 1, might: 1, will: 1 },
    // Per spec: "Mutate gets ordinary clothes." Powers come from the body, not
    // from gear — origin adds plain civilian wear and nothing else.
    startingInventory: [
      { name: "Ordinary Street Clothes", type: "tool", qty: 1, properties: { note: "A change of T-shirt and jeans. The powers don't need a costume." } },
    ],
  },
  {
    name: "Tech",
    description: "The suit is the hero. Without it you are a clever person in their thirties with a sore back. With it, you are a household name.",
    traits: "+3 Intellect · +1 Agility · Workshop Access (rebuild/upgrade kit between missions) · -1 Might (no powers without the gear)",
    bonuses: { intellect: 3, agility: 1, might: -1 },
    // Per spec: "Tech gets gear stack." Origin grants a meaningful additional
    // gadget rack on top of whatever the class already carries.
    startingInventory: [
      { name: "Spare Power Cells", type: "consumable", qty: 6, properties: { note: "Keeps the suit, the comm, and the launcher running through a long fight." } },
      { name: "Portable Workshop Kit", type: "tool", qty: 1, properties: { note: "Field-repair the gear when the bench is hours away." } },
      { name: "Diagnostic Tablet", type: "tool", qty: 1, properties: {} },
      { name: "EMP Slug (Extra)", type: "consumable", qty: 2, properties: {} },
      { name: "Smoke Pellet (Extra)", type: "consumable", qty: 3, properties: {} },
    ],
  },
  {
    name: "Cosmic",
    description: "Something from outside this solar system reached down and touched you. You can't fully explain what you are now, and neither can anyone else.",
    traits: "+2 Will · +1 Intellect · Star-Sight (perceive cosmic/extra-dimensional phenomena) · -1 Endurance (the body adjusts slowly)",
    bonuses: { will: 2, intellect: 1, endurance: -1 },
    startingInventory: [
      { name: "Star-Shard Pendant", type: "misc", qty: 1, properties: { note: "A fragment of whatever first touched you. Warm to the touch, hums under pressure." } },
    ],
  },
  {
    name: "Trained",
    description: "Peak-human, no powers. Eighteen martial arts, three doctorates, more contingency plans than friends. The fact that you are in the room with the powered ones is the point.",
    traits: "+1 to all stats · Peak-Human Training (advantage on first attack of any encounter)",
    bonuses: { might: 1, agility: 1, endurance: 1, intellect: 1, will: 1, presence: 1 },
    startingInventory: [
      { name: "Training Wraps & Mouthguard", type: "tool", qty: 1, properties: {} },
      { name: "Field First-Aid Kit", type: "consumable", qty: 1, properties: { heal: "2d4" } },
    ],
  },
  {
    name: "Magical",
    description: "Patron, pact, bloodline, inheritance — the power is real and ancient, and so is the price. Most of your colleagues do not know quite what to do with you.",
    traits: "+2 Presence · +2 Will · Occult Sight (recognise rituals, sigils, supernatural beings)",
    bonuses: { presence: 2, will: 2 },
    startingInventory: [
      { name: "Focus Item (Heirloom Ring or Amulet)", type: "misc", qty: 1, properties: { focus: 2, note: "The rite is in the metal. The bargain is in the bearer." } },
      { name: "Pocket Grimoire", type: "tool", qty: 1, properties: {} },
    ],
  },
  {
    name: "Symbiotic",
    description: "The powers belong to the thing bonded to you. It is helpful, mostly. It is patient, mostly. When stressed it speaks, and people notice.",
    traits: "+3 Endurance · +1 Might · Symbiote Voice (the bond grants insight) · -1 Presence (the bond surfaces under pressure and unsettles others)",
    bonuses: { endurance: 3, might: 1, presence: -1 },
    startingInventory: [
      { name: "Containment Vial", type: "consumable", qty: 2, properties: { note: "A measured dose of the suppressant the bond doesn't enjoy. For the bad days." } },
    ],
  },
];

export const SUPERHERO: GenreDefinition = {
  id: "superhero",
  label: "Superhero",
  tagline: "Cape, mask, mission.",
  description: "Four-colour heroics. Powered protectors square off against villains, conspiracies, and their own demons.",
  iconName: "Star",
  comingSoon: false,
  classes: CLASSES,
  races: RACES,
  raceLabel: "Origin",
  backgrounds: [
    "Reporter", "Beat Cop", "Grad Student", "Park Ranger", "EMT",
    "Defence Lawyer", "High-School Teacher", "Bartender", "Tech CEO", "Soldier (Discharged)",
    "Street Vigilante", "Ex-Villain (Reformed)",
  ],
  personalityTraits: [
    "Earnest", "Wisecracking", "Brooding", "Driven", "Idealistic", "Cynical-with-a-soft-spot",
    "Stoic", "Reckless", "Compassionate", "Tightly-wound", "Self-deprecating", "Quietly furious",
    "Charming", "Withdrawn", "Steady-handed", "Hopeful",
  ],
  motivations: [
    "Live up to the mentor who died on your watch",
    "Find the person responsible for the accident that gave you the powers",
    "Keep a younger sibling out of the life",
    "Prove the powered are not all monsters",
    "Pay for the damage you caused the first time you lost control",
    "Bring in the villain who put your civilian self in hospital",
    "Earn a place on the proper team",
    "Hide the secret identity from a parent who would not approve",
    "Atone for a year spent on the wrong side",
    "Be the hero this city has never had",
    "Get the powers out of you and back to a normal life",
    "Outlast the people who are trying to publish your real name",
  ],
  flaws: [
    "Secret identity is one bad day from collapse",
    "Owes a debt to a villain",
    "The powers misfire when emotions spike",
    "Cannot lie to the people they love and cannot tell them the truth",
    "Drinks to cope with what they have seen",
    "Refuses to work with one specific teammate",
    "Carries the costume in a duffel and sleeps badly",
    "Has been to therapy and lied to the therapist",
    "Outed once to a journalist and never quite recovered",
    "Hides a body count from the team",
    "Estranged from family because of the mask",
    "Trusts the wrong civilian contact",
  ],
  names: [
    "Alex", "Sam", "Riley", "Morgan", "Casey", "Jordan", "Avery", "Quinn",
    "Maya", "Diego", "Yuki", "Amara", "Nadia", "Theo", "Ezra", "Priya",
    "Jonah", "Ada", "Marcus", "Eun-ji", "Kofi", "Lena", "Mateo", "Imani",
    // hero handles
    "Aegis", "Vector", "Halcyon", "Spectre", "Vox", "Onyx", "Solstice", "Echo",
    "Riptide", "Sable", "Atlas", "Lumen", "Phantasm", "Maverick", "Patrol", "Daybreak",
  ],
  gmVoice: "You are running a modern-day superhero campaign in the tradition of Marvel, DC, The Boys, Worm, and Wild Cards. Tone is cinematic and comic-book — splash-page combat beats, banter under fire, escalating stakes scene by scene. Narrate powers as the GM; the players will not give you a power-list spreadsheet, only their class, origin, and what they try. Describe punches that move cars. Describe a Speedster cleaning out a corridor before the door has finished opening. Describe a Mentalist's nosebleed when she pushes too hard. The world is contemporary — phones, hospitals, traffic, headlines, social-media leaks. Use modern register: precinct, paramedic, press, federal warrant, the news, the network, the lab, downtown. Avoid fantasy register entirely. Track secret-identity exposure narratively through PLOT_FACT_SET, key `secret_id_known_by` — record each new person who finds out and what they did about it. Do not introduce a secret-identity gauge. Civilians are real people; the cost of letting one die is felt by the team for sessions afterward. Combat is fast, loud, and rarely fatal — heroes pull punches, villains have lawyers, and a single missed save can land both on the evening news.",
  portraitStyle: "Dynamic comic-book illustration in the tradition of modern Marvel/DC trade-paperback covers — Alex Ross painted realism crossed with Phil Noto graphic clarity. Bold inked silhouette, confident line-work, saturated four-colour palette (primary reds, blues, yellows against deep shadow). Costume is signature and immediately readable: distinctive emblem on the chest, a clear colour identity, mask or domino where appropriate, civilian visible underneath if no powers are active. Lighting is dramatic and rim-lit — a back-light to lift the silhouette, a key-light to model the face, a cool fill in the shadows. Pose is iconic rather than static: shoulders squared, low-angle hero shot, cape or coat catching the wind if appropriate. Faces show character — determined, weary, hopeful, never blank. Background is a brief comic-panel suggestion (skyline at night, neon-lit rooftop, lab, alley) handled with loose painterly washes so the figure remains the focus. Portrait-to-waist framing, dynamic asymmetric composition. Never photorealistic, never chibi or stylised-cute — modern dramatic comic art. No text, no logos other than the chest emblem, no HUD, no UI overlays.",
};
