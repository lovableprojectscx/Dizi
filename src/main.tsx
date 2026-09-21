/**
 * @file main.tsx
 * @description Punto de entrada del cliente para la aplicación web Dizi (SPA/SSR hydration).
 * Se encarga de:
 * - Instanciar y proveer el enrutador TanStack Router (`RouterProvider`).
 * - Registrar el Service Worker (`/sw.js`) en navegadores compatibles para acelerar
 *   la carga y permitir el almacenamiento en caché nativo de imágenes en móviles.
 * - Montar el árbol de React en el elemento DOM raíz `#root`.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import "./styles.css";

const router = getRouter();

// Registrar Service Worker para caché nativo de imágenes en móviles
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("[SW] Registro de Service Worker falló:", err);
    });
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
