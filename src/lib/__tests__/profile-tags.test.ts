import fs from "node:fs";
import path from "node:path";
import { describe, it, expect, vi, beforeEach } from "vitest";

const { updateMock, eqMock, selectAfterUpdateMock } = vi.hoisted(() => {
  const eqMock = vi.fn().mockResolvedValue({ error: null });
  const updateMock = vi.fn<(payload: Record<string, unknown>) => { eq: typeof eqMock }>(() => ({
    eq: eqMock,
  }));
  const selectAfterUpdateMock = vi.fn();
  return { updateMock, eqMock, selectAfterUpdateMock };
});

vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    from: vi.fn((table: string) => {
      if (table === "stores") {
        return {
          update: updateMock,
          select: selectAfterUpdateMock,
        };
      }
      return {
        update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
        select: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ data: [], error: null }) })),
      };
    }),
  },
  invokeRpcWithRetry: vi.fn().mockResolvedValue({ data: null, error: null }),
}));

import {
  PROFILE_TAG_CUSTOM_ICONS,
  PROFILE_TAG_MAX_COUNT,
  PROFILE_TAG_MAX_VALUE_LENGTH,
  PROFILE_TAG_PRESETS,
  formatProfileTagLabel,
  getProfileTagPreset,
  resolveProfileTags,
} from "../profile-tags";
import { mapStoreFromDB, useApp } from "../store";

