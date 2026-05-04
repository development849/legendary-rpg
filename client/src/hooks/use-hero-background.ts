import { useMemo } from "react";

export interface HeroBackground {
  key: string;
  label: string;
  url: string;
}

const HERO_BACKGROUNDS: HeroBackground[] = [
  { key: "high_fantasy",     label: "High Fantasy",       url: "/hero-bgs/high_fantasy.png" },
  { key: "dark_fantasy",     label: "Dark Fantasy",       url: "/hero-bgs/dark_fantasy.png" },
  { key: "sci_fi_derelict",  label: "Sci-Fi Derelict",    url: "/hero-bgs/sci_fi_derelict.png" },
  { key: "cyberpunk",        label: "Cyberpunk",          url: "/hero-bgs/cyberpunk.png" },
  { key: "post_apocalyptic", label: "Post-Apocalyptic",   url: "/hero-bgs/post_apocalyptic.png" },
  { key: "feudal_japan",     label: "Feudal Japan",       url: "/hero-bgs/feudal_japan.png" },
  { key: "pirate_seas",      label: "Pirate Seas",        url: "/hero-bgs/pirate_seas.png" },
  { key: "victorian_noir",   label: "Victorian Noir",     url: "/hero-bgs/victorian_noir.png" },
  { key: "underwater_ruins", label: "Underwater Ruins",   url: "/hero-bgs/underwater_ruins.png" },
  { key: "hellscape",        label: "Hellscape",          url: "/hero-bgs/hellscape.png" },
  { key: "chinese_lore",     label: "Wuxia Mountains",    url: "/hero-bgs/chinese_lore.png" },
  { key: "fairy_glade",      label: "Fairy Glade",        url: "/hero-bgs/fairy_glade.png" },
  { key: "norse_realm",      label: "Norse Fjord",        url: "/hero-bgs/norse_realm.png" },
  { key: "egyptian_tomb",    label: "Egyptian Necropolis", url: "/hero-bgs/egyptian_tomb.png" },
  { key: "mythic_olympus",   label: "Mythic Olympus",     url: "/hero-bgs/mythic_olympus.png" },
  { key: "mesoamerican",     label: "Jungle Pyramid",     url: "/hero-bgs/mesoamerican.png" },
  { key: "arabian_nights",   label: "Arabian Nights",     url: "/hero-bgs/arabian_nights.png" },
  { key: "steampunk",        label: "Steampunk Skycity",  url: "/hero-bgs/steampunk.png" },
  { key: "lovecraftian",     label: "Cosmic Horror",      url: "/hero-bgs/lovecraftian.png" },
  { key: "witch_coven",      label: "Witch Coven",        url: "/hero-bgs/witch_coven.png" },
  { key: "frozen_wastes",    label: "Frozen Wastes",      url: "/hero-bgs/frozen_wastes.png" },
  { key: "solarpunk",        label: "Solarpunk Spires",   url: "/hero-bgs/solarpunk.png" },
];

// Tracks the most recently shown background so consecutive mounts
// (landing → auth → dashboard) never show the same image twice in a row.
const LAST_KEY = "legendary:heroBgLast";

function pickRandomExcluding(excludeKey: string | null): HeroBackground {
  const pool = excludeKey
    ? HERO_BACKGROUNDS.filter(b => b.key !== excludeKey)
    : HERO_BACKGROUNDS;
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}

/**
 * Returns a fresh random cross-genre hero background on every mount.
 *
 * Rotation behavior:
 *  - Each page mount picks a NEW random image from the pool
 *    (so navigating landing → auth → dashboard cycles the visual)
 *  - The most recently shown image is excluded from the pool to
 *    guarantee back-to-back navigations actually change the picture
 *    (random can otherwise pick the same one twice)
 */
export function useHeroBackground(): HeroBackground {
  return useMemo(() => {
    if (typeof window === "undefined") return HERO_BACKGROUNDS[0];
    let last: string | null = null;
    try { last = window.sessionStorage.getItem(LAST_KEY); } catch { /* ignore */ }
    const picked = pickRandomExcluding(last);
    try { window.sessionStorage.setItem(LAST_KEY, picked.key); } catch { /* ignore */ }
    return picked;
  }, []);
}

export const HERO_BACKGROUND_LIST = HERO_BACKGROUNDS;
