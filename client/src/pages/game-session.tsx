import { useState, useEffect, useRef, useCallback } from "react";
import { getAvailableSkills, SKILL_MILESTONE_LEVELS, type SkillOption, RECHARGE_LABELS, type RechargeType } from "@shared/skillTrees";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useSoundtrack, type MoodType } from "@/hooks/use-soundtrack";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Sword, Dices, Users, Heart, Send, ChevronDown, ChevronRight,
  Scroll, Package, Shield, Zap, Gem, Coffee, Wrench, MapPin, Skull,
  Mic, MicOff, MessageCircle, Radio, BookOpen, Star, Activity, Brain, ScrollText,
  Settings, Navigation, Store, ShoppingCart, Coins, X, ArrowRightLeft, Trophy, LogOut, Menu,
  Download, Share2, Minimize2, Map as MapIcon, RefreshCw, Loader2,
  ClipboardList, AlertTriangle, Clock, Target, Volume2, VolumeX, Music
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { WorldThreshold } from "@/components/WorldThreshold";
import { CharacterHintPill } from "@/components/CharacterHintPill";
import { SessionFeedback } from "@/components/session-feedback";

function AuthImg({ src, alt, className, onClick, "data-testid": testId }: { src: string; alt: string; className?: string; onClick?: (e: React.MouseEvent) => void; "data-testid"?: string }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  useEffect(() => {
    let revoke = "";
    fetch(src, { credentials: "include" })
      .then(r => { if (r.ok) return r.blob(); throw new Error("load failed"); })
      .then(b => { const u = URL.createObjectURL(b); revoke = u; setBlobUrl(u); })
      .catch(() => setBlobUrl(null));
    return () => { if (revoke) URL.revokeObjectURL(revoke); };
  }, [src]);
  if (!blobUrl) return null;
  return <img src={blobUrl} alt={alt} className={className} onClick={onClick} data-testid={testId} />;
}

interface GameSessionPageProps {
  partyId: string;
}

interface ChatMsg {
  id: string;
  role: string;
  content: string;
  userId?: string;
  metadata?: any;
  createdAt: string;
}

interface ShopItem {
  name: string;
  type: string;
  rarity: string;
  price: number;
  description?: string;
  properties: Record<string, any>;
  qty?: number;
}

interface ShopData {
  merchant_name: string;
  shop_flavor: string;
  inventory: ShopItem[];
}

interface NoticeItem {
  title: string;
  description: string;
  poster: string;
  reward_gold: number;
  reward_items: string[];
  difficulty: "easy" | "moderate" | "hard" | "deadly";
  location_hint: string;
  deadline: string | null;
}

interface NoticeBoardData {
  board_name: string;
  board_flavor: string;
  notices: NoticeItem[];
}

type TabType = "chat" | "characters" | "dice";

const QUICK_ACTIONS_DEFAULT = [
  "Look around carefully",
  "Search for clues",
  "Talk to the nearest person",
  "Check the area for threats",
  "Make camp and rest",
];

function PhysicalDiceInput({ promptKey, req, modStr, onSubmit }: { promptKey: string; req: any; modStr: string; onSubmit: (total: number) => void }) {
  const [val, setVal] = useState("");
  const modifier = req.modifier ?? 0;
  const rawRoll = parseInt(val);
  const total = !isNaN(rawRoll) ? rawRoll + modifier : NaN;

  return (
    <div className="flex items-center gap-1.5" data-testid={`physical-dice-${promptKey}`}>
      <input
        type="number"
        inputMode="numeric"
        placeholder="Roll"
        value={val}
        onChange={e => setVal(e.target.value)}
        className="w-14 h-7 text-center text-xs font-mono bg-amber-950/40 border border-amber-700/50 rounded text-amber-200 placeholder:text-amber-700/60 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
        data-testid={`input-physical-roll-${promptKey}`}
        onKeyDown={e => { if (e.key === "Enter" && !isNaN(total)) onSubmit(total); }}
      />
      {modifier !== 0 && val && !isNaN(rawRoll) && (
        <span className="text-[10px] text-amber-400/70 font-mono whitespace-nowrap">{modStr}={total}</span>
      )}
      <Button
        size="sm"
        variant="outline"
        className="h-7 px-2 text-xs border-amber-700/50 text-amber-300 hover:bg-amber-900/30 hover:text-amber-200"
        disabled={isNaN(total) || val === ""}
        data-testid={`button-submit-physical-${promptKey}`}
        onClick={() => onSubmit(total)}
      >
        Submit
      </Button>
    </div>
  );
}

