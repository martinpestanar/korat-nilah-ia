-- Migration: add_max_concurrent_appointments_to_staff
-- Description: Add max_concurrent_appointments column to staff table and update conflict logic in booking RPCs.

-- 1. Agregar columna max_concurrent_appointments a la tabla staff si no existe
ALTER TABLE public.staff 
ADD COLUMN IF NOT EXISTS max_concurrent_appointments INTEGER NOT NULL DEFAULT 1;

-- 2. Actualizar RPC crear_cita_segura para soportar capacidad simultánea
CREATE OR REPLACE FUNCTION public.crear_cita_segura(
    p_business_id uuid,
    p_fecha timestamp with time zone,
    p_duracion_min integer,
    p_cliente_id bigint,
    p_nombre text,
    p_servicio text,
    p_precio numeric,
    p_staff_id bigint DEFAULT NULL,
    p_categoria text DEFAULT NULL,
    p_origen_cita text DEFAULT 'organico'::text,
    p_requiere_deposito boolean DEFAULT false,
    p_monto_deposito numeric DEFAULT 0,
    p_comprobante_url text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $function$
DECLARE
    v_fecha_fin         TIMESTAMPTZ;
    v_citas_solapadas   INTEGER := 0;
    v_max_concurrent    INTEGER := 1;
    v_new_id            BIGINT;
    v_staff_activo      BOOLEAN;
BEGIN
    -- 1. Validar Staff activo si se especifica y obtener su capacidad máxima
    IF p_staff_id IS NOT NULL THEN
        SELECT activo, COALESCE(max_concurrent_appointments, 1)
        INTO v_staff_activo, v_max_concurrent
        FROM staff 
        WHERE id = p_staff_id AND business_id = p_business_id;

        IF NOT FOUND OR v_staff_activo = false THEN
            RETURN jsonb_build_object('success', false, 'error', 'INVALID_STAFF', 'message', 'Especialista no disponible.');
        END IF;
    END IF;

    -- Garantizar valor válido
    IF v_max_concurrent < 1 THEN
        v_max_concurrent := 1;
    END IF;

    -- 2. Calcular fin y detectar conflictos (solo para citas futuras o en las próximas 2 horas)
    v_fecha_fin := p_fecha + (p_duracion_min || ' minutes')::INTERVAL;

    IF p_fecha >= NOW() - INTERVAL '2 hours' THEN
        SELECT COUNT(*)
        INTO v_citas_solapadas
        FROM "Citas" c
        WHERE c.business_id = p_business_id
          AND c.estado NOT IN ('Cancelada', 'No-Show')
          AND (
            (p_staff_id IS NOT NULL AND c.staff_id = p_staff_id)
            OR
            (p_staff_id IS NULL AND c.staff_id IS NULL AND c.categoria IS NOT DISTINCT FROM p_categoria)
          )
          AND (p_fecha < c.fecha + (COALESCE(c.duracion_min, 60) || ' minutes')::INTERVAL AND v_fecha_fin > c.fecha);

        IF v_citas_solapadas >= v_max_concurrent THEN
            RETURN jsonb_build_object('success', false, 'error', 'STAFF_CONFLICT', 'message', 'Horario ocupado. El especialista ha alcanzado su capacidad máxima para este horario.');
        END IF;
    END IF;

    -- 3. INSERTAR CITA
    INSERT INTO "Citas" (
        business_id, fecha, duracion_min, cliente_id,
        nombre, servicio, precio, estado, staff_id, categoria,
        origen_cita, requiere_deposito, monto_deposito, comprobante_pago_url, deposito_verificado
    )
    VALUES (
        p_business_id, p_fecha, p_duracion_min, p_cliente_id,
        p_nombre, p_servicio, p_precio,
        CASE
            WHEN p_fecha + (p_duracion_min || ' minutes')::INTERVAL < NOW() THEN 'Completada'
            ELSE 'Pendiente'
        END,
        p_staff_id, p_categoria,
        p_origen_cita, p_requiere_deposito, p_monto_deposito, p_comprobante_url, false
    )
    RETURNING id INTO v_new_id;

    -- 4. ACTUALIZAR CLIENTE
    IF p_cliente_id IS NOT NULL THEN
        UPDATE "Clientes"
        SET ultimo_servicio = p_servicio,
            ultima_visita = p_fecha,
            primera_visita = COALESCE(primera_visita, p_fecha)
        WHERE id = p_cliente_id AND business_id = p_business_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'id',      v_new_id,
        'message', 'Cita agendada exitosamente',
        'requiere_deposito', p_requiere_deposito,
        'estado_asignado', CASE WHEN p_fecha + (p_duracion_min || ' minutes')::INTERVAL < NOW() THEN 'Completada' ELSE 'Pendiente' END
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLSTATE, 'message', SQLERRM);
END;
$function$;

