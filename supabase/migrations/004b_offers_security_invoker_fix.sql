-- ============================================================================
-- CONVOLTAJE ERP / CRM — MIGRATION 004b: FIX SECURITY DEFINER VIEW IN OFFERS
-- Resuelve la advertencia del Supabase Security Advisor (0010_security_definer_view)
-- Estado: LOCAL DRAFT ONLY (NO APLICAR REMOTAMENTE SIN APROBACIÓN EXPLÍCITA)
-- ============================================================================

-- 1. Conceder privilegios SELECT a nivel de columna (excluyendo created_by y updated_by)
--    Cualquier consulta directa que intente pedir created_by o updated_by será rechazada por Postgres.
GRANT SELECT (
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
) ON public.offers TO anon, authenticated;

-- 2. Añadir política RLS en public.offers para lectura pública segura invocada por la vista
DROP POLICY IF EXISTS "Public users can view active and valid offers" ON public.offers;
CREATE POLICY "Public users can view active and valid offers"
  ON public.offers
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND start_date <= now()
    AND (end_date IS NULL OR end_date >= now())
  );

-- 3. Recrear la vista con security_invoker = true
--    Ahora la vista ejecuta con los permisos del usuario que la llama y respeta el RLS anterior.
CREATE OR REPLACE VIEW public.public_offers
WITH (security_invoker = true)
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

-- 4. Mantener privilegios de acceso a la vista
GRANT SELECT ON public.public_offers TO anon, authenticated;
