import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/contexts/AuthContext";
import { dashboardPathFor } from "@/services/authApi";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AttendX — Role-Based Attendance Tracking" },
      {
        name: "description",
        content:
          "AttendX is a secure attendance platform for schools: faculty run live rosters, students track their own percentage.",
      },
      { property: "og:title", content: "AttendX — Role-Based Attendance Tracking" },
      {
        property: "og:description",
        content: "Live rosters for faculty, transparent attendance stats for students.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { session, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session) void navigate({ to: dashboardPathFor(role), replace: true });
  }, [loading, session, role, navigate]);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="cyber-surface hidden flex-col justify-between border-r border-border p-12 lg:flex">
        <p className="terminal-label">Attendance infrastructure</p>
        <div className="space-y-5">
          <h1 className="font-mono text-5xl font-bold tracking-tighter text-foreground">
            Attend<span className="text-primary">X</span>
          </h1>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Role-separated attendance for educational institutions. Faculty run live rosters and
            export reports; students see exactly where they stand — nothing more.
          </p>
          <ul className="space-y-2 font-mono text-xs text-muted-foreground">
            <li>
              <span className="text-primary">›</span> Strict row-level access per role
            </li>
            <li>
              <span className="text-primary">›</span> Bulk roster import by roll number
            </li>
            <li>
              <span className="text-signal">›</span> CSV &amp; printable attendance reports
            </li>
          </ul>
        </div>
        <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
          Secure · Auditable · Fast
        </p>
      </section>

      <section className="flex items-center justify-center p-6">
        <LoginForm />
      </section>
    </div>
  );
}
