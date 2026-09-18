-- =============================================================================
-- Migración: reliability_score_expert_logic.sql
-- Propósito: Lógica experta de fiabilidad para salones de belleza.
-- 
-- FILOSOFÍA:
--   El tiempo del especialista es inventario perecedero. Un No-Show tiene
--   costo financiero directo e inmediato. La clienta que falta sin avisar
--   y no encuentra consecuencia tiene >60% de probabilidad de reincidir.
--
-- ESCALA DE PUNTOS (0-100, inicio en 100):
--   ✅ Completada (asistió)          : +10 pts
--   🚫 No-Show (plantón)             : -55 pts → 1 No-Show = zona roja inmediata
--   ❌ Cancelación crítica (<2h)     : -20 pts → 5 cancelaciones críticas = zona roja
--   ⚠️  Cancelación moderada (2-24h) : -10 pts → penalización razonable
--   ✔️  Cancelación con tiempo (>24h) : -3 pts  → simbólica, avisó con anticipación
--
-- ZONA DE DEPÓSITO OBLIGATORIO: score < 50 pts
--   → 1 No-Show (100 - 55 = 45) = ROJO inmediato ✓
--   → 5 cancelaciones críticas (100 - 100 = 0) = ROJO ✓
--   → Recuperación: ~5 citas perfectas para salir de zona roja (5 × +10 = +50) ✓
-- =============================================================================

-- 1. Actualizar defaults de columnas en negocios
ALTER TABLE negocios 
  ALTER COLUMN pts_ganados_completada SET DEFAULT 10,
  ALTER COLUMN pts_perdidos_noshow SET DEFAULT -55,
  ALTER COLUMN pts_perdidos_cancelada_24h SET DEFAULT -3,
  ALTER COLUMN pts_perdidos_cancelada_2h SET DEFAULT -10,
  ALTER COLUMN pts_perdidos_cancelada_critica SET DEFAULT -20;

-- 2. Actualizar todos los negocios con valores por defecto anteriores
UPDATE negocios
SET 
  pts_perdidos_noshow = -55,
  pts_perdidos_cancelada_24h = -3,
  pts_perdidos_cancelada_2h = -10,
  pts_perdidos_cancelada_critica = -20
WHERE 
  pts_perdidos_noshow = -40
  AND pts_perdidos_cancelada_24h = -5
  AND pts_perdidos_cancelada_2h = -15
  AND pts_perdidos_cancelada_critica = -30;

-- 3. Trigger ajustar_fiabilidad (con fallbacks actualizados)
CREATE OR REPLACE FUNCTION public.ajustar_fiabilidad()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_puntos_objetivo INTEGER := 0;
  v_puntos_actuales INTEGER := 0;
  v_puntos_delta INTEGER := 0;
  v_score_actual INTEGER;
  v_score_nuevo INTEGER;
  v_horas_anticipacion NUMERIC;
  v_cliente_existe BOOLEAN;
  v_config RECORD;
BEGIN
  SELECT 
    pts_ganados_completada, 
    pts_perdidos_noshow, 
    pts_perdidos_cancelada_24h, 
    pts_perdidos_cancelada_2h, 
    pts_perdidos_cancelada_critica 
  INTO v_config
  FROM public.negocios 
  WHERE id = NEW.business_id;

  -- Fallback experto para salones (1 plantón = zona roja inmediata)
  IF v_config.pts_ganados_completada IS NULL THEN
    v_config.pts_ganados_completada       := 10;
    v_config.pts_perdidos_noshow          := -55;
    v_config.pts_perdidos_cancelada_24h   := -3;
    v_config.pts_perdidos_cancelada_2h    := -10;
    v_config.pts_perdidos_cancelada_critica := -20;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.estado = NEW.estado THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS(SELECT 1 FROM "Clientes" WHERE id = NEW.cliente_id) INTO v_cliente_existe;
  IF NOT v_cliente_existe THEN
    RETURN NEW;
  END IF;

  SELECT fiabilidad_score INTO v_score_actual 
  FROM "Clientes" WHERE id = NEW.cliente_id;
  v_score_actual := COALESCE(v_score_actual, 100);

  CASE LOWER(NEW.estado)
    WHEN 'pendiente'  THEN v_puntos_objetivo := 0;
    WHEN 'agendada'   THEN v_puntos_objetivo := 0;
    WHEN 'completada' THEN v_puntos_objetivo := v_config.pts_ganados_completada;
    WHEN 'modificada' THEN v_puntos_objetivo := -2;
    WHEN 'no-show'    THEN v_puntos_objetivo := v_config.pts_perdidos_noshow;
    WHEN 'cancelada'  THEN
      v_horas_anticipacion := EXTRACT(EPOCH FROM (NEW.fecha - NOW())) / 3600;
      IF    v_horas_anticipacion > 24 THEN v_puntos_objetivo := v_config.pts_perdidos_cancelada_24h;
      ELSIF v_horas_anticipacion > 2  THEN v_puntos_objetivo := v_config.pts_perdidos_cancelada_2h;
      ELSE                                 v_puntos_objetivo := v_config.pts_perdidos_cancelada_critica;
      END IF;
    ELSE v_puntos_objetivo := 0;
  END CASE;

  SELECT COALESCE(SUM(puntos_cambio), 0) INTO v_puntos_actuales
  FROM historial_fiabilidad
  WHERE cita_id = NEW.id;

  v_puntos_delta := v_puntos_objetivo - v_puntos_actuales;
  IF v_puntos_delta = 0 THEN RETURN NEW; END IF;

  v_score_nuevo := GREATEST(0, LEAST(100, v_score_actual + v_puntos_delta));
  UPDATE "Clientes" SET fiabilidad_score = v_score_nuevo WHERE id = NEW.cliente_id;

  INSERT INTO historial_fiabilidad 
    (cliente_id, cita_id, evento, puntos_cambio, puntos_antes, puntos_despues)
  VALUES 
    (NEW.cliente_id, NEW.id, NEW.estado, v_puntos_delta, v_score_actual, v_score_nuevo);

  RETURN NEW;
