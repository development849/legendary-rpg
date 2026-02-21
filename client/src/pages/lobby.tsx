import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, Copy, Users, CheckCircle, Clock, Sword, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface LobbyPageProps {
  partyId: string;
}

export default function LobbyPage({ partyId }: LobbyPageProps) {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [ws, setWs] = useState<WebSocket | null>(null);

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

  function copyInviteCode() {
    if (!party) return;
    navigator.clipboard.writeText(party.inviteCode).then(() => {
      toast({ title: "Copied!", description: `Invite code ${party.inviteCode} copied to clipboard` });
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
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Users className="w-4 h-4 text-primary" />
          <span className="font-sans font-bold tracking-widest text-sm">PARTY LOBBY</span>
          <Badge variant="secondary" className="ml-auto">{members.length} adventurer{members.length !== 1 ? "s" : ""}</Badge>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        {/* Campaign Info */}
        <div className="relative rounded-md border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-6 overflow-hidden">
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
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-sans tracking-widest uppercase text-muted-foreground">Invite Friends</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-md border border-border">
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
          <Card>
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

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
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
