import { useQueries, useQuery } from "@tanstack/react-query";

import { EmptyState, ErrorBanner, LoadingPanel } from "@/components/ui/state";
import { attendanceRate, getClassHistory } from "@/services/attendanceApi";
import { listClasses } from "@/services/classApi";

export function MyAttendanceView() {
  const classesQuery = useQuery({ queryKey: ["classes"], queryFn: listClasses });
  const classes = classesQuery.data ?? [];

  const histories = useQueries({
    queries: classes.map((klass) => ({
      queryKey: ["history", klass.id],
      queryFn: () => getClassHistory(klass.id),
    })),
  });

  if (classesQuery.isPending) return <LoadingPanel label="Loading your classes" />;
  if (classesQuery.error) return <ErrorBanner error={classesQuery.error} />;
  if (classes.length === 0) {
    return (
      <EmptyState
        title="You are not on any roster yet"
        hint="Ask your faculty to add your roll number to a class."
      />
    );
  }

  return (
    <div className="space-y-6">
      {classes.map((klass, index) => {
        const history = histories[index];
        const records = history?.data?.records ?? [];
        const sessions = history?.data?.sessions ?? [];
        const rate = attendanceRate(records);

        return (
          <section key={klass.id} className="panel p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="font-mono text-xs tracking-widest text-primary uppercase">
                  {klass.course_code}
                </p>
                <h2 className="text-base font-semibold text-foreground">{klass.course_name}</h2>
              </div>
              <p className={`font-mono text-2xl font-bold ${rate >= 75 ? "text-success" : "text-signal"}`}>
                {history?.isPending ? "··" : `${rate}%`}
              </p>
            </div>

            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${rate >= 75 ? "bg-success" : "bg-signal"}`}
                style={{ width: `${rate}%` }}
              />
            </div>

            {history?.error ? <ErrorBanner error={history.error} /> : null}

            {records.length === 0 ? (
              <p className="mt-4 font-mono text-xs text-muted-foreground">No attendance recorded yet.</p>
            ) : (
              <ul className="mt-4 divide-y divide-border">
                {sessions.map((session) => {
                  const record = records.find((r) => r.session_id === session.id);
                  if (!record) return null;
                  const tone =
                    record.status === "present"
                      ? "text-success"
                      : record.status === "late"
                        ? "text-signal"
                        : "text-destructive";
                  return (
                    <li key={session.id} className="flex items-center justify-between py-2 font-mono text-xs">
                      <span className="text-muted-foreground">{session.session_date}</span>
                      <span className={`uppercase ${tone}`}>{record.status}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}