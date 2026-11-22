-- ==============================================================================
-- Migración: F55 - initialize_store con Prueba Pro de 7 días
-- Archivo: supabase/migrations/20261122120000_f55_initialize_store_pro.sql
-- Fecha: 2026-11-22
--
-- NOTA: Archivo preparado SOLO como archivo (NO APLICAR A PRODUCCIÓN HASTA OK DE JACK).
--
-- Hallazgo:
--   Las tiendas se crean a través del RPC `public.initialize_store()` (SECURITY DEFINER,
--   propiedad de postgres). Al ejecutarse como postgres, el trigger `protect_store_billing_columns`
--   se omite (`IF current_user = 'postgres' THEN RETURN NEW;`), y además la rama NO super_admin
--   forzaba `v_plan := 'semilla'`.
--
-- Corrección:
--   Actualizar `public.initialize_store()` para que en la rama NO super_admin:
--     - plan = 'pro'
--     - subscription_status = 'trial'
--     - plan_expires_at = now() + interval '7 days'
--     - show_dizi_branding = NULL
--     - requested_plan = CASE WHEN p_plan IS NOT NULL AND p_plan != 'semilla' THEN p_plan ELSE NULL END
--   La rama super_admin permanece 100% idéntica a la actual.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.initialize_store(
  p_id text,
  p_slug text,
  p_name text,
  p_phone text,
  p_country_code text,
  p_plan text,
  p_owner_id uuid,
  p_model text,
  p_niche text,
  p_category_id text,
  p_country_iso text DEFAULT 'PE'::text
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_plan text;
  v_requested_plan text;
  v_is_super boolean;
BEGIN
  -- 1. Exigir que auth.uid() coincida con p_owner_id, o que quien llama sea super_admin
  v_is_super := (COALESCE(((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text), ''::text) = 'super_admin'::text);

  IF auth.uid() IS NULL OR (auth.uid() != p_owner_id AND NOT v_is_super) THEN
    RAISE EXCEPTION 'No autorizado. Solo el dueño autenticado o un super_admin pueden inicializar la tienda.';
  END IF;

  -- 2. Si no es super_admin, la tienda nace con 7 días de prueba Pro (F55).
  --    Si es super_admin, se respeta el plan solicitado o semilla (rama idéntica a la actual).
  IF v_is_super THEN
    v_plan := COALESCE(p_plan, 'semilla');
    v_requested_plan := NULL;

    -- 3a. Insertar tienda como super_admin (100% idéntico a la versión previa)
    INSERT INTO public.stores (
      id, slug, name, phone, country_code, country_iso, plan, requested_plan, terms_accepted_at, owner_id, model, active, is_published
    ) VALUES (
      p_id, p_slug, p_name, p_phone, p_country_code, COALESCE(p_country_iso, 'PE'), v_plan, v_requested_plan, now(), p_owner_id, p_model, true, true
    );
  ELSE
    v_plan := 'pro';
    v_requested_plan := CASE WHEN p_plan IS NOT NULL AND p_plan != 'semilla' THEN p_plan ELSE NULL END;

    -- 3b. Insertar tienda con prueba Pro de 7 días (F55)
    INSERT INTO public.stores (
      id, slug, name, phone, country_code, country_iso, plan, subscription_status, plan_expires_at, show_dizi_branding, requested_plan, terms_accepted_at, owner_id, model, active, is_published
    ) VALUES (
      p_id, p_slug, p_name, p_phone, p_country_code, COALESCE(p_country_iso, 'PE'), 'pro', 'trial', now() + interval '7 days', NULL, v_requested_plan, now(), p_owner_id, p_model, true, true
    );
  END IF;

  -- 4. Insertar categoría inicial
  INSERT INTO public.categories (
    id, store_id, name
  ) VALUES (
    p_category_id, p_id, 'General'
  );

  -- 5. Eliminado en Fase 3A: las tiendas nuevas ya no reciben productos de ejemplo.
END;
$function$;

-- Permisos (idénticos a producción: postgres, authenticated, service_role)
REVOKE ALL ON FUNCTION public.initialize_store(text, text, text, text, text, text, uuid, text, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.initialize_store(text, text, text, text, text, text, uuid, text, text, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.initialize_store(text, text, text, text, text, text, uuid, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.initialize_store(text, text, text, text, text, text, uuid, text, text, text, text) TO service_role;

-- ==============================================================================
-- Script de Reversión (para referencia, no ejecutar):
--
-- CREATE OR REPLACE FUNCTION public.initialize_store(
--   p_id text, p_slug text, p_name text, p_phone text, p_country_code text, p_plan text,
--   p_owner_id uuid, p_model text, p_niche text, p_category_id text, p_country_iso text DEFAULT 'PE'::text
-- )
--  RETURNS void
--  LANGUAGE plpgsql
--  SECURITY DEFINER
--  SET search_path TO 'public', 'pg_temp'
-- AS $function$
-- DECLARE
--   v_plan text;
--   v_requested_plan text;
--   v_is_super boolean;
-- BEGIN
--   v_is_super := (COALESCE(((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text), ''::text) = 'super_admin'::text);
--   IF auth.uid() IS NULL OR (auth.uid() != p_owner_id AND NOT v_is_super) THEN
--     RAISE EXCEPTION 'No autorizado. Solo el dueño autenticado o un super_admin pueden inicializar la tienda.';
--   END IF;
--   IF v_is_super THEN
--     v_plan := COALESCE(p_plan, 'semilla');
--     v_requested_plan := NULL;
--   ELSE
--     v_plan := 'semilla';
--     v_requested_plan := CASE WHEN p_plan IS NOT NULL AND p_plan != 'semilla' THEN p_plan ELSE NULL END;
--   END IF;
--   INSERT INTO public.stores (
--     id, slug, name, phone, country_code, country_iso, plan, requested_plan, terms_accepted_at, owner_id, model, active, is_published
--   ) VALUES (
--     p_id, p_slug, p_name, p_phone, p_country_code, COALESCE(p_country_iso, 'PE'), v_plan, v_requested_plan, now(), p_owner_id, p_model, true, true
--   );
--   INSERT INTO public.categories (id, store_id, name) VALUES (p_category_id, p_id, 'General');
-- END;
-- $function$;
-- ==============================================================================
