import { useQueries, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { EmptyState, ErrorBanner, LoadingPanel } from "@/components/ui/state";
import { useAuth } from "@/contexts/AuthContext";
import { attendanceRate, getClassHistory } from "@/services/attendanceApi";
import { listClasses } from "@/services/classApi";

export function StudentDashboard() {
  const { profile } = useAuth();
  const classesQuery = useQuery({ queryKey: ["classes"], queryFn: listClasses });
  const classes = classesQuery.data ?? [];

  const histories = useQueries({
    queries: classes.map((klass) => ({
      queryKey: ["history", klass.id],
      queryFn: () => getClassHistory(klass.id),
    })),
  });

  const allRecords = histories.flatMap((h) => h.data?.records ?? []);
  const overall = attendanceRate(allRecords);

  return (
    <div className="space-y-6">
      <div className="panel cyber-surface grid gap-4 p-6 sm:grid-cols-3">
        <Stat label="Enrolled classes" value={String(classes.length)} />
        <Stat label="Sessions recorded" value={String(allRecords.length)} />
        <Stat
          label="Overall attendance"
          value={`${overall}%`}
          tone={overall >= 75 ? "text-success" : "text-signal"}
        />
      </div>

      <p className="terminal-label">
        Roll number · {profile?.roll_number ?? "not set"}
      </p>

      {classesQuery.isPending ? <LoadingPanel label="Loading classes" /> : null}
      {classesQuery.error ? <ErrorBanner error={classesQuery.error} /> : null}
      {!classesQuery.isPending && classes.length === 0 ? (
        <EmptyState
          title="No classes on your roster"
          hint="Your faculty adds you by roll number — once added, your classes appear here."
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {classes.map((klass, index) => {
          const rate = attendanceRate(histories[index]?.data?.records ?? []);
          return (
            <div key={klass.id} className="panel p-5">
              <p className="font-mono text-xs tracking-widest text-primary uppercase">
                {klass.course_code}
              </p>
              <h3 className="mt-1 text-sm font-semibold text-foreground">{klass.course_name}</h3>
              <p className={`mt-3 font-mono text-2xl font-bold ${rate >= 75 ? "text-success" : "text-signal"}`}>
                {rate}%
              </p>
            </div>
          );
        })}
      </div>

      <Link
        to="/student/attendance"
        className="inline-block font-mono text-xs tracking-widest text-primary uppercase hover:underline"
      >
        View session history →
      </Link>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <p className="terminal-label">{label}</p>
      <p className={`mt-1 font-mono text-3xl font-bold ${tone ?? "text-foreground"}`}>{value}</p>
    </div>
  );
}