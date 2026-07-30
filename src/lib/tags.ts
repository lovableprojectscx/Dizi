export interface ProductTagDef {
  id: string;
  label: string;
  keywords: string[];
}

export const PRODUCT_TAGS: ProductTagDef[] = [
  { id: "spicy", label: "Picante", keywords: ["picante", "spicy", "ají", "salsa", "chile", "rocoto"] },
  { id: "vegan", label: "Vegano", keywords: ["vegan", "vegano", "vegetariano", "plant-based"] },
  { id: "gluten", label: "Sin Gluten", keywords: ["sin gluten", "gluten free", "sin tacc", "celíaco"] },
  { id: "cotton", label: "Algodón", keywords: ["algodón", "cotton", "hilo", "100% algodón"] },
  { id: "winter", label: "Invierno", keywords: ["invierno", "lana", "abrigo", "casaca", "sweat", "hoodie"] },
  { id: "summer", label: "Verano", keywords: ["verano", "lino", "playa", "short", "polo", "top"] },
  { id: "love", label: "Amor & Regalos", keywords: ["amor", "roja", "te amo", "aniversario", "corazón", "romántico"] },
  { id: "birthday", label: "Cumpleaños", keywords: ["cumple", "alegre", "sol", "globo", "celebrar"] },
  { id: "condolences", label: "Condolencias", keywords: ["pésame", "condolencia", "blanca", "lágrima", "urna"] },
  { id: "express", label: "Entrega Express", keywords: ["express", "rápido", "30 min", "30 minutos"] },
  { id: "organic", label: "Orgánico", keywords: ["orgánic", "natural", "soya", "vege"] },
  { id: "relax", label: "Relajante", keywords: ["relaj", "zen", "antiestrés", "aroma", "lavanda", "descanso"] },
  { id: "best_seller", label: "Más Vendido", keywords: ["destacado", "más vendido", "popular", "top"] },
];
