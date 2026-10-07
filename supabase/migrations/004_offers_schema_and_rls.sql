-- ============================================================================
-- CONVOLTAJE ERP / CRM — MIGRATION 004: OFFERS SCHEMA AND RLS POLICIES
-- Fecha: 2026-10-05
-- Estado: LOCAL DRAFT ONLY (NO APLICAR REMOTAMENTE SIN APROBACIÓN EXPLÍCITA)
-- ============================================================================
--
-- CARACTERÍSTICAS Y POLÍTICAS RLS:
-- 1. Tabla `public.offers` desacoplada del catálogo estático.
-- 2. Almacenamiento de rutas relativas (`image_path`, `pdf_path`) para gestión segura de assets.
-- 3. Constraints estrictos: precios >= 0, end_date > start_date, currency = 'USD', title trim.
-- 4. RLS habilitado con políticas independientes por comando (SELECT, INSERT, UPDATE, DELETE).
-- 5. Lectura anónima/pública limitada a ofertas activas y en periodo de vigencia.
-- 6. Escritura (INSERT, UPDATE, DELETE) restringida exclusivamente a roles verificados
--    mediante la función segura `private.is_offer_manager()`.
-- ============================================================================

-- 1. Crear la tabla de ofertas
CREATE TABLE IF NOT EXISTS public.offers (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT NOT NULL,
  description    TEXT,
  original_price NUMERIC(10,2),
  offer_price    NUMERIC(10,2) NOT NULL,
  currency       TEXT NOT NULL DEFAULT 'USD',
  badge_text     TEXT,
  image_path     TEXT NOT NULL,
  pdf_path       TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  start_date     TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date       TIMESTAMPTZ,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  created_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Restricciones de integridad
  CONSTRAINT offers_offer_price_check CHECK (offer_price >= 0),
  CONSTRAINT offers_original_price_check CHECK (original_price IS NULL OR original_price >= 0),
  CONSTRAINT offers_price_comparison_check CHECK (original_price IS NULL OR offer_price <= original_price),
  CONSTRAINT offers_dates_check CHECK (end_date IS NULL OR end_date > start_date),
  CONSTRAINT offers_currency_check CHECK (currency = 'USD'),
  CONSTRAINT offers_title_check CHECK (length(trim(title)) > 0)
);

-- 2. Índices para optimización de consultas públicas y administrativas
CREATE INDEX IF NOT EXISTS idx_offers_public_lookup 
  ON public.offers (is_active, start_date, end_date, sort_order);

CREATE INDEX IF NOT EXISTS idx_offers_created_at 
  ON public.offers (created_at DESC);

-- 3. Función y Trigger automático para `updated_at`
CREATE OR REPLACE FUNCTION public.set_offers_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_offers_updated_at ON public.offers;
CREATE TRIGGER trigger_set_offers_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_offers_updated_at();

-- 4. Habilitar Row Level Security (RLS) en la tabla base
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- 5. VISTA PÚBLICA SEGURA (SECURITY BARRIER)
-- Expone exclusivamente los campos comerciales y aplica las reglas de vigencia.
-- Jamás proyecta created_by ni updated_by hacia el exterior.
-- Ejecuta con permisos del owner (postgres) para lectura segura desacoplada.
CREATE OR REPLACE VIEW public.public_offers
AS
SELECT
  id,
  title,
  description,
  original_price,
  offer_price,
  currency,
  badge_text,
  image_path,
  pdf_path,
  is_active,
  start_date,
  end_date,
  sort_order,
  created_at,
  updated_at
FROM public.offers
WHERE
  is_active = true
  AND start_date <= now()
  AND (end_date IS NULL OR end_date >= now());

ALTER VIEW public.public_offers SET (security_barrier = true);

-- 6. GESTIÓN ESTRICTA DE PRIVILEGIOS (ZERO-TRUST COLUMN PRIVACY)
-- A) Vista pública: accesible por usuarios anónimos y autenticados (solo campos comerciales)
GRANT SELECT ON public.public_offers TO anon, authenticated;

-- B) Tabla base `public.offers`:
-- Revocación total de acceso directo para anon, authenticated y PUBLIC.
-- Previene que cualquier usuario autenticado ordinario pueda leer `created_by` o `updated_by`.
REVOKE ALL ON public.offers FROM anon;
REVOKE ALL ON public.offers FROM authenticated;
REVOKE ALL ON public.offers FROM PUBLIC;

-- 7. POLÍTICAS RLS EN `public.offers` (DEFENSA EN PROFUNDIDAD)
DROP POLICY IF EXISTS "Public users can view active and valid offers" ON public.offers;
DROP POLICY IF EXISTS "Authorized offer managers can view all offers" ON public.offers;
DROP POLICY IF EXISTS "Authorized offer managers can view offers" ON public.offers;
DROP POLICY IF EXISTS "Authorized offer managers can select offers" ON public.offers;
DROP POLICY IF EXISTS "Authorized offer managers can insert offers" ON public.offers;
DROP POLICY IF EXISTS "Authorized offer managers can update offers" ON public.offers;
DROP POLICY IF EXISTS "Authorized offer managers can delete offers" ON public.offers;

CREATE POLICY "Authorized offer managers can select offers"
  ON public.offers
  FOR SELECT
  TO authenticated
  USING (
    private.is_offer_manager() = true
  );

CREATE POLICY "Authorized offer managers can insert offers"
  ON public.offers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    private.is_offer_manager() = true
  );

CREATE POLICY "Authorized offer managers can update offers"
  ON public.offers
  FOR UPDATE
  TO authenticated
  USING (
    private.is_offer_manager() = true
  )
  WITH CHECK (
    private.is_offer_manager() = true
  );

