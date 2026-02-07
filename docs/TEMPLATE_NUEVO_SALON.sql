-- =========================================
-- TEMPLATE: CREAR NUEVO SALÓN EN KORAT
-- =========================================
-- 
-- USO: Cuando llegue un nuevo cliente, copia este archivo,
-- reemplaza los valores marcados con 👈 y ejecuta en Supabase.
--
-- PASOS:
-- 1. Ejecuta PASO 1 y guarda el UUID que devuelve
-- 2. Reemplaza 'NUEVO_UUID' en todos los demás pasos
-- 3. Ejecuta los pasos restantes
-- =========================================


-- =========================================
-- PASO 1: CREAR EL NEGOCIO
-- =========================================
INSERT INTO negocios (
  slug,
  nombre,
  plan,
  whatsapp_phone_id,
  whatsapp_token,
  ubicacion,
  telefono,
  hora_apertura,
  hora_cierre,
  dias_trabajo,
  instagram
) VALUES (
  'nuevo-salon',                  -- 👈 slug único (sin espacios, minúsculas)
  'Nombre del Salón',             -- 👈 nombre visible
  'Pro',                          -- plan: 'Starter' o 'Pro'
  'PHONE_NUMBER_ID',              -- 👈 de Meta Business
  'ACCESS_TOKEN',                 -- 👈 de Meta Business
  'Dirección del local',          -- 👈 dirección
  '+51999999999',                 -- 👈 teléfono
  '09:00',                        -- hora apertura
  '20:00',                        -- hora cierre
  ARRAY['lunes','martes','miércoles','jueves','viernes','sábado'],
  '@instagram'                    -- 👈 instagram
)
RETURNING id;

-- ⚠️ GUARDA EL UUID QUE DEVUELVE
-- Ejemplo: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
-- Reemplaza 'NUEVO_UUID' en los siguientes queries


-- =========================================
-- PASO 2: CREAR USUARIO ADMIN
-- =========================================
INSERT INTO "Usuarios" (
  nombre_persona,
  nombre_negocio,
  email,
  password,
  role,
  plan,
  business_id
) VALUES (
  'Nombre Dueño/a',               -- 👈 nombre del admin
  'Nombre del Salón',             -- 👈 nombre del negocio
  'admin@salon.com',              -- 👈 email de login
  'password123',                  -- 👈 contraseña (cambiar en producción)
  'Admin',
  'Pro',
  'NUEVO_UUID'                    -- 👈 UUID del paso 1
);


-- =========================================
-- PASO 3: AGREGAR SERVICIOS
-- =========================================
-- Ajusta según los servicios reales del salón

INSERT INTO servicios (nombre, precio, duracion, categoria, business_id)
VALUES 
  ('Servicio 1', 50.00, 60, 'Categoría', 'NUEVO_UUID'),
  ('Servicio 2', 80.00, 90, 'Categoría', 'NUEVO_UUID'),
  ('Servicio 3', 120.00, 120, 'Categoría', 'NUEVO_UUID');


-- =========================================
-- PASO 4: AGREGAR STAFF
-- =========================================
INSERT INTO staff (nombre, rol, especialidad, business_id)
VALUES 
  ('Nombre 1', 'Rol', 'Especialidad', 'NUEVO_UUID'),
  ('Nombre 2', 'Rol', 'Especialidad', 'NUEVO_UUID');


-- =========================================
-- PASO 5: AGREGAR CLIENTES (OPCIONAL)
-- =========================================
-- Solo si el salón ya tiene clientes para migrar

INSERT INTO "Clientes" (nombre, telefono, business_id)
VALUES 
  ('Cliente 1', '+51900000001', 'NUEVO_UUID'),
  ('Cliente 2', '+51900000002', 'NUEVO_UUID');


-- =========================================
-- VERIFICACIÓN
-- =========================================
-- Ejecuta esto para confirmar que todo está bien:

SELECT 'Negocio' as tipo, COUNT(*) as total FROM negocios WHERE id = 'NUEVO_UUID'
UNION ALL
SELECT 'Usuarios', COUNT(*) FROM "Usuarios" WHERE business_id = 'NUEVO_UUID'
UNION ALL
SELECT 'Servicios', COUNT(*) FROM servicios WHERE business_id = 'NUEVO_UUID'
UNION ALL
SELECT 'Staff', COUNT(*) FROM staff WHERE business_id = 'NUEVO_UUID'
UNION ALL
SELECT 'Clientes', COUNT(*) FROM "Clientes" WHERE business_id = 'NUEVO_UUID';
