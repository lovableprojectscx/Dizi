import { describe, it, expect, vi, beforeEach } from "vitest";

const { updateMock, eqMock, selectAfterUpdateMock } = vi.hoisted(() => {
  const eqMock = vi.fn().mockResolvedValue({ error: null });
  const updateMock = vi.fn(() => ({ eq: eqMock }));
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
  PROFILE_TAG_MAX_VALUE_LENGTH,
  PROFILE_TAG_PRESETS,
  formatProfileTagLabel,
  getProfileTagPreset,
  resolveProfileTags,
} from "../profile-tags";
import { mapStoreFromDB, useApp } from "../store";

describe("F50.1 - Catálogo extensible de etiquetas Perfil (profile-tags.ts)", () => {
  beforeEach(() => {
    updateMock.mockClear();
    eqMock.mockClear();
  });

  it("Expone los 8 presets oficiales aprobados y horario soporta texto corto opcional", () => {
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
    expect(getProfileTagPreset("horario")?.supportsCustomValue).toBe(true);
    expect(getProfileTagPreset("delivery")?.supportsCustomValue).toBeFalsy();
  });

  it("resolveProfileTags tolera null, undefined, valores inválidos y tipos desconocidos", () => {
    expect(resolveProfileTags(undefined)).toEqual([]);
    expect(resolveProfileTags(null)).toEqual([]);
    expect(resolveProfileTags("delivery")).toEqual([]);
    expect(
      resolveProfileTags([
        null,
        { id: "desconocido" },
        { id: "delivery" },
        "plin",
        { id: "delivery" }, // duplicado
        { id: "horario", value: "   Lun-Sáb 9am-7pm   " },
      ])
    ).toEqual([
      { id: "delivery" },
      { id: "plin" },
      { id: "horario", value: "Lun-Sáb 9am-7pm" },
    ]);
  });

  it("resolveProfileTags trunca valores de horario al máximo de 40 caracteres e ignora texto en presets sin campo", () => {
    const longSchedule = "Lunes a Sábado de 9:00am hasta las 10:00pm en tienda central";
    const resolved = resolveProfileTags([
      { id: "delivery", value: "Gratis hoy" },
      { id: "horario", value: longSchedule },
    ]);

    expect(resolved[0]).toEqual({ id: "delivery" });
    expect(resolved[1]?.id).toBe("horario");
    expect(resolved[1]?.value?.length).toBeLessThanOrEqual(PROFILE_TAG_MAX_VALUE_LENGTH);
  });

  it("formatProfileTagLabel usa etiqueta por defecto si no hay value o el texto custom en horario", () => {
    expect(formatProfileTagLabel({ id: "delivery" })).toBe("Delivery");
    expect(formatProfileTagLabel({ id: "plin" })).toBe("Plin");
    expect(formatProfileTagLabel({ id: "horario" })).toBe("Horario de atención");
    expect(formatProfileTagLabel({ id: "horario", value: "Lun-Sáb 9am-7pm" })).toBe("Lun-Sáb 9am-7pm");
  });

  it("Escenario 13 (unidad): mapStoreFromDB tolera columna profile_tags ausente y mapea etiquetas válidas", () => {
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
        { id: "delivery" },
        { id: "yape" },
        { id: "horario", value: "9am - 8pm" },
      ],
    });
    expect(conEtiquetas.profileTags).toEqual([
      { id: "delivery" },
      { id: "yape" },
      { id: "horario", value: "9am - 8pm" },
    ]);
  });

  it("Escenario 13 (unidad): updateStore serializa profileTags hacia dbPatch.profile_tags", async () => {
    const initialStore = mapStoreFromDB({
      id: "s-update-1",
      slug: "tienda-update",
      name: "Tienda Update",
      phone: "51999999999",
      model: "perfil",
    });
    useApp.setState({ stores: [initialStore] });

    await useApp.getState().updateStore("s-update-1", {
      profileTags: [{ id: "recojo" }, { id: "plin" }],
    });

    expect(updateMock).toHaveBeenCalledTimes(1);
    const payload = updateMock.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload.profile_tags).toEqual([{ id: "recojo" }, { id: "plin" }]);
    expect(useApp.getState().stores[0]?.profileTags).toEqual([
      { id: "recojo" },
      { id: "plin" },
    ]);
  });
});
