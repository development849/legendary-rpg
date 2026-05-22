// Client-side bridge between the genre registry (which stores icons as
// string names so server code doesn't pull React) and the actual
// lucide-react components used in the UI.
//
// Add new icon names here as new genre packs introduce them.

import {
  Sword, Swords, Dices, Shield, ScrollText, Target, Star, Flame, Music,
  Rocket, Cpu, Moon, Skull, Eye, Zap, Cog, Crosshair,
  Microscope, Bot, Brain,
  Network, Users, Wrench,
  Search, Ghost, Cross, HelpCircle,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Sword, Swords, Dices, Shield, ScrollText, Target, Star, Flame, Music,
  Rocket, Cpu, Moon, Skull, Eye, Zap, Cog, Crosshair,
  Microscope, Bot, Brain,
  Network, Users, Wrench,
  Search, Ghost, Cross,
};

export function resolveGenreIcon(iconName: string | null | undefined): LucideIcon {
  if (!iconName) return HelpCircle;
  return ICON_MAP[iconName] ?? HelpCircle;
}
