import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, Lock, LockOpen, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, ErrorBanner, LoadingPanel, Spinner } from "@/components/ui/state";
import {
  createSession,
  listRecords,
  listSessions,
  saveRecords,
  setSessionStatus,
  type AttendanceStatus,
} from "@/services/attendanceApi";
import { listRoster } from "@/services/classApi";

const STATUSES: { value: AttendanceStatus; label: string; active: string }[] = [
  { value: "present", label: "P", active: "border-success bg-success/15 text-success" },
  { value: "late", label: "L", active: "border-signal bg-signal/15 text-signal" },
  { value: "absent", label: "A", active: "border-destructive bg-destructive/15 text-destructive" },
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function LiveAttendanceTaker({ classId }: { classId: string }) {
  const queryClient = useQueryClient();
  const [date, setDate] = useState(today);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});

  const rosterQuery = useQuery({ queryKey: ["roster", classId], queryFn: () => listRoster(classId) });
  const sessionsQuery = useQuery({ queryKey: ["sessions", classId], queryFn: () => listSessions(classId) });

  const activeSession = useMemo(
    () => sessionsQuery.data?.find((s) => s.id === sessionId) ?? null,
    [sessionsQuery.data, sessionId],
  );

  const recordsQuery = useQuery({
    queryKey: ["records", sessionId],
    queryFn: () => listRecords(sessionId!),
    enabled: Boolean(sessionId),
  });

  useEffect(() => {
    if (!recordsQuery.data) return;
    const next: Record<string, AttendanceStatus> = {};
    for (const record of recordsQuery.data) next[record.class_student_id] = record.status;
    setMarks(next);
  }, [recordsQuery.data]);

  const open = useMutation({
    mutationFn: () => createSession(classId, date),
    onSuccess: (session) => {
      setSessionId(session.id);
      void queryClient.invalidateQueries({ queryKey: ["sessions", classId] });
    },
  });

  const save = useMutation({
    mutationFn: () =>
      saveRecords(
        sessionId!,
        (rosterQuery.data ?? []).map((row) => ({
          classStudentId: row.id,
          status: marks[row.id] ?? "absent",
        })),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["records", sessionId] });
      void queryClient.invalidateQueries({ queryKey: ["history", classId] });
    },
  });

  const toggleLock = useMutation({
    mutationFn: () => setSessionStatus(sessionId!, activeSession?.status === "open" ? "closed" : "open"),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["sessions", classId] }),
  });

  const locked = activeSession?.status === "closed";
  const summary = (rosterQuery.data ?? []).reduce(
    (acc, row) => {
      const status = marks[row.id] ?? "absent";
      acc[status] += 1;
      return acc;
    },
    { present: 0, late: 0, absent: 0 } as Record<AttendanceStatus, number>,
  );

  return (
    <div className="space-y-5">
      <div className="panel cyber-surface flex flex-wrap items-end gap-3 p-5">
        <div className="space-y-2">
          <p className="terminal-label">Session date</p>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-44 font-mono"
          />
        </div>
        <Button onClick={() => open.mutate()} disabled={open.isPending} className="gap-2 font-mono">
          {open.isPending ? <Spinner className="text-primary-foreground" /> : <CalendarPlus className="size-4" />}
          Open session
        </Button>
        {sessionsQuery.data && sessionsQuery.data.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="terminal-label">Existing</span>
            {sessionsQuery.data.slice(0, 8).map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => {
                  setSessionId(session.id);
                  setDate(session.session_date);
                }}
                className={
                  session.id === sessionId
                    ? "rounded border border-primary bg-primary/15 px-2.5 py-1 font-mono text-xs text-primary"
                    : "rounded border border-border px-2.5 py-1 font-mono text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }
              >
                {session.session_date}
              </button>
            ))}
          </div>
        ) : null}
        {sessionId ? (
          <Button
            variant="outline"
            className="ml-auto gap-2 font-mono"
            onClick={() => toggleLock.mutate()}
            disabled={toggleLock.isPending}
          >
            {locked ? <Lock className="size-4 text-signal" /> : <LockOpen className="size-4 text-primary" />}
            {locked ? "Closed" : "Open"}
          </Button>
        ) : null}
      </div>

      {open.error ? <ErrorBanner error={open.error} title="Could not open session" /> : null}
      {save.error ? <ErrorBanner error={save.error} title="Could not save attendance" /> : null}
      {rosterQuery.error ? <ErrorBanner error={rosterQuery.error} /> : null}

      {!sessionId ? (
        <EmptyState title="No active session" hint="Open a session for a date to start marking attendance." />
      ) : rosterQuery.isPending || recordsQuery.isPending ? (
        <LoadingPanel label="Loading attendance grid" />
      ) : rosterQuery.data?.length === 0 ? (
        <EmptyState title="Roster is empty" hint="Add students on the Roster tab first." />
      ) : (
        <div className="panel overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
            <div className="flex gap-4 font-mono text-xs">
              <span className="text-success">P {summary.present}</span>
              <span className="text-signal">L {summary.late}</span>
              <span className="text-destructive">A {summary.absent}</span>
            </div>
            <Button
              onClick={() => save.mutate()}
              disabled={save.isPending || locked}
              className="gap-2 font-mono"
            >
              {save.isPending ? <Spinner className="text-primary-foreground" /> : <Save className="size-4" />}
              {save.isSuccess && !save.isPending ? "Saved" : "Save attendance"}
            </Button>
          </div>
          <ul className="divide-y divide-border">
            {rosterQuery.data?.map((row) => {
              const current = marks[row.id] ?? "absent";
              return (
                <li key={row.id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <div className="min-w-0">
                    <p className="font-mono text-sm text-primary">{row.roll_number}</p>
                    <p className="truncate text-xs text-muted-foreground">{row.full_name || "Unnamed"}</p>
                  </div>
                  <div className="flex gap-1.5">
                    {STATUSES.map((status) => (
                      <button
                        key={status.value}
                        type="button"
                        disabled={locked}
                        aria-label={`${row.roll_number} ${status.value}`}
                        onClick={() => setMarks((prev) => ({ ...prev, [row.id]: status.value }))}
                        className={`size-9 rounded-md border font-mono text-sm transition-colors disabled:opacity-40 ${
                          current === status.value
                            ? status.active
                            : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                        }`}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}