function DiceRoller() {
  const { toast } = useToast();
  const [die, setDie] = useState("d20");
  const [count, setCount] = useState(1);
  const [modifier, setModifier] = useState(0);
  const [advantage, setAdvantage] = useState("normal");
  const [result, setResult] = useState<any>(null);
  const [rolling, setRolling] = useState(false);

  const dice = ["d4", "d6", "d8", "d10", "d12", "d20", "d100"];

  async function roll() {
    setRolling(true);
    try {
      const res = await fetch("/api/dice/roll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ die, count, modifier, advantageState: advantage }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      toast({ title: "Roll failed", variant: "destructive" });
    } finally {
      setRolling(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
        {dice.map(d => (
          <button
            key={d}
            onClick={() => setDie(d)}
            data-testid={`button-die-${d}`}
            className={`py-2 px-1 rounded-md border text-xs font-sans tracking-wide transition-all hover-elevate ${
              die === d ? "border-primary bg-primary/10 text-primary" : "border-border bg-card"
            }`}
          >
            {d.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-sans">Count</label>
          <input
            type="number" min={1} max={20} value={count}
            onChange={e => setCount(parseInt(e.target.value) || 1)}
            className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm font-sans text-center"
            data-testid="input-dice-count"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-sans">Modifier</label>
          <input
            type="number" min={-20} max={20} value={modifier}
            onChange={e => setModifier(parseInt(e.target.value) || 0)}
            className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm font-sans text-center"
            data-testid="input-dice-modifier"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-sans">Mode</label>
          <select
            value={advantage}
            onChange={e => setAdvantage(e.target.value)}
            className="w-full bg-input border border-border rounded-md px-2 py-2 text-xs font-serif"
            data-testid="select-advantage"
          >
            <option value="normal">Normal</option>
            <option value="advantage">Adv.</option>
            <option value="disadvantage">Dis.</option>
          </select>
        </div>
      </div>

      <Button onClick={roll} disabled={rolling} className="w-full" data-testid="button-roll">
        <Dices className="w-4 h-4 mr-2" />
        {rolling ? "Rolling..." : `Roll ${count}${die.toUpperCase()}${modifier !== 0 ? (modifier > 0 ? `+${modifier}` : modifier) : ""}`}
      </Button>

      {result && (
        <div className="text-center p-4 rounded-md bg-secondary/50 border border-border space-y-1" data-testid="dice-result">
          <div className="text-4xl font-sans font-bold text-primary">{result.total}</div>
          <div className="text-xs text-muted-foreground font-serif">
            Rolled: [{result.rolls?.join(", ")}]
            {result.modifier !== 0 && ` ${result.modifier > 0 ? "+" : ""}${result.modifier}`}
            {result.advantageState !== "normal" && ` (${result.advantageState})`}
          </div>
        </div>
      )}
    </div>
  );
}

const CONTENT_RATINGS = [
  { id: "pg", label: "PG", desc: "Family-friendly. No blood or real danger. Clean language." },
  { id: "pg13", label: "PG-13", desc: "Classic fantasy adventure. Combat and peril, no gore." },
  { id: "r", label: "Mature", desc: "Blood, graphic violence, strong language, dark themes." },
];

function ContentSettingsPanel({ campaign, onClose, onSaved }: { campaign: any; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [rating, setRating] = useState(campaign.contentRating ?? "pg13");
  const [noRomance, setNoRomance] = useState(campaign.noRomance ?? false);
  const [noHorror, setNoHorror] = useState(campaign.noHorror ?? false);
  const [npcControl, setNpcControl] = useState(campaign.npcControl ?? "gm");
  const [physicalDice, setPhysicalDice] = useState(campaign.physicalDice ?? false);
  const [soundtrackOn, setSoundtrackOn] = useState(campaign.soundtrackEnabled ?? true);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentRating: rating, noRomance, noHorror, npcControl, physicalDice, soundtrackEnabled: soundtrackOn }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast({ title: "Settings updated", description: "Settings will apply from the next GM response.", variant: "success" as any });
      onSaved();
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const toggles = [
    { key: "noRomance", label: "No Romance", desc: "Exclude romantic subplots", value: noRomance, set: setNoRomance },
    { key: "noHorror", label: "No Horror", desc: "Avoid disturbing content", value: noHorror, set: setNoHorror },
    { key: "physicalDice", label: "Physical Dice", desc: "Enter roll results manually", value: physicalDice, set: setPhysicalDice },
    { key: "soundtrackEnabled", label: "Soundtrack", desc: "Ambient music during gameplay", value: soundtrackOn, set: setSoundtrackOn },
  ];

  const NPC_CONTROL_OPTIONS = [
    { id: "gm", label: "GM Controls", desc: "The Game Master decides companion actions in combat and exploration. NPCs act autonomously." },
    { id: "player", label: "Player Controls", desc: "Players direct their companions' actions. The GM will ask what each companion does on their turn." },
  ];

  return (
    <div className="border-b border-border bg-card/95 backdrop-blur-sm px-4 py-4 space-y-4 z-30 relative">
      <div className="flex items-center justify-between">
        <p className="text-xs font-sans tracking-widest text-muted-foreground uppercase flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-primary" /> Campaign Settings
        </p>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose} data-testid="button-close-settings">
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div>
        <p className="text-[10px] font-sans tracking-widest text-muted-foreground uppercase mb-1.5">Content Rating</p>
        <div className="grid grid-cols-3 gap-2">
          {CONTENT_RATINGS.map(r => (
            <button
              key={r.id}
              onClick={() => setRating(r.id)}
              data-testid={`button-rating-${r.id}`}
              className={`p-3 rounded-md border text-left transition-all ${
                rating === r.id ? "border-primary bg-primary/10" : "border-border bg-secondary/30 hover:bg-secondary/50"
              }`}
            >
              <p className={`font-sans font-semibold text-xs tracking-wide ${rating === r.id ? "text-primary" : ""}`}>{r.label}</p>
              <p className="text-muted-foreground text-[10px] font-serif mt-0.5 leading-snug">{r.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-sans tracking-widest text-muted-foreground uppercase mb-1.5">NPC Companion Control</p>
        <div className="grid grid-cols-2 gap-2">
          {NPC_CONTROL_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => setNpcControl(opt.id)}
              data-testid={`button-npc-control-${opt.id}`}
              className={`p-3 rounded-md border text-left transition-all ${
                npcControl === opt.id ? "border-primary bg-primary/10" : "border-border bg-secondary/30 hover:bg-secondary/50"
              }`}
            >
              <p className={`font-sans font-semibold text-xs tracking-wide flex items-center gap-1 ${npcControl === opt.id ? "text-primary" : ""}`}>
                {opt.id === "gm" ? <Brain className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                {opt.label}
              </p>
              <p className="text-muted-foreground text-[10px] font-serif mt-0.5 leading-snug">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {toggles.map(t => (
          <label key={t.key} className="flex items-center gap-2 cursor-pointer">
            <div
              onClick={() => t.set(!t.value)}
              data-testid={`toggle-${t.key}`}
              className={`relative w-8 h-4 rounded-full transition-colors cursor-pointer flex-shrink-0 ${t.value ? "bg-primary" : "bg-secondary"}`}
            >
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${t.value ? "translate-x-4" : "translate-x-0.5"}`} />
            </div>
            <div>
              <span className="text-xs font-sans font-medium">{t.label}</span>
              <span className="text-[10px] text-muted-foreground font-serif ml-1">{t.desc}</span>
            </div>
          </label>
        ))}
      </div>

      <Button size="sm" onClick={save} disabled={saving} data-testid="button-save-settings">
        {saving ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}

const MOOD_LABELS: Record<string, string> = {
  exploration: "Exploring",
  combat: "Combat",
  mystery: "Mystery",
  romance: "Romance",
  leisure: "Tavern",
  triumph: "Triumph",
  stealth: "Stealth",
};

function SoundtrackControls({ soundtrack }: { soundtrack: ReturnType<typeof useSoundtrack> }) {
  const [showSlider, setShowSlider] = useState(false);

  const handleToggle = async () => {
    if (!soundtrack.audioStarted) {
      await soundtrack.initAudio();
      if (soundtrack.enabled) {
        setTimeout(() => soundtrack.startPlayback(), 100);
      }
      return;
    }
    if (soundtrack.isPlaying) {
      soundtrack.stopPlayback();
    } else if (soundtrack.enabled) {
      soundtrack.startPlayback();
    }
  };

  return (
    <div className="flex items-center gap-1 relative" data-testid="soundtrack-controls">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleToggle}
            data-testid="button-soundtrack-toggle"
          >
            {soundtrack.isPlaying ? (
              <Volume2 className="w-4 h-4 text-primary" />
            ) : (
              <VolumeX className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {soundtrack.isPlaying
            ? `Playing: ${MOOD_LABELS[soundtrack.currentMood] ?? soundtrack.currentMood}`
            : "Start soundtrack"}
        </TooltipContent>
      </Tooltip>
      {soundtrack.audioStarted && (
        <div
          className="relative"
          onMouseEnter={() => setShowSlider(true)}
          onMouseLeave={() => setShowSlider(false)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowSlider(p => !p)}
            data-testid="button-soundtrack-volume"
          >
            <Music className="w-3.5 h-3.5 text-muted-foreground" />
          </Button>
          {showSlider && (
            <div className="absolute top-full right-0 mt-1 bg-card border border-border rounded-md shadow-lg p-3 z-50 min-w-[140px]" data-testid="soundtrack-volume-panel">
              <p className="text-[10px] font-sans tracking-widest text-muted-foreground uppercase mb-2">Volume</p>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(soundtrack.volume * 100)}
                onChange={e => soundtrack.setVolume(parseInt(e.target.value) / 100)}
                className="w-full h-1.5 accent-primary cursor-pointer"
                data-testid="input-soundtrack-volume"
              />
              {soundtrack.isPlaying && (
                <p className="text-[10px] text-primary/70 mt-1.5 font-serif text-center">
                  {MOOD_LABELS[soundtrack.currentMood] ?? soundtrack.currentMood}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function GameSessionPage({ partyId }: GameSessionPageProps) {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [stalled, setStalled] = useState(false);
  const lastSentRef = useRef<{ content: string; playerName?: string; mode?: "action" | "dialogue" | "ooc" } | null>(null);
  const streamTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [quickActions, setQuickActions] = useState<string[]>(QUICK_ACTIONS_DEFAULT);
  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const [showCharacters, setShowCharacters] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"party" | "inventory" | "map" | "dice" | "sheet" | "log" | "codex">("party");
  const [isFirstTurn, setIsFirstTurn] = useState(true);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [sceneBackground, setSceneBackground] = useState<string | null>(null);
  const [backgroundPending, setBackgroundPending] = useState(false);
  const backgroundPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [inputMode, setInputMode] = useState<"action" | "dialogue" | "ooc">("action");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [rolledPrompts, setRolledPrompts] = useState<Record<string, boolean>>({});
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());
  const [expandedSceneImage, setExpandedSceneImage] = useState<{ name: string; imageData: string } | null>(null);
  const [viewingLocationMap, setViewingLocationMap] = useState<string | null>(null);
  const [turnHint, setTurnHint] = useState<{ character: string; prompt: string } | null>(null);
  const [sceneMood, setSceneMood] = useState<string | null>(null);
  const [shopData, setShopData] = useState<ShopData | null>(null);
  const [noticeBoardData, setNoticeBoardData] = useState<NoticeBoardData | null>(null);
  const [expandedNotice, setExpandedNotice] = useState<number | null>(null);
  const [expandedPortrait, setExpandedPortrait] = useState<{ name: string; url: string; role?: string } | null>(null);
  const [shopTab, setShopTab] = useState<"buy" | "sell">("buy");
  const [shopBusy, setShopBusy] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{ characterId: string; characterName: string; newLevel: number; hpGain: number; mpGain?: number } | null>(null);
  const [statPoints, setStatPoints] = useState<Record<string, number>>({ might: 0, agility: 0, endurance: 0, intellect: 0, will: 0, presence: 0 });
  const [levelUpBusy, setLevelUpBusy] = useState(false);
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  // FR-002: Onboarding state
  const [showThreshold, setShowThreshold] = useState(false);
  const [thresholdInitialized, setThresholdInitialized] = useState(false);
  const [gmHasStarted, setGmHasStarted] = useState(false);
  const [playerTurnCount, setPlayerTurnCount] = useState(0);
  const [showCharHint, setShowCharHint] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [charHintDismissed, setCharHintDismissed] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const { data: partyData } = useQuery<any>({
    queryKey: [`/api/parties/${partyId}`],
  });

  const soundtrack = useSoundtrack(partyData?.campaign?.id);

  // World image fallback: always available, generated at campaign creation,
  // shown behind the per-scene background until that specific scene art loads.
  const { data: worldImageData } = useQuery<{ imageData: string | null; pending: boolean }>({
    queryKey: [`/api/campaigns/${partyData?.campaign?.id}/world-image`],
    enabled: !!partyData?.campaign?.id,
    refetchInterval: (q) => (q.state.data?.pending ? 6000 : false),
  });
  const worldBackground = worldImageData?.imageData ?? null;

  const { data: situations = [] } = useQuery<any[]>({
    queryKey: [`/api/parties/${partyId}/situations`],
    refetchInterval: 8000,
  });

  const { data: npcs = [] } = useQuery<any[]>({
    queryKey: [`/api/parties/${partyId}/npcs`],
    refetchInterval: 10000,
  });


  const { data: locationMapData, isLoading: isLoadingLocationMap } = useQuery<any>({
    queryKey: [`/api/parties/${partyId}/location-maps`, viewingLocationMap],
    queryFn: async () => {
      if (!viewingLocationMap) return null;
      const res = await fetch(`/api/parties/${partyId}/location-maps/${encodeURIComponent(viewingLocationMap)}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!viewingLocationMap && !!partyId,
    refetchInterval: (query) => {
      const d = query.state.data;
      return d?.generating ? 4000 : false;
    },
  });

  const { data: savedLocationMaps } = useQuery<any[]>({
    queryKey: [`/api/parties/${partyId}/location-maps`],
    enabled: sidebarTab === "map" && !!partyId,
  });

  const { data: sceneThumbnails } = useQuery<Record<string, string>>({
    queryKey: [`/api/parties/${partyId}/scene-thumbnails`],
    queryFn: async () => {
      const res = await fetch(`/api/parties/${partyId}/scene-thumbnails`, { credentials: "include" });
      if (!res.ok) return {};
      const data = await res.json();
      return data.thumbnails ?? {};
    },
    enabled: sidebarTab === "map" && !!partyId,
    staleTime: 60000,
  });

  // Load messages — must complete before the auto-start effect can fire
  useEffect(() => {
    fetch(`/api/parties/${partyId}/messages`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMessages(data);
          // FR-002: first-turn = no prior GM message has been delivered (player-only
          // messages should not block the onboarding flow if the GM never replied)
          if (data.some((m: ChatMsg) => m.role === "gm")) setIsFirstTurn(false);
          const lastGm = [...data].reverse().find((m: ChatMsg) => m.role === "gm");
          const savedQa = lastGm?.metadata?.quickActions;
          if (Array.isArray(savedQa) && savedQa.length > 0) setQuickActions(savedQa);
          const savedTh = lastGm?.metadata?.turnHint;
          if (savedTh?.character) setTurnHint(savedTh);
          const savedMood = lastGm?.metadata?.sceneMood;
          if (typeof savedMood === "string" && savedMood.length > 0) setSceneMood(savedMood);

          const preRolled: Record<string, boolean> = {};
          const lastGmId = lastGm?.id;
          for (const m of data) {
            if (m.role !== "gm") continue;
            const diceReqs: any[] = m.metadata?.diceRequests ?? [];
            if (diceReqs.length === 0) continue;
            if (m.id === lastGmId) {
              const hasPlayerResponseAfter = data.some(
                (pm: ChatMsg) => pm.role === "player" && new Date(pm.createdAt) > new Date(m.createdAt)
              );
              if (hasPlayerResponseAfter) {
                diceReqs.forEach((_: any, i: number) => { preRolled[`${m.id}-${i}`] = true; });
              }
            } else {
              diceReqs.forEach((_: any, i: number) => { preRolled[`${m.id}-${i}`] = true; });
            }
          }
          if (Object.keys(preRolled).length > 0) setRolledPrompts(prev => ({ ...prev, ...preRolled }));
        }
        setMessagesLoaded(true);
      })
      .catch(() => setMessagesLoaded(true));
  }, [partyId]);

  // Fetch scene background when location changes
  const currentLocation = partyData?.worldState?.state?.currentLocation ?? "";
  const currentSceneTitle = partyData?.worldState?.state?.currentSceneTitle ?? "";
  const bgKey = currentSceneTitle || currentLocation;
  const bgKeyRef = useRef("");
  useEffect(() => {
    if (!currentLocation || !partyId) return;

    if (backgroundPollRef.current) {
      clearInterval(backgroundPollRef.current);
      backgroundPollRef.current = null;
    }

    const keyChanged = bgKey !== bgKeyRef.current;
    bgKeyRef.current = bgKey;

    const fetchBg = async () => {
      const res = await fetch(`/api/parties/${partyId}/scene-background`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.imageData && !data.pending) {
        setSceneBackground(data.imageData);
        setBackgroundPending(false);
        if (backgroundPollRef.current) {
          clearInterval(backgroundPollRef.current);
          backgroundPollRef.current = null;
        }
      } else if (data.imageData && data.pending) {
        setSceneBackground(data.imageData);
        setBackgroundPending(true);
      } else if (data.pending) {
        setBackgroundPending(true);
      }
    };

    if (keyChanged) {
      setBackgroundPending(true);
    }

    fetchBg();

    backgroundPollRef.current = setInterval(fetchBg, 6000);
    return () => {
      if (backgroundPollRef.current) {
        clearInterval(backgroundPollRef.current);
        backgroundPollRef.current = null;
      }
    };
  }, [bgKey, partyId]);


  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // WebSocket with auto-reconnect and heartbeat
  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    let closed = false;
    let reconnectDelay = 1000;

    function connect() {
      if (closed) return;
      const wsUrl = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`;
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        reconnectDelay = 1000;
        socket!.send(JSON.stringify({ type: "JOIN_PARTY", partyId }));
        heartbeatTimer = setInterval(() => {
          if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "PING" }));
          }
        }, 25000);
      };

      socket.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.type === "MESSAGE") {
          let wasNew = false;
          setMessages(prev => {
            const incoming = msg.message;
            const isDupe = prev.some(m => m.id === incoming.id);
            if (isDupe) return prev;
            wasNew = true;
            const isOwnOptimistic = incoming.role === "player" && incoming.userId === user?.id;
            const filtered = isOwnOptimistic ? prev.filter(m => !m.id.startsWith("opt-")) : prev;
            return [...filtered, incoming];
          });
          if (msg.message.role === "gm") {
            setIsFirstTurn(false);
            queryClient.invalidateQueries({ queryKey: [`/api/parties/${partyId}`] });
            queryClient.invalidateQueries({ queryKey: [`/api/parties/${partyId}/situations`] });
            queryClient.invalidateQueries({ queryKey: [`/api/parties/${partyId}/npcs`] });
            const wsQa = msg.message?.metadata?.quickActions;
            if (Array.isArray(wsQa) && wsQa.length > 0) setQuickActions(wsQa);
            const wsUpdates = msg.message?.metadata?.updates ?? [];
            const wsShop = wsUpdates.find((u: any) => u.type === "SHOP_OPENED");
            if (wsShop) {
              setShopData({ merchant_name: wsShop.merchant_name, shop_flavor: wsShop.shop_flavor ?? "", inventory: wsShop.inventory ?? [] });
              setShopTab("buy");
            }
            const wsNotice = wsUpdates.find((u: any) => u.type === "NOTICE_BOARD_OPENED");
            if (wsNotice) {
              setNoticeBoardData({ board_name: wsNotice.board_name, board_flavor: wsNotice.board_flavor ?? "", notices: wsNotice.notices ?? [] });
              setExpandedNotice(null);
            }
            const wsMood = msg.message?.metadata?.sceneMood;
            if (wsMood && ["exploration", "combat", "mystery", "romance", "leisure", "triumph", "stealth"].includes(wsMood)) {
              setSceneMood(wsMood);
              soundtrack.changeMood(wsMood as MoodType);
            }
          }
        } else if (msg.type === "STATE_UPDATE") {
          queryClient.invalidateQueries({ queryKey: [`/api/parties/${partyId}`] });
        } else if (msg.type === "TURN_HINT" && msg.turnHint) {
          setTurnHint(msg.turnHint);
        } else if (msg.type === "LEVEL_UP" && msg.levelUps) {
          const myLevelUp = msg.levelUps.find((lu: any) => {
            const myChar = members.find((m: any) => m.userId === user?.id)?.character;
            return myChar && lu.characterId === myChar.id;
          });
          if (myLevelUp) {
            setLevelUpData(myLevelUp);
            setStatPoints({ might: 0, agility: 0, endurance: 0, intellect: 0, will: 0, presence: 0 });
          }
        }
      };

      socket.onclose = () => {
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        if (!closed) {
          reconnectTimer = setTimeout(() => {
            reconnectDelay = Math.min(reconnectDelay * 1.5, 10000);
            connect();
          }, reconnectDelay);
        }
      };

      socket.onerror = () => {
        socket?.close();
      };
    }

    connect();

    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      socket?.close();
    };
  }, [partyId, user?.id]);

  // Start adventure only after messages have loaded and none exist yet
  useEffect(() => {
    if (messagesLoaded && isFirstTurn && partyData && !sending) {
      startAdventure();
    }
  }, [messagesLoaded, isFirstTurn, partyData]);

  // FR-002: Show WorldThreshold once on first session load (when no GM messages exist yet)
  useEffect(() => {
    if (!messagesLoaded || thresholdInitialized) return;
    if (isFirstTurn) setShowThreshold(true);
    setThresholdInitialized(true);
  }, [messagesLoaded, isFirstTurn, thresholdInitialized]);

  // FR-002: Show character hint pill at player turn 3, hide by turn 5
  useEffect(() => {
    if (playerTurnCount === 3 && !charHintDismissed) setShowCharHint(true);
    if (playerTurnCount >= 5) setShowCharHint(false);
  }, [playerTurnCount, charHintDismissed]);

  const startAdventure = useCallback(async () => {
    // FR-002: minimal trigger — the FIRST_SCENE_DIRECTOR in the system prompt
    // (gated server-side on no-prior-GM-message) carries all opening instructions now.
    await sendAction("*Begin the adventure.*", "Game Master");
  }, [partyId]);

  function toggleVoice() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast({ title: "Voice input not supported", description: "Try Chrome or Edge for voice input.", variant: "destructive" });
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (e: any) => {
      const transcript = Array.from(e.results as SpeechRecognitionResultList)
        .map((r: SpeechRecognitionResult) => r[0].transcript)
        .join("");
      setInput(transcript);
    };
    recognitionRef.current = recognition;
    recognition.start();
  }

  function clearStreamTimeout() {
    if (streamTimeoutRef.current) { clearTimeout(streamTimeoutRef.current); streamTimeoutRef.current = null; }
  }
  function resetStreamTimeout() {
    clearStreamTimeout();
    streamTimeoutRef.current = setTimeout(() => {
      setStalled(true);
      setIsStreaming(false);
      setSending(false);
      setStreamingContent("");
      abortRef.current?.abort();
      toast({ title: "Connection lost", description: "The GM response stalled. Tap retry to resend.", variant: "destructive" });
    }, 30000);
  }

  function retryLastMessage() {
    const last = lastSentRef.current;
    if (!last) return;
    setStalled(false);
    setMessages(prev => prev.filter(m => !m.id.startsWith("opt-")));
    sendAction(last.content, last.playerName, last.mode);
  }

  async function sendAction(content: string, playerName?: string, modeOverride?: "action" | "dialogue" | "ooc") {
    if (!content.trim() || sending) return;

    setSending(true);
    setStalled(false);
    setStreamingContent("");

    const name = playerName ?? partyData?.members?.find((m: any) => m.userId === user?.id)?.character?.name ?? "Adventurer";
    // System calls (startAdventure) always use "action" mode; modeOverride forces a specific mode
    const mode = modeOverride ?? (playerName ? "action" : inputMode);

    // Add optimistic player message (not for system gm calls)
    if (!playerName) {
      const optimistic: ChatMsg = {
        id: `opt-${Date.now()}`,
        role: "player",
        content,
        userId: user?.id,
        metadata: { playerName: name, msgType: mode },
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, optimistic]);
      setInput("");
    }

    lastSentRef.current = { content, playerName, mode };

    // FR-002: count only real player-driven turns (system startAdventure passes a playerName)
    if (!playerName) setPlayerTurnCount(prev => prev + 1);

    // OOC: simple POST, no streaming, no GM response
    if (mode === "ooc") {
      try {
        await fetch(`/api/parties/${partyId}/action`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, playerName: name, mode: "ooc" }),
        });
        // Real message comes in via WebSocket; strip the optimistic one
        setMessages(prev => prev.filter(m => !m.id.startsWith("opt-")));
      } catch {
        toast({ title: "Failed to send", variant: "destructive" });
      } finally {
        setSending(false);
      }
      return;
    }

    setIsStreaming(true);
    abortRef.current = new AbortController();
    resetStreamTimeout();

    try {
      const res = await fetch(`/api/parties/${partyId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, playerName: name, mode }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error("Request failed");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let buf = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        resetStreamTimeout();
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.type === "error") {
              clearStreamTimeout();
              setStalled(true);
              const errMsg = evt.error || "GM failed to respond. Tap retry to resend.";
              toast({ title: "Connection lost", description: errMsg, variant: "destructive" });
              setIsStreaming(false);
              setStreamingContent("");
              setSending(false);
              reader.cancel();
              return;
            } else if (evt.type === "chunk") {
              accumulated += evt.content;
              setStreamingContent(accumulated);
              // FR-002: signal threshold to dismiss on first non-empty GM chunk
              if (!gmHasStarted && evt.content) setGmHasStarted(true);
            } else if (evt.type === "dice_ready") {
              // Server has narrator dice prompts ready ~1–3s before the
              // chronicler pass finishes. Inject a "pending-gm" message so the
              // dice UI renders immediately. The real message arrives on
              // `done` and replaces this one (filter below strips pending-gm-*).
              const reqs: any[] = evt.diceRequests ?? [];
              const narr: string = evt.narrative ?? accumulated;
              if (reqs.length > 0 && narr) {
                const pendingId = `pending-gm-${Date.now()}`;
                setIsStreaming(false);
                setStreamingContent("");
                setMessages(prev => [
                  ...prev.filter(m => !m.id.startsWith("pending-gm-")),
                  { id: pendingId, role: "gm", content: narr, metadata: { diceRequests: reqs }, createdAt: new Date().toISOString() } as any,
                ]);
              }
            } else if (evt.type === "done") {
              clearStreamTimeout();
              lastSentRef.current = null;
              setStreamingContent("");
              setIsStreaming(false);
              // FR-002: belt-and-braces — also clear first-turn here in case the
              // websocket MESSAGE event is delayed or missed
              if (evt.message?.role === "gm") setIsFirstTurn(false);
              queryClient.invalidateQueries({ queryKey: [`/api/parties/${partyId}`] });
              queryClient.invalidateQueries({ queryKey: [`/api/parties/${partyId}/situations`] });
              queryClient.invalidateQueries({ queryKey: [`/api/parties/${partyId}/npcs`] });
              if (evt.message) {
                setMessages(prev => {
                  if (prev.find(m => m.id === evt.message.id)) return prev;
                  return [...prev.filter(m => !m.id.startsWith("opt-") && !m.id.startsWith("pending-gm-")), evt.message];
                });
              }
              const qa = evt.quickActions ?? evt.message?.metadata?.quickActions ?? [];
              if (qa.length > 0) setQuickActions(qa);
              const th = evt.turnHint ?? evt.message?.metadata?.turnHint ?? null;
              if (th) setTurnHint(th);
              const ups = evt.updates ?? evt.message?.metadata?.updates ?? [];
              const shopUpdate = ups.find((u: any) => u.type === "SHOP_OPENED");
              if (shopUpdate) {
                setShopData({ merchant_name: shopUpdate.merchant_name, shop_flavor: shopUpdate.shop_flavor ?? "", inventory: shopUpdate.inventory ?? [] });
                setShopTab("buy");
              }
              const noticeUpdate = ups.find((u: any) => u.type === "NOTICE_BOARD_OPENED");
              if (noticeUpdate) {
                setNoticeBoardData({ board_name: noticeUpdate.board_name, board_flavor: noticeUpdate.board_flavor ?? "", notices: noticeUpdate.notices ?? [] });
                setExpandedNotice(null);
              }
              const evtLevelUps = evt.levelUps ?? evt.message?.metadata?.levelUps ?? [];
              if (evtLevelUps.length > 0) {
                const myChar = members.find((m: any) => m.userId === user?.id)?.character;
                const myLU = evtLevelUps.find((lu: any) => myChar && lu.characterId === myChar.id);
                if (myLU) {
                  setLevelUpData(myLU);
                  setStatPoints({ might: 0, agility: 0, endurance: 0, intellect: 0, will: 0, presence: 0 });
                }
              }
              const mood = evt.sceneMood ?? evt.message?.metadata?.sceneMood;
              if (mood && ["exploration", "combat", "mystery", "romance", "leisure", "triumph", "stealth"].includes(mood)) {
                setSceneMood(mood);
                soundtrack.changeMood(mood as MoodType);
              }
            }
          } catch (_) {}
        }
      }
    } catch (e: any) {
      clearStreamTimeout();
      if (e.name !== "AbortError") {
        setStalled(true);
        const desc = e.message?.includes("Failed to fetch") || e.message === "Request failed"
          ? "The GM couldn't respond. Tap retry to resend."
          : (e.message || "The GM couldn't respond. Tap retry to resend.");
        toast({ title: "Connection lost", description: desc, variant: "destructive" });
        setIsStreaming(false);
        setStreamingContent("");
      }
    } finally {
      clearStreamTimeout();
      setSending(false);
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendAction(input);
    }
  }

  const party = partyData?.party;
  const members = partyData?.members ?? [];
  const campaign = partyData?.campaign;
  const myMember = members.find((m: any) => m.userId === user?.id);

  const usePhysicalDice = campaign?.physicalDice ?? false;

  const hasPendingDice = messages.some(m => {
    if (m.role !== "gm") return false;
    const diceReqs: any[] = m.metadata?.diceRequests ?? [];
    return diceReqs.some((_: any, i: number) => !rolledPrompts[`${m.id}-${i}`]);
  });

  async function triggerRoll(promptKey: string, req: any) {
    setRolledPrompts(prev => ({ ...prev, [promptKey]: true }));
    try {
      const res = await fetch("/api/dice/roll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          die: req.die ?? "d20",
          count: 1,
          modifier: req.modifier ?? 0,
          advantageState: req.advantage ?? "normal",
          label: req.purpose,
        }),
      });
      const data = await res.json();
      const total = data.total;
      const rolls = data.rolls?.join(", ") ?? total;
      const modStr = req.modifier > 0 ? `+${req.modifier}` : req.modifier < 0 ? `${req.modifier}` : "";
      const dcMatch = req.purpose?.match(/dc\s*(\d+)/i);
      const dc = dcMatch ? parseInt(dcMatch[1]) : null;
      const dcText = dc ? ` vs DC ${dc}` : "";
      const outcome = dc ? (total >= dc ? " — SUCCESS" : " — FAILURE") : "";
      sendAction(
        `[ROLL RESULT] ${req.character ?? "Character"} — ${req.purpose}: rolled ${total} [${rolls}] on ${req.die ?? "d20"}${modStr}${dcText}${outcome}`,
        undefined,
        "action"
      );
    } catch (_) {
      setRolledPrompts(prev => { const n = { ...prev }; delete n[promptKey]; return n; });
    }
  }

  const inCombat = sceneMood === "combat";

  const activeTurnDice = (() => {
    if (!turnHint?.character) return null;
    const target = turnHint.character.toLowerCase();
    for (let mi = messages.length - 1; mi >= 0; mi--) {
      const m = messages[mi];
      if (m.role !== "gm") continue;
      const reqs: any[] = m.metadata?.diceRequests ?? [];
      if (reqs.length === 0) continue;
      for (let i = 0; i < reqs.length; i++) {
        const promptKey = `${m.id}-${i}`;
        if (rolledPrompts[promptKey]) continue;
        const reqChar = (reqs[i].character ?? "").toLowerCase();
        if (reqChar === target) {
          return { msgId: m.id, idx: i, req: reqs[i], promptKey };
        }
      }
      break;
    }
    return null;
  })();

  const activeTurnSubject = (() => {
    if (!turnHint?.character) return null;
    const lc = turnHint.character.toLowerCase();
    if (myMember?.character?.name?.toLowerCase() === lc) {
      return { kind: "self" as const, name: myMember.character.name, portraitUrl: myMember.character.profilePicture || null, isMyTurn: true, controllable: true };
    }
    const otherMember = members.find((m: any) => m.character?.name?.toLowerCase() === lc);
    if (otherMember?.character) {
      return { kind: "ally" as const, name: otherMember.character.name, portraitUrl: otherMember.character.profilePicture || null, isMyTurn: false, controllable: false };
    }
    const npc = npcs.find((n: any) => n.name?.toLowerCase() === lc);
    if (npc) {
      const playerControlled = !!npc.isPartyMember && campaign?.npcControl === "player";
      return {
        kind: npc.isPartyMember ? "companion" as const : "enemy" as const,
        name: npc.name,
        portraitUrl: `/api/npcs/${npc.id}/portrait`,
        isMyTurn: false,
        controllable: playerControlled,
      };
    }
    return { kind: "unknown" as const, name: turnHint.character, portraitUrl: null, isMyTurn: false, controllable: false };
  })();

  const showCombatBanner = inCombat && !!turnHint && !!activeTurnSubject;

  const classColors: Record<string, string> = {
    fighter: "text-red-400", rogue: "text-emerald-400",
    wizard: "text-violet-400", cleric: "text-amber-400",
    ranger: "text-teal-400", paladin: "text-yellow-300",
    barbarian: "text-orange-400", bard: "text-rose-400",
  };

  function renderMessage(msg: ChatMsg) {
    const isGM = msg.role === "gm";
    const isSystem = msg.role === "system";
    const playerName = msg.metadata?.playerName ?? "Adventurer";

    if (isSystem) {
      return (
        <div key={msg.id} className="text-center py-2">
          <span className="text-xs text-muted-foreground/50 font-sans tracking-wide italic">{msg.content}</span>
        </div>
      );
    }

    if (isGM) {
      let narrative = msg.content;
      let diceRequests: any[] = msg.metadata?.diceRequests ?? [];
      try {
        const jsonMatch = msg.content.match(/```json\s*([\s\S]*?)\s*```/) ||
                          msg.content.match(/(\{[\s\S]*\})/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[1]);
          if (parsed.narrative) narrative = parsed.narrative;
          if (parsed.dice_requests?.length && !diceRequests.length) {
            diceRequests = parsed.dice_requests;
          }
        }
      } catch (_) {}
      narrative = narrative.replace(/\s*---[\s\S]*$/s, "");
      narrative = narrative.replace(/^\s*---\s*/, "");
      narrative = narrative.replace(/\n\n[\s\S]*$/s, "");
      narrative = narrative.replace(/\s+(?:What do you do\??|What's your (?:next )?move\??|How do you (?:respond|react|proceed)\??|What will you do\??|Do you .{5,80}\??)$/i, "");
      narrative = narrative.replace(/\s*Rolling to (?:determine|check|see|resolve)[\s\S]*$/i, "");
      narrative = narrative.replace(/\s*(?:Updating|Adding|Removing|Checking|Processing|Adjusting|Modifying|Applying|Granting|Recording)[\s\S]*?(?:inventory|equipment|stats?|gold|items?|loot|character|spoils|rewards?|changes?)[\s\S]*$/i, "");
      narrative = narrative.replace(/\s*(?:Stand by|One moment|Please wait|Hang tight|Just a moment|Working on|Hold on)[\s\S]*$/i, "");
      narrative = narrative.trim();

      return (
        <div key={msg.id} className="space-y-2" data-testid={`message-gm-${msg.id}`}>
          <div className="flex items-center gap-2">
            <Scroll className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="text-xs font-sans tracking-widest text-primary uppercase flex-1" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>The Chronicle</span>
          </div>
          <div className="narrative-bg rounded-md p-4 prose-fantasy text-foreground/90">
            <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-p:my-2">
              <p className="font-serif leading-relaxed text-foreground/85 my-1.5">{narrative}</p>
            </div>
          </div>
          {diceRequests.length > 0 && (() => {
            const firstUnrolledIdx = diceRequests.findIndex((_: any, i: number) => !rolledPrompts[`${msg.id}-${i}`]);
            return (
              <div className="space-y-1.5 mt-1">
                {diceRequests.map((req: any, i: number) => {
                  const promptKey = `${msg.id}-${i}`;
                  const alreadyRolled = !!rolledPrompts[promptKey];
                  const isNext = i === firstUnrolledIdx;
                  const isQueued = i > firstUnrolledIdx && firstUnrolledIdx >= 0;
                  const modStr = req.modifier > 0 ? `+${req.modifier}` : req.modifier < 0 ? `${req.modifier}` : "";
                  const advStr = req.advantage && req.advantage !== "normal" ? ` (${req.advantage})` : "";

                  if (isQueued) {
                    return (
                      <div key={i} className="flex items-center gap-2.5 bg-amber-950/10 border border-amber-800/15 rounded-md px-3 py-2 opacity-40" data-testid={`dice-prompt-${promptKey}`}>
                        <Dices className="w-4 h-4 text-amber-400/40 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-sans text-amber-200/50 font-semibold leading-tight">{req.purpose}</p>
                          <p className="text-xs text-muted-foreground/30 font-mono">{req.character} — {req.die ?? "d20"}{modStr}{advStr}</p>
                        </div>
                        <span className="text-xs text-muted-foreground/30 italic px-2">Queued</span>
                      </div>
                    );
                  }

                  return (
                    <div key={i} className={`flex items-center gap-2.5 rounded-md px-3 py-2 ${isNext ? "bg-amber-950/25 border border-amber-800/35" : "bg-amber-950/15 border border-amber-800/20"}`} data-testid={`dice-prompt-${promptKey}`}>
                      <Dices className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-sans text-amber-200/90 font-semibold leading-tight">{req.purpose}</p>
                        <p className="text-xs text-muted-foreground/60 font-mono">{req.character} — {req.die ?? "d20"}{modStr}{advStr}</p>
                      </div>
                      {alreadyRolled ? (
                        <span className="text-xs text-muted-foreground/40 italic px-2">Rolled ✓</span>
                      ) : usePhysicalDice ? (
                        <PhysicalDiceInput
                          promptKey={promptKey}
                          req={req}
                          modStr={modStr}
                          onSubmit={(total: number) => {
                            setRolledPrompts(prev => ({ ...prev, [promptKey]: true }));
                            const dcMatch = req.purpose?.match(/dc\s*(\d+)/i);
                            const dc = dcMatch ? parseInt(dcMatch[1]) : null;
                            const dcText = dc ? ` vs DC ${dc}` : "";
                            const outcome = dc ? (total >= dc ? " — SUCCESS" : " — FAILURE") : "";
                            sendAction(
                              `[ROLL RESULT] ${req.character ?? "Character"} — ${req.purpose}: rolled ${total} [physical dice] on ${req.die ?? "d20"}${modStr}${dcText}${outcome}`,
                              undefined,
                              "action"
                            );
                          }}
                        />
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-3 text-xs border-amber-700/50 text-amber-300 hover:bg-amber-900/30 hover:text-amber-200"
                          data-testid={`button-roll-${promptKey}`}
                          onClick={() => triggerRoll(promptKey, req)}
                        >
                          🎲 Roll
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      );
    }

    const msgType = msg.metadata?.msgType ?? "action";

    // OOC message — clearly marked out-of-character
    if (msgType === "ooc") {
      return (
        <div key={msg.id} className="text-center py-1.5" data-testid={`message-ooc-${msg.id}`}>
          <span className="text-sm font-sans text-muted-foreground italic bg-muted/60 rounded-md px-4 py-1.5 inline-block border border-border/50">
            (( <span className="text-foreground/70 not-italic font-semibold">{playerName}:</span> {msg.content} ))
          </span>
        </div>
      );
    }

    // Player message — look up the speaker's portrait from the party members list
    const speakerMember = members.find((m: any) => m.character?.name === playerName);
    const speakerPortrait = speakerMember?.character?.profilePicture ?? null;

    // Dialogue message — speech bubble style with quote marks
    if (msgType === "dialogue") {
      return (
        <div key={msg.id} className="flex gap-2.5" data-testid={`message-dialogue-${msg.id}`}>
          <div className="w-7 h-7 rounded-md flex-shrink-0 mt-0.5 overflow-hidden bg-secondary">
            {speakerPortrait ? (
              <img src={speakerPortrait} alt={playerName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <MessageCircle className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-sans tracking-wide mb-1 flex items-center gap-1" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
              <MessageCircle className="w-3 h-3 text-primary/60" /> {playerName}
            </p>
            <p className="font-serif text-foreground text-sm leading-relaxed italic border-l-2 border-primary/40 pl-3" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
              "{msg.content}"
            </p>
          </div>
        </div>
      );
    }

    return (
      <div key={msg.id} className="flex gap-2.5" data-testid={`message-player-${msg.id}`}>
        <div className="w-7 h-7 rounded-md flex-shrink-0 mt-0.5 overflow-hidden bg-secondary">
          {speakerPortrait ? (
            <img
              src={speakerPortrait}
              alt={playerName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Sword className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground font-sans tracking-wide mb-1" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>{playerName}</p>
          <p className="font-serif text-foreground text-sm leading-relaxed" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>{msg.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Sprint 08: post-session feedback modal — shown before leaving the campaign */}
      <SessionFeedback
        open={showFeedback}
        onClose={() => { setShowFeedback(false); navigate("/dashboard"); }}
        onSubmitted={() => { setShowFeedback(false); navigate("/dashboard"); }}
        partyId={party?.id ?? null}
        campaignId={campaign?.id ?? null}
      />

      {/* FR-002: Cinematic first-session overlay */}
      {showThreshold && (
        <WorldThreshold
          worldName={(campaign as any)?.worldName ?? ""}
          worldDescription={(campaign as any)?.worldDescription ?? ""}
          gmStarted={gmHasStarted}
          onDismiss={() => setShowThreshold(false)}
        />
      )}

      {/* FR-002: Character sheet nudge at player turn 3 */}
      {showCharHint && (
        <CharacterHintPill
          onDismiss={() => {
            setShowCharHint(false);
            setCharHintDismissed(true);
          }}
          onOpen={() => {
            setSidebarTab("sheet");
            setShowCharHint(false);
            setCharHintDismissed(true);
          }}
        />
      )}

      {/* Header */}
      <header className="flex-shrink-0 border-b border-border bg-card/80 backdrop-blur-sm z-40">
        <div className="flex items-center gap-3 px-4 h-12">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-menu">
                <Menu className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setShowFeedback(true)} className="text-destructive focus:text-destructive" data-testid="menu-leave-campaign">
                <LogOut className="w-4 h-4 mr-2" />
                Leave Campaign
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Scroll className="w-4 h-4 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="font-sans font-bold tracking-wider text-sm truncate">{campaign?.name ?? party?.name ?? "Adventure"}</p>
          </div>
          <div className="flex items-center gap-2">
            {members.slice(0, 3).map((m: any) => (
              <Tooltip key={m.id}>
                <TooltipTrigger>
                  <div className={`text-xs font-sans tracking-wide px-2 py-0.5 rounded bg-secondary ${classColors[m.character?.class] ?? ""}`}>
                    {m.character?.name?.split(" ")[0] ?? "?"}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {m.character?.name} · {m.character?.currentHp}/{m.character?.maxHp} HP{m.character?.maxMp > 0 ? ` · ${m.character?.currentMp}/${m.character?.maxMp} MP` : ""}
                </TooltipContent>
              </Tooltip>
            ))}
            {campaign?.ownerId === user?.id && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowSettings(p => !p)} data-testid="button-settings">
                <Settings className="w-4 h-4" />
              </Button>
            )}
            <SoundtrackControls soundtrack={soundtrack} />
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowCharacters(p => !p)} data-testid="button-toggle-chars">
              <Users className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {showSettings && campaign && (
        <ContentSettingsPanel
          campaign={campaign}
          onClose={() => setShowSettings(false)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: [`/api/parties/${partyId}`] });
            setShowSettings(false);
          }}
        />
      )}

      <div className="flex flex-1 overflow-hidden relative">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* World image fallback — always rendered when available; per-scene image layers on top */}
          {worldBackground && (
            <div
              className="absolute inset-0 z-0"
              style={{
                backgroundImage: `url(${worldBackground})`,
                backgroundSize: "cover",
                backgroundPosition: "center center",
                backgroundRepeat: "no-repeat",
              }}
              data-testid="img-world-background"
            >
              <div className="absolute inset-0 bg-background/65" />
            </div>
          )}
          {/* Scene background (per-location, layered above world image) */}
          {sceneBackground && (
            <div
              className="absolute inset-0 z-0"
              style={{
                backgroundImage: `url(${sceneBackground})`,
                backgroundSize: "cover",
                backgroundPosition: "center top",
                backgroundRepeat: "no-repeat",
                transition: "background-image 1.2s ease-in-out",
              }}
            >
              <div className="absolute inset-0 bg-background/60" />
              <button
                className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-background/50 hover:bg-background/80 text-muted-foreground hover:text-foreground transition-colors"
                title="Regenerate scene background"
                data-testid="btn-regen-bg"
                onClick={async () => {
                  setBackgroundPending(true);
                  try {
                    await apiRequest("POST", `/api/parties/${partyId}/scene-background/regenerate`);
                    if (backgroundPollRef.current) clearInterval(backgroundPollRef.current);
                    backgroundPollRef.current = setInterval(async () => {
                      const r = await fetch(`/api/parties/${partyId}/scene-background`);
                      if (!r.ok) return;
                      const d = await r.json();
                      if (d.imageData && !d.pending) {
                        setSceneBackground(d.imageData);
                        setBackgroundPending(false);
                        if (backgroundPollRef.current) { clearInterval(backgroundPollRef.current); backgroundPollRef.current = null; }
                      }
                    }, 5000);
                  } catch {}
                }}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${backgroundPending ? "animate-spin" : ""}`} />
              </button>
            </div>
          )}
          {/* Subtle shimmer while background is generating */}
          {backgroundPending && !sceneBackground && (
            <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-br from-primary/5 via-transparent to-primary/5 animate-pulse" />
          )}

          {/* Combat Turn Banner — prominent indicator of whose turn it is */}
          {showCombatBanner && activeTurnSubject && turnHint && (() => {
            const subj = activeTurnSubject;
            const needsMyAction = subj.controllable && !!activeTurnDice;
            const promptText = subj.isMyTurn && myMember?.character
              ? turnHint.prompt
                  .replace(new RegExp(`\\b${myMember.character.name}\\b`, "gi"), "you")
                  .replace(/\byou's\b/gi, "your")
                  .replace(/\byou is\b/gi, "you are")
                  .replace(/\byou sees\b/gi, "you see")
                  .replace(/\byou hears\b/gi, "you hear")
                  .replace(/\byou notices\b/gi, "you notice")
                  .replace(/\byou feels\b/gi, "you feel")
              : turnHint.prompt;
            const turnLabel =
              subj.kind === "self" ? "Your Turn"
              : subj.kind === "companion" ? `${subj.name}'s Turn — Companion`
              : subj.kind === "enemy" ? `${subj.name}'s Turn — Enemy`
              : subj.kind === "ally" ? `${subj.name}'s Turn`
              : `${subj.name}'s Turn`;
            const ringCls = needsMyAction || subj.isMyTurn
              ? "border-primary/70 bg-primary/15 ring-2 ring-primary/40 animate-pulse"
              : subj.kind === "enemy"
              ? "border-red-700/40 bg-red-950/30"
              : "border-border/60 bg-card/85";
            const labelCls = needsMyAction || subj.isMyTurn
              ? "text-primary"
              : subj.kind === "enemy"
              ? "text-red-300"
              : "text-foreground/80";
            const req = activeTurnDice?.req;
            const modStr = req ? (req.modifier > 0 ? `+${req.modifier}` : req.modifier < 0 ? `${req.modifier}` : "") : "";
            const advStr = req?.advantage && req.advantage !== "normal" ? ` (${req.advantage})` : "";
            return (
              <div
                className={`flex-shrink-0 z-20 border-b backdrop-blur-md px-4 py-2.5 ${ringCls}`}
                data-testid="combat-turn-banner"
                style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
              >
                <div className="max-w-3xl mx-auto flex items-center gap-3">
                  <div className={`relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0 border ${
                    needsMyAction || subj.isMyTurn ? "border-primary/70" : subj.kind === "enemy" ? "border-red-700/50" : "border-border/60"
                  } bg-secondary`}>
                    {subj.portraitUrl ? (
                      subj.kind === "companion" || subj.kind === "enemy" ? (
                        <AuthImg src={subj.portraitUrl} alt={subj.name} className="w-full h-full object-cover" />
                      ) : (
                        <img src={subj.portraitUrl} alt={subj.name} className="w-full h-full object-cover" />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {subj.kind === "enemy" ? (
                          <Skull className="w-5 h-5 text-red-400" />
                        ) : (
                          <Sword className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Sword className={`w-3.5 h-3.5 flex-shrink-0 ${
                        needsMyAction || subj.isMyTurn ? "text-primary" : subj.kind === "enemy" ? "text-red-400" : "text-muted-foreground"
                      }`} />
                      <span className={`font-sans font-bold tracking-wider uppercase text-xs sm:text-sm ${labelCls}`}>
                        {turnLabel}
                      </span>
                      <span className="text-[10px] font-sans tracking-widest uppercase text-muted-foreground/80 px-1.5 py-0.5 rounded bg-background/40 border border-border/40">
                        Combat
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm font-serif italic text-foreground/85 truncate mt-0.5" data-testid="text-turn-prompt">
                      {promptText}
                    </span>
                  </div>
                  {needsMyAction && req && (
                    usePhysicalDice ? (
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-mono text-amber-300/80 whitespace-nowrap">
                          {req.die ?? "d20"}{modStr}{advStr}
                        </span>
                        <PhysicalDiceInput
                          promptKey={activeTurnDice.promptKey}
                          req={req}
                          modStr={modStr}
                          onSubmit={(total: number) => {
                            setRolledPrompts(prev => ({ ...prev, [activeTurnDice.promptKey]: true }));
                            const dcMatch = req.purpose?.match(/dc\s*(\d+)/i);
                            const dc = dcMatch ? parseInt(dcMatch[1]) : null;
                            const dcText = dc ? ` vs DC ${dc}` : "";
                            const outcome = dc ? (total >= dc ? " — SUCCESS" : " — FAILURE") : "";
                            sendAction(
                              `[ROLL RESULT] ${req.character ?? "Character"} — ${req.purpose}: rolled ${total} [physical dice] on ${req.die ?? "d20"}${modStr}${dcText}${outcome}`,
                              undefined,
                              "action"
                            );
                          }}
                        />
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        className="flex-shrink-0 h-9 px-3 bg-primary text-primary-foreground hover:bg-primary/90 font-sans font-bold tracking-wide shadow-md"
                        data-testid="button-roll-active-turn"
                        disabled={sending || isStreaming}
                        onClick={() => triggerRoll(activeTurnDice.promptKey, req)}
                      >
                        <Dices className="w-4 h-4 mr-1.5" />
                        Roll {req.die ?? "d20"}{modStr}
                      </Button>
                    )
                  )}
                </div>
              </div>
            );
          })()}

          {/* Messages */}
          <ScrollArea className="flex-1 px-4 py-4 relative z-10">
            {messages.length === 0 && !isStreaming ? (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Scroll className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <p className="font-sans font-bold tracking-widest text-xl">THE CHRONICLE AWAITS</p>
                  <p className="text-muted-foreground font-serif italic mt-2">Your Game Master is preparing the scene...</p>
                </div>
                <div className="flex gap-1 items-center">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-5 max-w-3xl mx-auto">
                {messages
                  .filter(msg => !(msg.role === "gm" && /^\*.*\*$/.test((msg.content ?? "").trim())))
                  .map(renderMessage)}

                {/* Streaming GM message */}
                {isStreaming && streamingContent && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Scroll className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      <span className="text-xs font-sans tracking-widest text-primary uppercase" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>The Chronicle</span>
                      <div className="flex gap-1">
                        {[0, 1, 2].map(i => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                    </div>
                    <div className="narrative-bg rounded-md p-4">
                      <div className="prose prose-invert prose-sm max-w-none">
                        {(() => {
                          let text = streamingContent;
                          try {
                            const narrativeMatch = text.match(/"narrative"\s*:\s*"([\s\S]*?)(?:"|$)/);
                            if (narrativeMatch) text = narrativeMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
                          } catch (_) {}
                          text = text.replace(/\s*---[\s\S]*$/s, "");
                          text = text.replace(/^\s*---\s*/, "");
                          text = text.replace(/\n\n[\s\S]*$/s, "");
                          text = text.replace(/\s*Rolling to (?:determine|check|see|resolve)[\s\S]*$/i, "");
                          text = text.replace(/\s*(?:Updating|Adding|Removing|Checking|Processing|Adjusting|Modifying|Applying|Granting|Recording)[\s\S]*?(?:inventory|equipment|stats?|gold|items?|loot|character|spoils|rewards?|changes?)[\s\S]*$/i, "");
                          text = text.replace(/\s*(?:Stand by|One moment|Please wait|Hang tight|Just a moment|Working on|Hold on)[\s\S]*$/i, "");
                          text = text.trim();
                          return text ? <p className="font-serif leading-relaxed text-foreground/85 my-1">{text}</p> : null;
                        })()}
                        <span className="cursor-blink" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Turn Hint (compact, shown when no prominent combat banner is visible) */}
          {turnHint && !isStreaming && !sending && !showCombatBanner && (() => {
            const myChar = myMember?.character;
            const isMyTurn = myChar && turnHint.character.toLowerCase() === myChar.name.toLowerCase();
            return (
              <div className={`flex-shrink-0 px-4 relative z-10 border-t backdrop-blur-sm ${
                isMyTurn
                  ? "py-3 bg-primary/20 border-primary/40 animate-pulse"
                  : "py-2 bg-card/80 border-border/40"
              }`} style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
                <div className="max-w-3xl mx-auto flex items-center gap-3" data-testid="turn-hint-banner">
                  <div className={`flex items-center justify-center rounded-full flex-shrink-0 ${
                    isMyTurn ? "w-8 h-8 bg-primary text-primary-foreground" : "w-6 h-6 bg-muted-foreground/20 text-muted-foreground"
                  }`}>
                    <Sword className={isMyTurn ? "w-4 h-4" : "w-3 h-3"} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className={`font-sans font-bold tracking-wide uppercase ${
                      isMyTurn ? "text-sm text-primary" : "text-xs text-muted-foreground"
                    }`}>
                      {isMyTurn ? "Your Turn!" : `${turnHint.character}'s Turn`}
                    </span>
                    <span className="text-xs font-serif italic text-muted-foreground/80 truncate">
                      {isMyTurn && myChar
                        ? turnHint.prompt
                            .replace(new RegExp(`\\b${myChar.name}\\b`, "gi"), "you")
                            .replace(/\byou's\b/gi, "your")
                            .replace(/\byou is\b/gi, "you are")
                            .replace(/\byou sees\b/gi, "you see")
                            .replace(/\byou hears\b/gi, "you hear")
                            .replace(/\byou notices\b/gi, "you notice")
                            .replace(/\byou feels\b/gi, "you feel")
                        : turnHint.prompt}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Quick Actions */}
          {quickActions.length > 0 && !isStreaming && (
            <div className="flex-shrink-0 px-4 py-2 border-t border-border bg-card/90 backdrop-blur-sm relative z-10">
              <div className="flex gap-2 overflow-x-auto pb-1 max-w-3xl mx-auto">
                {quickActions.map(action => (
                  <button
                    key={action}
                    onClick={() => sendAction(action)}
                    disabled={sending || (hasPendingDice && !usePhysicalDice)}
                    data-testid={`button-quick-action`}
                    className="flex-shrink-0 text-xs font-serif italic text-foreground px-3 py-1.5 rounded-full border border-border/80 bg-background/60 hover:border-primary hover:bg-primary/10 hover:text-primary transition-all whitespace-nowrap"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div
            className="flex-shrink-0 border-t border-border bg-card/90 backdrop-blur-sm p-3 relative z-10"
            style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
          >
            <div className="max-w-3xl mx-auto space-y-2">
              {/* Mode selector */}
              <div className="flex gap-1.5 items-center">
                {([
                  { id: "action", label: "Act", icon: Sword, tip: "Perform an action — the GM narrates what happens" },
                  { id: "dialogue", label: "Say", icon: MessageCircle, tip: "Speak in character — NPCs will respond" },
                  /* Phase 4 — multiplayer reactivation */
                  ...((members?.length ?? 1) > 1
                    ? [{ id: "ooc" as const, label: "OOC", icon: Radio, tip: "Out of character — visible to party only, GM ignores" }]
                    : []),
                ] as const).map(m => (
                  <button
                    key={m.id}
                    onClick={() => setInputMode(m.id)}
                    data-testid={`button-mode-${m.id}`}
                    title={m.tip}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-sans transition-all border ${
                      inputMode === m.id
                        ? m.id === "ooc"
                          ? "bg-muted border-muted-foreground/40 text-muted-foreground"
                          : m.id === "dialogue"
                          ? "bg-primary/15 border-primary/50 text-primary"
                          : "bg-secondary border-border text-foreground"
                        : "border-transparent text-muted-foreground/60 hover:text-muted-foreground"
                    }`}
                  >
                    <m.icon className="w-3 h-3" />
                    {m.label}
                  </button>
                ))}
                <span className="text-xs text-muted-foreground/40 font-sans ml-1 hidden sm:inline">
                  {inputMode === "action" && "What do you do?"}
                  {inputMode === "dialogue" && "Speaking in character"}
                  {inputMode === "ooc" && "Out of character — party only"}
                </span>
              </div>

              {/* Textarea + buttons row */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    className={`w-full bg-input border rounded-md px-4 py-3 text-sm font-serif text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 resize-none transition-colors ${
                      inputMode === "dialogue"
                        ? "border-primary/40 focus:ring-primary/50 italic"
                        : inputMode === "ooc"
                        ? "border-muted-foreground/30 focus:ring-muted-foreground/30"
                        : "border-border focus:ring-ring"
                    }`}
                    placeholder={
                      hasPendingDice && !usePhysicalDice
                        ? "Roll the dice above before continuing..."
                        : inputMode === "dialogue"
                        ? `"What do you say aloud?" — your character speaks...`
                        : inputMode === "ooc"
                        ? "(( Out of character — visible to party, not the GM ))"
                        : "What do you do? (Shift+Enter for new line)"
                    }
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    style={{ minHeight: "44px", maxHeight: "120px" }}
                    disabled={isStreaming || (hasPendingDice && !usePhysicalDice)}
                    data-testid="input-action"
                  />
                </div>

                {/* Voice button */}
                <Button
                  variant={isListening ? "destructive" : "outline"}
                  size="icon"
                  onClick={toggleVoice}
                  disabled={isStreaming}
                  className={`h-11 w-11 flex-shrink-0 ${isListening ? "animate-pulse" : ""}`}
                  data-testid="button-voice"
                  title="Voice input"
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>

                {/* Send / Retry button */}
                {stalled && lastSentRef.current ? (
                  <Button
                    onClick={retryLastMessage}
                    size="icon"
                    className="h-11 w-11 flex-shrink-0 bg-destructive hover:bg-destructive/90"
                    data-testid="button-retry-action"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => sendAction(input)}
                    disabled={!input.trim() || sending || (hasPendingDice && !usePhysicalDice)}
                    size="icon"
                    className="h-11 w-11 flex-shrink-0"
                    data-testid="button-send-action"
                  >
                    {sending ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Character Panel (collapsible) */}
        {showCharacters && (
          <div className="absolute inset-0 z-30 sm:relative sm:inset-auto sm:z-auto sm:w-72 flex-shrink-0 border-l border-border bg-card/95 sm:bg-card/50 flex flex-col overflow-hidden">
            {/* Panel header with tabs */}
            <div className="flex-shrink-0 border-b border-border">
              <div className="flex items-center px-0.5 py-1.5 gap-0">
                {([
                  { id: "party", icon: Users, label: "Party" },
                  { id: "sheet", icon: BookOpen, label: "Sheet" },
                  { id: "inventory", icon: Package, label: "Bag" },
                  { id: "codex", icon: Scroll, label: "Codex" },
                  { id: "map", icon: MapPin, label: "Map" },
                  { id: "dice", icon: Dices, label: "Dice" },
                  { id: "log", icon: ScrollText, label: "Cast" },
                ] as const).map(tab => (
                  <Tooltip key={tab.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setSidebarTab(tab.id)}
                        data-testid={`button-sidebar-tab-${tab.id}`}
                        className={`flex items-center justify-center w-9 h-8 rounded transition-colors ${
                          sidebarTab === tab.id
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        }`}
                      >
                        <tab.icon className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">{tab.label}</TooltipContent>
                  </Tooltip>
                ))}
                <div className="ml-auto">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowCharacters(false)}>
                    <ChevronDown className="w-4 h-4 rotate-90" />
                  </Button>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 w-full">
              <div className="p-3 space-y-3 min-w-0 break-words">

                {/* PARTY TAB */}
                {sidebarTab === "party" && (() => {
                  const companions = npcs.filter((n: any) => n.isPartyMember);
                  return (
                    <div className="space-y-2">
                      {/* Player characters */}
                      {members.map((m: any) => {
                        const char = m.character;
                        if (!char) return null;
                        const hpPct = Math.round((char.currentHp / char.maxHp) * 100);
                        const stats = (char.stats as Record<string, number>) || {};
                        const isExpanded = expandedMember === char.id;
                        const isMe = m.userId === user?.id;
                        const items = (char.inventory as any[]) ?? [];
                        const abilities = (char.abilities as any[]) ?? [];
                        const equippedItems = items.filter((i: any) => i.equipped);
                        const rarityCol: Record<string, string> = {
                          common: "text-zinc-400", uncommon: "text-emerald-400",
                          rare: "text-blue-400", epic: "text-purple-400", legendary: "text-amber-400",
                        };
                        return (
                          <div key={m.id} className={`rounded-md border bg-card p-3 space-y-2 transition-colors ${isMe ? "border-primary/30" : "border-border"}`}>
                            <button
                              className="flex items-center gap-2 w-full text-left"
                              onClick={() => setExpandedMember(isExpanded ? null : char.id)}
                              data-testid={`button-expand-member-${char.id}`}
                            >
                              {char.profilePicture ? (
                                <img src={char.profilePicture} alt={char.name} className="w-8 h-8 rounded object-cover flex-shrink-0" />
                              ) : (
                                <Sword className={`w-4 h-4 flex-shrink-0 ${classColors[char.class] ?? "text-muted-foreground"}`} />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-sans font-bold text-sm tracking-wide truncate">{char.name}{isMe ? " (You)" : ""}</p>
                                <p className="text-xs text-muted-foreground capitalize">{char.race} {char.class}</p>
                              </div>
                              <Badge variant="secondary" className="text-xs flex-shrink-0">Lv.{char.level}</Badge>
                              <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                            </button>
                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Heart className="w-3 h-3 text-red-400" /> HP
                                </span>
                                <span className="text-xs font-sans font-bold">{char.currentHp}/{char.maxHp}</span>
                              </div>
                              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    hpPct > 50 ? "bg-emerald-500" : hpPct > 25 ? "bg-amber-500" : "bg-red-500"
                                  }`}
                                  style={{ width: `${hpPct}%` }}
                                />
                              </div>
                              {char.currentHp <= 0 && (
                                <div
                                  className="mt-1 text-[10px] font-sans tracking-widest uppercase text-red-300 bg-red-950/60 border border-red-500/40 rounded px-2 py-1 text-center animate-pulse"
                                  data-testid={`badge-downed-${char.id}`}
                                >
                                  ⚠ Downed — 0 HP
                                </div>
                              )}
                            </div>
                            {(char.maxMp ?? 0) > 0 && (
                              <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Zap className="w-3 h-3 text-blue-400" /> MP
                                  </span>
                                  <span className="text-xs font-sans font-bold" data-testid={`mp-${char.id}`}>{char.currentMp ?? 0}/{char.maxMp}</span>
                                </div>
                                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all bg-blue-500`}
                                    style={{ width: `${Math.round(((char.currentMp ?? 0) / char.maxMp) * 100)}%` }}
                                  />
                                </div>
                              </div>
                            )}
                            <div className="grid grid-cols-3 gap-1">
                              {[["MGT", "might"], ["AGI", "agility"], ["INT", "intellect"]].map(([label, key]) => {
                                const val = stats[key] ?? 10;
                                const mod = Math.floor((val - 10) / 2);
                                return (
                                  <div key={key} className="text-center">
                                    <p className="text-muted-foreground/60 text-xs">{label}</p>
                                    <p className="text-xs font-sans font-bold">{mod >= 0 ? `+${mod}` : mod}</p>
                                  </div>
                                );
                              })}
                            </div>
                            {((char.conditions as string[]) || []).length > 0 && (
                              <div className="flex gap-1 flex-wrap">
                                {(char.conditions as string[]).map((c: string) => (
                                  <Badge key={c} variant="destructive" className="text-xs">{c}</Badge>
                                ))}
                              </div>
                            )}

                            {isExpanded && (
                              <div className="space-y-3 pt-2 border-t border-border/60">
                                {/* Full Stats */}
                                <div>
                                  <p className="text-[10px] font-sans tracking-widest text-muted-foreground/60 uppercase mb-1.5">All Attributes</p>
                                  <div className="grid grid-cols-3 gap-1">
                                    {(["might", "agility", "endurance", "intellect", "will", "presence"] as const).map((key) => {
                                      const val = stats[key] ?? 10;
                                      const mod = Math.floor((val - 10) / 2);
                                      const labels: Record<string, string> = { might: "MGT", agility: "AGI", endurance: "END", intellect: "INT", will: "WIL", presence: "PRE" };
                                      return (
                                        <div key={key} className="text-center bg-secondary/40 rounded px-1 py-1">
                                          <p className="text-muted-foreground/60 text-[10px]">{labels[key]}</p>
                                          <p className="text-xs font-sans font-bold">{val} <span className="text-muted-foreground/50">({mod >= 0 ? `+${mod}` : mod})</span></p>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Equipped Gear */}
                                {equippedItems.length > 0 && (
                                  <div>
                                    <p className="text-[10px] font-sans tracking-widest text-muted-foreground/60 uppercase mb-1.5">Equipped</p>
                                    <div className="space-y-1">
                                      {equippedItems.map((item: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between text-xs">
                                          <span className={`font-serif ${rarityCol[item.rarity] ?? "text-foreground"}`}>{item.name}</span>
                                          <span className="text-muted-foreground/50 font-sans text-[10px]">
                                            {item.properties?.damage ?? (item.properties?.ac ? `AC ${item.properties.ac}${item.properties.ac_bonus ? `+${item.properties.ac_bonus}` : ""}` : "")}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Full Inventory */}
                                <div>
                                  <p className="text-[10px] font-sans tracking-widest text-muted-foreground/60 uppercase mb-1.5">Inventory ({items.length})</p>
                                  <div className="space-y-0.5 max-h-40 overflow-y-auto">
                                    {items.map((item: any, i: number) => (
                                      <div key={i} className="flex items-center justify-between text-xs py-0.5">
                                        <span className={`font-serif truncate mr-2 ${rarityCol[item.rarity] ?? "text-foreground/80"}`}>
                                          {item.qty > 1 ? `${item.qty}× ` : ""}{item.name}
                                          {item.equipped && <span className="text-primary/60 text-[9px] ml-1">✦</span>}
                                        </span>
                                        <span className="text-muted-foreground/40 font-sans text-[10px] capitalize flex-shrink-0">{item.type}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Abilities */}
                                {abilities.length > 0 && (
                                  <div>
                                    <p className="text-[10px] font-sans tracking-widest text-muted-foreground/60 uppercase mb-1.5">Abilities</p>
                                    <div className="space-y-1.5">
                                      {abilities.map((ab: any, i: number) => (
                                        <div key={i}>
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-sans font-semibold text-foreground">{ab.name}</span>
                                            {ab.source === "background" && (
                                              <span className="text-[9px] text-primary/50 font-sans">BG</span>
                                            )}
                                            {ab.recharge && ab.recharge !== "at-will" && (
                                              <span className="text-[9px] text-muted-foreground/40 font-sans">{RECHARGE_LABELS[ab.recharge as RechargeType] ?? ab.recharge}</span>
                                            )}
                                            {ab.usesMax > 0 && (
                                              <span className="text-[9px] text-muted-foreground/50 ml-auto">{ab.usesLeft}/{ab.usesMax}</span>
                                            )}
                                          </div>
                                          {ab.description && (
                                            <p className="text-[10px] text-muted-foreground/60 leading-snug mt-0.5">{ab.description}</p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Backstory snippet */}
                                {char.backstory && (
                                  <div>
                                    <p className="text-[10px] font-sans tracking-widest text-muted-foreground/60 uppercase mb-1">Backstory</p>
                                    <p className="text-[11px] font-serif text-muted-foreground/70 leading-snug italic line-clamp-4">{char.backstory}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* NPC Companions */}
                      {companions.length > 0 && (
                        <>
                          <p className="text-[10px] font-sans tracking-widest text-muted-foreground/50 uppercase pt-1 pb-0.5 border-t border-border flex items-center gap-1.5">
                            <Users className="w-3 h-3" /> NPC Companions
                          </p>
                          {companions.map((npc: any) => {
                            const npcExpanded = expandedMember === `npc-${npc.id}`;
                            return (
                              <div
                                key={npc.id}
                                data-testid={`card-companion-${npc.id}`}
                                className="rounded-md border border-amber-700/40 bg-amber-950/20 p-3 space-y-1.5"
                              >
                                <button
                                  className="flex items-center gap-2 w-full text-left cursor-pointer"
                                  onClick={() => setExpandedMember(npcExpanded ? null : `npc-${npc.id}`)}
                                  data-testid={`button-expand-companion-${npc.id}`}
                                >
                                  {npc.hasPortrait ? (
                                    <AuthImg
                                      src={`/api/npcs/${npc.id}/portrait`}
                                      alt={npc.name}
                                      className="w-8 h-8 rounded object-cover object-top flex-shrink-0 border border-amber-700/30 cursor-pointer hover:ring-1 hover:ring-amber-500/50 transition-all"
                                      onClick={(e) => { e.stopPropagation(); setExpandedPortrait({ name: npc.name, url: `/api/npcs/${npc.id}/portrait`, role: npc.role }); }}
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded bg-amber-950/40 border border-amber-700/30 flex items-center justify-center flex-shrink-0">
                                      <Users className="w-3.5 h-3.5 text-amber-500/60" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-sans font-bold text-sm tracking-wide truncate text-amber-200">{npc.name}</p>
                                    <p className="text-xs text-amber-400/70 italic truncate">{npc.role}</p>
                                  </div>
                                  <span className="text-[9px] px-1.5 py-0.5 rounded border border-amber-600/50 bg-amber-900/40 text-amber-400 font-sans tracking-wide uppercase flex-shrink-0">
                                    Companion
                                  </span>
                                  <ChevronDown className={`w-3.5 h-3.5 text-amber-500/50 transition-transform ${npcExpanded ? "rotate-180" : ""}`} />
                                </button>
                                {npc.description && (
                                  <p className="text-[11px] text-muted-foreground/80 leading-snug">{npc.description}</p>
                                )}
                                {npcExpanded && (
                                  <div className="space-y-2 pt-2 border-t border-amber-700/30">
                                    {npc.hasPortrait && (
                                      <AuthImg src={`/api/npcs/${npc.id}/portrait`} alt={npc.name} className="w-full rounded-md object-cover object-top border border-amber-700/30 max-h-48" />
                                    )}
                                    {/* Combat stats bar */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-[10px] font-sans px-1.5 py-0.5 rounded bg-amber-900/40 border border-amber-700/30 text-amber-300" data-testid={`text-npc-level-${npc.id}`}>
                                        Lv {npc.level ?? 1}
                                      </span>
                                      <span className="text-[10px] font-sans px-1.5 py-0.5 rounded bg-yellow-900/30 border border-yellow-700/30 text-yellow-300" data-testid={`text-npc-xp-${npc.id}`}>
                                        XP {npc.xp ?? 0}
                                      </span>
                                      <span className="text-[10px] font-sans px-1.5 py-0.5 rounded bg-red-900/30 border border-red-700/30 text-red-300" data-testid={`text-npc-hp-${npc.id}`}>
                                        HP {npc.currentHp ?? npc.maxHp ?? 10}/{npc.maxHp ?? 10}
                                      </span>
                                      <span className="text-[10px] font-sans px-1.5 py-0.5 rounded bg-blue-900/30 border border-blue-700/30 text-blue-300" data-testid={`text-npc-ac-${npc.id}`}>
                                        AC {npc.ac ?? 10}
                                      </span>
                                    </div>
                                    {/* Ability scores */}
                                    {npc.stats && Object.keys(npc.stats).length > 0 && (
                                      <div className="grid grid-cols-3 gap-1" data-testid={`stats-npc-${npc.id}`}>
                                        {[
                                          { key: "might", label: "MIG" },
                                          { key: "agility", label: "AGI" },
                                          { key: "endurance", label: "END" },
                                          { key: "intellect", label: "INT" },
                                          { key: "will", label: "WIL" },
                                          { key: "presence", label: "PRE" },
                                        ].map(({ key, label }) => {
                                          const val = (npc.stats as any)[key];
                                          if (val == null) return null;
                                          const mod = Math.floor((val - 10) / 2);
                                          return (
                                            <div key={key} className="text-center py-0.5 rounded bg-amber-950/30 border border-amber-800/20">
                                              <p className="text-[9px] text-amber-500/60 font-sans">{label}</p>
                                              <p className="text-xs font-sans font-bold text-amber-200">{val}</p>
                                              <p className="text-[9px] text-amber-400/50">{mod >= 0 ? `+${mod}` : mod}</p>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                    {/* Abilities */}
                                    {npc.abilities && (npc.abilities as any[]).length > 0 && (
                                      <div data-testid={`abilities-npc-${npc.id}`}>
                                        <p className="text-[10px] text-muted-foreground/50 font-sans uppercase mb-0.5">Abilities</p>
                                        {(npc.abilities as any[]).map((a: any, i: number) => (
                                          <div key={i} className="text-[11px] mb-0.5">
                                            <span className="font-sans font-semibold text-amber-300">{a.name}</span>
                                            {a.description && <span className="text-muted-foreground/60 ml-1">— {a.description}</span>}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {/* Inventory */}
                                    {npc.inventory && (npc.inventory as any[]).length > 0 && (
                                      <div data-testid={`inventory-npc-${npc.id}`}>
                                        <p className="text-[10px] text-muted-foreground/50 font-sans uppercase mb-0.5">Gear</p>
                                        {(npc.inventory as any[]).map((item: any, i: number) => (
                                          <div key={i} className="flex items-center gap-1 text-[11px]">
                                            <span className={`font-sans ${item.equipped ? "text-amber-200 font-semibold" : "text-muted-foreground/70"}`}>
                                              {item.name}
                                            </span>
                                            {item.equipped && <span className="text-[8px] text-amber-500/50 uppercase">eq</span>}
                                            {item.properties?.damage && <span className="text-[9px] text-red-400/60 ml-auto">{item.properties.damage}</span>}
                                            {item.properties?.ac && <span className="text-[9px] text-blue-400/60 ml-auto">AC {item.properties.ac}</span>}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {/* Relationship & notes */}
                                    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                                      <div>
                                        <p className="text-[10px] text-muted-foreground/50 font-sans uppercase">Relationship</p>
                                        <p className="text-xs font-sans font-semibold capitalize text-amber-300">{npc.relationship ?? "neutral"}</p>
                                      </div>
                                      {npc.lastSeen && (
                                        <div>
                                          <p className="text-[10px] text-muted-foreground/50 font-sans uppercase">First Met</p>
                                          <p className="text-xs font-serif text-muted-foreground/80">{npc.lastSeen}</p>
                                        </div>
                                      )}
                                    </div>
                                    {npc.notes && (
                                      <div>
                                        <p className="text-[10px] text-muted-foreground/50 font-sans uppercase">Notes</p>
                                        <p className="text-[11px] font-serif text-muted-foreground/70 leading-snug">{npc.notes}</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>
                  );
                })()}

                {/* INVENTORY TAB */}
                {sidebarTab === "inventory" && (() => {
                  const char = myMember?.character;
                  if (!char) return (
                    <p className="text-xs text-muted-foreground text-center py-8 font-serif italic">No character found.</p>
                  );
                  const items = (char.inventory as any[]) ?? [];
                  const typeOrder = ["weapon", "armor", "jewelry", "consumable", "tool", "treasure", "other"];
                  const typeIcons: Record<string, any> = {
                    weapon: Sword, armor: Shield, jewelry: Gem, consumable: Coffee,
                    tool: Wrench, treasure: Coins, other: Package,
                  };
                  const typeLabels: Record<string, string> = {
                    weapon: "Weapons", armor: "Armor", jewelry: "Jewelry", consumable: "Consumables",
                    tool: "Tools", treasure: "Valuables", other: "Misc",
                  };
                  const typeMap: Record<string, string> = {
                    weapon: "weapon", armor: "armor", jewelry: "jewelry", consumable: "consumable",
                    tool: "tool", treasure: "treasure", currency: "treasure",
                    accessory: "jewelry", ring: "jewelry", amulet: "jewelry", necklace: "jewelry",
                    bracelet: "jewelry", trinket: "jewelry", pendant: "jewelry", brooch: "jewelry",
                    circlet: "jewelry", crown: "jewelry", tiara: "jewelry",
                    wondrous: "jewelry", shell: "jewelry",
                    belt: "armor", cloak: "armor", cape: "armor",
                    boots: "armor", gloves: "armor", gauntlets: "armor",
                    helm: "armor", helmet: "armor", hat: "armor", headband: "armor",
                    key: "tool", document: "tool", map: "tool",
                    misc: "other", item: "other", resource: "other", material: "other",
                    artifact: "treasure", relic: "treasure", gem: "treasure", loot: "treasure",
                  };
                  const grouped: Record<string, { item: any; originalIndex: number }[]> = {};
                  items.forEach((item, idx) => {
                    const rawType = item.type ?? "other";
                    const t = typeMap[rawType] ?? "other";
                    if (!grouped[t]) grouped[t] = [];
                    grouped[t].push({ item, originalIndex: idx });
                  });

                  const toggleEquip = async (itemIndex: number, equipped: boolean) => {
                    try {
                      const resp = await fetch(`/api/characters/${char.id}/equip`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ itemIndex, equipped }),
                      });
                      if (!resp.ok) {
                        const err = await resp.json().catch(() => null);
                        toast({ title: err?.error ?? "Failed to equip", variant: "destructive" });
                        return;
                      }
                      queryClient.invalidateQueries({ queryKey: [`/api/parties/${partyId}`] });
                    } catch {
                      toast({ title: "Failed to update equipment", variant: "destructive" });
                    }
                  };

                  const getSlotHint = (item: any): string | null => {
                    if (item.type === "weapon") {
                      return item.properties?.two_handed ? "2 hands" : "1 hand";
                    }
                    if (item.type === "armor") {
                      const slot = item.properties?.slot;
                      if (slot) return slot;
                      if (item.properties?.ac_bonus) return "off-hand";
                      if (item.properties?.ac) return "body";
                    }
                    if (item.type === "jewelry" || item.type === "accessory" || item.type === "ring" || item.type === "amulet" || item.type === "necklace") {
                      const slot = item.properties?.slot;
                      if (slot) return slot;
                      if (item.type === "necklace" || item.type === "amulet") return "necklace";
                      if (item.type === "ring") return "ring";
                      return "accessory";
                    }
                    return null;
                  };

                  const formatProps = (item: any) => {
                    const p = item.properties;
                    if (!p || Object.keys(p).length === 0) return null;
                    const parts: string[] = [];
                    if (p.damage) parts.push(`${p.damage} dmg`);
                    if (p.bonus) parts.push(`+${p.bonus}`);
                    if (p.ac) parts.push(`AC ${p.ac}`);
                    if (p.ac_bonus) parts.push(`+${p.ac_bonus} AC`);
                    if (p.range) parts.push(`${p.range}ft`);
                    if (p.two_handed) parts.push("2H");
                    if (p.thrown) parts.push("thrown");
                    if (p.finesse) parts.push("finesse");
                    if (p.heal) parts.push(`heal ${p.heal}`);
                    if (p.focus) parts.push(`focus +${p.focus}`);
                    if (p.value) parts.push(`${p.value}gp`);
                    const extra = Object.entries(p)
                      .filter(([k]) => !["damage","bonus","ac","ac_bonus","range","two_handed","thrown","finesse","heal","focus","value","slot"].includes(k))
                      .map(([k, v]) => `${k}: ${v}`);
                    parts.push(...extra);
                    return parts.length > 0 ? parts.join(" · ") : null;
                  };

                  const equippableTypes = new Set(["weapon", "armor", "jewelry", "accessory", "ring", "amulet", "necklace", "bracelet", "trinket", "wondrous", "shell", "pendant", "brooch", "circlet", "crown", "tiara", "belt", "cloak", "cape", "boots", "gloves", "gauntlets", "helm", "helmet", "hat", "headband"]);
                  const equippableCategories = new Set(["weapon", "armor", "jewelry"]);
                  const canEquip = (item: any) => {
                    if (equippableTypes.has(item.type)) return true;
                    const mappedType = typeMap[item.type ?? "other"] ?? "other";
                    return equippableCategories.has(mappedType);
                  };

                  const rarityColors: Record<string, string> = {
                    common: "text-zinc-400 border-zinc-500/30 bg-zinc-500/10",
                    uncommon: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
                    rare: "text-blue-400 border-blue-500/30 bg-blue-500/10",
                    epic: "text-purple-400 border-purple-500/30 bg-purple-500/10",
                    legendary: "text-amber-400 border-amber-500/30 bg-amber-500/10",
                  };

                  const rarityBorder: Record<string, string> = {
                    common: "",
                    uncommon: "border-l-2 border-l-emerald-500/50",
                    rare: "border-l-2 border-l-blue-500/50",
                    epic: "border-l-2 border-l-purple-500/50",
                    legendary: "border-l-2 border-l-amber-500/60",
                  };

                  return (
                    <div className="space-y-3">
                      {/* Character header */}
                      <div className="flex items-center gap-2 pb-1 border-b border-border">
                        {char.profilePicture ? (
                          <img src={char.profilePicture} alt={char.name} className="w-8 h-8 rounded object-cover" />
                        ) : (
                          <Package className="w-4 h-4 text-primary" />
                        )}
                        <div>
                          <p className="text-sm font-sans font-bold">{char.name}</p>
                          <p className="text-xs text-muted-foreground">{items.length} item{items.length !== 1 ? "s" : ""}</p>
                        </div>
                      </div>

                      {items.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-6 font-serif italic">Your bag is empty.</p>
                      )}

                      {typeOrder.filter(t => grouped[t]?.length).map(type => {
                        const Icon = typeIcons[type] ?? Package;
                        return (
                          <div key={type} className="space-y-1.5">
                            <p className="text-xs font-sans tracking-widest text-muted-foreground uppercase flex items-center gap-1.5">
                              <Icon className="w-3 h-3 text-primary" /> {typeLabels[type]}
                            </p>
                            {grouped[type].map(({ item, originalIndex }) => {
                              const props = formatProps(item);
                              const isEquipped = !!item.equipped;
                              const equipable = canEquip(item);
                              const rarity = item.rarity ?? (equipable ? "common" : null);
                              const rBorder = rarity ? (rarityBorder[rarity] ?? "") : "";
                              return (
                                <div
                                  key={originalIndex}
                                  data-testid={`item-inventory-${originalIndex}`}
                                  className={`rounded px-2.5 py-2 ${rBorder} ${isEquipped ? "bg-primary/10 border border-primary/30" : "bg-secondary/30"}`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <p className="text-sm font-sans font-medium leading-tight">{item.name}</p>
                                        {rarity && rarity !== "common" && (
                                          <span className={`text-[9px] font-sans font-bold uppercase tracking-wider px-1 py-0 rounded border ${rarityColors[rarity] ?? rarityColors.common}`} data-testid={`badge-rarity-${originalIndex}`}>
                                            {rarity}
                                          </span>
                                        )}
                                        {isEquipped && (
                                          <Badge variant="default" className="text-[10px] px-1 py-0 h-4 bg-primary/80" data-testid={`badge-equipped-${originalIndex}`}>E</Badge>
                                        )}
                                      </div>
                                      {item.description && (
                                        <p className="text-[10px] text-muted-foreground/70 italic mt-0.5 leading-snug break-words">{item.description}</p>
                                      )}
                                      {props && (
                                        <p className="text-xs text-muted-foreground mt-0.5 break-words">{props}</p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                                      {item.qty > 1 && (
                                        <span className="text-xs font-sans font-bold text-primary">x{item.qty}</span>
                                      )}
                                      {equipable && (() => {
                                        const slotHint = getSlotHint(item);
                                        return (
                                          <div className="flex items-center gap-1">
                                            {slotHint && !isEquipped && (
                                              <span className="text-[9px] text-muted-foreground/40 font-sans">{slotHint}</span>
                                            )}
                                            <button
                                              data-testid={`btn-equip-${originalIndex}`}
                                              onClick={() => toggleEquip(originalIndex, !isEquipped)}
                                              className={`text-[10px] font-sans font-medium px-1.5 py-0.5 rounded transition-colors ${
                                                isEquipped
                                                  ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                                  : "bg-primary/20 text-primary hover:bg-primary/30"
                                              }`}
                                            >
                                              {isEquipped ? "Unequip" : "Equip"}
                                            </button>
                                          </div>
                                        );
                                      })()}
                                      {/* LR-012: Drop button. Hidden for the Coin Pouch and equipped gear. */}
                                      {!isEquipped && !/^coin\s*pouch/i.test(item.name || "") && (
                                        <button
                                          data-testid={`btn-drop-${originalIndex}`}
                                          onClick={async () => {
                                            if (!confirm(`Drop ${item.name}?`)) return;
                                            try {
                                              const resp = await fetch(`/api/characters/${char.id}/drop-item`, {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ itemIndex: originalIndex }),
                                              });
                                              if (!resp.ok) {
                                                const err = await resp.json().catch(() => ({}));
                                                toast({ title: "Couldn't drop item", description: err.error || "Try again.", variant: "destructive" });
                                                return;
                                              }
                                              queryClient.invalidateQueries({ queryKey: ["/api/parties", partyId, "members"] });
                                              queryClient.invalidateQueries({ queryKey: [`/api/characters/${char.id}`] });
                                            } catch {
                                              toast({ title: "Couldn't drop item", variant: "destructive" });
                                            }
                                          }}
                                          className="text-[10px] font-sans font-medium px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground hover:bg-red-500/20 hover:text-red-400 transition-colors"
                                          title="Drop item"
                                        >
                                          Drop
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}

                      {/* Abilities */}
                      {((char.abilities as any[]) ?? []).length > 0 && (
                        <div className="space-y-1.5 pt-1 border-t border-border">
                          <p className="text-xs font-sans tracking-widest text-muted-foreground uppercase flex items-center gap-1.5">
                            <Zap className="w-3 h-3 text-primary" /> Abilities
                          </p>
                          {(char.abilities as any[]).map((ab: any, i: number) => (
                            <div key={i} className="rounded bg-secondary/30 px-2.5 py-2">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-sans font-medium">{ab.name}</p>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  {ab.recharge && ab.recharge !== "at-will" && (
                                    <span className="text-[9px] text-muted-foreground/50 font-sans">{RECHARGE_LABELS[ab.recharge as RechargeType] ?? ab.recharge}</span>
                                  )}
                                  {ab.usesMax > 0 && (
                                    <div className="flex gap-0.5">
                                      {Array.from({ length: ab.usesMax }).map((_, j) => (
                                        <div key={j} className={`w-2 h-2 rounded-full ${j < ab.usesLeft ? "bg-primary" : "bg-secondary"}`} />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {ab.description && (
                                <p className="text-xs text-muted-foreground mt-0.5 leading-snug break-words">{ab.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* MAP TAB */}
                {sidebarTab === "map" && (() => {
                  try {
                  const ws = partyData?.worldState?.state ?? {};
                  const locations: any[] = ws.locations ?? [];
                  const currentLocation: string = ws.currentLocation ?? "";
                  const members: any[] = partyData?.members ?? [];
                  const sitMap = new Map(situations.map((s: any) => [s.characterId, s]));
                  return (
                    <div className="space-y-3">

                      {/* Party Status — who's where */}
                      {members.length > 0 && (
                        <div>
                          <p className="text-xs font-sans tracking-widest text-muted-foreground uppercase flex items-center gap-1.5 pb-2">
                            <Users className="w-3 h-3 text-primary" /> Party Status
                          </p>
                          <div className="space-y-2">
                            {members.map((m: any) => {
                              const char = m.character;
                              if (!char) return null;
                              const sit = sitMap.get(char.id);
                              const companions: string[] = (sit?.companions ?? []).filter((n: string) => n !== char.name);
                              return (
                                <div key={char.id} className="rounded-md border border-border bg-card/60 px-2.5 py-2" data-testid={`status-character-${char.id}`}>
                                  <div className="flex items-center gap-2 mb-1">
                                    {char.profilePicture ? (
                                      <img src={char.profilePicture} alt={char.name} className="w-5 h-5 rounded-sm object-cover flex-shrink-0" />
                                    ) : (
                                      <div className="w-5 h-5 rounded-sm bg-secondary flex items-center justify-center flex-shrink-0">
                                        <Sword className="w-2.5 h-2.5 text-muted-foreground" />
                                      </div>
                                    )}
                                    <span className="text-xs font-sans font-semibold text-foreground truncate">{char.name}</span>
                                  </div>
                                  {sit ? (
                                    <>
                                      <p className="text-xs font-sans text-primary/80 flex items-center gap-1 mb-0.5">
                                        <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                                        <span className="truncate">{sit.location}</span>
                                      </p>
                                      {sit.situation && (
                                        <p className="text-xs font-serif text-muted-foreground leading-snug italic break-words">{sit.situation}</p>
                                      )}
                                      {companions.length > 0 && (
                                        <p className="text-xs font-sans text-muted-foreground/60 mt-0.5">
                                          With: {companions.join(", ")}
                                        </p>
                                      )}
                                    </>
                                  ) : (
                                    <p className="text-xs font-serif text-muted-foreground/50 italic">Situation unknown</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between border-t border-border pt-2">
                        <p className="text-xs font-sans tracking-widest text-muted-foreground uppercase flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-primary" /> Journey Map
                        </p>
                      </div>

                      {locations.length === 0 ? (
                        <div className="text-center py-8">
                          <MapPin className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                          <p className="text-xs text-muted-foreground font-serif italic">
                            No locations discovered yet.
                          </p>
                        </div>
                      ) : (() => {
                        const thumbs: Record<string, string> = sceneThumbnails ?? {};

                        const SETTLEMENT_KEYWORDS = /town|city|village|hamlet|settlement|haven|castle|palace|fortress|keep|citadel|tower/i;
                        const MINOR_KEYWORDS = /tavern|inn|pub|shop|market|bazaar|merchant|store|temple|church|shrine|gate|wall|mill|farm|camp|dock|pier|wharf/i;

                        interface HierarchyNode {
                          loc: any;
                          children: HierarchyNode[];
                        }

                        const regionMap: Record<string, any[]> = {};
                        locations.forEach((loc: any) => {
                          const r = loc.region || "Unknown Lands";
                          if (!regionMap[r]) regionMap[r] = [];
                          regionMap[r].push(loc);
                        });

                        const buildRegionHierarchy = (locs: any[]): HierarchyNode[] => {
                          const majors: HierarchyNode[] = [];
                          const minors: any[] = [];
                          const rest: any[] = [];

                          for (const loc of locs) {
                            const n = (loc.name || "").toLowerCase();
                            if (SETTLEMENT_KEYWORDS.test(n)) {
                              majors.push({ loc, children: [] });
                            } else if (MINOR_KEYWORDS.test(n)) {
                              minors.push(loc);
                            } else {
                              rest.push(loc);
                            }
                          }

                          const getWords = (name: string) => name.toLowerCase().split(/[\s,]+/).filter((w: string) => w.length > 2 && !["the","a","an","of","by","to","in","on","at","near","old"].includes(w));
                          const tryGroup = (loc: any): boolean => {
                            const locWords = getWords(loc.name);
                            for (const major of majors) {
                              const majorWords = getWords(major.loc.name);
                              if (locWords.some((w: string) => majorWords.includes(w))) {
                                major.children.push({ loc, children: [] });
                                return true;
                              }
                            }
                            return false;
                          };

                          const ungroupedMinors: any[] = [];
                          for (const m of minors) {
                            if (!tryGroup(m)) ungroupedMinors.push(m);
                          }
                          const ungroupedRest: any[] = [];
                          for (const r of rest) {
                            if (!tryGroup(r)) ungroupedRest.push(r);
                          }

                          const result: HierarchyNode[] = [...majors];
                          for (const loc of [...ungroupedMinors, ...ungroupedRest]) {
                            result.push({ loc, children: [] });
                          }
                          return result;
                        };

                        const regionNames = Object.keys(regionMap);
                        const currentRegion = regionNames.find(r => regionMap[r].some((l: any) => l.name === currentLocation));
                        const autoExpanded = new Set(expandedRegions);
                        if (currentRegion) autoExpanded.add(currentRegion);
                        if (regionNames.length === 1) autoExpanded.add(regionNames[0]);

                        const findSceneImage = (locName: string, locTitle?: string) => {
                          if (locTitle && thumbs[locTitle]) return thumbs[locTitle];
                          if (thumbs[locName]) return thumbs[locName];
                          return null;
                        };

                        const renderLocationCard = (loc: any, depth: number) => {
                          const isCurrent = loc.name === currentLocation;
                          const isRumored = loc.rumored === true && !isCurrent;
                          const sceneImg = isRumored ? null : findSceneImage(loc.name, loc.title);
                          return (
                            <div
                              key={loc.name}
                              data-testid={`map-location-${loc.name}`}
                              className={`rounded-md border px-2.5 py-2 ${
                                isCurrent
                                  ? "border-primary/50 bg-primary/5"
                                  : isRumored
                                    ? "border-dashed border-border/60 bg-card/30"
                                    : "border-border bg-card/60"
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                {sceneImg ? (
                                  <button
                                    onClick={() => setExpandedSceneImage({ name: loc.name, imageData: sceneImg })}
                                    className="flex-shrink-0 w-10 h-10 rounded overflow-hidden border border-border/60 hover:border-primary/50 transition-colors cursor-pointer"
                                    data-testid={`scene-thumb-${loc.name}`}
                                    title={`View ${loc.name}`}
                                  >
                                    <img src={sceneImg} alt={loc.name} className="w-full h-full object-cover" />
                                  </button>
                                ) : (
                                  <div className={`flex-shrink-0 w-10 h-10 rounded ${isRumored ? "bg-muted/10 border border-dashed border-border/40" : "bg-muted/30 border border-border/40"} flex items-center justify-center`}>
                                    {loc.threat ? (
                                      <Skull className="w-4 h-4 text-red-400/60" />
                                    ) : (
                                      <MapPin className={`w-4 h-4 ${isCurrent ? "text-primary/60" : isRumored ? "text-amber-400/50" : "text-muted-foreground/30"}`} />
                                    )}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <p className={`text-xs font-sans font-semibold leading-tight truncate ${isCurrent ? "text-primary" : isRumored ? "text-muted-foreground italic" : "text-foreground"}`}>
                                      {loc.name}
                                    </p>
                                    {isCurrent ? (
                                      <span className="text-[10px] font-sans text-primary/70 flex-shrink-0 bg-primary/10 px-1.5 rounded">here</span>
                                    ) : isRumored ? (
                                      <div className="flex items-center gap-1 flex-shrink-0">
                                        <span className="text-[10px] font-sans text-amber-300/80 flex-shrink-0 border border-dashed border-amber-700/50 bg-amber-950/20 px-1.5 rounded" data-testid={`badge-rumored-${loc.name}`}>rumored</span>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <button
                                              data-testid={`pursue-lead-${loc.name}`}
                                              onClick={() => sendAction(`[ACTION] Let's investigate ${loc.name}.`)}
                                              className="p-0.5 rounded hover:bg-amber-900/30 text-amber-400/60 hover:text-amber-300 transition-colors"
                                            >
                                              <Target className="w-3 h-3" />
                                            </button>
                                          </TooltipTrigger>
                                          <TooltipContent side="left" className="text-xs">Pursue this lead</TooltipContent>
                                        </Tooltip>
                                      </div>
                                    ) : (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <button
                                            data-testid={`fast-travel-${loc.name}`}
                                            onClick={() => sendAction(`[ACTION] I travel to ${loc.name}.`)}
                                            className="flex-shrink-0 p-0.5 rounded hover:bg-primary/10 text-muted-foreground/50 hover:text-primary transition-colors"
                                          >
                                            <Navigation className="w-3 h-3" />
                                          </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="text-xs">Travel to {loc.name}</TooltipContent>
                                      </Tooltip>
                                    )}
                                  </div>
                                  {loc.title && loc.title !== loc.name && (
                                    <p className="text-xs text-muted-foreground font-serif italic mt-0.5 leading-tight">{loc.title}</p>
                                  )}
                                  {loc.threat && (
                                    <p className="text-xs text-red-400 mt-0.5 flex items-start gap-1">
                                      <Skull className="w-2.5 h-2.5 flex-shrink-0 mt-0.5" /> <span className="break-words">{loc.threat}</span>
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 mt-1">
                                    <p className="text-[10px] text-muted-foreground/40">
                                      {isRumored
                                        ? `Heard on turn ${loc.mentionedTurn ?? "?"}`
                                        : `Turn ${loc.firstVisitedTurn ?? "?"}`}
                                    </p>
                                    {savedLocationMaps?.some((m: any) => m.locationName === loc.name) ? (
                                      <button
                                        onClick={() => setViewingLocationMap(loc.name)}
                                        className="text-[10px] text-primary/70 hover:text-primary flex items-center gap-0.5 transition-colors"
                                        data-testid={`view-location-map-${loc.name}`}
                                      >
                                        <MapIcon className="w-2.5 h-2.5" /> Map
                                      </button>
                                    ) : (
                                      <button
                                        onClick={async () => {
                                          await apiRequest("POST", `/api/parties/${partyId}/location-maps/${encodeURIComponent(loc.name)}/generate`);
                                          queryClient.invalidateQueries({ queryKey: [`/api/parties/${partyId}/location-maps`] });
                                          setViewingLocationMap(loc.name);
                                        }}
                                        className="text-[10px] text-muted-foreground/50 hover:text-primary flex items-center gap-0.5 transition-colors"
                                        data-testid={`generate-location-map-${loc.name}`}
                                      >
                                        <MapIcon className="w-2.5 h-2.5" /> Map
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        };

                        return (
                          <div className="space-y-1.5">
                            {regionNames.map((regionName) => {
                              const locs = regionMap[regionName];
                              const isExpanded = autoExpanded.has(regionName) || expandedRegions.has(regionName);
                              const hasCurrentLoc = locs.some((l: any) => l.name === currentLocation);
                              const hierarchy = buildRegionHierarchy(locs);

                              return (
                                <div key={regionName} data-testid={`map-region-${regionName}`}>
                                  <button
                                    data-testid={`toggle-region-${regionName}`}
                                    onClick={() => {
                                      setExpandedRegions(prev => {
                                        const next = new Set(prev);
                                        if (next.has(regionName)) next.delete(regionName);
                                        else next.add(regionName);
                                        return next;
                                      });
                                    }}
                                    className={`w-full flex items-center gap-1.5 py-1 px-1 rounded text-left hover:bg-muted/40 transition-colors ${hasCurrentLoc ? "text-primary" : "text-muted-foreground"}`}
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="w-3 h-3 flex-shrink-0" />
                                    ) : (
                                      <ChevronRight className="w-3 h-3 flex-shrink-0" />
                                    )}
                                    <MapPin className={`w-3 h-3 flex-shrink-0 ${hasCurrentLoc ? "text-primary" : "text-muted-foreground/50"}`} />
                                    <span className="text-xs font-sans font-semibold tracking-wide uppercase truncate">{regionName}</span>
                                    <span className="text-xs text-muted-foreground/40 ml-auto flex-shrink-0">{locs.length}</span>
                                  </button>

                                  {isExpanded && (
                                    <div className="relative ml-3 pl-3 border-l border-border/40">
                                      <div className="space-y-1.5 py-1">
                                        {hierarchy.map((node) => (
                                          <div key={node.loc.name}>
                                            {renderLocationCard(node.loc, 0)}
                                            {node.children.length > 0 && (
                                              <div className="relative ml-4 pl-3 border-l border-border/30 space-y-1.5 py-1">
                                                {node.children.map((child) => (
                                                  <div key={child.loc.name}>
                                                    {renderLocationCard(child.loc, 1)}
                                                    {child.children.length > 0 && (
                                                      <div className="relative ml-4 pl-3 border-l border-border/20 space-y-1.5 py-1">
                                                        {child.children.map((grandchild) => renderLocationCard(grandchild.loc, 2))}
                                                      </div>
                                                    )}
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  );
                  } catch (err) {
                    console.error("Map tab render error:", err);
                    return (
                      <div className="text-center py-8">
                        <MapPin className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground font-serif italic">Map could not be loaded.</p>
                      </div>
                    );
                  }
                })()}

                {/* CODEX TAB */}
                {sidebarTab === "codex" && (() => {
                  const ws: any = partyData?.worldState?.state ?? {};
                  const recipes: any[] = ws.recipes ?? [];
                  const char = myMember?.character;
                  const inventory: any[] = (char?.inventory as any[]) ?? [];

                  const countInInventory = (ingredientName: string) => {
                    return inventory
                      .filter((item: any) => item.name?.toLowerCase().includes(ingredientName.toLowerCase()))
                      .reduce((sum: number, item: any) => sum + (item.qty ?? 1), 0);
                  };

                  return (
                    <div className="space-y-3">
                      <p className="text-xs font-sans tracking-widest text-muted-foreground uppercase flex items-center gap-1.5 pb-1">
                        <Scroll className="w-3 h-3 text-primary" /> Codex
                      </p>

                      {recipes.length === 0 ? (
                        <div className="text-center py-8">
                          <Scroll className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                          <p className="text-xs text-muted-foreground font-serif italic">
                            No recipes discovered yet.
                          </p>
                          <p className="text-xs text-muted-foreground/50 mt-1">
                            Discover spells, enchantments, and crafting recipes during your adventure.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {recipes.map((recipe: any, idx: number) => {
                            const allCollected = recipe.ingredients.every((ing: any) =>
                              countInInventory(ing.name) >= (ing.qty ?? 1)
                            );
                            const collectedCount = recipe.ingredients.filter((ing: any) =>
                              countInInventory(ing.name) >= (ing.qty ?? 1)
                            ).length;

                            return (
                              <div
                                key={idx}
                                data-testid={`codex-recipe-${idx}`}
                                className={`rounded-md border px-3 py-2.5 ${
                                  allCollected
                                    ? "border-emerald-500/50 bg-emerald-500/5"
                                    : "border-border bg-card/60"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className={`text-xs font-sans font-bold leading-tight ${allCollected ? "text-emerald-400" : "text-foreground"}`}>
                                      {recipe.name}
                                    </p>
                                    {recipe.description && (
                                      <p className="text-xs text-muted-foreground font-serif italic mt-0.5 leading-snug">
                                        {recipe.description}
                                      </p>
                                    )}
                                  </div>
                                  <Badge
                                    data-testid={`codex-progress-${idx}`}
                                    variant="outline"
                                    className={`flex-shrink-0 text-[10px] ${
                                      allCollected
                                        ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                                        : "border-border text-muted-foreground"
                                    }`}
                                  >
                                    {collectedCount}/{recipe.ingredients.length}
                                  </Badge>
                                </div>

                                <div className="mt-2 space-y-1">
                                  {recipe.ingredients.map((ing: any, iIdx: number) => {
                                    const have = countInInventory(ing.name);
                                    const need = ing.qty ?? 1;
                                    const collected = have >= need;
                                    return (
                                      <div
                                        key={iIdx}
                                        data-testid={`codex-ingredient-${idx}-${iIdx}`}
                                        className={`flex items-center gap-2 text-xs px-2 py-1 rounded ${
                                          collected
                                            ? "bg-emerald-500/10 text-emerald-400"
                                            : "bg-muted/20 text-muted-foreground"
                                        }`}
                                      >
                                        <span className={`w-3.5 h-3.5 flex items-center justify-center flex-shrink-0 rounded-sm border ${
                                          collected
                                            ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-400"
                                            : "border-border"
                                        }`}>
                                          {collected ? "✓" : ""}
                                        </span>
                                        <span className={`flex-1 ${collected ? "line-through opacity-70" : ""}`}>
                                          {need > 1 ? `${need}x ` : ""}{ing.name}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground/50">
                                          {have}/{need}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>

                                {allCollected && (
                                  <button
                                    data-testid={`codex-craft-${idx}`}
                                    onClick={() => sendAction(`I want to craft/perform the "${recipe.name}" recipe using my collected ingredients.`)}
                                    className="w-full mt-2 text-xs font-sans font-semibold py-1.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                                  >
                                    Craft / Perform
                                  </button>
                                )}

                                <p className="text-[10px] text-muted-foreground/30 mt-1.5">Discovered Turn {recipe.discoveredTurn}</p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* DICE TAB */}
                {sidebarTab === "dice" && (
                  <div className="rounded-md border border-border bg-card p-3">
                    <DiceRoller />
                  </div>
                )}

                {/* SHEET TAB */}
                {sidebarTab === "sheet" && (() => {
                  const char = myMember?.character;
                  if (!char) return (
                    <p className="text-xs text-muted-foreground text-center py-8 font-serif italic">No character found.</p>
                  );
                  const stats = (char.stats as Record<string, number>) || {};
                  const abilities = (char.abilities as any[]) ?? [];
                  const conditions = (char.conditions as string[]) ?? [];
                  const hpPct = Math.max(0, Math.min(100, Math.round((char.currentHp / char.maxHp) * 100)));
                  const xpThresholds = [300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000];
                  const xpNeeded = xpThresholds[char.level - 1] ?? xpThresholds[xpThresholds.length - 1];
                  const xpPct = Math.min(100, Math.round((char.xp / xpNeeded) * 100));

                  const statDefs = [
                    { key: "might", label: "MGT", fullLabel: "Might", icon: Sword, color: "text-red-400" },
                    { key: "agility", label: "AGI", fullLabel: "Agility", icon: Activity, color: "text-emerald-400" },
                    { key: "endurance", label: "END", fullLabel: "Endurance", icon: Heart, color: "text-orange-400" },
                    { key: "intellect", label: "INT", fullLabel: "Intellect", icon: Brain, color: "text-violet-400" },
                    { key: "will", label: "WIL", fullLabel: "Will", icon: Shield, color: "text-amber-400" },
                    { key: "presence", label: "PRE", fullLabel: "Presence", icon: Star, color: "text-rose-400" },
                  ];

                  return (
                    <div className="space-y-4" data-testid="character-sheet">
                      {/* Portrait + Identity */}
                      <div className="rounded-md border border-border bg-card p-3 space-y-3">
                        <div className="flex items-center gap-3">
                          {char.profilePicture ? (
                            <button
                              type="button"
                              className="w-14 h-14 rounded-md flex-shrink-0 border border-border cursor-pointer hover:ring-1 hover:ring-primary/50 transition-all overflow-hidden p-0 bg-transparent"
                              data-testid="sheet-portrait"
                              onClick={() => {
                                if ((window as any).__portraitClickTimer) { clearTimeout((window as any).__portraitClickTimer); (window as any).__portraitClickTimer = null; return; }
                                (window as any).__portraitClickTimer = setTimeout(() => { (window as any).__portraitClickTimer = null; setExpandedPortrait({ name: char.name, url: char.profilePicture!, role: `${char.race} ${char.class}` }); }, 250);
                              }}
                              onDoubleClick={(e) => { e.preventDefault(); if ((window as any).__portraitClickTimer) { clearTimeout((window as any).__portraitClickTimer); (window as any).__portraitClickTimer = null; } navigate(`/characters/${char.id}/appearance`); }}
                              title="Double-click to open Portrait Studio"
                            >
                              <img
                                src={char.profilePicture}
                                alt={char.name}
                                className="w-full h-full object-cover"
                                draggable={false}
                              />
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="w-14 h-14 rounded-md bg-secondary flex items-center justify-center flex-shrink-0 border border-border cursor-pointer hover:ring-1 hover:ring-primary/50 transition-all"
                              data-testid="sheet-portrait-empty"
                              onClick={() => navigate(`/characters/${char.id}/appearance`)}
                              title="Click to open Portrait Studio"
                            >
                              <BookOpen className="w-6 h-6 text-muted-foreground" />
                            </button>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-sans font-bold text-base tracking-wide leading-tight" data-testid="sheet-name">{char.name}</p>
                            <p className="text-xs text-muted-foreground capitalize mt-0.5">{char.race} · {char.class}</p>
                            <p className="text-xs text-muted-foreground/70 capitalize">{char.background}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <Badge variant="secondary" className="text-xs px-1.5 py-0" data-testid="sheet-level">Level {char.level}</Badge>
                              {conditions.map(c => (
                                <Badge key={c} variant="destructive" className="text-xs px-1.5 py-0">{c}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* HP Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground flex items-center gap-1 font-sans">
                              <Heart className="w-3 h-3 text-red-400" /> Hit Points
                            </span>
                            <span className="text-xs font-sans font-bold" data-testid="sheet-hp">{char.currentHp} / {char.maxHp}</span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                hpPct > 60 ? "bg-emerald-500" : hpPct > 30 ? "bg-amber-500" : "bg-red-500"
                              }`}
                              style={{ width: `${hpPct}%` }}
                            />
                          </div>
                        </div>

                        {/* MP Bar — only for casters */}
                        {(char.maxMp ?? 0) > 0 && (() => {
                          const mpPct = Math.max(0, Math.min(100, Math.round((char.currentMp / char.maxMp) * 100)));
                          return (
                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground flex items-center gap-1 font-sans">
                                  <Zap className="w-3 h-3 text-blue-400" /> Magic Points
                                </span>
                                <span className="text-xs font-sans font-bold" data-testid="sheet-mp">{char.currentMp} / {char.maxMp}</span>
                              </div>
                              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    mpPct > 50 ? "bg-blue-500" : mpPct > 20 ? "bg-blue-400" : "bg-blue-300"
                                  }`}
                                  style={{ width: `${mpPct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })()}

                        {/* XP Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground flex items-center gap-1 font-sans">
                              <Star className="w-3 h-3 text-amber-400" /> Experience
                            </span>
                            <span className="text-xs font-sans" data-testid="sheet-xp">{char.xp} / {xpNeeded} XP</span>
                          </div>
                          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-amber-500/70 transition-all duration-500"
                              style={{ width: `${xpPct}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Equipped Gear */}
                      {(() => {
                        const equipped = ((char.inventory as any[]) ?? []).filter((i: any) => i.equipped);
                        if (equipped.length === 0) return null;
                        const sheetRarityText: Record<string, string> = {
                          common: "text-zinc-400",
                          uncommon: "text-emerald-400",
                          rare: "text-blue-400",
                          epic: "text-purple-400",
                          legendary: "text-amber-400",
                        };
                        const slotLabels: Record<string, string> = { body: "Body", head: "Head", hands: "Hands", feet: "Feet", ring: "Ring", necklace: "Neck" };
                        const getSlotLabel = (it: any, allEquipped: any[]) => {
                          if (it.type === "weapon" && it.properties?.two_handed) return "2H";
                          if (it.type === "weapon") {
                            const weaponsBefore = allEquipped.filter((e: any) => e.type === "weapon" && !e.properties?.two_handed);
                            return weaponsBefore.indexOf(it) === 0 ? "MH" : "OH";
                          }
                          if (it.type === "armor") {
                            const slot = it.properties?.slot;
                            if (slot && slotLabels[slot]) return slotLabels[slot];
                            if (it.properties?.ac_bonus && !slot) return "OH";
                            if (it.properties?.ac) return "Body";
                          }
                          if (it.type === "jewelry") {
                            const slot = it.properties?.slot;
                            if (slot && slotLabels[slot]) return slotLabels[slot];
                            return "Ring";
                          }
                          return "";
                        };
                        return (
                          <div className="rounded-md border border-primary/20 bg-primary/5 p-3 space-y-1.5" data-testid="equipped-gear">
                            <p className="text-xs font-sans tracking-widest text-muted-foreground uppercase flex items-center gap-1.5">
                              <Sword className="w-3 h-3 text-primary" /> Equipped Gear
                            </p>
                            {equipped.map((item: any, i: number) => {
                              const rarity = item.rarity ?? "common";
                              const slot = getSlotLabel(item, equipped);
                              return (
                                <div key={i} className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    {slot && (
                                      <span className="text-[8px] font-sans font-bold text-muted-foreground/40 w-6 flex-shrink-0">{slot}</span>
                                    )}
                                    <span className={`text-xs font-sans font-medium ${rarity !== "common" ? (sheetRarityText[rarity] ?? "") : ""}`}>{item.name}</span>
                                    {rarity !== "common" && (
                                      <span className={`text-[8px] font-sans font-bold uppercase ${sheetRarityText[rarity] ?? ""}`}>{rarity}</span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-muted-foreground flex-shrink-0">
                                    {item.type === "weapon" && item.properties?.damage ? `${item.properties.damage}${item.properties.bonus ? ` +${item.properties.bonus}` : ""}` : ""}
                                    {item.type === "armor" && item.properties?.ac && !item.properties?.ac_bonus ? `AC ${item.properties.ac}` : ""}
                                    {item.type === "armor" && item.properties?.ac_bonus ? `+${item.properties.ac_bonus} AC` : ""}
                                    {item.type === "jewelry" && item.properties?.effect ? item.properties.effect : ""}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}

                      {/* Ability Scores */}
                      <div className="rounded-md border border-border bg-card p-3 space-y-2">
                        <p className="text-xs font-sans tracking-widest text-muted-foreground uppercase flex items-center gap-1.5">
                          <Zap className="w-3 h-3 text-primary" /> Ability Scores
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {statDefs.map(({ key, label, fullLabel, icon: Icon, color }) => {
                            const val = stats[key] ?? 10;
                            const mod = Math.floor((val - 10) / 2);
                            return (
                              <div
                                key={key}
                                className="flex flex-col items-center rounded-md bg-secondary/40 px-2 py-2.5 gap-0.5"
                                data-testid={`sheet-stat-${key}`}
                              >
                                <Icon className={`w-3 h-3 ${color}`} />
                                <span className="text-xs font-sans font-bold text-foreground">{val}</span>
                                <span className={`text-sm font-sans font-bold ${mod >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                  {mod >= 0 ? `+${mod}` : mod}
                                </span>
                                <span className="text-[10px] text-muted-foreground/60 font-sans">{label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Abilities */}
                      {abilities.length > 0 && (
                        <div className="rounded-md border border-border bg-card p-3 space-y-2">
                          <p className="text-xs font-sans tracking-widest text-muted-foreground uppercase flex items-center gap-1.5">
                            <Zap className="w-3 h-3 text-primary" /> Abilities & Powers
                          </p>
                          <div className="space-y-2">
                            {abilities.map((ab: any, i: number) => (
                              <div key={i} className="rounded-md bg-secondary/30 px-2.5 py-2.5 space-y-1" data-testid={`sheet-ability-${i}`}>
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-sm font-sans font-semibold leading-tight">{ab.name}</p>
                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    {ab.recharge && ab.recharge !== "at-will" && (
                                      <span className="text-[9px] text-muted-foreground/50 font-sans uppercase tracking-wide">{RECHARGE_LABELS[ab.recharge as RechargeType] ?? ab.recharge}</span>
                                    )}
                                    {ab.usesMax > 0 && (
                                      <div className="flex gap-0.5">
                                        {Array.from({ length: ab.usesMax }).map((_, j) => (
                                          <div
                                            key={j}
                                            className={`w-2.5 h-2.5 rounded-full border ${
                                              j < ab.usesLeft
                                                ? "bg-primary border-primary"
                                                : "bg-transparent border-muted-foreground/30"
                                            }`}
                                          />
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {ab.description && (
                                  <p className="text-xs text-muted-foreground leading-snug font-serif">{ab.description}</p>
                                )}
                                {ab.usesMax > 0 && (
                                  <p className="text-[10px] text-muted-foreground/50 font-sans">{ab.usesLeft}/{ab.usesMax} uses remaining{ab.recharge ? ` · ${RECHARGE_LABELS[ab.recharge as RechargeType] ?? ab.recharge}` : ""}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {((char.skills as any[]) ?? []).length > 0 && (
                        <div className="rounded-md border border-border bg-card p-3 space-y-2">
                          <p className="text-xs font-sans tracking-widest text-muted-foreground uppercase flex items-center gap-1.5">
                            <Star className="w-3 h-3 text-violet-400" /> Learned Skills
                          </p>
                          <div className="space-y-1.5">
                            {(char.skills as any[]).map((sk: any, i: number) => (
                              <div key={i} className="rounded-md bg-violet-500/10 border border-violet-500/20 px-2.5 py-2" data-testid={`sheet-skill-${i}`}>
                                <p className="text-sm font-sans font-semibold text-foreground">{sk.name}</p>
                                <p className="text-xs text-foreground/60 font-serif mt-0.5">{sk.description}</p>
                                <p className="text-[10px] text-violet-400/80 font-sans font-semibold mt-0.5">{sk.mechanicalEffect}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Achievements */}
                      {((char.achievements as any[]) ?? []).length > 0 && (
                        <div className="rounded-md border border-border bg-card p-3 space-y-2">
                          <p className="text-xs font-sans tracking-widest text-muted-foreground uppercase flex items-center gap-1.5">
                            <Trophy className="w-3 h-3 text-amber-400" /> Achievements ({(char.achievements as any[]).length})
                          </p>
                          <div className="space-y-1.5">
                            {(char.achievements as any[]).map((ach: any, i: number) => {
                              const catColors: Record<string, string> = {
                                guild: "text-blue-400 border-blue-500/20 bg-blue-500/10",
                                title: "text-amber-400 border-amber-500/20 bg-amber-500/10",
                                quest: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
                                combat: "text-red-400 border-red-500/20 bg-red-500/10",
                                exploration: "text-cyan-400 border-cyan-500/20 bg-cyan-500/10",
                                social: "text-rose-400 border-rose-500/20 bg-rose-500/10",
                              };
                              const colorCls = catColors[ach.category] ?? catColors.quest;
                              return (
                                <div key={i} className={`rounded-md border px-2.5 py-2 ${colorCls}`} data-testid={`sheet-achievement-${i}`}>
                                  <div className="flex items-center gap-1.5">
                                    <Trophy className="w-3 h-3 flex-shrink-0" />
                                    <p className="text-sm font-sans font-semibold">{ach.title}</p>
                                  </div>
                                  {ach.description && (
                                    <p className="text-xs text-foreground/60 font-serif mt-0.5">{ach.description}</p>
                                  )}
                                  <p className="text-[10px] opacity-60 font-sans capitalize mt-0.5">{ach.category}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Backstory */}
                      {char.backstory && (
                        <div className="rounded-md border border-border bg-card p-3 space-y-2">
                          <p className="text-xs font-sans tracking-widest text-muted-foreground uppercase flex items-center gap-1.5">
                            <Scroll className="w-3 h-3 text-primary" /> Backstory
                          </p>
                          <p className="text-xs font-serif text-muted-foreground leading-relaxed italic" data-testid="sheet-backstory">
                            {char.backstory}
                          </p>
                        </div>
                      )}

                      {/* Appearance */}
                      {char.appearance && (
                        <div className="rounded-md border border-border bg-card p-3 space-y-2">
                          <p className="text-xs font-sans tracking-widest text-muted-foreground uppercase flex items-center gap-1.5">
                            <BookOpen className="w-3 h-3 text-primary" /> Appearance
                          </p>
                          <p className="text-xs font-serif text-muted-foreground leading-relaxed" data-testid="sheet-appearance">
                            {char.appearance}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* CAST LOG TAB */}
                {sidebarTab === "log" && (() => {
                  const relColor: Record<string, string> = {
                    friendly: "text-green-400 border-green-700 bg-green-950/40",
                    neutral: "text-muted-foreground border-border bg-muted/30",
                    hostile: "text-red-400 border-red-800 bg-red-950/40",
                    unknown: "text-yellow-400 border-yellow-700 bg-yellow-950/40",
                    deceased: "text-zinc-500 border-zinc-700 bg-zinc-900/40",
                  };
                  const MAX_NOTES = 120;
                  if (npcs.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                        <ScrollText className="w-8 h-8 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">No named characters yet.</p>
                        <p className="text-xs text-muted-foreground/60">NPCs you meet will appear here.</p>
                      </div>
                    );
                  }
                  const companions = npcs.filter((n: any) => n.isPartyMember);
                  const others = npcs.filter((n: any) => !n.isPartyMember);

                  const locationGroups: Record<string, any[]> = {};
                  others.forEach((npc: any) => {
                    const loc = npc.lastSeen || "Unknown";
                    if (!locationGroups[loc]) locationGroups[loc] = [];
                    locationGroups[loc].push(npc);
                  });
                  const sortedLocations = Object.keys(locationGroups).sort((a, b) => {
                    const latestA = Math.max(...locationGroups[a].map((n: any) => new Date(n.updatedAt).getTime()));
                    const latestB = Math.max(...locationGroups[b].map((n: any) => new Date(n.updatedAt).getTime()));
                    return latestB - latestA;
                  });

                  const handleDeleteNpc = async (npcId: string) => {
                    try {
                      await apiRequest("DELETE", `/api/npcs/${npcId}`);
                      queryClient.invalidateQueries({ queryKey: [`/api/parties/${partyId}/npcs`] });
                    } catch {}
                  };

                  const renderNpc = (npc: any, compact = false) => {
                    const rel = npc.relationship ?? "neutral";
                    const colorCls = npc.isPartyMember
                      ? "text-amber-300 border-amber-700/60 bg-amber-950/30"
                      : (relColor[rel] ?? relColor.neutral);
                    const notesText = npc.notes ?? "";
                    const truncNotes = notesText.length > MAX_NOTES ? notesText.substring(0, MAX_NOTES) + "..." : notesText;
                    const isAutoDetected = notesText.includes("Auto-detected from narrative");
                    return (
                      <div key={npc.id} data-testid={`card-npc-${npc.id}`} className={`rounded-md border p-2.5 space-y-1 ${colorCls}`}>
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0">
                            {npc.hasPortrait ? (
                              <AuthImg
                                src={`/api/npcs/${npc.id}/portrait`}
                                alt={npc.name}
                                className={`${compact ? "w-10 h-10" : "w-12 h-12"} rounded object-cover object-top border border-current/20 cursor-pointer hover:ring-1 hover:ring-primary/50 transition-all`}
                                data-testid={`img-npc-portrait-${npc.id}`}
                                onClick={() => setExpandedPortrait({ name: npc.name, url: `/api/npcs/${npc.id}/portrait`, role: npc.role })}
                              />
                            ) : (
                              <div className={`${compact ? "w-10 h-10" : "w-12 h-12"} rounded bg-muted/50 border border-current/20 animate-pulse flex items-center justify-center`}>
                                <ScrollText className="w-4 h-4 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="flex items-start justify-between gap-1">
                              <span className="font-semibold text-xs leading-tight">{npc.name}</span>
                              <div className="flex gap-1 flex-shrink-0">
                                {npc.isPartyMember && (
                                  <span className="text-[9px] px-1 py-0.5 rounded border border-amber-600/60 bg-amber-900/40 text-amber-400 font-sans tracking-wide uppercase">
                                    ★
                                  </span>
                                )}
                                <span className={`text-[9px] px-1 py-0.5 rounded font-medium uppercase tracking-wide whitespace-nowrap border ${relColor[rel] ?? relColor.neutral}`}>
                                  {rel}
                                </span>
                                <button
                                  data-testid={`btn-delete-npc-${npc.id}`}
                                  className="text-[9px] px-1 py-0.5 rounded border border-red-800/40 bg-red-950/30 text-red-400/60 hover:text-red-300 hover:bg-red-900/40 transition-colors"
                                  title="Remove this character"
                                  onClick={() => handleDeleteNpc(npc.id)}
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>
                            {npc.role && (
                              <p className="text-[10px] text-muted-foreground italic leading-tight truncate">{npc.role}</p>
                            )}
                            {!compact && npc.lastSeen && (
                              <p className="text-[10px] text-muted-foreground/60 truncate">
                                <MapPin className="w-2.5 h-2.5 inline -mt-0.5 mr-0.5" />{npc.lastSeen}
                              </p>
                            )}
                          </div>
                        </div>
                        {truncNotes && (
                          <p className="text-[10px] text-muted-foreground/70 leading-snug pl-0.5 break-words">
                            {truncNotes}
                          </p>
                        )}
                      </div>
                    );
                  };
                  return (
                    <div className="space-y-2">
                      {companions.length > 0 && (
                        <>
                          <p className="text-[10px] font-sans tracking-widest text-amber-500/70 uppercase flex items-center gap-1.5">
                            <Users className="w-3 h-3" /> Companions ({companions.length})
                          </p>
                          <div className="space-y-1.5">
                            {companions.map((n: any) => renderNpc(n))}
                          </div>
                        </>
                      )}
                      {sortedLocations.length > 0 && (
                        <>
                          {companions.length > 0 && (
                            <div className="border-t border-border pt-1.5" />
                          )}
                          <p className="text-[10px] font-sans tracking-widest text-muted-foreground/40 uppercase flex items-center gap-1.5">
                            <ScrollText className="w-3 h-3" /> Known Characters ({others.length})
                          </p>
                          {sortedLocations.map(loc => {
                            const locNpcs = locationGroups[loc];
                            const isExpanded = expandedRegions.has(`cast-${loc}`);
                            return (
                              <div key={loc}>
                                <button
                                  onClick={() => {
                                    setExpandedRegions(prev => {
                                      const next = new Set(prev);
                                      const key = `cast-${loc}`;
                                      if (next.has(key)) next.delete(key);
                                      else next.add(key);
                                      return next;
                                    });
                                  }}
                                  className="w-full flex items-center gap-1.5 py-1 text-left group"
                                  data-testid={`cast-location-${loc}`}
                                >
                                  <ChevronDown className={`w-3 h-3 text-muted-foreground/50 transition-transform ${isExpanded ? "" : "-rotate-90"}`} />
                                  <MapPin className="w-3 h-3 text-primary/50" />
                                  <span className="text-[11px] font-sans font-medium text-muted-foreground group-hover:text-foreground transition-colors truncate">
                                    {loc}
                                  </span>
                                  <span className="text-[9px] text-muted-foreground/40 ml-auto flex-shrink-0">{locNpcs.length}</span>
                                </button>
                                {isExpanded && (
                                  <div className="space-y-1.5 ml-2 mt-0.5">
                                    {locNpcs.map((n: any) => renderNpc(n, true))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>
                  );
                })()}

              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {shopData && (() => {
        const myMember = members.find((m: any) => m.userId === user?.id);
        const char = myMember?.character;
        const playerItems: any[] = char?.inventory ?? [];
        const playerGold = playerItems.reduce((sum: number, i: any) => {
          const coinTypes = ["treasure", "currency"];
          const coinPat = /coin|gold|silver|copper|money|gp\b/i;
          const isCoinPouch = /^coin\s*pouch/i.test(i.name || "");
          if (isCoinPouch || (coinTypes.includes(i.type) && coinPat.test(i.name || ""))) {
            let val = typeof i.properties?.value === "number" ? i.properties.value
              : typeof i.properties?.gold_value === "number" ? i.properties.gold_value : 0;
            if (val === 0) {
              const nameMatch = (i.name || "").match(/(\d+)\s*(?:gp|gold)/i);
              if (nameMatch) val = parseInt(nameMatch[1], 10);
            }
            const qty = i.qty ?? 1;
            return sum + (val * qty);
          }
          return sum;
        }, 0);

        const sellableItems = playerItems
          .map((item: any, idx: number) => ({ item, idx }))
          .filter(({ item }) => !(["treasure", "currency"].includes(item.type) && /^coin\s*pouch/i.test(item.name || "")));

        const getSellPrice = (item: any): number => {
          const isValuable = ["treasure", "currency", "gem", "loot"].includes(item.type);

          const val = item.properties?.value ?? item.properties?.gold_value;
          if (typeof val === "number" && val > 0) return Math.max(1, Math.floor(val * (isValuable ? 1.0 : 0.5)));
          if (typeof item.price === "number" && item.price > 0) return Math.max(1, Math.floor(item.price * (isValuable ? 0.75 : 0.25)));

          const nameAndDesc = ((item.name || "") + " " + (item.description || "")).toLowerCase();
          const hasPreciousContent = /pearl|gem|jewel|diamond|ruby|sapphire|emerald|opal|topaz|amethyst|crystal|gold coin|silver coin|platinum/i.test(nameAndDesc);

          const goldMatch = nameAndDesc.match(/(\d+)\s*(?:gold|gp|coin)/i);
          if (goldMatch) {
            const parsed = parseInt(goldMatch[1], 10);
            if (parsed > 0) return Math.max(1, parsed * (item.qty ?? 1));
          }

          const preciousUnitValues: Record<string, number> = {
            pearl: 50, diamond: 200, ruby: 150, sapphire: 150, emerald: 150,
            opal: 75, topaz: 50, amethyst: 50, gem: 50, jewel: 75, platinum: 100,
          };
          for (const [stone, unitVal] of Object.entries(preciousUnitValues)) {
            const stoneRegex = new RegExp(`(\\d+)\\s*(?:lustrous\\s+|gleaming\\s+|polished\\s+)?${stone}`, "i");
            const stoneMatch = nameAndDesc.match(stoneRegex);
            if (stoneMatch) {
              const count = parseInt(stoneMatch[1], 10);
              if (count > 0) return Math.max(1, count * unitVal * (item.qty ?? 1));
            }
            if (nameAndDesc.includes(stone) && !stoneMatch) {
              return Math.max(1, unitVal * (item.qty ?? 1));
            }
          }

          const rarityBase: Record<string, number> = { common: 5, uncommon: 25, rare: 100, epic: 400, legendary: 1000 };
          const typeBonus: Record<string, number> = { weapon: 1.2, armor: 1.3, jewelry: 1.1, accessory: 1.0, consumable: 0.6, tool: 0.5, document: 0.3, misc: 0.3, item: 0.3, treasure: 1.0, currency: 1.0, resource: 0.5, material: 0.5, artifact: 1.5, relic: 1.5 };
          const base = rarityBase[item.rarity ?? "common"] ?? 5;
          const tMult = typeBonus[item.type] ?? 0.5;
          const bonus = item.properties?.bonus ?? 0;
          const preciousBonus = hasPreciousContent ? 2.0 : 1.0;
          const sellMult = isValuable ? 0.75 : 0.25;
          return Math.max(1, Math.floor((base * tMult * preciousBonus + bonus * 15) * sellMult * (item.qty ?? 1)));
        };

        const formatItemProps = (p: any) => {
          if (!p || Object.keys(p).length === 0) return null;
          const parts: string[] = [];
          if (p.damage) parts.push(`${p.damage} dmg`);
          if (p.bonus) parts.push(`+${p.bonus}`);
          if (p.ac) parts.push(`AC ${p.ac}`);
          if (p.ac_bonus) parts.push(`+${p.ac_bonus} AC`);
          if (p.heal) parts.push(`heal ${p.heal}`);
          if (p.two_handed) parts.push("2H");
          if (p.thrown) parts.push("thrown");
          if (p.finesse) parts.push("finesse");
          if (p.range) parts.push(`${p.range}ft`);
          if (p.focus) parts.push(`focus +${p.focus}`);
          const extra = Object.entries(p)
            .filter(([k]) => !["damage","bonus","ac","ac_bonus","range","two_handed","thrown","finesse","heal","focus","value","slot"].includes(k))
            .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`);
          parts.push(...extra);
          return parts.length > 0 ? parts.join(" · ") : null;
        };

        const rarityColors: Record<string, string> = {
          common: "text-zinc-400",
          uncommon: "text-emerald-400",
          rare: "text-blue-400",
          epic: "text-purple-400",
          legendary: "text-amber-400",
        };

        const typeIcons: Record<string, any> = {
          weapon: Sword, armor: Shield, consumable: Coffee, tool: Wrench, misc: Package,
        };

        const handleBuy = async (shopItem: ShopItem) => {
          if (!char || shopBusy) return;
          setShopBusy(true);
          try {
            const resp = await fetch(`/api/parties/${partyId}/shop/buy`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ characterId: char.id, item: shopItem, price: shopItem.price }),
            });
            const data = await resp.json();
            if (!resp.ok) {
              toast({ title: data.error ?? "Purchase failed", variant: "destructive" });
              return;
            }
            toast({ title: `Bought ${shopItem.name} for ${shopItem.price}gp` });
            await queryClient.invalidateQueries({ queryKey: [`/api/parties/${partyId}`] });
          } catch {
            toast({ title: "Purchase failed", variant: "destructive" });
          } finally {
            setShopBusy(false);
          }
        };

        const handleSell = async (itemIndex: number, item: any) => {
          if (!char || shopBusy) return;
          const price = getSellPrice(item);
          setShopBusy(true);
          try {
            const resp = await fetch(`/api/parties/${partyId}/shop/sell`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ characterId: char.id, itemIndex, sellPrice: price, itemName: item.name }),
            });
            const data = await resp.json();
            if (!resp.ok) {
              toast({ title: data.error ?? "Sale failed", variant: "destructive" });
              return;
            }
            toast({ title: `Sold ${item.name} for ${price}gp` });
            await queryClient.invalidateQueries({ queryKey: [`/api/parties/${partyId}`] });
          } catch {
            toast({ title: "Sale failed", variant: "destructive" });
          } finally {
            setShopBusy(false);
          }
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" data-testid="shop-overlay">
            <div className="bg-card border border-border rounded-lg shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-primary" />
                  <div>
                    <h2 className="text-sm font-sans font-bold" data-testid="shop-merchant-name">{shopData.merchant_name}</h2>
                    {shopData.shop_flavor && <p className="text-[11px] text-muted-foreground font-serif italic">{shopData.shop_flavor}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 rounded px-2 py-1">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-sans font-bold text-amber-400" data-testid="shop-gold">{playerGold}gp</span>
                  </div>
                  <button onClick={() => setShopData(null)} className="text-muted-foreground hover:text-foreground" data-testid="button-shop-close">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex border-b border-border flex-shrink-0">
                <button
                  onClick={() => setShopTab("buy")}
                  data-testid="button-shop-tab-buy"
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-sans font-medium transition-colors ${shopTab === "buy" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <ShoppingCart className="w-3.5 h-3.5" /> Buy
                </button>
                <button
                  onClick={() => setShopTab("sell")}
                  data-testid="button-shop-tab-sell"
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-sans font-medium transition-colors ${shopTab === "sell" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" /> Sell
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="p-3 space-y-1.5">
                  {shopTab === "buy" ? (
                    shopData.inventory.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6 font-serif italic">The merchant has nothing for sale.</p>
                    ) : (
                      shopData.inventory.map((item, i) => {
                        const Icon = typeIcons[item.type] ?? Package;
                        const rColor = rarityColors[item.rarity] ?? "text-zinc-400";
                        const props = formatItemProps(item.properties);
                        const canAfford = playerGold >= item.price;
                        return (
                          <div key={i} className="flex items-center gap-2.5 rounded-md bg-secondary/30 px-3 py-2 hover:bg-secondary/50 transition-colors" data-testid={`shop-item-buy-${i}`}>
                            <Icon className={`w-4 h-4 flex-shrink-0 ${rColor}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-xs font-sans font-medium ${rColor}`}>{item.name}</span>
                                {item.rarity !== "common" && (
                                  <span className={`text-[8px] font-sans font-bold uppercase ${rColor}`}>{item.rarity}</span>
                                )}
                              </div>
                              {item.description && <p className="text-[10px] text-muted-foreground/80 italic leading-snug">{item.description}</p>}
                              {props && <p className="text-[10px] text-muted-foreground">{props}</p>}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs font-sans font-bold text-amber-400">{item.price}gp</span>
                              <Button
                                size="sm"
                                variant={canAfford ? "default" : "ghost"}
                                disabled={!canAfford || shopBusy}
                                onClick={() => handleBuy(item)}
                                className="h-7 px-2.5 text-[10px]"
                                data-testid={`button-buy-${i}`}
                              >
                                Buy
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )
                  ) : (
                    sellableItems.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6 font-serif italic">Nothing to sell.</p>
                    ) : (
                      sellableItems.map(({ item, idx }) => {
                        const Icon = typeIcons[item.type] ?? Package;
                        const rColor = rarityColors[item.rarity ?? "common"] ?? "text-zinc-400";
                        const props = formatItemProps(item.properties);
                        const price = getSellPrice(item);
                        const isEquipped = !!item.equipped;
                        return (
                          <div key={idx} className={`flex items-center gap-2.5 rounded-md px-3 py-2 transition-colors ${isEquipped ? "bg-secondary/15 opacity-60" : "bg-secondary/30 hover:bg-secondary/50"}`} data-testid={`shop-item-sell-${idx}`}>
                            <Icon className={`w-4 h-4 flex-shrink-0 ${rColor}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-xs font-sans font-medium ${rColor}`}>{item.name}</span>
                                {item.qty > 1 && <span className="text-[10px] text-muted-foreground">x{item.qty}</span>}
                                {isEquipped && <span className="text-[8px] font-sans font-bold uppercase text-sky-400">EQUIPPED</span>}
                                {(item.rarity ?? "common") !== "common" && (
                                  <span className={`text-[8px] font-sans font-bold uppercase ${rColor}`}>{item.rarity}</span>
                                )}
                              </div>
                              {item.description && <p className="text-[10px] text-muted-foreground/80 italic leading-snug">{item.description}</p>}
                              {props && <p className="text-[10px] text-muted-foreground">{props}</p>}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`text-xs font-sans font-bold ${isEquipped ? "text-muted-foreground" : "text-emerald-400"}`}>+{price}gp</span>
                              {isEquipped ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={shopBusy}
                                  onClick={async () => {
                                    setShopBusy(true);
                                    try {
                                      const resp = await fetch(`/api/characters/${char.id}/equip`, {
                                        method: "PATCH",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ itemIndex: idx, equipped: false }),
                                      });
                                      if (!resp.ok) {
                                        const err = await resp.json().catch(() => null);
                                        toast({ title: err?.error ?? "Failed to unequip", variant: "destructive" });
                                      } else {
                                        toast({ title: `Unequipped ${item.name}` });
                                        await queryClient.invalidateQueries({ queryKey: [`/api/parties/${partyId}`] });
                                      }
                                    } catch {
                                      toast({ title: "Failed to unequip", variant: "destructive" });
                                    } finally {
                                      setShopBusy(false);
                                    }
                                  }}
                                  className="h-7 px-2.5 text-[10px]"
                                  data-testid={`button-unequip-${idx}`}
                                >
                                  Unequip
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={shopBusy}
                                  onClick={() => handleSell(idx, item)}
                                  className="h-7 px-2.5 text-[10px]"
                                  data-testid={`button-sell-${idx}`}
                                >
                                  Sell
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )
                  )}
                </div>
              </div>

              <div className="px-4 py-2.5 border-t border-border flex-shrink-0">
                <p className="text-[10px] text-muted-foreground text-center font-serif italic">Valuables sell at full value. Equipment sells at 25-50%. Equipped items must be unequipped first.</p>
              </div>
            </div>
          </div>
        );
      })()}

      {noticeBoardData && (() => {
        const difficultyConfig: Record<string, { color: string; label: string; icon: any }> = {
          easy: { color: "text-emerald-400", label: "Easy", icon: Target },
          moderate: { color: "text-amber-400", label: "Moderate", icon: Target },
          hard: { color: "text-orange-400", label: "Hard", icon: AlertTriangle },
          deadly: { color: "text-red-400", label: "Deadly", icon: Skull },
        };

        const handleAcceptNotice = (notice: NoticeItem) => {
          const rewardParts: string[] = [];
          if (notice.reward_gold > 0) rewardParts.push(`${notice.reward_gold}gp`);
          if (notice.reward_items.length > 0) rewardParts.push(notice.reward_items.join(", "));
          const rewardStr = rewardParts.length > 0 ? ` (reward: ${rewardParts.join(" + ")})` : "";
          sendAction(`[ACTION] I accept the notice "${notice.title}" from the board${rewardStr}. I want to take on this quest.`);
          setNoticeBoardData(null);
          setExpandedNotice(null);
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" data-testid="notice-board-overlay">
            <div className="bg-card border border-border rounded-lg shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-amber-500" />
                  <div>
                    <h2 className="text-sm font-sans font-bold" data-testid="notice-board-name">{noticeBoardData.board_name}</h2>
                    {noticeBoardData.board_flavor && <p className="text-[11px] text-muted-foreground font-serif italic">{noticeBoardData.board_flavor}</p>}
                  </div>
                </div>
                <button onClick={() => { setNoticeBoardData(null); setExpandedNotice(null); }} className="text-muted-foreground hover:text-foreground" data-testid="button-notice-board-close">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="p-3 space-y-2">
                  {noticeBoardData.notices.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6 font-serif italic">The board is bare — no notices posted.</p>
                  ) : (
                    noticeBoardData.notices.map((notice, i) => {
                      const diff = difficultyConfig[notice.difficulty] ?? difficultyConfig.moderate;
                      const DiffIcon = diff.icon;
                      const isExpanded = expandedNotice === i;
                      const rewardParts: string[] = [];
                      if (notice.reward_gold > 0) rewardParts.push(`${notice.reward_gold}gp`);
                      if (notice.reward_items.length > 0) rewardParts.push(...notice.reward_items);

                      return (
                        <div
                          key={i}
                          className={`rounded-md border transition-colors cursor-pointer ${isExpanded ? "bg-secondary/50 border-primary/30" : "bg-secondary/20 border-border hover:bg-secondary/40"}`}
                          data-testid={`notice-item-${i}`}
                        >
                          <div
                            className="flex items-start gap-2.5 px-3 py-2.5"
                            onClick={() => setExpandedNotice(isExpanded ? null : i)}
                          >
                            <ScrollText className="w-4 h-4 flex-shrink-0 text-amber-500/70 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-sans font-semibold text-foreground">{notice.title}</span>
                                <span className={`text-[8px] font-sans font-bold uppercase ${diff.color} flex items-center gap-0.5`}>
                                  <DiffIcon className="w-2.5 h-2.5" />
                                  {diff.label}
                                </span>
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-0.5">Posted by {notice.poster}</p>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {notice.reward_gold > 0 && (
                                <span className="flex items-center gap-0.5 text-xs font-sans font-bold text-amber-400">
                                  <Coins className="w-3 h-3" />
                                  {notice.reward_gold}
                                </span>
                              )}
                              <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="px-3 pb-3 space-y-2 border-t border-border/50 pt-2 mx-2">
                              <p className="text-[11px] text-foreground/90 font-serif leading-relaxed">{notice.description}</p>

                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
                                {notice.location_hint && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {notice.location_hint}
                                  </span>
                                )}
                                {notice.deadline && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {notice.deadline}
                                  </span>
                                )}
                              </div>

                              {rewardParts.length > 0 && (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] text-muted-foreground">Reward:</span>
                                  {notice.reward_gold > 0 && (
                                    <span className="inline-flex items-center gap-0.5 bg-amber-500/10 border border-amber-500/20 rounded px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                                      <Coins className="w-3 h-3" />
                                      {notice.reward_gold}gp
                                    </span>
                                  )}
                                  {notice.reward_items.map((item, ri) => (
                                    <span key={ri} className="inline-flex items-center gap-0.5 bg-primary/10 border border-primary/20 rounded px-1.5 py-0.5 text-[10px] font-medium text-primary">
                                      <Package className="w-3 h-3" />
                                      {item}
                                    </span>
                                  ))}
                                </div>
                              )}

                              <Button
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); handleAcceptNotice(notice); }}
                                className="w-full h-8 text-xs font-sans mt-1"
                                data-testid={`button-accept-notice-${i}`}
                              >
                                Accept Quest
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="px-4 py-2.5 border-t border-border flex-shrink-0">
                <p className="text-[10px] text-muted-foreground text-center font-serif italic">Click a notice to read the details. Accept a quest to begin the mission.</p>
              </div>
            </div>
          </div>
        );
      })()}

      {viewingLocationMap && (
        <div className="fixed inset-0 z-[91] bg-background/95 backdrop-blur-sm flex flex-col" data-testid="overlay-location-map">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border">
            <p className="text-sm font-sans font-semibold tracking-wide flex items-center gap-2 min-w-0">
              <MapIcon className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="truncate">{viewingLocationMap}</span>
            </p>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  try {
                    await apiRequest("DELETE", `/api/parties/${partyId}/location-maps/${encodeURIComponent(viewingLocationMap)}`);
                  } catch {}
                  await apiRequest("POST", `/api/parties/${partyId}/location-maps/${encodeURIComponent(viewingLocationMap)}/generate`);
                  queryClient.invalidateQueries({ queryKey: [`/api/parties/${partyId}/location-maps`, viewingLocationMap] });
                  queryClient.invalidateQueries({ queryKey: [`/api/parties/${partyId}/location-maps`] });
                }}
                className="h-8 w-8 p-0"
                data-testid="regenerate-location-map"
                title="Regenerate map"
                disabled={locationMapData?.generating}
              >
                <RefreshCw className={`w-4 h-4 ${locationMapData?.generating ? "animate-spin" : ""}`} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setViewingLocationMap(null)}
                data-testid="close-location-map"
                className="h-8 w-8 p-0"
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center p-4">
            {isLoadingLocationMap ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
                <p className="text-sm font-sans">Loading map...</p>
              </div>
            ) : locationMapData?.generating && !locationMapData?.mapImage ? (
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="w-10 h-10 animate-spin text-primary/50" />
                <p className="text-sm font-sans font-semibold">Generating map for {viewingLocationMap}...</p>
                <p className="text-xs text-muted-foreground/60">This may take a moment</p>
              </div>
            ) : locationMapData?.mapImage ? (
              <img
                src={locationMapData.mapImage}
                alt={`Map of ${viewingLocationMap}`}
                className="max-w-full max-h-full object-contain rounded-lg border border-border shadow-lg"
                data-testid="location-map-image"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <MapIcon className="w-8 h-8 text-muted-foreground/30" />
                <p className="text-sm font-sans">No map generated yet</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await apiRequest("POST", `/api/parties/${partyId}/location-maps/${encodeURIComponent(viewingLocationMap)}/generate`);
                    queryClient.invalidateQueries({ queryKey: [`/api/parties/${partyId}/location-maps`, viewingLocationMap] });
                    queryClient.invalidateQueries({ queryKey: [`/api/parties/${partyId}/location-maps`] });
                  }}
                  data-testid="generate-location-map-button"
                >
                  Generate Map
                </Button>
              </div>
            )}
          </div>
          {locationMapData?.locationType && (
            <div className="px-4 py-2 border-t border-border flex-shrink-0">
              <p className="text-[10px] text-muted-foreground text-center font-sans uppercase tracking-widest">
                {locationMapData.locationType} map
              </p>
            </div>
          )}
        </div>
      )}

      {expandedSceneImage && (
        <div
          className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 cursor-pointer"
          onClick={() => setExpandedSceneImage(null)}
          data-testid="overlay-scene-image"
        >
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={expandedSceneImage.imageData}
              alt={expandedSceneImage.name}
              className="w-full rounded-lg object-cover border-2 border-border shadow-2xl"
              data-testid="img-expanded-scene"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent rounded-b-lg px-4 py-3">
              <p className="text-sm font-sans font-semibold text-white">{expandedSceneImage.name}</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setExpandedSceneImage(null)}
              data-testid="close-scene-image"
              className="absolute top-2 right-2 h-8 w-8 p-0 bg-black/40 hover:bg-black/60 text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {expandedPortrait && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-8 cursor-pointer"
          onClick={() => setExpandedPortrait(null)}
          data-testid="overlay-portrait"
        >
          <div className="relative max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            {expandedPortrait.url.startsWith("/api/") ? (
              <AuthImg
                src={expandedPortrait.url}
                alt={expandedPortrait.name}
                className="w-full rounded-lg object-cover border-2 border-border shadow-2xl"
                data-testid="img-expanded-portrait"
              />
            ) : (
              <img
                src={expandedPortrait.url}
                alt={expandedPortrait.name}
                className="w-full rounded-lg object-cover border-2 border-border shadow-2xl"
                data-testid="img-expanded-portrait"
              />
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent rounded-b-lg px-4 py-3">
              <div className="flex items-end justify-between gap-2">
                <div>
                  <p className="text-lg font-bold text-white font-sans tracking-wide">{expandedPortrait.name}</p>
                  {expandedPortrait.role && (
                    <p className="text-sm text-white/70 italic">{expandedPortrait.role}</p>
                  )}
                </div>
                <div className="flex gap-1.5 mb-0.5">
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch(expandedPortrait.url);
                        const blob = await res.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `${expandedPortrait.name.replace(/[^a-zA-Z0-9]/g, "_")}.png`;
                        a.click();
                        URL.revokeObjectURL(url);
                      } catch {
                        const a = document.createElement("a");
                        a.href = expandedPortrait.url;
                        a.download = `${expandedPortrait.name.replace(/[^a-zA-Z0-9]/g, "_")}.png`;
                        a.click();
                      }
                    }}
                    className="w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                    data-testid="button-download-portrait"
                    title="Save image"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  {typeof navigator.share === "function" && (
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch(expandedPortrait.url);
                          const blob = await res.blob();
                          const file = new File([blob], `${expandedPortrait.name}.png`, { type: "image/png" });
                          await navigator.share({ title: expandedPortrait.name, files: [file] });
                        } catch {}
                      }}
                      className="w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                      data-testid="button-share-portrait"
                      title="Share image"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setExpandedPortrait(null)}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
              data-testid="button-close-portrait"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {levelUpData && (() => {
        const myChar = members.find((m: any) => m.userId === user?.id)?.character;
        const charClass = myChar?.class ?? "";
        const charRace = myChar?.race ?? "";
        const existingSkillIds = ((myChar?.skills as any[]) ?? []).map((s: any) => s.id);
        const { classSkills, racialSkill } = getAvailableSkills(charClass, charRace, levelUpData.newLevel, existingSkillIds);
        const isMilestone = SKILL_MILESTONE_LEVELS.includes(levelUpData.newLevel);
        const totalStatAllocated = Object.values(statPoints).reduce((s, v) => s + v, 0);
        const needsSkillPick = isMilestone && classSkills;
        const requiredPicks = classSkills?.pick ?? 0;
        const canConfirm = totalStatAllocated === 2 && (!needsSkillPick || selectedSkillIds.length === requiredPicks);
        const currentStats = (myChar?.stats as Record<string, number>) ?? {};

        async function confirmLevelUp() {
          if (!canConfirm || levelUpBusy) return;
          setLevelUpBusy(true);
          try {
            const skillsToSend: SkillOption[] = [];
            if (classSkills) {
              for (const id of selectedSkillIds) {
                const found = classSkills.choices.find(c => c.id === id);
                if (found) skillsToSend.push(found);
              }
            }
            if (racialSkill) {
              skillsToSend.push(racialSkill);
            }
            const resp = await fetch(`/api/characters/${levelUpData.characterId}/level-up`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                statAllocations: statPoints,
                selectedSkills: skillsToSend.length > 0 ? skillsToSend : undefined,
              }),
            });
            if (!resp.ok) throw new Error("Failed");
            await queryClient.invalidateQueries({ queryKey: [`/api/parties/${partyId}`] });
            toast({ title: `${levelUpData.characterName} reached Level ${levelUpData.newLevel}!` });
            setLevelUpData(null);
            setSelectedSkillIds([]);
          } catch {
            toast({ title: "Failed to apply level-up", variant: "destructive" });
          } finally {
            setLevelUpBusy(false);
          }
        }

        return (
          <div className="fixed inset-0 z-[110] bg-black/85 flex items-center justify-center p-4" data-testid="overlay-level-up">
            <div className="relative max-w-lg w-full bg-background border border-primary/40 rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-primary/30 via-primary/20 to-primary/30 px-6 py-5 text-center border-b border-primary/30">
                <div className="text-3xl mb-1">
                  <Star className="w-8 h-8 text-yellow-400 mx-auto mb-1 animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold font-serif text-primary tracking-wide" data-testid="text-level-up-title">
                  Level Up!
                </h2>
                <p className="text-sm text-foreground/70 font-serif mt-1">
                  {levelUpData.characterName} reached <span className="text-primary font-bold">Level {levelUpData.newLevel}</span>
                </p>
                <div className="flex items-center justify-center gap-4 mt-3">
                  <Badge variant="outline" className="border-red-500/40 text-red-400 font-sans text-xs">
                    <Heart className="w-3 h-3 mr-1" /> +{levelUpData.hpGain} HP
                  </Badge>
                  {(levelUpData.mpGain ?? 0) > 0 && (
                    <Badge variant="outline" className="border-blue-500/40 text-blue-400 font-sans text-xs">
                      <Zap className="w-3 h-3 mr-1" /> +{levelUpData.mpGain} MP
                    </Badge>
                  )}
                  {isMilestone && (
                    <Badge variant="outline" className="border-violet-500/40 text-violet-400 font-sans text-xs">
                      <Brain className="w-3 h-3 mr-1" /> New Skill!
                    </Badge>
                  )}
                </div>
              </div>

              <ScrollArea className="max-h-[60vh]">
                <div className="px-6 py-4 space-y-5">
                  <div>
                    <h3 className="text-sm font-bold font-sans text-foreground/80 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-primary" />
                      Allocate Stat Points
                      <span className="text-xs text-muted-foreground font-normal ml-auto">{totalStatAllocated}/2 assigned</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {(["might", "agility", "endurance", "intellect", "will", "presence"] as const).map(stat => {
                        const base = currentStats[stat] ?? 10;
                        const added = statPoints[stat] ?? 0;
                        return (
                          <div key={stat} className="flex items-center justify-between bg-muted/40 rounded-lg px-2 sm:px-3 py-2 border border-border/50 gap-1" data-testid={`stat-row-${stat}`}>
                            <div className="min-w-0 shrink">
                              <span className="text-[10px] sm:text-xs font-sans font-bold uppercase text-foreground/80 block leading-tight truncate">{stat}</span>
                              <span className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{base}{added > 0 ? ` +${added}` : ""}</span>
                            </div>
                            <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                              <button
                                onClick={() => {
                                  if (added > 0) setStatPoints(prev => ({ ...prev, [stat]: prev[stat] - 1 }));
                                }}
                                disabled={added === 0}
                                className="w-6 h-6 rounded bg-background border border-border text-xs font-bold text-foreground/60 hover:text-foreground disabled:opacity-30 transition-colors"
                                data-testid={`button-stat-minus-${stat}`}
                              >
                                -
                              </button>
                              <span className={`w-4 sm:w-5 text-center text-xs sm:text-sm font-bold ${added > 0 ? "text-primary" : "text-muted-foreground/50"}`}>{added}</span>
                              <button
                                onClick={() => {
                                  if (totalStatAllocated < 2) setStatPoints(prev => ({ ...prev, [stat]: prev[stat] + 1 }));
                                }}
                                disabled={totalStatAllocated >= 2}
                                className="w-6 h-6 rounded bg-background border border-border text-xs font-bold text-foreground/60 hover:text-foreground disabled:opacity-30 transition-colors"
                                data-testid={`button-stat-plus-${stat}`}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {isMilestone && classSkills && (
                    <div>
                      <h3 className="text-sm font-bold font-sans text-foreground/80 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-violet-400" />
                        Choose a New Skill
                        <span className="text-xs text-muted-foreground font-normal ml-auto capitalize">{charClass} — Level {levelUpData.newLevel}</span>
                      </h3>
                      <div className="space-y-2">
                        {classSkills.choices.map(skill => {
                          const isSelected = selectedSkillIds.includes(skill.id);
                          return (
                            <button
                              key={skill.id}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedSkillIds(prev => prev.filter(id => id !== skill.id));
                                } else if (selectedSkillIds.length < requiredPicks) {
                                  setSelectedSkillIds(prev => [...prev, skill.id]);
                                }
                              }}
                              className={`w-full text-left rounded-lg border p-3 transition-all ${
                                isSelected
                                  ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                                  : "border-border/60 bg-muted/30 hover:border-primary/40 hover:bg-muted/50"
                              }`}
                              data-testid={`button-skill-${skill.id}`}
                            >
                              <div className="flex items-start gap-2">
                                <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                                  isSelected ? "border-primary bg-primary" : "border-muted-foreground/40"
                                }`}>
                                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold font-sans text-foreground">{skill.name}</p>
                                  <p className="text-xs text-foreground/60 font-serif mt-0.5">{skill.description}</p>
                                  <p className="text-[10px] text-primary/80 font-sans font-semibold mt-1">{skill.mechanicalEffect}</p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {isMilestone && racialSkill && (
                    <div>
                      <h3 className="text-sm font-bold font-sans text-foreground/80 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Gem className="w-4 h-4 text-amber-400" />
                        Racial Skill Unlocked
                        <span className="text-xs text-muted-foreground font-normal ml-auto">{charRace}</span>
                      </h3>
                      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                        <p className="text-sm font-bold font-sans text-foreground">{racialSkill.name}</p>
                        <p className="text-xs text-foreground/60 font-serif mt-0.5">{racialSkill.description}</p>
                        <p className="text-[10px] text-amber-400/80 font-sans font-semibold mt-1">{racialSkill.mechanicalEffect}</p>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="px-6 py-4 border-t border-border flex-shrink-0">
                <Button
                  onClick={confirmLevelUp}
                  disabled={!canConfirm || levelUpBusy}
                  className="w-full"
                  data-testid="button-confirm-level-up"
                >
                  {levelUpBusy ? "Applying..." : canConfirm ? "Confirm Level Up" : `Assign ${2 - totalStatAllocated} more stat point${2 - totalStatAllocated !== 1 ? "s" : ""}${needsSkillPick && selectedSkillIds.length < requiredPicks ? " & pick a skill" : ""}`}
                </Button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
