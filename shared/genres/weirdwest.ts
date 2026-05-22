// ─── Weird West Genre Pack ───────────────────────────────────────────────────
// Frontier America with supernatural threats. Deadlands, Sundown, Bone
// Tomahawk, The Sisters Brothers — with cursed silver in the saddlebag.
//
// Laconic register. Dust and silence between gunshots. The land is older
// than the people on it, and most of the people on it know it.
//
// Per design constraint: the Shaman class is framed generically — a
// spirit-walker who honours the land — never tied to specific real-world
// tribal traditions. The GM voice reinforces that boundary.

import type { GenreDefinition, ClassDef, RaceDef } from "./types";

const COMMON_INVENTORY = [
  { name: "Bowie Knife", type: "weapon", qty: 1, rarity: "common", equipped: true, properties: { damage: "1d4" } },
  { name: "Canteen", type: "tool", qty: 1, properties: {} },
  { name: "Oilcloth", type: "tool", qty: 1, properties: { note: "Keeps powder and provisions dry through a hard rain." } },
  { name: "Saddlebags", type: "tool", qty: 1, properties: {} },
  { name: "Bedroll", type: "tool", qty: 1, properties: {} },
  { name: "Trail Rations (5 days)", type: "consumable", qty: 1, properties: {} },
  { name: "Tin of Matches", type: "consumable", qty: 1, properties: {} },
  { name: "Horse (Shared Mount)", type: "tool", qty: 1, properties: { note: "A trail-hardened gelding or mare. Belongs to the posse as much as to any one rider." } },
  { name: "Coin Purse ($12 silver)", type: "treasure", qty: 1, properties: { value: 12 } },
];

const BASE_STATS = { might: 10, agility: 10, endurance: 10, intellect: 10, will: 10, presence: 10 };

