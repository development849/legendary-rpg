// ─── Coming-Soon Genre Stubs ─────────────────────────────────────────────────
// Placeholder GenreDefinitions for genres whose content packs haven't shipped
// yet. They show up in the campaign-creation genre picker as disabled cards
// so players can see what's coming. Picking one is gated until its pack lands.
//
// Each stub will be replaced by a full pack in its own task (#9-#16). Until
// then they intentionally carry empty class/race lists.

import type { GenreDefinition } from "./types";

function stub(args: {
  id: string;
  label: string;
  tagline: string;
  description: string;
  iconName: string;
}): GenreDefinition {
  return {
    id: args.id,
    label: args.label,
    tagline: args.tagline,
    description: args.description,
    iconName: args.iconName,
    comingSoon: true,
    classes: [],
    races: [],
    raceLabel: "Race",
    backgrounds: [],
    personalityTraits: [],
    motivations: [],
    flaws: [],
    names: [],
    gmVoice: "",
    portraitStyle: "",
  };
}

export const POSTAPOC = stub({
  id: "postapoc",
  label: "Post-Apocalyptic",
  tagline: "After the end — scavenge, build, endure.",
  description: "The world burned and what remains is yours to claim. Wasteland survival amid the ruins of the old world.",
  iconName: "Skull",
});

export const COSMIC_HORROR = stub({
  id: "cosmichorror",
  label: "Cosmic Horror",
  tagline: "Knowledge has a price. Sanity is the coin.",
  description: "Lovecraftian dread. Investigators uncover truths the universe was not meant to share.",
  iconName: "Eye",
});

export const SUPERHERO = stub({
  id: "superhero",
  label: "Superhero",
  tagline: "Cape, mask, mission.",
  description: "Four-colour heroics. Powered protectors square off against villains, conspiracies, and their own demons.",
  iconName: "Zap",
});

export const STEAMPUNK = stub({
  id: "steampunk",
  label: "Steampunk",
  tagline: "Brass, steam, and impossible machines.",
  description: "Victorian-era invention run wild. Airships, automatons, and arcane engineering in a soot-stained world.",
  iconName: "Cog",
});

export const WEIRD_WEST = stub({
  id: "weirdwest",
  label: "Weird West",
  tagline: "Six-guns and dark frontier spirits.",
  description: "The American frontier where gunslingers, hexslingers, and undead drifters wander a haunted West.",
  iconName: "Crosshair",
});

export const STUB_GENRES: GenreDefinition[] = [
  POSTAPOC,
  COSMIC_HORROR, SUPERHERO, STEAMPUNK, WEIRD_WEST,
];
