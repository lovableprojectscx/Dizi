import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import { urlToBase64, generateCatalogPdf } from "../CatalogPdfExport";
import { supabase } from "@/lib/supabase";
import type { Store } from "@/lib/types";

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

// Mock jsPDF
let pageCount = 1;
const mockLink = vi.fn();
const mockText = vi.fn();
const mockAddPage = vi.fn().mockImplementation(() => {
  pageCount++;
});
const mockSave = vi.fn();
const mockSetPage = vi.fn();
const mockGetNumberOfPages = vi.fn().mockImplementation(() => pageCount);
const mockGetTextWidth = vi.fn(() => 20);

vi.mock("jspdf", () => {
  const jsPDFMock = vi.fn().mockImplementation(function (this: any) {
    return {
      setFont: vi.fn(),
      setFontSize: vi.fn(),
      setTextColor: vi.fn(),
      setFillColor: vi.fn(),
      setDrawColor: vi.fn(),
      setLineWidth: vi.fn(),
      rect: vi.fn(),
      roundedRect: vi.fn(),
      circle: vi.fn(),
      triangle: vi.fn(),
      line: vi.fn(),
      text: mockText,
      addImage: vi.fn(),
      addPage: mockAddPage,
      link: mockLink,
      setPage: mockSetPage,
      save: mockSave,
      splitTextToSize: vi.fn((text) => [text]),
      getTextWidth: mockGetTextWidth,
      internal: {
        getNumberOfPages: mockGetNumberOfPages,
      },
    };
  });

  return {
    default: jsPDFMock,
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
    mockLink.mockClear();
    mockText.mockClear();
    mockAddPage.mockClear();
    mockSave.mockClear();
    mockSetPage.mockClear();
    mockGetNumberOfPages.mockClear();
    mockGetTextWidth.mockClear();
    pageCount = 1;

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
    mockFetch.mockRejectedValue(new TypeError("Failed to fetch"));

    const externalUrl = "https://images.unsplash.com/photo-123456?w=600";
    const base64 = await urlToBase64(externalUrl);

    expect(mockFetch).toHaveBeenCalled();
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

describe("CatalogPdfExport - generateCatalogPdf integration tests", () => {
  it("debe crear el catálogo PDF con índice interactivo y enlaces de WhatsApp", async () => {
    const mockStore: Store = {
      id: "store-123",
      slug: "test-store",
      name: "Grano & Miga",
      phone: "51925176472",
      countryCode: "PE",
      logo: "https://example.com/logo.jpg",
      plan: "pro",
      active: true,
      createdAt: new Date().toISOString(),
      whatsappClicks: 0,
      categories: [
        { id: "cat-1", name: "Panes", storeId: "store-123" },
        { id: "cat-2", name: "Pasteles", storeId: "store-123" },
      ] as any,
      products: [
        {
          id: "prod-1",
          name: "Masa Madre",
          price: 15,
          visible: true,
          categoryId: "cat-1",
          image: "https://example.com/pan.jpg",
        },
        {
          id: "prod-2",
          name: "Croissant",
          price: 8,
          visible: true,
          categoryId: "cat-2",
          image: "https://example.com/croissant.jpg",
        },
      ] as any,
    };

    const mockTheme = {
      id: "moderno",
      name: "Moderno",
      desc: "Diseño elegante",
      preview: {
        bg: "#ffffff",
        accent: "#4f46e5",
        header: "#1f2937",
        text: "#374151",
        subtext: "#6b7280",
        card: "#f3f4f6",
      },
    };

    // 2. Ejecutar la generación del catálogo
    await generateCatalogPdf(mockStore, mockTheme as any);

    // Verificar que se haya llamado a addPage (para el índice y las categorías)
    expect(mockAddPage).toHaveBeenCalled();

    // Verificar que se haya llamado a setPage para volver a la página de índice (pág. 2)
    expect(mockSetPage).toHaveBeenCalledWith(2);

    // Verificar que se hayan creado enlaces (para el índice y los botones "PEDIR" de WhatsApp)
    expect(mockLink).toHaveBeenCalled();

    // Verificar que se haya guardado el PDF con el nombre correcto
    expect(mockSave).toHaveBeenCalledWith("Grano_&_Miga_catalogo_moderno.pdf");
  });
});
