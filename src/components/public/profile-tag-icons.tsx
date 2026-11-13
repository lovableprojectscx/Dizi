import React from "react";
import {
  Truck,
  Store as StoreIcon,
  PackageCheck,
  Wallet,
  CreditCard,
  Banknote,
  Clock,
  Tag,
  Sparkles,
  ShieldCheck,
  Package,
  Percent,
  CheckCircle2,
  MapPin,
} from "lucide-react";
import {
  resolveCustomTagIcon,
  type ProfileTagCustomIconId,
  type ProfileTagItem,
  type ProfileTagPresetId,
} from "@/lib/profile-tags";

export const PRESET_TAG_ICONS: Record<ProfileTagPresetId, React.ReactNode> = {
  delivery: <Truck className="h-3.5 w-3.5 text-rose-500 shrink-0" />,
  recojo: <StoreIcon className="h-3.5 w-3.5 text-fuchsia-600 shrink-0" />,
  envios_provincia: <PackageCheck className="h-3.5 w-3.5 text-blue-600 shrink-0" />,
  yape: <Wallet className="h-3.5 w-3.5 text-purple-600 shrink-0" />,
  plin: <Wallet className="h-3.5 w-3.5 text-cyan-600 shrink-0" />,
  tarjeta: <CreditCard className="h-3.5 w-3.5 text-amber-600 shrink-0" />,
  contraentrega: <Banknote className="h-3.5 w-3.5 text-emerald-600 shrink-0" />,
  horario: <Clock className="h-3.5 w-3.5 text-slate-600 shrink-0" />,
};

export const CUSTOM_TAG_ICONS: Record<ProfileTagCustomIconId, React.ReactNode> = {
  tag: <Tag className="h-3.5 w-3.5 text-primary shrink-0" />,
  package: <Package className="h-3.5 w-3.5 text-indigo-600 shrink-0" />,
  sparkles: <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />,
  shield: <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />,
  percent: <Percent className="h-3.5 w-3.5 text-rose-500 shrink-0" />,
  check: <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 shrink-0" />,
  clock: <Clock className="h-3.5 w-3.5 text-slate-600 shrink-0" />,
  map_pin: <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />,
};

export function renderProfileTagIcon(tag: Pick<ProfileTagItem, "id" | "icon">): React.ReactNode {
  if (tag.id === "custom") {
    return CUSTOM_TAG_ICONS[resolveCustomTagIcon(tag.icon)];
  }
  return PRESET_TAG_ICONS[tag.id] ?? CUSTOM_TAG_ICONS.tag;
}
