import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, Copy, Users, CheckCircle, Clock, Sword, Play, Shield, Sparkles, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface LobbyPageProps {
  partyId: string;
}

const CONTENT_RATINGS = [
  { id: "pg", label: "PG", desc: "Family-friendly, no blood or real danger" },
  { id: "pg13", label: "PG-13", desc: "Fantasy combat and peril, no gore" },
  { id: "r", label: "Mature", desc: "Blood, strong language, dark themes" },
];

const GM_MODES = [
  { id: "fast", label: "Fast", desc: "Brisk pacing, action-forward" },
  { id: "balanced", label: "Balanced", desc: "Narrative depth + action" },
  { id: "cinematic", label: "Cinematic", desc: "Rich detail, immersive" },
];

export default function LobbyPage({ partyId }: LobbyPageProps) {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [lobbyBg, setLobbyBg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const r = await fetch(`/api/system/lobby-background?_t=${Date.now()}`);
        const d = await r.json();
        if (!cancelled && d.imageData) setLobbyBg(d.imageData);
        else if (!cancelled && d.pending) setTimeout(poll, 8000);
      } catch {}
    };
    poll();
    return () => { cancelled = true; };
  }, []);

  const { data, isLoading, refetch } = useQuery<any>({
    queryKey: [`/api/parties/${partyId}`],
  });

  const party = data?.party;
  const members = data?.members ?? [];
  const campaign = data?.campaign;

  useEffect(() => {
    const wsUrl = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);
    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "JOIN_PARTY", partyId }));
    };
    socket.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "MEMBER_UPDATE") {
        queryClient.setQueryData([`/api/parties/${partyId}`], (old: any) => ({
          ...old,
          members: msg.members,
        }));
      }
    };
    setWs(socket);
    return () => socket.close();
  }, [partyId, queryClient]);

  const readyMutation = useMutation({
    mutationFn: (isReady: boolean) => apiRequest("POST", `/api/parties/${partyId}/ready`, { isReady }),
    onSuccess: () => refetch(),
  });

  const myMember = members.find((m: any) => m.userId === user?.id);
  const isReady = myMember?.isReady ?? false;
  const allReady = members.length > 0 && members.every((m: any) => m.isReady);
  const isOwner = campaign?.ownerId === user?.id;

  const [editRating, setEditRating] = useState<string | null>(null);
  const [editGmMode, setEditGmMode] = useState<string | null>(null);
  const [editNoRomance, setEditNoRomance] = useState<boolean | null>(null);
  const [editNoHorror, setEditNoHorror] = useState<boolean | null>(null);
  const [editFadeToBlack, setEditFadeToBlack] = useState<boolean | null>(null);
  const [settingsSaving, setSettingsSaving] = useState(false);

  useEffect(() => {
    if (campaign) {
      setEditRating(campaign.contentRating ?? "pg13");
      setEditGmMode(campaign.gmMode ?? "balanced");
      setEditNoRomance(campaign.noRomance ?? false);
      setEditNoHorror(campaign.noHorror ?? false);
      setEditFadeToBlack(campaign.fadeToBlack ?? true);
    }
  }, [campaign?.id]);

  const settingsDirty = campaign && (
    editRating !== campaign.contentRating ||
    editGmMode !== campaign.gmMode ||
    editNoRomance !== campaign.noRomance ||
    editNoHorror !== campaign.noHorror
  );

  async function saveSettings() {
    if (!campaign) return;
    setSettingsSaving(true);
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentRating: editRating, gmMode: editGmMode, noRomance: editNoRomance, noHorror: editNoHorror }),
      });
      if (!res.ok) throw new Error();
      queryClient.invalidateQueries({ queryKey: [`/api/parties/${partyId}`] });
      toast({ title: "Settings saved", description: "Campaign settings updated.", variant: "success" as any });
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setSettingsSaving(false);
    }
  }

  function copyInviteCode() {
    if (!party) return;
    navigator.clipboard.writeText(party.inviteCode).then(() => {
      toast({ title: "Copied!", description: `Invite code ${party.inviteCode} copied to clipboard`, variant: "success" as any });
    });
  }

  async function startAdventure() {
    await apiRequest("POST", `/api/parties/${partyId}/ready`, { isReady: true });
    navigate(`/play/${partyId}`);
  }

  if (isLoading || !party) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground font-serif animate-pulse">Gathering the party...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {lobbyBg && (
        <div className="absolute inset-0 z-0">
          <img src={lobbyBg} alt="" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-background/80" />
        </div>
      )}
      <header className={`sticky top-0 z-50 backdrop-blur-sm ${lobbyBg ? "bg-black/40 border-b border-white/10" : "border-b border-border bg-card/50"}`}>
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Users className="w-4 h-4 text-primary" />
          <span className="font-sans font-bold tracking-widest text-sm">PARTY LOBBY</span>
          <Badge variant="secondary" className="ml-auto">{members.length} adventurer{members.length !== 1 ? "s" : ""}</Badge>
        </div>
      </header>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-10 space-y-6">
        {/* Campaign Info */}
        <div className={`relative rounded-md p-6 overflow-hidden backdrop-blur-sm ${lobbyBg ? "border border-white/10 bg-black/30" : "border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent"}`}>
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
          <div className="relative space-y-1">
            <p className="text-primary text-xs font-sans tracking-widest uppercase">Campaign</p>
            <h1 className="text-2xl font-sans font-bold tracking-wider">{campaign?.name ?? party.name}</h1>
            {campaign?.description && (
              <p className="text-muted-foreground font-serif italic text-sm">{campaign.description}</p>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Invite Code */}
          <Card className={`backdrop-blur-sm ${lobbyBg ? "bg-black/30 border-white/10" : "bg-card/80"}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-sans tracking-widest uppercase text-muted-foreground">Invite Friends</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`flex items-center gap-3 p-4 rounded-md ${lobbyBg ? "bg-black/20 border border-white/10" : "bg-secondary/50 border border-border"}`}>
                <span className="font-sans font-bold tracking-widest text-2xl text-primary flex-1 text-center">
                  {party.inviteCode}
                </span>
                <Button size="icon" variant="ghost" onClick={copyInviteCode} data-testid="button-copy-code">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground font-serif text-center">
                Share this code with companions. They can enter it from the dashboard to join.
              </p>
            </CardContent>
          </Card>

          {/* Party Members */}
          <Card className={`backdrop-blur-sm ${lobbyBg ? "bg-black/30 border-white/10" : "bg-card/80"}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-sans tracking-widest uppercase text-muted-foreground">The Company</CardTitle>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground font-serif italic text-sm">Awaiting adventurers...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {members.map((member: any) => (
                    <div key={member.id} className="flex items-center gap-3 py-2" data-testid={`member-${member.userId}`}>
                      <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center">
                        <Sword className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-serif text-sm font-medium truncate">{member.character?.name ?? "Unknown"}</p>
                        <p className="text-xs text-muted-foreground capitalize">{member.character?.race} {member.character?.class}</p>
                      </div>
                      {member.isReady ? (
                        <Badge variant="default" className="text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Ready
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          Waiting
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Campaign Settings — owner only */}
        {isOwner && editRating !== null && (
          <Card className={`backdrop-blur-sm ${lobbyBg ? "bg-black/30 border-white/10" : "bg-card/80"}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-sans tracking-widest uppercase text-muted-foreground flex items-center gap-2">
                <Settings className="w-3.5 h-3.5 text-primary" /> Campaign Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Content Rating */}
              <div className="space-y-2">
                <p className="text-xs font-sans tracking-widest text-muted-foreground/60 uppercase flex items-center gap-1.5">
                  <Shield className="w-3 h-3" /> Content Rating
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {CONTENT_RATINGS.map(r => (
                    <button
                      key={r.id}
                      onClick={() => setEditRating(r.id)}
                      data-testid={`button-rating-${r.id}`}
                      className={`p-3 rounded-md border text-left transition-all ${
                        editRating === r.id ? "border-primary bg-primary/10" : `border-border ${lobbyBg ? "bg-black/20 hover:bg-black/30" : "bg-secondary/30 hover:bg-secondary/50"}`
                      }`}
                    >
                      <p className={`font-sans font-semibold text-xs tracking-wide ${editRating === r.id ? "text-primary" : ""}`}>{r.label}</p>
                      <p className="text-muted-foreground text-[10px] font-serif mt-0.5 leading-snug">{r.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* GM Pacing Mode */}
              <div className="space-y-2">
                <p className="text-xs font-sans tracking-widest text-muted-foreground/60 uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" /> GM Pacing
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {GM_MODES.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setEditGmMode(m.id)}
                      data-testid={`button-gm-mode-${m.id}`}
                      className={`p-3 rounded-md border text-left transition-all ${
                        editGmMode === m.id ? "border-primary bg-primary/10" : `border-border ${lobbyBg ? "bg-black/20 hover:bg-black/30" : "bg-secondary/30 hover:bg-secondary/50"}`
                      }`}
                    >
                      <p className={`font-sans font-semibold text-xs tracking-wide ${editGmMode === m.id ? "text-primary" : ""}`}>{m.label}</p>
                      <p className="text-muted-foreground text-[10px] font-serif mt-0.5 leading-snug">{m.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2">
                <p className="text-xs font-sans tracking-widest text-muted-foreground/60 uppercase">Content Preferences</p>
                <div className="space-y-2">
                  {[
                    { key: "noRomance", label: "No Romance", desc: "Exclude romantic subplots", value: editNoRomance, set: setEditNoRomance },
                    { key: "noHorror", label: "No Horror", desc: "Avoid disturbing content", value: editNoHorror, set: setEditNoHorror },
                  ].map(t => (
                    <label key={t.key} className="flex items-center gap-3 cursor-pointer py-1">
                      <div
                        onClick={() => t.set(!t.value)}
                        data-testid={`toggle-${t.key}`}
                        className={`relative w-9 h-[18px] rounded-full transition-colors cursor-pointer flex-shrink-0 ${t.value ? "bg-primary" : "bg-secondary"}`}
                      >
                        <div className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow transition-transform ${t.value ? "translate-x-[18px]" : "translate-x-[2px]"}`} />
                      </div>
                      <div>
                        <span className="text-sm font-sans font-medium">{t.label}</span>
                        <span className="text-xs text-muted-foreground font-serif ml-2">{t.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Save button */}
              {settingsDirty && (
                <Button size="sm" onClick={saveSettings} disabled={settingsSaving} data-testid="button-save-settings">
                  {settingsSaving ? "Saving..." : "Save Settings"}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className={`rounded-lg p-4 flex items-center justify-between ${lobbyBg ? "backdrop-blur-md bg-black/50 border border-white/10" : "border-t border-border pt-4"}`}>
          <Button
            variant="outline"
            onClick={() => readyMutation.mutate(!isReady)}
            disabled={readyMutation.isPending}
            data-testid="button-toggle-ready"
            className={isReady ? "border-primary text-primary" : ""}
          >
            {isReady ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2 text-primary" />
                Ready — Click to Unready
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 mr-2" />
                Mark as Ready
              </>
            )}
          </Button>

          <Button
            onClick={startAdventure}
            disabled={members.length === 0}
            data-testid="button-start-adventure"
            className="gap-2"
          >
            <Play className="w-4 h-4" />
            Begin Adventure
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground/50 font-serif">
          You can start at any time. The GM will introduce the scene.
        </p>
      </div>
    </div>
  );
}
