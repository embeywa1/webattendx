import { createFileRoute } from "@tanstack/react-router";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MyAttendanceView } from "@/components/student/MyAttendanceView";

export const Route = createFileRoute("/_authenticated/student/attendance")({
  head: () => ({
    meta: [
      { title: "My Attendance — AttendX" },
      { name: "description", content: "Session-by-session attendance history for each of your classes." },
      { property: "og:title", content: "My Attendance — AttendX" },
      { property: "og:description", content: "Session-by-session attendance history." },
    ],
  }),
  component: MyAttendancePage,
});

function MyAttendancePage() {
  return (
    <ProtectedRoute role="student">
      <div className="space-y-6">
        <header>
          <p className="terminal-label">Records</p>
          <h1 className="mt-1 text-2xl font-bold text-foreground">My attendance</h1>
        </header>
        <MyAttendanceView />
      </div>
    </ProtectedRoute>
  );
}