-- ============================================================================
-- SCRIPT DE MIGRACIÓN DE SEGURIDAD, TABLA DE ROLES Y POLÍTICAS RLS (CONVOLTAJE ERP/CRM)
-- ============================================================================

-- 1. TABLA DE ROLES Y REFERENCIA CLAVE FORÁNEA
CREATE TABLE IF NOT EXISTS public.roles (
  id text PRIMARY KEY,
  nombre text NOT NULL,
  descripcion text
);

-- Insertar los roles base del sistema si no existen
INSERT INTO public.roles (id, nombre, descripcion) VALUES
  ('admin', 'Administrador', 'Acceso total al sistema y gestión de usuarios'),
  ('ceo', 'CEO / Dirección', 'Dirección general y toma de decisiones'),
  ('comercial', 'Asesor Comercial', 'Gestión de clientes, cotizaciones y ventas'),
  ('tecnico', 'Técnico / Instalador', 'Instalación y diagnóstico técnico'),
  ('proyectista', 'Proyectista', 'Diseño técnico y levantamiento de proyectos'),
  ('transportista', 'Transportista / Logística', 'Despacho y entrega de equipamiento'),
  ('almacenero', 'Almacenero', 'Gestión de inventarios y traslados de material'),
  ('comprador', 'Comprador', 'Gestión de compras e insumos'),
  ('designado', 'Designado', 'Supervisión y asignaciones especiales')
ON CONFLICT (id) DO NOTHING;

-- Asegurar columna rol_id en la tabla perfiles con relación Foreign Key
ALTER TABLE public.perfiles 
  ADD COLUMN IF NOT EXISTS rol_id text REFERENCES public.roles(id) ON DELETE SET NULL;

-- Sincronizar rol_id existente si está en formato de texto 'rol'
UPDATE public.perfiles 
SET rol_id = rol 
WHERE rol_id IS NULL AND rol IS NOT NULL;

-- 2. FUNCIÓN DINÁMICA PARA OBTENER EL ROL DEL USUARIO AUTENTICADO DE FORMA SEGURA
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
DECLARE
  user_role text;
BEGIN
  SELECT r.id INTO user_role
  FROM public.perfiles p
  LEFT JOIN public.roles r ON p.rol_id = r.id OR p.rol = r.id
  WHERE p.id = auth.uid()
  LIMIT 1;

  RETURN COALESCE(user_role, 'anon');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. TABLAS DE FORMULARIOS PÚBLICOS (LEADS Y COTIZACIONES)
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  nombre text NOT NULL,
  telefono text NOT NULL,
  email text,
  tipo_compra text DEFAULT 'unitaria',
  direccion_instalacion text,
  fuente text DEFAULT 'calculadora_web',
  estado text DEFAULT 'nuevo'
);

CREATE TABLE IF NOT EXISTS public.quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  kit_nombre text NOT NULL,
  consumo_diario numeric,
  monto_total numeric NOT NULL,
  pdf_url text
);

-- 4. HABILITAR ROW LEVEL SECURITY (RLS) EN TODAS LAS TABLAS SENSIBLES
ALTER TABLE IF EXISTS public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ot_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.quotations ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 5. POLÍTICAS RLS PARA FORMULARIOS PÚBLICOS (LEADS Y COTIZACIONES)
-- 🔓 INSERCIÓN PÚBLICA PARA VISITANTES DE LA CALCULADORA WEB
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Permitir insercion publica de leads" ON public.leads;
CREATE POLICY "Permitir insercion publica de leads"
  ON public.leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Leads accesibles por personal comercial y admin" ON public.leads;
CREATE POLICY "Leads accesibles por personal comercial y admin"
  ON public.leads FOR SELECT
  TO authenticated
  USING (public.get_user_role() IN ('admin', 'ceo', 'comercial'));

DROP POLICY IF EXISTS "Permitir insercion publica de cotizaciones" ON public.quotations;
CREATE POLICY "Permitir insercion publica de cotizaciones"
  ON public.quotations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Cotizaciones accesibles por personal autenticado" ON public.quotations;
