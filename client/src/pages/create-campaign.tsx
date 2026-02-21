import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Scroll, Sparkles, Shield, Swords } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Character } from "@shared/schema";

const GM_MODES = [
  { id: "fast", label: "Fast", desc: "Brisk pacing. Quick scenes. Action-forward." },
  { id: "balanced", label: "Balanced", desc: "Mix of narrative depth and steady action." },
  { id: "cinematic", label: "Cinematic", desc: "Rich detail. Deep narrative. Immersive." },
];

export default function CreateCampaignPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [setting, setSetting] = useState("");
  const [gmMode, setGmMode] = useState("balanced");
  const [noRomance, setNoRomance] = useState(false);
  const [noHorror, setNoHorror] = useState(false);
  const [selectedCharId, setSelectedCharId] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: characters = [] } = useQuery<Character[]>({ queryKey: ["/api/characters"] });

  async function handleCreate() {
    if (!name.trim()) {
      toast({ title: "Name required", description: "Give your campaign a name", variant: "destructive" });
      return;
    }
    if (!selectedCharId) {
      toast({ title: "Select a character", description: "Choose a hero to lead this campaign", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description, setting, gmMode, noRomance, noHorror, fadeToBlack: true }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { campaign, party } = await res.json();

      // Join the party with selected character
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

          {/* Content Toggles */}
          <div className="space-y-3">
            <label className="text-xs font-sans tracking-widest text-muted-foreground uppercase flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-primary" /> Content Settings
            </label>
            <Card>
              <CardContent className="p-4 space-y-3">
                {[
                  { key: "noRomance", label: "No Romance", desc: "Exclude romantic subplots and scenes", value: noRomance, set: setNoRomance },
                  { key: "noHorror", label: "No Horror", desc: "Avoid disturbing or horrific content", value: noHorror, set: setNoHorror },
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
                    className={`p-4 rounded-md border text-left transition-all hover-elevate ${
                      selectedCharId === char.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card"
                    }`}
                  >
                    <p className="font-sans font-semibold tracking-wide">{char.name}</p>
                    <p className="text-muted-foreground text-sm font-serif capitalize">Lv.{char.level} {char.race} {char.class}</p>
                    <p className="text-muted-foreground/50 text-xs mt-1">{char.currentHp}/{char.maxHp} HP</p>
                  </button>
                ))}
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
