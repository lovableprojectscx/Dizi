/**
 * @file meta-pixel.ts
 * @description Integración aislada y perezosa del Píxel de Meta para páginas propias de DIZI (F58).
 * - Solo se activa en hosts de producción (`dizi.idenza.site`, `dizicatalogo.com` con y sin `www`).
 * - Solo se activa en rutas permitidas de DIZI (`/`, `/register`, `/login`, `/ayuda`, `/novedades`, `/terminos`, `/privacidad`).
 * - Nunca se activa en catálogos de tiendas (`/t/*`), bio links (`/bio/*`), pedidos (`/pedido/*`), `/admin*` ni `/super*`.
 * - Nunca se activa en modo prueba (`isPreviewTestMode()`) ni para usuarios `super_admin` (`getRoleSync()`).
 * - Nunca envía datos personales (nombre, teléfono, correo ni slug).
 */

import { getRoleSync } from "./auth";
import { isPreviewTestMode, isProductionRegisterHost } from "./register-preview";

/** ID público del Píxel de Meta de DIZI (no es secreto). */
export const META_PIXEL_ID = "1453347423533488";

const META_PIXEL_SCRIPT_URL = "https://connect.facebook.net/en_US/fbevents.js";

/** Rutas exactas de DIZI donde el píxel tiene permitido cargar y disparar eventos. */
export const ALLOWED_PIXEL_PATHS = [
  "/",
  "/register",
  "/login",
  "/ayuda",
  "/novedades",
  "/terminos",
  "/privacidad",
] as const;

const ALLOWED_PIXEL_PATH_SET = new Set<string>(ALLOWED_PIXEL_PATHS);

interface FbqFunction {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  push?: FbqFunction;
  loaded?: boolean;
  version?: string;
  queue: unknown[][];
}

interface MetaPixelWindow extends Window {
  fbq?: FbqFunction;
  _fbq?: FbqFunction;
}

let scriptInjected = false;
let pixelInitialized = false;

/**
 * Normaliza una ruta descartando query/hash y barra final (salvo "/").
 */
export function normalizePixelPath(pathname?: string | null): string {
  if (!pathname) return "";
  const withoutHashOrQuery = pathname.split(/[?#]/)[0] ?? "";
  const trimmed = withoutHashOrQuery.trim();
  if (!trimmed) return "";
  if (trimmed === "/") return "/";
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

/**
 * Indica si la ruta pertenece exclusivamente a las páginas públicas propias de DIZI.
 * Devuelve `false` para `/t/*`, `/bio/*`, `/pedido/*`, `/admin*`, `/super*` y cualquier otra ruta.
 */
export function isPixelAllowedPath(pathname?: string | null): boolean {
  const normalized = normalizePixelPath(pathname);
  return ALLOWED_PIXEL_PATH_SET.has(normalized);
}

/**
 * Indica si el hostname corresponde a un dominio productivo habilitado para el píxel.
 */
export function isPixelEnabledHost(hostname?: string | null): boolean {
  const host =
    hostname !== undefined
      ? hostname
      : typeof window !== "undefined"
        ? window.location.hostname
        : "";
  return isProductionRegisterHost(host);
}

/**
 * Evalúa todas las condiciones de seguridad antes de cargar `fbevents.js` o emitir un evento.
 */
export function canTrackPixel(pathname?: string | null): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }
  const currentPath = pathname !== undefined ? pathname : window.location.pathname;
  if (!isPixelAllowedPath(currentPath)) return false;
  if (!isPixelEnabledHost()) return false;
  if (isPreviewTestMode()) return false;
  if (getRoleSync() === "super_admin") return false;
  return true;
}

/**
 * Inyecta `fbevents.js` de forma perezosa una sola vez e inicializa el píxel una sola vez.
 */
export function ensureMetaPixelLoaded(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }

  const w = window as MetaPixelWindow;

  if (!w.fbq) {
    const fbqStub: FbqFunction = function (...args: unknown[]) {
      if (fbqStub.callMethod) {
        fbqStub.callMethod(...args);
      } else {
        fbqStub.queue.push(args);
      }
    } as FbqFunction;
    if (!w._fbq) w._fbq = fbqStub;
    fbqStub.push = fbqStub;
    fbqStub.loaded = true;
    fbqStub.version = "2.0";
    fbqStub.queue = [];
    w.fbq = fbqStub;
  }

  if (!scriptInjected) {
    const existingScript = document.querySelector(
      `script[src="${META_PIXEL_SCRIPT_URL}"]`,
    );
    if (!existingScript) {
      const script = document.createElement("script");
      script.async = true;
      script.src = META_PIXEL_SCRIPT_URL;
      const firstScript = document.getElementsByTagName("script")[0];
      if (firstScript?.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript);
      } else {
        document.head.appendChild(script);
      }
    }
    scriptInjected = true;
  }

  if (!pixelInitialized) {
    w.fbq("set", "autoConfig", false, META_PIXEL_ID);
    w.fbq("init", META_PIXEL_ID);
    pixelInitialized = true;
  }

  return true;
}

/**
 * Dispara `PageView` si la ruta, el host y el rol lo permiten.
 */
export function trackPageView(pathname?: string | null): boolean {
  if (!canTrackPixel(pathname)) return false;
  if (!ensureMetaPixelLoaded()) return false;
  const w = window as MetaPixelWindow;
  w.fbq?.("track", "PageView");
  return true;
}

/**
 * Dispara `Lead` al completar la pantalla de WhatsApp en `/register`, sin datos personales.
 */
export function trackLead(pathname = "/register"): boolean {
  if (!canTrackPixel(pathname)) return false;
  if (!ensureMetaPixelLoaded()) return false;
  const w = window as MetaPixelWindow;
  w.fbq?.("track", "Lead");
  return true;
}

/**
 * Dispara `CompleteRegistration` tras crear la tienda en `/register`,
 * enviando únicamente `content_category` (rubro) y nunca datos personales ni slug.
 */
export function trackCompleteRegistration(
  contentCategory?: string | null,
  pathname = "/register",
): boolean {
  if (!canTrackPixel(pathname)) return false;
  if (!ensureMetaPixelLoaded()) return false;
  const w = window as MetaPixelWindow;
  const cleanCategory = contentCategory?.trim() || "general";
  w.fbq?.("track", "CompleteRegistration", { content_category: cleanCategory });
  return true;
}

/**
 * Reinicia banderas internas del módulo para pruebas unitarias.
 */
export function resetMetaPixelForTests(): void {
  scriptInjected = false;
  pixelInitialized = false;
}