CREATE POLICY "Cotizaciones accesibles por personal autenticado"
  ON public.quotations FOR SELECT
  TO authenticated
  USING (public.get_user_role() IN ('admin', 'ceo', 'comercial', 'proyectista'));

-- ----------------------------------------------------------------------------
-- 6. POLÍTICAS RLS PARA TABLA ROLES Y PERFILES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Roles legibles por todos los usuarios" ON public.roles;
CREATE POLICY "Roles legibles por todos los usuarios"
  ON public.roles FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Perfiles accesibles por usuarios autenticados" ON public.perfiles;
CREATE POLICY "Perfiles accesibles por usuarios autenticados"
  ON public.perfiles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil o admins" ON public.perfiles;
CREATE POLICY "Usuarios pueden actualizar su propio perfil o admins"
  ON public.perfiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.get_user_role() IN ('admin', 'ceo'));

DROP POLICY IF EXISTS "Solo admins pueden insertar perfiles" ON public.perfiles;
CREATE POLICY "Solo admins pueden insertar perfiles"
  ON public.perfiles FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() IN ('admin', 'ceo'));

-- ----------------------------------------------------------------------------
-- 7. POLÍTICAS RLS PARA LA TABLA DEALS (ÓRDENES DE TRABAJO / OTs)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Permitir insercion publica de deals desde web" ON public.deals;
CREATE POLICY "Permitir insercion publica de deals desde web"
  ON public.deals FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Deals visibles por personal autorizado" ON public.deals;
CREATE POLICY "Deals visibles por personal autorizado"
  ON public.deals FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() IN ('admin', 'ceo', 'contable', 'proyectista', 'comprador', 'designado', 'almacenero')
    OR (public.get_user_role() = 'comercial' AND sales_agent = auth.jwt()->>'email')
    OR (public.get_user_role() = 'tecnico' AND (substage ILIKE '%diagnostico%' OR substage ILIKE '%instalacion%'))
  );

DROP POLICY IF EXISTS "Deals actualizables según rol" ON public.deals;
CREATE POLICY "Deals actualizables según rol"
  ON public.deals FOR UPDATE
  TO authenticated
  USING (public.get_user_role() IN ('admin', 'ceo', 'comercial', 'tecnico', 'proyectista', 'almacenero'));

-- ----------------------------------------------------------------------------
-- 8. POLÍTICAS RLS STRICTAS PARA LA TABLA PAYMENTS (PAGOS Y FINANZAS)
-- ⛔ TÉCNICOS, PROYECTISTAS Y ALMACENEROS TIENEN DENEGADO EL ACCESO A FINANZAS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Pagos visibles solo por finanzas y comercial asignado" ON public.payments;
CREATE POLICY "Pagos visibles solo por finanzas y comercial asignado"
  ON public.payments FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() IN ('admin', 'ceo', 'contable')
    OR (
      public.get_user_role() = 'comercial' 
      AND deal_id IN (SELECT id::text FROM public.deals WHERE sales_agent = auth.jwt()->>'email')
    )
  );

DROP POLICY IF EXISTS "Pagos administrables por contabilidad y admin" ON public.payments;
CREATE POLICY "Pagos administrables por contabilidad y admin"
  ON public.payments FOR ALL
  TO authenticated
  USING (public.get_user_role() IN ('admin', 'ceo', 'contable'));

-- ----------------------------------------------------------------------------
-- 9. POLÍTICAS RLS PARA REINTEGROS Y QUEJAS
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

DROP POLICY IF EXISTS "Reintegros solo visibles por finanzas y comercial solicitante" ON public.refunds;
CREATE POLICY "Reintegros solo visibles por finanzas y comercial solicitante"
  ON public.refunds FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() IN ('admin', 'ceo', 'contable')
    OR requested_by = auth.uid()::text
  );

-- ----------------------------------------------------------------------------
-- 10. POLÍTICAS RLS PARA LOG DE ACTIVIDAD OT
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
