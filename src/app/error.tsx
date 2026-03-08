"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="h-full min-h-screen w-full flex items-center justify-center px-4">
          <div className="lg-panel w-full max-w-lg rounded-2xl p-8 text-center">
            <div className="mb-5 flex justify-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: "var(--metal-dim)",
                  border: "1px solid var(--metal-border)",
                }}
              >
                <AlertCircle className="h-7 w-7" style={{ color: "#ef4444" }} />
              </div>
            </div>

            <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--foreground)" }}>
              Something went wrong
            </h2>

            <p className="text-sm mb-6 leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              An unexpected error occurred while rendering this page.
            </p>

            <Button onClick={reset} className="lg-btn-accent px-5 py-2.5 rounded-xl text-sm">
              Try again
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}