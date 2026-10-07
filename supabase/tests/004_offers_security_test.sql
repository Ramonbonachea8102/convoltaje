-- ============================================================================
-- CONVOLTAJE ERP / CRM — STAGING VERIFICATION TEST SUITE
-- Archivo: supabase/tests/004_offers_security_test.sql
-- Propósito: Validar el modelo de seguridad Zero-Trust para Ofertas
-- Ejecución: En PostgreSQL aislado (ej. Supabase local / pg_prove / psql)
-- NOTA: Se ejecuta dentro de una transacción que hace ROLLBACK al final.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 0. PREPARACIÓN DE ENTORNOS DE PRUEBA (USUARIOS Y PERFILES EN STAGING)
-- ----------------------------------------------------------------------------
-- NOTA DE ARQUITECTURA:
-- En staging, public.perfiles.id tiene una llave foránea estricta a auth.users(id).
-- Para ejecutar estas pruebas de forma autónoma en una base de datos local o de pruebas,
-- primero creamos las identidades correspondientes en auth.users dentro de la transacción,
-- o permitimos mapear UUIDs de usuarios de staging preexistentes.

CREATE TEMP TABLE test_fixtures (
  superadmin_id UUID,
  regular_user_id UUID
);

-- Intentar usar usuarios preexistentes si están definidos en variables de sesión,
-- de lo contrario generar UUIDs deterministas para esta transacción de prueba.
INSERT INTO test_fixtures (superadmin_id, regular_user_id)
VALUES (
  COALESCE(NULLIF(current_setting('app.test_superadmin_id', true), '')::UUID, gen_random_uuid()),
  COALESCE(NULLIF(current_setting('app.test_regular_user_id', true), '')::UUID, gen_random_uuid())
);

-- Registrar identidades en auth.users si no existen (necesario para satisfacer FK en perfiles)
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, 
  email_confirmed_at, recovery_sent_at, last_sign_in_at, 
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, 
  confirmation_token, email_change, email_change_token_new, recovery_token
)
SELECT 
  superadmin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
  'superadmin.staging.test@convoltaje.com', '', now(), now(), now(), 
  '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
FROM test_fixtures
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, 
  email_confirmed_at, recovery_sent_at, last_sign_in_at, 
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, 
  confirmation_token, email_change, email_change_token_new, recovery_token
)
SELECT 
  regular_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
  'comercial.staging.test@convoltaje.com', '', now(), now(), now(), 
  '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
FROM test_fixtures
ON CONFLICT (id) DO NOTHING;

-- Crear o actualizar perfiles correspondientes en public.perfiles
INSERT INTO public.perfiles (id, email, nombre, rol, activo)
SELECT superadmin_id, 'superadmin.staging.test@convoltaje.com', 'Super Admin Staging Test', 'superadmin', true
FROM test_fixtures
ON CONFLICT (id) DO UPDATE SET rol = 'superadmin', activo = true;

INSERT INTO public.perfiles (id, email, nombre, rol, activo)
SELECT regular_user_id, 'comercial.staging.test@convoltaje.com', 'Comercial Staging Test', 'comercial', true
FROM test_fixtures
ON CONFLICT (id) DO UPDATE SET rol = 'comercial', activo = true;

-- ----------------------------------------------------------------------------
-- TEST 1: SUPERADMIN PUEDE GESTIONAR OFERTAS (FULL CRUD VÍA RPC)
-- ----------------------------------------------------------------------------

-- Simular sesión de superadmin autenticado
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', json_build_object(
  'sub', (SELECT superadmin_id FROM test_fixtures)::text,
  'role', 'authenticated'
)::text, true);

