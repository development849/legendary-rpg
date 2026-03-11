import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield, Users, Swords, MapIcon, ScrollText, MessageSquare,
  ArrowLeft, Database, Search, ChevronLeft, ChevronRight,
  Loader2, AlertTriangle, Crown, UserCheck, Gamepad2
} from "lucide-react";

function StatCard({ label, value, icon: Icon }: { label: string; value: number | string; icon: any }) {
  return (
    <Card className="bg-zinc-900/80 border-amber-900/30" data-testid={`stat-${label.toLowerCase().replace(/\s/g, "-")}`}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-amber-950/40">
          <Icon className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <p className="text-2xl font-bold text-amber-100 font-sans">{value}</p>
          <p className="text-xs text-muted-foreground font-sans">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function DataTable({ columns, rows }: { columns: string[]; rows: any[] }) {
  if (!rows.length) {
    return <p className="text-muted-foreground text-sm py-4 text-center">No data</p>;
  }

  return (
    <div className="overflow-x-auto border border-amber-900/20 rounded-lg">
      <table className="w-full text-xs" data-testid="data-table">
        <thead>
          <tr className="bg-amber-950/30 border-b border-amber-900/20">
            {columns.map(col => (
              <th key={col} className="px-3 py-2 text-left text-amber-300/80 font-sans font-medium whitespace-nowrap">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-zinc-800/50 hover:bg-amber-950/10">
              {columns.map(col => {
                const val = row[col];
                let display = val;
                if (val === null || val === undefined) display = <span className="text-zinc-600 italic">null</span>;
                else if (typeof val === "object") display = <span className="text-zinc-400 font-mono">{JSON.stringify(val).slice(0, 120)}</span>;
                else if (typeof val === "boolean") display = val ? "true" : "false";
                else display = String(val).slice(0, 200);

                return (
                  <td key={col} className="px-3 py-1.5 text-zinc-300 font-mono whitespace-nowrap max-w-[300px] truncate">
                    {display}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OverviewTab() {
  const { data, isLoading, error } = useQuery<any>({ queryKey: ["/api/admin/stats"] });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-400" /></div>;
  if (error) return <div className="text-red-400 py-4">Failed to load stats</div>;
  if (!data) return null;

  const c = data.counts;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Users" value={c.users} icon={Users} />
        <StatCard label="Characters" value={c.characters} icon={Swords} />
        <StatCard label="Campaigns" value={c.campaigns} icon={ScrollText} />
        <StatCard label="Parties" value={c.parties} icon={Gamepad2} />
        <StatCard label="Messages" value={c.messages} icon={MessageSquare} />
        <StatCard label="Events" value={c.events} icon={Database} />
        <StatCard label="NPCs" value={c.npcs} icon={UserCheck} />
        <StatCard label="Friendships" value={c.friendships} icon={Users} />
        <StatCard label="Arcs" value={c.arcs} icon={Crown} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-zinc-900/80 border-amber-900/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-sans text-amber-200">Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={["username", "email", "authProvider", "createdAt"]}
              rows={data.recentUsers}
            />
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/80 border-amber-900/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-sans text-amber-200">Top Characters (by Level)</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={["name", "class", "race", "level", "xp"]}
              rows={data.topCharacters}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="bg-zinc-900/80 border-amber-900/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-sans text-amber-200">Recent Parties</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={["id", "campaignId", "status", "inviteCode", "createdAt"]}
            rows={data.activeParties}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function DatabaseTab() {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data: tablesData } = useQuery<any>({ queryKey: ["/api/admin/tables"] });

  const { data: tableData, isLoading: tableLoading } = useQuery<any>({
    queryKey: ["/api/admin/tables", selectedTable, page],
    queryFn: async () => {
      const res = await fetch(`/api/admin/tables/${selectedTable}?page=${page}&limit=50`);
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    enabled: !!selectedTable,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tablesData?.tables?.map((t: string) => (
          <Button
            key={t}
            size="sm"
            variant={selectedTable === t ? "default" : "outline"}
            className={`text-xs font-mono ${selectedTable === t ? "bg-amber-700 hover:bg-amber-600 text-white" : "border-amber-900/40 text-amber-300/80 hover:bg-amber-950/30"}`}
            onClick={() => { setSelectedTable(t); setPage(1); }}
            data-testid={`button-table-${t}`}
          >
            {t}
          </Button>
        ))}
      </div>

      {selectedTable && (
        <Card className="bg-zinc-900/80 border-amber-900/30">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-sans text-amber-200">
              {selectedTable} {tableData && <span className="text-muted-foreground font-normal">({tableData.total} rows)</span>}
            </CardTitle>
            {tableData && tableData.totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)} data-testid="button-prev-page">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs text-muted-foreground">{page} / {tableData.totalPages}</span>
                <Button size="sm" variant="ghost" disabled={page >= tableData.totalPages} onClick={() => setPage(p => p + 1)} data-testid="button-next-page">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {tableLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-amber-400" /></div>
            ) : tableData ? (
              <DataTable columns={tableData.columns} rows={tableData.rows} />
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function QueryTab() {
  const [query, setQuery] = useState("SELECT id, username, email, created_at FROM users ORDER BY created_at DESC LIMIT 20");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (q: string) => {
      const res = await fetch("/api/admin/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      return data;
    },
    onSuccess: (data) => { setResult(data); setError(null); },
    onError: (err: any) => { setError(err.message); setResult(null); },
  });

  return (
    <div className="space-y-4">
      <Card className="bg-zinc-900/80 border-amber-900/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-sans text-amber-200 flex items-center gap-2">
            <Search className="w-4 h-4" /> SQL Query (Read-Only)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 bg-amber-950/15 border border-amber-900/25 rounded-md px-3 py-1.5 text-xs text-amber-300/60">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            Only SELECT queries are allowed. No data modification permitted.
          </div>
          <textarea
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full h-28 bg-zinc-950 border border-zinc-700 rounded-md p-3 text-sm text-zinc-200 font-mono resize-y focus:outline-none focus:border-amber-700/50"
            placeholder="SELECT * FROM users LIMIT 10"
            data-testid="input-sql-query"
          />
          <Button
            onClick={() => mutation.mutate(query)}
            disabled={mutation.isPending || !query.trim()}
            className="bg-amber-700 hover:bg-amber-600 text-white"
            data-testid="button-run-query"
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
            Run Query
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="bg-red-950/30 border-red-800/40">
          <CardContent className="p-4 text-red-300 text-sm font-mono">{error}</CardContent>
        </Card>
      )}

      {result && (
        <Card className="bg-zinc-900/80 border-amber-900/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-sans text-amber-200">
              Results <span className="text-muted-foreground font-normal">({result.total} rows)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={result.columns} rows={result.rows} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function AdminPage() {
  const [, navigate] = useLocation();

  const { data, isLoading, error } = useQuery<any>({
    queryKey: ["/api/admin/check"],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  if (error || !data?.isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="bg-zinc-900/90 border-red-800/40 max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <Shield className="w-12 h-12 text-red-400 mx-auto" />
            <h1 className="text-xl font-sans text-red-300">Access Denied</h1>
            <p className="text-sm text-muted-foreground">You do not have admin privileges.</p>
            <Button variant="outline" onClick={() => navigate("/dashboard")} data-testid="button-back-dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-amber-900/30 bg-zinc-950/90 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-amber-400" />
            <h1 className="text-lg font-sans text-amber-100 tracking-wide">Admin Panel</h1>
            <span className="text-xs text-muted-foreground font-mono bg-amber-950/30 px-2 py-0.5 rounded">{data.email}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="text-amber-300/70 hover:text-amber-200" data-testid="button-admin-back">
            <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs defaultValue="overview">
          <TabsList className="bg-zinc-900/80 border border-amber-900/20 mb-6">
            <TabsTrigger value="overview" className="data-[state=active]:bg-amber-800/30 data-[state=active]:text-amber-200" data-testid="tab-overview">
              Overview
            </TabsTrigger>
            <TabsTrigger value="database" className="data-[state=active]:bg-amber-800/30 data-[state=active]:text-amber-200" data-testid="tab-database">
              Database
            </TabsTrigger>
            <TabsTrigger value="query" className="data-[state=active]:bg-amber-800/30 data-[state=active]:text-amber-200" data-testid="tab-query">
              SQL Query
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab />
          </TabsContent>
          <TabsContent value="database">
            <DatabaseTab />
          </TabsContent>
          <TabsContent value="query">
            <QueryTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
