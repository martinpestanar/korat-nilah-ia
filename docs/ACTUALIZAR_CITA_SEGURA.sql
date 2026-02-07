-- ============================================
-- FUNCIÓN: Actualizar/Reagendar Cita de Forma Segura
-- ============================================
-- Esta función permite reagendar una cita validando que el nuevo horario esté libre
-- Ejecutar en Supabase SQL Editor

CREATE OR REPLACE FUNCTION actualizar_cita_segura(
    p_cita_id BIGINT,           -- ID de la cita a modificar
    p_nueva_fecha TIMESTAMPTZ,  -- Nueva fecha/hora (NULL si no cambia)
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
    v_conflicto INTEGER;
BEGIN
    -- 1. Obtener cita actual
    SELECT * INTO v_cita_actual FROM "Citas" WHERE id = p_cita_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'NOT_FOUND',
            'message', 'Cita no encontrada'
        );
    END IF;
    
    -- 2. Si hay cambio de fecha, validar disponibilidad
    IF p_nueva_fecha IS NOT NULL AND p_nueva_fecha != v_cita_actual.fecha THEN
        v_fecha_fin := p_nueva_fecha + (p_duracion_min || ' minutes')::INTERVAL;
        
        -- Buscar conflictos (excluyendo la cita actual)
        SELECT COUNT(*) INTO v_conflicto
        FROM "Citas" c
        WHERE c.id != p_cita_id
          AND c.estado NOT IN ('Cancelada', 'No-Show', 'Reagendada')
          AND (
              (p_nueva_fecha >= c.fecha AND p_nueva_fecha < c.fecha + INTERVAL '60 minutes')
              OR
              (v_fecha_fin > c.fecha AND v_fecha_fin <= c.fecha + INTERVAL '60 minutes')
              OR
              (p_nueva_fecha <= c.fecha AND v_fecha_fin >= c.fecha + INTERVAL '60 minutes')
          )
        FOR UPDATE;
        
        IF v_conflicto > 0 THEN
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
    WHERE id = p_cita_id;
    
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
-- EJEMPLO DE USO:
-- ============================================

-- Reagendar cita #103 a nueva fecha:
-- SELECT actualizar_cita_segura(103, '2026-02-05 15:00:00-05:00'::timestamptz);

-- Cambiar solo el servicio:
-- SELECT actualizar_cita_segura(103, NULL, 60, 'Pedicura', 50);

-- Cambiar solo el estado:
-- SELECT actualizar_cita_segura(103, NULL, 60, NULL, NULL, 'Completada');