-- A) Crear oferta activa
SELECT public.admin_create_offer(
  json_build_object(
    'title', 'Kit Solar Pro 5kW Test',
    'description', 'Sistema de prueba con batería 10kWh',
    'original_price', 4500.00,
    'offer_price', 3999.00,
    'currency', 'USD',
    'badge_text', 'OFERTA VERIFICADA',
    'image_path', 'offers/test-kit-5kw.webp',
    'pdf_path', 'offers/test-kit-5kw.pdf',
    'is_active', true,
    'start_date', now() - interval '1 hour',
    'end_date', now() + interval '7 days',
    'sort_order', 1
  )::jsonb
);

-- B) Crear oferta expirada
SELECT public.admin_create_offer(
  json_build_object(
    'title', 'Oferta Pasada Vencida',
    'offer_price', 1500.00,
    'image_path', 'offers/expired.webp',
    'is_active', true,
    'start_date', now() - interval '10 days',
    'end_date', now() - interval '1 day',
    'sort_order', 2
  )::jsonb
);

-- C) Crear oferta inactiva (borrador)
SELECT public.admin_create_offer(
  json_build_object(
    'title', 'Oferta Inactiva Borrador',
    'offer_price', 2500.00,
    'image_path', 'offers/draft.webp',
    'is_active', false,
    'sort_order', 3
  )::jsonb
);

-- D) Verificar que admin_list_offers retorna las 3 ofertas con auditoría (created_by)
DO $$
DECLARE
  v_count INTEGER;
  v_created_by UUID;
  v_superadmin_id UUID;
BEGIN
  SELECT superadmin_id INTO v_superadmin_id FROM test_fixtures;

  SELECT count(*), min(created_by) INTO v_count, v_created_by
  FROM public.admin_list_offers();

  IF v_count != 3 THEN
    RAISE EXCEPTION 'Fallo TEST 1: Superadmin debería ver las 3 ofertas (activas, expiradas e inactivas). Obtenido: %', v_count;
  END IF;

  IF v_created_by != v_superadmin_id THEN
    RAISE EXCEPTION 'Fallo TEST 1: created_by debe ser el UID del superadmin (% vs %)', v_created_by, v_superadmin_id;
  END IF;

  RAISE NOTICE 'TEST 1 PASSED: Superadmin puede crear y listar todas las ofertas con auditoría completa.';
END;
$$;

-- ----------------------------------------------------------------------------
-- TEST 2: USUARIOS ANÓNIMOS SOLO LEEN OFERTAS ACTIVAS Y VIGENTES
--         Y NO TIENEN ACCESO A created_by NI updated_by
-- ----------------------------------------------------------------------------

SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claims', '{}', true);

-- A) Verificar que la vista pública solo muestra la oferta activa y vigente (1 de 3)
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT count(*) INTO v_count FROM public.public_offers;
  IF v_count != 1 THEN
    RAISE EXCEPTION 'Fallo TEST 2A: Usuario anónimo solo debe ver 1 oferta activa y vigente. Obtenido: %', v_count;
  END IF;

  RAISE NOTICE 'TEST 2A PASSED: Usuario anónimo solo lee ofertas activas y vigentes desde public_offers.';
END;
$$;

-- B) Verificar que el usuario anónimo no tiene acceso directo a public.offers
DO $$
DECLARE
  v_error_occurred BOOLEAN := false;
  v_sqlstate TEXT := '';
BEGIN
  BEGIN
    PERFORM * FROM public.offers;
  EXCEPTION
    WHEN insufficient_privilege THEN
      v_error_occurred := true;
      v_sqlstate := SQLSTATE;
  END;

  IF NOT v_error_occurred THEN
    RAISE EXCEPTION 'FALLO TEST 2B: Usuario anónimo pudo consultar public.offers directamente.';
  END IF;

  RAISE NOTICE 'TEST 2B PASSED: Acceso a public.offers bloqueado para anon (SQLSTATE %).', v_sqlstate;
END;
$$;

-- C) Verificar que el usuario anónimo no puede ejecutar los RPCs administrativos
DO $$
DECLARE
  v_error_occurred BOOLEAN := false;
  v_sqlstate TEXT := '';
