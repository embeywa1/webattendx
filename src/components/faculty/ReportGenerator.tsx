import { useQuery } from "@tanstack/react-query";
import { Download, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState, ErrorBanner, LoadingPanel } from "@/components/ui/state";
import {
  attendanceRate,
  downloadFile,
  getClassHistory,
  toCsv,
  type AttendanceStatus,
} from "@/services/attendanceApi";
import { listRoster } from "@/services/classApi";

export function ReportGenerator({
  classId,
  courseCode,
  courseName,
}: {
  classId: string;
  courseCode: string;
  courseName: string;
}) {
  const rosterQuery = useQuery({ queryKey: ["roster", classId], queryFn: () => listRoster(classId) });
  const historyQuery = useQuery({ queryKey: ["history", classId], queryFn: () => getClassHistory(classId) });

  if (rosterQuery.isPending || historyQuery.isPending) return <LoadingPanel label="Compiling report" />;
  if (rosterQuery.error) return <ErrorBanner error={rosterQuery.error} />;
  if (historyQuery.error) return <ErrorBanner error={historyQuery.error} />;

  const roster = rosterQuery.data ?? [];
  const { sessions, records } = historyQuery.data ?? { sessions: [], records: [] };

  if (sessions.length === 0) {
    return <EmptyState title="No sessions recorded" hint="Take attendance first to generate a report." />;
  }

  const byStudent = new Map<string, Map<string, AttendanceStatus>>();
  for (const record of records) {
    const row = byStudent.get(record.class_student_id) ?? new Map<string, AttendanceStatus>();
    row.set(record.session_id, record.status);
    byStudent.set(record.class_student_id, row);
  }

  const rows = roster.map((student) => {
    const marks = byStudent.get(student.id) ?? new Map<string, AttendanceStatus>();
    const statuses = sessions
      .map((s) => marks.get(s.id))
      .filter((s): s is AttendanceStatus => Boolean(s));
    return {
      student,
      marks,
      rate: attendanceRate(statuses.map((status) => ({ status }))),
      recorded: statuses.length,
    };
  });

  function exportCsv() {
    const header = ["Roll number", "Name", ...sessions.map((s) => s.session_date), "Attendance %"];
    const body = rows.map((row) => [
      row.student.roll_number,
      row.student.full_name ?? "",
      ...sessions.map((s) => row.marks.get(s.id) ?? ""),
      `${row.rate}%`,
    ]);
    downloadFile(`${courseCode}-attendance.csv`, toCsv([header, ...body]));
  }

  function exportPrintable() {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${courseCode} attendance</title>
<style>body{font-family:ui-monospace,monospace;padding:24px;color:#111}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #999;padding:6px;text-align:left}h1{font-size:18px}</style>
</head><body><h1>${courseCode} — ${courseName}</h1><p>Generated ${new Date().toLocaleString()}</p>
<table><thead><tr><th>Roll</th><th>Name</th>${sessions.map((s) => `<th>${s.session_date}</th>`).join("")}<th>%</th></tr></thead>
<tbody>${rows
      .map(
        (row) =>
          `<tr><td>${row.student.roll_number}</td><td>${row.student.full_name ?? ""}</td>${sessions
            .map((s) => `<td>${row.marks.get(s.id) ?? "-"}</td>`)
            .join("")}<td>${row.rate}%</td></tr>`,
      )
      .join("")}</tbody></table>
<script>window.onload=()=>window.print()</script></body></html>`;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3">
        <Button onClick={exportCsv} className="gap-2 font-mono">
          <Download className="size-4" />
          Export CSV
        </Button>
        <Button variant="outline" onClick={exportPrintable} className="gap-2 font-mono">
          <FileText className="size-4" />
          Print / PDF
        </Button>
      </div>

      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[520px] text-left font-mono text-xs">
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Roll</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Sessions</th>
              <th className="px-4 py-3">Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.student.id}>
                <td className="px-4 py-2.5 text-primary">{row.student.roll_number}</td>
                <td className="px-4 py-2.5 text-foreground">{row.student.full_name ?? "—"}</td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {row.recorded}/{sessions.length}
                </td>
                <td
                  className={`px-4 py-2.5 ${row.rate >= 75 ? "text-success" : "text-signal"}`}
                >
                  {row.rate}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}