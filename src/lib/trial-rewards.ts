/**
 * @file trial-rewards.ts
 * @description Gestión de logros y premios de la prueba Pro de 7 días (F55).
 * Los comercios pueden sumar hasta +7 días adicionales (máximo 14 días en total)
 * completando hitos en su tienda:
 * - productos_3: +3 días (al publicar 3 o más productos con foto)
 * - compartir: +2 días (al compartir catálogo o producto)
 * - marca: +2 días (al configurar logo + portada o eslogan)
 */

import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export type TrialMilestone = "productos_3" | "compartir" | "marca";

export interface TrialMilestoneConfig {
  id: TrialMilestone;
  title: string;
  description: string;
  days: number;
}

export const TRIAL_MILESTONES: Record<TrialMilestone, TrialMilestoneConfig> = {
  productos_3: {
    id: "productos_3",
    title: "Sube 3 productos con foto",
    description: "Publica al menos 3 productos con foto e información completa",
    days: 3,
  },
  compartir: {
    id: "compartir",
    title: "Comparte tu tienda",
    description: "Comparte tu catálogo o un producto en redes o WhatsApp",
    days: 2,
  },
  marca: {
    id: "marca",
    title: "Ponle tu marca",
    description: "Sube tu logo y agrega una portada o eslogan",
    days: 2,
  },
};

export interface ClaimTrialRewardsResult {
  granted: Array<{ milestone: TrialMilestone; days: number }>;
  totalDaysAdded: number;
  error?: any;
}

export interface StoreRewardRow {
  store_id: string;
  milestone: TrialMilestone;
  days: number;
  granted_at: string;
}

/**
 * Invoca el RPC `claim_trial_rewards` en Supabase para evaluar y otorgar logros pendientes.
 * Si se otorgan nuevos días, notifica al usuario mediante un toast celebratorio.
 */
export async function claimTrialRewards(
  storeId: string,
  supabaseClient: any = supabase,
  options: { silent?: boolean } = {}
): Promise<ClaimTrialRewardsResult> {
  if (!storeId) {
    return { granted: [], totalDaysAdded: 0 };
  }

  try {
    const { data, error } = await supabaseClient.rpc("claim_trial_rewards", {
      p_store_id: storeId,
    });

    if (error) {
      console.warn("[claimTrialRewards] Error al evaluar logros:", error);
      return { granted: [], totalDaysAdded: 0, error };
    }

    const rows = (data || []) as Array<{ milestone: string; days: number }>;
    const granted = rows.map((r) => ({
      milestone: r.milestone as TrialMilestone,
      days: Number(r.days),
    }));

    const totalDaysAdded = granted.reduce((acc, curr) => acc + curr.days, 0);

    if (totalDaysAdded > 0 && !options.silent) {
      const daysText = totalDaysAdded === 1 ? "1 día más" : `${totalDaysAdded} días más`;
      toast.success(`¡Ganaste ${daysText} de Pro! 🎉`, {
        description: "Tu prueba Pro se extendió automáticamente por completar tu tienda.",
        duration: 5000,
      });
    }

    return { granted, totalDaysAdded };
  } catch (err) {
    console.warn("[claimTrialRewards] Excepción al reclamar premios:", err);
    return { granted: [], totalDaysAdded: 0, error: err };
  }
}

/**
 * Consulta la lista de logros ya otorgados a una tienda desde la tabla `store_rewards`.
 */
export async function getGrantedRewards(
  storeId: string,
  supabaseClient: any = supabase
): Promise<Record<TrialMilestone, boolean>> {
  const result: Record<TrialMilestone, boolean> = {
    productos_3: false,
    compartir: false,
    marca: false,
  };

  if (!storeId) return result;

  try {
    const { data, error } = await supabaseClient
      .from("store_rewards")
      .select("milestone, days")
      .eq("store_id", storeId);

    if (error) {
      console.warn("[getGrantedRewards] Error consultando store_rewards:", error);
      return result;
    }

    if (Array.isArray(data)) {
      for (const row of data) {
        if (row.milestone in result) {
          result[row.milestone as TrialMilestone] = true;
        }
      }
    }

    return result;
  } catch (err) {
    console.warn("[getGrantedRewards] Excepción consultando store_rewards:", err);
    return result;
  }
}
