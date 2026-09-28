import { describe, it, expect } from "vitest";
import {
  COUNTRIES,
  DEFAULT_COUNTRY,
  getCountry,
  normalizePhone,
  validatePhone,
  toWhatsAppDigits,
  formatPhoneDisplay,
} from "../phone";

describe("Módulo de Telefonía y Países (phone.ts)", () => {
  it("debe tener a Perú (PE) como DEFAULT_COUNTRY y primer elemento de COUNTRIES", () => {
    expect(DEFAULT_COUNTRY).toBe("PE");
    expect(COUNTRIES[0].iso).toBe("PE");
    expect(COUNTRIES[0].dial).toBe("51");
  });

  it("debe tener exactamente los 21 países requeridos ordenados alfabéticamente después de Perú", () => {
    expect(COUNTRIES).toHaveLength(21);
    const rest = COUNTRIES.slice(1);
    const names = rest.map((c) => c.name);
    const sortedNames = [...names].sort((a, b) => a.localeCompare(b, "es"));
    expect(names).toEqual(sortedNames);
  });

  describe("Tabla mínima obligatoria de casos de validación", () => {
    // PE: 987654321 -> ok -> 51987654321
    it("PE: 987654321 debe ser válido con 51987654321", () => {
      const res = validatePhone("PE", "987654321");
      expect(res.ok).toBe(true);
      expect(res.e164Digits).toBe("51987654321");
    });

    // PE: +51 987 654 321 -> ok -> 51987654321
    it("PE: +51 987 654 321 debe ser válido con 51987654321", () => {
      const res = validatePhone("PE", "+51 987 654 321");
      expect(res.ok).toBe(true);
      expect(res.e164Digits).toBe("51987654321");
    });

    // PE: 51987654321 -> ok -> 51987654321
    it("PE: 51987654321 debe ser válido con 51987654321", () => {
      const res = validatePhone("PE", "51987654321");
      expect(res.ok).toBe(true);
      expect(res.e164Digits).toBe("51987654321");
    });

    // PE: 99964572 -> error incompleto
    it("PE: 99964572 (8 dígitos) debe retornar error incompleto", () => {
      const res = validatePhone("PE", "99964572");
      expect(res.ok).toBe(false);
      expect(res.reason).toBe("incompleto");
    });

    // PE: 014567890 (fijo Lima) -> error no_es_celular
    it("PE: 014567890 (fijo de Lima) debe retornar error no_es_celular", () => {
      const res = validatePhone("PE", "014567890");
      expect(res.ok).toBe(false);
      expect(res.reason).toBe("no_es_celular");
    });

    // EC: 0991234567 -> ok -> 593991234567
    it("EC: 0991234567 debe ser válido con 593991234567", () => {
      const res = validatePhone("EC", "0991234567");
      expect(res.ok).toBe(true);
      expect(res.e164Digits).toBe("593991234567");
    });

    // EC: 099727093 (caso real, falta un dígito) -> error incompleto
    it("EC: 099727093 (caso real, 8 dígitos nacionales) debe retornar error incompleto", () => {
      const res = validatePhone("EC", "099727093");
      expect(res.ok).toBe(false);
      expect(res.reason).toBe("incompleto");
    });

    // AR: 11 2345 6789 -> ok -> 5491123456789
    it("AR: 11 2345 6789 debe ser válido con 5491123456789", () => {
      const res = validatePhone("AR", "11 2345 6789");
      expect(res.ok).toBe(true);
      expect(res.e164Digits).toBe("5491123456789");
    });

    // AR: 011 15 2345 6789 -> ok -> 5491123456789
    it("AR: 011 15 2345 6789 debe ser válido con 5491123456789", () => {
      const res = validatePhone("AR", "011 15 2345 6789");
      expect(res.ok).toBe(true);
      expect(res.e164Digits).toBe("5491123456789");
    });

    // AR: 261468582 (caso real) -> error
    it("AR: 261468582 (caso real, número incompleto) debe fallar", () => {
      const res = validatePhone("AR", "261468582");
      expect(res.ok).toBe(false);
    });

    // MX: 55 1234 5678 -> ok -> 525512345678
    it("MX: 55 1234 5678 debe ser válido con 525512345678", () => {
      const res = validatePhone("MX", "55 1234 5678");
      expect(res.ok).toBe(true);
      expect(res.e164Digits).toBe("525512345678");
    });

    // CO: 301 234 5678 -> ok -> 573012345678
    it("CO: 301 234 5678 debe ser válido con 573012345678", () => {
      const res = validatePhone("CO", "301 234 5678");
      expect(res.ok).toBe(true);
      expect(res.e164Digits).toBe("573012345678");
    });

    // CL: 9 6123 4567 -> ok -> 56961234567
    it("CL: 9 6123 4567 debe ser válido con 56961234567", () => {
      const res = validatePhone("CL", "9 6123 4567");
      expect(res.ok).toBe(true);
      expect(res.e164Digits).toBe("56961234567");
    });

    // BO: 71234567 -> ok -> 59171234567
    it("BO: 71234567 debe ser válido con 59171234567", () => {
      const res = validatePhone("BO", "71234567");
      expect(res.ok).toBe(true);
      expect(res.e164Digits).toBe("59171234567");
    });
  });

  describe("Validación de ejemplos de todos los países en COUNTRIES", () => {
    it.each(COUNTRIES)("el example de $name ($iso) debe ser válido (ok)", (country) => {
      const res = validatePhone(country.iso, country.example);
      expect(res.ok).toBe(true);
      expect(res.e164Digits).toBeDefined();
    });
  });

  describe("Formateo visual con formatPhoneDisplay", () => {
    it("debe formatear números guardados en texto internacional legible", () => {
      expect(formatPhoneDisplay("51987654321")).toBe("+51 987 654 321");
      expect(formatPhoneDisplay("593991234567")).toBe("+593 99 123 4567");
      expect(formatPhoneDisplay("5491123456789")).toBe("+54 9 11 2345 6789");
      expect(formatPhoneDisplay("525512345678")).toBe("+52 55 1234 5678");
      expect(formatPhoneDisplay("56961234567")).toBe("+56 9 6123 4567");
      expect(formatPhoneDisplay("59171234567")).toBe("+591 71234567");
    });

    it("debe manejar números vacíos o nulos sin lanzar errores", () => {
      expect(formatPhoneDisplay("")).toBe("");
    });
  });

  describe("Construcción de dígitos para wa.me con toWhatsAppDigits", () => {
    it("debe generar dígitos limpios para WhatsApp", () => {
      expect(toWhatsAppDigits("PE", "987 654 321")).toBe("51987654321");
      expect(toWhatsAppDigits("AR", "011 15 2345 6789")).toBe("5491123456789");
      expect(toWhatsAppDigits("EC", "099 123 4567")).toBe("593991234567");
    });
  });
});
