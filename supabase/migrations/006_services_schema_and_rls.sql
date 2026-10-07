-- ============================================================================
-- CONVOLTAJE ERP / CRM — MIGRATION 006: SERVICES SCHEMA AND RLS POLICIES
-- Fecha: 2026-10-05
-- Estado: LOCAL DRAFT ONLY (NO APLICAR REMOTAMENTE SIN APROBACIÓN EXPLÍCITA)
-- ============================================================================
--
-- CARACTERÍSTICAS Y POLÍTICAS DE SEGURIDAD (ZERO-TRUST PRIVACY):
-- 1. Tabla `public.services` para gestión dinámica de servicios complementarios.
-- 2. Privilegios directos sobre `public.services` totalmente revocados (REVOKE ALL).
-- 3. Vista pública `public.public_services` con `security_barrier = true` que proyecta
--    exclusivamente campos comerciales seguros, excluyendo created_by y updated_by.
-- 4. Operaciones CRUD administrativas ejecutadas a través de RPCs protegidos con
--    `SECURITY DEFINER SET search_path = ''` que validan `private.is_offer_manager()`.
-- 5. RLS habilitado en la tabla base como defensa en profundidad.
-- ============================================================================

-- 1. Crear tabla de servicios
CREATE TABLE IF NOT EXISTS public.services (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT NOT NULL,
  description    TEXT NOT NULL,
  price          NUMERIC(10,2) NOT NULL,
  billing_period TEXT CHECK (billing_period IS NULL OR billing_period IN ('mes', 'año')),
  badge_text     TEXT,
  image_path     TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  created_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Restricciones de integridad
  CONSTRAINT services_price_check CHECK (price >= 0),
  CONSTRAINT services_title_check CHECK (length(trim(title)) > 0)
);

-- 2. Índices de búsqueda
CREATE INDEX IF NOT EXISTS idx_services_public_lookup
  ON public.services (is_active, sort_order);

CREATE INDEX IF NOT EXISTS idx_services_created_at
  ON public.services (created_at DESC);

-- 3. Función y Trigger para `updated_at`
CREATE OR REPLACE FUNCTION public.set_services_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_services_updated_at ON public.services;
CREATE TRIGGER trigger_set_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.set_services_updated_at();

-- 4. Habilitar Row Level Security (RLS) en la tabla base
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- 5. VISTA PÚBLICA SEGURA (SECURITY INVOKER)
-- Excluye estrictamente created_by y updated_by
-- Utiliza WITH (security_invoker = true) para ejecutar con los permisos del invocador y satisfacer el Security Advisor.
CREATE OR REPLACE VIEW public.public_services
WITH (security_invoker = true)
AS
SELECT
  id,
  title,
  description,
  price,
  billing_period,
  badge_text,
  image_path,
  is_active,
  sort_order,
  created_at,
  updated_at
FROM public.services
WHERE
  is_active = true;

-- 6. GESTIÓN ESTRICTA DE PRIVILEGIOS (ZERO-TRUST COLUMN PRIVACY)
-- A) Revocación total de acceso directo a la tabla base
REVOKE ALL ON public.services FROM anon;
REVOKE ALL ON public.services FROM authenticated;
REVOKE ALL ON public.services FROM PUBLIC;

-- B) Concesión de privilegios SELECT a nivel de columna exclusivamente para campos comerciales
--    created_by y updated_by JAMÁS se conceden a usuarios anónimos ni autenticados ordinarios.
GRANT SELECT (
  id,
  title,
  description,
  price,
  billing_period,
  badge_text,
  image_path,
  is_active,
  sort_order,
  created_at,
  updated_at
) ON public.services TO anon, authenticated;

-- C) Conceder SELECT sobre la vista pública
GRANT SELECT ON public.public_services TO anon, authenticated;

-- 7. POLÍTICAS RLS EN public.services (DEFENSA EN PROFUNDIDAD)
DROP POLICY IF EXISTS "Public users can view active services" ON public.services;
DROP POLICY IF EXISTS "Authorized managers can select services" ON public.services;
DROP POLICY IF EXISTS "Authorized managers can insert services" ON public.services;
DROP POLICY IF EXISTS "Authorized managers can update services" ON public.services;
DROP POLICY IF EXISTS "Authorized managers can delete services" ON public.services;

-- A) Lectura pública segura invocada por la vista para servicios activos
CREATE POLICY "Public users can view active services"
  ON public.services
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
  );

-- B) Lectura administrativa completa para administradores
CREATE POLICY "Authorized managers can select services"
  ON public.services
  FOR SELECT
  TO authenticated
  USING (
    private.is_offer_manager() = true
  );

-- C) Inserción exclusiva para administradores verificados
CREATE POLICY "Authorized managers can insert services"
  ON public.services
  FOR INSERT
  TO authenticated
  WITH CHECK (
    private.is_offer_manager() = true
  );

-- D) Actualización exclusiva para administradores verificados
CREATE POLICY "Authorized managers can update services"
  ON public.services
  FOR UPDATE
  TO authenticated
  USING (
    private.is_offer_manager() = true
  )
  WITH CHECK (
    private.is_offer_manager() = true
  );

-- E) Eliminación exclusiva para administradores verificados
CREATE POLICY "Authorized managers can delete services"
  ON public.services
  FOR DELETE
  TO authenticated
  USING (
    private.is_offer_manager() = true
  );

