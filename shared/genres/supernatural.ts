// ─── Modern Supernatural Genre Pack ──────────────────────────────────────────
// Present-day urban fantasy / modern horror in the tradition of Buffy,
// Supernatural, The Dresden Files, and Constantine. The world looks ordinary
// — until you start looking sideways at it.
//
// Tone: cell phones, salt circles, holy water, gas-station coffee at 3am,
// a haunted Civic with 200k on the clock. No swords-and-sorcery, no
// starships, no chrome.

import type { GenreDefinition, ClassDef, RaceDef } from "./types";

const COMMON_INVENTORY = [
  { name: "Snack Bars (3 meals)", type: "consumable", qty: 1, properties: {} },
  { name: "Maglite Flashlight", type: "tool", qty: 1, properties: {} },
  { name: "Cash ($250)", type: "treasure", qty: 1, properties: { value: 250 } },
  { name: "Smartphone", type: "tool", qty: 1, properties: {} },
];

const BASE_STATS = { might: 10, agility: 10, endurance: 10, intellect: 10, will: 10, presence: 10 };

const CLASSES: ClassDef[] = [
  {
    id: "occult_detective",
    name: "Occult Detective",
    iconName: "Search",
    color: "text-amber-400",
    description: "Investigator with one foot in the academy and the other in the morgue. Reads people, reads scenes, reads grimoires — and knows the right questions to ask priests, librarians, and ex-cops.",
    stats: "Intellect 14, Presence 12",
    abilities: "Cold Read, Occult Lore, Press the Witness",
    gear: "Field Journal, Sidearm, Trenchcoat",
    baseHp: 8,
    baseMp: 0,
    baseStats: { ...BASE_STATS, intellect: 14, presence: 12 },
    startingInventory: [
      ...COMMON_INVENTORY,
      { name: "Field Journal", type: "tool", qty: 1, properties: {} },
      { name: ".38 Revolver", type: "weapon", qty: 1, rarity: "common", equipped: true, properties: { damage: "1d8", range: 40 } },
      { name: "Trenchcoat (Lined)", type: "armor", qty: 1, rarity: "common", equipped: true, properties: { ac: 12, slot: "body" } },
      { name: "Polaroid Camera", type: "tool", qty: 1, properties: {} },
      { name: "Library Card (Borrowed)", type: "misc", qty: 1, properties: {} },
    ],
    startingAbilities: [
      { id: "cold_read", name: "Cold Read", description: "Read a person's clothing, posture, and tells — surface motive, lie, or secret in one round.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "occult_lore", name: "Occult Lore", description: "Recall a useful fact about a supernatural creature, ritual, or cult; the GM tells you one weakness or trait.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "press_the_witness", name: "Press the Witness", description: "Once per scene, force a reluctant NPC to either tell the truth or visibly lie — your call which.", usesMax: 1, usesLeft: 1, recharge: "per-rest" },
    ],
  },
  {
    id: "hunter",
    name: "Hunter",
    iconName: "Crosshair",
    color: "text-red-400",
    description: "Family business, more often than not. Specialist combatant with a trunk full of silver bullets, iron rounds, salt shells, and consecrated steel — and a working knowledge of what each one kills.",
    stats: "Might 14, Agility 12",
    abilities: "Right Round for the Job, Cold Iron, Steady Aim",
    gear: "Shotgun, Iron Knife, Tactical Jacket",
    baseHp: 12,
    baseMp: 0,
    baseStats: { ...BASE_STATS, might: 14, agility: 12 },
    startingInventory: [
      ...COMMON_INVENTORY,
      { name: "Pump Shotgun", type: "weapon", qty: 1, rarity: "common", equipped: true, properties: { damage: "1d10", range: 30, two_handed: true } },
      { name: "Iron Knife", type: "weapon", qty: 1, rarity: "common", properties: { damage: "1d6", bonus: 1 } },
      { name: "Silver Bullets", type: "consumable", qty: 12, properties: {} },
      { name: "Salt Shells", type: "consumable", qty: 8, properties: {} },
      { name: "Tactical Jacket", type: "armor", qty: 1, rarity: "common", equipped: true, properties: { ac: 13, slot: "body" } },
    ],
    startingAbilities: [
      { id: "right_round", name: "Right Round for the Job", description: "Swap ammo (silver / iron / salt / consecrated) as a bonus action — your shot ignores the matching creature's resistances.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "cold_iron", name: "Cold Iron", description: "Your iron blade strikes faeries, ghosts, and demons as if they were flesh.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "steady_aim", name: "Steady Aim", description: "Spend a round bracing — your next shot has advantage and crits on 19-20.", usesMax: -1, usesLeft: -1, recharge: "at-will" },
    ],
  },
  {
    id: "medium",
    name: "Medium",
    iconName: "Ghost",
    color: "text-violet-400",
    description: "Genre's caster slot — speaks with the dead, channels spirits, reads echoes off old houses and older grudges. Power comes at the cost of being heard from the other side, too.",
    stats: "Will 14, Presence 12",
    abilities: "Speak with Spirits, Channel the Dead, Spectral Lash",
    gear: "Talisman, Hold-Out Pistol, Hand-Bound Journal",
    baseHp: 6,
    baseMp: 20,
    baseStats: { ...BASE_STATS, will: 14, presence: 12 },
    startingInventory: [
      ...COMMON_INVENTORY,
      { name: "Talisman", type: "misc", qty: 1, properties: { focus: 3 } },
      { name: "Hold-Out Pistol", type: "weapon", qty: 1, rarity: "common", equipped: true, properties: { damage: "1d6", range: 30 } },
      { name: "Light Jacket", type: "armor", qty: 1, rarity: "common", equipped: true, properties: { ac: 11, slot: "body" } },
      { name: "Hand-Bound Journal", type: "tool", qty: 1, properties: {} },
      { name: "Pouch of Graveyard Earth", type: "consumable", qty: 3, properties: {} },
    ],
    startingAbilities: [
      { id: "speak_with_spirits", name: "Speak with Spirits", description: "Open a brief two-way line to any spirit lingering nearby — useful, dangerous, and rarely conclusive (uses 1 channel).", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "channel_the_dead", name: "Channel the Dead", description: "Borrow a skill, fact, or instinct from a known dead person for one scene (uses 2 channels).", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "spectral_lash", name: "Spectral Lash", description: "Hurl a strand of borrowed wraith-essence at a target — 1d10 psychic damage (uses 1 channel).", usesMax: -1, usesLeft: -1, recharge: "at-will" },
    ],
  },
  {
    id: "exorcist",
    name: "Exorcist",
    iconName: "Cross",
    color: "text-yellow-300",
    description: "Faith-powered support — banishes possessions, blesses allies, soothes hauntings. Whether their faith wears a collar, a kippah, prayer beads, or something older entirely, the result is the same: the unclean cannot stand against them.",
    stats: "Will 14, Endurance 12",
    abilities: "Rite of Banishment, Lay On Hands, Consecrate Ground",
    gear: "Holy Symbol, Holy Water, Iron-Tipped Cane",
    baseHp: 10,
    baseMp: 15,
    baseStats: { ...BASE_STATS, will: 14, endurance: 12 },
    startingInventory: [
      ...COMMON_INVENTORY,
      { name: "Iron-Tipped Cane", type: "weapon", qty: 1, rarity: "common", equipped: true, properties: { damage: "1d6", bonus: 1 } },
      { name: "Heavy Coat", type: "armor", qty: 1, rarity: "common", equipped: true, properties: { ac: 12, slot: "body" } },
      { name: "Holy Symbol", type: "misc", qty: 1, properties: { focus: 3 } },
      { name: "Holy Water Flask", type: "consumable", qty: 3, properties: { damage: "2d6", target: "supernatural" } },
      { name: "Pouch of Salt", type: "consumable", qty: 4, properties: {} },
    ],
    startingAbilities: [
      { id: "rite_of_banishment", name: "Rite of Banishment", description: "Spend an action chanting — a possessed/spectral creature must make a Will save (DC 13) or be expelled and unable to return for 24 hours (uses 2 Focus).", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "exo_lay_on_hands", name: "Lay On Hands", description: "Restore 2d6 HP and remove one minor condition with a touch (uses 1 Focus).", usesMax: -1, usesLeft: -1, recharge: "at-will" },
      { id: "consecrate_ground", name: "Consecrate Ground", description: "Bless a 15ft radius — undead, demons, and possessed creatures take 1d6 radiant damage per round inside (uses 2 Focus, 2 uses per rest).", usesMax: 2, usesLeft: 2, recharge: "per-rest" },
    ],
  },
];

