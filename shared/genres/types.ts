// ─── Genre System: Shared Types ──────────────────────────────────────────────
// A "genre" is a self-contained content pack for the RPG: it owns the list of
// playable classes, races (or race-equivalents), backgrounds, naming pool,
// flavour text, GM voice and the painterly style prompt used when generating
// portraits / world art for campaigns of that genre.
//
// Each genre is registered in `shared/genres/index.ts`. The first registered
// genre is `fantasy` (the original Legendary content). Future packs (sci-fi,
// cyberpunk, etc.) follow the same shape.
//
// Icons are stored as STRING names (lucide-react identifiers) so this module
// stays importable from server code without pulling React.

export interface ClassDef {
  id: string;
  name: string;
  iconName: string;           // lucide-react component name (resolved client-side)
  color: string;              // tailwind class colour for the icon chip
  description: string;
  stats: string;              // human-readable stat summary for the picker card
  abilities: string;          // human-readable starting-abilities summary
  gear: string;               // human-readable starting-gear summary
  baseHp: number;
  baseMp: number;
  baseStats: Record<string, number>;
  startingInventory: any[];   // items written into character.inventory at creation
  startingAbilities: any[];   // entries written into character.abilities at creation
}

export interface RaceDef {
  name: string;               // canonical display name; also stored on character.race
  description: string;
  traits: string;             // human-readable racial trait summary
  bonuses: Record<string, number>;
}

export interface GenreDefinition {
  id: string;                 // stable key written into campaigns.genre / characters.genre
  label: string;              // display label (e.g. "Fantasy")
  tagline: string;            // one-line pitch for the genre picker
  description: string;        // longer paragraph for the genre picker card
  iconName: string;           // lucide-react icon name for the genre card
  comingSoon: boolean;        // disables the card in the picker when true
  classes: ClassDef[];
  races: RaceDef[];
  raceLabel: string;          // "Race" for fantasy; e.g. "Origin" for sci-fi
  backgrounds: string[];
  personalityTraits: string[];
  motivations: string[];
  flaws: string[];
  names: string[];            // randomiser pool
  gmVoice: string;            // injected into the GM system prompt
  portraitStyle: string;      // STYLE_PROMPT used for portraits / world art
}
