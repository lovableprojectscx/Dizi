export type PlanId = "semilla" | "emprendedor" | "pro" | "ilimitado";

export interface Plan {
  id: PlanId;
  name: string;
  productLimit: number;
  price: number;
}

export const PLANS: Record<PlanId, Plan> = {
  semilla:      { id: "semilla",      name: "Semilla",      productLimit: 7,        price: 0    },
  emprendedor:  { id: "emprendedor",  name: "Emprendedor",  productLimit: 50,       price: 14.9 },
  pro:          { id: "pro",          name: "Pro",          productLimit: 200,      price: 19.9 },
  ilimitado:    { id: "ilimitado",    name: "Ilimitado",    productLimit: Infinity, price: 34.9 },
};

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
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
  phone: string;
  countryCode: string;
  logo?: string;
  brandColor?: string;
  bgColor?: string;
  bannerImage?: string;
  bannerTitle?: string;
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
