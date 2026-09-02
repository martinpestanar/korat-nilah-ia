-- Migración: appointment_reliability_and_status_patch.sql
-- Propósito: Manejo atómico de estados de citas con deducción/adición de fiabilidad_score y puntos de fidelidad.

CREATE OR REPLACE FUNCTION public.actualizar_estado_cita_y_puntos(
    p_cita_id bigint,
    p_estado text,
    p_business_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_cita RECORD;
    v_cliente RECORD;
    v_puntos_base INT := 10;
    v_estado_anterior TEXT;
    v_score_actual INT;
    v_nuevo_score INT;
    v_puntos_actuales INT;
    v_nuevos_puntos INT;
    v_monto_gasto NUMERIC := 0;
BEGIN
    -- 1. Obtener la cita actual
    SELECT * INTO v_cita
    FROM "Citas"
    WHERE id = p_cita_id AND business_id = p_business_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'NOT_FOUND', 'message', 'Cita no encontrada.');
    END IF;

    v_estado_anterior := v_cita.estado;
    v_monto_gasto := COALESCE(v_cita.precio, 0);

    -- Si el estado es exactamente el mismo, no hacer nada
    IF v_estado_anterior = p_estado THEN
        RETURN jsonb_build_object('success', true, 'id', p_cita_id, 'estado', p_estado, 'message', 'El estado ya es el actual.');
    END IF;

    -- 2. Si la cita tiene cliente asociado, ajustar su fiabilidad y puntos de fidelidad
    IF v_cita.cliente_id IS NOT NULL THEN
        SELECT * INTO v_cliente
        FROM "Clientes"
        WHERE id = v_cita.cliente_id AND business_id = p_business_id
        FOR UPDATE;

        IF FOUND THEN
            v_score_actual := COALESCE(v_cliente.fiabilidad_score, 100);
            v_nuevo_score := v_score_actual;
            v_puntos_actuales := COALESCE(v_cliente.puntos_acumulados, 0);
            v_nuevos_puntos := v_puntos_actuales;

            -- A) PASAR A NO-SHOW (Plantón grave: -30 pts de fiabilidad)
            IF p_estado = 'No-Show' THEN
                v_nuevo_score := GREATEST(0, v_score_actual - 30);

            -- B) PASAR A CANCELADA (Canceló avisando: -10 pts de fiabilidad)
            ELSIF p_estado = 'Cancelada' THEN
                v_nuevo_score := GREATEST(0, v_score_actual - 10);

            -- C) PASAR A COMPLETADA (Asistió y pagó: +10 pts de fiabilidad hasta 100, +puntos fidelidad)
            ELSIF p_estado = 'Completada' THEN
                v_nuevo_score := LEAST(100, v_score_actual + 10);
                v_nuevos_puntos := v_puntos_actuales + v_puntos_base;

            -- D) REVERTIR A PENDIENTE O CONFIRMADA (Desde estados finales)
            ELSIF p_estado IN ('Pendiente', 'Confirmada') THEN
                IF v_estado_anterior = 'No-Show' THEN
                    v_nuevo_score := LEAST(100, v_score_actual + 30);
                ELSIF v_estado_anterior = 'Cancelada' THEN
                    v_nuevo_score := LEAST(100, v_score_actual + 10);
                ELSIF v_estado_anterior = 'Completada' THEN
                    v_nuevo_score := GREATEST(0, v_score_actual - 10);
                    v_nuevos_puntos := GREATEST(0, v_puntos_actuales - v_puntos_base);
                END IF;
            END IF;

            -- Actualizar cliente
            UPDATE "Clientes"
            SET 
                fiabilidad_score = v_nuevo_score,
                puntos_acumulados = v_nuevos_puntos,
                total_visitas = CASE 
                    WHEN p_estado = 'Completada' AND v_estado_anterior != 'Completada' THEN COALESCE(total_visitas, 0) + 1
                    WHEN v_estado_anterior = 'Completada' AND p_estado != 'Completada' THEN GREATEST(0, COALESCE(total_visitas, 1) - 1)
                    ELSE total_visitas
                END,
                ultima_visita = CASE 
                    WHEN p_estado = 'Completada' THEN CURRENT_TIMESTAMP
                    ELSE ultima_visita
                END
            WHERE id = v_cita.cliente_id AND business_id = p_business_id;
        END IF;
    END IF;

    -- 3. Actualizar la cita con el nuevo estado
    UPDATE "Citas"
    SET 
        estado = p_estado,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_cita_id AND business_id = p_business_id;

    RETURN jsonb_build_object(
        'success', true,
        'id', p_cita_id,
        'estado_anterior', v_estado_anterior,
        'nuevo_estado', p_estado,
        'fiabilidad_score', v_nuevo_score,
        'puntos_acumulados', v_nuevos_puntos,
        'message', 'Estado actualizado exitosamente.'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLSTATE, 'message', 'Error: ' || SQLERRM);
END;
$function$;
