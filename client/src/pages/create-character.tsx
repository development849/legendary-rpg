import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Sword, Dices, Shield, ScrollText, CheckCircle2, Target, Star, Flame, Music, Sparkles, RotateCcw, Shuffle, Loader2, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";

import { getGenre, isGenrePlayable, DEFAULT_GENRE_ID } from "@shared/genres";
import { resolveGenreIcon } from "@/lib/genre-icons";
import { useMemo } from "react";

const STAT_KEYS = ["might", "agility", "endurance", "intellect", "will", "presence"] as const;
const STAT_LABELS: Record<string, string> = {
  might: "Might", agility: "Agility", endurance: "Endurance",
  intellect: "Intellect", will: "Will", presence: "Presence",
};

const GENDERS = [
  { id: "female", label: "Female" },
  { id: "male", label: "Male" },
  { id: "non-binary", label: "Non-Binary" },
  { id: "agender", label: "Agender" },
  { id: "genderfluid", label: "Genderfluid" },
  { id: "prefer-not-to-say", label: "Prefer Not to Say" },
];

// Background ability preview text shown next to the picker. Mirrors the
// fantasy entries in server/gameEngine.ts getBackgroundAbility. Future genre
// packs that introduce new backgrounds will need their own previews; entries
// missing from this map simply skip the preview block.
const BACKGROUND_ABILITIES: Record<string, { name: string; description: string }> = {
  "Soldier":       { name: "Battle-Hardened",     description: "Advantage on Might saves vs. fear/exhaustion. Once per rest, rally an ally for +1d6 on their next attack." },
  "Scholar":       { name: "Wealth of Knowledge", description: "Identify magical items and recall lore without rolling. +2 to Intellect checks when researching with texts." },
  "Criminal":      { name: "Street Network",      description: "Once per session, locate a contact who can provide information, fenced goods, or a safe house." },
  "Acolyte":       { name: "Deity's Favor",       description: "Once per day, pray for 10 minutes. The GM truthfully answers one yes/no question about your path forward." },
  "Merchant":      { name: "Appraiser's Eye",     description: "Know the exact value of any item at a glance. Advantage on Presence checks to negotiate." },
  "Noble":         { name: "Noble Authority",     description: "Aristocrats treat you as an equal. Once per session, invoke noble status to gain an audience or dismiss minor threats." },
  "Outlander":     { name: "Pathfinder",          description: "Never lost in wilderness. Always find food, water, shelter outdoors. Advantage tracking creatures across natural terrain." },
  "Sailor":        { name: "Salt & Sinew",        description: "Immune to sea sickness. Advantage on Agility checks aboard ships or on treacherous wet terrain." },
  "Folk Hero":     { name: "Champion's Welcome",  description: "Commoners trust you instinctively. Once per session, a willing commoner provides unexpected aid." },
  "Hermit":        { name: "Still Mind",          description: "Advantage on Will saves vs. mind magic. Once per day, meditate 10 min for advantage on your next Will or Intellect check." },
  "Charlatan":     { name: "Thousand Faces",      description: "Advantage on Presence checks to deceive or impersonate. Maintain a false identity for up to one week effortlessly." },
  "Guild Artisan": { name: "Master Crafter",      description: "Craft, identify, or repair any mundane item given materials. Advantage on Intellect checks relating to your craft." },
};


type Step = "class" | "race" | "stats" | "details" | "confirm" | "portrait";

