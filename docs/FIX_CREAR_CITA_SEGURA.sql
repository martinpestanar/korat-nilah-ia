-- ============================================
-- FIX: Crear Cita Segura (sin FOR UPDATE en agregación)
-- ============================================
-- PROBLEMA: PostgreSQL no permite FOR UPDATE con COUNT()
-- SOLUCIÓN: Usar FOR UPDATE en subconsulta separada
-- Ejecutar en Supabase SQL Editor

DROP FUNCTION IF EXISTS crear_cita_segura;

CREATE OR REPLACE FUNCTION crear_cita_segura(
    p_business_id UUID,
    p_fecha TIMESTAMPTZ,
    p_duracion_min INTEGER,
    p_cliente_id BIGINT,
    p_nombre TEXT,
    p_servicio TEXT,
    p_precio FLOAT DEFAULT 0
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
    
    -- LOCK: Bloquear filas conflictivas primero (sin agregación)
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
    
    -- Ahora verificar si hay conflictos (sin FOR UPDATE)
    SELECT EXISTS (
        SELECT 1 FROM "Citas" c
        WHERE c.business_id = p_business_id
          AND c.estado NOT IN ('Cancelada', 'No-Show')
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
    
    -- Insertar cita
    INSERT INTO "Citas" (business_id, fecha, cliente, nombre, servicio, precio, estado)
    VALUES (p_business_id, p_fecha, p_cliente_id, p_nombre, p_servicio, p_precio, 'Pendiente')
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

-- ============================================
-- FIX: Actualizar Cita Segura (sin FOR UPDATE en agregación)
-- ============================================

DROP FUNCTION IF EXISTS actualizar_cita_segura;

CREATE OR REPLACE FUNCTION actualizar_cita_segura(
    p_business_id UUID,
    p_cita_id BIGINT,
    p_nueva_fecha TIMESTAMPTZ DEFAULT NULL,
    p_duracion_min INTEGER DEFAULT 60,
    p_nuevo_servicio TEXT DEFAULT NULL,
    p_nuevo_precio FLOAT DEFAULT NULL,
    p_nuevo_estado TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_cita_actual RECORD;
    v_fecha_fin TIMESTAMPTZ;
    v_conflicto BOOLEAN;
BEGIN
    -- 1. Obtener cita actual (validando propiedad)
    SELECT * INTO v_cita_actual 
    FROM "Citas" 
    WHERE id = p_cita_id AND business_id = p_business_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'NOT_FOUND',
            'message', 'Cita no encontrada o no pertenece a este negocio'
        );
    END IF;
    
    -- 2. Si hay cambio de fecha, validar disponibilidad
    IF p_nueva_fecha IS NOT NULL AND p_nueva_fecha != v_cita_actual.fecha THEN
        v_fecha_fin := p_nueva_fecha + (p_duracion_min || ' minutes')::INTERVAL;
        
        -- Bloquear filas primero
        PERFORM 1
        FROM "Citas" c
        WHERE c.business_id = p_business_id
          AND c.id != p_cita_id
          AND c.estado NOT IN ('Cancelada', 'No-Show', 'Reagendada')
          AND (
              (p_nueva_fecha >= c.fecha AND p_nueva_fecha < c.fecha + INTERVAL '60 minutes')
              OR
              (v_fecha_fin > c.fecha AND v_fecha_fin <= c.fecha + INTERVAL '60 minutes')
              OR
              (p_nueva_fecha <= c.fecha AND v_fecha_fin >= c.fecha + INTERVAL '60 minutes')
          )
        FOR UPDATE;
        
        -- Verificar conflicto
        SELECT EXISTS (
            SELECT 1 FROM "Citas" c
            WHERE c.business_id = p_business_id
              AND c.id != p_cita_id
              AND c.estado NOT IN ('Cancelada', 'No-Show', 'Reagendada')
              AND (
                  (p_nueva_fecha >= c.fecha AND p_nueva_fecha < c.fecha + INTERVAL '60 minutes')
                  OR
                  (v_fecha_fin > c.fecha AND v_fecha_fin <= c.fecha + INTERVAL '60 minutes')
                  OR
                  (p_nueva_fecha <= c.fecha AND v_fecha_fin >= c.fecha + INTERVAL '60 minutes')
              )
        ) INTO v_conflicto;
        
        IF v_conflicto THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'CONFLICT',
                'message', 'El nuevo horario ya está ocupado'
            );
        END IF;
    END IF;
    
    -- 3. Actualizar la cita
    UPDATE "Citas"
    SET 
        fecha = COALESCE(p_nueva_fecha, fecha),
        servicio = COALESCE(p_nuevo_servicio, servicio),
        precio = COALESCE(p_nuevo_precio, precio),
        estado = COALESCE(p_nuevo_estado, estado)
    WHERE id = p_cita_id AND business_id = p_business_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'id', p_cita_id,
        'message', 'Cita actualizada exitosamente'
    );

EXCEPTION WHEN unique_violation THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', 'CONFLICT',
        'message', 'Este horario acaba de ser reservado'
    );
END;
$$;

-- ============================================
-- LISTO! Ejecuta este script en Supabase SQL Editor
-- ============================================
