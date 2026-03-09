"use client";

import AppShell from "@/components/AppShell";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";

export default function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system" switchable>
        <WorkspaceProvider>
          <TooltipProvider>
            <Toaster position="bottom-right" richColors />
            <AppShell>{children}</AppShell>
          </TooltipProvider>
        </WorkspaceProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
