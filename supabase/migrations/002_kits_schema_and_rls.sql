-- ============================================================================
-- CONVOLTAJE ERP / CRM — MIGRATION 002: KITS SOLARES Y POLÍTICAS RLS
-- Fecha: 2026-09-29
-- Descripción:
--   1. Tabla `public.kits` con UUID, nombre, categoría, imagen, componentes y precio.
--   2. Bucket de Supabase Storage `kit-images` para fotos de portada.
--   3. Políticas RLS:
--      - Acceso SELECT público (anon y autenticados) para la web y catálogo.
--      - Control CRUD completo (INSERT, UPDATE, DELETE) para administradores autenticados.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABLA DE KITS SOLARES DINÁMICOS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  image_url TEXT,
  components JSONB DEFAULT '[]'::jsonb,
  price NUMERIC NOT NULL CHECK (price >= 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para optimización de consultas
CREATE INDEX IF NOT EXISTS idx_kits_category ON public.kits(category);
CREATE INDEX IF NOT EXISTS idx_kits_created_at ON public.kits(created_at DESC);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.kits ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 2. POLÍTICAS RLS PARA LA TABLA `kits`
-- ----------------------------------------------------------------------------

-- Limpiar políticas anteriores si existiesen
DROP POLICY IF EXISTS "Public (anon) and authenticated can view kits" ON public.kits;
DROP POLICY IF EXISTS "Admins have full CRUD access to kits" ON public.kits;
DROP POLICY IF EXISTS "Admins can insert kits" ON public.kits;
DROP POLICY IF EXISTS "Admins can update kits" ON public.kits;
DROP POLICY IF EXISTS "Admins can delete kits" ON public.kits;

-- A) LECTURA PÚBLICA (Pública para usuarios anónimos y clientes en la web)
CREATE POLICY "Public (anon) and authenticated can view kits"
ON public.kits
FOR SELECT
USING (true);

-- B) INSERCIÓN: Exclusiva para administradores / dirección
CREATE POLICY "Admins can insert kits"
ON public.kits
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.jwt() ->> 'role' = 'service_role')
  OR EXISTS (
    SELECT 1 FROM public.perfiles
    WHERE public.perfiles.id = (SELECT auth.uid())
      AND public.perfiles.activo = true
      AND public.perfiles.rol IN ('admin', 'ceo', 'director_marketing')
  )
);

-- C) ACTUALIZACIÓN: Exclusiva para administradores / dirección
CREATE POLICY "Admins can update kits"
ON public.kits
FOR UPDATE
TO authenticated
USING (
  (auth.jwt() ->> 'role' = 'service_role')
  OR EXISTS (
    SELECT 1 FROM public.perfiles
    WHERE public.perfiles.id = (SELECT auth.uid())
      AND public.perfiles.activo = true
      AND public.perfiles.rol IN ('admin', 'ceo', 'director_marketing')
  )
)
WITH CHECK (
  (auth.jwt() ->> 'role' = 'service_role')
  OR EXISTS (
    SELECT 1 FROM public.perfiles
    WHERE public.perfiles.id = (SELECT auth.uid())
      AND public.perfiles.activo = true
      AND public.perfiles.rol IN ('admin', 'ceo', 'director_marketing')
  )
);

-- D) ELIMINACIÓN: Exclusiva para administradores / dirección
CREATE POLICY "Admins can delete kits"
ON public.kits
FOR DELETE
TO authenticated
USING (
  (auth.jwt() ->> 'role' = 'service_role')
  OR EXISTS (
    SELECT 1 FROM public.perfiles
    WHERE public.perfiles.id = (SELECT auth.uid())
      AND public.perfiles.activo = true
      AND public.perfiles.rol IN ('admin', 'ceo', 'director_marketing')
  )
);

-- ----------------------------------------------------------------------------
-- 3. STORAGE BUCKET: `kit-images` (Fotos de portada y equipos)
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kit-images',
  'kit-images',
  true,
  5242880, -- Límite de 5 MB por archivo
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

