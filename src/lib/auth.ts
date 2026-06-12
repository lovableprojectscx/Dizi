import { supabase } from "./supabase";
import { useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────────────────────
export type AuthRole = "super_admin" | "store_owner" | null;

export interface AuthState {
  user: User | null;
  session: Session | null;
  role: AuthRole;
  loading: boolean;
}

// ─── Role helper ─────────────────────────────────────────────────────────────
export function getUserRole(user: User | null): AuthRole {
  if (!user) return null;
  const appMeta = user.app_metadata as { role?: string } | undefined;
  if (appMeta?.role === "super_admin") return "super_admin";
  return "store_owner";
}

// ─── Hook: useAuth ────────────────────────────────────────────────────────────
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    role: null,
    loading: true,
  });

  useEffect(() => {
    // Load initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({
        user: session?.user ?? null,
        session,
        role: getUserRole(session?.user ?? null),
        loading: false,
      });
    });

    // Subscribe to auth changes (login / logout / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({
        user: session?.user ?? null,
        session,
        role: getUserRole(session?.user ?? null),
        loading: false,
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  return state;
}

// ─── Auth Actions ─────────────────────────────────────────────────────────────
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getActiveSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// ─── Server-side guard helper (for beforeLoad) ────────────────────────────────
// Returns the current session synchronously from localStorage (Supabase stores it)
export function getSessionSync(): Session | null {
  try {
    const raw = Object.keys(localStorage).find((k) => k.includes("auth-token"));
    if (!raw) return null;
    const parsed = JSON.parse(localStorage.getItem(raw) ?? "null");
    return parsed?.currentSession ?? null;
  } catch {
    return null;
  }
}

export function getRoleSync(): AuthRole {
  const session = getSessionSync();
  return getUserRole(session?.user ?? null);
}
