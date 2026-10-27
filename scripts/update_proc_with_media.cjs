const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function run() {
  await client.connect();

  console.log('--- Actualizando procesar_respuesta_calificacion_fidelizacion con soporte media y bienvenida ---');

  // Primero drop de la función para actualizar tipos de retorno limpiamente si cambia firma
  await client.query(`DROP FUNCTION IF EXISTS public.procesar_respuesta_calificacion_fidelizacion(uuid, bigint, text) CASCADE;`);

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
    mensaje_recompensa text,
    media_url text
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
    v_media_url text := NULL;
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
    v_sello_a_consultar int := 1;
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

        -- Mensaje empático inmediato (sin emojis de fiesta, 100% cálido y humilde)
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

        -- En modo sellos: acreditar el sello ganado pero diferir el resumen 24 horas
        IF v_modo IN ('sellos', 'ambos') THEN
          v_sellos_actuales := public.fn_sellos_activos(p_cliente_id, p_business_id);

          -- Si tenía 0 sellos, otorgar bienvenida (+1) primero
          IF v_sellos_actuales = 0 THEN
            INSERT INTO sellos_movimientos (
              business_id, cliente_id, cantidad, motivo, total_post, created_at
            ) VALUES (
              p_business_id, p_cliente_id, 1, 'bienvenida'::motivo_sello, 1, now()
            );
            v_sellos_despues := 2;
          ELSE
            v_sellos_despues := v_sellos_actuales + 1;
          END IF;

          -- Registrar sello de la visita
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

          -- Programar resumen a las 24 horas en cola_mensajes_salientes
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

          -- LÓGICA DE SELLO 0 / BIENVENIDA:
          -- Si la clienta tenía 0 sellos, recibe 1 de bienvenida + 1 de la visita = 2 de 12
          IF v_sellos_actuales = 0 THEN
            INSERT INTO sellos_movimientos (
              business_id, cliente_id, cantidad, motivo, total_post, created_at
            ) VALUES (
              p_business_id, p_cliente_id, 1, 'bienvenida'::motivo_sello, 1, now()
            );
            v_sellos_despues := 2;
            v_sello_a_consultar := 1; -- Plantilla de Sello 1 (Bienvenida al Club: 2 de 12)
          ELSE
            v_sellos_despues := v_sellos_actuales + 1;
            v_sello_a_consultar := v_sellos_despues;
          END IF;

          -- Registrar sello de la visita
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

          -- Si alcanzó hito con premio (4, 8 o 12), generar cupón único de canje
          IF v_proximo_hito.hito_sello IS NOT NULL AND v_sellos_despues = v_proximo_hito.hito_sello THEN
            v_codigo_premio := 'GLOW-' || UPPER(SUBSTRING(MD5(RANDOM()::text || clock_timestamp()::text) FROM 1 FOR 6));
            INSERT INTO sellos_premios_ganados (
              business_id, cliente_id, roadmap_id, codigo_canje, estado, ganado_en, expira_en
            ) VALUES (
              p_business_id, p_cliente_id, v_proximo_hito.id, v_codigo_premio, 'pendiente'::estado_canje_enum, now(), now() + interval '60 days'
            );
          END IF;

          -- ── CONSULTAR EL CATÁLOGO DE TARJETAS CLUB GLOW (PLANTILLA EXACTA POR SELLO 1..12) ──
          SELECT tarjetas_club_glow INTO v_tarjetas_globales FROM nilah_config LIMIT 1;
          IF v_tarjetas_globales IS NOT NULL AND jsonb_typeof(v_tarjetas_globales) = 'array' THEN
            SELECT elem INTO v_tarjeta_hito
            FROM jsonb_array_elements(v_tarjetas_globales) elem
            WHERE (elem->>'sello')::int = LEAST(v_sello_a_consultar, 12)
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

            -- Si el sello tiene imagen 3D configurada (especialmente hitos 4, 8 y 12)
            IF (v_tarjeta_hito->>'imagen_url') IS NOT NULL AND length(trim(v_tarjeta_hito->>'imagen_url')) > 10 THEN
              v_media_url := trim(v_tarjeta_hito->>'imagen_url');
            END IF;

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
        business_id, cliente_id, contenido, direccion, tipo, estado, campana_origen, url_archivo
    ) VALUES (
        p_business_id, p_cliente_id, v_mensaje_saliente, 'saliente',
        CASE WHEN v_media_url IS NOT NULL THEN 'imagen' ELSE 'texto' END,
        'enviado',
        CASE WHEN v_nota IN ('1', '2', '3') THEN 'atencion_queja_feedback' ELSE 'recompensa_fidelizacion' END,
        v_media_url
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
        v_mensaje_saliente AS mensaje_recompensa,
        v_media_url AS media_url;
END;
$function$;
`;

  await client.query(sql);
  console.log('procesar_respuesta_calificacion_fidelizacion actualizada con éxito.');

  // Ahora actualizar trg_fn_procesar_feedback_fidelizacion para soportar media_url
  const sqlTrg = `
CREATE OR REPLACE FUNCTION public.trg_fn_procesar_feedback_fidelizacion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_res record;
    v_target_cliente_id bigint := NEW.cliente_id;
    v_target_phone text;
    v_clean_content text;
    v_evo_phone text;
    v_http_res extensions.http_response;
    v_digit text;
BEGIN
    v_clean_content := TRIM(NEW.contenido);

    -- Extraer dígito del 1 al 5 si está presente en el mensaje
    SELECT substring(v_clean_content FROM '[1-5]') INTO v_digit;

    -- Solo procesar mensajes entrantes que contengan calificación
    IF NEW.direccion = 'entrante' AND v_digit IS NOT NULL THEN

        -- Obtener el teléfono del cliente que envió el mensaje
        SELECT REGEXP_REPLACE(telefono, '[^0-9]', '', 'g') INTO v_target_phone
        FROM public."Clientes"
        WHERE id = NEW.cliente_id;

        -- Buscar la cita más reciente con encuesta_enviada pendiente de feedback
        SELECT c.cliente_id INTO v_target_cliente_id
        FROM public."Citas" c
        JOIN public."Clientes" cl ON cl.id = c.cliente_id
        WHERE c.business_id = NEW.business_id
          AND c.encuesta_enviada = true
          AND (c.calificacion IS NULL OR c.calificacion = '0' OR c.calificacion = '')
          AND (
              c.cliente_id = NEW.cliente_id
              OR (
                  v_target_phone IS NOT NULL
                  AND (
                      REGEXP_REPLACE(cl.telefono, '[^0-9]', '', 'g') = v_target_phone
                      OR RIGHT(REGEXP_REPLACE(cl.telefono, '[^0-9]', '', 'g'), 9) = RIGHT(v_target_phone, 9)
                  )
              )
          )
        ORDER BY c.id DESC
        LIMIT 1;

        -- Fallback a nilah_autopilot_log si aplica
        IF v_target_cliente_id IS NULL THEN
            SELECT c.cliente_id INTO v_target_cliente_id
            FROM public.nilah_autopilot_log l
            JOIN public."Citas" c ON c.id = l.cita_id
            WHERE l.business_id = NEW.business_id
              AND l.flujo_origen IN ('fidelizacion', 'fidelizacion_encuesta')
              AND (
                  REGEXP_REPLACE(l.telefono, '[^0-9]', '', 'g') = v_target_phone
                  OR RIGHT(REGEXP_REPLACE(l.telefono, '[^0-9]', '', 'g'), 9) = RIGHT(v_target_phone, 9)
              )
              AND c.encuesta_enviada = true
              AND (c.calificacion IS NULL OR c.calificacion = '0' OR c.calificacion = '')
            ORDER BY l.id DESC
            LIMIT 1;
        END IF;

        IF v_target_cliente_id IS NOT NULL THEN
            FOR v_res IN
                SELECT * FROM public.procesar_respuesta_calificacion_fidelizacion(
                    NEW.business_id,
                    v_target_cliente_id,
                    v_clean_content
                )
            LOOP
                IF v_res.debe_responder AND v_res.mensaje_recompensa IS NOT NULL THEN
                    v_evo_phone := COALESCE(
                        CASE WHEN LENGTH(v_target_phone) = 9 THEN '51' || v_target_phone ELSE v_target_phone END,
                        v_res.telefono_cliente
                    );

                    INSERT INTO public.cola_mensajes_salientes (
                        business_id, cliente_id, cita_id, telefono,
                        flujo, mensaje, media_url, media_type, delay_ms, instance_name, api_key,
                        estado, enviado_at, proximo_intento_at, metadata
                    ) VALUES (
                        NEW.business_id, NEW.cliente_id, v_res.cita_id, v_evo_phone,
                        'fidelizacion_recompensa', v_res.mensaje_recompensa,
                        v_res.media_url, CASE WHEN v_res.media_url IS NOT NULL THEN 'image' ELSE NULL END,
                        1000, v_res.instance_name, v_res.api_key, 'enviado',
                        now(), now(),
                        jsonb_build_object(
                            'tipo', 'respuesta_calificacion',
                            'nota', v_res.nota_recibida,
                            'cita_id', v_res.cita_id,
                            'disparo_directo', true
                        )
                    )
                    ON CONFLICT DO NOTHING;

                    -- Disparo inmediato a Evolution API (sendMedia si hay imagen 3D, sendText si es regular)
                    IF v_res.instance_name IS NOT NULL AND v_res.api_key IS NOT NULL THEN
                        BEGIN
                            IF v_res.media_url IS NOT NULL AND v_res.media_url <> '' THEN
                                SELECT * INTO v_http_res FROM extensions.http((
                                    'POST',
                                    'https://evo.koratflow.agency/message/sendMedia/' || v_res.instance_name,
                                    ARRAY[
                                        extensions.http_header('apikey', v_res.api_key),
                                        extensions.http_header('Content-Type', 'application/json')
                                    ],
                                    'application/json',
                                    jsonb_build_object(
                                        'number', v_evo_phone,
                                        'mediatype', 'image',
                                        'mimetype', 'image/jpeg',
                                        'caption', v_res.mensaje_recompensa,
                                        'media', v_res.media_url
                                    )::text
                                )::extensions.http_request);
                            ELSE
                                SELECT * INTO v_http_res FROM extensions.http((
                                    'POST',
                                    'https://evo.koratflow.agency/message/sendText/' || v_res.instance_name,
                                    ARRAY[
                                        extensions.http_header('apikey', v_res.api_key),
                                        extensions.http_header('Content-Type', 'application/json')
                                    ],
                                    'application/json',
                                    jsonb_build_object(
                                        'number', v_evo_phone,
                                        'text', v_res.mensaje_recompensa,
                                        'options', jsonb_build_object(
                                            'delay', 1200,
                                            'presence', 'composing'
                                        )
                                    )::text
                                )::extensions.http_request);
                            END IF;
                        EXCEPTION WHEN OTHERS THEN
                            UPDATE public.cola_mensajes_salientes
                            SET estado = 'pendiente', error_mensaje = SQLERRM
                            WHERE telefono = v_evo_phone AND cita_id = v_res.cita_id;
                        END;
                    END IF;
                END IF;
            END LOOP;
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;
`;

  await client.query(sqlTrg);
  console.log('trg_fn_procesar_feedback_fidelizacion actualizada con éxito.');

  await client.end();
}
run().catch(e => console.error(e.message));