BEGIN
  BEGIN
    PERFORM public.admin_list_offers();
  EXCEPTION
    WHEN insufficient_privilege THEN
      v_error_occurred := true;
      v_sqlstate := SQLSTATE;
  END;

  IF NOT v_error_occurred THEN
    RAISE EXCEPTION 'FALLO TEST 2C: Usuario anónimo pudo ejecutar admin_list_offers().';
  END IF;

  RAISE NOTICE 'TEST 2C PASSED: Ejecución de RPC bloqueada para anon (SQLSTATE %).', v_sqlstate;
END;
$$;

-- ----------------------------------------------------------------------------
-- TEST 3: USUARIO AUTENTICADO NO ADMINISTRADOR (ROL = 'comercial')
--         NO PUEDE LEER ADMINISTRATOR IDs NI ADMINISTRAR OFERTAS
-- ----------------------------------------------------------------------------

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', json_build_object(
  'sub', (SELECT regular_user_id FROM test_fixtures)::text,
  'role', 'authenticated'
)::text, true);

-- A) Verificar que usuario regular ve solo la oferta activa en public_offers
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT count(*) INTO v_count FROM public.public_offers;
  IF v_count != 1 THEN
    RAISE EXCEPTION 'Fallo TEST 3A: Usuario regular solo debe ver 1 oferta en public_offers. Obtenido: %', v_count;
  END IF;

  RAISE NOTICE 'TEST 3A PASSED: Usuario autenticado regular ve solo ofertas comerciales vigentes.';
END;
$$;

-- B) Verificar que usuario regular no puede leer public.offers directamente (REVOKE ALL)
DO $$
DECLARE
  v_error_occurred BOOLEAN := false;
  v_sqlstate TEXT := '';
BEGIN
  BEGIN
    PERFORM * FROM public.offers;
  EXCEPTION
    WHEN insufficient_privilege THEN
      v_error_occurred := true;
      v_sqlstate := SQLSTATE;
  END;

  IF NOT v_error_occurred THEN
    RAISE EXCEPTION 'FALLO TEST 3B: Usuario regular autenticado pudo leer public.offers directamente.';
  END IF;

  RAISE NOTICE 'TEST 3B PASSED: Acceso directo a public.offers bloqueado para usuario regular (SQLSTATE %).', v_sqlstate;
END;
$$;

-- C) Verificar que usuario regular es rechazado en admin_list_offers
DO $$
DECLARE
  v_error_occurred BOOLEAN := false;
  v_error_message TEXT := '';
BEGIN
  BEGIN
    PERFORM public.admin_list_offers();
  EXCEPTION
    WHEN OTHERS THEN
      v_error_occurred := true;
      v_error_message := SQLERRM;
  END;

  IF NOT v_error_occurred THEN
    RAISE EXCEPTION 'FALLO TEST 3C: Usuario regular pudo ejecutar admin_list_offers() sin error.';
  END IF;

  IF v_error_message NOT LIKE '%Access denied%' THEN
    RAISE EXCEPTION 'FALLO TEST 3C: admin_list_offers() falló con error inesperado: %', v_error_message;
  END IF;

  RAISE NOTICE 'TEST 3C PASSED: RPC admin_list_offers rechazó con Access denied: %', v_error_message;
END;
$$;

-- D) Verificar que usuario regular es rechazado en admin_create_offer
DO $$
DECLARE
  v_error_occurred BOOLEAN := false;
  v_error_message TEXT := '';
BEGIN
  BEGIN
    PERFORM public.admin_create_offer('{"title":"Intento no autorizado"}'::jsonb);
  EXCEPTION
    WHEN OTHERS THEN
      v_error_occurred := true;
      v_error_message := SQLERRM;
  END;

  IF NOT v_error_occurred THEN
    RAISE EXCEPTION 'FALLO TEST 3D: Usuario regular pudo crear ofertas sin error.';
  END IF;

  IF v_error_message NOT LIKE '%Access denied%' THEN
    RAISE EXCEPTION 'FALLO TEST 3D: admin_create_offer() falló con error inesperado: %', v_error_message;
  END IF;

  RAISE NOTICE 'TEST 3D PASSED: RPC admin_create_offer rechazó con Access denied: %', v_error_message;
