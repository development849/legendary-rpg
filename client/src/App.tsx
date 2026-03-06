import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import LandingPage from "@/pages/landing";
import AuthPage from "@/pages/auth";
import DashboardPage from "@/pages/dashboard";
import CreateCharacterPage from "@/pages/create-character";
import CreateCampaignPage from "@/pages/create-campaign";
import GameSessionPage from "@/pages/game-session";
import CharacterSheetPage from "@/pages/character-sheet";
import LobbyPage from "@/pages/lobby";
import AppearanceEditorPage from "@/pages/appearance-editor";
import logoPath from "@assets/legendary-logo-transparent.png";

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <img src={logoPath} alt="Legendary" className="w-20 h-20 mx-auto opacity-90 animate-pulse" />
        <div className="text-3xl font-sans text-primary glow-gold tracking-widest">LEGENDARY<sup className="text-lg align-super">℠</sup></div>
        <div className="text-muted-foreground text-sm font-serif italic animate-pulse">Summoning your adventure...</div>
      </div>
    </div>
  );
}

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Redirect to="/auth" />;
  return <Component {...rest} />;
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  return (
    <Switch>
      <Route path="/" component={() => {
        if (isLoading) return <LoadingScreen />;
        if (isAuthenticated) return <Redirect to="/dashboard" />;
        return <LandingPage />;
      }} />
      <Route path="/auth" component={() => {
        if (isLoading) return <LoadingScreen />;
        if (isAuthenticated) return <Redirect to="/dashboard" />;
        return <AuthPage />;
      }} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={DashboardPage} />} />
      <Route path="/characters/new" component={() => <ProtectedRoute component={CreateCharacterPage} />} />
      <Route path="/characters/:id/appearance" component={({ params }: any) => <ProtectedRoute component={AppearanceEditorPage} characterId={params.id} />} />
      <Route path="/characters/:id" component={({ params }: any) => <ProtectedRoute component={CharacterSheetPage} characterId={params.id} />} />
      <Route path="/campaigns/new" component={() => <ProtectedRoute component={CreateCampaignPage} />} />
      <Route path="/lobby/:partyId" component={({ params }: any) => <ProtectedRoute component={LobbyPage} partyId={params.partyId} />} />
      <Route path="/play/:partyId" component={({ params }: any) => <ProtectedRoute component={GameSessionPage} partyId={params.partyId} />} />
      <Route component={() => <Redirect to="/" />} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
