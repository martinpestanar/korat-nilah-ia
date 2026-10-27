const { Client } = require('pg');
const CONNECTION_STRING = 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

async function main() {
  const client = new Client({ connectionString: CONNECTION_STRING });
  await client.connect();

  console.log('--- ACTUALIZANDO crear_cita_multiple_segura ---');
  await client.query(`
CREATE OR REPLACE FUNCTION public.crear_cita_multiple_segura(
    p_business_id uuid,
    p_cliente_id bigint,
    p_nombre text,
    p_fecha_inicio timestamp with time zone,
    p_origen_cita text DEFAULT 'organico'::text,
    p_servicios jsonb DEFAULT '[]'::jsonb,
    p_adelanto_total numeric DEFAULT 0,
    p_estado text DEFAULT NULL
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

    -- Validación staff y concurrencia
    v_staff_activo      BOOLEAN;
    v_max_concurrent    INTEGER := 1;
    v_citas_solapadas   INTEGER := 0;

    -- ID de cita creada
    v_new_id            BIGINT;

    -- Acumuladores para el resultado
    v_ids_creados       JSONB := '[]'::JSONB;
    v_total_precio      NUMERIC := 0;
    v_total_min         INT := 0;
    v_num_servicios     INT;

    -- Validaciones generales de horario
    v_negocio_apertura  TIME;
    v_negocio_cierre    TIME;
    v_hora_inicio_local TIME;

    -- Horario desde negocio_info (fuente de verdad)
    v_horario_semana    TEXT;
    v_horario_sabado    TEXT;
    v_horario_domingo   TEXT;
    v_dia_semana        INT;
    v_horario_str       TEXT;

    -- Variables para el Depósito
    v_requiere_deposito BOOLEAN;
    v_monto_deposito    NUMERIC;

    -- Negocio existe
    v_negocio_existe    BOOLEAN;

    -- Estado normalizado
    v_estado_final      TEXT;

BEGIN
    -- 0. VALIDACIONES GENERALES
    v_num_servicios := jsonb_array_length(p_servicios);
    IF v_num_servicios = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'NO_SERVICES', 'message', 'Debes seleccionar al menos un servicio.');
    END IF;

    -- Determinar estado final: respetar p_estado explícito, jamás forzar 'Completada' a ciegas
    IF p_estado IS NOT NULL AND TRIM(p_estado) != '' THEN
        v_estado_final := CASE LOWER(TRIM(p_estado))
            WHEN 'completada' THEN 'Completada'
            WHEN 'confirmada' THEN 'Confirmada'
            WHEN 'no-show'    THEN 'No-Show'
            WHEN 'noshow'     THEN 'No-Show'
            WHEN 'no show'    THEN 'No-Show'
            WHEN 'cancelada'  THEN 'Cancelada'
            WHEN 'reagendada' THEN 'Reagendada'
            ELSE 'Pendiente'
        END;
    ELSE
        v_estado_final := 'Pendiente';
    END IF;

    -- Verificar que el negocio existe
    SELECT EXISTS(SELECT 1 FROM negocios WHERE id = p_business_id)
    INTO v_negocio_existe;

    IF NOT v_negocio_existe THEN
        RETURN jsonb_build_object('success', false, 'error', 'INVALID_BUSINESS', 'message', 'Negocio no encontrado.');
    END IF;

    -- Capturar hora local de inicio (Usa timezone de Lima como fallback)
    v_hora_inicio_local := (p_fecha_inicio AT TIME ZONE 'America/Lima')::TIME;
    v_dia_semana := EXTRACT(DOW FROM (p_fecha_inicio AT TIME ZONE 'America/Lima'))::INT;

    -- FUENTE DE VERDAD: Leer horarios desde negocio_info
    SELECT valor_texto INTO v_horario_semana
    FROM negocio_info
    WHERE business_id = p_business_id AND clave = 'horario_semana'
    LIMIT 1;

    SELECT valor_texto INTO v_horario_sabado
    FROM negocio_info
    WHERE business_id = p_business_id AND clave = 'horario_sabado'
    LIMIT 1;

    SELECT valor_texto INTO v_horario_domingo
    FROM negocio_info
    WHERE business_id = p_business_id AND clave = 'horario_domingo'
    LIMIT 1;

    IF v_dia_semana = 0 THEN
        v_horario_str := v_horario_domingo;
    ELSIF v_dia_semana = 6 THEN
        v_horario_str := v_horario_sabado;
    ELSE
        v_horario_str := v_horario_semana;
    END IF;

    IF v_horario_str IS NOT NULL AND v_horario_str != '' AND v_horario_str != 'CERRADO' THEN
        DECLARE
            v_parts  TEXT[];
            v_open   TEXT;
            v_close  TEXT;
            v_open_h  INT;
            v_open_m  INT;
            v_close_h INT;
            v_close_m INT;
        BEGIN
            v_parts := regexp_split_to_array(lower(v_horario_str), '\\s*-\\s*');
            IF array_length(v_parts, 1) = 2 THEN
                v_open  := trim(v_parts[1]);
                v_close := trim(v_parts[2]);

                IF v_open ~ '(\\d+):(\\d+)(am|pm)' THEN
                    v_open_h := (regexp_match(v_open, '(\\d+):(\\d+)(am|pm)'))[1]::INT;
                    v_open_m := (regexp_match(v_open, '(\\d+):(\\d+)(am|pm)'))[2]::INT;
                    IF v_open ~ 'pm' AND v_open_h < 12 THEN v_open_h := v_open_h + 12; END IF;
                    IF v_open ~ 'am' AND v_open_h = 12 THEN v_open_h := 0; END IF;
                ELSIF v_open ~ '(\\d+)(am|pm)' THEN
                    v_open_h := (regexp_match(v_open, '(\\d+)(am|pm)'))[1]::INT;
                    v_open_m := 0;
                    IF v_open ~ 'pm' AND v_open_h < 12 THEN v_open_h := v_open_h + 12; END IF;
                    IF v_open ~ 'am' AND v_open_h = 12 THEN v_open_h := 0; END IF;
                ELSE
                    v_open_h := 9; v_open_m := 0;
                END IF;

                IF v_close ~ '(\\d+):(\\d+)(am|pm)' THEN
                    v_close_h := (regexp_match(v_close, '(\\d+):(\\d+)(am|pm)'))[1]::INT;
                    v_close_m := (regexp_match(v_close, '(\\d+):(\\d+)(am|pm)'))[2]::INT;
                    IF v_close ~ 'pm' AND v_close_h < 12 THEN v_close_h := v_close_h + 12; END IF;
                    IF v_close ~ 'am' AND v_close_h = 12 THEN v_close_h := 0; END IF;
                ELSIF v_close ~ '(\\d+)(am|pm)' THEN
                    v_close_h := (regexp_match(v_close, '(\\d+)(am|pm)'))[1]::INT;
                    v_close_m := 0;
                    IF v_close ~ 'pm' AND v_close_h < 12 THEN v_close_h := v_close_h + 12; END IF;
                    IF v_close ~ 'am' AND v_close_h = 12 THEN v_close_h := 0; END IF;
                ELSE
                    v_close_h := 20; v_close_m := 0;
                END IF;

                v_negocio_apertura := make_time(v_open_h, v_open_m, 0.0);
                v_negocio_cierre   := make_time(v_close_h, v_close_m, 0.0);
            END IF;
        END;
    END IF;

    -- Validar días cerrados específicos
    IF p_fecha_inicio >= NOW() - INTERVAL '2 hours' THEN
        IF EXISTS (
            SELECT 1 FROM dias_cerrados dc
            WHERE dc.business_id = p_business_id
              AND dc.fecha = (p_fecha_inicio AT TIME ZONE 'America/Lima')::DATE
              AND (dc.hora_inicio IS NULL OR (v_hora_inicio_local >= dc.hora_inicio AND v_hora_inicio_local < dc.hora_fin))
        ) THEN
            RETURN jsonb_build_object('success', false, 'error', 'CLOSED_DAY', 'message', 'El negocio está cerrado en la fecha/hora seleccionada.');
        END IF;
    END IF;

    -- 1. CALCULAR DURACIÓN TOTAL
    FOR v_servicio IN SELECT * FROM jsonb_array_elements(p_servicios)
    LOOP
        v_total_min := v_total_min + COALESCE((v_servicio->>'duracion_min')::INT, 60);
    END LOOP;

    -- 2. ITERAR SERVICIOS CON VALIDACIÓN DE CONCURRENCIA
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

        -- Validar Staff activo y capacidad simultánea si se especificó staff_id
        IF v_staff_id IS NOT NULL THEN
            SELECT activo, COALESCE(max_concurrent_appointments, 1)
            INTO v_staff_activo, v_max_concurrent
            FROM staff
            WHERE id = v_staff_id AND business_id = p_business_id;

            IF NOT FOUND OR v_staff_activo = false THEN
                RETURN jsonb_build_object('success', false, 'error', 'INVALID_STAFF', 'message', 'Especialista no disponible.');
            END IF;

            IF v_max_concurrent < 1 THEN
                v_max_concurrent := 1;
            END IF;

            -- Detección de solapamiento respecto a max_concurrent_appointments
            IF v_cursor_tiempo >= NOW() - INTERVAL '2 hours' THEN
                SELECT COUNT(*)
                INTO v_citas_solapadas
                FROM "Citas" c
                WHERE c.business_id = p_business_id
                  AND c.estado NOT IN ('Cancelada', 'No-Show', 'Reagendada')
                  AND c.staff_id = v_staff_id
                  AND (v_cursor_tiempo < c.fecha + (COALESCE(c.duracion_min, 60) || ' minutes')::INTERVAL AND v_fecha_fin_bloque > c.fecha);

                IF v_citas_solapadas >= v_max_concurrent THEN
                    RETURN jsonb_build_object(
                        'success', false,
                        'error', 'STAFF_CONFLICT',
                        'message', format('Horario ocupado. El especialista ha alcanzado su capacidad máxima (%s citas simultáneas) para este horario.', v_max_concurrent)
                    );
                END IF;
            END IF;
        END IF;

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
            monto_deposito, deposito_verificado,
            hora_fin
        )
        VALUES (
            p_business_id, v_cursor_tiempo, v_duracion_min, p_cliente_id, p_nombre, v_nombre_servicio, v_precio,
            v_estado_final,
            v_staff_id, v_categoria, p_origen_cita, v_requiere_deposito,
            v_monto_deposito, CASE WHEN v_monto_deposito > 0 THEN true ELSE false END,
            CASE WHEN v_estado_final = 'Completada' THEN v_fecha_fin_bloque ELSE NULL END
        )
        RETURNING id INTO v_new_id;

        v_ids_creados := v_ids_creados || jsonb_build_object(
            'id', v_new_id,
            'servicio', v_nombre_servicio,
            'precio', v_precio,
            'duracion_min', v_duracion_min,
            'staff_id', v_staff_id
        );
        v_total_precio := v_total_precio + v_precio;
        v_cursor_tiempo := v_fecha_fin_bloque;
    END LOOP;

    -- Actualizar cliente solo si fue atendida o pendiente (no penalizar ni marcar última visita si no asistió o se canceló)
    IF p_cliente_id IS NOT NULL AND v_estado_final NOT IN ('Cancelada', 'No-Show') THEN
        UPDATE "Clientes"
        SET ultimo_servicio = COALESCE((p_servicios->0->>'servicio'), ultimo_servicio),
            ultima_visita = CASE WHEN v_estado_final = 'Completada' THEN p_fecha_inicio ELSE ultima_visita END,
            primera_visita = COALESCE(primera_visita, p_fecha_inicio)
        WHERE id = p_cliente_id AND business_id = p_business_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'ids', v_ids_creados,
        'citas_creadas', v_idx,
        'precio_total', v_total_precio,
        'duracion_total_min', v_total_min,
        'estado_aplicado', v_estado_final,
        'message', 'Cita agendada exitosamente.'
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLSTATE, 'message', 'Error: ' || SQLERRM);
END;
$function$;
`);
  console.log('✅ crear_cita_multiple_segura actualizada.');

  console.log('--- ACTUALIZANDO crear_cita_segura ---');
  await client.query(`
CREATE OR REPLACE FUNCTION public.crear_cita_segura(
    p_business_id uuid,
    p_fecha timestamp with time zone,
    p_duracion_min integer,
    p_cliente_id bigint,
    p_nombre text,
    p_servicio text,
    p_precio double precision DEFAULT 0,
    p_staff_id integer DEFAULT NULL::integer,
    p_categoria text DEFAULT NULL::text,
    p_origen_cita text DEFAULT 'organico'::text,
    p_requiere_deposito boolean DEFAULT false,
    p_monto_deposito numeric DEFAULT 0,
    p_comprobante_url text DEFAULT NULL::text,
    p_estado text DEFAULT NULL
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_fecha_fin     TIMESTAMPTZ;
    v_conflicto     BOOLEAN;
    v_new_id        BIGINT;
    v_staff_activo  BOOLEAN;
    v_estado_final  TEXT;
BEGIN
    -- Determinar estado final: respetar p_estado explícito, jamás forzar 'Completada' a ciegas
    IF p_estado IS NOT NULL AND TRIM(p_estado) != '' THEN
        v_estado_final := CASE LOWER(TRIM(p_estado))
            WHEN 'completada' THEN 'Completada'
            WHEN 'confirmada' THEN 'Confirmada'
            WHEN 'no-show'    THEN 'No-Show'
            WHEN 'noshow'     THEN 'No-Show'
            WHEN 'no show'    THEN 'No-Show'
            WHEN 'cancelada'  THEN 'Cancelada'
            WHEN 'reagendada' THEN 'Reagendada'
            ELSE 'Pendiente'
        END;
    ELSE
        v_estado_final := 'Pendiente';
    END IF;

    -- 1. Validar Staff activo si se especifica
    IF p_staff_id IS NOT NULL THEN
        SELECT activo INTO v_staff_activo FROM staff WHERE id = p_staff_id AND business_id = p_business_id;
        IF NOT FOUND OR v_staff_activo = false THEN
            RETURN jsonb_build_object('success', false, 'error', 'INVALID_STAFF', 'message', 'Especialista no disponible.');
        END IF;
    END IF;

    -- 2. Calcular fin y detectar conflictos
    v_fecha_fin := p_fecha + (p_duracion_min || ' minutes')::INTERVAL;

    IF p_fecha >= NOW() - INTERVAL '2 hours' THEN
        SELECT EXISTS (
            SELECT 1 FROM "Citas" c
            WHERE c.business_id = p_business_id
              AND c.estado NOT IN ('Cancelada', 'No-Show', 'Reagendada')
              AND (
                (p_staff_id IS NOT NULL AND c.staff_id = p_staff_id)
                OR
                (p_staff_id IS NULL AND c.staff_id IS NULL AND c.categoria IS NOT DISTINCT FROM p_categoria)
              )
              AND (p_fecha < c.fecha + (COALESCE(c.duracion_min, 60) || ' minutes')::INTERVAL AND v_fecha_fin > c.fecha)
        ) INTO v_conflicto;

        IF v_conflicto THEN
            RETURN jsonb_build_object('success', false, 'error', 'STAFF_CONFLICT', 'message', 'Horario ocupado.');
        END IF;
    END IF;

    -- 3. INSERTAR CITA
    INSERT INTO "Citas" (
        business_id, fecha, duracion_min, cliente_id,
        nombre, servicio, precio, estado, staff_id, categoria,
        origen_cita, requiere_deposito, monto_deposito, comprobante_pago_url, deposito_verificado,
        hora_fin
    )
    VALUES (
        p_business_id, p_fecha, p_duracion_min, p_cliente_id,
        p_nombre, p_servicio, p_precio,
        v_estado_final,
        p_staff_id, p_categoria,
        p_origen_cita, p_requiere_deposito, p_monto_deposito, p_comprobante_url, false,
        CASE WHEN v_estado_final = 'Completada' THEN v_fecha_fin ELSE NULL END
    )
    RETURNING id INTO v_new_id;

    -- 4. ACTUALIZAR CLIENTE (solo si fue atendida)
    IF p_cliente_id IS NOT NULL AND v_estado_final NOT IN ('Cancelada', 'No-Show') THEN
        UPDATE "Clientes"
        SET ultimo_servicio = p_servicio,
            ultima_visita = CASE WHEN v_estado_final = 'Completada' THEN p_fecha ELSE ultima_visita END,
            primera_visita = COALESCE(primera_visita, p_fecha)
        WHERE id = p_cliente_id AND business_id = p_business_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'id',      v_new_id,
        'message', 'Cita agendada exitosamente',
        'requiere_deposito', p_requiere_deposito,
        'estado_asignado', v_estado_final
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLSTATE, 'message', SQLERRM);
END;
$function$;
`);
  console.log('✅ crear_cita_segura actualizada.');

  await client.end();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
