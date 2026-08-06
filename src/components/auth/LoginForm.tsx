import { useNavigate } from "@tanstack/react-router";
import { Terminal } from "lucide-react";
import { useState, type FormEvent } from "react";

import { ErrorBanner, Spinner } from "@/components/ui/state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dashboardPathFor, fetchRole, signIn, signUp, type AppRole } from "@/services/authApi";

type Mode = "signin" | "signup";

export function LoginForm() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [role, setRole] = useState<AppRole>("student");
  const [error, setError] = useState<unknown>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passwordValid = password.length >= 6;
  const signupValid =
    emailValid &&
    passwordValid &&
    fullName.trim().length > 1 &&
    (role === "faculty" || rollNumber.trim().length > 0);
  const canSubmit = mode === "signin" ? emailValid && passwordValid : signupValid;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit || busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "signin") {
        const result = await signIn(email.trim(), password);
        const nextRole = await fetchRole(result.user.id);
        void navigate({ to: dashboardPathFor(nextRole) });
      } else {
        const result = await signUp({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          role,
          rollNumber,
        });
        if (result.session) {
          void navigate({ to: dashboardPathFor(role) });
        } else {
          setNotice("Account created. Check your email to confirm it, then sign in.");
          setMode("signin");
        }
      }
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="panel cyber-surface w-full max-w-md space-y-5 p-7 shadow-xl"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-md border border-primary/50 bg-primary/10 text-primary">
          <Terminal className="size-4" />
        </span>
        <div>
          <h1 className="font-mono text-lg font-bold tracking-tight text-foreground">
            Attend<span className="text-primary">X</span>
          </h1>
          <p className="terminal-label">
            {mode === "signin" ? "Secure access" : "Register operator"}
          </p>
        </div>
      </div>

      {mode === "signup" ? (
        <div className="grid grid-cols-2 gap-2">
          {(["student", "faculty"] as AppRole[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setRole(option)}
              className={
                role === option
                  ? "rounded-md border border-primary bg-primary/15 px-3 py-2 font-mono text-xs tracking-widest text-primary uppercase"
                  : "rounded-md border border-border px-3 py-2 font-mono text-xs tracking-widest text-muted-foreground uppercase transition-colors hover:border-primary/50 hover:text-foreground"
              }
            >
              {option}
            </button>
          ))}
        </div>
      ) : null}

      {mode === "signup" ? (
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ada Lovelace"
            autoComplete="name"
          />
        </div>
      ) : null}

      {mode === "signup" && role === "student" ? (
        <div className="space-y-2">
          <Label htmlFor="rollNumber">Roll number</Label>
          <Input
            id="rollNumber"
            value={rollNumber}
            onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
            placeholder="CS21-0042"
            className="font-mono"
          />
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@campus.edu"
          autoComplete="email"
          className="font-mono"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
        />
        {password.length > 0 && !passwordValid ? (
          <p className="font-mono text-xs text-signal">Minimum 6 characters.</p>
        ) : null}
      </div>

      {error ? <ErrorBanner error={error} title="Authentication failed" /> : null}
      {notice ? (
        <p className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2 font-mono text-xs text-primary">
          {notice}
        </p>
      ) : null}

      <Button type="submit" disabled={!canSubmit || busy} className="w-full font-mono tracking-wide">
        {busy ? <Spinner className="text-primary-foreground" /> : null}
        {mode === "signin" ? "Sign in" : "Create account"}
      </Button>

      <button
        type="button"
        className="w-full text-center font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setError(null);
          setNotice(null);
        }}
      >
        {mode === "signin" ? "No account? Register →" : "← Back to sign in"}
      </button>
    </form>
  );
}