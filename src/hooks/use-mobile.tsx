/**
 * @file use-mobile.tsx
 * @description Hook reactivo para detección de pantallas móviles basado en MatchMedia.
 * Utiliza un punto de corte estándar (`MOBILE_BREAKPOINT = 768px`).
 */

import * as React from "react";

const MOBILE_BREAKPOINT = 768;

/**
 * Hook para determinar si el viewport actual corresponde a un dispositivo móvil (< 768px).
 * Se suscribe a los cambios del evento `matchMedia` para actualizar el estado en tiempo real.
 * @returns `true` si el ancho de pantalla es menor a 768px, `false` en caso contrario.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
