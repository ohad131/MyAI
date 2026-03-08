import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <div className="h-full w-full flex items-center justify-center px-4">
      <div className="lg-panel rounded-2xl px-6 py-5 flex items-center gap-3">
        <Spinner className="size-5" style={{ color: "var(--metal)" }} />
        <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          Loading...
        </span>
      </div>
    </div>
  );
}