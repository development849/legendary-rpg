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

export const WEIRD_WEST = stub({
  id: "weirdwest",
  label: "Weird West",
  tagline: "Six-guns and dark frontier spirits.",
  description: "The American frontier where gunslingers, hexslingers, and undead drifters wander a haunted West.",
  iconName: "Crosshair",
});

export const STUB_GENRES: GenreDefinition[] = [
  WEIRD_WEST,
];
