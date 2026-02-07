-- ============================================
-- UPDATE: Crear Cita Segura V2 (con staff_id y categoria)
-- ============================================
-- Ejecutar este script COMPLETO en Supabase SQL Editor

-- 1. Asegurar que las columnas existen
ALTER TABLE "Citas" ADD COLUMN IF NOT EXISTS staff_id INTEGER;
ALTER TABLE "Citas" ADD COLUMN IF NOT EXISTS categoria TEXT;

-- 2. Eliminar funciones anteriores para evitar conflictos de firma
DROP FUNCTION IF EXISTS crear_cita_segura;
DROP FUNCTION IF EXISTS actualizar_cita_segura;

-- 2.5 ELIMINAR RESTRICCIONES DE CLAVE ÚNICA EN CITAS (CRÍTICO)
-- Esto permite que coexistan citas a la misma hora para diferentes staffs/categorías.
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT constraint_name 
              FROM information_schema.table_constraints 
              WHERE table_name = 'Citas' AND constraint_type = 'UNIQUE') 
    LOOP
        -- Usar format() y %I para manejar correctamente mayúsculas/minúsculas y caracteres especiales
        EXECUTE format('ALTER TABLE "Citas" DROP CONSTRAINT %I', r.constraint_name);
        RAISE NOTICE 'Restricción eliminada: %', r.constraint_name;
    END LOOP;
END $$;

-- 3. Crear función actualizada con nuevos parámetros
CREATE OR REPLACE FUNCTION crear_cita_segura(
    p_business_id UUID,
    p_fecha TIMESTAMPTZ,
    p_duracion_min INTEGER,
    p_cliente_id BIGINT,
    p_nombre TEXT,
    p_servicio TEXT,
    p_precio FLOAT DEFAULT 0,
    p_staff_id INTEGER DEFAULT NULL,
    p_categoria TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_fecha_fin TIMESTAMPTZ;
    v_conflicto BOOLEAN;
    v_new_id BIGINT;
BEGIN
    -- Calcular hora de fin
    v_fecha_fin := p_fecha + (p_duracion_min || ' minutes')::INTERVAL;
    
    -- LOCK: Bloquear filas conflictivas primero
    PERFORM 1
    FROM "Citas" c
    WHERE c.business_id = p_business_id
      AND c.estado NOT IN ('Cancelada', 'No-Show')
      AND (
          (p_fecha >= c.fecha AND p_fecha < c.fecha + INTERVAL '60 minutes')
          OR
          (v_fecha_fin > c.fecha AND v_fecha_fin <= c.fecha + INTERVAL '60 minutes')
          OR
          (p_fecha <= c.fecha AND v_fecha_fin >= c.fecha + INTERVAL '60 minutes')
      )
    FOR UPDATE;
    
    -- Verificar conflictos (ignorar staff_id para bloqueo 'duro' por ahora, o mejorar lógica después)
    -- Por ahora mantenemos la lógica de que un horario es un recurso bloqueante del negocio general
    SELECT EXISTS (
        SELECT 1 FROM "Citas" c
        WHERE c.business_id = p_business_id
          AND c.estado NOT IN ('Cancelada', 'No-Show')
          -- Nueva Lógica: Verificar conflicto solo si es el mismo staff o misma categoría (si no hay staff)
          AND (
            (p_staff_id IS NOT NULL AND c.staff_id = p_staff_id)
            OR
            (p_staff_id IS NULL AND c.categoria IS NOT DISTINCT FROM p_categoria)
          )
          AND (
              (p_fecha >= c.fecha AND p_fecha < c.fecha + INTERVAL '60 minutes')
              OR
              (v_fecha_fin > c.fecha AND v_fecha_fin <= c.fecha + INTERVAL '60 minutes')
              OR
              (p_fecha <= c.fecha AND v_fecha_fin >= c.fecha + INTERVAL '60 minutes')
          )
    ) INTO v_conflicto;
    
    IF v_conflicto THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'CONFLICT',
            'message', 'Este horario ya está ocupado'
        );
    END IF;
    
    -- Insertar cita con nuevos campos
    INSERT INTO "Citas" (business_id, fecha, cliente, nombre, servicio, precio, estado, staff_id, categoria)
    VALUES (p_business_id, p_fecha, p_cliente_id, p_nombre, p_servicio, p_precio, 'Pendiente', p_staff_id, p_categoria)
    RETURNING id INTO v_new_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'id', v_new_id,
        'message', 'Cita creada exitosamente'
    );

