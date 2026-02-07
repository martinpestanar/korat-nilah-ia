-- ============================================
-- FIX TABLES STRUCTURE - Multi-Tenancy
-- Ejecutar en orden en Supabase SQL Editor
-- ============================================

-- ============================================
-- PASO 1: Simplificar tabla NEGOCIOS
-- Solo campos esenciales (el resto va en negocio_info)
-- ============================================

-- Primero ver qué columnas tiene actualmente
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'negocios';

-- Eliminar columnas duplicadas que ya existen en negocio_info
-- (ajusta según las columnas que realmente tengas)
ALTER TABLE negocios DROP COLUMN IF EXISTS direccion;
ALTER TABLE negocios DROP COLUMN IF EXISTS telefono;
ALTER TABLE negocios DROP COLUMN IF EXISTS horarios;
ALTER TABLE negocios DROP COLUMN IF EXISTS whatsapp;
ALTER TABLE negocios DROP COLUMN IF EXISTS instagram;
ALTER TABLE negocios DROP COLUMN IF EXISTS facebook;
ALTER TABLE negocios DROP COLUMN IF EXISTS tiktok;
ALTER TABLE negocios DROP COLUMN IF EXISTS website;
ALTER TABLE negocios DROP COLUMN IF EXISTS logo_url;
ALTER TABLE negocios DROP COLUMN IF EXISTS descripcion;

-- La tabla negocios debería quedar con solo:
-- id (UUID, PK)
-- nombre (text) 
-- plan (text)
-- activo (boolean)
-- created_at (timestamp)

-- ============================================
-- PASO 2: Agregar business_id a negocio_info
-- ============================================

-- Agregar columna si no existe
ALTER TABLE negocio_info ADD COLUMN IF NOT EXISTS business_id UUID;

-- Crear foreign key
ALTER TABLE negocio_info 
  DROP CONSTRAINT IF EXISTS negocio_info_business_id_fkey;
  
ALTER TABLE negocio_info 
  ADD CONSTRAINT negocio_info_business_id_fkey 
  FOREIGN KEY (business_id) REFERENCES negocios(id);

-- ============================================
-- PASO 3: Migrar datos existentes
-- Asignar todas las filas al negocio existente
-- ============================================

-- Primero obtener el ID del negocio (ejecuta esto para ver el ID)
-- SELECT id, nombre FROM negocios LIMIT 5;

-- Luego actualiza (reemplaza con tu business_id real)
UPDATE negocio_info 
SET business_id = '10db8ed7-fa79-4092-9bae-760fdad03c75'
WHERE business_id IS NULL;

-- Hacer NOT NULL después de migrar
-- ALTER TABLE negocio_info ALTER COLUMN business_id SET NOT NULL;

-- ============================================
-- PASO 4: RLS para negocio_info
-- ============================================

ALTER TABLE negocio_info ENABLE ROW LEVEL SECURITY;

-- Eliminar política existente si hay
DROP POLICY IF EXISTS "negocio_info_tenant_isolation" ON negocio_info;

-- Crear política de aislamiento
CREATE POLICY "negocio_info_tenant_isolation" ON negocio_info
  FOR ALL 
  USING (business_id = current_setting('app.current_tenant', true)::uuid);

-- ============================================
-- PASO 5: Verificar estructura final
-- ============================================

-- Ver estructura de negocios
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'negocios'
ORDER BY ordinal_position;

-- Ver estructura de usuarios
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'usuarios'
ORDER BY ordinal_position;

-- Ver estructura de negocio_info
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'negocio_info'
ORDER BY ordinal_position;

-- ============================================
-- RESUMEN DE ESTRUCTURA FINAL
-- ============================================
/*
NEGOCIOS (tenant/empresa)
├── id (UUID, PK)
├── nombre (text)
├── plan (text) - Starter, Pro, Enterprise
├── activo (boolean)
└── created_at (timestamp)

USUARIOS (personas que acceden)
├── id (int8, PK)
├── nombre_persona (text)
├── nombre_negocio (text) -- puede eliminarse, usar JOIN
├── email (text, unique)
├── password (text)
├── plan (text) -- puede eliminarse, usar JOIN con negocios
├── business_id (UUID, FK -> negocios.id)
├── role (text) - Admin, Staff
├── token_secreto (text)
└── perm_view_all_appointments (bool)

NEGOCIO_INFO (configuración flexible)
├── id (int4, PK)
├── clave (text) - ubicacion_contacto, horarios, Promociones Uñas, etc.
├── valor_texto (text)
├── valor_img (text) - URL de imagen
├── valor_video (text) - URL de video
├── descripcion (text)
└── business_id (UUID, FK -> negocios.id) -- NUEVO
*/
