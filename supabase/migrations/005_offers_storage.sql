-- ============================================================================
-- CONVOLTAJE ERP / CRM — MIGRATION 005: OFFERS STORAGE BUCKET AND POLICIES
-- Fecha: 2026-10-05
-- Estado: LOCAL DRAFT ONLY (NO APLICAR REMOTAMENTE SIN APROBACIÓN EXPLÍCITA)
-- ============================================================================
--
-- ESPECIFICACIÓN DEL BUCKET:
-- 1. Nombre: `offers-assets`
-- 2. Modo: Público (public = true) para permitir la lectura directa de imágenes
--    y PDFs en la landing page pública sin generar URLs firmadas temporales.
-- 3. Límite de tamaño: 15 MB (15728640 bytes).
-- 4. Tipos MIME permitidos:
--    - image/jpeg
--    - image/png
--    - image/webp
--    - application/pdf
-- 5. Todas las políticas RLS incluyen explícitamente `bucket_id = 'offers-assets'`
--    para evitar cualquier colisión o fuga de permisos hacia otros buckets.
-- ============================================================================

-- 1. Registrar o actualizar la configuración del bucket en storage.buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'offers-assets',
  'offers-assets',
  true,
  15728640, -- 15 MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 15728640,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf'
  ];

-- 2. Limpieza de políticas previas de Storage para el bucket `offers-assets`
DROP POLICY IF EXISTS "Public can view offers assets" ON storage.objects;
DROP POLICY IF EXISTS "Authorized offer managers can upload offers assets" ON storage.objects;
DROP POLICY IF EXISTS "Authorized offer managers can update offers assets" ON storage.objects;
DROP POLICY IF EXISTS "Authorized offer managers can delete offers assets" ON storage.objects;

-- ----------------------------------------------------------------------------
-- POLÍTICAS DE ACCESO PARA storage.objects
-- ----------------------------------------------------------------------------

-- A) LECTURA PÚBLICA:
-- Cualquier usuario (anónimo o autenticado) puede leer archivos de este bucket.
CREATE POLICY "Public can view offers assets"
  ON storage.objects
  FOR SELECT
  TO public
  USING (
    bucket_id = 'offers-assets'
  );

-- B) SUBIDA / INSERCIÓN:
-- Exclusivo para usuarios autenticados con rol verificado por `private.is_offer_manager()`.
CREATE POLICY "Authorized offer managers can upload offers assets"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'offers-assets'
    AND private.is_offer_manager() = true
  );

-- C) ACTUALIZACIÓN / REEMPLAZO:
-- Exclusivo para usuarios autenticados con rol verificado por `private.is_offer_manager()`.
CREATE POLICY "Authorized offer managers can update offers assets"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'offers-assets'
    AND private.is_offer_manager() = true
  )
  WITH CHECK (
    bucket_id = 'offers-assets'
    AND private.is_offer_manager() = true
  );

-- D) ELIMINACIÓN:
-- Exclusivo para usuarios autenticados con rol verificado por `private.is_offer_manager()`.
CREATE POLICY "Authorized offer managers can delete offers assets"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'offers-assets'
    AND private.is_offer_manager() = true
  );