-- 8. RPCs Administrativos Protegidos (SECURITY DEFINER)
-- A) Listar todos los servicios para administración
CREATE OR REPLACE FUNCTION public.admin_list_services()
RETURNS SETOF public.services
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT private.is_offer_manager() THEN
    RAISE EXCEPTION 'Access denied: insufficient permissions to list administrative services.';
  END IF;

  RETURN QUERY
  SELECT * FROM public.services
  ORDER BY sort_order ASC, created_at DESC;
END;
$$;

-- B) Crear un nuevo servicio
CREATE OR REPLACE FUNCTION public.admin_create_service(
  p_payload JSONB
)
RETURNS public.services
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_service public.services;
  v_uid UUID;
BEGIN
  IF NOT private.is_offer_manager() THEN
    RAISE EXCEPTION 'Access denied: insufficient permissions to create services.';
  END IF;

  v_uid := (SELECT auth.uid());

  INSERT INTO public.services (
    title,
    description,
    price,
    billing_period,
    badge_text,
    image_path,
    is_active,
    sort_order,
    created_by,
    updated_by
  ) VALUES (
    trim((p_payload->>'title')::TEXT),
    trim((p_payload->>'description')::TEXT),
    (p_payload->>'price')::NUMERIC,
    (p_payload->>'billing_period')::TEXT,
    trim((p_payload->>'badge_text')::TEXT),
    (p_payload->>'image_path')::TEXT,
    COALESCE((p_payload->>'is_active')::BOOLEAN, true),
    COALESCE((p_payload->>'sort_order')::INTEGER, 0),
    v_uid,
    v_uid
  )
  RETURNING * INTO v_service;

  RETURN v_service;
END;
$$;

-- C) Actualizar un servicio existente
CREATE OR REPLACE FUNCTION public.admin_update_service(
  p_id UUID,
  p_payload JSONB
)
RETURNS public.services
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_service public.services;
  v_uid UUID;
BEGIN
  IF NOT private.is_offer_manager() THEN
    RAISE EXCEPTION 'Access denied: insufficient permissions to update services.';
  END IF;

  v_uid := (SELECT auth.uid());

  UPDATE public.services
  SET
    title          = CASE WHEN p_payload ? 'title'          THEN trim((p_payload->>'title')::TEXT) ELSE title END,
    description    = CASE WHEN p_payload ? 'description'    THEN trim((p_payload->>'description')::TEXT) ELSE description END,
    price          = CASE WHEN p_payload ? 'price'          THEN (p_payload->>'price')::NUMERIC ELSE price END,
    billing_period = CASE WHEN p_payload ? 'billing_period' THEN (p_payload->>'billing_period')::TEXT ELSE billing_period END,
    badge_text     = CASE WHEN p_payload ? 'badge_text'     THEN trim((p_payload->>'badge_text')::TEXT) ELSE badge_text END,
    image_path     = CASE WHEN p_payload ? 'image_path'     THEN (p_payload->>'image_path')::TEXT ELSE image_path END,
    is_active      = CASE WHEN p_payload ? 'is_active'      THEN (p_payload->>'is_active')::BOOLEAN ELSE is_active END,
    sort_order     = CASE WHEN p_payload ? 'sort_order'     THEN (p_payload->>'sort_order')::INTEGER ELSE sort_order END,
    updated_by     = v_uid,
    updated_at     = now()
  WHERE id = p_id
  RETURNING * INTO v_service;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service not found with id %', p_id;
  END IF;

  RETURN v_service;
END;
$$;

-- D) Eliminar un servicio
CREATE OR REPLACE FUNCTION public.admin_delete_service(
  p_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT private.is_offer_manager() THEN
    RAISE EXCEPTION 'Access denied: insufficient permissions to delete services.';
  END IF;

  DELETE FROM public.services WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service not found with id %', p_id;
  END IF;
END;
$$;

-- 9. Conceder permisos de ejecución para los RPCs
REVOKE ALL ON FUNCTION public.admin_list_services() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_create_service(JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_update_service(UUID, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_delete_service(UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.admin_list_services() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_service(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_service(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_service(UUID) TO authenticated;

-- 10. Datos semilla iniciales (6 servicios canónicos)
INSERT INTO public.services (id, title, description, price, billing_period, badge_text, sort_order)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Aterramiento', 'Ayuda a proteger el sistema ante descargas atmosféricas. Incluye varilla y perrito de conexión.', 150.00, NULL, 'Recomendado', 1),
  ('00000000-0000-0000-0000-000000000002', 'Alarma para Paneles Solares', 'Protección antirrobo electrónica dedicada para la estructura exterior de paneles.', 250.00, NULL, NULL, 2),
  ('00000000-0000-0000-0000-000000000003', 'Kit de Limpieza de Paneles', 'Líquidos y herramientas especializadas diseñadas para no rayar las celdas fotovoltaicas.', 150.00, NULL, NULL, 3),
  ('00000000-0000-0000-0000-000000000004', 'Suscripción Mensual de Limpieza', 'Visita mensual, limpieza profesional de módulos y revisión visual preventiva del sistema.', 25.00, 'mes', 'Suscripción', 4),
  ('00000000-0000-0000-0000-000000000005', 'Mantenimiento Semestral', '2 revisiones técnicas integrales al año con reapriete de terminales y chequeo de inversores.', 250.00, 'año', NULL, 5),
  ('00000000-0000-0000-0000-000000000006', 'Publicidad para Negocios', 'Promoción de negocio verde y difusión en redes aliadas de Convoltaje.', 125.00, NULL, NULL, 6)
ON CONFLICT (id) DO NOTHING;
