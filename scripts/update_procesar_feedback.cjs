const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();

  console.log('1. Updating procesar_respuesta_calificacion_fidelizacion...');
  await client.query(`
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
    v_target_cita_id bigint;
    v_cliente record;
    v_negocio record;
    v_inst record;
    v_primer_nombre text;
    v_mensaje_saliente text;
    v_media_url_out text := NULL;
    v_tel_limpio text;
    v_plantilla_custom text;
    v_modo text := 'sellos';
    -- Sellos variables
    v_config_sellos record;
    v_sellos_totales int := 12;
    v_sellos_actuales int := 0;
    v_sellos_despues int := 1;
    v_sellos_faltantes int := 0;
    v_proximo_hito record;
    v_card_url text;
    v_codigo_premio text := '';
    v_sobrante_guardado numeric(10,2) := 0;
    v_valor_base numeric(10,2) := 30;
    v_mov_cita record;
    v_copys_pack jsonb;
    v_copy_item jsonb;
    v_premio_1 text := 'Regalo VIP';
    v_premio_proximo text := 'Regalo VIP';
    v_es_primera_vez boolean := false;
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

    -- 2. Localizar la Cita pendiente de calificar
    SELECT c.* INTO v_cita 
    FROM public."Citas" c
    WHERE c.business_id = p_business_id
      AND c.cliente_id = p_cliente_id
      AND c.encuesta_enviada = true
      AND (c.calificacion IS NULL OR c.calificacion = '0' OR c.calificacion = '')
    ORDER BY c.created_at DESC
    LIMIT 1;

    IF v_cita.id IS NULL THEN
        RETURN;
    END IF;

    v_target_cita_id := v_cita.id;

    SELECT * INTO v_cliente FROM public."Clientes" cl WHERE cl.id = p_cliente_id;
    SELECT * INTO v_negocio FROM public.negocios neg WHERE neg.id = p_business_id;
    SELECT * INTO v_inst FROM public.instancias_evolution ie
    WHERE ie.business_id = p_business_id AND ie.status = 'conectado'
    ORDER BY ie.updated_at DESC LIMIT 1;

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
    WHERE "Citas".id = v_target_cita_id;

    -- =========================================================================
    -- RAMA A: CALIFICACIÓN BAJA / QUEJA (1, 2 o 3 Estrellas)
    -- =========================================================================
    IF v_nota IN ('1', '2', '3') THEN
        -- Pausar bot 24h
        UPDATE public."Clientes"
        SET bot_pausado = true,
            bot_pausado_razon = 'Calificación de ' || v_nota || ' estrellas en cita #' || v_target_cita_id || ' — Atención humana requerida',
            bot_pausado_hasta = NOW() + INTERVAL '24 hours'
        WHERE "Clientes".id = p_cliente_id;

        -- Mensaje empático inmediato (sin repetir el nombre si ya se usó)
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
            v_mensaje_saliente := 'Lamentamos mucho que tu experiencia no haya sido de 5 estrellas 😔. En *' || v_negocio.nombre || '* nos importa mucho tu satisfacción y bienestar. ¿Nos podrías contar qué sucedió con tu *' || COALESCE(v_cita.servicio, 'servicio') || '* para solucionarlo de inmediato? 🙏';
        END IF;

    -- =========================================================================
    -- RAMA B: CALIFICACIÓN POSITIVA (4 o 5 Estrellas)
    -- =========================================================================
    ELSE
        IF v_modo IN ('sellos', 'ambos') THEN
          -- Asegurar que fn_registrar_sello_visita haya corrido
          IF NOT EXISTS (
            SELECT 1 FROM sellos_movimientos sm
            WHERE sm.cita_id = v_target_cita_id AND sm.motivo = 'cita'::sello_motivo_enum
          ) THEN
            PERFORM public.fn_registrar_sello_visita(v_target_cita_id, p_business_id);
          END IF;

          -- Cancelar mensaje diferido de la cola si existía
          UPDATE public.cola_mensajes_salientes cms
          SET estado = 'cancelado'
          WHERE cms.cita_id = v_target_cita_id
            AND cms.flujo = 'club_glow_sellos'
            AND cms.estado = 'pendiente';

          -- Obtener config de sellos
          SELECT * INTO v_config_sellos FROM sellos_config WHERE sellos_config.business_id = p_business_id;
          v_valor_base := COALESCE(v_config_sellos.valor_sello_base, 30);
          v_sellos_totales := COALESCE(v_config_sellos.total_sellos_roadmap, 12);

          -- Consultar sellos antes y después
          v_sellos_actuales := public.fn_sellos_activos(p_cliente_id, p_business_id);
          v_card_url := 'https://koratflow.agency/club/' || COALESCE(v_negocio.slug, v_negocio.id::text) || '?c=' || p_cliente_id;

          -- Verificar si aplica sello de bienvenida (si es primera vez y bienvenida activo)
          IF COALESCE(v_config_sellos.bienvenida_activo, true) AND v_sellos_actuales <= 1 THEN
            IF NOT EXISTS (
              SELECT 1 FROM sellos_movimientos
              WHERE cliente_id = p_cliente_id AND business_id = p_business_id AND motivo = 'bienvenida'::sello_motivo_enum
            ) THEN
              INSERT INTO sellos_movimientos (
                business_id, cliente_id, cita_id, cantidad, motivo, total_post, created_at
              ) VALUES (
                p_business_id, p_cliente_id, v_target_cita_id, 1, 'bienvenida'::sello_motivo_enum, v_sellos_actuales + 1, now()
              );
              v_sellos_actuales := v_sellos_actuales + 1;
              v_es_primera_vez := true;
            END IF;
          END IF;

          v_sellos_despues := LEAST(v_sellos_totales, GREATEST(1, v_sellos_actuales));

          -- Obtener hitos de premio
          SELECT r.id, r.hito_sello, r.nombre INTO v_proximo_hito
          FROM sellos_roadmap r
          WHERE r.business_id = p_business_id AND r.activo = true AND r.hito_sello >= v_sellos_despues
          ORDER BY r.hito_sello ASC LIMIT 1;

          v_sellos_faltantes := GREATEST(0, COALESCE(v_proximo_hito.hito_sello, v_sellos_totales) - v_sellos_despues);
          v_premio_proximo := COALESCE(v_proximo_hito.nombre, 'Regalo VIP Sorpresa');

          SELECT r.nombre INTO v_premio_1
          FROM sellos_roadmap r
          WHERE r.business_id = p_business_id AND r.activo = true
          ORDER BY r.hito_sello ASC LIMIT 1;
          v_premio_1 := COALESCE(v_premio_1, 'Regalo VIP');

          -- Si alcanzó hito con premio (4, 8 o 12), generar cupón único si no existe
          IF v_proximo_hito.hito_sello IS NOT NULL AND v_sellos_despues = v_proximo_hito.hito_sello THEN
            IF NOT EXISTS (
              SELECT 1 FROM sellos_premios_ganados spg
              WHERE spg.cliente_id = p_cliente_id AND spg.roadmap_id = v_proximo_hito.id AND spg.business_id = p_business_id
            ) THEN
              v_codigo_premio := 'GLOW-' || UPPER(SUBSTRING(MD5(RANDOM()::text || clock_timestamp()::text) FROM 1 FOR 6));
              INSERT INTO sellos_premios_ganados (
                business_id, cliente_id, roadmap_id, codigo_canje, estado, ganado_en, expira_en
              ) VALUES (
                p_business_id, p_cliente_id, v_proximo_hito.id, v_codigo_premio, 'pendiente'::estado_canje_enum, now(), now() + interval '60 days'
              );
            END IF;
          END IF;

          -- BUSCAR COPY ESPECÍFICO DEL PACK EN nilah_config.copys_calificacion_sellos
          SELECT copys_calificacion_sellos INTO v_copys_pack FROM nilah_config LIMIT 1;
          IF v_copys_pack IS NOT NULL AND jsonb_typeof(v_copys_pack) = 'array' THEN
            SELECT elem INTO v_copy_item
            FROM jsonb_array_elements(v_copys_pack) elem
            WHERE (elem->>'sello')::int = v_sellos_despues
            LIMIT 1;

            IF v_copy_item IS NOT NULL AND (v_copy_item->>'copy') IS NOT NULL THEN
              v_mensaje_saliente := v_copy_item->>'copy';
              v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{link_tarjeta}', v_card_url);
              v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{premio_proximo}', v_premio_proximo);
              v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{premio_1}', v_premio_1);
              v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{codigo}', COALESCE(v_codigo_premio, ''));
              v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{salon}', v_negocio.nombre);
              v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{nombre_negocio}', v_negocio.nombre);
            END IF;
          END IF;

          -- FALLBACK si no hay copy en config
          IF v_mensaje_saliente IS NULL THEN
            IF v_sellos_despues = 2 AND (v_es_primera_vez OR COALESCE(v_config_sellos.bienvenida_activo, true)) THEN
              v_mensaje_saliente := '¡Ayy, nos alegra muchísimo que hayas disfrutado tu atención hoy! 🥰✨' || E'\n\n' ||
                                    'Te tenemos una linda sorpresa: hoy estrenamos contigo tu membresía oficial *Club Glow* 👑🎁' || E'\n\n' ||
                                    'Para celebrarlo, te regalamos tu *primer sello de bienvenida* + el sello de tu servicio de hoy: ¡ya arrancas con *2 de 12 sellos* acumulados! ✨' || E'\n\n' ||
                                    '🎯 Estás a solo 2 sellos de tu primer regalo VIP: *' || v_premio_1 || '* 🌸💎' || E'\n\n' ||
                                    '📲 *Mira tu tarjeta digital y tus sellos en vivo aquí:*' || E'\n' || v_card_url;
            ELSE
              v_mensaje_saliente := '¡Muchísimas gracias por tu calificación! 🥰 Nos alegra un montón saberlo ✨' || E'\n\n' ||
                                    'Sumaste tu *sello ' || v_sellos_despues || ' de ' || v_sellos_totales || '* en tu membresía *Club Glow* 👑' || E'\n' ||
                                    '🎯 Próximo objetivo: *' || v_premio_proximo || '* 🌸💎' || E'\n\n' ||
                                    '📲 *Mira tu tarjeta digital aquí:*' || E'\n' || v_card_url;
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
          UPDATE public."Clientes" SET puntos_acumulados = v_puntos_actuales WHERE "Clientes".id = p_cliente_id;

          v_mensaje_saliente := '¡Muchísimas gracias por tu calificación! 🙌💖' || E'\n\n' ||
                                'Sumaste *+' || v_puntos_ganados || ' pts* con tu visita. Llevas *' || v_puntos_actuales || '/' || v_costo_premio || ' pts* para canjear tu *' || v_nombre_premio || '* 🎁.' || E'\n\n' ||
                                '📲 *Mira tu balance aquí:*' || E'\n' || v_card_url;
        END IF;
    END IF;

    -- Registrar en tabla mensajes
    INSERT INTO public.mensajes (
        business_id, cliente_id, contenido, direccion, tipo, estado, campana_origen, url_archivo
    ) VALUES (
        p_business_id, p_cliente_id, v_mensaje_saliente, 'saliente',
        'texto',
        'enviado',
        CASE WHEN v_nota IN ('1', '2', '3') THEN 'atencion_queja_feedback' ELSE 'recompensa_fidelizacion' END,
        NULL
    );

    v_tel_limpio := REGEXP_REPLACE(v_cliente.telefono, '[^0-9]', '', 'g');
    IF LENGTH(v_tel_limpio) = 9 THEN
        v_tel_limpio := '51' || v_tel_limpio;
    END IF;

    RETURN QUERY
    SELECT 
        true AS debe_responder,
        v_target_cita_id AS cita_id,
        v_nota AS nota_recibida,
        v_tel_limpio AS telefono_cliente,
        v_inst.instance_name,
        v_inst.api_key,
        v_mensaje_saliente AS mensaje_recompensa,
        NULL::text AS media_url;
END;
$function$;
`);
  console.log('procesar_respuesta_calificacion_fidelizacion updated successfully.');

  console.log('2. Updating trg_fn_procesar_feedback_fidelizacion...');
  await client.query(`
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
    v_is_lid boolean := false;
BEGIN
    v_clean_content := TRIM(NEW.contenido);

    -- 1. Extraer dígito del 1 al 5 si está presente en el mensaje
    SELECT substring(v_clean_content FROM '[1-5]') INTO v_digit;

    -- 2. FILTRO ESTRICTO: Solo mensajes entrantes que contengan un número del 1 al 5
    IF NEW.direccion = 'entrante' AND v_digit IS NOT NULL THEN

        -- Obtener el teléfono del cliente que envió el mensaje
        SELECT REGEXP_REPLACE(telefono, '[^0-9]', '', 'g') INTO v_target_phone
        FROM public."Clientes"
        WHERE id = NEW.cliente_id;

        IF v_target_phone IS NOT NULL AND length(v_target_phone) > 13 THEN
            v_is_lid := true;
        END IF;

        -- 3. BLINDAJE DE SEGURIDAD Y RESOLUCIÓN DE CLIENTA:
        -- Paso 1: Coincidencia directa por id o por teléfono en ventana de 48h
        SELECT c.cliente_id INTO v_target_cliente_id
        FROM public."Citas" c
        JOIN public."Clientes" cl ON cl.id = c.cliente_id
        WHERE c.business_id = NEW.business_id
          AND c.encuesta_enviada = true
          AND (c.calificacion IS NULL OR c.calificacion = '0' OR c.calificacion = '')
          AND COALESCE(c.fecha_encuesta_enviada, c.fecha_completada, c.fecha, c.created_at) >= NOW() - INTERVAL '48 hours'
          AND (
              c.cliente_id = NEW.cliente_id
              OR (
                  v_target_phone IS NOT NULL
                  AND (
                      REGEXP_REPLACE(cl.telefono, '[^0-9]', '', 'g') = v_target_phone
                      OR (length(v_target_phone) >= 9 AND length(v_target_phone) <= 13 AND RIGHT(REGEXP_REPLACE(cl.telefono, '[^0-9]', '', 'g'), 9) = RIGHT(v_target_phone, 9))
                      OR cl.whatsapp_lid = v_target_phone
                  )
              )
          )
        ORDER BY c.id DESC
        LIMIT 1;

        -- Paso 2: Blindaje WhatsApp Web / LID / Companion Device
        -- Si no hubo coincidencia directa (por ejemplo, respondió desde WhatsApp Web con LID):
        IF v_target_cliente_id IS NULL THEN
            -- a) Buscar si enviamos una encuesta o mensaje saliente a una clienta en los últimos 60 minutos
            SELECT m.cliente_id INTO v_target_cliente_id
            FROM public.mensajes m
            JOIN public."Citas" c ON c.cliente_id = m.cliente_id AND c.business_id = NEW.business_id
            WHERE m.business_id = NEW.business_id
              AND m.direccion = 'saliente'
              AND m.created_at >= NOW() - INTERVAL '60 minutes'
              AND c.encuesta_enviada = true
              AND (c.calificacion IS NULL OR c.calificacion = '0' OR c.calificacion = '')
            ORDER BY m.created_at DESC
            LIMIT 1;
        END IF;

        -- Paso 3: Coincidencia por push_name si aún no se resuelve
        IF v_target_cliente_id IS NULL THEN
            SELECT c.cliente_id INTO v_target_cliente_id
            FROM public."Citas" c
            JOIN public."Clientes" cl ON cl.id = c.cliente_id
            JOIN public."Clientes" sender ON sender.id = NEW.cliente_id
            WHERE c.business_id = NEW.business_id
              AND c.encuesta_enviada = true
              AND (c.calificacion IS NULL OR c.calificacion = '0' OR c.calificacion = '')
              AND sender.push_name IS NOT NULL
              AND TRIM(sender.push_name) <> ''
              AND (
                  LOWER(cl.nombre) = LOWER(TRIM(sender.push_name))
                  OR LOWER(cl.push_name) = LOWER(TRIM(sender.push_name))
              )
            ORDER BY c.id DESC
            LIMIT 1;
        END IF;

        -- Paso 4: Si solo hay 1 cita con encuesta pendiente en todo el salón en las últimas 2 horas
        IF v_target_cliente_id IS NULL THEN
            SELECT c.cliente_id INTO v_target_cliente_id
            FROM public."Citas" c
            WHERE c.business_id = NEW.business_id
              AND c.encuesta_enviada = true
              AND (c.calificacion IS NULL OR c.calificacion = '0' OR c.calificacion = '')
              AND COALESCE(c.fecha_encuesta_enviada, c.fecha_completada, c.fecha, c.created_at) >= NOW() - INTERVAL '2 hours'
            ORDER BY c.id DESC
            LIMIT 1;
        END IF;

        -- Fallback a nilah_autopilot_log SOLO si ocurrió en las últimas 48 horas
        IF v_target_cliente_id IS NULL THEN
            SELECT c.cliente_id INTO v_target_cliente_id
            FROM public.nilah_autopilot_log l
            JOIN public."Citas" c ON c.id = l.cita_id
            WHERE l.business_id = NEW.business_id
              AND l.tipo_flujo IN ('fidelizacion', 'encuesta_satisfaccion', 'post_cita')
              AND l.created_at >= NOW() - INTERVAL '48 hours'
              AND (c.calificacion IS NULL OR c.calificacion = '0' OR c.calificacion = '')
            ORDER BY l.created_at DESC
            LIMIT 1;
        END IF;

        -- VINCULACIÓN PERMANENTE: Si se detectó la clienta real y el mensaje vino de un LID o ID alterno
        IF v_target_cliente_id IS NOT NULL AND v_target_cliente_id <> NEW.cliente_id THEN
            UPDATE public."Clientes"
            SET whatsapp_lid = COALESCE(v_target_phone, whatsapp_lid)
            WHERE id = v_target_cliente_id;

            UPDATE public.mensajes
            SET cliente_id = v_target_cliente_id
            WHERE id = NEW.id;
        END IF;

        -- 4. Si hay cita pendiente confirmada, procesar calificación y enviar respuesta
        IF v_target_cliente_id IS NOT NULL THEN
            FOR v_res IN
                SELECT * FROM public.procesar_respuesta_calificacion_fidelizacion(
                    NEW.business_id,
                    v_target_cliente_id,
                    v_clean_content
                )
            LOOP
                IF v_res.debe_responder AND v_res.mensaje_recompensa IS NOT NULL THEN
                    v_evo_phone := v_res.telefono_cliente;

                    INSERT INTO public.cola_mensajes_salientes (
                        business_id, cliente_id, cita_id, telefono,
                        flujo, mensaje, media_url, media_type, delay_ms, instance_name, api_key,
                        estado, enviado_at, proximo_intento_at, metadata
                    ) VALUES (
                        NEW.business_id, v_target_cliente_id, v_res.cita_id, v_evo_phone,
                        'fidelizacion_recompensa', v_res.mensaje_recompensa,
                        NULL, NULL,
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

                    -- Disparo inmediato a Evolution API con linkPreview = false (sin previsualización ni imagen de link)
                    IF v_res.instance_name IS NOT NULL AND v_res.api_key IS NOT NULL THEN
                        BEGIN
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
                                    'linkPreview', false,
                                    'options', jsonb_build_object(
                                        'delay', (public.calcular_delay_escritura_humana(v_res.mensaje_recompensa, 1.5, 3.5) * 1000)::int,
                                        'presence', 'composing',
                                        'linkPreview', false
                                    )
                                )::text
                            )::extensions.http_request);
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
`);
  console.log('trg_fn_procesar_feedback_fidelizacion updated successfully.');

  console.log('3. Updating simular_respuesta_tiempo2_fidelizacion with linkPreview: false...');
  await client.query(`
CREATE OR REPLACE FUNCTION public.simular_respuesta_tiempo2_fidelizacion(
    p_business_id uuid,
    p_telefono_cliente text,
    p_nota text,
    p_nombre_cliente text DEFAULT 'Valeria'::text,
    p_servicio text DEFAULT 'Lifting de Pestañas'::text,
    p_es_simulacion boolean DEFAULT false,
    p_forzar_24h_resumen boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_clean_phone text;
    v_nota_int int;
    v_cliente record;
    v_negocio record;
    v_inst record;
    v_mensaje_saliente text;
    v_primer_nombre text;
    v_card_url text;
    v_modo text := 'sellos';
    -- Sellos variables
    v_config_sellos record;
    v_sellos_totales int := 12;
    v_sellos_actuales int := 0;
    v_sellos_despues int := 1;
    v_sellos_faltantes int := 0;
    v_proximo_hito record;
    v_codigo_premio text := '';
    v_tarjetas_pack jsonb;
    v_tarjeta_pack_item jsonb;
    v_premio_texto text;
    v_es_primera_vez boolean := false;
    v_premio_1 text := 'Regalo VIP';
    -- Puntos variables
    v_puntos_ganados integer := 50;
    v_puntos_actuales bigint := 50;
    v_costo_premio bigint := 200;
    v_nombre_premio text := 'Premio VIP';
    v_premio record;
    v_precio_servicio numeric := 0;
BEGIN
    v_clean_phone := REGEXP_REPLACE(p_telefono_cliente, '[^0-9]', '', 'g');
    IF LENGTH(v_clean_phone) = 9 THEN
      v_clean_phone := '51' || v_clean_phone;
    END IF;

    SELECT * INTO v_negocio FROM public.negocios WHERE id = p_business_id;
    SELECT * INTO v_cliente FROM public."Clientes"
    WHERE business_id = p_business_id
      AND (
        telefono = v_clean_phone 
        OR REGEXP_REPLACE(telefono, '[^0-9]', '', 'g') LIKE '%' || RIGHT(v_clean_phone, 9)
        OR whatsapp_lid = v_clean_phone
      )
    ORDER BY total_visitas DESC NULLS LAST, id ASC
    LIMIT 1;

    v_primer_nombre := public.extraer_primer_nombre(COALESCE(v_cliente.nombre, p_nombre_cliente));
    IF v_primer_nombre IS NULL OR LENGTH(v_primer_nombre) < 2 OR LOWER(v_primer_nombre) IN ('cliente', 'lead', 'null', 'undefined') THEN
      v_primer_nombre := 'Bella';
    ELSE
      v_primer_nombre := INITCAP(LOWER(v_primer_nombre));
    END IF;

    v_modo := COALESCE(v_negocio.modo_fidelizacion, 'sellos');
    v_card_url := 'https://koratflow.agency/club/' || COALESCE(v_negocio.slug, v_negocio.id::text) || '?c=' || COALESCE(v_cliente.id, 2249);

    -- SI ES FORZAR RESUMEN 24H (Para quejas)
    IF p_forzar_24h_resumen THEN
      SELECT * INTO v_config_sellos FROM sellos_config WHERE business_id = p_business_id;
      v_sellos_totales := COALESCE(v_config_sellos.total_sellos_roadmap, 12);
      v_sellos_actuales := COALESCE(public.fn_sellos_activos(v_cliente.id, p_business_id), 0);

      IF COALESCE(v_config_sellos.bienvenida_activo, true) AND v_sellos_actuales = 0 THEN
        IF NOT EXISTS (
          SELECT 1 FROM sellos_movimientos
          WHERE cliente_id = v_cliente.id AND business_id = p_business_id AND motivo = 'bienvenida'::sello_motivo_enum
        ) THEN
          INSERT INTO sellos_movimientos (business_id, cliente_id, cantidad, motivo, total_post, created_at)
          VALUES (p_business_id, v_cliente.id, 1, 'bienvenida'::sello_motivo_enum, 1, now());
          v_sellos_actuales := 1;
        END IF;
      END IF;

      SELECT id, hito_sello, nombre INTO v_proximo_hito
      FROM sellos_roadmap
      WHERE business_id = p_business_id AND activo = true AND hito_sello >= v_sellos_actuales
      ORDER BY hito_sello ASC LIMIT 1;

      IF v_proximo_hito.nombre IS NULL THEN
        SELECT id, hito_sello, nombre INTO v_proximo_hito
        FROM sellos_roadmap
        WHERE business_id = p_business_id AND activo = true
        ORDER BY hito_sello ASC LIMIT 1;
      END IF;

      v_sellos_faltantes := GREATEST(0, COALESCE(v_proximo_hito.hito_sello, v_sellos_totales) - v_sellos_actuales);
      v_premio_texto := COALESCE(v_proximo_hito.nombre, 'Regalo VIP Sorpresa');

      v_mensaje_saliente := 'Hola ' || v_primer_nombre || ' 💕 Te compartimos tu tarjeta del Club Glow de ' || COALESCE(v_negocio.nombre, 'nuestro salón') || '. Ya tienes ' || v_sellos_actuales || ' de ' || v_sellos_totales || ' sellos acumulados. Te faltan ' || v_sellos_faltantes || ' sellos para: ' || v_premio_texto || E'.\n\n📲 *Míralos aquí:*\n' || v_card_url;

      IF NOT p_es_simulacion THEN
          SELECT * INTO v_inst FROM public.instancias_evolution WHERE business_id = p_business_id AND status = 'conectado';
          IF FOUND THEN
              PERFORM extensions.http((
                  'POST',
                  'https://evo.koratflow.agency/message/sendText/' || v_inst.instance_name,
                  ARRAY[
                      extensions.http_header('apikey', v_inst.api_key),
                      extensions.http_header('Content-Type', 'application/json')
                  ],
                  'application/json',
                  jsonb_build_object(
                      'number', v_clean_phone,
                      'text', v_mensaje_saliente,
                      'linkPreview', false,
                      'options', jsonb_build_object('linkPreview', false)
                  )::text
              )::extensions.http_request);
          END IF;
      END IF;

      RETURN jsonb_build_object(
          'success', true,
          'mensaje', v_mensaje_saliente,
          'tipo', 'resumen_24h',
          'sellos_actuales', v_sellos_actuales,
          'telefono', v_clean_phone
      );
    END IF;

    -- EXTRACCIÓN DEL NÚMERO
    SELECT substring(p_nota FROM '[1-5]')::int INTO v_nota_int;
    IF v_nota_int IS NULL THEN
      IF p_nota ILIKE '%excelente%' OR p_nota ILIKE '%genial%' OR p_nota ILIKE '%perfecto%' OR p_nota ILIKE '%bueno%' THEN
        v_nota_int := 5;
      ELSIF p_nota ILIKE '%mal%' OR p_nota ILIKE '%feo%' OR p_nota ILIKE '%pésimo%' OR p_nota ILIKE '%queja%' THEN
        v_nota_int := 2;
      ELSE
        v_nota_int := 5;
      END IF;
    END IF;

    IF v_modo IN ('sellos', 'ambos') THEN
      SELECT * INTO v_config_sellos FROM sellos_config WHERE business_id = p_business_id;
      v_sellos_totales := COALESCE(v_config_sellos.total_sellos_roadmap, 12);

      IF v_cliente.id IS NOT NULL THEN
        v_sellos_actuales := COALESCE(public.fn_sellos_activos(v_cliente.id, p_business_id), 0);
      ELSE
        v_sellos_actuales := 0;
      END IF;

      IF v_nota_int <= 3 THEN
        -- QUEJA (1, 2 o 3 ⭐)
        v_mensaje_saliente := 'Lamentamos mucho que tu experiencia no haya sido de 5 estrellas 😔. En ' || COALESCE(v_negocio.nombre, 'nuestro salón') || ' nos importa mucho tu satisfacción. ¿Nos podrías contar qué sucedió con tu ' || p_servicio || ' para que podamos solucionarlo de inmediato? 🙏';
      ELSE
        -- CALIFICACIÓN POSITIVA (4 o 5 ⭐)
        IF COALESCE(v_config_sellos.bienvenida_activo, true) AND v_sellos_actuales <= 1 THEN
          IF v_cliente.id IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM sellos_movimientos
            WHERE cliente_id = v_cliente.id AND business_id = p_business_id AND motivo = 'bienvenida'::sello_motivo_enum
          ) THEN
            INSERT INTO sellos_movimientos (business_id, cliente_id, cantidad, motivo, total_post, created_at)
            VALUES (p_business_id, v_cliente.id, 1, 'bienvenida'::sello_motivo_enum, v_sellos_actuales + 1, now());
            v_sellos_actuales := v_sellos_actuales + 1;
            v_es_primera_vez := true;
          END IF;
        END IF;

        v_sellos_despues := LEAST(v_sellos_totales, GREATEST(1, v_sellos_actuales));

        SELECT id, hito_sello, nombre INTO v_proximo_hito
        FROM sellos_roadmap
        WHERE business_id = p_business_id AND activo = true AND hito_sello >= v_sellos_despues
        ORDER BY hito_sello ASC LIMIT 1;

        v_sellos_faltantes := GREATEST(0, COALESCE(v_proximo_hito.hito_sello, v_sellos_totales) - v_sellos_despues);
        v_premio_texto := COALESCE(v_proximo_hito.nombre, 'Regalo VIP');

        SELECT r.nombre INTO v_premio_1
        FROM sellos_roadmap r
        WHERE r.business_id = p_business_id AND r.activo = true
        ORDER BY r.hito_sello ASC LIMIT 1;
        v_premio_1 := COALESCE(v_premio_1, 'Regalo VIP');

        -- Obtener copy de nilah_config.copys_calificacion_sellos
        SELECT copys_calificacion_sellos INTO v_tarjetas_pack FROM nilah_config LIMIT 1;
        IF v_tarjetas_pack IS NOT NULL AND jsonb_typeof(v_tarjetas_pack) = 'array' THEN
          SELECT elem INTO v_tarjeta_pack_item
          FROM jsonb_array_elements(v_tarjetas_pack) elem
          WHERE (elem->>'sello')::int = v_sellos_despues
          LIMIT 1;

          IF v_tarjeta_pack_item IS NOT NULL AND (v_tarjeta_pack_item->>'copy') IS NOT NULL THEN
            v_mensaje_saliente := v_tarjeta_pack_item->>'copy';
            v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{premio_proximo}', v_premio_texto);
            v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{premio_1}', v_premio_1);
            v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{link_tarjeta}', v_card_url);
            v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{salon}', COALESCE(v_negocio.nombre, 'el salón'));
            v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{nombre_negocio}', COALESCE(v_negocio.nombre, 'el salón'));
          END IF;
        END IF;

        IF v_mensaje_saliente IS NULL THEN
          v_mensaje_saliente := '¡Ayy, nos alegra muchísimo que hayas disfrutado tu atención hoy! 🥰✨' || E'\n\n' ||
                                'Te tenemos una linda sorpresa: hoy estrenamos contigo tu membresía oficial *Club Glow* 👑🎁' || E'\n\n' ||
                                'Para celebrarlo, te regalamos tu *primer sello de bienvenida* + el sello de tu servicio de hoy: ¡ya arrancas con *' || v_sellos_despues || ' de 12 sellos* acumulados! ✨' || E'\n\n' ||
                                '🎯 Estás a solo 2 sellos de tu primer regalo VIP: *' || v_premio_1 || '* 🌸💎' || E'\n\n' ||
                                '📲 *Mira tu tarjeta digital y tus sellos en vivo aquí:*' || E'\n' || v_card_url;
        END IF;
      END IF;

    ELSE
      -- PUNTOS
      IF v_nota_int <= 3 THEN
        v_mensaje_saliente := 'Lamentamos mucho que tu experiencia no haya sido de 5 estrellas 😔. En ' || COALESCE(v_negocio.nombre, 'nuestro salón') || ' nos importa mucho tu satisfacción. ¿Nos podrías contar qué sucedió con tu ' || p_servicio || ' para que podamos solucionarlo? 🙏';
      ELSE
        v_mensaje_saliente := '¡Muchísimas gracias por tu calificación! 🙌💖' || E'\n\n' ||
                              'Sumaste *+50 pts* con tu visita. Ya los tienes disponibles en tu perfil 🎁.' || E'\n\n' ||
                              '📲 *Mira tu balance aquí:*' || E'\n' || v_card_url;
      END IF;
    END IF;

    -- Enviar si es modo real
    IF NOT p_es_simulacion THEN
        SELECT * INTO v_inst FROM public.instancias_evolution WHERE business_id = p_business_id AND status = 'conectado';
        IF FOUND THEN
            PERFORM extensions.http((
                'POST',
                'https://evo.koratflow.agency/message/sendText/' || v_inst.instance_name,
                ARRAY[
                    extensions.http_header('apikey', v_inst.api_key),
                    extensions.http_header('Content-Type', 'application/json')
                ],
                'application/json',
                jsonb_build_object(
                    'number', v_clean_phone,
                    'text', v_mensaje_saliente,
                    'linkPreview', false,
                    'options', jsonb_build_object('linkPreview', false)
                )::text
            )::extensions.http_request);
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'mensaje', v_mensaje_saliente,
        'nota', v_nota_int::text,
        'modo', v_modo,
        'sellos_actuales', v_sellos_despues,
        'tipo', CASE WHEN v_nota_int <= 3 THEN 'queja' ELSE 'recompensa' END,
        'telefono', v_clean_phone
    );
END;
$function$;
`);
  console.log('simular_respuesta_tiempo2_fidelizacion updated successfully.');

  // Vinculamos permanentemente el LID de Martin con el cliente 2249
  await client.query(`
    UPDATE public."Clientes"
    SET whatsapp_lid = '255675141746866'
    WHERE id = 2249;
  `);
  console.log('Client 2249 whatsapp_lid set to 255675141746866.');

  await client.end();
}

run().catch(console.error);
