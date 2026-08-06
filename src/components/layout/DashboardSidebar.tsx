import { Link } from "@tanstack/react-router";
import { BookOpen, GaugeCircle, LayoutGrid, Terminal } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";

const facultyLinks = [
  { to: "/faculty/dashboard", label: "Classes", icon: LayoutGrid },
] as const;

const studentLinks = [
  { to: "/student/dashboard", label: "Overview", icon: GaugeCircle },
  { to: "/student/attendance", label: "My attendance", icon: BookOpen },
] as const;

export function DashboardSidebar() {
  const { role } = useAuth();
  const links = role === "faculty" ? facultyLinks : studentLinks;

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-5">
        <Terminal className="size-4 text-primary" />
        <span className="font-mono text-sm font-bold tracking-tight text-sidebar-foreground">
          Attend<span className="text-primary">X</span>
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        <p className="terminal-label px-2 pb-2">{role === "faculty" ? "Faculty" : "Student"}</p>
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            activeProps={{
              className:
                "border-primary/60 bg-sidebar-accent text-sidebar-accent-foreground glow-primary",
            }}
            inactiveProps={{ className: "border-transparent text-muted-foreground" }}
            className="flex items-center gap-2.5 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
          >
            <link.icon className="size-4" />
            {link.label}
          </Link>
        ))}
      </nav>
      <p className="border-t border-sidebar-border px-5 py-3 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
        v1.0 · secure
      </p>
    </aside>
  );
}