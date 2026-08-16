import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Terminal } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { ErrorBanner, Spinner } from "@/components/ui/state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/services/supabaseClient";
import { updatePassword } from "@/services/authApi";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset Password — AttendX" },
      {
        name: "description",
        content: "Set a new password for your AttendX attendance tracking account.",
      },
      { property: "og:title", content: "Reset Password — AttendX" },
      { property: "og:description", content: "Set a new password for your AttendX account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [hasRecovery, setHasRecovery] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setHasRecovery(true);
        setReady(true);
      }
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) setHasRecovery(true);
      setReady(true);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const valid = password.length >= 6 && password === confirm;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    try {
      await updatePassword(password);
      setDone(true);
      await supabase.auth.signOut();
      setTimeout(() => void navigate({ to: "/", replace: true }), 1800);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="panel cyber-surface w-full max-w-md space-y-5 p-7 shadow-xl">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-md border border-primary/50 bg-primary/10 text-primary">
            <Terminal className="size-4" />
          </span>
          <div>
            <h1 className="font-mono text-lg font-bold tracking-tight text-foreground">
              Attend<span className="text-primary">X</span>
            </h1>
            <p className="terminal-label">Set new password</p>
          </div>
        </div>

        {!ready ? (
          <p className="font-mono text-xs text-muted-foreground">Verifying reset link…</p>
        ) : !hasRecovery ? (
          <>
            <p className="font-mono text-xs leading-relaxed text-signal">
              This reset link is invalid or has expired. Request a new one from the sign-in page.
            </p>
            <Button type="button" className="w-full font-mono" onClick={() => void navigate({ to: "/" })}>
              Back to sign in
            </Button>
          </>
        ) : done ? (
          <p className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2 font-mono text-xs text-primary">
            Password updated. Redirecting to sign in…
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              {password.length > 0 && password.length < 6 ? (
                <p className="font-mono text-xs text-signal">Minimum 6 characters.</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              {confirm.length > 0 && confirm !== password ? (
                <p className="font-mono text-xs text-signal">Passwords do not match.</p>
              ) : null}
            </div>

            {error ? <ErrorBanner error={error} title="Could not update password" /> : null}

            <Button type="submit" disabled={!valid || busy} className="w-full font-mono tracking-wide">
              {busy ? <Spinner className="text-primary-foreground" /> : null}
              Update password
            </Button>
          </>
        )}
      </form>
    </div>
  );
}
