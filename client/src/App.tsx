import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AppShell from "./components/AppShell";
import WorkspacePage from "./pages/WorkspacePage";
import ChatPage from "./pages/ChatPage";
import CodePage from "./pages/CodePage";
import ImagesPage from "./pages/ImagesPage";
import AgentsPage from "./pages/AgentsPage";
import MemoryPage from "./pages/MemoryPage";
import SettingsPage from "./pages/SettingsPage";
import DesignSystemPage from "./pages/DesignSystemPage";

function Router() {
  return (
    <AppShell>
      <Switch>
        <Route path="/" component={WorkspacePage} />
        <Route path="/chat" component={ChatPage} />
        <Route path="/code" component={CodePage} />
        <Route path="/images" component={ImagesPage} />
        <Route path="/agents" component={AgentsPage} />
        <Route path="/memory" component={MemoryPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/design-system" component={DesignSystemPage} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </AppShell>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <TooltipProvider>
          <Toaster position="bottom-right" richColors />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
