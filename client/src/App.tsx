import { Switch, Route, Redirect } from "wouter";
import { Component, type ErrorInfo, type ReactNode } from "react";
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

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App error boundary:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md px-6">
            <img src={logoPath} alt="Legendary" className="w-16 h-16 mx-auto opacity-70 object-contain" />
            <p className="text-lg font-sans text-foreground">Something went wrong</p>
            <p className="text-sm text-muted-foreground font-serif">An unexpected error occurred. Try refreshing the page.</p>
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-sans hover:bg-primary/90"
              data-testid="button-error-reload"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <img src={logoPath} alt="Legendary" className="w-20 h-20 mx-auto opacity-90 animate-pulse object-contain" />
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
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
