import { supabase } from "./supabaseClient";

export type AttendanceStatus = "present" | "absent" | "late";

export interface SessionRow {
  id: string;
  class_id: string;
  session_date: string;
  status: "open" | "closed";
  created_at: string;
}

export interface RecordRow {
  id: string;
  session_id: string;
  class_student_id: string;
  status: AttendanceStatus;
}

export async function listSessions(classId: string): Promise<SessionRow[]> {
  const { data, error } = await supabase
    .from("attendance_sessions")
    .select("*")
    .eq("class_id", classId)
    .order("session_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createSession(classId: string, sessionDate: string): Promise<SessionRow> {
  const { data, error } = await supabase
    .from("attendance_sessions")
    .upsert({ class_id: classId, session_date: sessionDate }, { onConflict: "class_id,session_date" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function setSessionStatus(sessionId: string, status: "open" | "closed") {
  const { error } = await supabase
    .from("attendance_sessions")
    .update({ status })
    .eq("id", sessionId);
  if (error) throw error;
}

export async function listRecords(sessionId: string): Promise<RecordRow[]> {
  const { data, error } = await supabase
    .from("attendance_records")
    .select("id, session_id, class_student_id, status")
    .eq("session_id", sessionId);
  if (error) throw error;
  return data ?? [];
}

export async function saveRecords(
  sessionId: string,
  marks: { classStudentId: string; status: AttendanceStatus }[],
) {
  if (marks.length === 0) return;
  const { error } = await supabase.from("attendance_records").upsert(
    marks.map((m) => ({
      session_id: sessionId,
      class_student_id: m.classStudentId,
      status: m.status,
    })),
    { onConflict: "session_id,class_student_id" },
  );
  if (error) throw error;
}

export interface ClassAttendanceHistory {
  sessions: SessionRow[];
  records: RecordRow[];
}

/** All sessions + all readable records for a class (RLS scopes records per role). */
export async function getClassHistory(classId: string): Promise<ClassAttendanceHistory> {
  const sessions = await listSessions(classId);
  if (sessions.length === 0) return { sessions, records: [] };
  const { data, error } = await supabase
    .from("attendance_records")
    .select("id, session_id, class_student_id, status")
    .in(
      "session_id",
      sessions.map((s) => s.id),
    );
  if (error) throw error;
  return { sessions, records: data ?? [] };
}

export function attendanceRate(records: { status: AttendanceStatus }[]) {
  if (records.length === 0) return 0;
  const credited = records.filter((r) => r.status === "present" || r.status === "late").length;
  return Math.round((credited / records.length) * 100);
}

export function toCsv(rows: (string | number)[][]) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? "");
          return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
        })
        .join(","),
    )
    .join("\n");
}

export function downloadFile(filename: string, contents: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}