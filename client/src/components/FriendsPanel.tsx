import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Users, Check, X, Search, Copy, Clock, UserMinus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface FriendEntry {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: string;
  friend: { id: string; username: string | null; profileImageUrl: string | null };
}

interface PendingRequest {
  id: string;
  from: { id: string; username: string | null; profileImageUrl: string | null };
}

interface SentRequest {
  id: string;
  to: { id: string; username: string | null; profileImageUrl: string | null };
}

interface FriendsPanelProps {
  inviteCode?: string;
}

export default function FriendsPanel({ inviteCode }: FriendsPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [addUsername, setAddUsername] = useState("");

  const { data: friends = [], isLoading: friendsLoading } = useQuery<FriendEntry[]>({
    queryKey: ["/api/friends"],
  });

  const { data: pendingRequests = [] } = useQuery<PendingRequest[]>({
    queryKey: ["/api/friends/requests"],
    refetchInterval: 15000,
  });

  const { data: sentRequests = [] } = useQuery<SentRequest[]>({
    queryKey: ["/api/friends/sent"],
  });

  const { data: searchResults = [] } = useQuery<Array<{ id: string; username: string | null }>>({
    queryKey: ["/api/users/search", searchQuery],
    queryFn: async () => {
      if (searchQuery.length < 2) return [];
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      return res.json();
    },
    enabled: searchQuery.length >= 2,
  });

  const sendRequestMutation = useMutation({
    mutationFn: (username: string) => apiRequest("POST", "/api/friends/request", { username }),
    onSuccess: () => {
      toast({ title: "Request sent", description: "Friend request sent successfully" });
      setAddUsername("");
      setShowAddFriend(false);
      queryClient.invalidateQueries({ queryKey: ["/api/friends/sent"] });
    },
    onError: (e: any) => {
      toast({ title: "Failed", description: e.message || "Could not send request", variant: "destructive" });
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/friends/${id}/accept`),
    onSuccess: () => {
      toast({ title: "Accepted", description: "You are now friends" });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
    },
  });

  const declineMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/friends/${id}/decline`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/friends/${id}`),
    onSuccess: () => {
      toast({ title: "Removed", description: "Friend removed" });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
    },
  });

  function copyInviteCode() {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    toast({ title: "Copied", description: `Invite code ${inviteCode} copied to clipboard` });
  }

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm" data-testid="friends-panel">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <CardTitle className="font-sans font-semibold tracking-widest text-sm uppercase">
              Friends
            </CardTitle>
            {pendingRequests.length > 0 && (
              <Badge variant="default" className="text-xs h-5 px-1.5" data-testid="badge-pending-count">
                {pendingRequests.length}
              </Badge>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddFriend(!showAddFriend)}
            data-testid="button-add-friend"
          >
            <UserPlus className="w-3.5 h-3.5 mr-1.5" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAddFriend && (
          <div className="space-y-2 p-3 rounded-md border border-border/50 bg-background/30" data-testid="add-friend-form">
            <p className="text-xs text-muted-foreground font-sans uppercase tracking-wider">Add by username</p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                <input
                  className="w-full bg-input border border-border rounded-md pl-8 pr-3 py-2 text-sm font-sans placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Search username..."
                  value={addUsername}
                  onChange={e => {
                    setAddUsername(e.target.value);
                    setSearchQuery(e.target.value);
                  }}
                  data-testid="input-friend-username"
                />
              </div>
              <Button
                size="sm"
                disabled={!addUsername.trim() || sendRequestMutation.isPending}
                onClick={() => sendRequestMutation.mutate(addUsername.trim())}
                data-testid="button-send-request"
              >
                {sendRequestMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  "Send"
                )}
              </Button>
            </div>
            {searchResults.length > 0 && searchQuery.length >= 2 && (
              <div className="space-y-1 mt-1">
                {searchResults.map(u => (
                  <button
                    key={u.id}
                    className="w-full text-left px-2 py-1.5 rounded text-sm font-sans hover:bg-secondary/50 transition-colors"
                    onClick={() => {
                      setAddUsername(u.username ?? "");
                      setSearchQuery("");
                    }}
                    data-testid={`search-result-${u.username}`}
                  >
                    {u.username}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {pendingRequests.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-sans uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> Pending Requests
            </p>
            {pendingRequests.map(req => (
              <div
                key={req.id}
                className="flex items-center justify-between gap-2 p-2 rounded-md border border-primary/20 bg-primary/5"
                data-testid={`pending-request-${req.from.username}`}
              >
                <span className="text-sm font-sans font-medium truncate">{req.from.username}</span>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10"
                    onClick={() => acceptMutation.mutate(req.id)}
                    disabled={acceptMutation.isPending}
                    data-testid={`button-accept-${req.from.username}`}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => declineMutation.mutate(req.id)}
                    disabled={declineMutation.isPending}
                    data-testid={`button-decline-${req.from.username}`}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {sentRequests.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-sans uppercase tracking-wider">Sent Requests</p>
            {sentRequests.map(req => (
              <div
                key={req.id}
                className="flex items-center justify-between gap-2 p-2 rounded-md border border-border/50 bg-background/20"
                data-testid={`sent-request-${req.to.username}`}
              >
                <span className="text-sm font-sans text-muted-foreground truncate">{req.to.username}</span>
                <Badge variant="secondary" className="text-xs">Pending</Badge>
              </div>
            ))}
          </div>
        )}

        {friendsLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : friends.length === 0 ? (
          <div className="text-center py-4">
            <Users className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground/60 font-serif italic">No friends yet</p>
            <p className="text-xs text-muted-foreground/40 mt-0.5">Search by username to add friends</p>
          </div>
        ) : (
          <div className="space-y-2">
            {friends.map(f => (
              <div
                key={f.id}
                className="group flex items-center justify-between gap-2 p-2 rounded-md border border-border/50 hover:border-border transition-colors"
                data-testid={`friend-${f.friend.username}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-sans font-bold text-muted-foreground flex-shrink-0">
                    {(f.friend.username ?? "?")[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-sans font-medium truncate">{f.friend.username}</span>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {inviteCode && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs gap-1 text-primary hover:text-primary"
                      onClick={copyInviteCode}
                      title="Copy invite code to share"
                      data-testid={`button-invite-${f.friend.username}`}
                    >
                      <Copy className="w-3 h-3" /> Invite
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-muted-foreground/30 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeMutation.mutate(f.id)}
                    title="Remove friend"
                    data-testid={`button-remove-${f.friend.username}`}
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
