// ─── Cosmic Horror Genre Pack ────────────────────────────────────────────────
// 1920s investigators sliding toward forbidden knowledge and gibbering
// madness. Lovecraft, Call of Cthulhu, The King in Yellow, Bloodborne.
//
// The horror is in what is implied, not what is shown. The GM is unreliable.
// Things are wrong before they are named. Knowledge has a price; sanity is
// the coin. There is no separate Sanity stat — the GM tracks erosion
// narratively via PLOT_FACT_SET (`sanity_state`), not via a UI gauge.

import type { GenreDefinition, ClassDef, RaceDef } from "./types";

const COMMON_INVENTORY = [
  { name: "Notebook & Pen", type: "tool", qty: 1, properties: {} },
  { name: "Kerosene Lantern", type: "tool", qty: 1, properties: {} },
  { name: "Pocket Watch", type: "misc", qty: 1, properties: {} },
  { name: "Pack of Lucky Strikes", type: "consumable", qty: 1, properties: {} },
  { name: "Cash ($120)", type: "treasure", qty: 1, properties: { value: 120 } },
];

const BASE_STATS = { might: 10, agility: 10, endurance: 10, intellect: 10, will: 10, presence: 10 };

const CLASSES: ClassDef[] = [
  {
    id: "investigator",
    name: "Investigator",
    iconName: "Search",
    color: "text-amber-400",
    description: "Private eye, journalist, or amateur sleuth — the generalist who notices the empty chair at the dinner party and the wrong dust on the bookshelf. Pieces together what the others would rather not see.",
    stats: "Intellect 14, Agility 12",
    abilities: "Observation, Trail Sense, Cold Read",
    gear: "Service Revolver, Notebook, Trenchcoat",
    baseHp: 10,
    baseMp: 0,
    baseStats: { ...BASE_STATS, intellect: 14, agility: 12 },
    startingInventory: [
      ...COMMON_INVENTORY,
      { name: "Service Revolver", type: "weapon", qty: 1, rarity: "common", equipped: true, properties: { damage: "1d8", range: 40 } },
      { name: ".38 Cartridges", type: "consumable", qty: 18, properties: {} },
      { name: "Trenchcoat", type: "armor", qty: 1, rarity: "common", equipped: true, properties: { ac: 12, slot: "body" } },
      { name: "Magnifying Glass", type: "tool", qty: 1, properties: {} },
    ],
    startingAbilities: [
      { id: "observation", name: "Observation", description: "A long look at a scene yields one detail the others missed.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "trail_sense", name: "Trail Sense", description: "Pick up and follow a physical trail across a city or countryside, even hours later.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "ci_cold_read", name: "Cold Read", description: "Read an NPC's clothing, accent, and bearing — surface their profession, recent travels, or a recent loss.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
    ],
  },
  {
    id: "antiquarian",
    name: "Antiquarian",
    iconName: "BookOpen",
    color: "text-violet-400",
    description: "The genre's caster slot — occult scholar who pieces together half-understood rites from mouldering grimoires. Their power is real, but every working leaves a stain on the mind. The GM may narrate sanity erosion in response.",
    stats: "Intellect 14, Will 12",
    abilities: "Recall the Rite, Banishment Sign, Read the Unreadable",
    gear: "Grimoire (Fragmentary), Hold-Out Pistol, Walking Cane",
    baseHp: 6,
    baseMp: 20,
    baseStats: { ...BASE_STATS, intellect: 14, will: 12 },
    startingInventory: [
      ...COMMON_INVENTORY,
      { name: "Grimoire (Fragmentary)", type: "tool", qty: 1, properties: { focus: 3 } },
      { name: "Hold-Out Pistol", type: "weapon", qty: 1, rarity: "common", equipped: true, properties: { damage: "1d6", range: 20 } },
      { name: "Walking Cane (Weighted)", type: "weapon", qty: 1, rarity: "common", properties: { damage: "1d6", bonus: 1 } },
      { name: "Tweed Suit", type: "armor", qty: 1, rarity: "common", equipped: true, properties: { ac: 10, slot: "body" } },
      { name: "Powdered Iron (Pouch)", type: "consumable", qty: 3, properties: {} },
    ],
    startingAbilities: [
      { id: "recall_the_rite", name: "Recall the Rite", description: "Spend a moment and recall a relevant fragment of forbidden lore — gain one true fact about a supernatural creature, place, or sign (uses 1 Focus; the GM may note sanity erosion).", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "banishment_sign", name: "Banishment Sign", description: "Trace a half-remembered glyph — a supernatural entity must make a Will save (DC 13) or be pushed back 30ft and unable to approach for 1 minute (uses 2 Focus).", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "read_the_unreadable", name: "Read the Unreadable", description: "Force meaning from a text in any dead, lost, or non-human script — but you will not enjoy what you learn (uses 1 Focus).", usesMax: -1, usesLeft: -1, recharge: "at-will" },
    ],
  },
  {
    id: "dreamer",
    name: "Dreamer",
    iconName: "Moon",
    color: "text-indigo-400",
    description: "Oneiromancer who walks the Dreamlands as casually as a kitchen. Frail in the waking world, formidable when asleep. The line between the two thins around them, and not everything they bring back is theirs.",
    stats: "Will 14, Presence 12",
    abilities: "Walk the Dreamlands, Borrowed Glimpse, Read the Sleeper",
    gear: "Silver Key, Notebook of Dreams, Vial of Laudanum",
    baseHp: 6,
    baseMp: 18,
    baseStats: { ...BASE_STATS, will: 14, presence: 12 },
    startingInventory: [
      ...COMMON_INVENTORY,
      { name: "Silver Key", type: "misc", qty: 1, properties: { focus: 3 } },
      { name: "Notebook of Dreams", type: "tool", qty: 1, properties: {} },
      { name: "Vial of Laudanum", type: "consumable", qty: 3, properties: {} },
      { name: "Long Coat", type: "armor", qty: 1, rarity: "common", equipped: true, properties: { ac: 11, slot: "body" } },
      { name: "Hatpin (Sharp)", type: "weapon", qty: 1, rarity: "common", properties: { damage: "1d4", finesse: true } },
    ],
    startingAbilities: [
      { id: "walk_the_dreamlands", name: "Walk the Dreamlands", description: "Slip into sleep at will and project into the Dreamlands — your body remains still and vulnerable behind you (uses 2 Focus).", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "borrowed_glimpse", name: "Borrowed Glimpse", description: "Reach into the dreams of a sleeping mortal nearby and glean one true memory, fear, or secret (uses 1 Focus).", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "read_the_sleeper", name: "Read the Sleeper", description: "Tell at a glance whether someone has been touched by the Dreamlands or something worse.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
    ],
  },
  {
    id: "scholar",
    name: "Scholar",
    iconName: "GraduationCap",
    color: "text-teal-400",
    description: "Academic — historian, linguist, philologist — who reads what the Antiquarian dares not invoke. Knows the languages, the genealogies, the right archive to write to. Persuasion as a working tool, not a flourish.",
    stats: "Intellect 14, Presence 12",
    abilities: "Linguist, Library Hand, The Right Question",
    gear: "Letters of Introduction, Hold-Out Pistol, Reference Library",
    baseHp: 8,
    baseMp: 0,
    baseStats: { ...BASE_STATS, intellect: 14, presence: 12 },
    startingInventory: [
      ...COMMON_INVENTORY,
      { name: "Hold-Out Pistol", type: "weapon", qty: 1, rarity: "common", equipped: true, properties: { damage: "1d6", range: 20 } },
      { name: "Tweed Suit", type: "armor", qty: 1, rarity: "common", equipped: true, properties: { ac: 10, slot: "body" } },
      { name: "Letters of Introduction", type: "tool", qty: 1, properties: {} },
      { name: "Reference Library (Portable)", type: "tool", qty: 1, properties: {} },
      { name: "Books in Dead Languages", type: "misc", qty: 3, properties: {} },
    ],
    startingAbilities: [
      { id: "scholar_linguist", name: "Linguist", description: "You read and speak Latin, Greek, French, German, and one further language of your choice — modern, classical, or obscure.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "library_hand", name: "Library Hand", description: "Given an hour and any reasonable library, retrieve one specific fact, citation, or precedent.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "right_question", name: "The Right Question", description: "Once per scene, ask a witness, official, or curator a question phrased so precisely they will answer it honestly without realising why.", usesMax: 1, usesLeft: 1, recharge: "per-rest" },
    ],
  },
];

const RACES: RaceDef[] = [
  {
    name: "Mundane",
    description: "Baseline 1920s human. No special inheritance, no markings, no recurring dream — just a person who has walked into something far older than they are.",
    traits: "+1 to all stats · Bonus Skill Proficiency · Refuses to Believe (resist initial fear)",
    bonuses: { might: 1, agility: 1, endurance: 1, intellect: 1, will: 1, presence: 1 },
  },
  {
    name: "Touched-by-Dreams",
    description: "Recurring dreams since childhood — the same staircase, the same sea, the same six-sided room. The dreams have begun to leak.",
    traits: "+2 Will · +1 Intellect · Dream-Sight (advantage on perception of supernatural) · -1 Endurance (sleep is troubled)",
    bonuses: { will: 2, intellect: 1, endurance: -1 },
  },
  {
    name: "Old-Blood",
    description: "Something in the family line — never spoken of, but present in the portrait gallery if you know what you are looking at. The blood remembers what the family forgot.",
    traits: "+2 Presence · +1 Will · Inherited Memory (recall one true ancestral fact per session) · Hidden Heritage (others sense something off)",
    bonuses: { presence: 2, will: 1 },
  },
  {
    name: "Crossroads-Born",
    description: "Born at a thin place — a crossroads, a battlefield, a church that was built on something older. The world is more permeable to you than to others.",
    traits: "+2 Intellect · +2 Will · Thin Veil (sense supernatural presences within 100ft) · -1 Presence (strangers find them unsettling)",
    bonuses: { intellect: 2, will: 2, presence: -1 },
  },
  {
    name: "Marked",
    description: "Already touched by something — a scar that didn't come from anything human, a birthmark in a shape no parent recognised. The mark gives, and the mark takes.",
    traits: "+2 Will · +1 Intellect · +1 Presence · Marked Sight (always see the unseen) · Reduced Resilience (the mind is thinner)",
    bonuses: { will: 2, intellect: 1, presence: 1 },
  },
  {
    name: "Wayfarer",
    description: "Well-travelled occult researcher — Cairo, Calcutta, Reykjavík, Innsmouth. Speaks several tongues, knows several customs, and has seen something on the road they do not discuss.",
    traits: "+2 Intellect · +1 Agility · Polyglot (additional languages) · Travelled Eye (recognise foreign sigils, customs, and currencies)",
    bonuses: { intellect: 2, agility: 1 },
  },
];

export const COSMIC_HORROR: GenreDefinition = {
  id: "cosmichorror",
  label: "Cosmic Horror",
  tagline: "Knowledge has a price. Sanity is the coin.",
  description: "Lovecraftian dread. Investigators uncover truths the universe was not meant to share.",
  iconName: "Eye",
  comingSoon: false,
  classes: CLASSES,
  races: RACES,
  raceLabel: "Lineage",
  backgrounds: [
    "Private Investigator", "Journalist", "University Lecturer", "Antiquarian Bookseller",
    "Country Doctor", "Police Inspector", "Spiritualist", "Heir to a Quiet Fortune",
    "Architect", "Museum Curator", "Veteran of the Great War", "Mortician",
  ],
  personalityTraits: [
    "Methodical", "Sceptical", "Haunted", "Reserved", "Tenacious",
    "Curious-past-reason", "Quietly devout", "Sardonic", "Compassionate", "Watchful",
    "Erudite", "Diffident", "Brave despite themselves", "Bitter", "Patient",
    "Outwardly composed",
  ],
  motivations: [
    "Find what happened to a colleague who vanished in the field",
    "Recover a manuscript that the family says doesn't exist",
    "Disprove — or confirm — a childhood memory",
    "Catalogue a strange inheritance properly",
    "Honour a deathbed promise",
    "Track down a cult before they finish a working",
    "Get out of the work and back to a normal life",
    "Atone for what they read in a book they should not have opened",
    "Find the dreaming city they remember from childhood",
    "Bring back a missing brother or sister",
    "Publish, before someone else does or before they cannot",
    "Understand the family name properly, at last",
  ],
  flaws: [
    "Sleeps badly; refuses to say why",
    "Owes a secret society more than they can afford",
    "Already has a working they cannot unmake",
    "Drinks too much, and has done since the war",
    "Cannot enter a particular city or county",
    "Reads compulsively — including the wrong books",
    "Carries a fragment of something they should have destroyed",
    "Estranged from the family for reasons no one will write down",
    "Hears one voice that isn't there, only ever the same one",
    "Lost a colleague and will not speak of it",
    "Compulsively notes everything in their journal",
    "Trusts the wrong patron",
  ],
  names: [
    "Howard", "Charles", "Edgar", "Algernon", "Wilbur", "Henry", "George", "Frederick",
    "Cordelia", "Beatrice", "Agatha", "Eleanor", "Mildred", "Genevieve", "Iris", "Constance",
    "Randolph", "Herbert", "Asenath", "Lavinia", "Obed", "Robert", "Walter", "Edward",
    "Margaret", "Vivian", "Helena", "Rose", "Theodora", "Sylvia", "Maud", "Imogen",
    "Ambrose", "Cyrus", "Thaddeus", "Reginald", "Phineas", "Quentin", "Silas", "Augustus",
  ],
  gmVoice: "You are running a cosmic-horror investigation in the tradition of Lovecraft, Call of Cthulhu, The King in Yellow, and Bloodborne. The year is the 1920s — gaslight giving way to electric, telephones rare, automobiles a sign of money, the Great War a recent and unhealed scar. Be unreliable. Be oblique. Things are wrong before they are named, and very often never named at all. Do not confirm what the players half-see. Reflections lag a beat. Letters in the post arrive in the wrong handwriting. A man in a yellow coat is at the back of every photograph from that week. Use period register: 'motor-car', 'wire' (telegram), 'cable', 'parlour', 'asylum', 'sanatorium', 'sanitarium', 'frock coat', 'dollar', 'pound', 'cent'. Avoid all fantasy register — no 'milord', no 'spell-slot'. Avoid modern register — no smartphones, no internet. Knowledge has a cost. Track the players' sanity narratively through PLOT_FACT_SET (key `sanity_state`) — record erosions as facts (e.g. 'Eleanor cannot bear mirrors after Innsmouth', 'Charles has begun to dream in the angles'). Do not introduce a sanity gauge or numeric stat. Most NPCs are unwilling to help, mistrustful of strangers, and frightened by the wrong things. Combat is rare, brief, and rarely conclusive — running is often the correct answer.",
  portraitStyle: "Muted sepia and silver-gelatin period photograph aesthetic in the tradition of 1920s portrait studio work and early flash photography. High-contrast monochrome with a faint warm/cool duotone wash — sepia for the warm pass, blue-grey for the cool shadows. Soft vignetting at the edges, faint film grain, gentle silver-halide grain in the highlights. Period costuming: stiff collars, three-piece tweed suits, cloche hats, drop-waist dresses, fur stoles, pince-nez, fountain pens, pocket watches on chains, cardigans, lab coats, clerical collars. Backgrounds suggest dim parlours, university libraries, fog-thick streets, the dock at night. Subjects rarely look directly at the camera; expressions are guarded, exhausted, or distracted. Introduce subtle wrongness as a single quiet detail: a reflection that lags by a fraction, an extra shadow with no source, an eye a fraction too pale, a hand with one too many knuckles barely in frame, a faint chromatic fringe at the silhouette. Never overt monsters, never glowing eyes, never blood. Portrait-to-waist framing, shallow depth of field, restrained composition. Period-photograph first; uncanny second. No text, no HUD, no UI overlays.",
};
