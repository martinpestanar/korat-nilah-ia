-- Conectar copys_calificacion_sellos en fn_procesar_calificacion_cliente
CREATE OR REPLACE FUNCTION public.fn_procesar_calificacion_cliente(
  p_telefono text,
  p_calificacion integer,
  p_feedback text DEFAULT NULL::text,
  p_cita_id bigint DEFAULT NULL::bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_cita record;
  v_cliente record;
  v_negocio record;
  v_config record;
  v_modo text := 'sellos';
  v_telefono_limpio text;
  v_plantilla text;
  v_mensaje_saliente text;
  v_proximo_hito record;
  v_sellos_totales int := 12;
  v_sellos_actuales int := 0;
  v_sellos_despues int := 1;
  v_sellos_faltantes int := 0;
  v_card_url text;
  v_programado_para timestamptz;
  v_instancia record;
  v_codigo_premio text := '';
  v_tarjetas_pack jsonb;
  v_tarjeta_pack_item jsonb;
  v_primer_nombre text;
  v_premio_texto text;
  v_es_primera_vez boolean := false;
  v_expira timestamptz;
BEGIN
  v_telefono_limpio := REGEXP_REPLACE(p_telefono, '[^0-9]', '', 'g');

  IF p_cita_id IS NOT NULL THEN
    SELECT * INTO v_cita FROM "Citas" WHERE id = p_cita_id;
  ELSE
    SELECT c.* INTO v_cita
    FROM "Citas" c
    JOIN "Clientes" cl ON cl.id = c.cliente_id
    WHERE REGEXP_REPLACE(cl.telefono, '[^0-9]', '', 'g') LIKE '%' || RIGHT(v_telefono_limpio, 8)
      AND c.estado ILIKE 'completada'
    ORDER BY c.fecha DESC, c.id DESC
    LIMIT 1;
  END IF;

  IF v_cita.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'No se encontró cita para este teléfono');
  END IF;

  UPDATE "Citas"
  SET calificacion = p_calificacion::text,
      feedback_cliente = COALESCE(p_feedback, feedback_cliente)
  WHERE id = v_cita.id;

  SELECT * INTO v_negocio FROM negocios WHERE id = v_cita.business_id;
  SELECT * INTO v_cliente FROM "Clientes" WHERE id = v_cita.cliente_id;
  SELECT * INTO v_config FROM sellos_config WHERE business_id = v_cita.business_id;
  v_modo := COALESCE(v_negocio.modo_fidelizacion, 'sellos');
  v_expira := now() + (COALESCE(v_config.vencimiento_sellos_meses, 6) || ' months')::interval;

  SELECT instance_name, api_key INTO v_instancia
  FROM instancias_evolution
  WHERE business_id = v_cita.business_id AND status = 'conectado'
  LIMIT 1;

  v_primer_nombre := public.extraer_primer_nombre(v_cliente.nombre);
  IF v_primer_nombre IS NULL 
     OR LENGTH(v_primer_nombre) < 2 
     OR LOWER(v_primer_nombre) IN ('cliente', 'usuario', 'lead', 'null', 'undefined', 'prospecto', 'amigo', 'amiga') THEN
    v_primer_nombre := 'Bella';
  ELSE
    v_primer_nombre := INITCAP(LOWER(v_primer_nombre));
  END IF;

  IF EXISTS (
    SELECT 1 FROM mensajes
    WHERE cliente_id = v_cita.cliente_id
      AND campana_origen IN ('recompensa_fidelizacion', 'atencion_queja_feedback')
      AND created_at > now() - interval '3 minutes'
  ) OR EXISTS (
    SELECT 1 FROM cola_mensajes_salientes
    WHERE cita_id = v_cita.id
      AND flujo IN ('fidelizacion_sellos_recompensa', 'fidelizacion_queja')
      AND created_at > now() - interval '3 minutes'
  ) THEN
    RETURN jsonb_build_object('ok', true, 'aviso', 'Mensaje ya enviado/encolado previamente');
  END IF;

  IF p_calificacion <= 3 THEN
    -- A) QUEJA (1, 2 o 3 ⭐)
    UPDATE "Clientes"
    SET bot_pausado = true,
        bot_pausado_hasta = now() + interval '24 hours'
    WHERE id = v_cita.cliente_id;

    SELECT contenido INTO v_plantilla
    FROM plantillas_automatizacion
    WHERE business_id = v_cita.business_id
      AND flujo = 'fidelizacion_queja'
      AND activo = true
    LIMIT 1;

    IF v_plantilla IS NULL THEN
      v_mensaje_saliente := 'Lamentamos mucho que tu experiencia no haya sido de 5 estrellas 😔. En ' || COALESCE(v_negocio.nombre, 'nuestro salón') || ' nos importa mucho tu satisfacción. ¿Nos podrías contar qué sucedió para que podamos solucionarlo? 🙏';
    ELSE
      v_mensaje_saliente := REPLACE(REPLACE(v_plantilla, '{nombre_cliente}', v_primer_nombre), '{nombre_negocio}', COALESCE(v_negocio.nombre, 'nuestro salón'));
    END IF;

    IF v_instancia.instance_name IS NOT NULL THEN
      INSERT INTO cola_mensajes_salientes (
        business_id, cliente_id, cita_id, telefono, flujo, mensaje,
        instance_name, api_key, estado, proximo_intento_at, created_at,
        metadata
      ) VALUES (
        v_cita.business_id, v_cita.cliente_id, v_cita.id, v_telefono_limpio,
        'fidelizacion_queja', v_mensaje_saliente,
        v_instancia.instance_name, v_instancia.api_key, 'pendiente',
        now(), now(),
        jsonb_build_object('calificacion', p_calificacion, 'staff_id', v_cita.staff_id)
      );
    END IF;

    -- PROGRAMAR RESUMEN SELLOS EN 24 HORAS
    IF v_modo IN ('sellos', 'ambos') THEN
      v_programado_para := now() + interval '24 hours';
      v_sellos_actuales := fn_sellos_activos(v_cita.cliente_id, v_cita.business_id);

      IF COALESCE(v_config.bienvenida_activo, true) AND v_sellos_actuales = 0 THEN
        IF NOT EXISTS (
          SELECT 1 FROM sellos_movimientos 
          WHERE cliente_id = v_cita.cliente_id AND business_id = v_cita.business_id
        ) THEN
          v_es_primera_vez := true;
          INSERT INTO sellos_movimientos (
            business_id, cliente_id, cita_id,
            cantidad, motivo, sobrante_monto, expira_en,
            total_post, notas
          ) VALUES (
            v_cita.business_id, v_cita.cliente_id, NULL,
            1, 'bienvenida'::sello_motivo_enum, 0, v_expira,
            1, 'Sello de Bienvenida por unirse al Club Glow'
          );
          v_sellos_actuales := 1;
        END IF;
      END IF;

      v_sellos_despues := v_sellos_actuales + 1;

      IF NOT EXISTS (
        SELECT 1 FROM sellos_movimientos 
        WHERE cita_id = v_cita.id AND motivo = 'cita'
      ) THEN
        INSERT INTO sellos_movimientos (
          business_id, cliente_id, cita_id, cantidad, motivo, total_post, created_at
        ) VALUES (
          v_cita.business_id, v_cita.cliente_id, v_cita.id, 1, 'cita'::sello_motivo_enum, v_sellos_despues, now()
        );
      END IF;

      v_sellos_totales := COALESCE(v_config.total_sellos_roadmap, 12);
      v_card_url := 'https://koratflow.agency/club/' || COALESCE(v_negocio.slug, v_negocio.id::text) || '?c=' || v_cita.cliente_id;

      SELECT id, hito_sello, nombre INTO v_proximo_hito
      FROM sellos_roadmap
      WHERE business_id = v_cita.business_id AND activo = true AND hito_sello >= v_sellos_despues
      ORDER BY hito_sello ASC LIMIT 1;

      IF v_proximo_hito.nombre IS NULL THEN
        SELECT id, hito_sello, nombre INTO v_proximo_hito
        FROM sellos_roadmap
        WHERE business_id = v_cita.business_id AND activo = true
        ORDER BY hito_sello ASC LIMIT 1;
      END IF;

      v_sellos_faltantes := GREATEST(0, COALESCE(v_proximo_hito.hito_sello, v_sellos_totales) - v_sellos_despues);
      v_premio_texto := COALESCE(v_proximo_hito.nombre, 'Regalo VIP Especial');

      v_mensaje_saliente := 'Hola ' || v_primer_nombre || ' 💕 Te compartimos tu tarjeta del Club Glow de ' || COALESCE(v_negocio.nombre, 'nuestro salón') || '. Ya tienes ' || v_sellos_despues || ' de ' || v_sellos_totales || ' sellos acumulados. Te faltan ' || v_sellos_faltantes || ' sellos para: ' || v_premio_texto || '. 📲 Míralos aquí: ' || v_card_url;

      IF v_instancia.instance_name IS NOT NULL THEN
        INSERT INTO cola_mensajes_salientes (
          business_id, cliente_id, cita_id, telefono, flujo, mensaje,
          instance_name, api_key, estado, proximo_intento_at, created_at,
          metadata
        ) VALUES (
          v_cita.business_id, v_cita.cliente_id, v_cita.id, v_telefono_limpio,
          'fidelizacion_sellos_recompensa', v_mensaje_saliente,
          v_instancia.instance_name, v_instancia.api_key, 'pendiente',
          v_programado_para, now(),
          jsonb_build_object('calificacion', p_calificacion, 'staff_id', v_cita.staff_id, 'programado_24h', true)
        );
      END IF;
    END IF;

  ELSE
    -- B) SATISFACCIÓN (4 o 5 ⭐)
    IF v_modo IN ('sellos', 'ambos') THEN
      v_sellos_actuales := fn_sellos_activos(v_cita.cliente_id, v_cita.business_id);

      IF COALESCE(v_config.bienvenida_activo, true) AND v_sellos_actuales = 0 THEN
        IF NOT EXISTS (
          SELECT 1 FROM sellos_movimientos 
          WHERE cliente_id = v_cita.cliente_id AND business_id = v_cita.business_id
        ) THEN
          v_es_primera_vez := true;
          INSERT INTO sellos_movimientos (
            business_id, cliente_id, cita_id,
            cantidad, motivo, sobrante_monto, expira_en,
            total_post, notas
          ) VALUES (
            v_cita.business_id, v_cita.cliente_id, NULL,
            1, 'bienvenida'::sello_motivo_enum, 0, v_expira,
            1, 'Sello de Bienvenida por unirse al Club Glow'
          );
          v_sellos_actuales := 1;
        END IF;
      END IF;

      v_sellos_despues := v_sellos_actuales + 1;

      IF NOT EXISTS (
        SELECT 1 FROM sellos_movimientos 
        WHERE cita_id = v_cita.id AND motivo = 'cita'
      ) THEN
        INSERT INTO sellos_movimientos (
          business_id, cliente_id, cita_id, cantidad, motivo, total_post, created_at
        ) VALUES (
          v_cita.business_id, v_cita.cliente_id, v_cita.id, 1, 'cita'::sello_motivo_enum, v_sellos_despues, now()
        );
      END IF;

      v_sellos_totales := COALESCE(v_config.total_sellos_roadmap, 12);

      SELECT id, hito_sello, nombre INTO v_proximo_hito
      FROM sellos_roadmap
      WHERE business_id = v_cita.business_id AND activo = true AND hito_sello >= v_sellos_despues
      ORDER BY hito_sello ASC LIMIT 1;

      IF v_proximo_hito.nombre IS NULL THEN
        SELECT id, hito_sello, nombre INTO v_proximo_hito
        FROM sellos_roadmap
        WHERE business_id = v_cita.business_id AND activo = true
        ORDER BY hito_sello ASC LIMIT 1;
      END IF;

      v_sellos_faltantes := GREATEST(0, COALESCE(v_proximo_hito.hito_sello, v_sellos_totales) - v_sellos_despues);
      v_premio_texto := COALESCE(v_proximo_hito.nombre, 'Regalo VIP Especial');
      v_card_url := 'https://koratflow.agency/club/' || COALESCE(v_negocio.slug, v_negocio.id::text) || '?c=' || v_cita.cliente_id;

      IF v_proximo_hito.hito_sello IS NOT NULL AND v_sellos_despues = v_proximo_hito.hito_sello THEN
        v_codigo_premio := 'GLOW-' || UPPER(SUBSTRING(MD5(RANDOM()::text || clock_timestamp()::text) FROM 1 FOR 6));
        INSERT INTO sellos_premios_ganados (
          business_id, cliente_id, roadmap_id, codigo_canje, estado, ganado_en, expira_en
        ) VALUES (
          v_cita.business_id, v_cita.cliente_id, v_proximo_hito.id, v_codigo_premio, 'pendiente'::estado_canje_enum, now(), now() + interval '60 days'
        );
      END IF;

      -- =========================================================================
      -- 1. CONSULTAR COPYS ESPECÍFICOS DEL PACK CALIFICACIÓN + SELLOS (1 al 12)
      -- =========================================================================
      SELECT copys_calificacion_sellos INTO v_tarjetas_pack FROM nilah_config LIMIT 1;
      IF v_tarjetas_pack IS NOT NULL AND jsonb_typeof(v_tarjetas_pack) = 'array' THEN
        SELECT elem INTO v_tarjeta_pack_item
        FROM jsonb_array_elements(v_tarjetas_pack) elem
        WHERE (elem->>'sello')::int = LEAST(v_sellos_despues, 12)
        LIMIT 1;

        IF v_tarjeta_pack_item IS NOT NULL AND (v_tarjeta_pack_item->>'copy') IS NOT NULL THEN
          v_mensaje_saliente := v_tarjeta_pack_item->>'copy';
        END IF;
      END IF;

      -- 2. Si no había copy en el pack, fallback a plantillas_automatizacion
      IF v_mensaje_saliente IS NULL THEN
        SELECT contenido INTO v_plantilla
        FROM plantillas_automatizacion
        WHERE business_id = v_cita.business_id
          AND flujo = 'fidelizacion_sellos_recompensa'
          AND activo = true
        LIMIT 1;
        v_mensaje_saliente := v_plantilla;
      END IF;

      -- 3. Fallback final si tampoco había plantilla
      IF v_mensaje_saliente IS NULL THEN
        v_mensaje_saliente := '¡Muchísimas gracias por tu calificación! 💖 Sellito acreditado: ya tienes *{sellos_actuales} de {sellos_totales_meta} sellos*. Te faltan {sellos_faltantes} para: *{premio_proximo}*. 📲 Mira tu tarjeta: {link_tarjeta}';
      END IF;

      -- Reemplazos dinámicos
      v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{salon}', COALESCE(v_negocio.nombre, 'nuestro salón'));
      v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{nombre_negocio}', COALESCE(v_negocio.nombre, 'nuestro salón'));
      v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{sello_actual}', v_sellos_despues::text);
      v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{sellos_actuales}', v_sellos_despues::text);
      v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{sellos_totales_meta}', v_sellos_totales::text);
      v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{sellos_faltantes}', v_sellos_faltantes::text);
      v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{premio_1}', v_premio_texto);
      v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{premio_proximo}', v_premio_texto);
      v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{codigo}', COALESCE(v_codigo_premio, ''));
      v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{link_tarjeta}', v_card_url);
      v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{nombre}', v_primer_nombre);
      v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{nombre_cliente}', v_primer_nombre);

      IF v_instancia.instance_name IS NOT NULL THEN
        INSERT INTO cola_mensajes_salientes (
          business_id, cliente_id, cita_id, telefono, flujo, mensaje,
          instance_name, api_key, estado, proximo_intento_at, created_at,
          metadata
        ) VALUES (
          v_cita.business_id, v_cita.cliente_id, v_cita.id, v_telefono_limpio,
          'fidelizacion_sellos_recompensa', v_mensaje_saliente,
          v_instancia.instance_name, v_instancia.api_key, 'pendiente',
          now(), now(),
          jsonb_build_object(
            'calificacion', p_calificacion, 
            'staff_id', v_cita.staff_id, 
            'primer_nombre', v_primer_nombre, 
            'premio_proximo', v_premio_texto,
            'es_primera_vez_bienvenida', v_es_primera_vez,
            'sellos_totales', v_sellos_despues
          )
        );
      END IF;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'cita_id', v_cita.id,
    'staff_id', v_cita.staff_id,
    'calificacion', p_calificacion,
    'modo', v_modo,
    'primer_nombre', v_primer_nombre,
    'premio_proximo', v_premio_texto,
    'es_primera_vez_bienvenida', v_es_primera_vez,
    'sellos_totales', v_sellos_despues,
    'mensaje_generado', v_mensaje_saliente
  );
END;
$function$;
