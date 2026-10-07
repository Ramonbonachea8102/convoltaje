-- ============================================================================
-- CONVOLTAJE ERP / CRM — MIGRATION 007: HARDEN PERFILES RLS
-- Fecha: 2026-10-07
-- Estado: LOCAL DRAFT ONLY (NO APLICAR REMOTAMENTE SIN APROBACIÓN EXPLÍCITA)
-- ============================================================================
--
-- OBJETIVO DE SEGURIDAD (ZERO-TRUST PROFILE PRIVACY):
-- 1. Auditar e inspeccionar las políticas existentes en `public.perfiles`.
-- 2. Eliminar exclusivamente la política insegura `perfiles_lectura_publica`
--    que exponía perfiles activos (`activo = true`) al rol `anon`.
-- 3. Permitir que cualquier usuario autenticado lea únicamente su propio perfil (`auth.uid() = id`).
-- 4. Permitir que los administradores autorizados (`superadmin`, `admin`, `ceo`)
--    lean perfiles únicamente cuando el flujo de administración lo requiera.
-- 5. Revocar explícitamente cualquier acceso del rol `anon` a `public.perfiles`.
-- 6. Preservar la fuente de verdad canónica en `public.perfiles.rol` sin inventar
--    tablas adicionales (`admin_users`) ni columnas externas (`rol_id`).
-- 7. Prevenir recursión infinita en las políticas RLS mediante una función
--    `SECURITY DEFINER` en el esquema `private` con `SET search_path = ''`.
-- ============================================================================

-- 1. INSPECCIÓN PREVIA DE POLÍTICAS EXISTENTES EN public.perfiles
-- Este bloque informativo permite auditar en los logs de ejecución las políticas
-- actuales antes de aplicar cualquier modificación.
DO $$
DECLARE
  pol RECORD;
BEGIN
  RAISE NOTICE '=======================================================';
  RAISE NOTICE 'AUDITORÍA: Inspeccionando políticas activas en public.perfiles:';
  FOR pol IN (
    SELECT policyname, permissive, roles, cmd, qual
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'perfiles'
  ) LOOP
    RAISE NOTICE '  - Política encontrada: "%" | Comando: % | Roles: % | Expresión: %',
      pol.policyname, pol.cmd, pol.roles, pol.qual;
  END LOOP;
  RAISE NOTICE '=======================================================';
END $$;

-- 2. ASEGURAR EL ESQUEMA PRIVADO Y PERMISOS BASE
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM anon;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT USAGE ON SCHEMA private TO service_role;

-- 3. FUNCIÓN DE VALIDACIÓN ADMINISTRATIVA (ANTI-RECURSIÓN)
-- Consulta de forma segura la columna canónica `rol` en `public.perfiles`.
-- Al declararse SECURITY DEFINER y pertenecer al superusuario de la base de datos (postgres),
-- la consulta interna se ejecuta eludiendo RLS, evitando el bucle de recursión infinita
-- que ocurriría si la política RLS evaluara un SELECT sobre `public.perfiles` directamente.
CREATE OR REPLACE FUNCTION private.can_admin_read_profiles()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid;
  v_role text;
BEGIN
  v_uid := (SELECT auth.uid());
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;

  -- Consulta canónica a la tabla de perfiles en el esquema público
  SELECT p.rol INTO v_role
  FROM public.perfiles p
  WHERE p.id = v_uid AND p.activo = true;

  -- Roles administrativos autorizados para el flujo de gestión del equipo
  IF v_role IN ('superadmin', 'admin', 'ceo') THEN
    RETURN true;
  END IF;

  -- Autorizar a service_role para scripts o mantenimiento administrativo
  IF (SELECT auth.jwt() ->> 'role') = 'service_role' THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- Restricción estricta de privilegios de ejecución
REVOKE EXECUTE ON FUNCTION private.can_admin_read_profiles() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION private.can_admin_read_profiles() FROM anon;
GRANT EXECUTE ON FUNCTION private.can_admin_read_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_admin_read_profiles() TO service_role;

-- 4. ELIMINAR EXCLUSIVAMENTE LA POLÍTICA INSEGURA PÚBLICA
-- Elimina la política que otorgaba lectura pública a usuarios anónimos
DROP POLICY IF EXISTS "perfiles_lectura_publica" ON public.perfiles;

-- Limpieza preventiva de políticas nuevas si se re-ejecuta la migración
DROP POLICY IF EXISTS "perfiles_lectura_propia" ON public.perfiles;
DROP POLICY IF EXISTS "perfiles_lectura_admin" ON public.perfiles;

-- 5. POLÍTICAS RLS ENDURECIDAS
-- Asegurar que RLS esté activo en public.perfiles
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

-- A) Política: Cualquier usuario autenticado lee únicamente su propio perfil
CREATE POLICY "perfiles_lectura_propia"
ON public.perfiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- B) Política: Administradores autorizados (superadmin, admin, ceo) leen todos los perfiles
--    utilizando la función de seguridad no recursiva
CREATE POLICY "perfiles_lectura_admin"
ON public.perfiles
FOR SELECT
TO authenticated
USING (private.can_admin_read_profiles() = true);

-- 6. GESTIÓN ESTRICTA DE PRIVILEGIOS DE TABLA (ZERO-TRUST PRIVACY)
-- Revocación total de privilegios sobre public.perfiles para el rol anónimo
REVOKE ALL ON TABLE public.perfiles FROM anon;
REVOKE ALL ON TABLE public.perfiles FROM PUBLIC;

-- Concesión exclusiva de SELECT a usuarios autenticados y acceso completo a service_role
GRANT SELECT ON TABLE public.perfiles TO authenticated;
GRANT ALL ON TABLE public.perfiles TO service_role;

-- 7. AUDITORÍA POST-MIGRACIÓN
DO $$
DECLARE
  pol RECORD;
BEGIN
  RAISE NOTICE '=======================================================';
  RAISE NOTICE 'AUDITORÍA FINAL: Políticas vigentes en public.perfiles:';
  FOR pol IN (
    SELECT policyname, permissive, roles, cmd, qual
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'perfiles'
  ) LOOP
    RAISE NOTICE '  - Política activa: "%" | Comando: % | Roles: %',
      pol.policyname, pol.cmd, pol.roles;
  END LOOP;
  RAISE NOTICE '=======================================================';
END $$;
