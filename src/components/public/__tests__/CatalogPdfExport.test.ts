import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import { urlToBase64 } from "../CatalogPdfExport";
import { supabase } from "@/lib/supabase";

// Mock Supabase storage
vi.mock("@/lib/supabase", () => {
  const mockDownload = vi.fn();
  return {
    supabase: {
      storage: {
        from: vi.fn(() => ({
          download: mockDownload,
        })),
      },
    },
  };
});

describe("CatalogPdfExport - urlToBase64 unit tests", () => {
  let createdCanvases: any[] = [];
  let canvasContext: any = null;
  let mockWidth = 100;
  let mockHeight = 100;
  let shouldImageFail = false;

  beforeAll(() => {
    // Mock global fetch
    globalThis.fetch = vi.fn();

    // Mock URL.createObjectURL/revokeObjectURL
    globalThis.URL.createObjectURL = vi.fn(() => "blob:mock-url");
    globalThis.URL.revokeObjectURL = vi.fn();

    // Mock Canvas and document
    globalThis.document = {
      createElement: vi.fn((tagName) => {
        if (tagName === "canvas") {
          canvasContext = {
            beginPath: vi.fn(),
            arc: vi.fn(),
            closePath: vi.fn(),
            clip: vi.fn(),
            fillStyle: "",
            fillRect: vi.fn(),
            drawImage: vi.fn(),
          };
          const canvas = {
            width: 0,
            height: 0,
            getContext: vi.fn(() => canvasContext),
            toDataURL: vi.fn((format) => `data:${format};base64,mockedData`),
          };
          createdCanvases.push(canvas);
          return canvas;
        }
        return {};
      }),
    } as any;

    // Mock Image
    globalThis.Image = class {
      onload: () => void = () => {};
      onerror: () => void = () => {};
      _src: string = "";
      width: number = mockWidth;
      height: number = mockHeight;
      crossOrigin: string = "";

      set src(value: string) {
        this._src = value;
        this.width = mockWidth;
        this.height = mockHeight;

        setTimeout(() => {
          if (shouldImageFail) {
            this.onerror();
          } else {
            this.onload();
          }
        }, 0);
      }

      get src() {
        return this._src;
      }
    } as any;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    createdCanvases = [];
    canvasContext = null;
    mockWidth = 100;
    mockHeight = 100;
    shouldImageFail = false;
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("debe descargar imagen de Supabase Storage si la URL pertenece a Supabase", async () => {
    const mockBlob = new Blob(["mock content"], { type: "image/jpeg" });
    const mockStorage = supabase.storage.from("images") as any;
    mockStorage.download.mockResolvedValueOnce({ data: mockBlob, error: null });

    const supabaseUrl = "https://example.supabase.co/storage/v1/object/public/images/products/shoe.jpg";
    const base64 = await urlToBase64(supabaseUrl);

    expect(supabase.storage.from).toHaveBeenCalledWith("images");
    expect(mockStorage.download).toHaveBeenCalledWith("products/shoe.jpg");
    expect(base64).toContain("data:image/jpeg;base64,mockedData");
  });

  it("debe descargar imagen mediante fetch normal para URLs externas", async () => {
    const mockBlob = new Blob(["mock external content"], { type: "image/jpeg" });
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      blob: async () => mockBlob,
    } as any);

    const externalUrl = "https://images.unsplash.com/photo-123456?w=600";
    const base64 = await urlToBase64(externalUrl);

    expect(mockFetch).toHaveBeenCalledWith(externalUrl, { mode: "cors" });
    expect(base64).toContain("data:image/jpeg;base64,mockedData");
  });

  it("debe hacer fallback a crossOrigin=anonymous si el fetch falla por CORS u otro error", async () => {
    const mockFetch = vi.mocked(globalThis.fetch);
    // Simular que el fetch lanza un TypeError (CORS block)
    mockFetch.mockRejectedValue(new TypeError("Failed to fetch"));

    const externalUrl = "https://images.unsplash.com/photo-123456?w=600";
    const base64 = await urlToBase64(externalUrl);

    // Se llamó a fetch
    expect(mockFetch).toHaveBeenCalled();
    // Y se generó el base64 usando la carga directa de imagen
    expect(base64).toContain("data:image/jpeg;base64,mockedData");
  });

  it("debe aplicar recorte circular y exportar a PNG si isCircle es true", async () => {
    const mockBlob = new Blob(["mock content"], { type: "image/png" });
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      blob: async () => mockBlob,
    } as any);

    const externalUrl = "https://images.unsplash.com/photo-123456?w=600";
    await urlToBase64(externalUrl, 1, 400, true);

    const canvas = createdCanvases[0];
    expect(canvas.toDataURL).toHaveBeenCalledWith("image/png");
    expect(canvasContext.clip).toHaveBeenCalled();
  });
});
