import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Sword, ArrowLeft, Dices, Users, Heart, Send, ChevronDown,
  Scroll, Package, Shield, Zap, Gem, Coffee, Wrench, MapPin, Skull,
  Mic, MicOff, MessageCircle, Radio, BookOpen, Star, Activity, Brain, ScrollText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

type TabType = "chat" | "characters" | "dice";

const QUICK_ACTIONS_DEFAULT = [
  "Look around carefully",
  "Search for clues",
  "Talk to the nearest person",
  "Check the area for threats",
  "Make camp and rest",
];

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
  const [quickActions, setQuickActions] = useState<string[]>(QUICK_ACTIONS_DEFAULT);
  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const [showCharacters, setShowCharacters] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"party" | "inventory" | "map" | "dice" | "sheet" | "log">("party");
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
  const [turnHint, setTurnHint] = useState<{ character: string; prompt: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const { data: partyData } = useQuery<any>({
    queryKey: [`/api/parties/${partyId}`],
  });

  const { data: situations = [] } = useQuery<any[]>({
    queryKey: [`/api/parties/${partyId}/situations`],
    refetchInterval: 8000,
  });

  const { data: npcs = [] } = useQuery<any[]>({
    queryKey: [`/api/parties/${partyId}/npcs`],
    refetchInterval: 10000,
  });

  // Load messages — must complete before the auto-start effect can fire
  useEffect(() => {
    fetch(`/api/parties/${partyId}/messages`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMessages(data);
          if (data.length > 0) setIsFirstTurn(false);
          const lastGm = [...data].reverse().find((m: ChatMsg) => m.role === "gm");
          const savedQa = lastGm?.metadata?.quickActions;
          if (Array.isArray(savedQa) && savedQa.length > 0) setQuickActions(savedQa);
          const savedTh = lastGm?.metadata?.turnHint;
          if (savedTh?.character) setTurnHint(savedTh);
        }
        setMessagesLoaded(true);
      })
      .catch(() => setMessagesLoaded(true));
  }, [partyId]);

  // Fetch scene background when location changes
  const currentLocation = partyData?.worldState?.state?.currentLocation ?? "";
  useEffect(() => {
    if (!currentLocation || !partyId) return;

    if (backgroundPollRef.current) {
      clearInterval(backgroundPollRef.current);
      backgroundPollRef.current = null;
    }

    const fetchBg = async () => {
      const res = await fetch(`/api/parties/${partyId}/scene-background`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.imageData) {
        setSceneBackground(data.imageData);
        setBackgroundPending(false);
        if (backgroundPollRef.current) {
          clearInterval(backgroundPollRef.current);
          backgroundPollRef.current = null;
        }
      } else if (data.pending) {
        setBackgroundPending(true);
      }
    };

    fetchBg();

    // Poll every 6s while background is still generating
    backgroundPollRef.current = setInterval(fetchBg, 6000);
    return () => {
      if (backgroundPollRef.current) {
        clearInterval(backgroundPollRef.current);
        backgroundPollRef.current = null;
      }
    };
  }, [currentLocation, partyId]);

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
          setMessages(prev => {
            const incoming = msg.message;
            const isDupe = prev.some(m => m.id === incoming.id);
            if (isDupe) return prev;
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
          }
        } else if (msg.type === "STATE_UPDATE") {
          queryClient.invalidateQueries({ queryKey: [`/api/parties/${partyId}`] });
        } else if (msg.type === "TURN_HINT" && msg.turnHint) {
          setTurnHint(msg.turnHint);
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

  const startAdventure = useCallback(async () => {
    await sendAction("*Campaign start. Drop the player straight into the middle of something happening right now — no preamble, no scenic vista. Something is already in motion: a confrontation, a job going sideways, waking up somewhere unexpected, an NPC doing something weird. The player is reacting, not arriving.*", "Game Master");
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

  async function sendAction(content: string, playerName?: string, modeOverride?: "action" | "dialogue" | "ooc") {
    if (!content.trim() || sending) return;

    setSending(true);
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
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.type === "chunk") {
              accumulated += evt.content;
              setStreamingContent(accumulated);
            } else if (evt.type === "done") {
              setStreamingContent("");
              setIsStreaming(false);
              if (evt.message) {
                setMessages(prev => {
                  if (prev.find(m => m.id === evt.message.id)) return prev;
                  return [...prev.filter(m => !m.id.startsWith("opt-")), evt.message];
                });
              }
              const qa = evt.quickActions ?? evt.message?.metadata?.quickActions ?? [];
              if (qa.length > 0) setQuickActions(qa);
              const th = evt.turnHint ?? evt.message?.metadata?.turnHint ?? null;
              if (th) setTurnHint(th);
            }
          } catch (_) {}
        }
      }
    } catch (e: any) {
      if (e.name !== "AbortError") {
        toast({ title: "Connection lost", description: "The GM couldn't respond. Try again.", variant: "destructive" });
        setIsStreaming(false);
        setStreamingContent("");
      }
    } finally {
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
      // Parse JSON to extract narrative and dice requests
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

      return (
        <div key={msg.id} className="space-y-2" data-testid={`message-gm-${msg.id}`}>
          <div className="flex items-center gap-2">
            <Scroll className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="text-xs font-sans tracking-widest text-primary uppercase">The Chronicle</span>
          </div>
          <div className="narrative-bg rounded-md p-4 prose-fantasy text-foreground/90">
            <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-p:my-2">
              {narrative.split("\n").map((line: string, i: number) => (
                line ? <p key={i} className="font-serif leading-relaxed text-foreground/85 my-1.5">{line}</p> : <br key={i} />
              ))}
            </div>
          </div>
          {diceRequests.length > 0 && (
            <div className="space-y-1.5 mt-1">
              {diceRequests.map((req: any, i: number) => {
                const promptKey = `${msg.id}-${i}`;
                const alreadyRolled = !!rolledPrompts[promptKey];
                const modStr = req.modifier > 0 ? `+${req.modifier}` : req.modifier < 0 ? `${req.modifier}` : "";
                const advStr = req.advantage && req.advantage !== "normal" ? ` (${req.advantage})` : "";
                return (
                  <div key={i} className="flex items-center gap-2.5 bg-amber-950/25 border border-amber-800/35 rounded-md px-3 py-2" data-testid={`dice-prompt-${promptKey}`}>
                    <Dices className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-sans text-amber-200/90 font-semibold leading-tight">{req.purpose}</p>
                      <p className="text-xs text-muted-foreground/60 font-mono">{req.character} — {req.die ?? "d20"}{modStr}{advStr}</p>
                    </div>
                    {alreadyRolled ? (
                      <span className="text-xs text-muted-foreground/40 italic px-2">Rolled ✓</span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-3 text-xs border-amber-700/50 text-amber-300 hover:bg-amber-900/30 hover:text-amber-200"
                        data-testid={`button-roll-${promptKey}`}
                        onClick={async () => {
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
                        }}
                      >
                        🎲 Roll
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
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
            <p className="text-xs text-muted-foreground font-sans tracking-wide mb-1 flex items-center gap-1">
              <MessageCircle className="w-3 h-3 text-primary/60" /> {playerName}
            </p>
            <p className="font-serif text-foreground/90 text-sm leading-relaxed italic border-l-2 border-primary/40 pl-3">
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
          <p className="text-xs text-muted-foreground font-sans tracking-wide mb-1">{playerName}</p>
          <p className="font-serif text-foreground/80 text-sm leading-relaxed">{msg.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-border bg-card/80 backdrop-blur-sm z-40">
        <div className="flex items-center gap-3 px-4 h-12">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="h-8 w-8" data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
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
                  {m.character?.name} · {m.character?.currentHp}/{m.character?.maxHp} HP
                </TooltipContent>
              </Tooltip>
            ))}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowCharacters(p => !p)} data-testid="button-toggle-chars">
              <Users className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Scene background */}
          {sceneBackground && (
            <div
              className="absolute inset-0 z-0 pointer-events-none"
              style={{
                backgroundImage: `url(${sceneBackground})`,
                backgroundSize: "cover",
                backgroundPosition: "center top",
                backgroundRepeat: "no-repeat",
                transition: "background-image 1.2s ease-in-out",
              }}
            >
              <div className="absolute inset-0 bg-background/82" />
            </div>
          )}
          {/* Subtle shimmer while background is generating */}
          {backgroundPending && !sceneBackground && (
            <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-br from-primary/5 via-transparent to-primary/5 animate-pulse" />
          )}

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
                {messages.map(renderMessage)}

                {/* Streaming GM message */}
                {isStreaming && streamingContent && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Scroll className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      <span className="text-xs font-sans tracking-widest text-primary uppercase">The Chronicle</span>
                      <div className="flex gap-1">
                        {[0, 1, 2].map(i => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                    </div>
                    <div className="narrative-bg rounded-md p-4">
                      <div className="prose prose-invert prose-sm max-w-none">
                        {(() => {
                          // Try to extract narrative from partial JSON
                          let text = streamingContent;
                          try {
                            const narrativeMatch = text.match(/"narrative"\s*:\s*"([\s\S]*?)(?:"|$)/);
                            if (narrativeMatch) text = narrativeMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
                          } catch (_) {}
                          return text.split("\n").map((line: string, i: number) => (
                            line ? <p key={i} className="font-serif leading-relaxed text-foreground/85 my-1">{line}</p> : <br key={i} />
                          ));
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

          {/* Turn Hint */}
          {turnHint && !isStreaming && !sending && (
            <div className="flex-shrink-0 px-4 py-1.5 border-t border-border/40 bg-primary/5 relative z-10">
              <div className="max-w-3xl mx-auto flex items-center gap-2 text-xs" data-testid="turn-hint-banner">
                {(() => {
                  const myChar = myMember?.character;
                  const isMyTurn = myChar && turnHint.character.toLowerCase() === myChar.name.toLowerCase();
                  return (
                    <>
                      <span className={`font-sans font-bold ${isMyTurn ? "text-primary" : "text-muted-foreground"}`}>
                        {isMyTurn ? "Your turn" : `${turnHint.character}'s turn`}
                      </span>
                      <span className="text-muted-foreground/60">—</span>
                      <span className="font-serif italic text-muted-foreground truncate">{turnHint.prompt}</span>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {quickActions.length > 0 && !isStreaming && (
            <div className="flex-shrink-0 px-4 py-2 border-t border-border bg-card/90 backdrop-blur-sm relative z-10">
              <div className="flex gap-2 overflow-x-auto pb-1 max-w-3xl mx-auto">
                {quickActions.map(action => (
                  <button
                    key={action}
                    onClick={() => sendAction(action)}
                    disabled={sending}
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
          <div className="flex-shrink-0 border-t border-border bg-card/90 backdrop-blur-sm p-3 relative z-10">
            <div className="max-w-3xl mx-auto space-y-2">
              {/* Mode selector */}
              <div className="flex gap-1.5 items-center">
                {([
                  { id: "action", label: "Act", icon: Sword, tip: "Perform an action — the GM narrates what happens" },
                  { id: "dialogue", label: "Say", icon: MessageCircle, tip: "Speak in character — NPCs will respond" },
                  { id: "ooc", label: "OOC", icon: Radio, tip: "Out of character — visible to party only, GM ignores" },
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
                      inputMode === "dialogue"
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
                    disabled={isStreaming}
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

                {/* Send button */}
                <Button
                  onClick={() => sendAction(input)}
                  disabled={!input.trim() || sending}
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
              </div>
            </div>
          </div>
        </div>

        {/* Character Panel (collapsible) */}
        {showCharacters && (
          <div className="w-72 flex-shrink-0 border-l border-border bg-card/50 flex flex-col overflow-hidden">
            {/* Panel header with tabs */}
            <div className="flex-shrink-0 border-b border-border">
              <div className="flex items-center justify-between px-3 pt-2.5 pb-0">
                <div className="flex">
                  {([
                    { id: "party", icon: Users, label: "Party" },
                    { id: "sheet", icon: BookOpen, label: "Sheet" },
                    { id: "inventory", icon: Package, label: "Bag" },
                    { id: "map", icon: MapPin, label: "Map" },
                    { id: "dice", icon: Dices, label: "Dice" },
                    { id: "log", icon: ScrollText, label: "Cast" },
                  ] as const).map(tab => (
                    <Tooltip key={tab.id}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setSidebarTab(tab.id)}
                          data-testid={`button-sidebar-tab-${tab.id}`}
                          className={`flex flex-col items-center gap-0.5 px-2 py-2 text-[10px] font-sans tracking-wide transition-colors border-b-2 ${
                            sidebarTab === tab.id
                              ? "text-primary border-primary"
                              : "text-muted-foreground border-transparent hover:text-foreground"
                          }`}
                        >
                          <tab.icon className="w-4 h-4" />
                          <span>{tab.label}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">{tab.label}</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 mb-1" onClick={() => setShowCharacters(false)}>
                  <ChevronDown className="w-4 h-4 rotate-90" />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-3 space-y-3">

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
                            </div>
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
                          {companions.map((npc: any) => (
                            <div key={npc.id} data-testid={`card-companion-${npc.id}`} className="rounded-md border border-amber-700/40 bg-amber-950/20 p-3 space-y-1.5">
                              <div className="flex items-center gap-2">
                                {npc.hasPortrait ? (
                                  <img src={`/api/npcs/${npc.id}/portrait`} alt={npc.name} className="w-8 h-8 rounded object-cover object-top flex-shrink-0 border border-amber-700/30" />
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
                              </div>
                              {npc.description && (
                                <p className="text-[11px] text-muted-foreground/80 leading-snug">{npc.description}</p>
                              )}
                            </div>
                          ))}
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
                  const typeOrder = ["weapon", "armor", "consumable", "tool", "treasure", "other"];
                  const typeIcons: Record<string, any> = {
                    weapon: Sword, armor: Shield, consumable: Coffee,
                    tool: Wrench, treasure: Gem, other: Package,
                  };
                  const typeLabels: Record<string, string> = {
                    weapon: "Weapons", armor: "Armor", consumable: "Consumables",
                    tool: "Tools", treasure: "Valuables", other: "Misc",
                  };
                  const grouped: Record<string, { item: any; originalIndex: number }[]> = {};
                  items.forEach((item, idx) => {
                    const t = item.type ?? "other";
                    if (!grouped[t]) grouped[t] = [];
                    grouped[t].push({ item, originalIndex: idx });
                  });

                  const toggleEquip = async (itemIndex: number, equipped: boolean) => {
                    try {
                      await fetch(`/api/characters/${char.id}/equip`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ itemIndex, equipped }),
                      });
                      queryClient.invalidateQueries({ queryKey: [`/api/parties/${partyId}`] });
                    } catch {
                      toast({ title: "Failed to update equipment", variant: "destructive" });
                    }
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
                      .filter(([k]) => !["damage","bonus","ac","ac_bonus","range","two_handed","thrown","finesse","heal","focus","value"].includes(k))
                      .map(([k, v]) => `${k}: ${v}`);
                    parts.push(...extra);
                    return parts.length > 0 ? parts.join(" · ") : null;
                  };

                  const canEquip = (item: any) => item.type === "weapon" || item.type === "armor";

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
                                      {props && (
                                        <p className="text-xs text-muted-foreground mt-0.5">{props}</p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                                      {item.qty > 1 && (
                                        <span className="text-xs font-sans font-bold text-primary">x{item.qty}</span>
                                      )}
                                      {equipable && (
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
                                {ab.usesMax > 0 && (
                                  <div className="flex gap-0.5">
                                    {Array.from({ length: ab.usesMax }).map((_, j) => (
                                      <div key={j} className={`w-2 h-2 rounded-full ${j < ab.usesLeft ? "bg-primary" : "bg-secondary"}`} />
                                    ))}
                                  </div>
                                )}
                              </div>
                              {ab.description && (
                                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{ab.description}</p>
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
                                        <p className="text-xs font-serif text-muted-foreground leading-snug italic">{sit.situation}</p>
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

                      <p className="text-xs font-sans tracking-widest text-muted-foreground uppercase flex items-center gap-1.5 pb-1 pt-1 border-t border-border">
                        <MapPin className="w-3 h-3 text-primary" /> Journey Map
                      </p>

                      {locations.length === 0 ? (
                        <div className="text-center py-8">
                          <MapPin className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                          <p className="text-xs text-muted-foreground font-serif italic">
                            No locations discovered yet.
                          </p>
                        </div>
                      ) : (
                        <div className="relative">
                          {/* Vertical connector line */}
                          {locations.length > 1 && (
                            <div className="absolute left-[11px] top-6 bottom-6 w-px bg-border/60" />
                          )}
                          <div className="space-y-2">
                            {locations.map((loc: any, i: number) => {
                              const isCurrent = loc.name === currentLocation;
                              return (
                                <div
                                  key={i}
                                  data-testid={`map-location-${i}`}
                                  className={`flex gap-3 items-start relative`}
                                >
                                  {/* Node dot */}
                                  <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 mt-0.5 ${
                                    isCurrent
                                      ? "border-primary bg-primary/20"
                                      : loc.threat
                                      ? "border-red-500/60 bg-red-500/10"
                                      : "border-border bg-card"
                                  }`}>
                                    {loc.threat ? (
                                      <Skull className="w-3 h-3 text-red-400" />
                                    ) : (
                                      <MapPin className={`w-3 h-3 ${isCurrent ? "text-primary" : "text-muted-foreground/40"}`} />
                                    )}
                                  </div>

                                  {/* Location card */}
                                  <div className={`flex-1 min-w-0 rounded-md border px-2.5 py-2 mb-1 ${
                                    isCurrent
                                      ? "border-primary/50 bg-primary/5"
                                      : "border-border bg-card/60"
                                  }`}>
                                    <div className="flex items-start justify-between gap-1">
                                      <p className={`text-xs font-sans font-semibold leading-tight ${isCurrent ? "text-primary" : "text-foreground"}`}>
                                        {loc.name}
                                      </p>
                                      {isCurrent && (
                                        <span className="text-xs font-sans text-primary/70 flex-shrink-0">here</span>
                                      )}
                                    </div>
                                    {loc.title && loc.title !== loc.name && (
                                      <p className="text-xs text-muted-foreground font-serif italic mt-0.5 leading-tight">{loc.title}</p>
                                    )}
                                    {loc.threat && (
                                      <p className="text-xs text-red-400 mt-0.5 flex items-center gap-1">
                                        <Skull className="w-2.5 h-2.5" /> {loc.threat}
                                      </p>
                                    )}
                                    <p className="text-xs text-muted-foreground/40 mt-1">Turn {loc.firstVisitedTurn}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
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
                            <img
                              src={char.profilePicture}
                              alt={char.name}
                              className="w-14 h-14 rounded-md object-cover flex-shrink-0 border border-border"
                              data-testid="sheet-portrait"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-md bg-secondary flex items-center justify-center flex-shrink-0 border border-border">
                              <BookOpen className="w-6 h-6 text-muted-foreground" />
                            </div>
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
                        return (
                          <div className="rounded-md border border-primary/20 bg-primary/5 p-3 space-y-1.5" data-testid="equipped-gear">
                            <p className="text-xs font-sans tracking-widest text-muted-foreground uppercase flex items-center gap-1.5">
                              <Sword className="w-3 h-3 text-primary" /> Equipped Gear
                            </p>
                            {equipped.map((item: any, i: number) => {
                              const rarity = item.rarity ?? "common";
                              return (
                                <div key={i} className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className={`text-xs font-sans font-medium ${rarity !== "common" ? (sheetRarityText[rarity] ?? "") : ""}`}>{item.name}</span>
                                    {rarity !== "common" && (
                                      <span className={`text-[8px] font-sans font-bold uppercase ${sheetRarityText[rarity] ?? ""}`}>{rarity}</span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-muted-foreground flex-shrink-0">
                                    {item.type === "weapon" && item.properties?.damage ? `${item.properties.damage}${item.properties.bonus ? ` +${item.properties.bonus}` : ""}` : ""}
                                    {item.type === "armor" && item.properties?.ac ? `AC ${item.properties.ac}` : ""}
                                    {item.type === "armor" && item.properties?.ac_bonus ? `+${item.properties.ac_bonus} AC` : ""}
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
                                  {ab.usesMax > 0 && (
                                    <div className="flex gap-0.5 flex-shrink-0">
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
                                {ab.description && (
                                  <p className="text-xs text-muted-foreground leading-snug font-serif">{ab.description}</p>
                                )}
                                {ab.usesMax > 0 && (
                                  <p className="text-[10px] text-muted-foreground/50 font-sans">{ab.usesLeft}/{ab.usesMax} uses remaining</p>
                                )}
                              </div>
                            ))}
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
                  const renderNpc = (npc: any) => {
                    const rel = npc.relationship ?? "neutral";
                    const colorCls = npc.isPartyMember
                      ? "text-amber-300 border-amber-700/60 bg-amber-950/30"
                      : (relColor[rel] ?? relColor.neutral);
                    return (
                      <div key={npc.id} data-testid={`card-npc-${npc.id}`} className={`rounded-md border p-3 space-y-1.5 ${colorCls}`}>
                        {/* Portrait + name row */}
                        <div className="flex items-start gap-2.5">
                          <div className="flex-shrink-0">
                            {npc.hasPortrait ? (
                              <img
                                src={`/api/npcs/${npc.id}/portrait`}
                                alt={npc.name}
                                className="w-14 h-14 rounded object-cover object-top border border-current/20"
                                data-testid={`img-npc-portrait-${npc.id}`}
                              />
                            ) : (
                              <div className="w-14 h-14 rounded bg-muted/50 border border-current/20 animate-pulse flex items-center justify-center">
                                <ScrollText className="w-5 h-5 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="flex items-start justify-between gap-1 flex-wrap">
                              <span className="font-semibold text-sm leading-tight">{npc.name}</span>
                              <div className="flex gap-1 flex-wrap">
                                {npc.isPartyMember && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded border border-amber-600/60 bg-amber-900/40 text-amber-400 font-sans tracking-wide uppercase flex-shrink-0">
                                    ★ Companion
                                  </span>
                                )}
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide whitespace-nowrap border flex-shrink-0 ${relColor[rel] ?? relColor.neutral}`}>
                                  {rel}
                                </span>
                              </div>
                            </div>
                            {npc.role && (
                              <p className="text-xs text-muted-foreground italic leading-tight">{npc.role}</p>
                            )}
                            {npc.lastSeen && (
                              <p className="text-[10px] text-muted-foreground/70">
                                <span className="font-medium">Last seen:</span> {npc.lastSeen}
                              </p>
                            )}
                          </div>
                        </div>
                        {npc.description && (
                          <p className="text-xs leading-snug">{npc.description}</p>
                        )}
                        {npc.notes && (
                          <p className="text-[10px] text-muted-foreground/80 border-t border-current/20 pt-1.5">
                            {npc.notes}
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
                            <Users className="w-3 h-3" /> Active Companions
                          </p>
                          {companions.map(renderNpc)}
                          {others.length > 0 && (
                            <p className="text-[10px] font-sans tracking-widest text-muted-foreground/40 uppercase pt-1 border-t border-border flex items-center gap-1.5">
                              <ScrollText className="w-3 h-3" /> Known Characters
                            </p>
                          )}
                        </>
                      )}
                      {others.map(renderNpc)}
                    </div>
                  );
                })()}

              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
