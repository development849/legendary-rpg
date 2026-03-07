import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Scroll, Sparkles, Shield, Swords, Palette, ImageOff, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Character } from "@shared/schema";

const GM_MODES = [
  { id: "fast", label: "Fast", desc: "Brisk pacing. Quick scenes. Action-forward." },
  { id: "balanced", label: "Balanced", desc: "Mix of narrative depth and steady action." },
  { id: "cinematic", label: "Cinematic", desc: "Rich detail. Deep narrative. Immersive." },
];

const CONTENT_RATINGS = [
  { id: "pg13", label: "PG-13", desc: "Fantasy violence, mild peril. No explicit content.", icon: "🛡️" },
  { id: "r", label: "Mature (R)", desc: "Blood, darker themes, strong language, intense violence.", icon: "⚔️" },
  { id: "adult", label: "Adult (18+)", desc: "Unrestricted. Graphic violence, explicit content, dark themes.", icon: "🔞" },
];

const THEME_OPTIONS = [
  { id: "mystery",    label: "Mystery",         desc: "Secrets, clues, and hidden truths to uncover",           icon: "🔍" },
  { id: "horror",     label: "Horror & Dread",  desc: "Dark atmosphere, tension, and unsettling encounters",     icon: "💀" },
  { id: "romance",    label: "Romance",          desc: "Romantic tension and alliances forged through attraction", icon: "🌹" },
  { id: "comedy",     label: "Comedy & Wit",     desc: "Humor, banter, and moments of levity",                   icon: "🎭" },
  { id: "political",  label: "Political Intrigue", desc: "Power struggles, court schemes, and factional conflict", icon: "👑" },
  { id: "survival",   label: "Survival",         desc: "Scarce resources, harsh wilds, and desperate choices",   icon: "🔥" },
  { id: "tragedy",    label: "Tragedy",          desc: "Loss, sacrifice, and the weight of fate",                icon: "⚔️" },
  { id: "heist",      label: "Heist & Deception", desc: "Elaborate schemes, disguises, and cunning plans",       icon: "🗝️" },
  { id: "exploration", label: "Exploration",     desc: "Uncharted lands, ancient ruins, and wonder",             icon: "🗺️" },
  { id: "war",        label: "War & Siege",      desc: "Battlefield tactics, armies, and the cost of conflict",  icon: "🏹" },
];

