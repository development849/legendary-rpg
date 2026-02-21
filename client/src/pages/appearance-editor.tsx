import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Wand2, Save, RefreshCw, ImageOff, Sparkles } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface AppearanceEditorProps {
  characterId: string;
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

  const saveMutation = useMutation({
    mutationFn: async (portrait: string) => {
      return apiRequest("PATCH", `/api/characters/${characterId}/portrait`, { portrait });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/characters/${characterId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      toast({ title: "Portrait saved", description: "Your character portrait has been saved to your profile." });
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

  const currentPortrait = (char as any).profilePicture;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/characters/${characterId}`)}
            data-testid="button-back-sheet"
            className="text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back
          </Button>
          <span className="font-sans font-bold tracking-widest text-base">MYTHWEAVE</span>
          <span className="text-muted-foreground text-sm font-serif ml-1">· Portrait Studio</span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-sans font-bold tracking-widest">{char.name}</h1>
          <p className="text-muted-foreground font-serif italic text-sm capitalize">
            {char.race} {char.class} — Portrait Studio
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 items-start">
          {/* Left: Controls */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-sans tracking-widest text-muted-foreground uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" /> Appearance Description
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {char.appearance && (
                  <div className="bg-secondary/30 rounded-md p-3">
                    <p className="text-xs text-muted-foreground font-sans uppercase tracking-wide mb-1">From character creation</p>
                    <p className="font-serif text-sm text-foreground/80 italic">{char.appearance}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="extra-details" className="text-xs font-sans uppercase tracking-widest text-muted-foreground">
                    Additional Details <span className="normal-case text-muted-foreground/60">(optional)</span>
                  </Label>
                  <Textarea
                    id="extra-details"
                    data-testid="textarea-appearance-details"
                    placeholder="e.g. Long silver hair, amber glowing eyes, a scar running from brow to chin, wears battered plate armour with runic engravings..."
                    value={extraDetails}
                    onChange={(e) => setExtraDetails(e.target.value)}
                    rows={4}
                    className="font-serif text-sm resize-none"
                  />
                  <p className="text-xs text-muted-foreground/60">
                    These details are combined with your existing appearance description to craft the portrait prompt.
                  </p>
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
                      Painting your legend...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      {generatedPortrait ? "Regenerate Portrait" : "Generate Portrait"}
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground/50 font-serif italic">
                  Rendered in the style of WLOP — luminous fantasy portraiture
                </p>
              </CardContent>
            </Card>

            {generatedPortrait && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={generatePortrait}
                  disabled={generating || saveMutation.isPending}
                  data-testid="button-regenerate-portrait"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => saveMutation.mutate(generatedPortrait)}
                  disabled={saveMutation.isPending || generating}
                  data-testid="button-save-portrait"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saveMutation.isPending ? "Saving..." : "Save Portrait"}
                </Button>
              </div>
            )}
          </div>

          {/* Right: Portrait Preview */}
          <div className="space-y-3">
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-sans tracking-widest text-muted-foreground uppercase">
                  Portrait Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {generating ? (
                  <div className="aspect-square flex flex-col items-center justify-center gap-4 bg-secondary/20">
                    <div className="w-16 h-16 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                    <p className="text-muted-foreground font-serif italic text-sm">The artist is at work...</p>
                  </div>
                ) : generatedPortrait ? (
                  <div className="relative group">
                    <img
                      src={generatedPortrait}
                      alt={`Portrait of ${char.name}`}
                      className="w-full aspect-square object-cover"
                      data-testid="img-generated-portrait"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                ) : currentPortrait ? (
                  <div className="relative">
                    <img
                      src={currentPortrait}
                      alt={`Portrait of ${char.name}`}
                      className="w-full aspect-square object-cover opacity-60"
                      data-testid="img-current-portrait"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-sm font-serif italic text-white/80 bg-black/50 px-3 py-1.5 rounded-md">
                        Current portrait — generate a new one to replace
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-square flex flex-col items-center justify-center gap-3 bg-secondary/10 text-muted-foreground/40">
                    <ImageOff className="w-12 h-12" />
                    <p className="font-serif italic text-sm">No portrait yet</p>
                    <p className="text-xs text-muted-foreground/30">Generate one above to see it here</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {(generatedPortrait || currentPortrait) && !generating && (
              <p className="text-xs text-center text-muted-foreground/50 font-serif italic px-2">
                {generatedPortrait
                  ? "This is your newly generated portrait. Save it to apply it to your character profile."
                  : "This is your current saved portrait."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