-- Limpiar políticas previas de storage para este bucket
DROP POLICY IF EXISTS "Public can view kit cover photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload kit cover photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update kit cover photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete kit cover photos" ON storage.objects;

-- A) Lectura pública de las fotos de los kits
CREATE POLICY "Public can view kit cover photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'kit-images');

-- B) Subida autorizada para administradores
CREATE POLICY "Admins can upload kit cover photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'kit-images'
  AND (
    (auth.jwt() ->> 'role' = 'service_role')
    OR EXISTS (
      SELECT 1 FROM public.perfiles
      WHERE public.perfiles.id = (SELECT auth.uid())
        AND public.perfiles.activo = true
        AND public.perfiles.rol IN ('admin', 'ceo', 'director_marketing')
    )
  )
);

-- C) Actualización autorizada para administradores
CREATE POLICY "Admins can update kit cover photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'kit-images'
  AND (
    (auth.jwt() ->> 'role' = 'service_role')
    OR EXISTS (
      SELECT 1 FROM public.perfiles
      WHERE public.perfiles.id = (SELECT auth.uid())
        AND public.perfiles.activo = true
        AND public.perfiles.rol IN ('admin', 'ceo', 'director_marketing')
    )
  )
);

-- D) Eliminación autorizada para administradores
CREATE POLICY "Admins can delete kit cover photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'kit-images'
  AND (
    (auth.jwt() ->> 'role' = 'service_role')
    OR EXISTS (
      SELECT 1 FROM public.perfiles
      WHERE public.perfiles.id = (SELECT auth.uid())
        AND public.perfiles.activo = true
        AND public.perfiles.rol IN ('admin', 'ceo', 'director_marketing')
    )
  )
);

-- ----------------------------------------------------------------------------
-- 4. KITS INICIALES DE CONVOLTAJE (SEED DE RESPALDO)
-- ----------------------------------------------------------------------------
INSERT INTO public.kits (id, name, category, image_url, components, price)
SELECT 
  'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'::uuid,
  'Sistema Básico - 1500W',
  'Residencial',
  '/images/logoconvoltaje.jpg',
  '["Inversor Onda Pura MUST 1.5kW", "2 Paneles Solares Monocristalinos 450W", "1 Batería Ciclo Profundo Gel 12V 200Ah", "Estructura de montaje coplanar para techo", "Kit de protecciones AC/DC + cable solar 4mm"]'::jsonb,
  1745
WHERE NOT EXISTS (SELECT 1 FROM public.kits WHERE name = 'Sistema Básico - 1500W');

INSERT INTO public.kits (id, name, category, image_url, components, price)
SELECT 
  'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e'::uuid,
  'Sistema Solar Medio - 3000W',
  'Residencial',
  '/images/kit-10kw-equipo.jpg',
  '["Inversor Híbrido MUST 3kW 24V", "4 Paneles Solares Monocristalinos 550W Tier 1", "1 Batería LiFePO4 MUST 5.1kWh", "Estructura de aluminio anodizado reforzada", "Caja de protecciones completa + monitoreo WiFi"]'::jsonb,
  3850
WHERE NOT EXISTS (SELECT 1 FROM public.kits WHERE name = 'Sistema Solar Medio - 3000W');

INSERT INTO public.kits (id, name, category, image_url, components, price)
SELECT 
  'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f'::uuid,
  'Sistema 6K PLUS',
  'Comercial',
  '/images/kit-10kw-equipo.jpg',
  '["Inversor Híbrido MUST 6kW 48V split-phase", "8 Paneles Solares Alta Eficiencia 550W", "Batería LiFePO4 MUST 15kWh de pared", "Estructura de montaje en aluminio sobre cubierta", "Interruptor de transferencia automática (ATS) + protecciones"]'::jsonb,
  6950
WHERE NOT EXISTS (SELECT 1 FROM public.kits WHERE name = 'Sistema 6K PLUS');