EXCEPTION WHEN unique_violation THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', 'CONFLICT',
        'message', 'Este horario acaba de ser reservado'
    );
END;
$$;

-- 4. Actualizar función de edición también
CREATE OR REPLACE FUNCTION actualizar_cita_segura(
    p_business_id UUID,
    p_cita_id BIGINT,
    p_nueva_fecha TIMESTAMPTZ DEFAULT NULL,
    p_duracion_min INTEGER DEFAULT 60,
    p_nuevo_servicio TEXT DEFAULT NULL,
    p_nuevo_precio FLOAT DEFAULT NULL,
    p_nuevo_estado TEXT DEFAULT NULL,
    p_nuevo_staff_id INTEGER DEFAULT NULL,
    p_nueva_categoria TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_cita_actual RECORD;
    v_fecha_fin TIMESTAMPTZ;
    v_conflicto BOOLEAN;
BEGIN
    SELECT * INTO v_cita_actual 
    FROM "Citas" 
    WHERE id = p_cita_id AND business_id = p_business_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'NOT_FOUND', 'message', 'Cita no encontrada');
    END IF;
    
    IF p_nueva_fecha IS NOT NULL AND p_nueva_fecha != v_cita_actual.fecha THEN
        v_fecha_fin := p_nueva_fecha + (p_duracion_min || ' minutes')::INTERVAL;
        
        PERFORM 1 FROM "Citas" c
        WHERE c.business_id = p_business_id AND c.id != p_cita_id
          AND c.estado NOT IN ('Cancelada', 'No-Show', 'Reagendada')
          AND ((p_nueva_fecha >= c.fecha AND p_nueva_fecha < c.fecha + INTERVAL '60 minutes')
          OR (v_fecha_fin > c.fecha AND v_fecha_fin <= c.fecha + INTERVAL '60 minutes'))
        FOR UPDATE;
        
        SELECT EXISTS (
            SELECT 1 FROM "Citas" c
            WHERE c.business_id = p_business_id AND c.id != p_cita_id
              AND c.estado NOT IN ('Cancelada', 'No-Show', 'Reagendada')
              -- Nueva Lógica: Verificar conflicto solo si es el mismo staff o misma categoría
              AND (
                ((COALESCE(p_nuevo_staff_id, v_cita_actual.staff_id) IS NOT NULL) AND c.staff_id = COALESCE(p_nuevo_staff_id, v_cita_actual.staff_id))
                OR
                ((COALESCE(p_nuevo_staff_id, v_cita_actual.staff_id) IS NULL) AND c.categoria IS NOT DISTINCT FROM COALESCE(p_nueva_categoria, v_cita_actual.categoria))
              )
              AND ((p_nueva_fecha >= c.fecha AND p_nueva_fecha < c.fecha + INTERVAL '60 minutes')
              OR (v_fecha_fin > c.fecha AND v_fecha_fin <= c.fecha + INTERVAL '60 minutes'))
        ) INTO v_conflicto;
        
        IF v_conflicto THEN
            RETURN jsonb_build_object('success', false, 'error', 'CONFLICT', 'message', 'El nuevo horario ya está ocupado');
        END IF;
    END IF;
    
    UPDATE "Citas"
    SET 
        fecha = COALESCE(p_nueva_fecha, fecha),
        servicio = COALESCE(p_nuevo_servicio, servicio),
        precio = COALESCE(p_nuevo_precio, precio),
        estado = COALESCE(p_nuevo_estado, estado),
        staff_id = COALESCE(p_nuevo_staff_id, staff_id),
        categoria = COALESCE(p_nueva_categoria, categoria)
    WHERE id = p_cita_id AND business_id = p_business_id;
    
    RETURN jsonb_build_object('success', true, 'id', p_cita_id, 'message', 'Cita actualizada exitosamente');
END;
$$;
