// ─── Genre Registry ──────────────────────────────────────────────────────────
// Single registration point for every genre pack. The order here drives the
// order in the campaign-creation genre picker, with Fantasy as the default.

import type { GenreDefinition, ClassDef, RaceDef } from "./types";
import { FANTASY } from "./fantasy";
import { SCIFI } from "./scifi";
import { CYBERPUNK } from "./cyberpunk";
import { SUPERNATURAL } from "./supernatural";
import { POSTAPOC } from "./postapoc";
import { COSMIC_HORROR } from "./cosmichorror";
import { SUPERHERO } from "./superhero";
import { STEAMPUNK } from "./steampunk";
import { WEIRD_WEST } from "./weirdwest";
import { STUB_GENRES } from "./stubs";

export type { GenreDefinition, ClassDef, RaceDef } from "./types";

export const DEFAULT_GENRE_ID = "fantasy";

const REGISTRY: GenreDefinition[] = [FANTASY, SCIFI, CYBERPUNK, SUPERNATURAL, POSTAPOC, COSMIC_HORROR, SUPERHERO, STEAMPUNK, WEIRD_WEST, ...STUB_GENRES];

const BY_ID: Record<string, GenreDefinition> = Object.fromEntries(
  REGISTRY.map(g => [g.id, g]),
);

/** Every registered genre, in display order (Fantasy first). */
export function getAvailableGenres(): GenreDefinition[] {
  return REGISTRY;
}

/** Look up a genre by id. Falls back to Fantasy for unknown / missing ids so
 *  legacy rows (or stale clients) always render something sensible. */
export function getGenre(id: string | null | undefined): GenreDefinition {
  if (!id) return FANTASY;
  return BY_ID[id] ?? FANTASY;
}

/** True if the genre id is registered AND has a playable content pack. */
export function isGenrePlayable(id: string | null | undefined): boolean {
  const g = id ? BY_ID[id] : undefined;
  return !!g && !g.comingSoon;
}

// ─── Per-genre lookups used by character bootstrap & UI ──────────────────────

export function getClassesForGenre(genreId: string): ClassDef[] {
  return getGenre(genreId).classes;
}

export function getRacesForGenre(genreId: string): RaceDef[] {
  return getGenre(genreId).races;
}

export function getClassDef(genreId: string, classId: string): ClassDef | undefined {
  return getGenre(genreId).classes.find(c => c.id === classId);
}

export function getRaceDef(genreId: string, raceName: string): RaceDef | undefined {
  const target = raceName.toLowerCase();
  return getGenre(genreId).races.find(r => r.name.toLowerCase() === target);
}

export function getDefaultStatsForClass(genreId: string, classId: string): Record<string, number> {
  const c = getClassDef(genreId, classId);
  if (c) return { ...c.baseStats };
  return { might: 10, agility: 10, endurance: 10, intellect: 10, will: 10, presence: 10 };
}

export function getStartingInventoryForClass(genreId: string, classId: string): any[] {
  return getClassDef(genreId, classId)?.startingInventory ?? [];
}

/** Origin/lineage-level starting items, if the genre's RaceDef supplies any.
 *  Appended to the class inventory in createCharacter so origin meaningfully
 *  shapes the loadout (e.g. Superhero Tech gets extra gadgets; Mutate gets
 *  ordinary clothes; Magical gets a focus item). Empty array for races
 *  whose origin doesn't change gear. */
export function getStartingInventoryForRace(genreId: string, raceName: string): any[] {
  return getRaceDef(genreId, raceName)?.startingInventory ?? [];
}

export function getStartingAbilitiesForClass(genreId: string, classId: string): any[] {
  return getClassDef(genreId, classId)?.startingAbilities ?? [];
}

export function getRaceBonusesFor(genreId: string, raceName: string): Record<string, number> {
  return getRaceDef(genreId, raceName)?.bonuses ?? {};
}

export function getClassBaseHp(genreId: string, classId: string): number {
  return getClassDef(genreId, classId)?.baseHp ?? 10;
}

export function getClassBaseMp(genreId: string, classId: string): number {
  return getClassDef(genreId, classId)?.baseMp ?? 0;
}
