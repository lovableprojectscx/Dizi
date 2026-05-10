export type PlanId = "semilla" | "emprendedor" | "pro" | "ilimitado";

export interface Plan {
  id: PlanId;
  name: string;
  productLimit: number; // Infinity for pro/ilimitado
}

export const PLANS: Record<PlanId, Plan> = {
  semilla: { id: "semilla", name: "Semilla", productLimit: 7 },
  emprendedor: { id: "emprendedor", name: "Emprendedor", productLimit: 50 },
  pro: { id: "pro", name: "Pro", productLimit: 200 },
  ilimitado: { id: "ilimitado", name: "Ilimitado", productLimit: Infinity },
};

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  price: number; // S/.
  categoryId: string;
  image: string;
  description?: string;
  isOnSale?: boolean;
  originalPrice?: number;
  visible: boolean;
  isSample?: boolean;
}

export interface Store {
  id: string;
  slug: string;
  name: string;
  phone: string; // E.164 e.g. 51999999999
  countryCode: string; // e.g. 51
  logo?: string;
  brandColor?: string;
  plan: PlanId;
  active: boolean;
  createdAt: string;
  whatsappClicks: number;
  isPublished?: boolean;
  model?: string;
  ownerId?: string;
  niche?: string;
  categories: Category[];
  products: Product[];
}

export interface Invite {
  token: string;
  plan: PlanId;
  used: boolean;
  createdAt: string;
}
