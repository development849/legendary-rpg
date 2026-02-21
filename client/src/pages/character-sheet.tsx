import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Sword, Heart, Star, Package, Zap, ScrollText, Camera } from "lucide-react";

interface CharacterSheetPageProps {
  characterId: string;
}

const STAT_LABELS: Record<string, string> = {
  might: "Might",
  agility: "Agility",
  endurance: "Endurance",
  intellect: "Intellect",
  will: "Will",
  presence: "Presence",
};

function statMod(val: number): string {
  const mod = Math.floor((val - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export default function CharacterSheetPage({ characterId }: CharacterSheetPageProps) {
  const [, navigate] = useLocation();

  const { data: char, isLoading } = useQuery<any>({
    queryKey: [`/api/characters/${characterId}`],
  });

  if (isLoading || !char) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hpPct = Math.round((char.currentHp / char.maxHp) * 100);
  const stats = (char.stats as Record<string, number>) || {};
  const inventory = (char.inventory as any[]) || [];
  const abilities = (char.abilities as any[]) || [];
  const conditions = (char.conditions as string[]) || [];

  const xpThresholds = [0, 300, 900, 2700, 6500, 14000];
  const currentThreshold = xpThresholds[char.level - 1] ?? 0;
  const nextThreshold = xpThresholds[char.level] ?? 99999;
  const xpPct = Math.min(100, Math.round(((char.xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100));

  const classColors: Record<string, string> = {
    fighter: "text-red-400 bg-red-950/30",
    rogue: "text-emerald-400 bg-emerald-950/30",
    wizard: "text-violet-400 bg-violet-950/30",
    cleric: "text-amber-400 bg-amber-950/30",
    ranger: "text-teal-400 bg-teal-950/30",
    paladin: "text-yellow-300 bg-yellow-950/30",
    barbarian: "text-orange-400 bg-orange-950/30",
    bard: "text-rose-400 bg-rose-950/30",
  };

  const typeColors: Record<string, string> = {
    weapon: "text-red-400",
    armor: "text-blue-400",
    consumable: "text-green-400",
    tool: "text-amber-400",
    quest: "text-violet-400",
    treasure: "text-yellow-400",
    misc: "text-muted-foreground",
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Sword className="w-4 h-4 text-primary" />
          <span className="font-sans font-bold tracking-widest text-sm">CHARACTER SHEET</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Hero Header */}
        <div className={`relative rounded-md border border-border p-6 ${classColors[char.class] ?? ""} overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-br from-current/5 to-transparent" />
          <div className="relative flex items-start gap-4 flex-wrap">
            {/* Portrait */}
            <div className="flex-shrink-0">
              {(char as any).profilePicture ? (
                <div
                  className="w-20 h-20 rounded-md overflow-hidden border border-border/60 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                  onClick={() => navigate(`/characters/${characterId}/appearance`)}
                  data-testid="img-portrait-header"
                  title="Edit portrait"
                >
                  <img
                    src={(char as any).profilePicture}
                    alt={char.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <button
                  onClick={() => navigate(`/characters/${characterId}/appearance`)}
                  data-testid="button-add-portrait"
                  className="w-20 h-20 rounded-md border border-dashed border-border/60 bg-secondary/30 flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-secondary/50 transition-all cursor-pointer text-muted-foreground/50 hover:text-primary/70"
                  title="Add portrait"
                >
                  <Camera className="w-6 h-6" />
                  <span className="text-[10px] font-sans uppercase tracking-wide">Portrait</span>
                </button>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-sans font-bold tracking-widest">{char.name}</h1>
              <p className="text-muted-foreground font-serif mt-1 capitalize">
                {char.race} {char.class} · {char.background}
              </p>
              {char.appearance && (
                <p className="text-muted-foreground/60 font-serif italic text-sm mt-2 max-w-md">{char.appearance}</p>
              )}
              <button
                onClick={() => navigate(`/characters/${characterId}/appearance`)}
                data-testid="button-edit-portrait"
                className="mt-2 text-xs text-primary/60 hover:text-primary font-sans tracking-wide flex items-center gap-1 transition-colors"
              >
                <Camera className="w-3 h-3" />
                {(char as any).profilePicture ? "Edit portrait" : "Generate portrait"}
              </button>
            </div>
            <div className="ml-auto text-right">
              <Badge variant="default" className="text-sm px-3 py-1 font-sans tracking-wider">
                Level {char.level}
              </Badge>
              {conditions.length > 0 && (
                <div className="flex gap-1 mt-2 justify-end flex-wrap">
                  {conditions.map(c => (
                    <Badge key={c} variant="destructive" className="text-xs">{c}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Backstory */}
        {(char as any).backstory && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-sans tracking-widest text-muted-foreground uppercase flex items-center gap-1.5">
                <ScrollText className="w-3.5 h-3.5 text-primary" /> Chronicle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-serif text-sm leading-relaxed text-foreground/85 whitespace-pre-wrap">{(char as any).backstory}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-3 gap-4">
          {/* HP */}
          <Card data-testid="card-hp">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-sans tracking-widest text-muted-foreground uppercase flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-red-400" /> Hit Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-sans font-bold">
                <span className={hpPct <= 25 ? "text-red-400 hp-critical" : hpPct <= 50 ? "text-amber-400" : "text-emerald-400"}>
                  {char.currentHp}
                </span>
                <span className="text-muted-foreground text-xl">/{char.maxHp}</span>
              </div>
              <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    hpPct > 50 ? "bg-emerald-500" : hpPct > 25 ? "bg-amber-500" : "bg-red-500"
                  }`}
                  style={{ width: `${hpPct}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* XP / Level */}
          <Card data-testid="card-xp">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-sans tracking-widest text-muted-foreground uppercase flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400" /> Experience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-sans font-bold">{char.xp.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1 font-serif">
                {char.level < 10 ? `Next: ${nextThreshold.toLocaleString()} XP` : "Max level"}
              </p>
              {char.level < 10 && (
                <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all duration-500"
                    style={{ width: `${xpPct}%` }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Focus */}
          <Card data-testid="card-focus">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-sans tracking-widest text-muted-foreground uppercase flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-violet-400" /> Focus
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const focusItem = inventory.find((i: any) => i.properties?.focus !== undefined);
                const focus = focusItem?.properties?.focus ?? 0;
                return (
                  <>
                    <div className="text-4xl font-sans font-bold text-violet-400">{focus}</div>
                    <p className="text-xs text-muted-foreground mt-1 font-serif">charges remaining</p>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-sans tracking-widest text-muted-foreground uppercase">Ability Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {Object.entries(STAT_LABELS).map(([key, label]) => {
                const val = stats[key] ?? 10;
                return (
                  <div key={key} className="text-center p-3 rounded-md bg-secondary/50 border border-border stat-glow" data-testid={`stat-${key}`}>
                    <p className="text-muted-foreground text-xs font-sans tracking-wide mb-1">{label.slice(0, 3).toUpperCase()}</p>
                    <p className="font-sans font-bold text-xl">{val}</p>
                    <p className="text-primary text-sm font-sans">{statMod(val)}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Abilities */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-sans tracking-widest text-muted-foreground uppercase flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-primary" /> Abilities & Spells
              </CardTitle>
            </CardHeader>
            <CardContent>
              {abilities.length === 0 ? (
                <p className="text-muted-foreground font-serif italic text-sm">No special abilities yet</p>
              ) : (
                <div className="space-y-3">
                  {abilities.map((ability: any) => (
                    <div key={ability.id} className="space-y-0.5" data-testid={`ability-${ability.id}`}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-sans font-semibold text-sm tracking-wide">{ability.name}</span>
                        {ability.usesMax > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {ability.usesLeft}/{ability.usesMax} uses
                          </Badge>
                        )}
                        {ability.usesMax === -1 && (
                          <Badge variant="outline" className="text-xs">At will</Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground text-xs font-serif leading-relaxed">{ability.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-sans tracking-widest text-muted-foreground uppercase flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-primary" /> Inventory
              </CardTitle>
            </CardHeader>
            <CardContent>
              {inventory.length === 0 ? (
                <p className="text-muted-foreground font-serif italic text-sm">No items</p>
              ) : (
                <div className="space-y-2">
                  {inventory.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0" data-testid={`item-${i}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-xs font-sans uppercase tracking-wide ${typeColors[item.type] ?? "text-muted-foreground"}`}>
                          {item.type?.slice(0, 3)}
                        </span>
                        <span className="font-serif text-sm truncate">{item.name}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs ml-2 flex-shrink-0">×{item.qty}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
