-- Migration: fix_business_hours_sync
-- Description: Fix crear_cita_multiple_segura to read business hours from negocio_info
--              (which is the source of truth updated by the "Mi Salón" settings UI)
--              instead of only reading from negocios.hora_apertura / hora_cierre.
--
-- Root cause: The "Mi Salón" section saves hours to negocio_info with keys:
--   - horario_semana  → "7am - 10pm"   (weekdays)
--   - horario_sabado  → "7am - 8pm"    (saturday)
--   - horario_domingo → "8am - 6pm"    (sunday)
-- But the RPC only checked negocios.hora_apertura (still set to 09:00:00 by default).

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

    -- Validaciones generales de horario
    v_negocio_apertura  TIME;
    v_negocio_cierre    TIME;
    v_hora_inicio_local TIME;

    -- Horario desde negocio_info (nueva fuente de verdad)
    v_horario_semana    TEXT;
    v_horario_sabado    TEXT;
    v_horario_domingo   TEXT;
    v_dia_semana        INT;  -- 0=Domingo, 1=Lunes ... 6=Sábado
    v_horario_str       TEXT;

    -- Variables para el Depósito
    v_requiere_deposito BOOLEAN;
    v_monto_deposito    NUMERIC;

    -- Negocio existe
    v_negocio_existe    BOOLEAN;

BEGIN
    -- 0. VALIDACIONES GENERALES
    v_num_servicios := jsonb_array_length(p_servicios);
    IF v_num_servicios = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'NO_SERVICES', 'message', 'Debes seleccionar al menos un servicio.');
    END IF;

    -- Verificar que el negocio existe
    SELECT EXISTS(SELECT 1 FROM negocios WHERE id = p_business_id)
    INTO v_negocio_existe;

    IF NOT v_negocio_existe THEN
        RETURN jsonb_build_object('success', false, 'error', 'INVALID_BUSINESS', 'message', 'Negocio no encontrado.');
    END IF;

    -- Capturar hora local de inicio (Usa timezone de Lima como fallback)
    v_hora_inicio_local := (p_fecha_inicio AT TIME ZONE 'America/Lima')::TIME;

    -- Obtener día de semana de la fecha local (0=Domingo, 6=Sábado en PostgreSQL EXTRACT)
    v_dia_semana := EXTRACT(DOW FROM (p_fecha_inicio AT TIME ZONE 'America/Lima'))::INT;

    -- ─────────────────────────────────────────────────────────────────────────
    -- FUENTE DE VERDAD: Leer horarios desde negocio_info (configurados en Mi Salón)
    -- Claves nuevas: horario_semana, horario_sabado, horario_domingo
    -- Claves legacy: hora_apertura, hora_cierre
    -- ─────────────────────────────────────────────────────────────────────────
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

    -- Seleccionar el string de horario según día de semana
    -- v_dia_semana: 0=Domingo, 1-5=Lun-Vie, 6=Sábado
    IF v_dia_semana = 0 THEN
        v_horario_str := v_horario_domingo;
    ELSIF v_dia_semana = 6 THEN
        v_horario_str := v_horario_sabado;
    ELSE
        v_horario_str := v_horario_semana;
    END IF;

    -- Helper: parsear horario string "7am - 10pm" → apertura y cierre
    -- Si el formato nuevo existe, usarlo. Sino, caer al legado de negocios.
    IF v_horario_str IS NOT NULL AND v_horario_str != '' AND v_horario_str != 'CERRADO' THEN
        -- Parsear formato "Xam - Ypm" o "X:MMam - Y:MMpm"
        DECLARE
            v_parts  TEXT[];
            v_open   TEXT;
            v_close  TEXT;
            v_open_h  INT;
            v_open_m  INT;
            v_close_h INT;
            v_close_m INT;
        BEGIN
            v_parts := regexp_split_to_array(lower(v_horario_str), '\s*-\s*');
            IF array_length(v_parts, 1) = 2 THEN
                v_open  := trim(v_parts[1]);
                v_close := trim(v_parts[2]);

                -- Parsear hora apertura
                IF v_open ~ '(\d+):(\d+)(am|pm)' THEN
                    v_open_h := (regexp_match(v_open, '(\d+):(\d+)(am|pm)'))[1]::INT;
                    v_open_m := (regexp_match(v_open, '(\d+):(\d+)(am|pm)'))[2]::INT;
                    IF v_open ~ 'pm' AND v_open_h < 12 THEN v_open_h := v_open_h + 12; END IF;
                    IF v_open ~ 'am' AND v_open_h = 12 THEN v_open_h := 0; END IF;
                ELSIF v_open ~ '(\d+)(am|pm)' THEN
                    v_open_h := (regexp_match(v_open, '(\d+)(am|pm)'))[1]::INT;
                    v_open_m := 0;
                    IF v_open ~ 'pm' AND v_open_h < 12 THEN v_open_h := v_open_h + 12; END IF;
                    IF v_open ~ 'am' AND v_open_h = 12 THEN v_open_h := 0; END IF;
                ELSE
                    v_open_h := 9; v_open_m := 0; -- fallback
                END IF;

                -- Parsear hora cierre
                IF v_close ~ '(\d+):(\d+)(am|pm)' THEN
                    v_close_h := (regexp_match(v_close, '(\d+):(\d+)(am|pm)'))[1]::INT;
                    v_close_m := (regexp_match(v_close, '(\d+):(\d+)(am|pm)'))[2]::INT;
                    IF v_close ~ 'pm' AND v_close_h < 12 THEN v_close_h := v_close_h + 12; END IF;
                    IF v_close ~ 'am' AND v_close_h = 12 THEN v_close_h := 0; END IF;
                ELSIF v_close ~ '(\d+)(am|pm)' THEN
                    v_close_h := (regexp_match(v_close, '(\d+)(am|pm)'))[1]::INT;
                    v_close_m := 0;
                    IF v_close ~ 'pm' AND v_close_h < 12 THEN v_close_h := v_close_h + 12; END IF;
                    IF v_close ~ 'am' AND v_close_h = 12 THEN v_close_h := 0; END IF;
                ELSE
                    v_close_h := 21; v_close_m := 0; -- fallback
                END IF;

                v_negocio_apertura := make_time(v_open_h, v_open_m, 0);
                v_negocio_cierre   := make_time(v_close_h, v_close_m, 0);
            END IF;
        EXCEPTION WHEN OTHERS THEN
            -- Si falla el parseo, caer al legado
            v_negocio_apertura := NULL;
            v_negocio_cierre   := NULL;
        END;
    ELSIF v_horario_str = 'CERRADO' THEN
        -- Día cerrado según configuración de Mi Salón
        RETURN jsonb_build_object(
            'success', false,
            'error', 'CLOSED_DAY',
            'message', 'El negocio está cerrado ese día según el horario configurado.'
        );
    END IF;

    -- Fallback: si no hay horario en negocio_info, usar tabla negocios (legado)
    IF v_negocio_apertura IS NULL THEN
        SELECT hora_apertura, hora_cierre
        INTO v_negocio_apertura, v_negocio_cierre
        FROM negocios
        WHERE id = p_business_id;
    END IF;

    -- Validar horario si es futura
    IF p_fecha_inicio >= NOW() - INTERVAL '10 minutes' THEN
        IF v_negocio_apertura IS NOT NULL AND v_hora_inicio_local < v_negocio_apertura THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'OUTSIDE_BUSINESS_HOURS',
                'message', format('El negocio abre a las %s. No puedes agendar antes.', to_char(v_negocio_apertura, 'HH12:MI AM'))
            );
        END IF;

        IF v_negocio_cierre IS NOT NULL AND v_hora_inicio_local >= v_negocio_cierre THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'OUTSIDE_BUSINESS_HOURS',
                'message', format('El negocio cierra a las %s. No puedes agendar después.', to_char(v_negocio_cierre, 'HH12:MI AM'))
            );
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