END;
$$;

-- ----------------------------------------------------------------------------
-- TEST 4: SUPERADMIN PUEDE ACTUALIZAR Y ELIMINAR OFERTAS
--         VERIFICACIÓN EXCLUSIVA VÍA RPCs (NUNCA VÍA DIRECT SELECT EN offers)
-- ----------------------------------------------------------------------------

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', json_build_object(
  'sub', (SELECT superadmin_id FROM test_fixtures)::text,
  'role', 'authenticated'
)::text, true);

DO $$
DECLARE
  v_id UUID;
  v_superadmin_id UUID;
  v_updated_offer public.offers;
  v_found_count INTEGER;
  v_verified_price NUMERIC;
  v_verified_badge TEXT;
  v_verified_updated_by UUID;
BEGIN
  SELECT superadmin_id INTO v_superadmin_id FROM test_fixtures;

  -- 1. Obtener el ID de la oferta activa mediante admin_list_offers()
  SELECT id INTO v_id 
  FROM public.admin_list_offers() 
  WHERE title = 'Kit Solar Pro 5kW Test';

  IF v_id IS NULL THEN
    RAISE EXCEPTION 'Fallo TEST 4: No se encontró la oferta de prueba Kit Solar Pro 5kW Test vía admin_list_offers.';
  END IF;

  -- 2. Actualizar precio y badge mediante el RPC administrativo protegido
  v_updated_offer := public.admin_update_offer(
    v_id,
    json_build_object(
      'offer_price', 3799.00,
      'badge_text', 'PRECIO FINAL REBAJADO'
    )::jsonb
  );

  -- 3. Verificar el valor de retorno del RPC
  IF v_updated_offer.offer_price != 3799.00 OR v_updated_offer.badge_text != 'PRECIO FINAL REBAJADO' THEN
    RAISE EXCEPTION 'Fallo TEST 4: admin_update_offer no retornó los valores modificados esperados.';
  END IF;

  IF v_updated_offer.updated_by != v_superadmin_id THEN
    RAISE EXCEPTION 'Fallo TEST 4: updated_by retornado por admin_update_offer no coincide con superadmin.';
  END IF;

  -- 4. Verificar persistencia llamando a admin_list_offers() (NO por SELECT a public.offers)
  SELECT offer_price, badge_text, updated_by
  INTO v_verified_price, v_verified_badge, v_verified_updated_by
  FROM public.admin_list_offers()
  WHERE id = v_id;

  IF v_verified_price != 3799.00 OR v_verified_badge != 'PRECIO FINAL REBAJADO' OR v_verified_updated_by != v_superadmin_id THEN
    RAISE EXCEPTION 'Fallo TEST 4: admin_list_offers no refleja los datos actualizados.';
  END IF;

  -- 5. Eliminar la oferta mediante el RPC administrativo protegido
  PERFORM public.admin_delete_offer(v_id);

  -- 6. Confirmar eliminación consultando admin_list_offers()
  SELECT count(*) INTO v_found_count
  FROM public.admin_list_offers()
  WHERE id = v_id;

  IF v_found_count != 0 THEN
    RAISE EXCEPTION 'Fallo TEST 4: La oferta no fue eliminada; aún aparece en admin_list_offers.';
  END IF;

  RAISE NOTICE 'TEST 4 PASSED: Superadmin actualizó y eliminó ofertas verificado exclusivamente vía admin_list_offers().';
END;
$$;

-- ----------------------------------------------------------------------------
-- 5. FINALIZACIÓN Y ROLLBACK (LIMPIEZA TOTAL EN ENTORNO DE PRUEBAS)
-- ----------------------------------------------------------------------------
ROLLBACK;
