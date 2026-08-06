import { AlertTriangle, Loader2 } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("size-5 animate-spin text-primary", className)} />;
}

export function LoadingPanel({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/50 px-4 py-6">
      <Spinner />
      <span className="terminal-label">{label}…</span>
    </div>
  );
}

export function ErrorBanner({ error, title = "Error" }: { error: unknown; title?: string }) {
  const message = error instanceof Error ? error.message : String(error ?? "Something went wrong");
  return (
    <div className="flex items-start gap-3 rounded-lg border border-signal/50 bg-signal/10 px-4 py-3">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-signal" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-signal">{title}</p>
        <p className="mt-0.5 font-mono text-xs break-words text-signal/80">{message}</p>
      </div>
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border px-6 py-10 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {hint ? <p className="mt-1 text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}