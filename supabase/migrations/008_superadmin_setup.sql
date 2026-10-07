-- ============================================================================
-- CONVOLTAJE ERP / CRM — MIGRATION 008: SUPERADMIN CONFIGURATION & SEEDING
-- Fecha: 2026-10-07
-- Proyecto: vteasylxooahvvqvzrjm (Producción Convoltaje)
-- ============================================================================
--
-- OBJETIVO:
-- 1. Asegurar la infraestructura de autorización canónica en `public.perfiles` con rol 'superadmin'.
-- 2. Garantizar la existencia del esquema `private` y funciones de validación seguras (`private.is_superadmin()`).
-- 3. Exponer el wrapper `public.is_super_admin()` para interoperabilidad total.
-- 4. Crear trigger para sincronizar automáticamente el rol canónico de `public.perfiles`
--    hacia `auth.users.raw_app_meta_data -> role` garantizando el rol en el JWT.
-- 5. Configurar y vincular las 3 cuentas de Super Administradores en Supabase Auth y `public.perfiles`:
--    - zaratos290496@gmail.com (Super Administrador)
--    - angeleduardoc706@gmail.com (CEO / Dueño)
--    - reviewstoptravelgroup@gmail.com (Super Administrador)
-- ============================================================================

-- 1. Esquema privado y permisos base
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM anon;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT USAGE ON SCHEMA private TO service_role;

-- 2. Asegurar que public.perfiles admita el rol 'superadmin'
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

-- 3. Funciones canónicas de validación de privilegios
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

  SELECT p.rol INTO v_role
  FROM public.perfiles p
  WHERE p.id = v_uid AND p.activo = true;

  IF v_role = 'superadmin' THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.is_superadmin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION private.is_superadmin() FROM anon;
GRANT EXECUTE ON FUNCTION private.is_superadmin() TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_superadmin() TO service_role;

-- Wrapper de conveniencia pública
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT private.is_superadmin();
$$;

REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO service_role;

-- 4. Trigger de sincronización de rol hacia app_metadata en auth.users
CREATE OR REPLACE FUNCTION public.sync_profile_role_to_app_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', NEW.rol)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_role ON public.perfiles;
CREATE TRIGGER trg_sync_profile_role
AFTER INSERT OR UPDATE OF rol ON public.perfiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_role_to_app_metadata();

-- 5. Políticas de seguridad en public.perfiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'perfiles' AND policyname = 'perfiles_actualizacion_propia'
  ) THEN
    CREATE POLICY "perfiles_actualizacion_propia"
    ON public.perfiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'perfiles' AND policyname = 'perfiles_superadmin_all'
  ) THEN
    CREATE POLICY "perfiles_superadmin_all"
    ON public.perfiles
    FOR ALL
    TO authenticated
    USING (private.is_superadmin() = true)
    WITH CHECK (private.is_superadmin() = true);
  END IF;
END $$;

-- 6. Provisionamiento de las cuentas de Super Admin
DO $$
DECLARE
  v_users RECORD;
  v_uid UUID;
  v_temp_pwd_hash TEXT;
BEGIN
  v_temp_pwd_hash := extensions.crypt('Convoltaje2026!Admin', extensions.gen_salt('bf'));

  FOR v_users IN (
    SELECT * FROM (VALUES
      ('zaratos290496@gmail.com', 'Zaratos', 'Super Administrador'),
      ('angeleduardoc706@gmail.com', 'Ángel Eduardo', 'CEO / Dueño'),
      ('reviewstoptravelgroup@gmail.com', 'Reviews Top Travel', 'Super Administrador')
    ) AS t(email, nombre, descripcion_corta)
  ) LOOP
    -- A) Crear o actualizar en auth.users
    SELECT id INTO v_uid FROM auth.users WHERE email = v_users.email;

    IF v_uid IS NULL THEN
      v_uid := gen_random_uuid();
      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_sso_user,
        is_anonymous,
        created_at,
        updated_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000000'::uuid,
        v_uid,
        'authenticated',
        'authenticated',
        v_users.email,
        v_temp_pwd_hash,
        now(),
        '{"provider": "email", "providers": ["email"], "role": "superadmin"}'::jsonb,
        jsonb_build_object('nombre', v_users.nombre, 'role', 'superadmin'),
        false,
        false,
        now(),
        now()
      );
    ELSE
      UPDATE auth.users
      SET
        encrypted_password = v_temp_pwd_hash,
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"provider": "email", "providers": ["email"], "role": "superadmin"}'::jsonb,
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('nombre', v_users.nombre, 'role', 'superadmin'),
        updated_at = now()
      WHERE id = v_uid;
    END IF;

    -- B) Asegurar identidad en auth.identities
    IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_uid AND provider = 'email') THEN
      INSERT INTO auth.identities (
        id,
        user_id,
        provider_id,
        identity_data,
        provider,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        v_uid,
        v_uid::text,
        jsonb_build_object('sub', v_uid::text, 'email', v_users.email),
        'email',
        now(),
        now()
      );
    ELSE
      UPDATE auth.identities
      SET
        identity_data = jsonb_build_object('sub', v_uid::text, 'email', v_users.email),
        updated_at = now()
      WHERE user_id = v_uid AND provider = 'email';
    END IF;

    -- C) Crear o actualizar perfil canónico en public.perfiles
    INSERT INTO public.perfiles (
      id,
      nombre,
      email,
      rol,
      activo,
      descripcion_corta,
      created_at,
      updated_at
    ) VALUES (
      v_uid,
      v_users.nombre,
      v_users.email,
      'superadmin',
      true,
      v_users.descripcion_corta,
      now(),
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      nombre = EXCLUDED.nombre,
      email = EXCLUDED.email,
      rol = 'superadmin',
      activo = true,
      descripcion_corta = EXCLUDED.descripcion_corta,
      updated_at = now();

  END LOOP;
END $$;