-- ─────────────────────────────────────────────────────────────────────────────
-- SYNC: Actualizar tabla negocios con los valores correctos de negocio_info
-- para todos los negocios existentes.
-- ─────────────────────────────────────────────────────────────────────────────

-- Función auxiliar para parsear "7am" / "10pm" / "9:30am" → TIME
CREATE OR REPLACE FUNCTION public.parse_am_pm_to_time(v_str TEXT)
RETURNS TIME
LANGUAGE plpgsql
AS $$
DECLARE
    v_h INT;
    v_m INT;
BEGIN
    v_str := lower(trim(v_str));
    IF v_str ~ '(\d+):(\d+)(am|pm)' THEN
        v_h := (regexp_match(v_str, '(\d+):(\d+)(am|pm)'))[1]::INT;
        v_m := (regexp_match(v_str, '(\d+):(\d+)(am|pm)'))[2]::INT;
        IF v_str ~ 'pm' AND v_h < 12 THEN v_h := v_h + 12; END IF;
        IF v_str ~ 'am' AND v_h = 12 THEN v_h := 0; END IF;
    ELSIF v_str ~ '(\d+)(am|pm)' THEN
        v_h := (regexp_match(v_str, '(\d+)(am|pm)'))[1]::INT;
        v_m := 0;
        IF v_str ~ 'pm' AND v_h < 12 THEN v_h := v_h + 12; END IF;
        IF v_str ~ 'am' AND v_h = 12 THEN v_h := 0; END IF;
    ELSE
        RETURN NULL;
    END IF;
    RETURN make_time(v_h, v_m, 0);
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$;


-- Sincronizar negocios.hora_apertura y hora_cierre desde negocio_info.horario_semana
-- para todos los negocios que tienen el nuevo formato configurado
DO $$
DECLARE
    v_business RECORD;
    v_horario  TEXT;
    v_parts    TEXT[];
    v_apertura TIME;
    v_cierre   TIME;
BEGIN
    FOR v_business IN
        SELECT DISTINCT business_id
        FROM negocio_info
        WHERE clave = 'horario_semana'
          AND valor_texto IS NOT NULL
          AND valor_texto != ''
          AND valor_texto != 'CERRADO'
    LOOP
        SELECT valor_texto INTO v_horario
        FROM negocio_info
        WHERE business_id = v_business.business_id AND clave = 'horario_semana';

        v_parts := regexp_split_to_array(lower(v_horario), '\s*-\s*');

        IF array_length(v_parts, 1) = 2 THEN
            v_apertura := public.parse_am_pm_to_time(v_parts[1]);
            v_cierre   := public.parse_am_pm_to_time(v_parts[2]);

            IF v_apertura IS NOT NULL AND v_cierre IS NOT NULL THEN
                UPDATE negocios
                SET hora_apertura = v_apertura,
                    hora_cierre   = v_cierre
                WHERE id = v_business.business_id;

                RAISE NOTICE 'Updated negocio % → apertura: %, cierre: %',
                    v_business.business_id, v_apertura, v_cierre;
            END IF;
        END IF;
    END LOOP;
END;
$$;
