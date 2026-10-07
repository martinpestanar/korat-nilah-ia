-- ==============================================================================
-- MIGRACIÓN DEFINITIVA: Automatización de Cumpleaños VIP (Anticipado + Día D)
-- Diseñada para alimentar cola_mensajes_salientes con instance_name y api_key
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.encolar_cumpleanos()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_negocio RECORD;
  v_cliente RECORD;
  v_plantilla_anticipado RECORD;
  v_plantilla_dia RECORD;
  v_total_encolados INT := 0;
  v_dias_anticipacion INT := 5;
  v_mensaje TEXT;
  v_hoy DATE := CURRENT_DATE;
  v_fecha_anticipada DATE;
  v_telefono_limpio TEXT;
BEGIN
  -- Iterar sobre negocios con bot_enabled y flujo cumpleanos activo
  FOR v_negocio IN
    SELECT 
      n.id, 
      n.nombre, 
      n.bot_config, 
      n.recursos_saas,
      n.instance_name,
      n.api_key
    FROM public.negocios n
    WHERE (n.bot_config->>'bot_enabled')::boolean IS TRUE
      AND (
        (n.recursos_saas->'automatizaciones'->'flujos_activos'->>'cumpleanos')::boolean IS TRUE
        OR (n.bot_config->'flujos_activos'->>'cumpleanos')::boolean IS TRUE
      )
  LOOP
    -- Si el negocio no tiene instancia de WhatsApp configurada, saltar
    IF v_negocio.instance_name IS NULL OR v_negocio.api_key IS NULL THEN
      CONTINUE;
    END IF;

    -- Días de anticipación (default 5 días, configurable)
    v_dias_anticipacion := COALESCE(
      (v_negocio.bot_config->'cumpleanos_config'->>'dias_anticipacion')::int,
      5
    );
    v_fecha_anticipada := v_hoy + v_dias_anticipacion;

    -- 1. Obtener plantilla Tiempo 1 (Anticipado)
    SELECT * INTO v_plantilla_anticipado
    FROM public.plantillas_automatizacion
    WHERE business_id = v_negocio.id
      AND flujo = 'cumpleanos_anticipado'
      AND activo = true
    LIMIT 1;

    IF v_plantilla_anticipado IS NULL THEN
      SELECT * INTO v_plantilla_anticipado
      FROM public.plantillas_automatizacion_globales
      WHERE flujo = 'cumpleanos_anticipado'
        AND activo = true
      ORDER BY es_default DESC
      LIMIT 1;
    END IF;

    -- 2. Obtener plantilla Tiempo 2 (Día D)
    SELECT * INTO v_plantilla_dia
    FROM public.plantillas_automatizacion
    WHERE business_id = v_negocio.id
      AND flujo = 'cumpleanos_dia_d'
      AND activo = true
    LIMIT 1;

    IF v_plantilla_dia IS NULL THEN
      SELECT * INTO v_plantilla_dia
      FROM public.plantillas_automatizacion_globales
      WHERE flujo = 'cumpleanos_dia_d'
        AND activo = true
      ORDER BY es_default DESC
      LIMIT 1;
    END IF;

    -- =========================================================================
    -- TIEMPO 1: Anticipado (5 o 6 días antes)
    -- =========================================================================
    IF v_plantilla_anticipado IS NOT NULL AND v_plantilla_anticipado.contenido IS NOT NULL THEN
      FOR v_cliente IN
        SELECT c.id, c.nombre, c.telefono, c.cumpleanos
        FROM public.clientes c
        WHERE c.business_id = v_negocio.id
          AND c.telefono IS NOT NULL
          AND c.cumpleanos IS NOT NULL
          AND EXTRACT(MONTH FROM c.cumpleanos) = EXTRACT(MONTH FROM v_fecha_anticipada)
          AND EXTRACT(DAY FROM c.cumpleanos) = EXTRACT(DAY FROM v_fecha_anticipada)
          -- Cooldown de 300 días (1 vez al año)
          AND NOT EXISTS (
            SELECT 1 FROM public.autopilot_logs l
            WHERE l.business_id = v_negocio.id
              AND l.cliente_id = c.id
              AND l.flujo = 'cumpleanos_anticipado'
              AND l.created_at >= (NOW() - INTERVAL '300 days')
          )
      LOOP
        v_telefono_limpio := REGEXP_REPLACE(v_cliente.telefono, '[^0-9]', '', 'g');
        IF LENGTH(v_telefono_limpio) < 8 THEN
          CONTINUE;
        END IF;

        v_mensaje := v_plantilla_anticipado.contenido;
        v_mensaje := REPLACE(v_mensaje, '{nombre_cliente}', COALESCE(v_cliente.nombre, ''));
        v_mensaje := REPLACE(v_mensaje, '{nombre}', COALESCE(v_cliente.nombre, ''));
        v_mensaje := REPLACE(v_mensaje, '{nombre_negocio}', COALESCE(v_negocio.nombre, ''));
        v_mensaje := REPLACE(v_mensaje, '{salon}', COALESCE(v_negocio.nombre, ''));
        v_mensaje := REPLACE(v_mensaje, '{dias_faltantes}', v_dias_anticipacion::text);

        -- Insertar en cola de mensajes salientes para Evolution API
        INSERT INTO public.cola_mensajes_salientes (
          business_id,
          cliente_id,
          telefono,
          flujo,
          mensaje,
          instance_name,
          api_key,
          estado,
          metadata
        ) VALUES (
          v_negocio.id,
          v_cliente.id,
          v_telefono_limpio,
          'cumpleanos_anticipado',
          v_mensaje,
          v_negocio.instance_name,
          v_negocio.api_key,
          'pendiente',
          jsonb_build_object('anticipacion_dias', v_dias_anticipacion, 'fecha_cumple', v_cliente.cumpleanos)
        );

        -- Registrar en autopilot_logs
        INSERT INTO public.autopilot_logs (
          business_id,
          cliente_id,
          flujo,
          estado,
          metadata
        ) VALUES (
          v_negocio.id,
          v_cliente.id,
          'cumpleanos_anticipado',
          'pendiente',
          jsonb_build_object('anticipacion_dias', v_dias_anticipacion, 'fecha_cumple', v_cliente.cumpleanos)
        );

        v_total_encolados := v_total_encolados + 1;
      END LOOP;
    END IF;

    -- =========================================================================
    -- TIEMPO 2: Día D (Mismo día de cumpleaños)
    -- =========================================================================
    IF v_plantilla_dia IS NOT NULL AND v_plantilla_dia.contenido IS NOT NULL THEN
      FOR v_cliente IN
        SELECT c.id, c.nombre, c.telefono, c.cumpleanos
        FROM public.clientes c
        WHERE c.business_id = v_negocio.id
          AND c.telefono IS NOT NULL
          AND c.cumpleanos IS NOT NULL
          AND EXTRACT(MONTH FROM c.cumpleanos) = EXTRACT(MONTH FROM v_hoy)
          AND EXTRACT(DAY FROM c.cumpleanos) = EXTRACT(DAY FROM v_hoy)
          -- Cooldown de 300 días
          AND NOT EXISTS (
            SELECT 1 FROM public.autopilot_logs l
            WHERE l.business_id = v_negocio.id
              AND l.cliente_id = c.id
              AND l.flujo = 'cumpleanos_dia_d'
              AND l.created_at >= (NOW() - INTERVAL '300 days')
          )
      LOOP
        v_telefono_limpio := REGEXP_REPLACE(v_cliente.telefono, '[^0-9]', '', 'g');
        IF LENGTH(v_telefono_limpio) < 8 THEN
          CONTINUE;
        END IF;

        v_mensaje := v_plantilla_dia.contenido;
        v_mensaje := REPLACE(v_mensaje, '{nombre_cliente}', COALESCE(v_cliente.nombre, ''));
        v_mensaje := REPLACE(v_mensaje, '{nombre}', COALESCE(v_cliente.nombre, ''));
        v_mensaje := REPLACE(v_mensaje, '{nombre_negocio}', COALESCE(v_negocio.nombre, ''));
        v_mensaje := REPLACE(v_mensaje, '{salon}', COALESCE(v_negocio.nombre, ''));

        INSERT INTO public.cola_mensajes_salientes (
          business_id,
          cliente_id,
          telefono,
          flujo,
          mensaje,
          instance_name,
          api_key,
          estado,
          metadata
        ) VALUES (
          v_negocio.id,
          v_cliente.id,
          v_telefono_limpio,
          'cumpleanos_dia_d',
          v_mensaje,
          v_negocio.instance_name,
          v_negocio.api_key,
          'pendiente',
          jsonb_build_object('fecha_cumple', v_cliente.cumpleanos)
        );

        INSERT INTO public.autopilot_logs (
          business_id,
          cliente_id,
          flujo,
          estado,
          metadata
        ) VALUES (
          v_negocio.id,
          v_cliente.id,
          'cumpleanos_dia_d',
          'pendiente',
          jsonb_build_object('fecha_cumple', v_cliente.cumpleanos)
        );

        v_total_encolados := v_total_encolados + 1;
      END LOOP;
    END IF;

  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'encolados', v_total_encolados,
    'fecha', v_hoy
  );
END;
$$;
