import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LiveAttendanceTaker } from "@/components/faculty/LiveAttendanceTaker";
import { ReportGenerator } from "@/components/faculty/ReportGenerator";
import { RosterUpload } from "@/components/faculty/RosterUpload";
import { ErrorBanner, LoadingPanel } from "@/components/ui/state";
import { getClass } from "@/services/classApi";

export const Route = createFileRoute("/_authenticated/faculty/classes/$classId")({
  head: () => ({
    meta: [
      { title: "Class Console — AttendX" },
      { name: "description", content: "Manage the roster, take live attendance and export reports." },
      { property: "og:title", content: "Class Console — AttendX" },
      { property: "og:description", content: "Roster, live attendance and reports for your class." },
    ],
  }),
  component: ClassConsole,
});

const TABS = ["attendance", "roster", "reports"] as const;
type Tab = (typeof TABS)[number];

function ClassConsole() {
  const { classId } = Route.useParams();
  const [tab, setTab] = useState<Tab>("attendance");
  const classQuery = useQuery({ queryKey: ["class", classId], queryFn: () => getClass(classId) });

  return (
    <ProtectedRoute role="faculty">
      <div className="space-y-6">
        <header className="space-y-1">
          <Link
            to="/faculty/dashboard"
            className="font-mono text-xs tracking-widest text-muted-foreground uppercase hover:text-primary"
          >
            ← All classes
          </Link>
          <h1 className="text-2xl font-bold text-foreground">
            <span className="font-mono text-primary">{classQuery.data?.course_code ?? "····"}</span>{" "}
            {classQuery.data?.course_name ?? ""}
          </h1>
        </header>

        {classQuery.isPending ? <LoadingPanel label="Loading class" /> : null}
        {classQuery.error ? <ErrorBanner error={classQuery.error} /> : null}

        <nav className="flex gap-2 border-b border-border">
          {TABS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`-mb-px border-b-2 px-3 py-2 font-mono text-xs tracking-widest uppercase transition-colors ${
                tab === item
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {item}
            </button>
          ))}
        </nav>

        {tab === "attendance" ? <LiveAttendanceTaker classId={classId} /> : null}
        {tab === "roster" ? <RosterUpload classId={classId} /> : null}
        {tab === "reports" && classQuery.data ? (
          <ReportGenerator
            classId={classId}
            courseCode={classQuery.data.course_code}
            courseName={classQuery.data.course_name}
          />
        ) : null}
      </div>
    </ProtectedRoute>
  );
}