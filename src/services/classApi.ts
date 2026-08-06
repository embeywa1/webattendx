import { supabase } from "./supabaseClient";

export interface ClassRow {
  id: string;
  teacher_id: string;
  course_code: string;
  course_name: string;
  created_at: string;
}

export interface RosterRow {
  id: string;
  class_id: string;
  student_id: string | null;
  roll_number: string;
  full_name: string | null;
  joined_at: string;
}

export async function listClasses(): Promise<ClassRow[]> {
  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getClass(classId: string): Promise<ClassRow | null> {
  const { data, error } = await supabase.from("classes").select("*").eq("id", classId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createClass(input: {
  teacherId: string;
  courseCode: string;
  courseName: string;
}): Promise<ClassRow> {
  const { data, error } = await supabase
    .from("classes")
    .insert({
      teacher_id: input.teacherId,
      course_code: input.courseCode.trim().toUpperCase(),
      course_name: input.courseName.trim(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateClass(
  classId: string,
  input: { courseCode: string; courseName: string },
): Promise<ClassRow> {
  const { data, error } = await supabase
    .from("classes")
    .update({
      course_code: input.courseCode.trim().toUpperCase(),
      course_name: input.courseName.trim(),
    })
    .eq("id", classId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteClass(classId: string) {
  const { error } = await supabase.from("classes").delete().eq("id", classId);
  if (error) throw error;
}

export async function listRoster(classId: string): Promise<RosterRow[]> {
  const { data, error } = await supabase
    .from("class_students")
    .select("*")
    .eq("class_id", classId)
    .order("roll_number", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** Bulk add roll numbers to a roster. Existing roll numbers are left untouched. */
export async function addRosterEntries(
  classId: string,
  entries: { rollNumber: string; fullName?: string }[],
) {
  const rows = entries
    .filter((e) => e.rollNumber.trim().length > 0)
    .map((e) => ({
      class_id: classId,
      roll_number: e.rollNumber.trim().toUpperCase(),
      full_name: e.fullName?.trim() || null,
    }));
  if (rows.length === 0) return [];
  const { data, error } = await supabase
    .from("class_students")
    .upsert(rows, { onConflict: "class_id,roll_number", ignoreDuplicates: true })
    .select();
  if (error) throw error;
  return data ?? [];
}

export async function removeRosterEntry(id: string) {
  const { error } = await supabase.from("class_students").delete().eq("id", id);
  if (error) throw error;
}

/** Parses pasted CSV / newline text into roster entries: "ROLL, Full Name" per line. */
export function parseRosterText(text: string) {
  return text
    .split(/[\n\r]+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [rollNumber, ...rest] = line.split(/[,;\t]/);
      return { rollNumber: (rollNumber ?? "").trim(), fullName: rest.join(" ").trim() };
    })
    .filter((e) => e.rollNumber.length > 0);
}