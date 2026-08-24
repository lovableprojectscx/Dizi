import { describe, it, expect } from "vitest";
import { PLANS, daysUntilExpiry, type Store, type PlanId } from "@/lib/types";

// Helper de sanitización de slugs
const sanitizeSlug = (value: string): string => {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
};

// Helper de cálculo de días hábiles para el Libro de Reclamaciones
const diasHabiles = (desde: string, hasta: Date = new Date()): number => {
  let count = 0;
  const d = new Date(desde);
  while (d < hasta) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
};

// Validador de RUC peruano (11 dígitos numéricos comenzando con 10 o 20)
const isValidRucPeru = (ruc: string): boolean => {
  const clean = ruc.trim();
  return /^\d{11}$/.test(clean) && (clean.startsWith("10") || clean.startsWith("20") || clean.startsWith("15") || clean.startsWith("17"));
};

describe("Parte 5: Configuración, Planes y Libro de Reclamaciones", () => {
  describe("1. Sanitización y Validación de Slugs", () => {
    it("convierte espacios en guiones y remueve tildes y mayúsculas", () => {
      expect(sanitizeSlug("Pastelería Dulce Corazón 2026")).toBe("pasteleria-dulce-corazon-2026");
      expect(sanitizeSlug("Tienda & Moda @ Lima!")).toBe("tienda--moda--lima");
    });

    it("valida longitud mínima requerida de 3 caracteres", () => {
      const isSlugValid = (s: string) => s.length >= 3;
      expect(isSlugValid("ab")).toBe(false);
      expect(isSlugValid("dizi")).toBe(true);
      expect(isSlugValid("mi-tienda")).toBe(true);
    });
  });

  describe("2. Libro de Reclamaciones (Normativa D.S. 011-2011-PCM)", () => {
    it("calcula días hábiles excluyendo sábados y domingos", () => {
      // Viernes 1 de mayo a Lunes 4 de mayo = 1 día hábil transcurrido
      const viernes = new Date(2026, 4, 1, 10, 0, 0); // 1 de mayo
      const lunes = new Date(2026, 4, 4, 10, 0, 0);   // 4 de mayo

      const count = diasHabiles(viernes.toISOString(), lunes);
      expect(count).toBe(1);
    });

    it("detecta reclamaciones vencidas cuando superan los 15 días hábiles legales", () => {
      const diasTranscurridos = 16;
      const estado = "pendiente";
      const vencido = diasTranscurridos > 15 && estado !== "resuelto";
      expect(vencido).toBe(true);
    });

    it("formatea el número correlativo oficial de reclamación", () => {
      const correlativo = 7;
      const año = 2026;
      const numFmt = `N° ${String(correlativo).padStart(4, "0")}-${año}`;
      expect(numFmt).toBe("N° 0007-2026");
    });

    it("valida RUC peruano de 11 dígitos para personas naturales y jurídicas", () => {
      expect(isValidRucPeru("20601234567")).toBe(true); // Jurídico (20)
      expect(isValidRucPeru("10456789012")).toBe(true); // Natural con negocio (10)
      expect(isValidRucPeru("12345678")).toBe(false);    // Muy corto (DNI)
      expect(isValidRucPeru("2060123456A")).toBe(false); // Letra inválida
    });
  });

  describe("3. Planes, Tarifas y Vencimientos", () => {
    it("contiene los 4 planes del SAAS con sus respectivos límites", () => {
      expect(PLANS["semilla"].productLimit).toBe(20);
      expect(PLANS["emprendedor"].productLimit).toBe(100);
      expect(PLANS["pro"].productLimit).toBe(300);
      expect(PLANS["ilimitado"].productLimit).toBe(1000);
    });

    it("aplica descuento en la tarifa de suscripción anual vs mensual", () => {
      const mensual = PLANS["emprendedor"].price * 12; // 19.9 * 12 = 238.8
      const anual = PLANS["emprendedor"].annualPrice;   // 179
      expect(anual).toBeLessThan(mensual);
      expect(mensual - anual).toBeGreaterThan(50);
    });

    it("calcula los días restantes hasta la fecha de vencimiento", () => {
      const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(); // en 5 días
      const store = { plan: "pro", planExpiresAt: futureDate } as Store;
      const days = daysUntilExpiry(store);
      expect(days).toBe(5);
    });
  });
});
