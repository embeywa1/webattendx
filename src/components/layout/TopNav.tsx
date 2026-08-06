import { useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { signOut } from "@/services/authApi";

export function TopNav() {
  const { profile, role, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    void navigate({ to: "/", replace: true });
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background/80 px-5 backdrop-blur">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">
          {profile?.full_name || user?.email}
        </p>
        <p className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase">
          {role ?? "unassigned"}
          {profile?.roll_number ? ` · ${profile.roll_number}` : ""}
        </p>
      </div>
      <Button variant="ghost" size="sm" className="gap-2 font-mono text-xs" onClick={handleSignOut}>
        <LogOut className="size-4" />
        Sign out
      </Button>
    </header>
  );
}