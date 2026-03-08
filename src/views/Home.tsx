"use client";

import { Button } from "@/components/ui/button";
import { LayoutGrid } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="h-full w-full flex items-center justify-center px-6">
      <div className="lg-panel rounded-2xl p-8 text-center max-w-md w-full">
        <div className="mb-4 flex justify-center">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: "var(--metal-dim)", border: "1px solid var(--metal-border)" }}
          >
            <LayoutGrid size={18} style={{ color: "var(--metal)" }} />
          </div>
        </div>
        <h1 className="text-xl font-semibold mb-2" style={{ color: "var(--foreground)" }}>
          Workspace Hub
        </h1>
        <p className="text-sm mb-5" style={{ color: "var(--muted-foreground)" }}>
          Use the sidebar to navigate between Chat, Gems, Code, Images, Agents, and Settings.
        </p>
        <Button onClick={() => router.push("/")} className="lg-btn-accent px-5 py-2.5 rounded-xl text-sm">
          Open Workspaces
        </Button>
      </div>
    </div>
  );
}
