import { supabase } from "./supabaseClient";

export type AppRole = "faculty" | "student";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  roll_number: string | null;
  created_at: string;
}

export interface SignUpInput {
  email: string;
  password: string;
  fullName: string;
  role: AppRole;
  rollNumber?: string;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUp({ email, password, fullName, role, rollNumber }: SignUpInput) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/`,
      data: {
        full_name: fullName,
        role,
        roll_number: role === "student" ? (rollNumber ?? "").trim().toUpperCase() : null,
      },
    },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, roll_number, created_at")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchRole(userId: string): Promise<AppRole | null> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data?.role as AppRole | undefined) ?? null;
}

export function dashboardPathFor(role: AppRole | null) {
  return role === "faculty" ? "/faculty/dashboard" : "/student/dashboard";
}