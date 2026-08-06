import { createFileRoute } from "@tanstack/react-router";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { StudentDashboard } from "@/components/student/StudentDashboard";

export const Route = createFileRoute("/_authenticated/student/dashboard")({
  head: () => ({
    meta: [
      { title: "Student Dashboard — AttendX" },
      { name: "description", content: "Track your attendance percentage across every enrolled class." },
      { property: "og:title", content: "Student Dashboard — AttendX" },
      { property: "og:description", content: "Your attendance percentage across every class." },
    ],
  }),
  component: StudentDashboardPage,
});

function StudentDashboardPage() {
  return (
    <ProtectedRoute role="student">
      <div className="space-y-6">
        <header>
          <p className="terminal-label">Student console</p>
          <h1 className="mt-1 text-2xl font-bold text-foreground">Attendance overview</h1>
        </header>
        <StudentDashboard />
      </div>
    </ProtectedRoute>
  );
}