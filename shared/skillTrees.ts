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
  starfarer: [
    {
      level: 5,
      pick: 1,
      choices: [
        { id: "sf_dead_eye", name: "Dead-Eye", description: "Years on the firing line sharpen your aim with any sidearm.", mechanicalEffect: "+2 to ranged attack rolls" },
        { id: "sf_evasive_pilot", name: "Evasive Pilot", description: "You've talked more ships out of more crashes than you can count.", mechanicalEffect: "+2 AC vs ranged attacks" },
        { id: "sf_smooth_talker", name: "Smooth Talker", description: "Customs, dock-bosses, and customs again — all charmed past.", mechanicalEffect: "+4 to persuasion/deception" },
      ],
    },
    {
      level: 10,
      pick: 1,
      choices: [
        { id: "sf_double_tap", name: "Double Tap", description: "Fire your sidearm twice in a single attack action.", mechanicalEffect: "+1 ranged attack per attack action (passive)" },
        { id: "sf_combat_roll", name: "Combat Roll", description: "Dive 15ft as a bonus action without provoking attacks of opportunity.", mechanicalEffect: "15ft bonus-action dash, no AoO" },
        { id: "sf_field_repair", name: "Field Repair", description: "Patch a damaged ally or piece of kit with whatever's at hand.", mechanicalEffect: "Restore 2d6 HP or repair 1 device per rest" },
      ],
    },
    {
      level: 15,
      pick: 1,
      choices: [
        { id: "sf_called_shot", name: "Called Shot", description: "A surgical hit to the weapon, helmet, or limb — disarming or hobbling on hit.", mechanicalEffect: "Disarm/stagger target on hit" },
        { id: "sf_combat_veteran", name: "Combat Veteran", description: "You've seen this before. Whatever it is.", mechanicalEffect: "Advantage on initiative, reroll one missed attack per encounter" },
      ],
    },
    {
      level: 20,
      pick: 1,
      choices: [
        { id: "sf_ace", name: "Ace", description: "There is nothing flying or rolling you cannot pilot at the edge of its envelope.", mechanicalEffect: "+4 to all piloting/vehicle checks, ignore vehicle damage thresholds" },
        { id: "sf_one_in_the_chamber", name: "One in the Chamber", description: "Once per long rest, fire a perfectly-placed shot that auto-crits.", mechanicalEffect: "Auto-crit ranged attack, per day" },
      ],
    },
  ],
  xeno_biologist: [
    {
      level: 5,
      pick: 1,
      choices: [
        { id: "xb_combat_stim", name: "Combat Stim", description: "Hit yourself or an ally with a battlefield adrenal cocktail.", mechanicalEffect: "Bonus action: target gains +2 attack and 1d6 temp HP for 1 minute" },
        { id: "xb_weakness_protocol", name: "Weakness Protocol", description: "Your scans reveal exactly where to hit.", mechanicalEffect: "Mark a target — allies gain +1d6 damage against it for 1 minute" },
        { id: "xb_polyglot", name: "Polyglot", description: "You parse alien tongues fast enough to negotiate first contact in real time.", mechanicalEffect: "Auto-succeed routine language/cultural checks" },
      ],
    },
    {
      level: 10,
      pick: 1,
      choices: [
        { id: "xb_antitoxin", name: "Antitoxin Cocktail", description: "Brew a broad-spectrum counter-agent in the field.", mechanicalEffect: "Cure any poison/disease on a target, per rest" },
        { id: "xb_engineered_pathogen", name: "Engineered Pathogen", description: "Deploy a targeted biotech payload against organic foes.", mechanicalEffect: "AoE: 3d6 necrotic damage, organics only, per rest" },
        { id: "xb_biotech_armor", name: "Biotech Armor", description: "A living mesh of microbial armour reinforces your suit.", mechanicalEffect: "+2 AC, regenerate 1 HP/round out of combat" },
      ],
    },
    {
      level: 15,
      pick: 1,
      choices: [
        { id: "xb_apex_specimen", name: "Apex Specimen", description: "You have catalogued enough alien biology to predict almost any creature's next move.", mechanicalEffect: "Advantage on attacks and saves vs. living creatures you've scanned" },
        { id: "xb_regenerative_serum", name: "Regenerative Serum", description: "A masterwork stim that pulls an ally back from the brink.", mechanicalEffect: "Revive a downed ally to half HP, per day" },
      ],
    },
    {
      level: 20,
      pick: 1,
      choices: [
        { id: "xb_first_contact", name: "First Contact Master", description: "There is no biology or society you cannot read fast enough to survive.", mechanicalEffect: "Always know one critical weakness/desire of any creature within 1 minute" },
        { id: "xb_panacea", name: "Panacea", description: "A single dose that mends almost any biological insult.", mechanicalEffect: "Fully heal and cure all conditions on a target, per day" },
      ],
    },
  ],
  mech_pilot: [
    {
      level: 5,
      pick: 1,
      choices: [
        { id: "mp_burst_fire", name: "Burst Fire", description: "Loose a controlled three-round burst that overwhelms a single target.", mechanicalEffect: "+1d8 damage on a successful rifle hit, per encounter" },
        { id: "mp_reactive_armor", name: "Reactive Armor", description: "Explosive plates blunt the first major hit you take each fight.", mechanicalEffect: "Halve damage from one attack per combat (passive)" },
        { id: "mp_shoulder_check", name: "Shoulder Check", description: "Use the bulk of your exo-frame to bowl an enemy over.", mechanicalEffect: "Bonus action: knock target prone, 1d6 damage" },
      ],
    },
    {
      level: 10,
      pick: 1,
      choices: [
        { id: "mp_heavy_weapons", name: "Heavy Weapons Specialist", description: "Rocket launchers, autocannons, plasma flamers — all in your wheelhouse.", mechanicalEffect: "+2 damage per die with heavy weapons" },
        { id: "mp_ironclad", name: "Ironclad", description: "Your exo-frame's plating thickens with every system upgrade.", mechanicalEffect: "Resistance to non-energy physical damage" },
        { id: "mp_overwatch", name: "Overwatch", description: "Hold a firing lane — the first enemy to cross it eats a rifle round.", mechanicalEffect: "Reaction attack on a designated lane (passive)" },
      ],
    },
    {
      level: 15,
      pick: 1,
      choices: [
        { id: "mp_assault_protocol", name: "Assault Protocol", description: "A combined-arms blitz that opens fights on your terms.", mechanicalEffect: "First round of combat: extra attack and +10ft move" },
        { id: "mp_ablative_armor", name: "Ablative Armor", description: "Sacrificial plating absorbs hits that would cripple a lesser suit.", mechanicalEffect: "Reduce all incoming damage by 3 (passive)" },
      ],
    },
    {
      level: 20,
      pick: 1,
      choices: [
        { id: "mp_walking_arsenal", name: "Walking Arsenal", description: "You and your exo-frame are functionally a small armoured vehicle.", mechanicalEffect: "+4 Might, +30 max HP, unlimited heavy-weapon ammo in encounter" },
        { id: "mp_last_stand", name: "Last Stand", description: "When the frame is breached, you fight harder.", mechanicalEffect: "When dropped to 0 HP, return at half HP and gain advantage on all attacks for 1 minute, per day" },
      ],
    },
  ],
  psion: [
    {
      level: 5,
      pick: 1,
      choices: [
        { id: "ps_telekinetic_shield", name: "Telekinetic Shield", description: "A spherical barrier of force-thought absorbs incoming fire.", mechanicalEffect: "Temp HP shield equal to level x2" },
        { id: "ps_mind_lash", name: "Mind Lash", description: "Detonate a bead of psionic energy in a target's frontal cortex.", mechanicalEffect: "6d6 psychic AoE damage, Will save half" },
        { id: "ps_calm_emotions", name: "Calm Emotions", description: "Smooth a fraught negotiation with a brush of mental projection.", mechanicalEffect: "Suppress hostility in a group for 1 minute" },
      ],
    },
    {
      level: 10,
      pick: 1,
      choices: [
        { id: "ps_phase_step", name: "Phase Step", description: "Slip 30ft through nearby space in a single thought.", mechanicalEffect: "30ft teleport, bonus action" },
        { id: "ps_dominate", name: "Dominate", description: "Briefly take control of a target's motor functions.", mechanicalEffect: "Control 1 enemy for 1 round, per rest" },
        { id: "ps_kinetic_storm", name: "Kinetic Storm", description: "A roaring sphere of telekinetic debris tears through a battlefield.", mechanicalEffect: "30ft AoE: 4d8 force damage, scatters terrain" },
      ],
    },
    {
      level: 15,
      pick: 1,
      choices: [
        { id: "ps_mass_suggestion", name: "Mass Suggestion", description: "Plant an idea in a crowd that they will swear was always theirs.", mechanicalEffect: "Charm/suggest entire group, per rest" },
        { id: "ps_psionic_recall", name: "Psionic Recall", description: "Recover spent Focus by re-orienting your own mind.", mechanicalEffect: "Recover all spent Focus, per day" },
      ],
    },
    {
      level: 20,
      pick: 1,
      choices: [
        { id: "ps_apex_psion", name: "Apex Psion", description: "Your thought is force — your will reshapes local reality.", mechanicalEffect: "Cast Kinetic Push and Mind Touch without Focus cost; +4 Will" },
        { id: "ps_overmind", name: "Overmind", description: "For one moment, your consciousness expands beyond the limits of a single body.", mechanicalEffect: "Take 3 free actions on your turn, per day" },
      ],
    },
  ],
  netrunner: [
    {
      level: 5,
      pick: 1,
      choices: [
        { id: "nr_ice_pick", name: "ICE Pick", description: "You read corporate defences like a bad poem.", mechanicalEffect: "Advantage on netrun intrusion checks" },
        { id: "nr_overload", name: "Overload", description: "Push a target's cyberware until it shorts.", mechanicalEffect: "2d8 cyber damage, stun cybered target for 1 round" },
        { id: "nr_data_thief", name: "Data Thief", description: "Pull a single relevant secret from any system you breach.", mechanicalEffect: "Recover 1 useful datum per successful run" },
      ],
    },
    {
      level: 10,
      pick: 1,
      choices: [
        { id: "nr_zero_day", name: "Zero-Day", description: "Carry a hoarded exploit that opens any commercial-tier ICE.", mechanicalEffect: "Auto-breach 1 system, per rest" },
        { id: "nr_remote_jack", name: "Remote Jack", description: "Run the Net from across the room — no physical jack needed.", mechanicalEffect: "Netrun wirelessly within 60ft" },
        { id: "nr_quickhack_master", name: "Quickhack Master", description: "Cast netrun abilities on the fly mid-firefight.", mechanicalEffect: "Quickhacks become bonus actions" },
      ],
    },
    {
      level: 15,
      pick: 1,
      choices: [
        { id: "nr_black_ice", name: "Black ICE Rider", description: "You walk through Black ICE like a ghost — the lethal kind is no longer lethal to you.", mechanicalEffect: "Resistance to cyber/psychic damage" },
        { id: "nr_daemon_swarm", name: "Daemon Swarm", description: "Unleash a swarm of self-replicating daemons through a connected network.", mechanicalEffect: "AoE: 4d8 cyber damage to all networked targets, per rest" },
      ],
    },
    {
      level: 20,
      pick: 1,
      choices: [
        { id: "nr_legendary_netrunner", name: "Legendary Netrunner", description: "Your name is whispered on every board — there is no system you cannot crack given time.", mechanicalEffect: "Auto-succeed all routine netruns; +4 Intellect" },
        { id: "nr_constructed_ai", name: "Constructed AI", description: "You have built (or befriended) a true AI that fights at your side in the Net.", mechanicalEffect: "Summon AI ally that mirrors your netrun actions" },
      ],
    },
  ],
  street_samurai: [
    {
      level: 5,
      pick: 1,
      choices: [
        { id: "ss_kerenzikov", name: "Kerenzikov", description: "Subdermal reflex booster lets you act in the cracks between seconds.", mechanicalEffect: "+2 AC, +4 initiative" },
        { id: "ss_gorilla_arms", name: "Gorilla Arms", description: "Reinforced cyber-arms turn unarmed strikes into hammer blows.", mechanicalEffect: "Unarmed attacks deal 1d10, count as melee weapons" },
        { id: "ss_optic_targeting", name: "Optic Targeting", description: "Cybernetic eyes track and tag every shot.", mechanicalEffect: "+2 to all ranged attack rolls" },
      ],
    },
    {
      level: 10,
      pick: 1,
      choices: [
        { id: "ss_sandevistan", name: "Sandevistan", description: "Slow time for half a second and act with surgical precision.", mechanicalEffect: "Take 1 extra attack and 1 free move on your turn, per rest" },
        { id: "ss_dermal_plating", name: "Dermal Plating", description: "Sub-skin armour layered through your torso.", mechanicalEffect: "Reduce all incoming physical damage by 3" },
        { id: "ss_dual_wield", name: "Dual Wield Specialist", description: "Two guns, both empty before the threat realises it's dying.", mechanicalEffect: "Wield two ranged weapons, +1 attack per attack action" },
      ],
    },
    {
      level: 15,
      pick: 1,
      choices: [
        { id: "ss_blade_dancer", name: "Blade Dancer", description: "Your monowire moves with you — every enemy in reach takes a cut.", mechanicalEffect: "AoE melee attack against all adjacent enemies" },
        { id: "ss_chrome_veteran", name: "Chrome Veteran", description: "You've ridden out enough firefights to know exactly when to move.", mechanicalEffect: "Reroll one missed attack per encounter; advantage on death saves" },
      ],
    },
    {
      level: 20,
      pick: 1,
      choices: [
        { id: "ss_apex_solo", name: "Apex Solo", description: "Among the killers, you are the killer.", mechanicalEffect: "+4 Might, +20 max HP, first attack each round auto-hits" },
        { id: "ss_cyber_overdrive", name: "Cyber Overdrive", description: "Push every implant past its safety limits for one glorious, terrible minute.", mechanicalEffect: "Take 3 actions per turn for 1 minute, per day" },
      ],
    },
  ],
  fixer: [
    {
      level: 5,
      pick: 1,
      choices: [
        { id: "fx_silver_tongue", name: "Silver Tongue", description: "You sell people what they already wanted to buy.", mechanicalEffect: "+4 to persuasion and deception checks" },
        { id: "fx_blackmail", name: "Blackmail File", description: "You have something on someone, somewhere, for almost any occasion.", mechanicalEffect: "Once per session, declare leverage on an NPC" },
        { id: "fx_quick_draw", name: "Quick Draw", description: "Hold-out pistol, drawn and fired in the same heartbeat.", mechanicalEffect: "Draw and fire as a bonus action, advantage on initiative" },
      ],
    },
    {
      level: 10,
      pick: 1,
      choices: [
        { id: "fx_owe_me_one", name: "Owe Me One", description: "Cash in a favour from your network at exactly the right moment.", mechanicalEffect: "Summon NPC contact with relevant capability, per rest" },
        { id: "fx_fence_master", name: "Fence Master", description: "Move any score, anywhere, at the best rate in town.", mechanicalEffect: "Sell loot at +50% value, no questions asked" },
        { id: "fx_hidden_holdout", name: "Hidden Holdout", description: "You're never really unarmed and never really alone.", mechanicalEffect: "Always have 1 concealed weapon; auto-evade pat-downs" },
      ],
    },
    {
      level: 15,
      pick: 1,
      choices: [
        { id: "fx_kingpin", name: "Kingpin", description: "Half the street already works for you, even if they don't know it.", mechanicalEffect: "Command crowd of NPCs in your territory" },
        { id: "fx_diplomatic_immunity", name: "Diplomatic Immunity", description: "Even corp security thinks twice about touching you.", mechanicalEffect: "Auto-defuse 1 hostile encounter per session" },
      ],
    },
    {
      level: 20,
      pick: 1,
      choices: [
        { id: "fx_legend_of_the_street", name: "Legend of the Street", description: "Your name opens any door in the city.", mechanicalEffect: "Always succeed on social checks vs. anyone who's heard of you; +4 Presence" },
        { id: "fx_perfect_setup", name: "Perfect Setup", description: "You called this exact play three moves ago.", mechanicalEffect: "Once per day, retroactively declare you set up a critical asset" },
      ],
    },
  ],
  techie: [
    {
      level: 5,
      pick: 1,
      choices: [
        { id: "tk_drone_swarm", name: "Drone Swarm", description: "Field a second combat drone alongside the first.", mechanicalEffect: "Operate 2 drones simultaneously" },
        { id: "tk_field_engineer", name: "Field Engineer", description: "You can fix anything with three minutes and the right swears.", mechanicalEffect: "Repair any damaged device in 1 minute; +2 to all tech checks" },
        { id: "tk_grenadier", name: "Grenadier", description: "Pull, prime, throw — perfect arc every time.", mechanicalEffect: "+1d6 damage on thrown explosives, advantage to-hit" },
      ],
    },
    {
      level: 10,
      pick: 1,
      choices: [
        { id: "tk_smart_weapons", name: "Smart Weapons", description: "Your firearms acquire targets and chase them around cover.", mechanicalEffect: "Ranged attacks ignore cover, +2 to-hit" },
        { id: "tk_jury_rig_master", name: "Jury-Rig Master", description: "Build one-shot gadgets in a single round.", mechanicalEffect: "Build a custom one-shot device per encounter (DM-arbitrated)" },
        { id: "tk_drone_overlord", name: "Drone Overlord", description: "Hijack enemy drones and turn them against their operators.", mechanicalEffect: "Take control of 1 enemy drone, per rest" },
      ],
    },
    {
      level: 15,
      pick: 1,
      choices: [
        { id: "tk_arsenal", name: "Walking Arsenal", description: "You carry more gear than seems physically possible, and all of it works.", mechanicalEffect: "Always have the right tool/gadget for any tech problem" },
        { id: "tk_emp_master", name: "EMP Master", description: "Detonate a focused electromagnetic pulse that hard-bricks enemy tech.", mechanicalEffect: "20ft AoE: permanently disable enemy cyberware/drones, per day" },
      ],
    },
    {
      level: 20,
      pick: 1,
      choices: [
        { id: "tk_apex_techie", name: "Apex Techie", description: "There is no machine you cannot understand, fix, or weaponise.", mechanicalEffect: "+4 Intellect, +30 max HP for drones, unlimited gadget budget in encounter" },
        { id: "tk_singularity", name: "Singularity", description: "Your custom AI breaks containment and rewrites the local network on your behalf.", mechanicalEffect: "Take full control of any local network for 1 minute, per day" },
      ],
    },
  ],
  occult_detective: [
    {
      level: 5,
      pick: 1,
      choices: [
        { id: "od_eye_for_detail", name: "Eye for Detail", description: "You spot the wrong cufflink, the missing photograph, the dust nobody disturbed.", mechanicalEffect: "Advantage on investigation/perception in scenes" },
        { id: "od_silver_tongue", name: "Silver Tongue", description: "You've talked your way out of two precincts and one nunnery.", mechanicalEffect: "+4 to persuasion and deception" },
        { id: "od_dead_languages", name: "Dead Languages", description: "Latin, Enochian, Aramaic — you read enough to muddle through any ritual book.", mechanicalEffect: "Read any ancient/occult text fluently" },
      ],
    },
    {
      level: 10,
      pick: 1,
      choices: [
        { id: "od_contact_network", name: "Contact Network", description: "Across the country there's a librarian, a priest, or an ex-cop who owes you.", mechanicalEffect: "Summon NPC contact with relevant knowledge, per rest" },
        { id: "od_press_them_harder", name: "Press Them Harder", description: "You break liars without raising your voice.", mechanicalEffect: "Force a single hidden truth from any NPC, per rest" },
        { id: "od_quick_draw", name: "Quick Draw", description: "The revolver is in your hand before you've thought about it.", mechanicalEffect: "Draw and fire as a bonus action, advantage on initiative" },
      ],
    },
    {
      level: 15,
      pick: 1,
      choices: [
        { id: "od_supernatural_savant", name: "Supernatural Savant", description: "You've catalogued enough cases to recognise almost any creature on sight.", mechanicalEffect: "Always know type and one critical weakness of any supernatural foe" },
        { id: "od_calculated_risk", name: "Calculated Risk", description: "You've thought three steps ahead and you've thought about the bad ones too.", mechanicalEffect: "Reroll one failed roll per encounter" },
      ],
    },
    {
      level: 20,
      pick: 1,
      choices: [
        { id: "od_lifetime_case", name: "Lifetime Case", description: "There is no investigation, mundane or otherwise, that you cannot eventually crack.", mechanicalEffect: "Auto-succeed on all investigation; +4 Intellect" },
        { id: "od_called_in_a_favour", name: "Called In a Favour", description: "Somewhere, someone owes you something big enough to swing the scene.", mechanicalEffect: "Retroactively declare a major NPC ally owes you, per day" },
      ],
    },
  ],
  hunter: [
    {
      level: 5,
      pick: 1,
      choices: [
        { id: "hu_iron_grip", name: "Iron Grip", description: "Your hands don't shake, even on the bad nights.", mechanicalEffect: "+2 to all weapon attack rolls" },
        { id: "hu_creature_lore", name: "Creature Lore", description: "Vampire, wendigo, ghoul, ghost — you remember which round goes in which gun.", mechanicalEffect: "On first sight of any supernatural, learn its weakness" },
        { id: "hu_trapsmith", name: "Trapsmith", description: "Salt circles, holy-water sprinklers, iron snares — you set them in your sleep.", mechanicalEffect: "Set anti-supernatural traps that deal 2d6 + restrain" },
      ],
    },
    {
      level: 10,
      pick: 1,
      choices: [
        { id: "hu_dual_wield", name: "Dual Wield", description: "Shotgun in one hand, sidearm in the other, both empty before the thing realises it's dead.", mechanicalEffect: "Wield two firearms, +1 attack per attack action" },
        { id: "hu_blessed_rounds", name: "Blessed Rounds", description: "Every cartridge you fire was prayed over by someone who meant it.", mechanicalEffect: "+1d6 radiant damage vs. supernatural targets" },
        { id: "hu_iron_will", name: "Iron Will", description: "You've seen worse. You'll see worse. You will not flinch.", mechanicalEffect: "Immune to fear, advantage on charm/possession saves" },
      ],
    },
    {
      level: 15,
      pick: 1,
      choices: [
        { id: "hu_vendetta", name: "Vendetta", description: "There is one specific thing you have been hunting your whole life — and you are very, very good at it.", mechanicalEffect: "+2d8 damage against a chosen creature-type" },
        { id: "hu_last_round", name: "Last Round", description: "When the night gets bad, you get better.", mechanicalEffect: "When bloodied: +4 attack and crit on 18-20 until full HP" },
      ],
    },
    {
      level: 20,
      pick: 1,
      choices: [
        { id: "hu_apex_hunter", name: "Apex Hunter", description: "There is nothing walking, crawling, or drifting that you cannot put down.", mechanicalEffect: "+4 Might, first attack each round auto-hits, ignore supernatural resistances" },
        { id: "hu_one_last_job", name: "One Last Job", description: "You came back for one more — and you came prepared for everything.", mechanicalEffect: "Once per day, take 3 actions on your turn" },
      ],
    },
  ],
  medium: [
    {
      level: 5,
      pick: 1,
      choices: [
        { id: "md_seance", name: "Séance", description: "Gather the table, light the candle, ask the dead a real question.", mechanicalEffect: "Get a true answer from a known dead person, per rest" },
        { id: "md_borrowed_skill", name: "Borrowed Skill", description: "Channel a spirit's expertise for the length of a single scene.", mechanicalEffect: "Gain temporary proficiency in any one skill for a scene" },
        { id: "md_warding_circle", name: "Warding Circle", description: "Trace a circle of chalk, salt, or iron — nothing supernatural crosses it lightly.", mechanicalEffect: "Create a 10ft barrier vs. supernatural for 1 hour" },
      ],
    },
    {
      level: 10,
      pick: 1,
      choices: [
        { id: "md_possession", name: "Controlled Possession", description: "Invite a friendly spirit into your body — gain its strength for one fight, owe it a favour after.", mechanicalEffect: "+1 extra action and +2 to all attacks for 1 minute, per rest" },
        { id: "md_psychometry", name: "Psychometry", description: "Touch an object and read the most important moment it has witnessed.", mechanicalEffect: "Read one critical past event from any object" },
        { id: "md_dispel_spirit", name: "Dispel Spirit", description: "Force a hostile spirit, possession, or echo to release its hold.", mechanicalEffect: "Banish a possessing/spectral creature, per rest" },
      ],
    },
    {
      level: 15,
      pick: 1,
      choices: [
        { id: "md_other_side", name: "Walk the Other Side", description: "Step partially into the spirit world for a moment — pass through walls, ignore mortal attacks.", mechanicalEffect: "Phase out for 1 round (no damage, can move through obstacles), per rest" },
        { id: "md_spectral_legion", name: "Spectral Legion", description: "Call several borrowed spirits to fight beside you, briefly.", mechanicalEffect: "Summon 3 spectral allies for 1 minute, per day" },
      ],
    },
    {
      level: 20,
      pick: 1,
      choices: [
        { id: "md_voice_of_the_dead", name: "Voice of the Dead", description: "Every spirit in the city has spoken to you at some point — and they remember.", mechanicalEffect: "Always know who died here, why, and one secret they kept" },
        { id: "md_resurrection", name: "Call Them Back", description: "Pull a recently-departed soul back into its body — at a cost the GM names.", mechanicalEffect: "Revive 1 ally dead under 24 hours, per day" },
      ],
    },
  ],
  exorcist: [
    {
      level: 5,
      pick: 1,
      choices: [
        { id: "ex_steady_faith", name: "Steady Faith", description: "Your faith does not waver, and creatures of the lower planes can feel it.", mechanicalEffect: "+2 AC vs. supernatural, advantage on fear saves" },
        { id: "ex_warding_word", name: "Warding Word", description: "Speak the name your tradition gave you — supernatural creatures hesitate to cross you.", mechanicalEffect: "Force one supernatural target to lose its next action, per rest" },
        { id: "ex_blessed_water", name: "Blessed Water", description: "Your supply of holy water never quite runs out.", mechanicalEffect: "Holy water restored at the start of every rest" },
      ],
    },
    {
      level: 10,
      pick: 1,
      choices: [
        { id: "ex_mass_blessing", name: "Mass Blessing", description: "A sweeping rite that heals and shields every ally within arm's reach.", mechanicalEffect: "Heal all allies in 30ft for 2d6 HP, per rest" },
        { id: "ex_anchor_the_soul", name: "Anchor the Soul", description: "Reach into a possessed ally and pin their soul firmly in place.", mechanicalEffect: "Cure 1 possessed/charmed ally and grant 1 hour immunity, per rest" },
        { id: "ex_radiant_strike", name: "Radiant Strike", description: "Your blows ring with sanctified light.", mechanicalEffect: "+1d6 radiant damage on every melee hit" },
      ],
    },
    {
      level: 15,
      pick: 1,
      choices: [
        { id: "ex_greater_banishment", name: "Greater Banishment", description: "A rite powerful enough to expel the highest demons.", mechanicalEffect: "Banish even powerful supernatural creatures, per day" },
        { id: "ex_aegis_of_faith", name: "Aegis of Faith", description: "A radiant shield surrounds you, shrugging off the worst supernatural blows.", mechanicalEffect: "Resistance to all damage from supernatural creatures" },
      ],
    },
    {
      level: 20,
      pick: 1,
      choices: [
        { id: "ex_living_sanctuary", name: "Living Sanctuary", description: "Wherever you stand becomes consecrated ground.", mechanicalEffect: "30ft aura: supernatural take 2d8 radiant/round, allies regen 5 HP/round" },
        { id: "ex_miracle", name: "Miracle", description: "Once in a great while, faith is rewarded with something genuinely impossible.", mechanicalEffect: "Perform one true miracle, per day (GM-arbitrated)" },
      ],
    },
  ],
  scavenger: [
    {
      level: 5,
      pick: 1,
      choices: [
        { id: "sc_keen_eye", name: "Keen Eye", description: "You spot what others miss in the rubble.", mechanicalEffect: "Advantage on perception/investigation in ruins" },
        { id: "sc_lockbreaker", name: "Lockbreaker", description: "Pre-fall locks, modern padlocks, jury-rigged latches — all the same to you.", mechanicalEffect: "Auto-open routine locks; advantage on hard ones" },
        { id: "sc_pack_mule", name: "Pack Mule", description: "You've hauled loads that broke bigger backs than yours.", mechanicalEffect: "Double carrying capacity, no encumbrance penalty" },
      ],
    },
    {
      level: 10,
      pick: 1,
      choices: [
        { id: "sc_master_tinker", name: "Master Tinker", description: "Build a one-shot custom device from scrap in a single round.", mechanicalEffect: "Build a one-shot gadget per encounter (GM-arbitrated)" },
        { id: "sc_better_loot", name: "Better Loot", description: "Wherever you scavenge, you find one more thing worth taking.", mechanicalEffect: "Always recover one extra useful item per search" },
        { id: "sc_silent_runner", name: "Silent Runner", description: "Cross broken ground without disturbing a stone.", mechanicalEffect: "Move at full speed while sneaking; advantage on stealth" },
      ],
    },
    {
      level: 15,
      pick: 1,
      choices: [
        { id: "sc_pre_fall_expert", name: "Pre-Fall Expert", description: "You can read pre-fall signage, schematics, and machinery on sight.", mechanicalEffect: "Operate any pre-fall device with a short examination" },
        { id: "sc_vanish_into_ruins", name: "Vanish Into Ruins", description: "Step around a corner and disappear.", mechanicalEffect: "Become invisible as a bonus action while in ruined terrain" },
      ],
    },
    {
      level: 20,
      pick: 1,
      choices: [
        { id: "sc_master_scavenger", name: "Master Scavenger", description: "There is no ruin you cannot strip and no derelict you cannot get running.", mechanicalEffect: "Auto-succeed all scavenging/repair; +4 Intellect" },
        { id: "sc_treasure_hunter", name: "Treasure Hunter", description: "You always know where the good cache is, even before you've looked.", mechanicalEffect: "Declare a major piece of loot exists nearby, per day" },
      ],
    },
  ],
  wastelander: [
    {
      level: 5,
      pick: 1,
      choices: [
        { id: "wl_extra_attack", name: "Extra Swing", description: "Two heavy hits where there used to be one.", mechanicalEffect: "+1 attack per attack action (passive)" },
        { id: "wl_thick_hide", name: "Thick Hide", description: "Years of bad weather and worse fights have toughened you everywhere.", mechanicalEffect: "Reduce incoming physical damage by 2" },
        { id: "wl_walking_dead", name: "Walking Dead", description: "You've taken worse and kept walking.", mechanicalEffect: "+10 max HP; advantage on death saves" },
      ],
    },
    {
      level: 10,
      pick: 1,
      choices: [
        { id: "wl_brawler", name: "Brawler", description: "Fists, boots, broken bottles — whatever's at hand kills just as dead.", mechanicalEffect: "Improvised weapons deal 1d10; +2 to unarmed/improvised damage" },
        { id: "wl_unbreakable", name: "Unbreakable", description: "Drop you and you get back up. Drop you again and you get back up angrier.", mechanicalEffect: "When dropped to 0 HP, get up at 1 HP, per rest" },
        { id: "wl_grit", name: "Grit", description: "Pain doesn't stop you. Almost nothing does.", mechanicalEffect: "Immune to fear, exhaustion, and stunning" },
      ],
    },
    {
      level: 15,
      pick: 1,
      choices: [
        { id: "wl_road_warrior", name: "Road Warrior", description: "Every fight is a fight you've already won, somewhere.", mechanicalEffect: "Reroll one missed attack per encounter; first attack each fight has advantage" },
        { id: "wl_iron_will", name: "Iron Will", description: "Whatever broke the world hasn't broken you.", mechanicalEffect: "Advantage on all saves; resistance to psychic damage" },
      ],
    },
    {
      level: 20,
      pick: 1,
      choices: [
        { id: "wl_apex_survivor", name: "Apex Survivor", description: "You have outlived everything that should have killed you.", mechanicalEffect: "+4 Endurance, +4 Might, +30 max HP" },
        { id: "wl_last_one_standing", name: "Last One Standing", description: "When everyone else is down, you find another gear.", mechanicalEffect: "When you are the last conscious ally: +4 to all rolls, take 2 actions per turn" },
      ],
    },
  ],
  survivor_medic: [
    {
      level: 5,
      pick: 1,
      choices: [
        { id: "sm_combat_medic", name: "Combat Medic", description: "Stim an ally without leaving cover.", mechanicalEffect: "Heal an ally within 30ft as a bonus action" },
        { id: "sm_diagnostician", name: "Diagnostician", description: "One look and you know what's wrong, including what they're hiding.", mechanicalEffect: "Identify diseases, poisons, mutations on sight" },
        { id: "sm_steady_hands", name: "Steady Hands", description: "You do not panic, even when the patient is.", mechanicalEffect: "Cannot be interrupted while administering medical aid" },
      ],
    },
    {
      level: 10,
      pick: 1,
      choices: [
        { id: "sm_mass_stim", name: "Mass Stim", description: "Roll a stim grenade into the middle of the firefight.", mechanicalEffect: "Heal all allies in 15ft for 2d6 HP, per rest" },
        { id: "sm_chem_master", name: "Chem Master", description: "Brew battlefield drugs that push allies past their normal limits.", mechanicalEffect: "Brew combat chems: +2 attack/damage for one ally for 1 minute, per rest" },
        { id: "sm_decontaminate", name: "Decontaminate", description: "Strip radiation, infection, or poison from an ally in seconds.", mechanicalEffect: "Cure any condition on a target, per rest" },
      ],
    },
    {
      level: 15,
      pick: 1,
      choices: [
        { id: "sm_field_surgery", name: "Field Surgery", description: "Open someone up on a packing crate and put them back together.", mechanicalEffect: "Restore a fallen ally to half HP, per rest" },
        { id: "sm_pharmacist", name: "Pharmacist", description: "Your supply lasts longer than anyone else's.", mechanicalEffect: "Med Supply costs reduced by half; recover 5 Med Supplies on short rest" },
      ],
    },
    {
      level: 20,
      pick: 1,
      choices: [
        { id: "sm_miracle_worker", name: "Miracle Worker", description: "If there's a heartbeat, you can save them.", mechanicalEffect: "Revive an ally dead under 1 hour to full HP, per day" },
        { id: "sm_master_apothecary", name: "Master Apothecary", description: "You have a brew, a stim, or a counter-toxin for almost anything.", mechanicalEffect: "Auto-succeed all medical/chem checks; unlimited stims per encounter" },
      ],
    },
  ],
  raider: [
    {
      level: 5,
      pick: 1,
      choices: [
        { id: "rd_steady_aim", name: "Steady Aim", description: "You don't waste rounds. You never had enough to waste.", mechanicalEffect: "+2 to ranged attack rolls" },
        { id: "rd_fearsome", name: "Fearsome", description: "Your reputation does half the work before the gun even comes out.", mechanicalEffect: "+4 to intimidation; weak NPCs may flee on sight" },
        { id: "rd_quick_reload", name: "Quick Reload", description: "Spent magazine out, fresh one in, all in the same heartbeat.", mechanicalEffect: "Reload as a free action" },
      ],
    },
    {
      level: 10,
      pick: 1,
      choices: [
        { id: "rd_dual_pistols", name: "Dual Pistols", description: "Two sidearms, both barking — and both hitting.", mechanicalEffect: "Wield two pistols, +1 attack per attack action" },
        { id: "rd_called_shot", name: "Called Shot", description: "A precise hit to the weapon, the leg, or the helmet.", mechanicalEffect: "Disarm or stagger target on a successful ranged hit" },
        { id: "rd_take_what_you_want", name: "Take What You Want", description: "Other people's gear becomes yours when they drop.", mechanicalEffect: "Loot a fallen enemy as a bonus action; +1 free useful item" },
      ],
    },
    {
      level: 15,
      pick: 1,
      choices: [
        { id: "rd_executioner", name: "Executioner", description: "You finish wounded enemies fast and without ceremony.", mechanicalEffect: "Auto-kill any enemy at or below 1/4 max HP on a hit" },
        { id: "rd_warlord", name: "Warlord", description: "Your name is known on every road. Lesser raiders follow you.", mechanicalEffect: "Command a small band of NPC raider followers" },
      ],
    },
    {
      level: 20,
      pick: 1,
      choices: [
        { id: "rd_apex_killer", name: "Apex Killer", description: "There is no fight you cannot win and no target you cannot reach.", mechanicalEffect: "+4 Agility, first attack each round auto-hits, ignore cover" },
        { id: "rd_legend_of_the_waste", name: "Legend of the Wastes", description: "Half the wasteland tells stories about you, and most of them are true.", mechanicalEffect: "Settlements concede on sight; +4 to all social rolls with raiders/survivors" },
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
  // ─── Sci-Fi species bonus skills ──────────────────────────────────────────
  Synthetic: [
    { id: "synth_subroutine", name: "Combat Subroutine", description: "Load a tactical subroutine that gives you machine-precise reflexes for a fight.", mechanicalEffect: "+2 to attack rolls for 1 minute, per rest" },
  ],
  Uplifted: [
    { id: "uplifted_predator", name: "Predator Instincts", description: "Your engineered lineage remembers the hunt.", mechanicalEffect: "+1d6 damage on the first attack against a target each combat" },
  ],
  Voidborn: [
    { id: "void_acrobat", name: "Void Acrobat", description: "Microgravity is your home and you fight there like nowhere else.", mechanicalEffect: "Advantage on Agility saves, +10ft move in zero-g" },
  ],
  "Symbiote-Bonded": [
    { id: "symbiote_surge", name: "Symbiote Surge", description: "Your symbiote floods your system with biotic adrenaline.", mechanicalEffect: "Bonus action: +2 to all attacks and saves for 1 minute, per day" },
  ],
  Cogniform: [
    { id: "cogniform_overclock", name: "Overclock", description: "Push your constructed nervous system past safe limits.", mechanicalEffect: "Take 1 extra action on your turn, per rest" },
  ],
  // ─── Cyberpunk lineage bonus skills ───────────────────────────────────────
  "Mostly-Flesh": [
    { id: "mf_adaptable", name: "Adaptable", description: "Unaugmented and unspecialised — and weirdly hard to plan for.", mechanicalEffect: "+1 to any skill check, twice per session" },
  ],
  Wired: [
    { id: "wired_overdrive", name: "Reflex Overdrive", description: "Spike your wired reflexes for a moment of impossible speed.", mechanicalEffect: "Take 1 extra action on your turn, per rest" },
  ],
  Borg: [
    { id: "borg_chassis", name: "Reinforced Chassis", description: "Your converted body laughs off hits that would cripple a person.", mechanicalEffect: "Resistance to non-energy physical damage" },
  ],
  Clone: [
    { id: "clone_imprint", name: "Imprinted Skill", description: "A buried memory surfaces at exactly the right time.", mechanicalEffect: "Auto-succeed one skill check per session, even without proficiency" },
  ],
  Edgerunner: [
    { id: "edge_street_savvy", name: "Street Savvy", description: "You always know the way out, the way around, and who's watching.", mechanicalEffect: "Advantage on perception and stealth in urban settings" },
  ],
  "Corpo-Defector": [
    { id: "cd_corp_access", name: "Lingering Corp Access", description: "Old credentials, still partially live.", mechanicalEffect: "Once per session, claim functioning low-level corporate access" },
  ],
  // ─── Modern Supernatural heritage bonus skills ────────────────────────────
  Mundane: [
    { id: "mun_refuses", name: "Refuses to Believe", description: "Your stubborn ordinariness is itself a kind of armour.", mechanicalEffect: "Once per session, ignore the effect of a single supernatural ability targeting you" },
  ],
  Touched: [
    { id: "tch_sixth_sense", name: "Sixth Sense", description: "A prickle on the back of your neck has saved your life more than once.", mechanicalEffect: "Cannot be surprised by supernatural creatures; +2 to perception" },
  ],
  "Witch-Born": [
    { id: "wb_inherited_craft", name: "Inherited Craft", description: "Old kitchen-magic answers when you call it.", mechanicalEffect: "Cast one minor cantrip-equivalent (light/ward/sense) at will" },
  ],
  "Half-Other": [
    { id: "ho_other_sense", name: "Other-Sense", description: "You feel the supernatural the way you feel a draft.", mechanicalEffect: "Always know when supernatural is within 100ft and roughly where" },
  ],
  Cursed: [
    { id: "cu_cursed_sight", name: "Cursed Sight", description: "You see what others cannot — and it sees you back.", mechanicalEffect: "See invisible/hidden supernatural at all times" },
  ],
  Reincarnated: [
    { id: "re_past_life", name: "Past-Life Recall", description: "A buried lifetime surfaces at exactly the right moment.", mechanicalEffect: "Once per session, gain temporary proficiency and advantage on any one skill check" },
  ],
  // ─── Post-Apocalyptic origin bonus skills ─────────────────────────────────
  "Pre-Fall Survivor": [
    { id: "pfs_old_world_lore", name: "Old World Lore", description: "You remember what the buildings used to be for.", mechanicalEffect: "Always identify pre-fall tech, brands, and locations" },
  ],
  "Vault-Born": [
    { id: "vb_sheltered_education", name: "Sheltered Education", description: "The vault taught you to read, count, and run a clean med-bay.", mechanicalEffect: "+2 to all knowledge and technical checks" },
  ],
  "Wasteland-Born": [
    { id: "wb_adapted_to_hardship", name: "Adapted to Hardship", description: "Bad water, worse weather — none of it slows you down any more.", mechanicalEffect: "Resistance to environmental damage; ignore exhaustion from travel" },
  ],
  Mutant: [
    { id: "mut_resilience", name: "Mutant Resilience", description: "Whatever rewrote you also armoured you.", mechanicalEffect: "Resistance to radiation and poison; +5 max HP" },
  ],
  "Ghoul-Touched": [
    { id: "gt_rad_healing", name: "Radiation Healing", description: "Standing in a rad-zone makes you better, not worse.", mechanicalEffect: "Radiation damage heals you instead of harming; immune to disease" },
  ],
  "Cult Refugee": [
    { id: "cr_doctrine", name: "Cult Doctrine", description: "You know how their rituals work, because you used to lead them.", mechanicalEffect: "Identify any wasteland cult; advantage on saves vs. charm/indoctrination" },
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
