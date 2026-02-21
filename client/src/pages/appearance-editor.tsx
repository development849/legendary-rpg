import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Wand2, Save, RefreshCw, ImageOff, Sparkles,
  User, BookOpen, Sword, Star, Camera,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import styleRef from "@assets/Snip20260221_1_1771705188223.png";

interface AppearanceEditorProps {
  characterId: string;
}

const STAT_LABELS: Record<string, string> = {
  might: "Might", agility: "Agility", endurance: "End",
  intellect: "Int", will: "Will", presence: "Pres",
};

const CLASS_COLORS: Record<string, string> = {
  fighter: "text-red-400", barbarian: "text-orange-400", rogue: "text-emerald-400",
  wizard: "text-violet-400", cleric: "text-amber-400", ranger: "text-teal-400",
  paladin: "text-yellow-300", bard: "text-rose-400",
};

function statMod(val: number): string {
  const m = Math.floor((val - 10) / 2);
  return m >= 0 ? `+${m}` : `${m}`;
}

export default function AppearanceEditorPage({ characterId }: AppearanceEditorProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: char, isLoading } = useQuery<any>({
    queryKey: [`/api/characters/${characterId}`],
  });

  const [extraDetails, setExtraDetails] = useState("");
  const [generatedPortrait, setGeneratedPortrait] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [showStyleRef, setShowStyleRef] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async (portrait: string) => {
      return apiRequest("PATCH", `/api/characters/${characterId}/portrait`, { portrait });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/characters/${characterId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      toast({ title: "Portrait saved", description: "Your character portrait has been applied." });
      navigate(`/characters/${characterId}`);
    },
    onError: () => {
      toast({ title: "Save failed", description: "Could not save portrait. Please try again.", variant: "destructive" });
    },
  });

  async function generatePortrait() {
    setGenerating(true);
    try {
      const res = await apiRequest("POST", `/api/characters/${characterId}/generate-portrait`, {
        appearanceDetails: extraDetails,
      });
      const data = await res.json();
      if (data.portrait) {
        setGeneratedPortrait(data.portrait);
      } else {
        throw new Error(data.error || "No portrait returned");
      }
    } catch (e: any) {
      toast({
        title: "Generation failed",
        description: e.message || "Could not generate portrait. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground font-serif italic animate-pulse">Consulting the oracle...</div>
      </div>
    );
  }

  if (!char) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Character not found.</div>
      </div>
    );
  }

  const currentPortrait = char.profilePicture;
  const displayPortrait = generatedPortrait || currentPortrait;
  const stats = (char.stats as Record<string, number>) || {};
  const abilities = (char.abilities as any[]) || [];
  const classColor = CLASS_COLORS[char.class] ?? "text-primary";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/characters/${characterId}`)}
            data-testid="button-back-sheet"
            className="text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Sheet
          </Button>
          <Camera className="w-4 h-4 text-primary" />
          <span className="font-sans font-bold tracking-widest text-sm">PORTRAIT STUDIO</span>
          <span className="text-muted-foreground/60 font-serif text-sm">· {char.name}</span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr_420px] gap-6 items-start">

          {/* Left column: character context + controls */}
          <div className="space-y-4">

            {/* Character Summary Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-sans tracking-widest text-muted-foreground uppercase flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Character Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  {currentPortrait && (
                    <div className="w-14 h-14 rounded overflow-hidden border border-border/60 flex-shrink-0">
                      <img src={currentPortrait} alt={char.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-sans font-bold tracking-widest text-lg">{char.name}</h2>
                      <Badge variant="outline" className={`text-xs font-sans ${classColor} border-current/30`}>
                        Level {char.level}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground font-serif capitalize mt-0.5">
                      {char.race} {char.class} · {char.background}
                    </p>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-6 gap-1.5">
                  {Object.entries(STAT_LABELS).map(([key, label]) => {
                    const val = stats[key] ?? 10;
                    const mod = statMod(val);
                    return (
                      <div key={key} className="bg-secondary/30 rounded p-1.5 text-center" data-testid={`stat-${key}-portrait`}>
                        <div className="text-[10px] font-sans uppercase tracking-wide text-muted-foreground/60">{label}</div>
                        <div className="font-sans font-bold text-sm">{val}</div>
                        <div className={`text-[10px] font-mono ${parseInt(mod) >= 0 ? "text-primary/80" : "text-muted-foreground/50"}`}>{mod}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Appearance */}
                {char.appearance && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-sans uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1">
                      <User className="w-3 h-3" /> Appearance
                    </p>
                    <p className="font-serif text-sm text-foreground/80 italic bg-secondary/20 rounded p-2.5 leading-relaxed">
                      {char.appearance}
                    </p>
                  </div>
                )}

                {/* Backstory */}
                {char.backstory && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-sans uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> Backstory
                    </p>
                    <p className="font-serif text-sm text-foreground/70 bg-secondary/20 rounded p-2.5 leading-relaxed line-clamp-4">
                      {char.backstory}
                    </p>
                  </div>
                )}

                {/* Abilities summary */}
                {abilities.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-sans uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1">
                      <Sword className="w-3 h-3" /> Abilities
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {abilities.slice(0, 5).map((a: any) => (
                        <Badge key={a.id} variant="secondary" className="text-[10px] font-sans">
                          {a.name}
                        </Badge>
                      ))}
                      {abilities.length > 5 && (
                        <Badge variant="secondary" className="text-[10px] font-sans text-muted-foreground">
                          +{abilities.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Generation Controls */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-sans tracking-widest text-muted-foreground uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" /> Portrait Customisation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="extra-details" className="text-xs font-sans uppercase tracking-widest text-muted-foreground">
                    Additional Details <span className="normal-case text-muted-foreground/50">(optional)</span>
                  </Label>
                  <Textarea
                    id="extra-details"
                    data-testid="textarea-appearance-details"
                    placeholder="Add specifics not in your character sheet — e.g. 'long silver braids', 'glowing amber eyes', 'a jagged scar from jaw to temple', 'torn cloak blowing in wind'..."
                    value={extraDetails}
                    onChange={(e) => setExtraDetails(e.target.value)}
                    rows={4}
                    className="font-serif text-sm resize-none"
                  />
                  <p className="text-xs text-muted-foreground/50">
                    Your class, race, background, stats, and backstory are automatically incorporated into the prompt.
                  </p>
                </div>

                {/* Style note with reference toggle */}
                <div className="rounded border border-border/50 bg-secondary/20 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-sans uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1">
                      <Star className="w-3 h-3 text-primary/60" /> Art Style
                    </p>
                    <button
                      onClick={() => setShowStyleRef(v => !v)}
                      className="text-[10px] font-sans text-primary/60 hover:text-primary transition-colors"
                      data-testid="button-toggle-style-ref"
                    >
                      {showStyleRef ? "hide reference" : "view reference"}
                    </button>
                  </div>
                  <p className="font-serif text-xs text-muted-foreground/70 italic">
                    WLOP & Guweiz-inspired — cinematic digital portraiture with dramatic rim lighting, ultra-detailed costuming, deep atmospheric backgrounds, and luminous painterly finishes.
                  </p>
                  {showStyleRef && (
                    <div className="mt-2 rounded overflow-hidden border border-border/40">
                      <img
                        src={styleRef}
                        alt="Portrait style reference"
                        className="w-full object-cover"
                        data-testid="img-style-reference"
                      />
                      <p className="text-[10px] text-muted-foreground/40 font-sans text-center p-1.5">Style reference — cinematic fantasy portraiture</p>
                    </div>
                  )}
                </div>

                <Button
                  className="w-full"
                  onClick={generatePortrait}
                  disabled={generating}
                  data-testid="button-generate-portrait"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      The artist is at work...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      {generatedPortrait ? "Regenerate Portrait" : "Generate Portrait"}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right column: Portrait display */}
          <div className="space-y-4 lg:sticky lg:top-20">
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-sans tracking-widest text-muted-foreground uppercase flex items-center justify-between">
                  <span>Portrait</span>
                  {generatedPortrait && !generating && (
                    <span className="text-primary/60 font-normal normal-case font-serif italic text-[11px]">New generation ready</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {generating ? (
                  <div className="aspect-[3/4] flex flex-col items-center justify-center gap-4 bg-secondary/10">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-2 border-secondary animate-spin border-t-primary" />
                      <Sparkles className="w-6 h-6 text-primary/60 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-muted-foreground font-serif italic text-sm">Painting your legend...</p>
                      <p className="text-muted-foreground/40 font-sans text-xs">This may take up to 30 seconds</p>
                    </div>
                  </div>
                ) : displayPortrait ? (
                  <div className="relative group">
                    <img
                      src={displayPortrait}
                      alt={`Portrait of ${char.name}`}
                      className="w-full aspect-[3/4] object-cover object-top"
                      data-testid="img-generated-portrait"
                    />
                    {generatedPortrait && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    )}
                    {!generatedPortrait && currentPortrait && (
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                        <p className="text-xs text-white/70 font-serif italic text-center">Current saved portrait</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-[3/4] flex flex-col items-center justify-center gap-3 bg-secondary/10 text-muted-foreground/30">
                    <ImageOff className="w-14 h-14" />
                    <div className="text-center">
                      <p className="font-serif italic text-sm">No portrait yet</p>
                      <p className="text-xs text-muted-foreground/30 mt-1">Generate one to see it here</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Save / Regenerate actions */}
            {generatedPortrait && !generating && (
              <div className="space-y-2">
                <Button
                  className="w-full"
                  onClick={() => saveMutation.mutate(generatedPortrait)}
                  disabled={saveMutation.isPending}
                  data-testid="button-save-portrait"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saveMutation.isPending ? "Saving..." : "Save Portrait"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={generatePortrait}
                  disabled={generating || saveMutation.isPending}
                  data-testid="button-regenerate-portrait"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate
                </Button>
                <p className="text-xs text-center text-muted-foreground/40 font-serif italic">
                  Saving will replace your current portrait
                </p>
              </div>
            )}

            {!generatedPortrait && currentPortrait && !generating && (
              <Button
                variant="outline"
                className="w-full"
                onClick={generatePortrait}
                data-testid="button-generate-new-portrait"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Generate New Portrait
              </Button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
