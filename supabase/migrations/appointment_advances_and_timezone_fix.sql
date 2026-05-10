-- Migration: appointment_advances_and_timezone_fix
-- Description: Updates RPCs to support deposit tracking and fixes future appointment auto-completion logic.

-- 1. Actualizar RPC para editar citas con soporte para depósitos
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
    v_cita_actual   RECORD;
    v_fecha_fin     TIMESTAMPTZ;
    v_conflicto     BOOLEAN;
    v_staff_final   INTEGER;
    v_staff_activo  BOOLEAN;
BEGIN
    SELECT * INTO v_cita_actual
    FROM "Citas"
    WHERE id = p_cita_id AND business_id = p_business_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'NOT_FOUND', 'message', 'Cita no encontrada');
    END IF;

    -- E6: Validar nuevo staff si se cambia
    IF p_nuevo_staff_id IS NOT NULL THEN
        SELECT activo INTO v_staff_activo
        FROM staff
        WHERE id = p_nuevo_staff_id AND business_id = p_business_id;

        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'error', 'INVALID_STAFF', 'message', 'El especialista no existe en este negocio');
        END IF;

        IF v_staff_activo = false THEN
            RETURN jsonb_build_object('success', false, 'error', 'INACTIVE_STAFF', 'message', 'El especialista seleccionado no está activo');
        END IF;
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

        SELECT EXISTS (
            SELECT 1 FROM "Citas" c
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
                   AND v_fecha_fin > c.fecha)
        ) INTO v_conflicto;

        IF v_conflicto THEN
            RETURN jsonb_build_object('success', false, 'error', 'STAFF_CONFLICT', 'message', 'El nuevo horario ya está ocupado para ese especialista');
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


