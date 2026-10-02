/**
 * @file fresh-data-and-logo.test.ts
 * @description Pruebas unitarias para Fase 3D:
 * 1. Formateador de tiempo transcurrido en Super Admin (formatLastFetched)
 * 2. Extracción de rutas en Storage (extractStoragePath)
 * 3. Identificación de rutas activas (getActiveReferencedPaths)
 * 4. Protección contra borrado de fotos compartidas (filterSafeFilesToDelete)
 *    Ejemplo: cuando `bioLogo` se sincroniza con `store.logo` o `bioBanner` con `bannerImage`
 */

import { describe, it, expect } from "vitest";
import { formatLastFetched } from "@/components/super/SuperRefreshButton";
import {
  extractStoragePath,
  getActiveReferencedPaths,
  filterSafeFilesToDelete,
} from "@/lib/store";

describe("Fase 3D - Datos Frescos y Actualización de Logos", () => {
  describe("formatLastFetched", () => {
    it("devuelve 'Sin actualizar' si el timestamp es null o 0", () => {
      expect(formatLastFetched(null)).toBe("Sin actualizar");
      expect(formatLastFetched(0)).toBe("Sin actualizar");
    });

    it("devuelve 'hace un momento' si pasaron menos de 60 segundos", () => {
      const now = Date.now();
      expect(formatLastFetched(now - 10 * 1000)).toBe("hace un momento");
      expect(formatLastFetched(now - 59 * 1000)).toBe("hace un momento");
    });

    it("devuelve 'hace 1 min' si pasó entre 60 y 119 segundos", () => {
      const now = Date.now();
      expect(formatLastFetched(now - 60 * 1000)).toBe("hace 1 min");
      expect(formatLastFetched(now - 110 * 1000)).toBe("hace 1 min");
    });

    it("devuelve 'hace X min' para minutos menores a 60", () => {
      const now = Date.now();
      expect(formatLastFetched(now - 5 * 60 * 1000)).toBe("hace 5 min");
      expect(formatLastFetched(now - 45 * 60 * 1000)).toBe("hace 45 min");
    });

    it("devuelve 'hace 1 h' y 'hace X h' para horas", () => {
      const now = Date.now();
      expect(formatLastFetched(now - 65 * 60 * 1000)).toBe("hace 1 h");
      expect(formatLastFetched(now - 180 * 60 * 1000)).toBe("hace 3 h");
    });
  });

  describe("Extracción de Storage Path", () => {
    it("extrae la ruta relativa correcta de una imagen en Supabase Storage propia de la tienda", () => {
      const url = "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/s_audit123/logo_1790870000.webp?t=123";
      expect(extractStoragePath(url, "s_audit123")).toBe("s_audit123/logo_1790870000.webp");
    });

    it("bloquea y no extrae si la imagen pertenece a otra tienda", () => {
      const url = "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/s_otra_tienda/logo_1790870000.webp";
      expect(extractStoragePath(url, "s_audit123")).toBeNull();
    });

    it("bloquea y no extrae imágenes externas (Unsplash, relativas o locales)", () => {
      expect(extractStoragePath("https://images.unsplash.com/photo-1542291026", "s_audit123")).toBeNull();
      expect(extractStoragePath("/images/sin-foto.svg", "s_audit123")).toBeNull();
      expect(extractStoragePath("", "s_audit123")).toBeNull();
      expect(extractStoragePath(null, "s_audit123")).toBeNull();
    });
  });

  describe("Protección de fotos en uso y sincronizadas (filterSafeFilesToDelete)", () => {
    const storeId = "s_tienda1";
    const sharedLogoUrl = "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/s_tienda1/logo_100.webp";
    const sharedBannerUrl = "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/s_tienda1/banner_main.webp";

    it("caso Jack: NO borra logo_100 si bioLogo cambia pero store.logo sigue apuntando a él", () => {
      // Estado de la tienda tras cambiar el bioLogo:
      // store.logo mantiene el logo original compartido
      // store.bioLogo tiene el nuevo logo
      const storeAfterPatch = {
        logo: sharedLogoUrl,
        bioLogo: "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/s_tienda1/bio_logo_200.webp",
      };

      // filesToDelete intentaría borrar 's_tienda1/logo_100.webp' porque bioLogo fue reemplazado
      const filesToDelete = ["s_tienda1/logo_100.webp"];

      const safeToDelete = filterSafeFilesToDelete(filesToDelete, storeAfterPatch, storeId);

      // Debe estar vacío: la foto sigue en uso por store.logo en el catálogo
      expect(safeToDelete).toEqual([]);
    });

    it("caso inverso: NO borra bioLogo si store.logo cambia pero bioLogo sigue apuntando a él", () => {
      const storeAfterPatch = {
        logo: "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/s_tienda1/logo_300.webp",
        bioLogo: sharedLogoUrl,
      };

      const filesToDelete = ["s_tienda1/logo_100.webp"];
      const safeToDelete = filterSafeFilesToDelete(filesToDelete, storeAfterPatch, storeId);

      expect(safeToDelete).toEqual([]);
    });

    it("caso banner compartido con bioBanner: NO borra la foto si bannerImage la sigue usando", () => {
      const storeAfterPatch = {
        bannerImage: sharedBannerUrl,
        bioBanner: "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/s_tienda1/bio_banner_new.webp",
      };

      const filesToDelete = ["s_tienda1/banner_main.webp"];
      const safeToDelete = filterSafeFilesToDelete(filesToDelete, storeAfterPatch, storeId);

      expect(safeToDelete).toEqual([]);
    });

    it("caso múltiple banner: respeta banners concatenados con '|||'", () => {
      const banner2Url = "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/s_tienda1/banner_2.webp";
      const storeAfterPatch = {
        bannerImage: `${sharedBannerUrl} ||| ${banner2Url}`,
        bioBanner: "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/s_tienda1/bio_banner_new.webp",
      };

      const filesToDelete = ["s_tienda1/banner_2.webp"];
      const safeToDelete = filterSafeFilesToDelete(filesToDelete, storeAfterPatch, storeId);

      expect(safeToDelete).toEqual([]);
    });

    it("SÍ borra la foto previa cuando ya ningún campo de la tienda la referencia", () => {
      const storeAfterPatch = {
        logo: "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/s_tienda1/logo_nuevo.webp",
        bioLogo: "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/s_tienda1/bio_nuevo.webp",
      };

      const filesToDelete = ["s_tienda1/logo_100.webp"];
      const safeToDelete = filterSafeFilesToDelete(filesToDelete, storeAfterPatch, storeId);

      // Ahora sí se borra con seguridad
      expect(safeToDelete).toEqual(["s_tienda1/logo_100.webp"]);
    });
  });
});
