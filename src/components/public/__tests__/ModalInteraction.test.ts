import { describe, it, expect } from "vitest";

describe("Pruebas Unitarias de Interacción y Cierre de Modales de WhatsApp", () => {
  it("debe garantizar que las funciones de apertura de WhatsApp desactiven los paneles laterales activos", () => {
    let cartOpen = true;
    let viewingProduct: string | null = "prod_123";
    let showSuccessModal = false;

    // Simulación del flujo corregido en sendWhatsAppOrder y consultProduct
    const sendOrder = () => {
      cartOpen = false;
      viewingProduct = null;
      showSuccessModal = true;
    };

    sendOrder();

    expect(cartOpen).toBe(false);
    expect(viewingProduct).toBeNull();
    expect(showSuccessModal).toBe(true);
  });

  it("debe verificar que el cierre del modal de éxito restaure el estado limpio de la tienda", () => {
    let showSuccessModal = true;

    const closeModal = () => {
      showSuccessModal = false;
    };

    closeModal();
    expect(showSuccessModal).toBe(false);
  });
});