-- 2. Actualizar RPC para crear citas múltiples con soporte para depósitos iniciales
CREATE OR REPLACE FUNCTION public.crear_cita_multiple_segura(
    p_business_id uuid,
    p_cliente_id bigint,
    p_nombre text,
    p_fecha_inicio timestamp with time zone,
    p_origen_cita text DEFAULT 'organico'::text,
    p_servicios jsonb DEFAULT '[]'::jsonb,
    p_adelanto_total numeric DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
AS $function$
DECLARE
    -- Iteración
    v_servicio          JSONB;
    v_idx               INT := 0;
    v_cursor_tiempo     TIMESTAMPTZ;
    v_fecha_fin_bloque  TIMESTAMPTZ;

    -- Datos del servicio actual
    v_nombre_servicio   TEXT;
    v_duracion_min      INT;
    v_precio            NUMERIC;
    v_categoria         TEXT;
    v_staff_id          BIGINT;

    -- Validación staff
    v_staff_activo      BOOLEAN;
    v_staff_categoria   TEXT;

    -- Auto-asignación de staff
    v_auto_staff_id     BIGINT;

    -- Detección de conflictos
    v_conflicto         BOOLEAN;
    v_conflicto_quien   TEXT;

    -- ID de cita creada
    v_new_id            BIGINT;

    -- Acumuladores para el resultado
    v_ids_creados       JSONB := '[]'::JSONB;
    v_total_precio      NUMERIC := 0;
    v_total_min         INT := 0;
    v_num_servicios     INT;

    -- Validaciones generales
    v_negocio_apertura  TIME;
    v_negocio_cierre    TIME;
    v_hora_inicio_local TIME;
    
    -- Variables para el Depósito
    v_requiere_deposito BOOLEAN;
    v_monto_deposito    NUMERIC;

BEGIN
    -- 0. VALIDACIONES GENERALES
    v_num_servicios := jsonb_array_length(p_servicios);
    IF v_num_servicios = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'NO_SERVICES', 'message', 'Debes seleccionar al menos un servicio.');
    END IF;

    SELECT hora_apertura, hora_cierre
    INTO v_negocio_apertura, v_negocio_cierre
    FROM negocios
    WHERE id = p_business_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'INVALID_BUSINESS', 'message', 'Negocio no encontrado.');
    END IF;

    -- Capturar hora local de inicio (Usa timezone de Lima como fallback)
    v_hora_inicio_local := (p_fecha_inicio AT TIME ZONE 'America/Lima')::TIME;

    -- Validar horario si es futura
    IF p_fecha_inicio >= NOW() - INTERVAL '10 minutes' THEN
        IF v_negocio_apertura IS NOT NULL AND v_hora_inicio_local < v_negocio_apertura THEN
            RETURN jsonb_build_object('success', false, 'error', 'OUTSIDE_BUSINESS_HOURS', 'message', format('El negocio abre a las %s. No puedes agendar antes.', v_negocio_apertura));
        END IF;

        IF v_negocio_cierre IS NOT NULL AND v_hora_inicio_local >= v_negocio_cierre THEN
            RETURN jsonb_build_object('success', false, 'error', 'OUTSIDE_BUSINESS_HOURS', 'message', format('El negocio cierra a las %s. No puedes agendar después.', v_negocio_cierre));
        END IF;

        IF EXISTS (
            SELECT 1 FROM dias_cerrados dc
            WHERE dc.business_id = p_business_id
              AND dc.fecha = (p_fecha_inicio AT TIME ZONE 'America/Lima')::DATE
              AND (dc.es_dia_completo = true OR (v_hora_inicio_local >= dc.hora_inicio AND v_hora_inicio_local < dc.hora_fin))
        ) THEN
            RETURN jsonb_build_object('success', false, 'error', 'CLOSED_DAY', 'message', 'El negocio está cerrado en la fecha/hora seleccionada.');
        END IF;
    END IF;

    -- 1. CALCULAR DURACIÓN TOTAL
    FOR v_servicio IN SELECT * FROM jsonb_array_elements(p_servicios)
    LOOP
        v_total_min := v_total_min + COALESCE((v_servicio->>'duracion_min')::INT, 60);
    END LOOP;

    -- 2. ITERAR SERVICIOS
    v_cursor_tiempo := p_fecha_inicio;

    FOR v_servicio IN SELECT * FROM jsonb_array_elements(p_servicios)
    LOOP
        v_idx              := v_idx + 1;
        v_nombre_servicio  := v_servicio->>'servicio';
        v_duracion_min     := COALESCE((v_servicio->>'duracion_min')::INT, 60);
        v_precio           := COALESCE((v_servicio->>'precio')::NUMERIC, 0);
        v_categoria        := lower(v_servicio->>'categoria');
        v_staff_id         := (v_servicio->>'staff_id')::BIGINT;
        v_fecha_fin_bloque := v_cursor_tiempo + (v_duracion_min || ' minutes')::INTERVAL;

        -- Lógica de Depósito: Asignar el 100% del adelanto al PRIMER servicio del bloque
        IF v_idx = 1 AND COALESCE(p_adelanto_total, 0) > 0 THEN
            v_requiere_deposito := true;
            v_monto_deposito    := p_adelanto_total;
        ELSE
            v_requiere_deposito := false;
            v_monto_deposito    := 0;
        END IF;

        INSERT INTO "Citas" (
            business_id, fecha, duracion_min, cliente_id, nombre, servicio, precio, 
            estado, staff_id, categoria, origen_cita, requiere_deposito, 
            monto_deposito, deposito_verificado
        )
        VALUES (
            p_business_id, v_cursor_tiempo, v_duracion_min, p_cliente_id, p_nombre, v_nombre_servicio, v_precio, 
            CASE WHEN p_fecha_inicio < NOW() - INTERVAL '10 minutes' THEN 'Completada' ELSE 'Pendiente' END, 
            v_staff_id, v_categoria, p_origen_cita, v_requiere_deposito, 
            v_monto_deposito, CASE WHEN v_monto_deposito > 0 THEN true ELSE false END
        )
        RETURNING id INTO v_new_id;

        v_ids_creados := v_ids_creados || jsonb_build_object(
            'id', v_new_id, 'servicio', v_nombre_servicio, 'precio', v_precio
        );
        v_total_precio := v_total_precio + v_precio;
        v_cursor_tiempo := v_fecha_fin_bloque;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'ids', v_ids_creados, 'precio_total', v_total_precio, 'message', 'Cita agendada exitosamente.');

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLSTATE, 'message', 'Error: ' || SQLERRM);
END;
$function$;


-- 3. Fix para evitar que el cron-job auto-complete citas futuras
CREATE OR REPLACE FUNCTION public.auto_completar_citas_pendientes()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_cita RECORD;
  v_processed_count int := 0;
  v_result jsonb := '[]'::jsonb;
  v_rpc_result json;
BEGIN
  FOR v_cita IN
    SELECT ci.*
    FROM "Citas" ci
    WHERE ci.estado ILIKE 'pendiente'
      -- Fix: Solo completar si la fecha YA PASÓ + 15 min de gracia
      AND ci.fecha + (COALESCE(ci.duracion_min, 60) || ' minutes')::interval + interval '15 minutes' <= now()
      -- Evitar re-procesar si el usuario revirtió manualmente
      AND (ci.auto_completada IS NULL OR ci.auto_completada = false)
  LOOP
    SELECT actualizar_estado_cita_y_puntos(
        v_cita.id,
        'Completada',
        v_cita.business_id
    ) INTO v_rpc_result;

    UPDATE "Citas"
    SET auto_completada = true
    WHERE id = v_cita.id;

    v_processed_count := v_processed_count + 1;
  END LOOP;

  RETURN json_build_object(
    'citas_completadas', v_processed_count
  );
END;
$function$;