END;
$function$;

-- 4. RPC actualizar_estado_cita_y_puntos (función principal con auditoría automática)
CREATE OR REPLACE FUNCTION public.actualizar_estado_cita_y_puntos(
    p_cita_id bigint, 
    p_estado text, 
    p_business_id uuid, 
    p_hora_fin timestamp with time zone DEFAULT NULL::timestamp with time zone
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_cita RECORD;
    v_cliente RECORD;
    v_config RECORD;
    v_puntos_base INT := 10;
    v_estado_anterior TEXT;
    v_score_actual INT;
    v_nuevo_score INT;
    v_puntos_actuales INT;
    v_nuevos_puntos INT;
    v_monto_gasto NUMERIC := 0;
    v_hora_fin_real TIMESTAMPTZ;
    v_horas_anticipacion NUMERIC;
    v_pts_cambio_fiabilidad INT := 0;
BEGIN
    SELECT * INTO v_cita
    FROM "Citas"
    WHERE id = p_cita_id AND business_id = p_business_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'NOT_FOUND', 'message', 'Cita no encontrada.');
    END IF;

    v_estado_anterior := v_cita.estado;
    v_monto_gasto := COALESCE(v_cita.precio, 0);

    IF p_estado = 'Completada' THEN
        v_hora_fin_real := COALESCE(p_hora_fin, v_cita.hora_fin, CURRENT_TIMESTAMP);
    ELSE
        v_hora_fin_real := v_cita.hora_fin;
    END IF;

    IF v_estado_anterior = p_estado AND p_hora_fin IS NULL THEN
        RETURN json_build_object('success', true, 'id', p_cita_id, 'estado', p_estado, 'message', 'El estado ya es el actual.');
    END IF;

    SELECT 
        pts_ganados_completada, pts_perdidos_noshow,
        pts_perdidos_cancelada_24h, pts_perdidos_cancelada_2h, pts_perdidos_cancelada_critica
    INTO v_config FROM public.negocios WHERE id = p_business_id;

    IF v_config.pts_ganados_completada IS NULL THEN
        v_config.pts_ganados_completada       := 10;
        v_config.pts_perdidos_noshow          := -55;
        v_config.pts_perdidos_cancelada_24h   := -3;
        v_config.pts_perdidos_cancelada_2h    := -10;
        v_config.pts_perdidos_cancelada_critica := -20;
    END IF;

    IF v_cita.cliente_id IS NOT NULL THEN
        SELECT * INTO v_cliente FROM "Clientes"
        WHERE id = v_cita.cliente_id AND business_id = p_business_id FOR UPDATE;

        IF FOUND THEN
            v_score_actual    := COALESCE(v_cliente.fiabilidad_score, 100);
            v_nuevo_score     := v_score_actual;
            v_puntos_actuales := COALESCE(v_cliente.puntos_acumulados, 0);
            v_nuevos_puntos   := v_puntos_actuales;

            -- A) NO-SHOW: -55 pts → 1 plantón = zona roja inmediata (45 pts < 50)
            IF p_estado = 'No-Show' THEN
                v_pts_cambio_fiabilidad := v_config.pts_perdidos_noshow;
                IF v_pts_cambio_fiabilidad > 0 THEN v_pts_cambio_fiabilidad := -v_pts_cambio_fiabilidad; END IF;
                v_nuevo_score := GREATEST(0, LEAST(100, v_score_actual + v_pts_cambio_fiabilidad));

            -- B) CANCELADA: graduada por anticipación
            --    >24h:  -3 pts  (responsable, avisó con tiempo)
            --    2-24h: -10 pts (generó hueco imprevisto)
            --    <2h:   -20 pts (crítico, casi un plantón)
            ELSIF p_estado = 'Cancelada' THEN
                IF v_cita.fecha IS NOT NULL THEN
                    v_horas_anticipacion := EXTRACT(EPOCH FROM (v_cita.fecha - CURRENT_TIMESTAMP)) / 3600.0;
                ELSE
                    v_horas_anticipacion := 0;
                END IF;

                IF    v_horas_anticipacion > 24 THEN v_pts_cambio_fiabilidad := v_config.pts_perdidos_cancelada_24h;
                ELSIF v_horas_anticipacion > 2  THEN v_pts_cambio_fiabilidad := v_config.pts_perdidos_cancelada_2h;
                ELSE                                 v_pts_cambio_fiabilidad := v_config.pts_perdidos_cancelada_critica;
                END IF;

                IF v_pts_cambio_fiabilidad > 0 THEN v_pts_cambio_fiabilidad := -v_pts_cambio_fiabilidad; END IF;
                v_nuevo_score := GREATEST(0, LEAST(100, v_score_actual + v_pts_cambio_fiabilidad));

            -- C) COMPLETADA: +10 pts. Recupera zona roja en ~5 citas perfectas consecutivas.
            ELSIF p_estado = 'Completada' THEN
                v_pts_cambio_fiabilidad := v_config.pts_ganados_completada;
                IF v_pts_cambio_fiabilidad < 0 THEN v_pts_cambio_fiabilidad := ABS(v_pts_cambio_fiabilidad); END IF;
                v_nuevo_score   := LEAST(100, v_score_actual + v_pts_cambio_fiabilidad);
                v_nuevos_puntos := v_puntos_actuales + v_puntos_base;

            -- D) REVERTIR: busca el último impacto en historial para revertir exactamente
            ELSIF p_estado IN ('Pendiente', 'Confirmada') THEN
                SELECT -COALESCE(puntos_cambio, 0) INTO v_pts_cambio_fiabilidad
                FROM historial_fiabilidad WHERE cita_id = p_cita_id ORDER BY id DESC LIMIT 1;

                IF v_pts_cambio_fiabilidad IS NULL THEN
                    v_pts_cambio_fiabilidad := CASE v_estado_anterior
                        WHEN 'No-Show'    THEN 55
                        WHEN 'Cancelada'  THEN 10
                        WHEN 'Completada' THEN -10
                        ELSE 0
                    END;
                END IF;

                v_nuevo_score := GREATEST(0, LEAST(100, v_score_actual + v_pts_cambio_fiabilidad));
                IF v_estado_anterior = 'Completada' THEN
                    v_nuevos_puntos := GREATEST(0, v_puntos_actuales - v_puntos_base);
                END IF;
            END IF;

            UPDATE "Clientes"
            SET 
                fiabilidad_score  = v_nuevo_score,
                puntos_acumulados = v_nuevos_puntos,
                total_visitas = CASE 
                    WHEN p_estado = 'Completada'    AND v_estado_anterior != 'Completada' THEN COALESCE(total_visitas, 0) + 1
                    WHEN v_estado_anterior = 'Completada' AND p_estado != 'Completada'   THEN GREATEST(0, COALESCE(total_visitas, 1) - 1)
                    ELSE total_visitas
                END,
                ultima_visita = CASE 
                    WHEN p_estado = 'Completada' THEN COALESCE(v_hora_fin_real, CURRENT_TIMESTAMP)
                    ELSE ultima_visita
                END
            WHERE id = v_cita.cliente_id AND business_id = p_business_id;

            -- Auditoría automática en historial_fiabilidad
            IF v_pts_cambio_fiabilidad != 0 OR v_score_actual != v_nuevo_score THEN
                INSERT INTO historial_fiabilidad (
                    cliente_id, cita_id, evento, 
                    puntos_cambio, puntos_antes, puntos_despues, created_at
                ) VALUES (
                    v_cita.cliente_id, p_cita_id, p_estado,
                    v_pts_cambio_fiabilidad, v_score_actual, v_nuevo_score, CURRENT_TIMESTAMP
                );
            END IF;
        END IF;
    END IF;

    UPDATE "Citas"
    SET 
        estado = p_estado,
        hora_fin = CASE 
            WHEN p_estado = 'Completada' THEN v_hora_fin_real
            WHEN p_estado IN ('Pendiente', 'Confirmada') AND v_estado_anterior = 'Completada' THEN NULL
            ELSE hora_fin
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_cita_id AND business_id = p_business_id;

    RETURN json_build_object(
        'success', true,
        'id', p_cita_id,
        'estado_anterior', v_estado_anterior,
        'nuevo_estado', p_estado,
        'hora_fin', v_hora_fin_real,
        'fiabilidad_score', v_nuevo_score,
        'puntos_acumulados', v_nuevos_puntos,
        'puntos_cambio', v_pts_cambio_fiabilidad,
        'message', 'Estado y fiabilidad actualizados exitosamente.'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLSTATE, 'message', 'Error: ' || SQLERRM);
END;
$function$;