CREATE POLICY "Authorized offer managers can delete offers"
  ON public.offers
  FOR DELETE
  TO authenticated
  USING (
    private.is_offer_manager() = true
  );

-- 8. RPCs ADMINISTRATIVOS PROTEGIDOS (SECURITY DEFINER CON BÚSQUEDA SEGURA)
-- Todas las operaciones CRUD de administración se ejecutan a través de estas funciones
-- protegidas que validan explícitamente `private.is_offer_manager()`.

-- A) Listar todas las ofertas para el panel de administración
CREATE OR REPLACE FUNCTION public.admin_list_offers()
RETURNS SETOF public.offers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT private.is_offer_manager() THEN
    RAISE EXCEPTION 'Access denied: insufficient permissions to list administrative offers.';
  END IF;

  RETURN QUERY
  SELECT * FROM public.offers
  ORDER BY sort_order ASC, created_at DESC;
END;
$$;

-- B) Crear una nueva oferta
CREATE OR REPLACE FUNCTION public.admin_create_offer(
  p_payload JSONB
)
RETURNS public.offers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_offer public.offers;
  v_uid UUID;
BEGIN
  IF NOT private.is_offer_manager() THEN
    RAISE EXCEPTION 'Access denied: insufficient permissions to create offers.';
  END IF;

  v_uid := (SELECT auth.uid());

  INSERT INTO public.offers (
    title,
    description,
    original_price,
    offer_price,
    currency,
    badge_text,
    image_path,
    pdf_path,
    is_active,
    start_date,
    end_date,
    sort_order,
    created_by,
    updated_by
  ) VALUES (
    trim((p_payload->>'title')::TEXT),
    trim((p_payload->>'description')::TEXT),
    (p_payload->>'original_price')::NUMERIC,
    (p_payload->>'offer_price')::NUMERIC,
    COALESCE((p_payload->>'currency')::TEXT, 'USD'),
    trim((p_payload->>'badge_text')::TEXT),
    (p_payload->>'image_path')::TEXT,
    (p_payload->>'pdf_path')::TEXT,
    COALESCE((p_payload->>'is_active')::BOOLEAN, true),
    COALESCE((p_payload->>'start_date')::TIMESTAMPTZ, now()),
    (p_payload->>'end_date')::TIMESTAMPTZ,
    COALESCE((p_payload->>'sort_order')::INTEGER, 0),
    v_uid,
    v_uid
  )
  RETURNING * INTO v_offer;

  RETURN v_offer;
END;
$$;

-- C) Actualizar una oferta existente
CREATE OR REPLACE FUNCTION public.admin_update_offer(
  p_id UUID,
  p_payload JSONB
)
RETURNS public.offers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_offer public.offers;
  v_uid UUID;
BEGIN
  IF NOT private.is_offer_manager() THEN
    RAISE EXCEPTION 'Access denied: insufficient permissions to update offers.';
  END IF;

  v_uid := (SELECT auth.uid());

  UPDATE public.offers
  SET
    title          = CASE WHEN p_payload ? 'title'          THEN trim((p_payload->>'title')::TEXT) ELSE title END,
    description    = CASE WHEN p_payload ? 'description'    THEN trim((p_payload->>'description')::TEXT) ELSE description END,
    original_price = CASE WHEN p_payload ? 'original_price' THEN (p_payload->>'original_price')::NUMERIC ELSE original_price END,
    offer_price    = CASE WHEN p_payload ? 'offer_price'    THEN (p_payload->>'offer_price')::NUMERIC ELSE offer_price END,
    currency       = CASE WHEN p_payload ? 'currency'       THEN (p_payload->>'currency')::TEXT ELSE currency END,
    badge_text     = CASE WHEN p_payload ? 'badge_text'     THEN trim((p_payload->>'badge_text')::TEXT) ELSE badge_text END,
    image_path     = CASE WHEN p_payload ? 'image_path'     THEN (p_payload->>'image_path')::TEXT ELSE image_path END,
    pdf_path       = CASE WHEN p_payload ? 'pdf_path'       THEN (p_payload->>'pdf_path')::TEXT ELSE pdf_path END,
    is_active      = CASE WHEN p_payload ? 'is_active'      THEN (p_payload->>'is_active')::BOOLEAN ELSE is_active END,
    start_date     = CASE WHEN p_payload ? 'start_date'     THEN (p_payload->>'start_date')::TIMESTAMPTZ ELSE start_date END,
    end_date       = CASE WHEN p_payload ? 'end_date'       THEN (p_payload->>'end_date')::TIMESTAMPTZ ELSE end_date END,
    sort_order     = CASE WHEN p_payload ? 'sort_order'     THEN (p_payload->>'sort_order')::INTEGER ELSE sort_order END,
    updated_by     = v_uid,
    updated_at     = now()
  WHERE id = p_id
  RETURNING * INTO v_offer;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offer not found with id %', p_id;
  END IF;

  RETURN v_offer;
END;
$$;

-- D) Eliminar una oferta
CREATE OR REPLACE FUNCTION public.admin_delete_offer(
  p_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT private.is_offer_manager() THEN
    RAISE EXCEPTION 'Access denied: insufficient permissions to delete offers.';
  END IF;

  DELETE FROM public.offers WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offer not found with id %', p_id;
  END IF;
END;
$$;

-- 9. PERMISOS DE EJECUCIÓN PARA LOS RPCs
REVOKE ALL ON FUNCTION public.admin_list_offers() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_create_offer(JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_update_offer(UUID, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_delete_offer(UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.admin_list_offers() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_offer(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_offer(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_offer(UUID) TO authenticated;
