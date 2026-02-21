import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Sword, Dices, Shield, ScrollText, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";

const CLASSES = [
  {
    id: "fighter",
    name: "Fighter",
    icon: Sword,
    color: "text-red-400",
    hp: 12,
    description: "Masters of martial combat. Strong, resilient, and capable of extraordinary physical feats.",
    stats: "Might 14, Endurance 12",
    abilities: "Second Wind, Action Surge",
    gear: "Longsword, Chain Mail, Shield",
  },
  {
    id: "rogue",
    name: "Rogue",
    icon: Dices,
    color: "text-emerald-400",
    hp: 8,
    description: "Cunning and agile. Masters of stealth, subterfuge, and striking at the perfect moment.",
    stats: "Agility 14, Presence 12",
    abilities: "Sneak Attack, Cunning Action",
    gear: "Short Sword, Daggers, Thieves' Tools",
  },
  {
    id: "wizard",
    name: "Wizard",
    icon: ScrollText,
    color: "text-violet-400",
    hp: 6,
    description: "Scholars of arcane lore. Wield powerful spells and reshape reality through study and will.",
    stats: "Intellect 14, Will 12",
    abilities: "Arcane Blast, Mage Armor, Sleep",
    gear: "Arcane Staff, Spellbook, Focus Crystal",
  },
  {
    id: "cleric",
    name: "Cleric",
    icon: Shield,
    color: "text-amber-400",
    hp: 10,
    description: "Divine conduits. Channel sacred power to heal allies, smite foes, and turn the tide of battle.",
    stats: "Will 14, Presence 12",
    abilities: "Sacred Flame, Healing Word, Divine Smite",
    gear: "Mace, Scale Mail, Holy Symbol",
  },
];

const RACES = ["Human", "Elf", "Dwarf", "Halfling", "Half-Orc", "Tiefling", "Dragonborn", "Gnome"];
const BACKGROUNDS = [
  "Soldier", "Scholar", "Criminal", "Acolyte", "Merchant", "Noble", "Outlander",
  "Sailor", "Folk Hero", "Hermit", "Charlatan", "Guild Artisan",
];

type Step = "class" | "race" | "details" | "confirm";

export default function CreateCharacterPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>("class");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedRace, setSelectedRace] = useState<string>("");
  const [name, setName] = useState("");
  const [background, setBackground] = useState("");
  const [appearance, setAppearance] = useState("");
  const [loading, setLoading] = useState(false);

  const steps: Step[] = ["class", "race", "details", "confirm"];
  const stepIdx = steps.indexOf(step);

  async function handleCreate() {
    if (!name.trim() || !selectedClass || !selectedRace || !background) {
      toast({ title: "Missing fields", description: "Fill in all required fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await apiRequest("POST", "/api/characters", {
        name: name.trim(),
        class: selectedClass,
        race: selectedRace,
        background,
        appearance,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      toast({ title: "Hero created!", description: `${name} stands ready for adventure.` });
      navigate("/dashboard");
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const cls = CLASSES.find(c => c.id === selectedClass);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <span className="font-sans font-bold tracking-widest text-sm">CREATE YOUR HERO</span>
          </div>
          <div className="ml-auto flex items-center gap-1">
            {steps.map((s, i) => (
              <div key={s} className={`h-1 w-8 rounded-full transition-colors ${i <= stepIdx ? "bg-primary" : "bg-secondary"}`} />
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Step: Class */}
        {step === "class" && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-sans font-bold tracking-widest">Choose Your Class</h2>
              <p className="text-muted-foreground font-serif italic">Your calling defines your strengths and abilities</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
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
            <div className="flex justify-end">
              <Button onClick={() => setStep("race")} disabled={!selectedClass} data-testid="button-next-race">
                Next: Choose Race
              </Button>
            </div>
          </div>
        )}

        {/* Step: Race */}
        {step === "race" && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-sans font-bold tracking-widest">Choose Your Race</h2>
              <p className="text-muted-foreground font-serif italic">Your heritage shapes your place in the world</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {RACES.map((race) => (
                <button
                  key={race}
                  onClick={() => setSelectedRace(race)}
                  data-testid={`button-race-${race.toLowerCase()}`}
                  className={`py-4 px-3 rounded-md border text-center font-sans text-sm tracking-wide transition-all hover-elevate ${
                    selectedRace === race
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-foreground"
                  }`}
                >
                  {race}
                  {selectedRace === race && <CheckCircle2 className="w-3.5 h-3.5 text-primary mx-auto mt-1.5" />}
                </button>
              ))}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("class")} data-testid="button-back-class">Back</Button>
              <Button onClick={() => setStep("details")} disabled={!selectedRace} data-testid="button-next-details">Next: Details</Button>
            </div>
          </div>
        )}

        {/* Step: Details */}
        {step === "details" && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-sans font-bold tracking-widest">Name Your Hero</h2>
              <p className="text-muted-foreground font-serif italic">Give life to your legend</p>
            </div>
            <div className="max-w-lg mx-auto space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-sans tracking-widest text-muted-foreground uppercase">Hero Name *</label>
                <input
                  className="w-full bg-input border border-border rounded-md px-4 py-3 text-foreground font-serif placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Ser Aldric the Bold"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  maxLength={50}
                  data-testid="input-character-name"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-sans tracking-widest text-muted-foreground uppercase">Background *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {BACKGROUNDS.map((bg) => (
                    <button
                      key={bg}
                      onClick={() => setBackground(bg)}
                      data-testid={`button-background-${bg.toLowerCase().replace(" ", "-")}`}
                      className={`py-2.5 px-3 rounded-md border text-sm font-serif text-left transition-all hover-elevate ${
                        background === bg
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-foreground"
                      }`}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-sans tracking-widest text-muted-foreground uppercase">Appearance (optional)</label>
                <textarea
                  className="w-full bg-input border border-border rounded-md px-4 py-3 text-foreground font-serif placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                  placeholder="Tall and weathered, with silver-streaked hair and eyes like storm clouds..."
                  value={appearance}
                  onChange={e => setAppearance(e.target.value)}
                  rows={3}
                  maxLength={300}
                  data-testid="textarea-appearance"
                />
              </div>
            </div>
            <div className="flex justify-between max-w-lg mx-auto">
              <Button variant="outline" onClick={() => setStep("race")} data-testid="button-back-race">Back</Button>
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
                        {selectedRace} {cls.name} · {background}
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
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-1.5 border-b border-border/50">
                      <span className="text-muted-foreground font-sans tracking-wide text-xs uppercase">Primary Stats</span>
                      <span className="font-serif text-foreground">{cls.stats}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-border/50">
                      <span className="text-muted-foreground font-sans tracking-wide text-xs uppercase">Abilities</span>
                      <span className="font-serif text-foreground">{cls.abilities}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-muted-foreground font-sans tracking-wide text-xs uppercase">Starting Gear</span>
                      <span className="font-serif text-foreground text-right max-w-xs">{cls.gear}</span>
                    </div>
                  </div>
                  {appearance && (
                    <div className="bg-secondary/30 rounded-md p-3">
                      <p className="text-muted-foreground text-xs font-sans tracking-wide mb-1 uppercase">Appearance</p>
                      <p className="font-serif text-sm italic text-foreground/80">{appearance}</p>
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
      </div>
    </div>
  );
}
