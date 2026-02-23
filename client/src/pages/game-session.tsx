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
  Scroll
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
  const [isFirstTurn, setIsFirstTurn] = useState(true);
  const [messagesLoaded, setMessagesLoaded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const { data: partyData } = useQuery<any>({
    queryKey: [`/api/parties/${partyId}`],
  });

  // Load messages — must complete before the auto-start effect can fire
  useEffect(() => {
    fetch(`/api/parties/${partyId}/messages`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMessages(data);
          if (data.length > 0) setIsFirstTurn(false);
        }
        setMessagesLoaded(true);
      })
      .catch(() => setMessagesLoaded(true));
  }, [partyId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // WebSocket
  useEffect(() => {
    const wsUrl = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);
    socket.onopen = () => socket.send(JSON.stringify({ type: "JOIN_PARTY", partyId }));
    socket.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "MESSAGE") {
        setMessages(prev => {
          if (prev.find(m => m.id === msg.message.id)) return prev;
          return [...prev, msg.message];
        });
        if (msg.message.role === "gm") setIsFirstTurn(false);
      }
    };
    return () => socket.close();
  }, [partyId]);

  // Start adventure only after messages have loaded and none exist yet
  useEffect(() => {
    if (messagesLoaded && isFirstTurn && partyData && !sending) {
      startAdventure();
    }
  }, [messagesLoaded, isFirstTurn, partyData]);

  const startAdventure = useCallback(async () => {
    await sendAction("*The adventure begins. Set the scene and introduce the party to their surroundings.*", "Game Master");
  }, [partyId]);

  async function sendAction(content: string, playerName?: string) {
    if (!content.trim() || sending) return;

    setSending(true);
    setStreamingContent("");
    setIsStreaming(true);

    const name = playerName ?? partyData?.members?.find((m: any) => m.userId === user?.id)?.character?.name ?? "Adventurer";

    // Add optimistic player message (not for gm calls)
    if (!playerName) {
      const optimistic: ChatMsg = {
        id: `opt-${Date.now()}`,
        role: "player",
        content,
        userId: user?.id,
        metadata: { playerName: name },
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, optimistic]);
      setInput("");
    }

    abortRef.current = new AbortController();

    try {
      const res = await fetch(`/api/parties/${partyId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, playerName: name }),
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
              // The WS broadcast handles message addition
              // But add it if not already present
              if (evt.message) {
                setMessages(prev => {
                  if (prev.find(m => m.id === evt.message.id)) return prev;
                  return [...prev.filter(m => !m.id.startsWith("opt-")), evt.message];
                });
              }
              // Extract quick actions from metadata
              if (evt.message?.metadata?.updates) {
                // Parse quick actions from gm response if embedded
              }
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
      // Parse JSON to extract narrative
      let narrative = msg.content;
      try {
        const jsonMatch = msg.content.match(/```json\s*([\s\S]*?)\s*```/) ||
                          msg.content.match(/(\{[\s\S]*\})/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[1]);
          if (parsed.narrative) narrative = parsed.narrative;
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
        </div>
      );
    }

    // Player message — look up the speaker's portrait from the party members list
    const speakerMember = members.find((m: any) => m.character?.name === playerName);
    const speakerPortrait = speakerMember?.character?.profilePicture ?? null;

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
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <ScrollArea className="flex-1 px-4 py-4">
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

          {/* Quick Actions */}
          {quickActions.length > 0 && !isStreaming && (
            <div className="flex-shrink-0 px-4 py-2 border-t border-border/50">
              <div className="flex gap-2 overflow-x-auto pb-1 max-w-3xl mx-auto">
                {quickActions.map(action => (
                  <button
                    key={action}
                    onClick={() => sendAction(action)}
                    disabled={sending}
                    data-testid={`button-quick-action`}
                    className="flex-shrink-0 text-xs font-serif italic text-muted-foreground/70 px-3 py-1.5 rounded-full border border-border/50 hover:border-primary/50 hover:text-foreground transition-all whitespace-nowrap"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="flex-shrink-0 border-t border-border bg-card/50 p-3">
            <div className="flex gap-2 max-w-3xl mx-auto">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  className="w-full bg-input border border-border rounded-md px-4 py-3 text-sm font-serif text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                  placeholder="What do you do? (Shift+Enter for new line)"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  style={{ minHeight: "44px", maxHeight: "120px" }}
                  disabled={isStreaming}
                  data-testid="input-action"
                />
              </div>
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

        {/* Character Panel (collapsible) */}
        {showCharacters && (
          <div className="w-72 flex-shrink-0 border-l border-border bg-card/50 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <span className="text-xs font-sans tracking-widest text-muted-foreground uppercase">Party</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowCharacters(false)}>
                <ChevronDown className="w-4 h-4 rotate-90" />
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-3">
                {members.map((m: any) => {
                  const char = m.character;
                  if (!char) return null;
                  const hpPct = Math.round((char.currentHp / char.maxHp) * 100);
                  const stats = (char.stats as Record<string, number>) || {};
                  return (
                    <div key={m.id} className="rounded-md border border-border bg-card p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Sword className={`w-4 h-4 ${classColors[char.class] ?? "text-muted-foreground"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-sans font-bold text-sm tracking-wide truncate">{char.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{char.race} {char.class}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs flex-shrink-0">Lv.{char.level}</Badge>
                      </div>

                      {/* HP */}
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

                      {/* Quick stats */}
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

                      {/* Conditions */}
                      {((char.conditions as string[]) || []).length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {(char.conditions as string[]).map((c: string) => (
                            <Badge key={c} variant="destructive" className="text-xs">{c}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Dice Roller */}
                <div className="rounded-md border border-border bg-card p-3">
                  <p className="text-xs font-sans tracking-widest text-muted-foreground uppercase mb-3 flex items-center gap-1.5">
                    <Dices className="w-3.5 h-3.5 text-primary" /> Dice
                  </p>
                  <DiceRoller />
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
