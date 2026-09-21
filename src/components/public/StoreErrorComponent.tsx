/**
 * @file StoreErrorComponent.tsx
 * @description Pantalla de captura y recuperación de errores (Error Boundary)
 * para las rutas públicas de la tienda (/t/:slug y /bio/:slug) en TanStack Router.
 * Detecta fallos de conectividad (proveedores móviles, timeout de Supabase)
 * y ofrece opciones de reintento automático e invalidación de caché.
 */

import { useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

/**
 * Propiedades del componente de error de tienda.
 */
interface StoreErrorComponentProps {
  /** Error capturado por el Error Boundary de TanStack Router */
  error: any;
  /** Función para reiniciar el estado del Error Boundary */
  reset: () => void;
}

/**
 * Componente renderizado automáticamente cuando ocurre una excepción durante la carga
 * o renderizado del catálogo público o del bio-link.
 *
 * Ofrece orientación específica para usuarios en redes móviles (Claro/Movistar en Perú)
 * cuando se detecta un timeout de conexión con Supabase.
 */
export function StoreErrorComponent({ error, reset }: StoreErrorComponentProps) {
  const router = useRouter();
  const errorMsg = error?.message || (typeof error === "string" ? error : "") || "";
  const isTimeoutOrNetwork =
    errorMsg.includes("Timeout") ||
    errorMsg.toLowerCase().includes("fetch") ||
    errorMsg.toLowerCase().includes("network") ||
    !navigator.onLine;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
      <div className="max-w-md p-6 rounded-2xl border bg-card shadow-sm space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
        </div>
        <div className="space-y-2">
          <h1 className="text-lg font-bold text-foreground">
            {isTimeoutOrNetwork ? "Error de Conexión" : "No se pudo cargar la página"}
          </h1>
          <p className="text-xs text-muted-foreground leading-normal">
            {isTimeoutOrNetwork
              ? "Estamos teniendo problemas para conectarnos a la base de datos. Si estás usando Wi-Fi de Movistar o Claro, intenta desactivándolo y navegando con tus datos móviles (4G/5G)."
              : "Ocurrió un error inesperado al cargar la tienda. Por favor, intenta de nuevo."}
          </p>
        </div>
        <div className="flex flex-col gap-2 pt-2">
          <Button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="w-full h-10 font-bold"
          >
            Reintentar
          </Button>
          <a
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-input bg-background text-xs font-bold text-foreground hover:bg-accent transition-colors"
          >
            Ir al Inicio
          </a>
        </div>
      </div>
    </div>
  );
}
