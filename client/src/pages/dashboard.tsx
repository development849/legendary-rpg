import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sword, Shield, Plus, LogOut, ScrollText, Users, Dices, ChevronRight, Scroll, Target, Star, Flame, Music, Trash2, Pencil } from "lucide-react";
import FriendsPanel from "@/components/FriendsPanel";
import { apiRequest } from "@/lib/queryClient";
import type { Character } from "@shared/schema";
import logoPath from "@assets/legendary-logo-transparent.png";

function useHallBackground() {
  const { data, isLoading } = useQuery<{ imageData: string | null; pending: boolean }>({
    queryKey: ["/api/system/hall-background"],
    refetchInterval: (q) => {
      const d = q.state.data as { imageData: string | null; pending: boolean } | undefined;
      return d?.pending && !d?.imageData ? 6000 : false;
    },
    staleTime: 60_000,
  });
  return { imageData: data?.imageData ?? null, pending: data?.pending ?? false, isLoading };
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { imageData: hallBg } = useHallBackground();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: characters = [], isLoading: charsLoading } = useQuery<Character[]>({
    queryKey: ["/api/characters"],
  });

  const { data: parties = [], isLoading: partiesLoading } = useQuery<any[]>({
    queryKey: ["/api/parties"],
  });

  const [confirmDelete, setConfirmDelete] = useState<{ type: "character" | "campaign"; id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState<{ type: "character" | "campaign"; id: string; name: string } | null>(null);
  const [editName, setEditName] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editing]);

  async function handleRename() {
    if (!editing || !editName.trim() || editName.trim() === editing.name) {
      setEditing(null);
      return;
    }
    try {
      const endpoint = editing.type === "character"
        ? `/api/characters/${editing.id}/name`
        : `/api/campaigns/${editing.id}/settings`;
      await apiRequest("PATCH", endpoint, { name: editName.trim() });
      queryClient.invalidateQueries({ queryKey: [editing.type === "character" ? "/api/characters" : "/api/parties"] });
      toast({ title: "Renamed", description: `Updated to "${editName.trim()}"` });
    } catch {
      toast({ title: "Error", description: "Failed to rename", variant: "destructive" });
    }
    setEditing(null);
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const endpoint = confirmDelete.type === "character"
        ? `/api/characters/${confirmDelete.id}`
        : `/api/campaigns/${confirmDelete.id}`;
      const res = await fetch(endpoint, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Failed" }));
        throw new Error(data.error);
      }
      await queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/parties"] });
      toast({ title: `${confirmDelete.type === "character" ? "Character" : "Campaign"} deleted`, description: `"${confirmDelete.name}" has been removed.` });
      setConfirmDelete(null);
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  }

  const displayName = user?.firstName || user?.email?.split("@")[0] || "Adventurer";

  const classColors: Record<string, string> = {
    fighter: "text-red-400",
    rogue: "text-emerald-400",
    wizard: "text-violet-400",
    cleric: "text-amber-400",
    ranger: "text-teal-400",
    paladin: "text-yellow-300",
    barbarian: "text-orange-400",
    bard: "text-rose-400",
  };

  const classIcons: Record<string, typeof Sword> = {
    fighter: Sword,
    rogue: Dices,
    wizard: ScrollText,
    cleric: Shield,
    ranger: Target,
    paladin: Star,
    barbarian: Flame,
    bard: Music,
  };

  return (
    <div className="min-h-screen bg-background relative">
      {hallBg && (
        <div
          className="fixed inset-0 z-0"
          style={{
            backgroundImage: `url(${hallBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center 30%",
            transition: "opacity 1s ease-in-out",
          }}
        />
      )}
      <div className="fixed inset-0 z-0 bg-gradient-to-t from-background/95 via-background/60 to-background/20" />
      {/* Header */}
      <header className="relative z-10 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logoPath} alt="Legendary" className="w-7 h-7 rounded-sm object-contain" />
            <span className="font-sans font-bold tracking-widest text-lg">LEGENDARY RPG<sup className="text-xs align-super ml-px">℠</sup></span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-muted-foreground text-sm font-serif">Welcome, {displayName}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => logout()}
              data-testid="button-logout"
              className="text-muted-foreground"
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              Depart
            </Button>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-10 space-y-10">
        {/* Welcome Banner */}
        <div
          className="relative rounded-md border border-primary/20 overflow-hidden bg-card/30 backdrop-blur-sm"
          style={{ minHeight: "180px" }}
          data-testid="banner-hall"
        >
          <div className="relative z-20 p-8 space-y-2">
            <p className="text-primary font-sans tracking-widest text-xs uppercase">Chronicle · Session Dashboard</p>
            <h1 className="text-3xl font-sans font-bold tracking-wider drop-shadow-sm">
              The Hall of Legends
            </h1>
            <p className="text-muted-foreground font-serif italic">
              Your characters stand ready. Your campaigns await continuation.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Characters Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sword className="w-4 h-4 text-primary" />
                <h2 className="font-sans font-semibold tracking-widest text-sm uppercase">Your Characters</h2>
              </div>
              <Link href="/characters/new">
                <Button size="sm" variant="outline" data-testid="button-create-character">
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  New Hero
                </Button>
              </Link>
            </div>

            {charsLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="h-20 bg-card/50 rounded-md border border-border animate-pulse" />
                ))}
              </div>
            ) : characters.length === 0 ? (
              <Card className="border-dashed border-border/50">
                <CardContent className="py-10 text-center space-y-4">
                  <Sword className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                  <div>
                    <p className="text-muted-foreground font-serif italic">No heroes yet...</p>
                    <p className="text-muted-foreground/50 text-sm mt-1">Create your first character to begin</p>
                  </div>
                  <Link href="/characters/new">
                    <Button data-testid="button-create-first-character">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your Hero
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {characters.map((char) => {
                  const Icon = classIcons[char.class] || Sword;
                  const colorClass = classColors[char.class] || "text-foreground";
                  const hpPct = Math.round((char.currentHp / char.maxHp) * 100);
                  return (
                    <Link key={char.id} href={`/characters/${char.id}`}>
                      <div
                        className="group flex items-center gap-4 p-4 rounded-md border border-border bg-card hover-elevate cursor-pointer transition-all duration-200"
                        data-testid={`card-character-${char.id}`}
                      >
                        <div className={`flex-shrink-0 w-10 h-10 rounded-md overflow-hidden bg-secondary flex items-center justify-center ${colorClass}`}>
                          {(char as any).profilePicture ? (
                            <img
                              src={(char as any).profilePicture}
                              alt={char.name}
                              className="w-full h-full object-cover"
                              data-testid={`img-portrait-${char.id}`}
                            />
                          ) : (
                            <Icon className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {editing?.type === "character" && editing.id === char.id ? (
                              <input
                                ref={editInputRef}
                                className="font-sans font-semibold tracking-wide bg-transparent border-b border-primary outline-none px-0 py-0 text-sm w-32"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onBlur={handleRename}
                                onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") setEditing(null); }}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                data-testid={`input-rename-character-${char.id}`}
                              />
                            ) : (
                              <span className="font-sans font-semibold tracking-wide truncate">{char.name}</span>
                            )}
                            <Badge variant="secondary" className="text-xs capitalize">
                              Lv.{char.level} {char.class}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-xs text-muted-foreground font-serif">{char.race} · {char.background}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${hpPct > 50 ? "bg-emerald-500" : hpPct > 25 ? "bg-amber-500" : "bg-red-500"}`}
                                style={{ width: `${hpPct}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">{char.currentHp}/{char.maxHp} HP</span>
                          </div>
                        </div>
                        <button
                          className="p-1.5 rounded hover:bg-secondary/80 text-muted-foreground/30 hover:text-foreground transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                          data-testid={`button-rename-character-${char.id}`}
                          title="Rename character"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setEditing({ type: "character", id: char.id, name: char.name });
                            setEditName(char.name);
                          }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground/30 hover:text-destructive transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                          data-testid={`button-delete-character-${char.id}`}
                          title="Delete character"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setConfirmDelete({ type: "character", id: char.id, name: char.name });
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Adventures */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scroll className="w-4 h-4 text-primary" />
                <h2 className="font-sans font-semibold tracking-widest text-sm uppercase">Active Adventures</h2>
              </div>
              <Link href="/campaigns/new">
                <Button size="sm" variant="outline" data-testid="button-create-campaign">
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  New Campaign
                </Button>
              </Link>
            </div>

            {partiesLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="h-20 bg-card/50 rounded-md border border-border animate-pulse" />
                ))}
              </div>
            ) : parties.length === 0 ? (
              <Card className="border-dashed border-border/50">
                <CardContent className="py-10 text-center space-y-4">
                  <ScrollText className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                  <div>
                    <p className="text-muted-foreground font-serif italic">No active campaigns...</p>
                    <p className="text-muted-foreground/50 text-sm mt-1">Start a new campaign or join with an invite code</p>
                  </div>
                  <div className="flex gap-2 justify-center flex-wrap">
                    <Link href="/campaigns/new">
                      <Button data-testid="button-create-first-campaign">
                        <Plus className="w-4 h-4 mr-2" />
                        Start Campaign
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {parties.map((party) => (
                  <Link key={party.id} href={party.status === "active" ? `/play/${party.id}` : `/lobby/${party.id}`}>
                    <div
                      className="group flex items-center gap-4 p-4 rounded-md border border-border bg-card hover-elevate cursor-pointer transition-all duration-200"
                      data-testid={`card-party-${party.id}`}
                    >
                      {party.thumbnail ? (
                        <img src={party.thumbnail} alt={party.campaign?.name ?? party.name} className="flex-shrink-0 w-10 h-10 rounded-md object-cover" data-testid={`img-campaign-thumbnail-${party.id}`} />
                      ) : (
                        <div className="flex-shrink-0 w-10 h-10 rounded-md bg-secondary flex items-center justify-center text-primary">
                          <Users className="w-5 h-5" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {editing?.type === "campaign" && editing.id === (party.campaign?.id ?? party.campaignId) ? (
                            <input
                              ref={editInputRef}
                              className="font-sans font-semibold tracking-wide bg-transparent border-b border-primary outline-none px-0 py-0 text-sm w-40"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onBlur={handleRename}
                              onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") setEditing(null); }}
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                              data-testid={`input-rename-campaign-${party.id}`}
                            />
                          ) : (
                            <span className="font-sans font-semibold tracking-wide truncate">{party.campaign?.name ?? party.name}</span>
                          )}
                          <Badge
                            variant={party.status === "active" ? "default" : "secondary"}
                            className="text-xs capitalize"
                          >
                            {party.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-serif mt-0.5 truncate">
                          {party.name} · Code: {party.inviteCode}
                        </p>
                      </div>
                      <button
                        className="p-1.5 rounded hover:bg-secondary/80 text-muted-foreground/30 hover:text-foreground transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                        data-testid={`button-rename-campaign-${party.id}`}
                        title="Rename campaign"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setEditing({ type: "campaign", id: party.campaign?.id ?? party.campaignId, name: party.campaign?.name ?? party.name });
                          setEditName(party.campaign?.name ?? party.name);
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground/30 hover:text-destructive transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                        data-testid={`button-delete-campaign-${party.id}`}
                        title="Delete campaign"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setConfirmDelete({ type: "campaign", id: party.campaign?.id ?? party.campaignId, name: party.campaign?.name ?? party.name });
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Join Party */}
            <JoinPartyCard characters={characters} />
          </div>
        </div>

        <FriendsPanel />
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={() => !deleting && setConfirmDelete(null)}>
          <div className="bg-card border border-border rounded-lg p-6 max-w-sm mx-4 space-y-4 shadow-xl" onClick={e => e.stopPropagation()} data-testid="modal-confirm-delete">
            <div className="space-y-2">
              <h3 className="font-sans font-bold tracking-wide text-lg">Delete {confirmDelete.type === "character" ? "Character" : "Campaign"}?</h3>
              <p className="text-sm text-muted-foreground font-serif">
                {confirmDelete.type === "character"
                  ? `"${confirmDelete.name}" will be permanently removed along with their party memberships. This cannot be undone.`
                  : `"${confirmDelete.name}" and all its parties, messages, NPCs, and story progress will be permanently deleted. This cannot be undone.`
                }
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setConfirmDelete(null)} disabled={deleting} data-testid="button-cancel-delete">
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting} data-testid="button-confirm-delete">
                {deleting ? "Deleting..." : "Delete Forever"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function JoinPartyCard({ characters }: { characters: Character[] }) {
  const [code, setCode] = useState("");
  const [charId, setCharId] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  async function handleJoin() {
    if (!code.trim() || !charId) {
      toast({ title: "Missing fields", description: "Enter a code and select a character", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/parties/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: code.trim(), characterId: charId }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/parties"] });
      window.location.href = `/lobby/${data.party.id}`;
    } catch (e: any) {
      toast({ title: "Failed to join", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-md border border-border/50 bg-card/30 p-4 space-y-3">
      <p className="text-xs font-sans tracking-widest text-muted-foreground uppercase">Join a Party</p>
      <div className="flex gap-2 flex-wrap">
        <input
          className="flex-1 min-w-24 bg-input border border-border rounded-md px-3 py-2 text-sm font-sans tracking-widest uppercase placeholder:normal-case placeholder:tracking-normal placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="Invite code"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          maxLength={6}
          data-testid="input-invite-code"
        />
        <select
          className="flex-1 min-w-32 bg-input border border-border rounded-md px-3 py-2 text-sm font-serif text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          value={charId}
          onChange={e => setCharId(e.target.value)}
          data-testid="select-character-join"
        >
          <option value="">Select character</option>
          {characters.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <Button size="sm" onClick={handleJoin} disabled={loading} data-testid="button-join-party">
          {loading ? "Joining..." : "Join"}
        </Button>
      </div>
    </div>
  );
}

