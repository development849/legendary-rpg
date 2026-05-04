import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Sword, Shield, Scroll, Users, Sparkles, Dices } from "lucide-react";
import { LegendaryLogo } from "@/components/LegendaryLogo";
import { useHeroBackground } from "@/hooks/use-hero-background";

export default function LandingPage() {
  const hero = useHeroBackground();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Hero */}
      <div className="relative min-h-screen flex flex-col items-center justify-center px-4 text-center">
        {/* Cross-genre hero background (one per session) with Ken Burns drift */}
        <div className="absolute inset-0 z-0 overflow-hidden" data-testid="hero-bg-landing" aria-hidden="true">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-hero-drift"
            style={{ backgroundImage: `url(${hero.url})`, opacity: 0.55 }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/20" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-transparent to-background" />
        </div>

        {/* Soft accent glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-900/5 rounded-full blur-3xl" />
        </div>

        {/* Decorative top border */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent z-10" />

        <div className="relative z-10 max-w-4xl mx-auto space-y-8">
          {/* Logo */}
          <div className="flex items-center justify-center mb-2">
            <LegendaryLogo className="w-32 h-32 md:w-40 md:h-40 drop-shadow-2xl" />
          </div>

          {/* Title */}
          <div className="space-y-3">
            <h1 className="text-5xl md:text-7xl font-sans font-bold tracking-widest text-foreground glow-gold drop-shadow-lg">
              LEGENDARY RPG<sup className="text-2xl md:text-3xl align-super ml-1">&#8480;</sup>
            </h1>
            <p className="text-lg md:text-xl text-primary font-sans tracking-widest uppercase font-light drop-shadow-md">
              The Living Chronicle
            </p>
          </div>

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-muted-foreground font-serif italic leading-relaxed max-w-2xl mx-auto drop-shadow-md">
            "An AI Game Master weaves your story in real time. Every choice shapes the world. Every action has consequence."
          </p>

          {/* Ornate divider */}
          <div className="ornate-divider max-w-xs mx-auto">
            <span className="text-primary/50 text-lg">&#11835;</span>
            <Dices className="w-4 h-4 text-primary/50" />
            <span className="text-primary/50 text-lg">&#11835;</span>
          </div>

          {/* CTA */}
          <div className="flex justify-center">
            <Link href="/auth">
              <Button
                size="lg"
                className="px-10 py-6 text-lg font-sans tracking-widest uppercase glow-primary"
                data-testid="button-login"
              >
                Begin Your Journey
              </Button>
            </Link>
          </div>

          <p className="text-muted-foreground/50 text-sm font-sans">
            Free to play. No credit card required.
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground/40 z-10">
          <div className="w-px h-12 bg-gradient-to-b from-transparent to-primary/30" />
        </div>
      </div>

      {/* Features Section */}
      <div className="px-4 py-24 max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16 space-y-3">
          <div className="flex items-center justify-center gap-3">
            <div className="w-16 h-px bg-primary/30" />
            <Scroll className="w-4 h-4 text-primary/50" />
            <div className="w-16 h-px bg-primary/30" />
          </div>
          <h2 className="text-3xl font-sans font-bold tracking-widest">THE CHRONICLES</h2>
          <p className="text-muted-foreground font-serif">What awaits within</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Sparkles,
              title: "Living Narrative",
              description: "An AI Game Master that responds to your every action, weaving a unique story shaped by your choices. No two adventures are alike.",
            },
            {
              icon: Dices,
              title: "Legendary Lite Rules",
              description: "A streamlined d20 system with meaningful choices. Ability checks, combat, conditions, and a Focus resource for spells and special abilities.",
            },
            {
              icon: Shield,
              title: "Persistent Characters",
              description: "Your characters grow, gain scars, forge bonds, and carry their history forward. Death has weight. Victories have glory.",
            },
            {
              icon: Users,
              title: "Party Play",
              description: "Adventure alone or gather companions. Real-time co-op with invite links. The GM orchestrates all players simultaneously.",
            },
            {
              icon: Scroll,
              title: "Campaign Arcs",
              description: "Multi-chapter stories with summaries, callbacks, and 'Previously On...' recaps. Your saga has structure and momentum.",
            },
            {
              icon: Sword,
              title: "Free Actions",
              description: "Type anything. Try anything. The GM handles it. Climb that castle wall. Bribe the guard. Summon ancient fire. The world responds.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="group relative p-6 border border-border bg-card/80 backdrop-blur-sm rounded-md hover-elevate transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/3 rounded-md opacity-0 group-hover:opacity-100 transition-opacity" />
              <feature.icon className="w-6 h-6 text-primary mb-4" />
              <h3 className="font-sans font-semibold tracking-wider text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground font-serif leading-relaxed text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      <div className="text-center py-24 px-4 relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="space-y-6 max-w-xl mx-auto">
          <p className="text-3xl font-sans font-bold tracking-widest">READY TO BE A LEGEND?</p>
          <p className="text-muted-foreground font-serif italic">The world of Legendary&#8480; awaits. Your story is about to begin.</p>
          <Link href="/auth">
            <Button
              size="lg"
              className="px-10 py-6 text-base font-sans tracking-widest uppercase"
              data-testid="button-login-bottom"
            >
              Enter the Chronicle
            </Button>
          </Link>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-xs font-sans tracking-widest space-y-1">
        <div className="text-muted-foreground/30">
          LEGENDARY RPG&#8480; &middot; THE LIVING CHRONICLE &middot; POWERED BY AI
        </div>
        <div className="text-muted-foreground/20">
          A LEAP GAMES PRODUCTION
        </div>
      </div>
    </div>
  );
}