const RACES: RaceDef[] = [
  {
    name: "Mundane",
    description: "Plain old human — until last Tuesday, when something looked back. The Awakened One: ordinary blood, extraordinary circumstances.",
    traits: "+1 to all stats · Bonus Skill Proficiency · Refuses to Believe (resist initial fear effects)",
    bonuses: { might: 1, agility: 1, endurance: 1, intellect: 1, will: 1, presence: 1 },
  },
  {
    name: "Touched",
    description: "A drop of something not-quite-human in the family line — a great-grandmother no one talks about, a christening that went strangely right. Minor uncanny edges that surface in moments of need.",
    traits: "+1 Will · +1 Presence · Sixth Sense (advantage on perception vs. the supernatural)",
    bonuses: { will: 1, presence: 1 },
  },
  {
    name: "Witch-Born",
    description: "Raised in the craft — kitchen magic, herb lore, the kind of family that owns more candles than cutlery. Their inheritance hums in the bones.",
    traits: "+2 Will · +1 Intellect · Inherited Craft (one minor cantrip-equivalent at will)",
    bonuses: { will: 2, intellect: 1 },
  },
  {
    name: "Half-Other",
    description: "One parent wasn't human. The other is gone, or refuses to say. Charismatic, hardy, and rarely as alone in their head as they look.",
    traits: "+2 Presence · +1 Endurance · Other-Sense (always know when the supernatural is near, within 100ft)",
    bonuses: { presence: 2, endurance: 1 },
  },
  {
    name: "Cursed",
    description: "Marked by something — a deal, a hex, a wrong place at a wrong time. The mark grants insight no normal person should have, and costs more than it should.",
    traits: "+2 Intellect · +1 Will · Cursed Sight (always see invisible/hidden supernatural) · -1 Presence (people are uneasy around them)",
    bonuses: { intellect: 2, will: 1, presence: -1 },
  },
  {
    name: "Reincarnated",
    description: "Their soul has done this before — many times, in many bodies. Past lives bleed through in dreams and crises. Body remembers more than the mind admits.",
    traits: "+1 to all stats · Past-Life Recall (once per session, declare a skill they remembered from before) · -1 max HP per level (the body is tired)",
    bonuses: { might: 1, agility: 1, endurance: 1, intellect: 1, will: 1, presence: 1 },
  },
];