export default function CreateCampaignPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [setting, setSetting] = useState("");
  const [gmMode, setGmMode] = useState("balanced");
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [contentRating, setContentRating] = useState("pg13");
  const [noRomance, setNoRomance] = useState(false);
  const [noHorror, setNoHorror] = useState(false);
  const [fadeToBlack, setFadeToBlack] = useState(true);
  const [selectedCharId, setSelectedCharId] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: characters = [] } = useQuery<Character[]>({ queryKey: ["/api/characters"] });

  const selectedChar = characters.find(c => c.id === selectedCharId);
  const selectedHasPortrait = !!(selectedChar?.profilePicture);

  function toggleTheme(id: string) {
    setSelectedThemes(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  }

  async function handleCreate() {
    if (!name.trim()) {
      toast({ title: "Name required", description: "Give your campaign a name", variant: "destructive" });
      return;
    }
    if (!selectedCharId) {
      toast({ title: "Select a character", description: "Choose a hero to lead this campaign", variant: "destructive" });
      return;
    }
    if (!selectedHasPortrait) {
      toast({
        title: "Hero needs a portrait",
        description: `${selectedChar?.name} has no portrait yet. Visit the Portrait Studio to generate one — your GM uses it to visualize your hero.`,
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description, setting, themes: selectedThemes, gmMode, contentRating, noRomance, noHorror, fadeToBlack }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { campaign, party } = await res.json();

      await fetch(`/api/parties/${party.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId: selectedCharId }),
      });

      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/parties"] });
      navigate(`/lobby/${party.id}`);
    } catch (e: any) {
      toast({ title: "Failed to create campaign", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Scroll className="w-4 h-4 text-primary" />
          <span className="font-sans font-bold tracking-widest text-sm">NEW CAMPAIGN</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-sans font-bold tracking-widest">Begin a New Chronicle</h1>
          <p className="text-muted-foreground font-serif italic">Shape the world your heroes will inhabit</p>
        </div>

        <div className="space-y-6">
          {/* Campaign Name */}
          <div className="space-y-2">
            <label className="text-xs font-sans tracking-widest text-muted-foreground uppercase">Campaign Name *</label>
            <input
              className="w-full bg-input border border-border rounded-md px-4 py-3 text-foreground font-serif text-lg placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="The Shattered Crown"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={80}
              data-testid="input-campaign-name"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-xs font-sans tracking-widest text-muted-foreground uppercase">Campaign Hook (optional)</label>
            <textarea
              className="w-full bg-input border border-border rounded-md px-4 py-3 text-foreground font-serif placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              placeholder="Ancient evil stirs beneath the kingdom. The king is dead, the crown shattered, and only your party stands between chaos and civilization..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
              data-testid="textarea-description"
            />
          </div>

          {/* World Setting */}
          <div className="space-y-2">
            <label className="text-xs font-sans tracking-widest text-muted-foreground uppercase">World Setting (optional)</label>
            <input
              className="w-full bg-input border border-border rounded-md px-4 py-3 text-foreground font-serif placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="A crumbling empire on the edge of the known world. Magic is feared. The old gods are silent."
              value={setting}
              onChange={e => setSetting(e.target.value)}
              maxLength={200}
              data-testid="input-setting"
            />
          </div>

          {/* GM Mode */}
          <div className="space-y-3">
            <label className="text-xs font-sans tracking-widest text-muted-foreground uppercase flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> GM Pacing Mode
            </label>
            <div className="grid grid-cols-3 gap-3">
              {GM_MODES.map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setGmMode(mode.id)}
                  data-testid={`button-gm-mode-${mode.id}`}
                  className={`p-4 rounded-md border text-left transition-all hover-elevate ${
                    gmMode === mode.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card"
                  }`}
                >
                  <p className="font-sans font-semibold tracking-wide text-sm">{mode.label}</p>
                  <p className="text-muted-foreground text-xs font-serif mt-1">{mode.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Genre Themes */}
          <div className="space-y-3">
            <label className="text-xs font-sans tracking-widest text-muted-foreground uppercase flex items-center gap-2">
              <Palette className="w-3.5 h-3.5 text-primary" /> Genre Themes <span className="normal-case text-muted-foreground/50">(pick any)</span>
            </label>
            <p className="text-xs text-muted-foreground font-serif -mt-1">Select the tones and genres the GM should weave into your story.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {THEME_OPTIONS.map(theme => {
                const active = selectedThemes.includes(theme.id);
                return (
                  <button
                    key={theme.id}
                    onClick={() => toggleTheme(theme.id)}
                    data-testid={`button-theme-${theme.id}`}
                    className={`p-3 rounded-md border text-left transition-all hover-elevate ${
                      active
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card"
                    }`}
                  >
                    <p className="text-base leading-none mb-1">{theme.icon}</p>
                    <p className={`font-sans font-semibold text-xs tracking-wide ${active ? "text-primary" : ""}`}>{theme.label}</p>
                    <p className="text-muted-foreground text-xs font-serif mt-0.5 leading-snug">{theme.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Rating */}
          <div className="space-y-3">
            <label className="text-xs font-sans tracking-widest text-muted-foreground uppercase flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-primary" /> Content Rating
            </label>
            <p className="text-xs text-muted-foreground font-serif -mt-1">Controls the maturity level of language, violence, and themes.</p>
            <div className="grid grid-cols-3 gap-3">
              {CONTENT_RATINGS.map(r => (
                <button
                  key={r.id}
                  onClick={() => setContentRating(r.id)}
                  data-testid={`button-rating-${r.id}`}
                  className={`p-4 rounded-md border text-left transition-all hover-elevate ${
                    contentRating === r.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card"
                  }`}
                >
                  <p className="text-base leading-none mb-1">{r.icon}</p>
                  <p className={`font-sans font-semibold text-xs tracking-wide ${contentRating === r.id ? "text-primary" : ""}`}>{r.label}</p>
                  <p className="text-muted-foreground text-xs font-serif mt-0.5 leading-snug">{r.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Content Exclusions */}
          <div className="space-y-3">
            <label className="text-xs font-sans tracking-widest text-muted-foreground uppercase flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-primary" /> Content Preferences
            </label>
            <Card>
              <CardContent className="p-4 space-y-3">
                {[
                  { key: "noRomance", label: "No Romance", desc: "Exclude romantic subplots and scenes", value: noRomance, set: setNoRomance },
                  { key: "noHorror", label: "No Horror", desc: "Avoid disturbing or horrific content", value: noHorror, set: setNoHorror },
                  { key: "fadeToBlack", label: "Fade to Black", desc: "Skip explicit scenes — cut away at suggestive moments", value: fadeToBlack, set: setFadeToBlack },
                ].map(item => (
                  <label key={item.key} className="flex items-center gap-4 cursor-pointer py-1">
                    <div
                      onClick={() => item.set(!item.value)}
                      data-testid={`toggle-${item.key}`}
                      className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${item.value ? "bg-primary" : "bg-secondary"}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${item.value ? "translate-x-5" : "translate-x-0.5"}`} />
                    </div>
                    <div>
                      <p className="text-sm font-sans font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground font-serif">{item.desc}</p>
                    </div>
                  </label>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Character Selection */}
          <div className="space-y-3">
            <label className="text-xs font-sans tracking-widest text-muted-foreground uppercase flex items-center gap-2">
              <Swords className="w-3.5 h-3.5 text-primary" /> Your Hero *
            </label>
            {characters.length === 0 ? (
              <div className="rounded-md border border-dashed border-border/50 p-6 text-center">
                <p className="text-muted-foreground font-serif italic text-sm">No heroes created yet.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => navigate("/characters/new")}
                  data-testid="button-create-character-first"
                >
                  Create a Hero First
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {characters.map(char => (
                  <button
                    key={char.id}
                    onClick={() => setSelectedCharId(char.id)}
                    data-testid={`button-select-char-${char.id}`}
                    className={`p-4 rounded-md border text-left transition-all hover-elevate flex gap-3 items-start ${
                      selectedCharId === char.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card"
                    }`}
                  >
                    {char.profilePicture ? (
                      <img
                        src={char.profilePicture}
                        alt={char.name}
                        className="w-12 h-12 rounded object-cover flex-shrink-0 border border-border"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded flex-shrink-0 border border-dashed border-muted-foreground/40 bg-muted/30 flex items-center justify-center">
                        <ImageOff className="w-5 h-5 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-sans font-semibold tracking-wide">{char.name}</p>
                      <p className="text-muted-foreground text-sm font-serif capitalize">Lv.{char.level} {char.race} {char.class}</p>
                      <p className="text-muted-foreground/50 text-xs mt-1">{char.currentHp}/{char.maxHp} HP</p>
                      {!char.profilePicture && (
                        <p className="text-xs text-amber-500/80 mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> No portrait
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Portrait warning banner */}
            {selectedCharId && !selectedHasPortrait && (
              <div className="flex items-start gap-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-4 mt-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-sans font-medium text-amber-500">Portrait required</p>
                  <p className="text-xs text-muted-foreground font-serif mt-0.5">
                    Your GM uses your portrait to visualize {selectedChar?.name} during the adventure. Generate one before starting.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-shrink-0 border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
                  onClick={() => navigate(`/characters/${selectedCharId}/appearance`)}
                  data-testid="button-go-generate-portrait"
                >
                  <Palette className="w-3.5 h-3.5 mr-1.5" /> Portrait Studio
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t border-border">
          <Button variant="outline" onClick={() => navigate("/dashboard")} data-testid="button-cancel">Cancel</Button>
          <Button
            onClick={handleCreate}
            disabled={loading || !name.trim() || !selectedCharId}
            data-testid="button-create-campaign"
          >
            {loading ? "Weaving your world..." : "Begin the Chronicle"}
          </Button>
        </div>
      </div>
    </div>
  );
}
