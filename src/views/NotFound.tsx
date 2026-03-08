"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  const handleGoHome = () => {
    router.push("/");
  };

  return (
    <div className="h-full w-full flex items-center justify-center px-4">
      <div className="lg-panel w-full max-w-lg rounded-2xl p-8 text-center">
        <div className="mb-5 flex justify-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--metal-dim)", border: "1px solid var(--metal-border)" }}
          >
            <AlertCircle className="h-7 w-7" style={{ color: "#ef4444" }} />
          </div>
        </div>

        <h1 className="text-4xl font-bold mb-2" style={{ color: "var(--foreground)" }}>404</h1>
        <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--foreground)" }}>Page Not Found</h2>

        <p className="text-sm mb-6 leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
          Sorry, the page you are looking for does not exist.
        </p>

        <Button onClick={handleGoHome} className="lg-btn-accent px-5 py-2.5 rounded-xl text-sm">
          <Home className="w-4 h-4 mr-2" />
          Go Home
        </Button>
      </div>
    </div>
  );
}
