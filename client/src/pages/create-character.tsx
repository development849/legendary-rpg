import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Sword, Dices, Shield, ScrollText, CheckCircle2, Target, Star, Flame, Music, Sparkles, RotateCcw } from "lucide-react";
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
  {
    id: "ranger",
    name: "Ranger",
    icon: Target,
    color: "text-teal-400",
    hp: 10,
    description: "Hunters of the wild. Expert trackers who blend martial skill with nature magic to stalk their prey.",
    stats: "Agility 14, Endurance 12",
    abilities: "Hunter's Mark, Volley, Natural Explorer",
    gear: "Longbow, Short Sword, Studded Leather",
  },
  {
    id: "paladin",
    name: "Paladin",
    icon: Star,
    color: "text-yellow-300",
    hp: 10,
    description: "Holy warriors bound by sacred oaths. Combine martial prowess with divine grace to protect the innocent.",
    stats: "Might 14, Will 12",
    abilities: "Lay on Hands, Divine Smite, Aura of Protection",
    gear: "Longsword, Half-Plate, Shield, Holy Symbol",
  },
  {
    id: "barbarian",
    name: "Barbarian",
    icon: Flame,
    color: "text-orange-400",
    hp: 12,
    description: "Primal warriors who tap into a furious rage. Fearsome and nigh-unstoppable on the battlefield.",
    stats: "Might 14, Endurance 14",
    abilities: "Rage, Reckless Attack, Danger Sense",
    gear: "Greataxe, Handaxe, Hide Armor",
  },
  {
    id: "bard",
    name: "Bard",
    icon: Music,
    color: "text-rose-400",
    hp: 8,
    description: "Virtuosos of magic and charm. Inspire allies, confound enemies, and bend fate with song and story.",
    stats: "Presence 14, Will 12",
    abilities: "Bardic Inspiration, Cutting Words, Vicious Mockery",
    gear: "Rapier, Lute, Leather Armor, Component Pouch",
  },
];

const RACES = [
  {
    name: "Human",
    description: "Adaptable and endlessly driven, humans spread across every corner of the world through ambition and will.",
    traits: "+1 to all stats · Bonus Proficiency · Extra Language",
  },
  {
    name: "Elf",
    description: "Ancient and graceful, elves carry millennia of memory in their eyes and move like living poetry through any landscape.",
    traits: "+2 Agility · Darkvision · Trance (4-hr rest) · Keen Senses",
  },
  {
    name: "Dwarf",
    description: "Born of stone and tradition, dwarves are unyielding in battle and fiercely loyal to kin, clan, and craft.",
    traits: "+2 Endurance · Darkvision · Poison Resistance · Stone Sense",
  },
  {
    name: "Halfling",
    description: "Small in stature but boundless in courage, halflings carry an uncanny luck that bends fate to their favor.",
    traits: "+2 Agility · Lucky (reroll 1s) · Brave · Naturally Stealthy",
  },
  {
    name: "Half-Orc",
    description: "Born between two worlds, half-orcs channel primal fury into devastating strength and shrug off blows that fell others.",
    traits: "+2 Might · +1 Endurance · Relentless Endurance · Savage Attacks",
  },
  {
    name: "Tiefling",
    description: "Touched by infernal blood, tieflings bear the mark of the lower planes but forge their own destiny through will alone.",
    traits: "+2 Presence · +1 Intellect · Darkvision · Hellish Rebuke · Fire Resistance",
  },
  {
    name: "Dragonborn",
    description: "Proud descendants of dragonkind who carry draconic power in their blood, unleashing elemental breath in battle.",
    traits: "+2 Might · +1 Presence · Breath Weapon · Draconic Ancestry · Damage Resistance",
  },
  {
    name: "Gnome",
    description: "Inventive and irrepressibly curious, gnomes approach every problem with a tinkerer's mind and a trickster's heart.",
    traits: "+2 Intellect · Gnome Cunning (adv. mental saves) · Darkvision · Tinker",
  },
  {
    name: "Aasimar",
    description: "Blessed with celestial lineage, aasimar radiate an inner light and are called by divine forces to champion the innocent.",
    traits: "+2 Will · +1 Presence · Healing Hands · Radiant Soul · Celestial Resistance",
  },
  {
    name: "Tabaxi",
    description: "Feline wanderers driven by insatiable curiosity, tabaxi move with preternatural speed and strike like an uncoiled spring.",
    traits: "+2 Agility · +1 Presence · Cat's Claws · Feline Agility · Darkvision",
  },
  {
    name: "Genasi",
    description: "Born of elemental fire and mortal blood, genasi blaze with inner heat that shapes their personality and powers alike.",
    traits: "+2 Intellect · +1 Endurance · Fire Resistance · Reach to the Blaze · Darkvision",
  },
  {
    name: "Firbolg",
    description: "Gentle giants of the ancient forests, firbolgs commune with nature and prefer diplomacy — but are terrifying when roused.",
    traits: "+2 Will · +1 Might · Detect Magic · Hidden Step · Powerful Build",
  },
];
const BACKGROUNDS = [
  "Soldier", "Scholar", "Criminal", "Acolyte", "Merchant", "Noble", "Outlander",
  "Sailor", "Folk Hero", "Hermit", "Charlatan", "Guild Artisan",
];