export default function CreateCharacterPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>("class");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedRace, setSelectedRace] = useState<string>("");
  const [selectedGender, setSelectedGender] = useState<string>("");
  const [customStats, setCustomStats] = useState<Record<string, number> | null>(null);
  const [name, setName] = useState("");
  const [background, setBackground] = useState("");
  const [appearance, setAppearance] = useState("");
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [motivation, setMotivation] = useState("");
  const [flaw, setFlaw] = useState("");
  const [backstory, setBackstory] = useState("");
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createdCharId, setCreatedCharId] = useState<string | null>(null);
  const [portraitUrl, setPortraitUrl] = useState<string | null>(null);
  const [generatingPortrait, setGeneratingPortrait] = useState(false);

  const steps: Step[] = ["class", "race", "stats", "details", "confirm", "portrait"];
  const stepIdx = steps.indexOf(step);

  // Genre source preference: ?campaignId= (authoritative — load the
  // campaign's genre) > ?genre= (fast path used when a campaign isn't
  // bound yet) > DEFAULT_GENRE_ID. All class / race / background /
  // flavour data flows from the registry for the resolved genre so
  // adding a new playable genre pack works without touching this file.
  const [genre, setGenreState] = useState<string>(() => {
    try {
      const q = new URLSearchParams(window.location.search).get("genre");
      return q && isGenrePlayable(q) ? q : DEFAULT_GENRE_ID;
    } catch { return DEFAULT_GENRE_ID; }
  });
  useEffect(() => {
    try {
      const campaignId = new URLSearchParams(window.location.search).get("campaignId");
      if (!campaignId) return;
      let cancelled = false;
      (async () => {
        try {
          const res = await fetch(`/api/campaigns/${encodeURIComponent(campaignId)}`);
          if (!res.ok) return;
          const c = await res.json();
          if (cancelled) return;
          const g = (c?.genre as string | undefined) ?? null;
          if (g && isGenrePlayable(g)) setGenreState(g);
        } catch { /* fall back to URL/default genre */ }
      })();
      return () => { cancelled = true; };
    } catch { /* noop */ }
  }, []);
  const genreDef = useMemo(() => getGenre(genre), [genre]);
  const CLASSES = useMemo(() => genreDef.classes.map(c => ({
    id: c.id,
    name: c.name,
    icon: resolveGenreIcon(c.iconName),
    color: c.color,
    hp: c.baseHp,
    description: c.description,
    stats: c.stats,
    abilities: c.abilities,
    gear: c.gear,
  })), [genreDef]);
  const RACES = useMemo(() => genreDef.races.map(r => ({
    name: r.name,
    description: r.description,
    traits: r.traits,
  })), [genreDef]);
  const BACKGROUNDS = useMemo(() => genreDef.backgrounds, [genreDef]);
  const CLASS_BASE_STATS = useMemo<Record<string, Record<string, number>>>(
    () => Object.fromEntries(genreDef.classes.map(c => [c.id, c.baseStats])),
    [genreDef],
  );
  const RACE_BONUSES = useMemo<Record<string, Record<string, number>>>(
    () => Object.fromEntries(genreDef.races.map(r => [r.name, r.bonuses])),
    [genreDef],
  );
  const PERSONALITY_TRAITS = useMemo(() => genreDef.personalityTraits, [genreDef]);
  const MOTIVATIONS = useMemo(() => genreDef.motivations, [genreDef]);
  const FLAWS = useMemo(() => genreDef.flaws, [genreDef]);
  const FANTASY_NAMES = useMemo(() => genreDef.names, [genreDef]);

  // Stat customization helpers
  function getClassDefaults(): Record<string, number> {
    return CLASS_BASE_STATS[selectedClass] ?? { might: 10, agility: 10, endurance: 10, intellect: 10, will: 10, presence: 10 };
  }

  function getCurrentStats(): Record<string, number> {
    return customStats ?? getClassDefaults();
  }

  function getStatEnvelope(): number {
    return Object.values(getClassDefaults()).reduce((a, b) => a + b, 0);
  }

  function getPointsSpent(): number {
    return Object.values(getCurrentStats()).reduce((a, b) => a + b, 0);
  }

  function getPointsRemaining(): number {
    return getStatEnvelope() - getPointsSpent();
  }

  function adjustStat(stat: string, delta: number) {
    const current = getCurrentStats();
    const newVal = (current[stat] ?? 10) + delta;
    if (newVal < 8 || newVal > 16) return;
    const newSpent = getPointsSpent() + delta;
    if (newSpent > getStatEnvelope()) return;
    setCustomStats({ ...current, [stat]: newVal });
  }

  function resetStats() {
    setCustomStats({ ...getClassDefaults() });
  }

  function goToStats() {
    if (!customStats) setCustomStats({ ...getClassDefaults() });
    setStep("stats");
  }

  function toggleTrait(trait: string) {
    setSelectedTraits(prev =>
      prev.includes(trait)
        ? prev.filter(t => t !== trait)
        : prev.length < 3 ? [...prev, trait] : prev
    );
  }

  async function generateBackstory() {
    if (!selectedClass || !selectedRace || !background) {
      toast({ title: "Fill in class, race, and background first", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/characters/generate-backstory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim() || undefined,
          cls: selectedClass,
          race: selectedRace,
          background,
          genre,
          gender: selectedGender || undefined,
          personality: selectedTraits.join(", ") || undefined,
          motivation: motivation.trim() || undefined,
          flaw: flaw.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.status === 401) {
        queryClient.setQueryData(["/api/auth/user"], null);
        toast({ title: "Session expired", description: "Please sign in again to continue.", variant: "destructive" });
        navigate("/auth");
        return;
      }
      if (!res.ok) throw new Error(data.error);
      setBackstory(data.backstory);
    } catch (e: any) {
      if (e.message?.startsWith("401")) {
        queryClient.setQueryData(["/api/auth/user"], null);
        navigate("/auth");
        return;
      }
      toast({ title: "Generation failed", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }

  async function handleCreate() {
    if (!name.trim() || !selectedClass || !selectedRace || !background) {
      toast({ title: "Missing fields", description: "Fill in all required fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          class: selectedClass,
          race: selectedRace,
          background,
          appearance,
          backstory: backstory.trim() || undefined,
          customBaseStats: customStats ?? undefined,
          gender: selectedGender || undefined,
          genre,
        }),
      });
      if (res.status === 401) {
        queryClient.setQueryData(["/api/auth/user"], null);
        toast({ title: "Session expired", description: "Please sign in again to continue.", variant: "destructive" });
        navigate("/auth");
        return;
      }
      if (!res.ok) throw new Error((await res.json()).error);
      const char = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      setCreatedCharId(char.id);
      toast({ title: "Hero created!", description: `${name} stands ready for adventure.`, variant: "success" as any });
      setStep("portrait");
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleGeneratePortrait() {
    if (!createdCharId) return;
    setGeneratingPortrait(true);
    try {
      const res = await fetch(`/api/characters/${createdCharId}/generate-portrait`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ appearanceDetails: appearance }),
      });
      if (!res.ok) throw new Error("Portrait generation failed");
      const data = await res.json();
      setPortraitUrl(data.portrait);
      await fetch(`/api/characters/${createdCharId}/portrait`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ portrait: data.portrait }),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      toast({ title: "Portrait created!", description: "Your hero's likeness has been captured.", variant: "success" as any });
    } catch (e: any) {
      toast({ title: "Portrait failed", description: "You can generate one later from your character card.", variant: "destructive" });
    } finally {
      setGeneratingPortrait(false);
    }
  }

  function randomizeCharacter() {
    const rCls = CLASSES[Math.floor(Math.random() * CLASSES.length)];
    const rRace = RACES[Math.floor(Math.random() * RACES.length)];
    const rGender = GENDERS[Math.floor(Math.random() * (GENDERS.length - 1))];
    const rBg = BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)];
    const traits: string[] = [];
    const shuffled = [...PERSONALITY_TRAITS].sort(() => Math.random() - 0.5);
    traits.push(...shuffled.slice(0, 2 + Math.floor(Math.random() * 2)));
    const rMotivation = MOTIVATIONS[Math.floor(Math.random() * MOTIVATIONS.length)];
    const rFlaw = FLAWS[Math.floor(Math.random() * FLAWS.length)];

    const rName = FANTASY_NAMES[Math.floor(Math.random() * FANTASY_NAMES.length)];

    setSelectedClass(rCls.id);
    setSelectedRace(rRace.name);
    setSelectedGender(rGender.id);
    setCustomStats({ ...CLASS_BASE_STATS[rCls.id] });
    setName(rName);
    setBackground(rBg);
    setSelectedTraits(traits);
    setMotivation(rMotivation);
    setFlaw(rFlaw);
    setAppearance("");
    setBackstory("");
    setStep("confirm");
  }

  const cls = CLASSES.find(c => c.id === selectedClass);
  const raceData = RACES.find(r => r.name === selectedRace);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <span className="font-sans font-bold tracking-widest text-sm">CREATE YOUR HERO</span>
          </div>
          {step === "class" && (
            <Button variant="outline" size="sm" onClick={randomizeCharacter} className="ml-2 text-xs gap-1.5" data-testid="button-random-character">
              <Shuffle className="w-3.5 h-3.5" /> Random Hero
            </Button>
          )}
          <div className="ml-auto flex items-center gap-1">
            {steps.map((s, i) => (
              <div key={s} className={`h-1 w-8 rounded-full transition-colors ${i <= stepIdx ? "bg-primary" : "bg-secondary"}`} />
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-10 pb-24">
        {/* Step: Class */}
        {step === "class" && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-sans font-bold tracking-widest">Choose Your Role</h2>
              <p className="text-muted-foreground font-serif italic">Your role adapts to the world you play in</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {CLASSES.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClass(cls.id)}
                  data-testid={`button-class-${cls.id}`}
                  className={`text-left p-5 rounded-md border transition-all duration-200 hover-elevate ${
                    selectedClass === cls.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-border"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-md bg-secondary flex items-center justify-center ${cls.color} flex-shrink-0`}>
                      <cls.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-sans font-bold tracking-wider">{cls.name}</span>
                        <Badge variant="secondary" className="text-xs">{cls.hp} HP</Badge>
                        {selectedClass === cls.id && <CheckCircle2 className="w-4 h-4 text-primary ml-auto" />}
                      </div>
                      <p className="text-muted-foreground text-sm font-serif mt-1 leading-relaxed">{cls.description}</p>
                      <div className="mt-2 space-y-0.5">
                        <p className="text-xs text-muted-foreground/70"><span className="text-primary/70">Stats:</span> {cls.stats}</p>
                        <p className="text-xs text-muted-foreground/70"><span className="text-primary/70">Abilities:</span> {cls.abilities}</p>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="sticky bottom-0 -mx-4 px-4 py-3 bg-card/95 backdrop-blur-sm border-t border-border flex items-center justify-between gap-3 z-20" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}>
              <p className="text-xs text-muted-foreground font-serif italic min-w-0 flex-1">
                {selectedClass ? `Role: ${CLASSES.find(c => c.id === selectedClass)?.name}` : "Select a role to continue"}
              </p>
              <Button onClick={() => setStep("race")} disabled={!selectedClass} data-testid="button-next-race" className="min-h-11">
                Next: Choose Origin
              </Button>
            </div>
          </div>
        )}

        {/* Step: Race */}
        {step === "race" && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-sans font-bold tracking-widest">Choose Your Origin</h2>
              <p className="text-muted-foreground font-serif italic">Your origin adapts to the world you play in</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {RACES.map((race) => (
                <button
                  key={race.name}
                  onClick={() => setSelectedRace(race.name)}
                  data-testid={`button-race-${race.name.toLowerCase().replace(" ", "-")}`}
                  className={`p-4 rounded-md border text-left transition-all hover-elevate ${
                    selectedRace === race.name
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`font-sans font-bold text-sm tracking-wide ${selectedRace === race.name ? "text-primary" : "text-foreground"}`}>
                      {race.name}
                    </span>
                    {selectedRace === race.name && <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground font-serif leading-relaxed mb-2">{race.description}</p>
                  <p className={`text-xs font-sans tracking-wide ${selectedRace === race.name ? "text-primary/80" : "text-muted-foreground/60"}`}>
                    {race.traits}
                  </p>
                </button>
              ))}
            </div>
            <div className="sticky bottom-0 -mx-4 px-4 py-3 bg-card/95 backdrop-blur-sm border-t border-border flex items-center justify-between gap-3 z-20" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}>
              <Button variant="outline" onClick={() => setStep("class")} data-testid="button-back-class" className="min-h-11">Back</Button>
              {!selectedRace && (
                <p className="text-xs text-muted-foreground font-serif italic hidden sm:block min-w-0 flex-1 text-center">Select an origin to continue</p>
              )}
              <Button onClick={goToStats} disabled={!selectedRace} data-testid="button-next-stats" className="min-h-11" title={!selectedRace ? "Select an origin to continue" : undefined}>Next: Attributes</Button>
            </div>
          </div>
        )}

        {/* Step: Stats */}
        {step === "stats" && selectedClass && selectedRace && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-sans font-bold tracking-widest">Allocate Attributes</h2>
              <p className="text-muted-foreground font-serif italic">Redistribute your class stat points freely — the total must stay within your class envelope</p>
            </div>

            <div className="max-w-lg mx-auto space-y-5">
              {/* Budget bar */}
              <div className="flex items-center justify-between rounded-md border border-border bg-card p-3">
                <div>
                  <p className="text-xs font-sans uppercase tracking-widest text-muted-foreground">Points Remaining</p>
                  <p className="text-xs font-serif italic text-muted-foreground/60 mt-0.5">Min 8 · Max 16 per stat (before racial bonuses)</p>
                </div>
                <span className={`font-sans font-bold text-2xl tabular-nums ${
                  getPointsRemaining() === 0 ? "text-primary" : getPointsRemaining() > 0 ? "text-amber-400" : "text-red-400"
                }`} data-testid="text-points-remaining">
                  {getPointsRemaining()}
                </span>
              </div>

              {/* Stat rows */}
              <div className="space-y-2">
                {STAT_KEYS.map((stat) => {
                  const baseVal = getCurrentStats()[stat] ?? 10;
                  const racialBonus = (RACE_BONUSES[selectedRace] ?? {})[stat] ?? 0;
                  const finalVal = baseVal + racialBonus;
                  const defaults = getClassDefaults();
                  const isHighlighted = defaults[stat] > 10;
                  return (
                    <div key={stat} className={`flex items-center gap-3 rounded-md p-3 border transition-colors ${isHighlighted ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
                      <div className="w-24 flex-shrink-0">
                        <p className={`text-xs font-sans uppercase tracking-wide ${isHighlighted ? "text-primary/80" : "text-muted-foreground"}`}>
                          {STAT_LABELS[stat]}
                        </p>
                        {isHighlighted && <p className="text-[10px] text-primary/50 font-sans mt-0.5">Class primary</p>}
                      </div>
                      <button
                        onClick={() => adjustStat(stat, -1)}
                        disabled={baseVal <= 8}
                        data-testid={`button-stat-minus-${stat}`}
                        className="w-8 h-8 rounded-md border border-border bg-secondary flex items-center justify-center text-sm font-bold text-muted-foreground hover:text-foreground hover:border-primary/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                      >−</button>
                      <div className="flex-1 text-center">
                        <span className="font-sans font-bold text-xl tabular-nums" data-testid={`text-stat-base-${stat}`}>{baseVal}</span>
                        {racialBonus !== 0 && (
                          <span className="text-xs text-primary font-sans ml-1">+{racialBonus}</span>
                        )}
                        <span className="text-muted-foreground text-xs font-sans ml-2">
                          = <span className="font-semibold text-foreground" data-testid={`text-stat-final-${stat}`}>{finalVal}</span>
                        </span>
                        <div className="mt-1.5 h-1 bg-secondary rounded-full overflow-hidden mx-2">
                          <div
                            className={`h-full rounded-full transition-all ${isHighlighted ? "bg-primary" : "bg-secondary-foreground/30"}`}
                            style={{ width: `${Math.min(100, ((baseVal - 8) / 8) * 100)}%` }}
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => adjustStat(stat, +1)}
                        disabled={baseVal >= 16 || getPointsRemaining() <= 0}
                        data-testid={`button-stat-plus-${stat}`}
                        className="w-8 h-8 rounded-md border border-border bg-secondary flex items-center justify-center text-sm font-bold text-muted-foreground hover:text-foreground hover:border-primary/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                      >+</button>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={resetStats}
                  data-testid="button-reset-stats"
                  className="text-xs text-muted-foreground/60 hover:text-muted-foreground font-sans tracking-wide flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" /> Reset to class defaults
                </button>
                {getPointsRemaining() > 0 && (
                  <p className="text-xs text-amber-400/80 font-serif italic">
                    {getPointsRemaining()} point{getPointsRemaining() !== 1 ? "s" : ""} unspent
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-between max-w-lg mx-auto">
              <Button variant="outline" onClick={() => setStep("race")} data-testid="button-back-race-from-stats">Back</Button>
              <Button
                onClick={() => setStep("details")}
                disabled={getPointsRemaining() !== 0}
                data-testid="button-next-details-from-stats"
              >
                {getPointsRemaining() !== 0 ? `Spend ${getPointsRemaining()} more point${getPointsRemaining() !== 1 ? "s" : ""}` : "Next: Story"}
              </Button>
            </div>
          </div>
        )}

        {/* Step: Details */}
        {step === "details" && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-sans font-bold tracking-widest">Shape Your Legend</h2>
              <p className="text-muted-foreground font-serif italic">Name your hero and forge their story</p>
            </div>
            <div className="max-w-2xl mx-auto space-y-6">

              {/* Name & Gender row */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-sans tracking-widest text-muted-foreground uppercase">Hero Name *</label>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 min-w-0 bg-input border border-border rounded-md px-4 py-3 text-foreground font-serif placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                      placeholder="Ser Aldric the Bold"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      maxLength={50}
                      data-testid="input-character-name"
                    />
                    <button
                      type="button"
                      onClick={() => setName(FANTASY_NAMES[Math.floor(Math.random() * FANTASY_NAMES.length)])}
                      title="Roll a random hero name"
                      aria-label="Roll a random hero name"
                      data-testid="button-random-name"
                      className="flex-shrink-0 w-12 h-12 rounded-md border border-border bg-card hover:border-primary/50 hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors flex items-center justify-center"
                    >
                      <Dices className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-sans tracking-widest text-muted-foreground uppercase">Gender</label>
                  <div className="flex flex-wrap gap-2">
                    {GENDERS.map(g => (
                      <button
                        key={g.id}
                        onClick={() => setSelectedGender(selectedGender === g.id ? "" : g.id)}
                        data-testid={`button-gender-${g.id}`}
                        className={`px-3 py-2 rounded-md border text-sm font-serif transition-all hover-elevate ${
                          selectedGender === g.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card text-foreground"
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Appearance */}
              <div className="space-y-1.5">
                <label className="text-xs font-sans tracking-widest text-muted-foreground uppercase">Appearance (optional)</label>
                <input
                  className="w-full bg-input border border-border rounded-md px-4 py-3 text-foreground font-serif placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Tall, silver-streaked hair, storm-grey eyes..."
                  value={appearance}
                  onChange={e => setAppearance(e.target.value)}
                  maxLength={200}
                  data-testid="input-appearance"
                />
              </div>

              {/* Background */}
              <div className="space-y-1.5">
                <label className="text-xs font-sans tracking-widest text-muted-foreground uppercase">Background *</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {BACKGROUNDS.map((bg) => (
                    <button
                      key={bg}
                      onClick={() => setBackground(bg)}
                      data-testid={`button-background-${bg.toLowerCase().replace(" ", "-")}`}
                      className={`py-2 px-3 rounded-md border text-sm font-serif text-center transition-all hover-elevate ${
                        background === bg
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-foreground"
                      }`}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
                {/* Background ability preview */}
                {background && BACKGROUND_ABILITIES[background] && (
                  <div className="mt-2 rounded-md border border-primary/20 bg-primary/5 p-3 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-primary/70 flex-shrink-0" />
                      <p className="text-xs font-sans tracking-widest text-primary/80 uppercase">Background Ability</p>
                    </div>
                    <p className="text-sm font-sans font-semibold text-foreground">{BACKGROUND_ABILITIES[background].name}</p>
                    <p className="text-xs font-serif text-muted-foreground leading-relaxed">{BACKGROUND_ABILITIES[background].description}</p>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="relative flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs font-sans tracking-widest text-muted-foreground uppercase">Backstory</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Personality traits */}
              <div className="space-y-2">
                <label className="text-xs font-sans tracking-widest text-muted-foreground uppercase">
                  Personality Traits <span className="normal-case text-muted-foreground/50">(pick up to 3)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {PERSONALITY_TRAITS.map(trait => (
                    <button
                      key={trait}
                      onClick={() => toggleTrait(trait)}
                      data-testid={`button-trait-${trait.toLowerCase()}`}
                      className={`px-3 py-1.5 rounded-full border text-xs font-sans tracking-wide transition-all ${
                        selectedTraits.includes(trait)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                      }`}
                    >
                      {trait}
                    </button>
                  ))}
                </div>
              </div>

              {/* Motivation */}
              <div className="space-y-2">
                <label className="text-xs font-sans tracking-widest text-muted-foreground uppercase">Core Motivation</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {MOTIVATIONS.map(m => (
                    <button
                      key={m}
                      onClick={() => setMotivation(motivation === m ? "" : m)}
                      data-testid={`button-motivation-${m.toLowerCase().replace(/ /g, "-")}`}
                      className={`px-3 py-1.5 rounded-full border text-xs font-sans tracking-wide transition-all ${
                        motivation === m
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <input
                  className="w-full bg-input border border-border rounded-md px-4 py-2.5 text-sm text-foreground font-serif placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Or describe your own motivation..."
                  value={motivation}
                  onChange={e => setMotivation(e.target.value)}
                  maxLength={120}
                  data-testid="input-motivation"
                />
              </div>

              {/* Flaw */}
              <div className="space-y-2">
                <label className="text-xs font-sans tracking-widest text-muted-foreground uppercase">Flaw or Dark Secret</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {FLAWS.map(f => (
                    <button
                      key={f}
                      onClick={() => setFlaw(flaw === f ? "" : f)}
                      data-testid={`button-flaw-${f.toLowerCase().replace(/ /g, "-")}`}
                      className={`px-3 py-1.5 rounded-full border text-xs font-sans tracking-wide transition-all ${
                        flaw === f
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <input
                  className="w-full bg-input border border-border rounded-md px-4 py-2.5 text-sm text-foreground font-serif placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Or write your own flaw..."
                  value={flaw}
                  onChange={e => setFlaw(e.target.value)}
                  maxLength={120}
                  data-testid="input-flaw"
                />
              </div>

              {/* Backstory textarea + generate */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-sans tracking-widest text-muted-foreground uppercase">Backstory</label>
                  <div className="flex gap-2">
                    {backstory && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setBackstory("")}
                        className="h-7 px-2 text-xs text-muted-foreground"
                        data-testid="button-clear-backstory"
                      >
                        <RotateCcw className="w-3 h-3 mr-1" /> Clear
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={generateBackstory}
                      disabled={generating || !background || !selectedClass || !selectedRace}
                      className="h-7 px-3 text-xs border-primary/40 text-primary hover:bg-primary/10"
                      data-testid="button-generate-backstory"
                    >
                      <Sparkles className="w-3 h-3 mr-1.5" />
                      {generating ? "Weaving tale..." : "Generate with AI"}
                    </Button>
                  </div>
                </div>
                <textarea
                  className="w-full bg-input border border-border rounded-md px-4 py-3 text-sm text-foreground font-serif placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring resize-none leading-relaxed"
                  placeholder="Write your own backstory, or use AI to generate one based on your choices above..."
                  value={backstory}
                  onChange={e => setBackstory(e.target.value)}
                  rows={6}
                  maxLength={2000}
                  data-testid="textarea-backstory"
                />
                <p className="text-xs text-muted-foreground/50 font-sans text-right">{backstory.length}/2000</p>
              </div>
            </div>

            <div className="flex justify-between max-w-2xl mx-auto">
              <Button variant="outline" onClick={() => setStep("stats")} data-testid="button-back-stats">Back</Button>
              <Button
                onClick={() => setStep("confirm")}
                disabled={!name.trim() || !background}
                data-testid="button-next-confirm"
              >
                Review Hero
              </Button>
            </div>
          </div>
        )}

        {/* Step: Confirm */}
        {step === "confirm" && cls && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-sans font-bold tracking-widest">Your Legend Awaits</h2>
              <p className="text-muted-foreground font-serif italic">Review your hero before entering the chronicle</p>
            </div>

            <div className="max-w-lg mx-auto">
              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-md bg-secondary flex items-center justify-center ${cls.color}`}>
                      <cls.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-sans font-bold tracking-wider text-xl">{name}</p>
                      <p className="text-muted-foreground text-sm font-serif font-normal">
                        {selectedGender && selectedGender !== "prefer-not-to-say" ? `${GENDERS.find(g => g.id === selectedGender)?.label} ` : ""}{selectedRace} {cls.name} · {background}
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-secondary/50 rounded-md p-3">
                      <p className="text-muted-foreground text-xs font-sans tracking-wide mb-1">Starting HP</p>
                      <p className="font-sans font-bold text-lg text-foreground">{cls.hp}</p>
                    </div>
                    <div className="bg-secondary/50 rounded-md p-3">
                      <p className="text-muted-foreground text-xs font-sans tracking-wide mb-1">Starting Level</p>
                      <p className="font-sans font-bold text-lg text-foreground">1</p>
                    </div>
                  </div>
                  {/* Final stat grid */}
                  <div>
                    <p className="text-xs font-sans tracking-widest uppercase text-muted-foreground mb-2">Final Attributes</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {STAT_KEYS.map(stat => {
                        const base = getCurrentStats()[stat] ?? 10;
                        const racialBonus = (RACE_BONUSES[selectedRace] ?? {})[stat] ?? 0;
                        const final = base + racialBonus;
                        const mod = Math.floor((final - 10) / 2);
                        return (
                          <div key={stat} className="bg-secondary/40 rounded-md p-2 text-center">
                            <p className="text-[10px] font-sans uppercase tracking-wide text-muted-foreground">{STAT_LABELS[stat]}</p>
                            <p className="font-sans font-bold text-base mt-0.5">{final}</p>
                            <p className="text-[10px] text-muted-foreground/60">{mod >= 0 ? `+${mod}` : mod}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    {raceData && (
                      <div className="flex justify-between py-1.5 border-b border-border/50">
                        <span className="text-muted-foreground font-sans tracking-wide text-xs uppercase">Racial Traits</span>
                        <span className="font-serif text-foreground text-right max-w-xs">{raceData.traits}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-1.5 border-b border-border/50">
                      <span className="text-muted-foreground font-sans tracking-wide text-xs uppercase">Class Abilities</span>
                      <span className="font-serif text-foreground text-right max-w-xs">{cls.abilities}</span>
                    </div>
                    {background && BACKGROUND_ABILITIES[background] && (
                      <div className="flex justify-between py-1.5 border-b border-border/50">
                        <span className="text-muted-foreground font-sans tracking-wide text-xs uppercase">Background Ability</span>
                        <span className="font-serif text-foreground text-right max-w-xs">{BACKGROUND_ABILITIES[background].name}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-1.5">
                      <span className="text-muted-foreground font-sans tracking-wide text-xs uppercase">Starting Gear</span>
                      <span className="font-serif text-foreground text-right max-w-xs">{cls.gear}</span>
                    </div>
                  </div>
                  {(appearance || selectedTraits.length > 0) && (
                    <div className="bg-secondary/30 rounded-md p-3 space-y-2">
                      {appearance && (
                        <>
                          <p className="text-muted-foreground text-xs font-sans tracking-wide uppercase">Appearance</p>
                          <p className="font-serif text-sm italic text-foreground/80">{appearance}</p>
                        </>
                      )}
                      {selectedTraits.length > 0 && (
                        <>
                          <p className="text-muted-foreground text-xs font-sans tracking-wide uppercase mt-2">Personality</p>
                          <p className="font-serif text-sm text-foreground/80">{selectedTraits.join(", ")}</p>
                        </>
                      )}
                      {motivation && (
                        <>
                          <p className="text-muted-foreground text-xs font-sans tracking-wide uppercase mt-2">Motivation</p>
                          <p className="font-serif text-sm text-foreground/80">{motivation}</p>
                        </>
                      )}
                      {flaw && (
                        <>
                          <p className="text-muted-foreground text-xs font-sans tracking-wide uppercase mt-2">Flaw</p>
                          <p className="font-serif text-sm text-foreground/80">{flaw}</p>
                        </>
                      )}
                    </div>
                  )}
                  {backstory && (
                    <div className="bg-secondary/20 rounded-md p-3 border border-border/40">
                      <p className="text-muted-foreground text-xs font-sans tracking-wide uppercase mb-2">Backstory</p>
                      <p className="font-serif text-sm leading-relaxed text-foreground/85 whitespace-pre-wrap">{backstory}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-between max-w-lg mx-auto">
              <Button variant="outline" onClick={() => setStep("details")} data-testid="button-back-details">Back</Button>
              <Button onClick={handleCreate} disabled={loading} data-testid="button-create-hero">
                {loading ? "Forging your legend..." : "Enter the Chronicle"}
              </Button>
            </div>
          </div>
        )}

        {/* Step: Portrait */}
        {step === "portrait" && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-sans font-bold tracking-widest">Your Hero's Portrait</h2>
              <p className="text-muted-foreground font-serif italic">Bring your legend to life with an AI-generated portrait</p>
            </div>

            <div className="max-w-md mx-auto space-y-6">
              {portraitUrl ? (
                <div className="space-y-4">
                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-primary/30 shadow-lg">
                    <img src={portraitUrl} alt={name} className="w-full h-full object-cover" data-testid="img-portrait-preview" />
                  </div>
                  <div className="flex gap-3 justify-center">
                    <Button variant="outline" onClick={() => setStep("confirm")} data-testid="button-back-confirm-from-portrait">
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <Button variant="outline" onClick={handleGeneratePortrait} disabled={generatingPortrait} data-testid="button-regenerate-portrait">
                      {generatingPortrait ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Regenerating...</> : <><RotateCcw className="w-4 h-4 mr-2" /> Regenerate</>}
                    </Button>
                    <Button onClick={() => navigate("/dashboard")} data-testid="button-finish">
                      Enter the Chronicle
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="aspect-[3/4] rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-4 bg-card/50">
                    {generatingPortrait ? (
                      <>
                        <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        <p className="text-muted-foreground font-serif italic text-center px-6">
                          The court painter is capturing your likeness...
                        </p>
                        <p className="text-xs text-muted-foreground/50 font-sans">This usually takes 15–30 seconds</p>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-12 h-12 text-muted-foreground/40" />
                        <p className="text-muted-foreground font-serif italic text-center px-6">
                          Generate an AI portrait of {name} — your GM uses it to visualise your hero
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex gap-3 justify-center">
                    <Button variant="outline" onClick={() => setStep("confirm")} disabled={generatingPortrait} data-testid="button-back-confirm-from-portrait">
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <Button onClick={handleGeneratePortrait} disabled={generatingPortrait || !name || !selectedClass || !selectedRace} data-testid="button-generate-portrait">
                      {generatingPortrait ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate Portrait</>}
                    </Button>
                  </div>
                  {!generatingPortrait && (!name || !selectedClass || !selectedRace) && (
                    <p className="text-xs text-muted-foreground/70 font-serif italic text-center px-4" data-testid="text-portrait-microcopy">
                      Complete your character's name, class, and race before the court painter can begin.
                    </p>
                  )}
                  {!generatingPortrait && name && selectedClass && selectedRace && (
                    <p className="text-xs text-muted-foreground/60 font-serif italic text-center px-4" data-testid="text-portrait-microcopy">
                      Tip — you can always regenerate or skip this and add a portrait later from your character card.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
