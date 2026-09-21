/**
 * @file auth.ts
 * @description Módulo de autenticación y autorización para DIZI con Supabase Auth.
 * Proporciona el hook `useAuth`, funciones de inicio/cierre de sesión, recuperación de contraseña,
 * resolución de roles y utilidades de lectura síncrona de sesión para guardias de enrutamiento (`beforeLoad`).
 */

import { supabase } from "./supabase";
import { useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Roles de usuario reconocidos por la plataforma:
 * - `super_admin`: Administrador global con acceso a `/super/*` (gestión de tiendas, promociones, métricas).
 * - `store_owner`: Dueño o administrador de una tienda con acceso a `/admin/*`.
 * - `null`: Usuario no autenticado o invitado.
 */
export type AuthRole = "super_admin" | "store_owner" | null;

/**
 * Estado reactivo devuelto por el hook `useAuth`.
 */
export interface AuthState {
  /** Usuario autenticado de Supabase o null si no hay sesión */
  user: User | null;
  /** Sesión activa de Supabase conteniendo tokens de acceso y refresco */
  session: Session | null;
  /** Rol resuelto para el usuario actual */
  role: AuthRole;
  /** Indica si la sesión inicial aún se encuentra cargando */
  loading: boolean;
}

// ─── Role helper ─────────────────────────────────────────────────────────────

/**
 * Determina el rol de un usuario analizando sus metadatos de aplicación (`app_metadata`).
 * Si en `app_metadata.role` se encuentra el valor "super_admin", retorna "super_admin";
 * de lo contrario, si el usuario existe, se le otorga el rol de "store_owner".
 *
 * @param user Usuario de Supabase Auth o null.
 * @returns Rol correspondiente o null si no hay usuario.
 */
export function getUserRole(user: User | null): AuthRole {
  if (!user) return null;
  const appMeta = user.app_metadata as { role?: string } | undefined;
  if (appMeta?.role === "super_admin") return "super_admin";
  return "store_owner";
}

// ─── Hook: useAuth ────────────────────────────────────────────────────────────

/**
 * Hook de React para acceder al estado de autenticación en componentes de interfaz.
 * Se suscribe automáticamente a eventos de inicio de sesión, cierre de sesión y refresco de tokens.
 *
 * @example
 * ```tsx
 * const { user, role, loading } = useAuth();
 * if (loading) return <Spinner />;
 * if (!user) return <Redirect to="/login" />;
 * ```
 */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    role: null,
    loading: true,
  });

  useEffect(() => {
    // Carga de la sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({
        user: session?.user ?? null,
        session,
        role: getUserRole(session?.user ?? null),
        loading: false,
      });
    });

    // Suscripción reactiva a cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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

/**
 * Inicia sesión utilizando credenciales de correo electrónico y contraseña.
 * @param email Correo electrónico registrado del usuario.
 * @param password Contraseña de la cuenta.
 * @returns Promesa con los datos de sesión y usuario autenticado.
 * @throws Error si las credenciales son incorrectas o la cuenta no existe.
 */
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/**
 * Cierra la sesión activa del usuario y revoca el token en Supabase.
 * @throws Error si ocurre una falla de comunicación con Supabase.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Envía un correo electrónico con el enlace de recuperación y restablecimiento de contraseña.
 * Configura la redirección hacia `/login?reset=true` para procesar el token de cambio.
 * @param email Correo electrónico de la cuenta a restablecer.
 * @returns Promesa con la respuesta de Supabase.
 * @throws Error si el correo no se pudo enviar.
 */
export async function resetPasswordForEmail(email: string) {
  const origin = typeof window !== "undefined" && window.location?.origin ? window.location.origin : "https://dizi.idenza.site";
  const redirectTo = `${origin}/login?reset=true`;
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
  return data;
}

/**
 * Actualiza la contraseña del usuario actualmente autenticado.
 * Utilizado tras ingresar al enlace de recuperación o desde la configuración de perfil.
 * @param newPassword Nueva contraseña a establecer.
 * @returns Promesa con la información del usuario actualizada.
 * @throws Error si la sesión caducó o la contraseña no cumple los requisitos mínimos.
 */
export async function updateUserPassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
  return data;
}

/**
 * Obtiene la sesión activa actual de forma asíncrona directamente desde el cliente Supabase.
 * @returns Sesión activa de Supabase o null si no hay sesión.
 */
export async function getActiveSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

// ─── Server-side guard helper (for beforeLoad) ────────────────────────────────

/**
 * Obtiene la sesión de Supabase de manera síncrona leyendo directamente desde `localStorage`.
 *
 * Esta función es esencial para los hooks `beforeLoad` de **TanStack Router**,
 * permitiendo validar la sesión de forma inmediata durante la resolución de rutas sin
 * bloqueos asíncronos ni parpadeos en pantalla.
 *
 * @returns La sesión parseada de `localStorage` o null si no existe.
 */
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

/**
 * Retorna el rol del usuario actual de manera síncrona utilizando `getSessionSync()`.
 * Utilizado en los guardias de enrutamiento para proteger `/super/*` y `/admin/*`.
 *
 * @returns Rol del usuario (`super_admin`, `store_owner` o null).
 */
export function getRoleSync(): AuthRole {
  const session = getSessionSync();
  return getUserRole(session?.user ?? null);
}
