import { createFileRoute } from "@tanstack/react-router";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ClassManager } from "@/components/faculty/ClassManager";

export const Route = createFileRoute("/_authenticated/faculty/dashboard")({
  head: () => ({
    meta: [
      { title: "Faculty Dashboard — AttendX" },
      { name: "description", content: "Create classes and manage attendance rosters in AttendX." },
      { property: "og:title", content: "Faculty Dashboard — AttendX" },
      { property: "og:description", content: "Create classes and manage attendance rosters." },
    ],
  }),
  component: FacultyDashboard,
});

function FacultyDashboard() {
  return (
    <ProtectedRoute role="faculty">
      <div className="space-y-6">
        <header>
          <p className="terminal-label">Faculty console</p>
          <h1 className="mt-1 text-2xl font-bold text-foreground">Your classes</h1>
        </header>
        <ClassManager />
      </div>
    </ProtectedRoute>
  );
}