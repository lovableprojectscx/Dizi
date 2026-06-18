-- =============================================================================
-- MIGRACIÓN: Blindaje y Seguridad del Buscador de Invitaciones
-- Fecha: 2026-06-17
-- Descripción:
--   1. Crea la función RPC segura 'check_invite' para validar invitaciones individuales.
--   2. Remueve la política RLS 'invites_public_select' para evitar que usuarios no
--      autorizados puedan listar y enumerar todos los enlaces de registro activos.
-- =============================================================================

-- ─── 1. CREACIÓN DE LA FUNCIÓN RPC DE BÚSQUEDA SEGURA ────────────────────────
CREATE OR REPLACE FUNCTION public.check_invite(p_token TEXT)
RETURNS TABLE(
  plan TEXT, 
  expires_at TIMESTAMPTZ, 
  duration_months INT, 
  duration_value INT, 
  duration_unit TEXT, 
  custom_price NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.plan::TEXT, 
    i.expires_at, 
    i.duration_months::INT, 
    i.duration_value::INT, 
    i.duration_unit::TEXT, 
    i.custom_price::NUMERIC
  FROM public.invites i
  WHERE i.token = p_token 
    AND i.used = false 
    AND i.expires_at > NOW();
END;
$$;

-- Otorgar permisos de ejecución al rol público/anon
GRANT EXECUTE ON FUNCTION public.check_invite(TEXT) TO public, anon, authenticated;

-- ─── 2. ELIMINACIÓN DE LA POLÍTICA DE SELECCIÓN PÚBLICA EN invites ───────────
DROP POLICY IF EXISTS "invites_public_select" ON public.invites;