const PERSONALITY_TRAITS = [
  "Brave", "Cunning", "Compassionate", "Ruthless", "Wise", "Reckless",
  "Honourable", "Ambitious", "Haunted", "Cheerful", "Stoic", "Pious",
  "Sarcastic", "Curious", "Loyal", "Mysterious",
];

const MOTIVATIONS = [
  "Vengeance", "Redemption", "Wealth", "Knowledge", "Fame", "Justice",
  "Protect loved ones", "Freedom", "Power", "Belonging", "Duty", "Survival",
];

const FLAWS = [
  "Crippling guilt", "Blind rage", "Cowardice at heart", "Greed",
  "Dark secret", "Reckless pride", "Betrayed a friend", "Addiction",
  "Owes a dangerous debt", "Fears death above all", "Cannot trust anyone", "Lost faith",
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
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [motivation, setMotivation] = useState("");
  const [flaw, setFlaw] = useState("");
  const [backstory, setBackstory] = useState("");
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(false);

  const steps: Step[] = ["class", "race", "details", "confirm"];
  const stepIdx = steps.indexOf(step);

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
          personality: selectedTraits.join(", ") || undefined,
          motivation: motivation.trim() || undefined,
          flaw: flaw.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBackstory(data.backstory);
    } catch (e: any) {
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
      await apiRequest("POST", "/api/characters", {
        name: name.trim(),
        class: selectedClass,
        race: selectedRace,
        background,
        appearance,
        backstory: backstory.trim() || undefined,
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
  const raceData = RACES.find(r => r.name === selectedRace);

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
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
              <h2 className="text-2xl font-sans font-bold tracking-widest">Shape Your Legend</h2>
              <p className="text-muted-foreground font-serif italic">Name your hero and forge their story</p>
            </div>
            <div className="max-w-2xl mx-auto space-y-6">

              {/* Name & Background row */}
              <div className="grid sm:grid-cols-2 gap-4">
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
                    {raceData && (
                      <div className="flex justify-between py-1.5 border-b border-border/50">
                        <span className="text-muted-foreground font-sans tracking-wide text-xs uppercase">Racial Traits</span>
                        <span className="font-serif text-foreground text-right max-w-xs">{raceData.traits}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-1.5 border-b border-border/50">
                      <span className="text-muted-foreground font-sans tracking-wide text-xs uppercase">Abilities</span>
                      <span className="font-serif text-foreground">{cls.abilities}</span>
                    </div>
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
      </div>
    </div>
  );
}
