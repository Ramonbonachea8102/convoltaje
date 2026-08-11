-- ============================================================================
-- SCRIPT DE MIGRACIÓN DE SEGURIDAD Y POLÍTICAS RLS (CONVOLTAJE ERP/CRM)
-- ============================================================================

-- 1. FUNCIÓN AUXILIAR PARA OBTENER EL ROL DEL USUARIO AUTENTICADO
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
DECLARE
  user_role text;
BEGIN
  SELECT rol INTO user_role
  FROM public.perfiles
  WHERE id = auth.uid()
  LIMIT 1;

  RETURN COALESCE(user_role, 'anon');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. HABILITAR ROW LEVEL SECURITY (RLS) EN TODAS LAS TABLAS SENSIBLES
ALTER TABLE IF EXISTS public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ot_activity_log ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 3. POLÍTICAS RLS PARA LA TABLA PERFILES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Perfiles accesibles por usuarios autenticados" ON public.perfiles;
CREATE POLICY "Perfiles accesibles por usuarios autenticados"
  ON public.perfiles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON public.perfiles;
CREATE POLICY "Usuarios pueden actualizar su propio perfil"
  ON public.perfiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.get_user_role() IN ('admin', 'ceo'));

-- ----------------------------------------------------------------------------
-- 4. POLÍTICAS RLS PARA LA TABLA DEALS (ÓRDENES DE TRABAJO / OTs)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Deals visibles por personal autorizado" ON public.deals;
CREATE POLICY "Deals visibles por personal autorizado"
  ON public.deals FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() IN ('admin', 'ceo', 'contable', 'proyectista', 'comprador', 'designado', 'almacenero')
    OR (public.get_user_role() = 'comercial' AND sales_agent = auth.jwt()->>'email')
    OR (public.get_user_role() = 'tecnico' AND (substage ILIKE '%diagnostico%' OR substage ILIKE '%instalacion%'))
  );

DROP POLICY IF EXISTS "Deals insertables por comerciales y admins" ON public.deals;
CREATE POLICY "Deals insertables por comerciales y admins"
  ON public.deals FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() IN ('admin', 'ceo', 'comercial'));

DROP POLICY IF EXISTS "Deals actualizables según rol" ON public.deals;
CREATE POLICY "Deals actualizables según rol"
  ON public.deals FOR UPDATE
  TO authenticated
  USING (public.get_user_role() IN ('admin', 'ceo', 'comercial', 'tecnico', 'proyectista', 'almacenero'));

-- ----------------------------------------------------------------------------
-- 5. POLÍTICAS RLS STRICTAS PARA LA TABLA PAYMENTS (PAGOS Y FINANZAS)
-- ----------------------------------------------------------------------------
-- ⛔ TÉCNICOS, PROYECTISTAS Y ALMACENEROS TIENEN DENEGADO EL ACCESO A FINANZAS
DROP POLICY IF EXISTS "Pagos visibles solo por finanzas y comercial asignado" ON public.payments;
CREATE POLICY "Pagos visibles solo por finanzas y comercial asignado"
  ON public.payments FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() IN ('admin', 'ceo', 'contable')
    OR (
      public.get_user_role() = 'comercial' 
      AND deal_id IN (SELECT id FROM public.deals WHERE sales_agent = auth.jwt()->>'email')
    )
  );

DROP POLICY IF EXISTS "Pagos administrables por contabilidad y admin" ON public.payments;
CREATE POLICY "Pagos administrables por contabilidad y admin"
  ON public.payments FOR ALL
  TO authenticated
  USING (public.get_user_role() IN ('admin', 'ceo', 'contable'));

-- ----------------------------------------------------------------------------
-- 6. POLÍTICAS RLS PARA LA TABLA COMPLAINTS (GARANTÍAS Y QUEJAS)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Quejas visibles por técnicos, comerciales y admins" ON public.complaints;
CREATE POLICY "Quejas visibles por técnicos, comerciales y admins"
  ON public.complaints FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() IN ('admin', 'ceo', 'tecnico', 'comercial')
    OR assigned_tech_id = auth.uid()::text
  );

DROP POLICY IF EXISTS "Quejas actualizables por técnicos asignados y admin" ON public.complaints;
CREATE POLICY "Quejas actualizables por técnicos asignados y admin"
  ON public.complaints FOR UPDATE
  TO authenticated
  USING (
    public.get_user_role() IN ('admin', 'ceo')
    OR assigned_tech_id = auth.uid()::text
    OR public.get_user_role() = 'tecnico'
  );

-- ----------------------------------------------------------------------------
-- 7. POLÍTICAS RLS PARA LA TABLA REFUNDS (REINTEGROS)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Reintegros solo visibles por finanzas y comercial solicitante" ON public.refunds;
CREATE POLICY "Reintegros solo visibles por finanzas y comercial solicitante"
  ON public.refunds FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() IN ('admin', 'ceo', 'contable')
    OR requested_by = auth.uid()::text
  );

-- ----------------------------------------------------------------------------
-- 8. POLÍTICAS RLS PARA LOG DE ACTIVIDAD OT
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Log de actividad legible por usuarios autenticados" ON public.ot_activity_log;
CREATE POLICY "Log de actividad legible por usuarios autenticados"
  ON public.ot_activity_log FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Log de actividad insertable por usuarios autenticados" ON public.ot_activity_log;
CREATE POLICY "Log de actividad insertable por usuarios autenticados"
  ON public.ot_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
