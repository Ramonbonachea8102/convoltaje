-- ============================================================================
-- CONVOLTAJE ERP / CRM — MIGRATION 003: SUPERADMIN & PRIVATE AUTHORIZATION HELPERS
-- Fecha: 2026-10-05
-- Estado: LOCAL DRAFT ONLY (NO APLICAR REMOTAMENTE SIN APROBACIÓN EXPLÍCITA)
-- ============================================================================
--
-- PRINCIPIOS DE SEGURIDAD ESTRICTA:
-- 1. La fuente canónica de verdad para roles es exclusivamente `public.perfiles.rol`.
-- 2. No se confía en `raw_user_meta_data` (editable por el usuario).
-- 3. No se utiliza un OR permisivo y no verificado. Si se evalúa JWT `app_metadata`,
--    la prioridad canónica es la base de datos `public.perfiles`.
-- 4. Las funciones de validación residen en un esquema `private` (no expuesto a PostgREST).
-- 5. Las funciones usan `SECURITY DEFINER` con `search_path = ''` estricto para
--    prevenir ataques de secuestro de search_path (search_path hijacking).
-- 6. Se revoca explícitamente el privilegio EXECUTE al rol PUBLIC y se otorga
--    únicamente a los roles autenticados del sistema.
-- ============================================================================

-- 1. Crear el esquema privado si no existe
CREATE SCHEMA IF NOT EXISTS private;

-- Asegurar que el esquema privado no sea accesible públicamente por defecto
REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM anon;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT USAGE ON SCHEMA private TO service_role;

-- 2. Asegurar que la tabla `public.perfiles` admita el rol 'superadmin'
-- Verificamos si existe el constraint y lo actualizamos de forma segura.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'perfiles_rol_check' 
      AND table_name = 'perfiles'
  ) THEN
    ALTER TABLE public.perfiles DROP CONSTRAINT perfiles_rol_check;
  END IF;
END $$;

ALTER TABLE public.perfiles ADD CONSTRAINT perfiles_rol_check 
  CHECK (rol IN (
    'superadmin',
    'ceo',
    'director_marketing',
    'admin',
    'proyectista',
    'comercial',
    'director_tecnico',
    'tecnico',
    'transportista',
    'almacenero',
    'contable',
    'comprador',
    'designado',
    'cliente'
  ));

-- 3. Función canónica privada: Comprobar si el usuario es `superadmin`
CREATE OR REPLACE FUNCTION private.is_superadmin()
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
  -- Utiliza exclusivamente la columna canónica garantizada: `rol`
  SELECT p.rol INTO v_role
  FROM public.perfiles p
  WHERE p.id = v_uid AND p.activo = true;

  IF v_role = 'superadmin' THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- 4. Función canónica privada: Comprobar si el usuario puede gestionar ofertas
-- Roles autorizados explícitos: 'superadmin', 'admin', 'ceo'
CREATE OR REPLACE FUNCTION private.is_offer_manager()
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

  -- 1. Verificación canónica prioritaria en public.perfiles
  -- Utiliza exclusivamente la columna canónica garantizada: `rol`
  SELECT p.rol INTO v_role
  FROM public.perfiles p
  WHERE p.id = v_uid AND p.activo = true;

  IF v_role IN ('superadmin', 'admin', 'ceo') THEN
    RETURN true;
  END IF;

  -- 2. Verificación de service_role para operaciones administrativas de mantenimiento
  IF (SELECT auth.jwt() ->> 'role') = 'service_role' THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- 5. Restricción estricta de permisos de ejecución
REVOKE EXECUTE ON FUNCTION private.is_superadmin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION private.is_superadmin() FROM anon;
GRANT EXECUTE ON FUNCTION private.is_superadmin() TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_superadmin() TO service_role;

REVOKE EXECUTE ON FUNCTION private.is_offer_manager() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION private.is_offer_manager() FROM anon;
GRANT EXECUTE ON FUNCTION private.is_offer_manager() TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_offer_manager() TO service_role;
