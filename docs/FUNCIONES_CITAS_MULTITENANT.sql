-- ============================================
-- FUNCIONES MULTI-TENANT CON BUSINESS_ID
-- ============================================
-- Ejecutar en Supabase SQL Editor
-- IMPORTANTE: Primero asegúrate que la tabla Citas tenga la columna business_id

-- Si NO tienes business_id en Citas, agrégalo primero:
-- ALTER TABLE "Citas" ADD COLUMN business_id UUID REFERENCES negocios(id);
-- UPDATE "Citas" SET business_id = 'TU_BUSINESS_ID_AQUI' WHERE business_id IS NULL;

-- ============================================
-- 1. FUNCIÓN: Crear Cita Segura (con business_id)
-- ============================================

DROP FUNCTION IF EXISTS crear_cita_segura;

CREATE OR REPLACE FUNCTION crear_cita_segura(
    p_business_id UUID,         -- ID del negocio/salón
    p_fecha TIMESTAMPTZ,        -- Fecha y hora de la cita
    p_duracion_min INTEGER,     -- Duración en minutos
    p_cliente_id BIGINT,        -- ID del cliente (puede ser NULL)
    p_nombre TEXT,              -- Nombre del cliente
    p_servicio TEXT,            -- Nombre del servicio
    p_precio FLOAT DEFAULT 0
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_fecha_fin TIMESTAMPTZ;
    v_conflicto INTEGER;
    v_new_id BIGINT;
BEGIN
    -- Calcular hora de fin
    v_fecha_fin := p_fecha + (p_duracion_min || ' minutes')::INTERVAL;
    
    -- LOCK: Buscar citas que se superpongan EN EL MISMO NEGOCIO
    SELECT COUNT(*) INTO v_conflicto
    FROM "Citas" c
    WHERE c.business_id = p_business_id  -- ← FILTRO POR NEGOCIO
      AND c.estado NOT IN ('Cancelada', 'No-Show')
      AND (
          (p_fecha >= c.fecha AND p_fecha < c.fecha + INTERVAL '60 minutes')
          OR
          (v_fecha_fin > c.fecha AND v_fecha_fin <= c.fecha + INTERVAL '60 minutes')
          OR
          (p_fecha <= c.fecha AND v_fecha_fin >= c.fecha + INTERVAL '60 minutes')
      )
    FOR UPDATE;
    
    IF v_conflicto > 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'CONFLICT',
            'message', 'Este horario ya está ocupado'
        );
    END IF;
    
    -- Insertar cita CON business_id
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
-- 2. FUNCIÓN: Obtener Disponibilidad (con business_id)
-- ============================================

DROP FUNCTION IF EXISTS obtener_disponibilidad;

CREATE OR REPLACE FUNCTION obtener_disponibilidad(
    p_business_id UUID,         -- ID del negocio/salón
    p_fecha_dia DATE,           -- Solo la fecha (YYYY-MM-DD)
    p_duracion_min INTEGER DEFAULT 60
) RETURNS TABLE(
    hora TIME, 
    disponible BOOLEAN, 
    cliente_nombre TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_hora_inicio TIME := '09:00:00';
    v_hora_cierre TIME := '21:00:00';
    v_check_hora TIME;
    v_timestamp TIMESTAMPTZ;
BEGIN
    v_check_hora := v_hora_inicio;
    
    WHILE v_check_hora < v_hora_cierre LOOP
        v_timestamp := (p_fecha_dia::TEXT || ' ' || v_check_hora::TEXT)::TIMESTAMPTZ;
        
        RETURN QUERY
        SELECT 
            v_check_hora,
            NOT EXISTS (
                SELECT 1 FROM "Citas" c
                WHERE c.business_id = p_business_id  -- ← FILTRO POR NEGOCIO
                  AND c.estado NOT IN ('Cancelada', 'No-Show')
                  AND c.fecha >= v_timestamp
                  AND c.fecha < v_timestamp + INTERVAL '1 hour'
            ),
            COALESCE(
                (SELECT c.nombre FROM "Citas" c
                 WHERE c.business_id = p_business_id  -- ← FILTRO POR NEGOCIO
                   AND c.fecha >= v_timestamp
                   AND c.fecha < v_timestamp + INTERVAL '1 hour'
                   AND c.estado NOT IN ('Cancelada', 'No-Show')
                 LIMIT 1),
                ''
            );
        
        v_check_hora := v_check_hora + INTERVAL '1 hour';
    END LOOP;
END;
$$;

-- ============================================
-- 3. FUNCIÓN: Actualizar Cita Segura (con business_id)
-- ============================================

DROP FUNCTION IF EXISTS actualizar_cita_segura;

CREATE OR REPLACE FUNCTION actualizar_cita_segura(
    p_business_id UUID,         -- ID del negocio (para validar propiedad)
    p_cita_id BIGINT,           -- ID de la cita a modificar
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
    v_conflicto INTEGER;
BEGIN
    -- 1. Obtener cita actual (validando que pertenece al negocio)
    SELECT * INTO v_cita_actual 
    FROM "Citas" 
    WHERE id = p_cita_id AND business_id = p_business_id;  -- ← VALIDAR PROPIEDAD
    
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
        
        SELECT COUNT(*) INTO v_conflicto
        FROM "Citas" c
        WHERE c.business_id = p_business_id  -- ← FILTRO POR NEGOCIO
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
-- EJEMPLOS DE USO:
-- ============================================

-- Crear cita:
-- SELECT crear_cita_segura(
--     'abc123-uuid-del-negocio'::uuid,
--     '2026-02-04 15:00:00-05:00'::timestamptz,
--     60, 263, 'María', 'Manicura', 30
-- );

-- Ver disponibilidad:
-- SELECT * FROM obtener_disponibilidad(
--     'abc123-uuid-del-negocio'::uuid,
--     '2026-02-04'::date
-- );

-- Reagendar cita:
-- SELECT actualizar_cita_segura(
--     'abc123-uuid-del-negocio'::uuid,
--     103, '2026-02-05 16:00:00-05:00'::timestamptz
-- );
