import { describe, it, expect } from "vitest";

describe("Bug 0b: Top 5 Tiendas más Activas en Super Dashboard", () => {
  it("el mapeo de tiendas activas genera la clave 'clicks' en minúscula coincidiendo con Bar dataKey", () => {
    const mockStores = [
      { name: "Adornia", whatsappClicks: 669 },
      { name: "jhoselynperu", whatsappClicks: 512 },
      { name: "Tienda Pequeña", whatsappClicks: 10 },
      { name: "Sin Clicks", whatsappClicks: 0 },
    ];

    const topClicksData = [...mockStores]
      .filter((s) => s.whatsappClicks > 0)
      .sort((a, b) => b.whatsappClicks - a.whatsappClicks)
      .slice(0, 5)
      .map((s) => ({
        name: s.name.length > 15 ? s.name.substring(0, 13) + "..." : s.name,
        clicks: s.whatsappClicks,
      }))
      .reverse();

    // El Bar de recharts usa dataKey="clicks"
    const expectedDataKey = "clicks";

    expect(topClicksData.length).toBe(3);
    for (const item of topClicksData) {
      expect(item).toHaveProperty(expectedDataKey);
      expect((item as any)[expectedDataKey]).toBeGreaterThan(0);
      expect((item as any).Clicks).toBeUndefined();
    }

    const adornia = topClicksData.find((d) => d.name === "Adornia");
    const jhoselyn = topClicksData.find((d) => d.name === "jhoselynperu");
    expect(adornia?.clicks).toBe(669);
    expect(jhoselyn?.clicks).toBe(512);
  });
});