export const SUPERNATURAL: GenreDefinition = {
  id: "supernatural",
  label: "Supernatural",
  tagline: "Modern world, hidden monsters.",
  description: "Urban fantasy and modern horror. Hunters, witches, and werewolves in a world that only looks ordinary.",
  iconName: "Moon",
  comingSoon: false,
  classes: CLASSES,
  races: RACES,
  raceLabel: "Heritage",
  backgrounds: [
    "Cop (Retired)", "Bartender", "Priest / Rabbi / Imam", "Journalist",
    "Nurse", "Mortician", "Bookshop Owner", "Trucker",
    "Academic (Folklore)", "PI", "Bounty Hunter", "Recovering Addict",
  ],
  personalityTraits: [
    "Sardonic", "Haunted", "Loyal-to-a-fault", "Burnt-out", "Wisecracking",
    "Steely", "Sentimental", "Paranoid", "Compassionate", "Reckless",
    "Cool under pressure", "Quietly devout", "Bitter", "Hopeful anyway",
    "Watchful", "Disciplined",
  ],
  motivations: [
    "Find the thing that killed someone they loved",
    "Keep the next family from going through this",
    "Pay off a deal they made when they were younger",
    "Prove the academy wrong",
    "Hunt a specific monster across decades",
    "Get out of the life and stay out",
    "Atone for the worst night of their life",
    "Protect the neighbourhood, quietly",
    "Find their missing sibling / parent / child",
    "Document the truth before they die",
    "Reclaim something the supernatural took",
    "Survive long enough to retire",
  ],
  flaws: [
    "Drinks too much, knows it",
    "Owes a demon a single favour",
    "Doesn't believe in their own faith any more",
    "Lost a partner and won't talk about it",
    "Estranged from the family",
    "Can't sleep without the light on",
    "Wanted by an old case",
    "Refuses to kill people, even when they should",
    "Carries something cursed they can't put down",
    "Cracking up, hiding it well",
    "Hooked on painkillers from an old injury",
    "Made a promise to the dead they can't keep",
  ],
  names: [
    "Sam", "Dean", "Buffy", "Willow", "Harry", "Murphy", "John", "Mary",
    "Faith", "Spike", "Bobby", "Cas", "Ellen", "Jo", "Rufus", "Hannah",
    "Rin", "Susan", "Karrin", "Michael", "Anna", "Charlie", "Linda", "Kim",
    "Marcus", "Constance", "Eli", "Rachel", "Tobias", "Nadia", "Vince", "Theo",
    "Iris", "Ruth", "Daniel", "Mira", "Sasha", "Owen", "Lena", "Caleb",
  ],
  gmVoice: "You are running a present-day modern-supernatural campaign in the tradition of Buffy, Supernatural, The Dresden Files, and Constantine. The world is now — cell phones, cheap coffee, motel rooms, snow on the windshield. Supernatural reveals are uncanny and slow-burn, never casual. A wrong shadow, a name said too clearly, a door that should have been locked. Use modern register: cops, neighbours, paramedics, a hatchback, a burner phone, gas-station food. Avoid all fantasy register — no 'milord', no 'tavern', no 'kingdom'. Avoid sci-fi too — no 'parsecs', no 'starship'. Most NPCs are ordinary people who do not believe in any of this, and would be much happier never finding out. Combat is brief, ugly, and personal. Faith works because someone believes; it doesn't work because the GM said so.",
  portraitStyle: "Contemporary photo-realistic portrait photography with subtle uncanny edges. Natural lighting — overcast daylight, sodium-yellow streetlamps, the blue wash of a phone screen. Modern clothing: hoodies, denim jackets, work shirts, plain coats — lived-in, weathered, never costume-y. Believable faces and skin texture — small scars, tired eyes, hands that have done work. The supernatural shows only as a faint wrongness: a too-still expression, a shadow that doesn't quite track, a reflection that lags, a faint chromatic fringe near the iris. Restrained, cinematic colour grading — desaturated greens and warm shadows. Portrait-to-waist framing, shallow depth of field. Photoreal first; eerie second. Never glamorous, never glowing, never fantasy. No text, no HUD, no UI overlays.",
};
