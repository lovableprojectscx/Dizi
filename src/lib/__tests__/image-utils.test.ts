import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import {
  IMAGE_PRESETS,
  convertImageToWebP,
  convertImageUrlToWebP,
  createThumbnailFromBase64,
  createThumbnailWebP,
  getOptimizedImageUrl,
  getThumbnailUrl,
} from "../image-utils";

describe("Pruebas unitarias de image-utils.ts con IMAGE_PRESETS", () => {
  let createdCanvases: any[] = [];
  let canvasContext: any = null;

  // Variables globales del mock para configurar las propiedades de la imagen
  let mockWidth = 1000;
  let mockHeight = 800;
  let shouldFail = false;

  beforeAll(() => {
    // Mock de URL.createObjectURL y URL.revokeObjectURL
    globalThis.URL.createObjectURL = vi.fn(() => "blob:mock-url");
    globalThis.URL.revokeObjectURL = vi.fn();

    // Mock del constructor de Image
    globalThis.Image = class {
      onload: () => void = () => {};
      onerror: () => void = () => {};
      _src: string = "";
      width: number = 100;
      height: number = 100;
      crossOrigin: string = "";

      set src(value: string) {
        this._src = value;
        // Asignamos las dimensiones deseadas para el test en curso
        this.width = mockWidth;
        this.height = mockHeight;

        // Simulamos la carga asíncrona de la imagen
        setTimeout(() => {
          if (shouldFail) {
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

    // Mock de document.createElement para simular Canvas
    globalThis.document = {
      createElement: vi.fn((tagName) => {
        if (tagName === "canvas") {
          canvasContext = {
            imageSmoothingEnabled: false,
            imageSmoothingQuality: "",
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
  });

  beforeEach(() => {
    mockWidth = 1000;
    mockHeight = 800;
    shouldFail = false;
    createdCanvases = [];
    canvasContext = null;
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("debe exportar la configuración correcta de IMAGE_PRESETS", () => {
    expect(IMAGE_PRESETS.product).toEqual({ maxDimension: 1600, quality: 0.80 });
    expect(IMAGE_PRESETS.thumb).toEqual({ maxDimension: 600, quality: 0.78 });
    expect(IMAGE_PRESETS.banner).toEqual({ maxDimension: 1920, quality: 0.80 });
    expect(IMAGE_PRESETS.logo).toEqual({ maxDimension: 512, quality: 0.90 });
  });

  it("debe redimensionar la imagen proporcionalmente con preset 'product' (máx 1600)", async () => {
    mockWidth = 3200;
    mockHeight = 2000;
    const file = new File([""], "product.png", { type: "image/png" });
    await convertImageToWebP(file, "product");

    const drawingCanvas = createdCanvases.find((c) => c.width > 0);
    expect(drawingCanvas).toBeDefined();
    expect(drawingCanvas.width).toBe(1600);
    expect(drawingCanvas.height).toBe(1000);
  });

  it("debe redimensionar la imagen proporcionalmente con preset 'banner' (máx 1920)", async () => {
    mockWidth = 3840;
    mockHeight = 1200;
    const file = new File([""], "banner.png", { type: "image/png" });
    await convertImageToWebP(file, "banner");

    const drawingCanvas = createdCanvases.find((c) => c.width > 0);
    expect(drawingCanvas).toBeDefined();
    expect(drawingCanvas.width).toBe(1920);
    expect(drawingCanvas.height).toBe(600);
  });

  it("debe redimensionar la imagen proporcionalmente con preset 'logo' (máx 512)", async () => {
    mockWidth = 1024;
    mockHeight = 1024;
    const file = new File([""], "logo.png", { type: "image/png" });
    await convertImageToWebP(file, "logo");

    const drawingCanvas = createdCanvases.find((c) => c.width > 0);
    expect(drawingCanvas).toBeDefined();
    expect(drawingCanvas.width).toBe(512);
    expect(drawingCanvas.height).toBe(512);
  });

  it("debe redimensionar la imagen proporcionalmente con preset 'thumb' (máx 600)", async () => {
    mockWidth = 1200;
    mockHeight = 800;
    const file = new File([""], "thumb.png", { type: "image/png" });
    await convertImageToWebP(file, "thumb");

    const drawingCanvas = createdCanvases.find((c) => c.width > 0);
    expect(drawingCanvas).toBeDefined();
    expect(drawingCanvas.width).toBe(600);
    expect(drawingCanvas.height).toBe(400);
  });

  it("nunca debe agrandar si la foto es más chica que el límite de dimensión", async () => {
    mockWidth = 400;
    mockHeight = 300;
    const file = new File([""], "small.png", { type: "image/png" });
    await convertImageToWebP(file, "product"); // límite 1600

    const drawingCanvas = createdCanvases.find((c) => c.width > 0);
    expect(drawingCanvas).toBeDefined();
    expect(drawingCanvas.width).toBe(400);
    expect(drawingCanvas.height).toBe(300);
  });

  it("debe crear miniatura WebP de 600px a partir del File original con createThumbnailWebP", async () => {
    mockWidth = 2400;
    mockHeight = 1600;
    const file = new File([""], "photo.png", { type: "image/png" });
    const result = await createThumbnailWebP(file);
    expect(result).toContain("data:image/webp;base64,mockedData");
    const drawingCanvas = createdCanvases.find((c) => c.width > 0);
    expect(drawingCanvas.width).toBe(600);
    expect(drawingCanvas.height).toBe(400);
  });

  it("debe crear miniatura WebP de 600px a partir de base64 Data URL con createThumbnailFromBase64", async () => {
    mockWidth = 1200;
    mockHeight = 600;
    const base64 = "data:image/webp;base64,mockDataUrlOriginal";
    const result = await createThumbnailFromBase64(base64);
    expect(result).toContain("data:image/webp;base64,mockedData");
    const drawingCanvas = createdCanvases.find((c) => c.width > 0);
    expect(drawingCanvas.width).toBe(600);
    expect(drawingCanvas.height).toBe(300);
  });

  it("debe conservar el tamaño en createThumbnailFromBase64 si la imagen es menor a 600px (no agrandar)", async () => {
    mockWidth = 350;
    mockHeight = 250;
    const base64 = "data:image/webp;base64,smallThumb";
    await createThumbnailFromBase64(base64);
    const drawingCanvas = createdCanvases.find((c) => c.width > 0);
    expect(drawingCanvas.width).toBe(350);
    expect(drawingCanvas.height).toBe(250);
  });

  it("debe fallar si la imagen no se puede cargar", async () => {
    shouldFail = true;
    const file = new File([""], "bad.png", { type: "image/png" });
    const promise = convertImageToWebP(file);
    await expect(promise).rejects.toThrow("No se pudo leer la imagen");
  });

  it("debe retornar inmediatamente la URL si ya es una data URL en convertImageUrlToWebP", async () => {
    const dataUrl = "data:image/png;base64,alreadyConverted";
    const result = await convertImageUrlToWebP(dataUrl);
    expect(result).toBe(dataUrl);
  });

  it("debe descargar y convertir una URL externa a WebP usando preset", async () => {
    mockWidth = 2000;
    mockHeight = 1000;
    shouldFail = false;

    const result = await convertImageUrlToWebP("https://example.com/image.jpg", "product");
    expect(result).toContain("data:image/webp;base64,mockedData");
    const drawingCanvas = createdCanvases.find((c) => c.width > 0);
    expect(drawingCanvas.width).toBe(1600);
    expect(drawingCanvas.height).toBe(800);
  });

  describe("getOptimizedImageUrl", () => {
    it("debe retornar string vacío si la URL es nula o vacía", () => {
      expect(getOptimizedImageUrl(null)).toBe("");
      expect(getOptimizedImageUrl("")).toBe("");
    });

    it("debe devolver la URL limpia directamente sin modificar para evitar fallos de carga", () => {
      const dataUrl = "data:image/png;base64,abc123";
      const blobUrl = "blob:http://localhost/123";
      const supabaseUrl = "https://wxpizbnuuaiculzfuhof.supabase.co/storage/v1/object/public/images/test.webp";

      expect(getOptimizedImageUrl(dataUrl, 400)).toBe(dataUrl);
      expect(getOptimizedImageUrl(blobUrl, 1600)).toBe(blobUrl);
      expect(getOptimizedImageUrl(supabaseUrl, 600)).toBe(supabaseUrl);
    });
  });

  describe("getThumbnailUrl", () => {
    it("debe retornar la URL de miniatura _thumb.webp para imágenes de Supabase Storage", () => {
      const supabaseUrl = "https://wxpizbnuuaiculzfuhof.supabase.co/storage/v1/object/public/images/test.webp";
      expect(getThumbnailUrl(supabaseUrl)).toBe("https://wxpizbnuuaiculzfuhof.supabase.co/storage/v1/object/public/images/test_thumb.webp");
    });

    it("debe limpiar parámetros query (?t=123) al resolver la miniatura _thumb.webp", () => {
      const supabaseUrlWithQuery = "https://wxpizbnuuaiculzfuhof.supabase.co/storage/v1/object/public/images/test.webp?t=173456789";
      expect(getThumbnailUrl(supabaseUrlWithQuery)).toBe("https://wxpizbnuuaiculzfuhof.supabase.co/storage/v1/object/public/images/test_thumb.webp");
    });

    it("debe conservar URLs que ya sean miniaturas o URLs externas", () => {
      const thumbUrl = "https://wxpizbnuuaiculzfuhof.supabase.co/storage/v1/object/public/images/test_thumb.webp";
      const externalUrl = "https://example.com/image.png";
      expect(getThumbnailUrl(thumbUrl)).toBe(thumbUrl);
      expect(getThumbnailUrl(externalUrl)).toBe(externalUrl);
    });
  });
});
