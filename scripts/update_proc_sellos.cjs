const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function run() {
  await client.connect();

  console.log('--- Actualizando procesar_respuesta_calificacion_fidelizacion ---');

  const sql = `
CREATE OR REPLACE FUNCTION public.procesar_respuesta_calificacion_fidelizacion(
    p_business_id uuid,
    p_cliente_id bigint,
    p_contenido_mensaje text
)
RETURNS TABLE(
    debe_responder boolean,
    cita_id bigint,
    nota_recibida text,
    telefono_cliente text,
    instance_name text,
    api_key text,
    mensaje_recompensa text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_nota text;
    v_cita record;
    v_cliente record;
    v_negocio record;
    v_inst record;
    v_primer_nombre text;
    v_mensaje_saliente text;
    v_tel_limpio text;
    v_plantilla_custom text;
    v_modo text := 'sellos';
    -- Sellos variables
    v_sellos_totales int := 12;
    v_sellos_actuales int := 0;
    v_sellos_despues int := 1;
    v_sellos_faltantes int := 0;
    v_proximo_hito record;
    v_card_url text;
    v_tarjetas_globales jsonb;
    v_tarjeta_hito jsonb;
    v_codigo_premio text := '';
    -- Puntos variables fallback
    v_puntos_ganados integer := 50;
    v_puntos_actuales bigint := 50;
    v_costo_premio bigint := 200;
    v_nombre_premio text := 'Premio VIP';
    v_premio record;
    v_precio_servicio numeric := 0;
BEGIN
    -- 1. Extraer dígito 1-5 del texto
    SELECT substring(p_contenido_mensaje FROM '[1-5]') INTO v_nota;
    IF v_nota IS NULL THEN
        RETURN;
    END IF;

    -- 2. Localizar la Cita pendiente
    SELECT * INTO v_cita 
    FROM public."Citas"
    WHERE business_id = p_business_id
      AND cliente_id = p_cliente_id
      AND encuesta_enviada = true
      AND (calificacion IS NULL OR calificacion = '0' OR calificacion = '')
    ORDER BY created_at DESC
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    SELECT * INTO v_cliente FROM public."Clientes" WHERE id = p_cliente_id;
    SELECT * INTO v_negocio FROM public.negocios WHERE id = p_business_id;
    SELECT * INTO v_inst FROM public.instancias_evolution 
    WHERE business_id = p_business_id AND status = 'conectado'
    ORDER BY updated_at DESC LIMIT 1;

    IF v_inst.instance_name IS NULL OR v_inst.api_key IS NULL THEN
        RETURN;
    END IF;

    v_primer_nombre := public.extraer_primer_nombre(COALESCE(v_cliente.nombre, 'linda'));
    v_modo := COALESCE(v_negocio.modo_fidelizacion, 'sellos');

    -- 3. Actualizar calificación en la Cita
    UPDATE public."Citas"
    SET calificacion = v_nota,
        feedback_cliente = p_contenido_mensaje,
        fecha_feedback = CURRENT_DATE
    WHERE id = v_cita.id;

    -- =========================================================================
    -- RAMA A: CALIFICACIÓN BAJA / QUEJA (1, 2 o 3 Estrellas)
    -- =========================================================================
    IF v_nota IN ('1', '2', '3') THEN
        -- Pausar bot 24h
        UPDATE public."Clientes"
        SET bot_pausado = true,
            bot_pausado_razon = 'Calificación de ' || v_nota || ' estrellas en cita #' || v_cita.id || ' — Atención humana requerida',
            bot_pausado_hasta = NOW() + INTERVAL '24 hours'
        WHERE id = p_cliente_id;

        -- Mensaje empático inmediato
        SELECT p.contenido INTO v_plantilla_custom
        FROM public.plantillas_automatizacion p
        WHERE p.business_id = p_business_id
          AND p.flujo IN ('fidelizacion_queja', 'calificacion_queja')
          AND p.activo = true
        ORDER BY RANDOM()
        LIMIT 1;

        IF v_plantilla_custom IS NOT NULL THEN
            v_mensaje_saliente := REPLACE(REPLACE(v_plantilla_custom, '{nombre_cliente}', v_primer_nombre), '{nombre_negocio}', v_negocio.nombre);
            v_mensaje_saliente := public.reemplazar_servicio_gramatical(v_mensaje_saliente, COALESCE(v_cita.servicio, 'tu servicio'));
        ELSE
            v_mensaje_saliente := 'Uy, lamento mucho que tu experiencia no haya sido perfecta ' || v_primer_nombre || ' 🥺' || E'\\n\\n' ||
                                  'Para nosotras en *' || v_negocio.nombre || '* tu comodidad y felicidad son prioridad. ¿Nos cuentas qué pasó con tu *' || COALESCE(v_cita.servicio, 'servicio') || '* para ayudarte de inmediato? 💕';
        END IF;

        -- Si el salón usa sellos, acreditar sello silencioso y programar reconciliación a 24h
        IF v_modo IN ('sellos', 'ambos') THEN
          v_sellos_actuales := public.fn_sellos_activos(p_cliente_id, p_business_id);
          v_sellos_despues := v_sellos_actuales + 1;

          -- Registrar sello en historial
          IF NOT EXISTS (
            SELECT 1 FROM sellos_movimientos 
            WHERE cita_id = v_cita.id AND motivo = 'cita'
          ) THEN
            INSERT INTO sellos_movimientos (
              business_id, cliente_id, cita_id, cantidad, motivo, total_post, created_at
            ) VALUES (
              p_business_id, p_cliente_id, v_cita.id, 1, 'cita'::motivo_sello, v_sellos_despues, now()
            );
          END IF;

          SELECT total_sellos_roadmap INTO v_sellos_totales FROM sellos_config WHERE business_id = p_business_id;
          v_sellos_totales := COALESCE(v_sellos_totales, 12);
          v_card_url := 'https://app.koratflow.com/club/' || COALESCE(v_negocio.slug, v_negocio.id::text) || '?c=' || p_cliente_id;

          -- Programar resumen a las 24 horas
          INSERT INTO cola_mensajes_salientes (
            business_id, cliente_id, cita_id, telefono, flujo, mensaje,
            instance_name, api_key, estado, proximo_intento_at, created_at, metadata
          ) VALUES (
            p_business_id, p_cliente_id, v_cita.id,
            COALESCE(CASE WHEN LENGTH(v_cliente.telefono) = 9 THEN '51' || v_cliente.telefono ELSE v_cliente.telefono END, '000000000'),
            'fidelizacion_sellos_recompensa_reconciliacion',
            'Hola ' || v_primer_nombre || ' 🌸, para nosotros tu experiencia es lo primero. Queremos confirmarte que los sellos de tu visita ya fueron acreditados a tu tarjeta VIP (' || v_sellos_despues || ' de ' || v_sellos_totales || '). Tu opinión nos ayuda a mejorar y esperamos consentirte pronto ✨ ' || v_card_url,
            v_inst.instance_name, v_inst.api_key, 'pendiente',
            NOW() + INTERVAL '24 hours', NOW(),
            jsonb_build_object('calificacion', v_nota, 'delay_reconciliacion_24h', true, 'staff_id', v_cita.staff_id)
          );
        END IF;

    -- =========================================================================
    -- RAMA B: CALIFICACIÓN POSITIVA (4 o 5 Estrellas)
    -- =========================================================================
    ELSE
        IF v_modo IN ('sellos', 'ambos') THEN
          v_sellos_actuales := public.fn_sellos_activos(p_cliente_id, p_business_id);
          v_sellos_despues := v_sellos_actuales + 1;

          -- Registrar sello en historial
          IF NOT EXISTS (
            SELECT 1 FROM sellos_movimientos 
            WHERE cita_id = v_cita.id AND motivo = 'cita'
          ) THEN
            INSERT INTO sellos_movimientos (
              business_id, cliente_id, cita_id, cantidad, motivo, total_post, created_at
            ) VALUES (
              p_business_id, p_cliente_id, v_cita.id, 1, 'cita'::motivo_sello, v_sellos_despues, now()
            );
          END IF;
          
          SELECT total_sellos_roadmap INTO v_sellos_totales FROM sellos_config WHERE business_id = p_business_id;
          v_sellos_totales := COALESCE(v_sellos_totales, 12);

          SELECT id, hito_sello, nombre INTO v_proximo_hito
          FROM sellos_roadmap
          WHERE business_id = p_business_id AND activo = true AND hito_sello >= v_sellos_despues
          ORDER BY hito_sello ASC LIMIT 1;

          v_sellos_faltantes := GREATEST(0, COALESCE(v_proximo_hito.hito_sello, v_sellos_totales) - v_sellos_despues);
          v_card_url := 'https://app.koratflow.com/club/' || COALESCE(v_negocio.slug, v_negocio.id::text) || '?c=' || p_cliente_id;

          -- Si alcanzó hito con premio, generar cupón
          IF v_proximo_hito.hito_sello IS NOT NULL AND v_sellos_despues = v_proximo_hito.hito_sello THEN
            v_codigo_premio := 'GLOW-' || UPPER(SUBSTRING(MD5(RANDOM()::text || clock_timestamp()::text) FROM 1 FOR 6));
            INSERT INTO sellos_premios_ganados (
              business_id, cliente_id, roadmap_id, codigo_canje, estado, ganado_en, expira_en
            ) VALUES (
              p_business_id, p_cliente_id, v_proximo_hito.id, v_codigo_premio, 'pendiente'::estado_canje_enum, now(), now() + interval '60 days'
            );
          END IF;

          -- Consultar Gestor de Tarjetas Club Glow de 12 sellos
          SELECT tarjetas_club_glow INTO v_tarjetas_globales FROM nilah_config LIMIT 1;
          IF v_tarjetas_globales IS NOT NULL AND jsonb_typeof(v_tarjetas_globales) = 'array' THEN
            SELECT elem INTO v_tarjeta_hito
            FROM jsonb_array_elements(v_tarjetas_globales) elem
            WHERE (elem->>'sello')::int = LEAST(v_sellos_despues, 12)
            LIMIT 1;
          END IF;

          IF v_tarjeta_hito IS NOT NULL AND (v_tarjeta_hito->>'copy_sugerido') IS NOT NULL THEN
            v_mensaje_saliente := v_tarjeta_hito->>'copy_sugerido';
            v_mensaje_saliente := REPLACE(REPLACE(REPLACE(v_mensaje_saliente,
              '{nombre}', v_primer_nombre),
              '{salon}', v_negocio.nombre),
              '{sello_actual}', v_sellos_despues::text);
            v_mensaje_saliente := REPLACE(REPLACE(v_mensaje_saliente,
              '{codigo}', COALESCE(v_codigo_premio, '')),
              '{link_tarjeta}', v_card_url);
          ELSE
            SELECT p.contenido INTO v_plantilla_custom
            FROM public.plantillas_automatizacion p
            WHERE p.business_id = p_business_id AND p.flujo = 'fidelizacion_sellos_recompensa' AND p.activo = true
            LIMIT 1;

            IF v_plantilla_custom IS NOT NULL THEN
              v_mensaje_saliente := REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(v_plantilla_custom,
                '{nombre_cliente}', v_primer_nombre),
                '{nombre_negocio}', v_negocio.nombre),
                '{sellos_ganados}', '+1'),
                '{sellos_actuales}', v_sellos_despues::text),
                '{sellos_totales_meta}', v_sellos_totales::text),
                '{sellos_faltantes}', v_sellos_faltantes::text);
              v_mensaje_saliente := REPLACE(REPLACE(REPLACE(v_mensaje_saliente,
                '{premio_proximo}', COALESCE(v_proximo_hito.nombre, 'Regalo VIP')),
                '{codigo}', COALESCE(v_codigo_premio, '')),
                '{link_tarjeta}', v_card_url);
            ELSE
              v_mensaje_saliente := '✨ *¡Muchas gracias por tu visita a ' || v_negocio.nombre || ', ' || v_primer_nombre || '!* 👑💖' || E'\\n\\n' ||
                                    'Sumaste *+1 sello* a tu tarjeta digital del Club Glow. Progreso actual: *' || v_sellos_despues || ' de ' || v_sellos_totales || ' sellos*.' || E'\\n' ||
                                    '🎯 Te faltan solo *' || v_sellos_faltantes || ' sellos* para tu premio: *' || COALESCE(v_proximo_hito.nombre, 'Regalo VIP') || '* 🌸💎' || E'\\n\\n' ||
                                    '📲 *Mira tu tarjeta en vivo:* ' || v_card_url;
            END IF;
          END IF;

        ELSE
          -- MODO PUNTOS TRADICIONAL
          SELECT COALESCE(s.precio, 50) INTO v_precio_servicio
          FROM public.servicios s
          WHERE s.business_id = p_business_id
            AND (s.nombre ILIKE '%' || v_cita.servicio || '%' OR v_cita.servicio ILIKE '%' || s.nombre || '%')
          LIMIT 1;
          IF v_precio_servicio <= 0 THEN v_precio_servicio := 50; END IF;
          v_puntos_ganados := ROUND(v_precio_servicio)::integer;

          SELECT p.nombre, p.costo_puntos INTO v_premio
          FROM public."Premios" p WHERE p.business_id = p_business_id AND p.activo = true
          ORDER BY p.costo_puntos ASC LIMIT 1;
          IF FOUND THEN
              v_costo_premio := v_premio.costo_puntos;
              v_nombre_premio := v_premio.nombre;
          END IF;

          v_puntos_actuales := COALESCE(v_cliente.puntos_acumulados, 0) + v_puntos_ganados;
          UPDATE public."Clientes" SET puntos_acumulados = v_puntos_actuales WHERE id = p_cliente_id;

          v_mensaje_saliente := '¡Muchísimas gracias, ' || v_primer_nombre || '! 🙌💖' || E'\\n\\n' ||
                                'Sumaste *+' || v_puntos_ganados || ' pts* con tu visita. Llevas *' || v_puntos_actuales || '/' || v_costo_premio || ' pts* para canjear tu *' || v_nombre_premio || '* 🎁.';
        END IF;
    END IF;

    -- Registrar en tabla mensajes
    INSERT INTO public.mensajes (
        business_id, cliente_id, contenido, direccion, tipo, estado, campana_origen
    ) VALUES (
        p_business_id, p_cliente_id, v_mensaje_saliente, 'saliente', 'texto', 'enviado',
        CASE WHEN v_nota IN ('1', '2', '3') THEN 'atencion_queja_feedback' ELSE 'recompensa_fidelizacion' END
    );

    v_tel_limpio := REGEXP_REPLACE(v_cliente.telefono, '[^0-9]', '', 'g');
    IF LENGTH(v_tel_limpio) = 9 THEN
        v_tel_limpio := '51' || v_tel_limpio;
    END IF;

    RETURN QUERY
    SELECT 
        true AS debe_responder,
        v_cita.id AS cita_id,
        v_nota AS nota_recibida,
        v_tel_limpio AS telefono_cliente,
        v_inst.instance_name,
        v_inst.api_key,
        v_mensaje_saliente AS mensaje_recompensa;
END;
$function$;
`;

  await client.query(sql);
  console.log('procesar_respuesta_calificacion_fidelizacion updated successfully!');

  // Also update fn_procesar_calificacion_cliente with anti-duplicate protection
  const sql2 = `
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
  v_tarjetas_globales jsonb;
  v_tarjeta_hito jsonb;
BEGIN
  v_telefono_limpio := REGEXP_REPLACE(p_telefono, '[^0-9]', '', 'g');

  -- 1. Identificar la cita si no se pasó id
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

  -- 2. Guardar calificación y feedback en Citas
  UPDATE "Citas"
  SET calificacion = p_calificacion::text,
      feedback_cliente = COALESCE(p_feedback, feedback_cliente)
  WHERE id = v_cita.id;

  -- Obtener negocio y cliente
  SELECT * INTO v_negocio FROM negocios WHERE id = v_cita.business_id;
  SELECT * INTO v_cliente FROM "Clientes" WHERE id = v_cita.cliente_id;
  v_modo := COALESCE(v_negocio.modo_fidelizacion, 'sellos');

  SELECT instance_name, api_key INTO v_instancia
  FROM instancias_evolution
  WHERE business_id = v_cita.business_id AND status = 'conectado'
  LIMIT 1;

  -- ANTIDUPLICADO: Si ya se generó o envió mensaje en los últimos 3 minutos (por trigger de WhatsApp), no duplicar
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

  -- 3. BIFURCACIÓN DE LÓGICA DE NEGOCIO SEGÚN CALIFICACIÓN
  IF p_calificacion <= 3 THEN
    -- A) CASO QUEJA (1, 2 o 3 ⭐):
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
      v_mensaje_saliente := REPLACE(REPLACE(v_plantilla, '{nombre_cliente}', COALESCE(v_cliente.nombre, 'amiga')), '{nombre_negocio}', COALESCE(v_negocio.nombre, 'nuestro salón'));
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

    -- PROGRAMAR ENVÍO DEL RESUMEN DE SELLOS A LAS 24 HORAS
    IF v_modo IN ('sellos', 'ambos') THEN
      v_programado_para := now() + interval '24 hours';
      v_sellos_actuales := fn_sellos_activos(v_cita.cliente_id, v_cita.business_id);
      v_sellos_despues := v_sellos_actuales + 1;

      -- Registrar sello
      IF NOT EXISTS (
        SELECT 1 FROM sellos_movimientos 
        WHERE cita_id = v_cita.id AND motivo = 'cita'
      ) THEN
        INSERT INTO sellos_movimientos (
          business_id, cliente_id, cita_id, cantidad, motivo, total_post, created_at
        ) VALUES (
          v_cita.business_id, v_cita.cliente_id, v_cita.id, 1, 'cita'::motivo_sello, v_sellos_despues, now()
        );
      END IF;

      SELECT total_sellos_roadmap INTO v_sellos_totales
      FROM sellos_config WHERE business_id = v_cita.business_id;
      v_sellos_totales := COALESCE(v_sellos_totales, 12);

      v_card_url := 'https://app.koratflow.com/club/' || COALESCE(v_negocio.slug, v_negocio.id::text) || '?c=' || v_cita.cliente_id;

      IF v_instancia.instance_name IS NOT NULL THEN
        INSERT INTO cola_mensajes_salientes (
          business_id, cliente_id, cita_id, telefono, flujo, mensaje,
          instance_name, api_key, estado, proximo_intento_at, created_at,
          metadata
        ) VALUES (
          v_cita.business_id, v_cita.cliente_id, v_cita.id, v_telefono_limpio,
          'fidelizacion_sellos_recompensa_reconciliacion',
          'Hola ' || COALESCE(v_cliente.nombre, 'amiga') || ' 🌸, para nosotros tu experiencia es lo primero. Queremos confirmarte que los sellos de tu visita ya fueron acreditados a tu tarjeta VIP (' || v_sellos_despues || ' de ' || v_sellos_totales || '). Tu opinión nos ayuda a mejorar y esperamos consentirte pronto ✨ ' || v_card_url,
          v_instancia.instance_name, v_instancia.api_key, 'pendiente',
          v_programado_para, now(),
          jsonb_build_object('delay_reconciliacion_24h', true, 'staff_id', v_cita.staff_id)
        );
      END IF;
    END IF;

  ELSE
    -- B) CASO FELIZ (4 o 5 ⭐):
    IF v_modo IN ('sellos', 'ambos') THEN
      v_sellos_actuales := fn_sellos_activos(v_cita.cliente_id, v_cita.business_id);
      v_sellos_despues := v_sellos_actuales + 1;

      -- Registrar sello
      IF NOT EXISTS (
        SELECT 1 FROM sellos_movimientos 
        WHERE cita_id = v_cita.id AND motivo = 'cita'
      ) THEN
        INSERT INTO sellos_movimientos (
          business_id, cliente_id, cita_id, cantidad, motivo, total_post, created_at
        ) VALUES (
          v_cita.business_id, v_cita.cliente_id, v_cita.id, 1, 'cita'::motivo_sello, v_sellos_despues, now()
        );
      END IF;

      SELECT total_sellos_roadmap INTO v_sellos_totales
      FROM sellos_config WHERE business_id = v_cita.business_id;
      v_sellos_totales := COALESCE(v_sellos_totales, 12);

      SELECT id, hito_sello, nombre INTO v_proximo_hito
      FROM sellos_roadmap
      WHERE business_id = v_cita.business_id AND activo = true AND hito_sello >= v_sellos_despues
      ORDER BY hito_sello ASC LIMIT 1;

      v_sellos_faltantes := GREATEST(0, COALESCE(v_proximo_hito.hito_sello, v_sellos_totales) - v_sellos_despues);
      v_card_url := 'https://app.koratflow.com/club/' || COALESCE(v_negocio.slug, v_negocio.id::text) || '?c=' || v_cita.cliente_id;

      -- Si alcanzó hito con premio, generar cupón
      IF v_proximo_hito.hito_sello IS NOT NULL AND v_sellos_despues = v_proximo_hito.hito_sello THEN
        v_codigo_premio := 'GLOW-' || UPPER(SUBSTRING(MD5(RANDOM()::text || clock_timestamp()::text) FROM 1 FOR 6));
        INSERT INTO sellos_premios_ganados (
          business_id, cliente_id, roadmap_id, codigo_canje, estado, ganado_en, expira_en
        ) VALUES (
          v_cita.business_id, v_cita.cliente_id, v_proximo_hito.id, v_codigo_premio, 'pendiente'::estado_canje_enum, now(), now() + interval '60 days'
        );
      END IF;

      -- Consultar tarjetas Club Glow
      SELECT tarjetas_club_glow INTO v_tarjetas_globales FROM nilah_config LIMIT 1;
      IF v_tarjetas_globales IS NOT NULL AND jsonb_typeof(v_tarjetas_globales) = 'array' THEN
        SELECT elem INTO v_tarjeta_hito
        FROM jsonb_array_elements(v_tarjetas_globales) elem
        WHERE (elem->>'sello')::int = LEAST(v_sellos_despues, 12)
        LIMIT 1;
      END IF;

      IF v_tarjeta_hito IS NOT NULL AND (v_tarjeta_hito->>'copy_sugerido') IS NOT NULL THEN
        v_mensaje_saliente := v_tarjeta_hito->>'copy_sugerido';
        v_mensaje_saliente := REPLACE(REPLACE(REPLACE(v_mensaje_saliente,
          '{nombre}', COALESCE(v_cliente.nombre, 'amiga')),
          '{salon}', v_negocio.nombre),
          '{sello_actual}', v_sellos_despues::text);
        v_mensaje_saliente := REPLACE(REPLACE(v_mensaje_saliente,
          '{codigo}', COALESCE(v_codigo_premio, '')),
          '{link_tarjeta}', v_card_url);
      ELSE
        SELECT contenido INTO v_plantilla
        FROM plantillas_automatizacion
        WHERE business_id = v_cita.business_id
          AND flujo = 'fidelizacion_sellos_recompensa'
          AND activo = true
        LIMIT 1;

        IF v_plantilla IS NULL THEN
          v_mensaje_saliente := '¡Muchas gracias por tu visita a ' || COALESCE(v_negocio.nombre, 'nuestro salón') || ', ' || COALESCE(v_cliente.nombre, 'reina') || '! 👑✨ Llevas ' || v_sellos_despues || ' de ' || v_sellos_totales || ' sellos. Te faltan ' || v_sellos_faltantes || ' para: ' || COALESCE(v_proximo_hito.nombre, 'Premio VIP') || '. 📲 Mira tu tarjeta: ' || v_card_url;
        ELSE
          v_mensaje_saliente := REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(v_plantilla,
            '{nombre_cliente}', COALESCE(v_cliente.nombre, 'amiga')),
            '{nombre_negocio}', COALESCE(v_negocio.nombre, 'nuestro salón')),
            '{sellos_ganados}', '+1'),
            '{sellos_actuales}', v_sellos_despues::text),
            '{sellos_totales_meta}', v_sellos_totales::text),
            '{sellos_faltantes}', v_sellos_faltantes::text);
          v_mensaje_saliente := REPLACE(REPLACE(REPLACE(v_mensaje_saliente,
            '{premio_proximo}', COALESCE(v_proximo_hito.nombre, 'Regalo VIP')),
            '{codigo}', COALESCE(v_codigo_premio, '')),
            '{link_tarjeta}', v_card_url);
        END IF;
      END IF;

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
          jsonb_build_object('calificacion', p_calificacion, 'staff_id', v_cita.staff_id)
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
    'mensaje_generado', v_mensaje_saliente
  );
END;
$function$;
`;

  await client.query(sql2);
  console.log('fn_procesar_calificacion_cliente updated successfully!');

  await client.end();
}
run().catch(e => console.error(e.message));