-- 3. Actualizar RPC actualizar_cita_segura para soportar capacidad simultánea
CREATE OR REPLACE FUNCTION public.actualizar_cita_segura(
    p_business_id uuid,
    p_cita_id bigint,
    p_nueva_fecha timestamp with time zone DEFAULT NULL,
    p_duracion_min integer DEFAULT 60,
    p_nuevo_servicio text DEFAULT NULL,
    p_nuevo_precio double precision DEFAULT NULL,
    p_nuevo_estado text DEFAULT NULL,
    p_nuevo_staff_id integer DEFAULT NULL,
    p_nueva_categoria text DEFAULT NULL,
    p_monto_deposito numeric DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_cita_actual       RECORD;
    v_fecha_fin         TIMESTAMPTZ;
    v_citas_solapadas   INTEGER := 0;
    v_max_concurrent    INTEGER := 1;
    v_staff_final       INTEGER;
    v_staff_activo      BOOLEAN;
BEGIN
    SELECT * INTO v_cita_actual
    FROM "Citas"
    WHERE id = p_cita_id AND business_id = p_business_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'NOT_FOUND', 'message', 'Cita no encontrada');
    END IF;

    -- Validar nuevo staff si se cambia
    IF p_nuevo_staff_id IS NOT NULL THEN
        SELECT activo, COALESCE(max_concurrent_appointments, 1)
        INTO v_staff_activo, v_max_concurrent
        FROM staff
        WHERE id = p_nuevo_staff_id AND business_id = p_business_id;

        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'error', 'INVALID_STAFF', 'message', 'El especialista no existe en este negocio');
        END IF;

        IF v_staff_activo = false THEN
            RETURN jsonb_build_object('success', false, 'error', 'INACTIVE_STAFF', 'message', 'El especialista seleccionado no está activo');
        END IF;
    ELSE
        -- Si no cambia el staff, obtener capacidad del staff actual si existe
        IF v_cita_actual.staff_id IS NOT NULL THEN
            SELECT COALESCE(max_concurrent_appointments, 1)
            INTO v_max_concurrent
            FROM staff
            WHERE id = v_cita_actual.staff_id AND business_id = p_business_id;
        END IF;
    END IF;

    IF v_max_concurrent < 1 THEN
        v_max_concurrent := 1;
    END IF;

    -- Verificar conflicto de horario si cambia la fecha
    IF p_nueva_fecha IS NOT NULL AND p_nueva_fecha != v_cita_actual.fecha THEN
        v_staff_final := COALESCE(p_nuevo_staff_id, v_cita_actual.staff_id);
        v_fecha_fin   := p_nueva_fecha + (p_duracion_min || ' minutes')::INTERVAL;

        PERFORM 1 FROM "Citas" c
        WHERE c.business_id = p_business_id
          AND c.id != p_cita_id
          AND c.estado NOT IN ('Cancelada', 'No-Show', 'Reagendada')
          AND c.staff_id IS NOT DISTINCT FROM v_staff_final
          AND (p_nueva_fecha < c.fecha + (COALESCE(c.duracion_min, 60) || ' minutes')::INTERVAL
               AND v_fecha_fin > c.fecha)
        FOR UPDATE;

        SELECT COUNT(*)
        INTO v_citas_solapadas
        FROM "Citas" c
        WHERE c.business_id = p_business_id
          AND c.id != p_cita_id
          AND c.estado NOT IN ('Cancelada', 'No-Show', 'Reagendada')
          AND (
            (v_staff_final IS NOT NULL AND c.staff_id = v_staff_final)
            OR
            (v_staff_final IS NULL AND c.staff_id IS NULL
             AND c.categoria IS NOT DISTINCT FROM COALESCE(p_nueva_categoria, v_cita_actual.categoria))
          )
          AND (p_nueva_fecha < c.fecha + (COALESCE(c.duracion_min, 60) || ' minutes')::INTERVAL
               AND v_fecha_fin > c.fecha);

        IF v_citas_solapadas >= v_max_concurrent THEN
            RETURN jsonb_build_object('success', false, 'error', 'STAFF_CONFLICT', 'message', 'El nuevo horario ya está ocupado. El especialista ha alcanzado su capacidad máxima para ese horario.');
        END IF;
    END IF;

    -- Actualizar la cita incluyendo monto_deposito si se proporciona
    UPDATE "Citas"
    SET
        fecha           = COALESCE(p_nueva_fecha,     fecha),
        duracion_min    = CASE
                             WHEN p_nueva_fecha IS NOT NULL OR p_nuevo_servicio IS NOT NULL
                             THEN p_duracion_min
                             ELSE duracion_min
                          END,
        servicio        = COALESCE(p_nuevo_servicio,  servicio),
        precio          = COALESCE(p_nuevo_precio,    precio),
        estado          = COALESCE(p_nuevo_estado,    estado),
        staff_id        = COALESCE(p_nuevo_staff_id,  staff_id),
        categoria       = COALESCE(p_nueva_categoria, categoria),
        monto_deposito  = CASE WHEN p_monto_deposito IS NOT NULL THEN p_monto_deposito ELSE monto_deposito END,
        requiere_deposito = CASE WHEN p_monto_deposito IS NOT NULL AND p_monto_deposito > 0 THEN true
                                 WHEN p_monto_deposito IS NOT NULL AND p_monto_deposito = 0 THEN false
                                 ELSE requiere_deposito END
    WHERE id = p_cita_id AND business_id = p_business_id;

    IF p_nuevo_servicio IS NOT NULL AND v_cita_actual.cliente_id IS NOT NULL THEN
        UPDATE "Clientes"
        SET ultimo_servicio = p_nuevo_servicio
        WHERE id = v_cita_actual.cliente_id AND business_id = p_business_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'id', p_cita_id, 'message', 'Cita actualizada exitosamente');
END;
$function$;