describe("F50.1 - Catálogo extensible y configurable de etiquetas Perfil (profile-tags.ts)", () => {
  beforeEach(() => {
    updateMock.mockClear();
    eqMock.mockClear();
  });

  it("Todos los presets oficiales soportan texto opcional configurable y existen 8 íconos para tags propios", () => {
    expect(PROFILE_TAG_PRESETS.map((p) => p.id)).toEqual([
      "delivery",
      "recojo",
      "envios_provincia",
      "yape",
      "plin",
      "tarjeta",
      "contraentrega",
      "horario",
    ]);
    expect(PROFILE_TAG_PRESETS.every((p) => p.supportsCustomValue)).toBe(true);
    expect(PROFILE_TAG_CUSTOM_ICONS).toHaveLength(8);
    expect(getProfileTagPreset("delivery")?.customPlaceholder).toContain("Delivery");
  });

  it("resolveProfileTags tolera null/inválidos, preserva texto configurable en cualquier preset y limpia valores vacíos", () => {
    expect(resolveProfileTags(undefined)).toEqual([]);
    expect(resolveProfileTags(null)).toEqual([]);
    expect(resolveProfileTags("delivery")).toEqual([]);
    expect(
      resolveProfileTags([
        null,
        { id: "desconocido" },
        { id: "delivery", value: "  Delivery gratis > S/ 99  " },
        "plin",
        { id: "delivery", value: "Otro duplicado" },
        { id: "yape", value: "Yape" }, // igual al nombre por defecto -> se normaliza limpio sin value redundante
        { id: "horario", value: "   Lun-Sáb 9am-7pm   " },
      ])
    ).toEqual([
      { id: "delivery", value: "Delivery gratis > S/ 99" },
      { id: "plin" },
      { id: "yape" },
      { id: "horario", value: "Lun-Sáb 9am-7pm" },
    ]);
  });

  it("resolveProfileTags soporta múltiples tags custom con ícono válido, omite vacíos y respeta tope de 6 y 40 chars", () => {
    const longSchedule = "Lunes a Sábado de 9:00am hasta las 10:00pm en tienda central";
    const resolved = resolveProfileTags([
      { id: "custom", value: "   " }, // vacío: se omite
      { id: "custom", value: "Venta por mayor", icon: "package" },
      { id: "custom", value: "venta por mayor", icon: "tag" }, // duplicado case-insensitive
      { id: "custom", value: "Garantía 1 año", icon: "invalido" }, // cae a "tag"
      { id: "delivery", value: longSchedule },
      { id: "recojo" },
      { id: "yape" },
      { id: "plin" },
      { id: "tarjeta" }, // 7mo elemento: excede PROFILE_TAG_MAX_COUNT (6)
    ]);

    expect(resolved).toHaveLength(PROFILE_TAG_MAX_COUNT);
    expect(resolved[0]).toEqual({ id: "custom", value: "Venta por mayor", icon: "package" });
    expect(resolved[1]).toEqual({ id: "custom", value: "Garantía 1 año", icon: "tag" });
    expect(resolved[2]?.id).toBe("delivery");
    expect(resolved[2]?.value?.length).toBeLessThanOrEqual(PROFILE_TAG_MAX_VALUE_LENGTH);
    expect(resolved.map((t) => t.id)).not.toContain("tarjeta");
  });

  it("formatProfileTagLabel muestra texto personalizado cuando existe o etiqueta base por defecto", () => {
    expect(formatProfileTagLabel({ id: "delivery" })).toBe("Delivery");
    expect(formatProfileTagLabel({ id: "delivery", value: "Delivery 24h" })).toBe("Delivery 24h");
    expect(formatProfileTagLabel({ id: "plin", value: "Plin / Yape" })).toBe("Plin / Yape");
    expect(formatProfileTagLabel({ id: "horario" })).toBe("Horario de atención");
    expect(formatProfileTagLabel({ id: "custom", value: "Facturación electrónica", icon: "check" })).toBe(
      "Facturación electrónica"
    );
  });

  it("Escenario 13 (unidad): mapStoreFromDB tolera columna profile_tags ausente y mapea presets + tags custom", () => {
    const sinColumna = mapStoreFromDB({
      id: "s-1",
      slug: "tienda-sin-col",
      name: "Sin Columna",
      phone: "51999999999",
    });
    expect(sinColumna.profileTags).toEqual([]);

    const conEtiquetas = mapStoreFromDB({
      id: "s-2",
      slug: "tienda-con-tags",
      name: "Con Tags",
      phone: "51999999999",
      profile_tags: [
        { id: "delivery", value: "Delivery gratis hoy" },
        { id: "yape" },
        { id: "custom", value: "Venta por mayor", icon: "package" },
      ],
    });
    expect(conEtiquetas.profileTags).toEqual([
      { id: "delivery", value: "Delivery gratis hoy" },
      { id: "yape" },
      { id: "custom", value: "Venta por mayor", icon: "package" },
    ]);
  });

  it("Escenario 13 (unidad): updateStore serializa profileTags configurables hacia dbPatch.profile_tags", async () => {
    const initialStore = mapStoreFromDB({
      id: "s-update-1",
      slug: "tienda-update",
      name: "Tienda Update",
      phone: "51999999999",
      model: "perfil",
    });
    useApp.setState({ stores: [initialStore] });

    await useApp.getState().updateStore("s-update-1", {
      profileTags: [
        { id: "recojo", value: "Recojo Tda 242" },
        { id: "custom", value: "Envíos Shalom", icon: "sparkles" },
      ],
    });

    expect(updateMock).toHaveBeenCalledTimes(1);
    const payload = updateMock.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload.profile_tags).toEqual([
      { id: "recojo", value: "Recojo Tda 242" },
      { id: "custom", value: "Envíos Shalom", icon: "sparkles" },
    ]);
  });

  it("Migración SQL 20261112210000_f50_1_profile_tags.sql agrega stores.profile_tags y preserva order_link_enabled y header_style", () => {
    const migrationsDir = path.resolve(process.cwd(), "supabase", "migrations");
    const targetMigration = path.join(migrationsDir, "20261112210000_f50_1_profile_tags.sql");
    const staleMigration = path.join(migrationsDir, "20261112150000_f50_1_profile_tags.sql");

    expect(fs.existsSync(targetMigration)).toBe(true);
    expect(fs.existsSync(staleMigration)).toBe(false);

    const sql = fs.readFileSync(targetMigration, "utf8");
    const nonCommentLines = sql
      .split(/\r?\n/)
      .filter((line) => !line.trimStart().startsWith("--"))
      .join("\n");

    expect(nonCommentLines).toContain("ADD COLUMN IF NOT EXISTS profile_tags jsonb NOT NULL DEFAULT '[]'::jsonb");
    expect(nonCommentLines).toContain("CREATE OR REPLACE FUNCTION public.get_public_store");
    expect(nonCommentLines).toContain("SECURITY DEFINER");
    expect(nonCommentLines).toContain("SET search_path TO 'public', 'pg_temp'");
    expect(nonCommentLines).toContain("'profile_tags', COALESCE(store_row.profile_tags, '[]'::jsonb)");
    expect(nonCommentLines).toContain("'header_style', COALESCE(store_row.header_style, 'standard')");
    expect(nonCommentLines).toContain(
      "'order_link_enabled', CASE WHEN store_plan IN ('pro', 'ilimitado') THEN COALESCE(store_row.order_link_enabled, false) ELSE false END"
    );
    expect(nonCommentLines).not.toMatch(/DROP\s+FUNCTION/i);
  });
});
