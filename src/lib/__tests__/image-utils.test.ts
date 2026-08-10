import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import { convertImageToWebP, convertImageUrlToWebP, getOptimizedImageUrl, getThumbnailUrl } from "../image-utils";

describe("Pruebas unitarias de image-utils.ts", () => {
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
    // Reseteamos las variables de prueba antes de cada test
    mockWidth = 1000;
    mockHeight = 800;
    shouldFail = false;
    createdCanvases = [];
    canvasContext = null;
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("debe convertir una imagen dentro de los límites de dimensión sin redimensionar", async () => {
    mockWidth = 600;
    mockHeight = 400;
    shouldFail = false;

    const file = new File([""], "test.png", { type: "image/png" });
    const result = await convertImageToWebP(file);

    expect(result).toContain("data:image/webp;base64,mockedData");

    // Buscamos el canvas en el que se dibujó la imagen (el que tiene dimensiones asignadas)
    const drawingCanvas = createdCanvases.find((c) => c.width > 0);
    expect(drawingCanvas).toBeDefined();
    expect(drawingCanvas.width).toBe(600);
    expect(drawingCanvas.height).toBe(400);
  });

  it("debe redimensionar la imagen proporcionalmente si el ancho supera MAX_DIMENSION (800)", async () => {
    mockWidth = 3000;
    mockHeight = 1500;
    shouldFail = false;

    const file = new File([""], "test.png", { type: "image/png" });
    await convertImageToWebP(file);

    const drawingCanvas = createdCanvases.find((c) => c.width > 0);
    expect(drawingCanvas).toBeDefined();
    // 3000 -> 800, alto = 1500 * 800 / 3000 = 400
    expect(drawingCanvas.width).toBe(800);
    expect(drawingCanvas.height).toBe(400);
  });

  it("debe redimensionar la imagen proporcionalmente si el alto supera MAX_DIMENSION (800)", async () => {
    mockWidth = 1500;
    mockHeight = 3000;
    shouldFail = false;

    const file = new File([""], "test.png", { type: "image/png" });
    await convertImageToWebP(file);

    const drawingCanvas = createdCanvases.find((c) => c.width > 0);
    expect(drawingCanvas).toBeDefined();
    // 3000 -> 800, ancho = 1500 * 800 / 3000 = 400
    expect(drawingCanvas.height).toBe(800);
    expect(drawingCanvas.width).toBe(400);
  });

  it("debe fallar si la imagen no se puede cargar", async () => {
    shouldFail = true;

    const file = new File([""], "bad.png", { type: "image/png" });
    const promise = convertImageToWebP(file);

    await expect(promise).rejects.toThrow("No se pudo leer la imagen");
  });

  it("debe retornar inmediatamente la URL si ya es una data URL", async () => {
    const dataUrl = "data:image/png;base64,alreadyConverted";
    const result = await convertImageUrlToWebP(dataUrl);
    expect(result).toBe(dataUrl);
  });

  it("debe descargar y convertir una URL externa a WebP", async () => {
    mockWidth = 500;
    mockHeight = 500;
    shouldFail = false;

    const result = await convertImageUrlToWebP("https://example.com/image.jpg");
    expect(result).toContain("data:image/webp;base64,mockedData");
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

    it("debe conservar URLs que ya sean miniaturas o URLs externas", () => {
      const thumbUrl = "https://wxpizbnuuaiculzfuhof.supabase.co/storage/v1/object/public/images/test_thumb.webp";
      const externalUrl = "https://example.com/image.png";
      expect(getThumbnailUrl(thumbUrl)).toBe(thumbUrl);
      expect(getThumbnailUrl(externalUrl)).toBe(externalUrl);
    });
  });
});