const CLASSES: ClassDef[] = [
  {
    id: "gunslinger",
    name: "Gunslinger",
    iconName: "Crosshair",
    color: "text-amber-300",
    description: "Fast-draw, dead-eye, and quiet about it. Lives by the shooting and dies by it; everyone in the territory knows the name or will soon.",
    stats: "Agility 14, Endurance 12",
    abilities: "Fast Draw, Dead-Eye, Fan the Hammer",
    gear: "Pair of Revolvers, Sawed-Off, Long Coat",
    baseHp: 10,
    baseMp: 0,
    baseStats: { ...BASE_STATS, agility: 14, endurance: 12 },
    startingInventory: [
      ...COMMON_INVENTORY,
      { name: "Six-Shooter", type: "weapon", qty: 2, rarity: "common", equipped: true, properties: { damage: "1d8", range: 40 } },
      { name: "Sawed-Off Shotgun", type: "weapon", qty: 1, rarity: "common", properties: { damage: "2d6", range: 20 } },
      { name: "Cartridge Belt", type: "consumable", qty: 36, properties: {} },
      { name: "Long Duster Coat", type: "armor", qty: 1, rarity: "common", equipped: true, properties: { ac: 12, slot: "body" } },
    ],
    startingAbilities: [
      { id: "fast_draw", name: "Fast Draw", description: "Always act first in a stand-off or a saloon-drawing situation — auto-win initiative against any opponent.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "dead_eye", name: "Dead-Eye", description: "Take an extra moment to aim — your next ranged attack this turn has advantage and adds +2 damage.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "fan_the_hammer", name: "Fan the Hammer", description: "Empty all six chambers in one motion — three ranged attacks against one or two targets (uses 6 cartridges).", usesMax: 2, usesLeft: 2, recharge: "per-rest" },
    ],
  },
  {
    id: "marshal",
    name: "Marshal",
    iconName: "Star",
    color: "text-yellow-400",
    description: "Law-bringer. Carries a badge, a Bible's worth of warrants, and the bone-deep conviction that one quiet word should be enough. Sometimes it is.",
    stats: "Presence 14, Will 12",
    abilities: "Stand Down, Read the Room, Lawman's Eye",
    gear: "Service Revolver, Carbine, Marshal's Badge",
    baseHp: 10,
    baseMp: 0,
    baseStats: { ...BASE_STATS, presence: 14, will: 12 },
    startingInventory: [
      ...COMMON_INVENTORY,
      { name: "Service Revolver", type: "weapon", qty: 1, rarity: "common", equipped: true, properties: { damage: "1d8", range: 40 } },
      { name: "Lever-Action Carbine", type: "weapon", qty: 1, rarity: "common", equipped: true, properties: { damage: "1d10", range: 120 } },
      { name: "Cartridge Belt", type: "consumable", qty: 24, properties: {} },
      { name: "Long Coat", type: "armor", qty: 1, rarity: "common", equipped: true, properties: { ac: 12, slot: "body" } },
      { name: "Marshal's Badge", type: "misc", qty: 1, properties: { note: "Six-pointed star, US Marshal. Worth what people decide it's worth, town to town." } },
      { name: "Sheaf of Warrants", type: "tool", qty: 1, properties: {} },
      { name: "Pair of Irons (Handcuffs)", type: "tool", qty: 1, properties: {} },
    ],
    startingAbilities: [
      { id: "stand_down", name: "Stand Down", description: "Speak one quiet line — Will save DC 14 or the target lowers the weapon and listens. Works once per scene, on people who still answer to the law.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "read_the_room", name: "Read the Room", description: "Walk into a saloon, parlour, or trail-camp and surface one true fact about the place — who's armed, who's lying, who's about to bolt.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "lawmans_eye", name: "Lawman's Eye", description: "Advantage on the next attack against a declared target. Hold the eye, take the shot.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
    ],
  },
  {
    id: "snake_oil_doc",
    name: "Snake-Oil Doc",
    iconName: "FlaskConical",
    color: "text-emerald-400",
    description: "Travelling charlatan, bottle-shop chemist, occasional miracle-worker. Most of the tonic is cheap rye and laudanum. Some of it isn't. Costs Tonic — the genre's name for MP, brewed and bottled vial by vial.",
    stats: "Intellect 14, Presence 12",
    abilities: "Restorative Tonic, Patter, Snake-Bite Antidote",
    gear: "Wagon-Trunk Apothecary, Hold-Out Pistol, Frock Coat",
    baseHp: 8,
    baseMp: 18,
    baseStats: { ...BASE_STATS, intellect: 14, presence: 12 },
    startingInventory: [
      ...COMMON_INVENTORY,
      { name: "Hold-Out Pistol", type: "weapon", qty: 1, rarity: "common", equipped: true, properties: { damage: "1d6", range: 20 } },
      { name: "Doctor's Bag", type: "tool", qty: 1, properties: { focus: 3, note: "Bottles, droppers, a mortar, and a great many label-blanks." } },
      { name: "Crate of Tonic Bottles", type: "tool", qty: 1, properties: { note: "Bulk stock. Most is harmless. Some isn't." } },
      { name: "Frock Coat", type: "armor", qty: 1, rarity: "common", equipped: true, properties: { ac: 11, slot: "body" } },
      { name: "Showman's Hand-Bills", type: "tool", qty: 1, properties: { note: "Printed broadsheets advertising the wonder-cure." } },
    ],
    startingAbilities: [
      { id: "restorative_tonic", name: "Restorative Tonic", description: "Pour a vial down an ally's throat — heals 1d8 + Intellect modifier HP (costs 1 Tonic).", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "patter", name: "Patter", description: "Sell a lie, a cure, or an alibi. Advantage on the next persuasion or deception attempt as long as you keep talking.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "snake_bite_antidote", name: "Snake-Bite Antidote", description: "Cure one poison, disease, or venomous condition on a willing target (costs 2 Tonic).", usesMax: -1, usesLeft: -1, recharge: "at-will" },
    ],
  },
  {
    id: "shaman",
    name: "Shaman",
    iconName: "Moon",
    color: "text-indigo-300",
    description: "Spirit-walker. Walks the land with the dead and the not-quite-dead, and listens to what they say. Honours the country before the country asks; pays the price the country names. Costs Spirit (the genre's name for MP).",
    stats: "Will 14, Intellect 12",
    abilities: "Spirit-Sight, Mend the Wound, Call the Wind",
    gear: "Carved Staff, Bone-Beaded Pouch, Skinning Knife",
    baseHp: 8,
    baseMp: 18,
    baseStats: { ...BASE_STATS, will: 14, intellect: 12 },
    startingInventory: [
      ...COMMON_INVENTORY,
      { name: "Carved Staff", type: "weapon", qty: 1, rarity: "common", equipped: true, properties: { damage: "1d6", focus: 3 } },
      { name: "Bone-Beaded Pouch", type: "misc", qty: 1, properties: { note: "Sun-bleached bones, river-stones, a feather. Not for sale." } },
      { name: "Skinning Knife", type: "weapon", qty: 1, rarity: "common", properties: { damage: "1d4" } },
      { name: "Hide Cloak", type: "armor", qty: 1, rarity: "common", equipped: true, properties: { ac: 11, slot: "body" } },
      { name: "Pouch of Sage & Herbs", type: "consumable", qty: 3, properties: {} },
    ],
    startingAbilities: [
      { id: "spirit_sight", name: "Spirit-Sight", description: "Perceive the dead, the haunted, and the not-quite-right within 100ft. The land tells you what it carries.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "mend_the_wound", name: "Mend the Wound", description: "Lay hands on an ally — heals 1d8 + Will modifier HP (costs 1 Spirit). The price is small, but the land remembers each call.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "call_the_wind", name: "Call the Wind", description: "Ask the wind for a favour — a dust-cloud, a sudden rain, a single great gust. The GM names the terms (costs 2 Spirit).", usesMax: -1, usesLeft: -1, recharge: "at-will" },
    ],
  },
];

const RACES: RaceDef[] = [
  {
    name: "Settler",
    description: "Homesteader. Carved a parcel out of the country with a plough, a rifle, and a wife or husband as stubborn as the dirt.",
    traits: "+2 Endurance · +1 Will · Hardy (advantage on saves against weather, hunger, and exhaustion)",
    bonuses: { endurance: 2, will: 1 },
    startingInventory: [
      { name: "Homestead Deed", type: "tool", qty: 1, properties: { note: "A patch of land somewhere with your name on the paper — and, increasingly, on a lien." } },
    ],
  },
  {
    name: "Drifter",
    description: "Rootless. Has been in every town from the river to the coast and stayed in none. Carries everything that matters in the saddle.",
    traits: "+2 Agility · +1 Presence · Trail-Wise (advantage on travel, foraging, and finding a way out of a town fast)",
    bonuses: { agility: 2, presence: 1 },
  },
  {
    name: "Frontier-Born",
    description: "Raised on the edge of the map. The first sound was a coyote at the door; the first chore was the rifle.",
    traits: "+2 Endurance · +1 Intellect · Eyes on the Horizon (advantage on perception and tracking in open country)",
    bonuses: { endurance: 2, intellect: 1 },
    startingInventory: [
      { name: "Spyglass", type: "tool", qty: 1, properties: {} },
    ],
  },
  {
    name: "Civilized East",
    description: "Educated outsider. Boston, Philadelphia, sometimes London. Came west for the railroad, the news story, the patent, or the wife. The hands have not yet caught up to the country.",
    traits: "+2 Intellect · +2 Presence · Lettered (literate, polished, and welcome in better company) · -1 Endurance (the trail has not been kind)",
    bonuses: { intellect: 2, presence: 2, endurance: -1 },
    startingInventory: [
      { name: "Pocket Notebook & Pencil", type: "tool", qty: 1, properties: {} },
      { name: "Letter of Credit (Eastern Bank)", type: "tool", qty: 1, properties: { note: "Honoured in the better hotels, less so on the trail." } },
    ],
  },
  {
    name: "Outcast",
    description: "Run out of someplace. The town's name is one you do not say. Knows people in every territory who'll hide you for a night and ask no questions — provided you ask none either.",
    traits: "+2 Agility · +1 Endurance · Hidden Contacts (always know one safe house, fence, or hideout in any town the GM names) · -1 Presence (something in the posture, or the eyes, or the silence)",
    bonuses: { agility: 2, endurance: 1, presence: -1 },
  },
  {
    name: "Spirit-Touched",
    description: "Had a vision and never quite came back. The country opened up and let you see something you weren't meant to see, and now you see it most days. Most people can tell.",
    traits: "+2 Will · +1 Intellect · The Other Sight (perceive ghosts, omens, and unquiet land at a glance, whether you asked for it or not)",
    bonuses: { will: 2, intellect: 1 },
  },
];

export const WEIRD_WEST: GenreDefinition = {
  id: "weirdwest",
  label: "Weird West",
  tagline: "Six-guns and dark frontier spirits.",
  description: "The American frontier where gunslingers, hexslingers, and undead drifters wander a haunted West.",
  iconName: "Crosshair",
  comingSoon: false,
  classes: CLASSES,
  races: RACES,
  raceLabel: "Heritage",
  backgrounds: [
    "Cattle Drover", "Pony Express Rider", "Sheriff's Deputy", "Travelling Preacher",
    "Saloon-Keeper", "Card-Sharp", "Bounty Hunter", "Telegrapher",
    "Mining Prospector", "Wagon-Train Captain", "Newspaper Reporter", "Stagecoach Driver",
  ],
  personalityTraits: [
    "Laconic", "Watchful", "Slow to anger", "Slower to forgive", "Soft-voiced",
    "Quietly devout", "Quietly faithless", "Patient", "Plain-spoken", "Sardonic",
    "Steady", "Restless", "Honourable", "Self-contained", "Tired", "Curious",
  ],
  motivations: [
    "Bury the brother properly, where you can find him again",
    "Hunt down the rider who burned the homestead",
    "Pay off the bank before they take the parcel",
    "Find the spring the old man's map points to",
    "Bring a wanted man back alive, for once",
    "Settle the land the railway has not yet reached",
    "Carry the warning to the next town before the thing does",
    "Earn back a name the family lost",
    "Get rich enough to leave the territory and never come back",
    "Answer the vision that arrived in the desert",
    "Protect a child who has no business in this country",
    "Keep one promise made on a porch ten years ago",
  ],
  flaws: [
    "Wanted in three territories under a name not the current one",
    "Drinks more than the body will hold for much longer",
    "Owes a hard man money and is overdue",
    "Killed a man who did not deserve it",
    "Cannot enter a particular county without being seen",
    "Carries a card-debt in San Francisco",
    "Lost a child to the country and tells no one",
    "Cannot shoot a woman, even when she is shooting back",
    "Believed the wrong preacher",
    "Sold a brother out, once, when it counted",
    "Cannot ride past a graveyard without dismounting",
    "Hears voices in the wind on the bad nights",
  ],
  names: [
    "Abel", "Asa", "Beau", "Caleb", "Cyrus", "Eli", "Ezekiel", "Hank", "Hollis",
    "Ike", "Jed", "Jeb", "Jonas", "Levi", "Mose", "Obadiah", "Quincy", "Reuben",
    "Silas", "Thaddeus", "Wyatt", "Zeke",
    "Abigail", "Cora", "Delilah", "Esther", "Hattie", "Hester", "Isadora", "Josephine",
    "Lily", "Mae", "Maybelle", "Nell", "Pearl", "Prudence", "Ruby", "Sarah",
    "Temperance", "Verity", "Willa", "Winifred",
    // Surnames usable as solo handles for drifters and outcasts
    "Calloway", "Cassidy", "Holloway", "McCready", "Pickett", "Rourke",
    "Shaw", "Tate", "Vance", "Whitcombe",
  ],
  gmVoice: "You are running a Weird West campaign in the tradition of Deadlands, Sundown, Bone Tomahawk, and The Sisters Brothers — frontier America from the 1860s through the 1880s, with supernatural threats that the country has always carried and the settlers have only now begun to notice. Voice is laconic. Short sentences. Slow build. Dust and silence between gunshots. Speak in frontier register — 'territory', 'posse', 'parley', 'palaver', 'saloon', 'parson', 'magistrate', 'spread', 'homestead', 'rider', 'drifter', 'outfit', 'iron' (for a sidearm), 'six-shooter', 'long-coat', 'spurs', 'palomino', 'cantle', 'spread the word'. Avoid modern register entirely — no 'okay', no contractions that read 1950s or later, no urban slang. Combat is fast and final — a single revolver round can end a man, and the GM should not pull the trigger of that punch. Stand-offs end in seconds; the build-up takes the scene. Lean into silence and dust between actions. Supernatural threats are old, patient, and rarely loud — restless dead, cursed silver, things the country buried that did not stay buried. Show them obliquely first, then plainly. Critical respect note: the Shaman class is framed generically — a spirit-walker who honours the land — never tied to specific real-world Indigenous tribal traditions, ceremonies, or sacred objects. Do not invent or borrow names of real nations, spirits, or ceremonies for the Shaman's powers; speak of 'the country', 'the old ways', 'what the land remembers' instead. Indigenous NPCs, when they appear, are people with their own purposes — never noble-savage tropes, never silent guides, never magical helpers without an agenda. Track Tonic (Snake-Oil Doc) and Spirit (Shaman) supply via the existing MP system; do not introduce a new resource.",
  portraitStyle: "Weathered wet-plate collodion photograph, late 1860s through 1880s — the aesthetic of Mathew Brady, Timothy O'Sullivan, and the early frontier studio photographers. Sepia and warm grey palette with deep silver-black shadows; a hint of the plate's natural blue-grey in the highlights. Long exposure stillness — sitters are composed, unsmiling, often slightly out of focus at the edges where they moved during the plate's open shutter. Period dress — duster coats and waistcoats, gun-belts, neckerchiefs, broad-brimmed hats, riding gloves; or calico working-dress, shawl, plain bonnet. The Marshal wears a six-pointed star at the lapel. The Snake-Oil Doc wears a frock-coat and a string-tie. The Shaman wears trail clothes plus a hide cloak — never a stereotyped or borrowed regalia. Subtle uncanny tint when the character carries the otherworldly — a faint cyan-green ghosting at the edges for Spirit-Touched heritage, or for the Shaman when their power is active; otherwise the plate is honest. Background is a plain studio drape, a saloon interior, a desert horizon, or the porch of a frontier homestead. Lighting is north-window soft, single-source from one side, deep shadows opposite. Texture suggests the actual plate — emulsion artefacts at the edges, small spots and scratches, the faint silver-mirror sheen of an aged albumen print. Three-quarter pose, portrait-to-waist framing. No text, no HUD, no UI overlays.",
};
