import { describe, it, expect, vi } from "vitest";
import handler, { isFacebookHost } from "../../../api/scrape-fb";

describe("D6.4: Blindaje SSRF en api/scrape-fb.ts", () => {
  describe("isFacebookHost", () => {
    it("debe aceptar dominios oficiales de Facebook", () => {
      expect(isFacebookHost("facebook.com")).toBe(true);
      expect(isFacebookHost("www.facebook.com")).toBe(true);
      expect(isFacebookHost("m.facebook.com")).toBe(true);
      expect(isFacebookHost("web.facebook.com")).toBe(true);
      expect(isFacebookHost("fb.com")).toBe(true);
      expect(isFacebookHost("www.fb.com")).toBe(true);
      expect(isFacebookHost("FACEBOOK.COM")).toBe(true);
    });

    it("debe rechazar ataques SSRF con subdominios falsos o dominios parecidos", () => {
      expect(isFacebookHost("facebook.com.attacker.com")).toBe(false);
      expect(isFacebookHost("facebook.com.otro.net")).toBe(false);
      expect(isFacebookHost("evil-facebook.com")).toBe(false);
      expect(isFacebookHost("notfacebook.com")).toBe(false);
      expect(isFacebookHost("fb.com.co")).toBe(false);
      expect(isFacebookHost("google.com")).toBe(false);
      expect(isFacebookHost("localhost")).toBe(false);
      expect(isFacebookHost("127.0.0.1")).toBe(false);
    });
  });

  describe("handler", () => {
    function createMockRes() {
      const res: any = {
        statusCode: 200,
        headers: {},
        jsonData: null,
        setHeader: vi.fn((k, v) => {
          res.headers[k] = v;
        }),
        status: vi.fn((code) => {
          res.statusCode = code;
          return res;
        }),
        json: vi.fn((data) => {
          res.jsonData = data;
          return res;
        }),
        end: vi.fn(),
      };
      return res;
    }

    it("rechaza si falta la URL", async () => {
      const req = { method: "GET", query: {} };
      const res = createMockRes();
      await handler(req, res);
      expect(res.statusCode).toBe(400);
      expect(res.jsonData.error).toContain("Falta la URL");
    });

    it("rechaza url maliciosa facebook.com.attacker.com con 400", async () => {
      const req = {
        method: "GET",
        query: { url: "https://facebook.com.attacker.com/malicious-page" },
      };
      const res = createMockRes();
      await handler(req, res);
      expect(res.statusCode).toBe(400);
      expect(res.jsonData.error).toContain("debe ser de una página de Facebook válida");
    });

    it("rechaza url de localhost o interna con 400", async () => {
      const req = {
        method: "GET",
        query: { url: "http://127.0.0.1:8000/secret" },
      };
      const res = createMockRes();
      await handler(req, res);
      expect(res.statusCode).toBe(400);
      expect(res.jsonData.error).toContain("debe ser de una página de Facebook válida");
    });
  });
});
