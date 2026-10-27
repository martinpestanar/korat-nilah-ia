const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();

  console.log('Actualizando trg_fn_procesar_feedback_fidelizacion para capturar el siguiente mensaje como feedback...');
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
    v_queja_cita_id bigint;
BEGIN
    -- BLINDAJE CONTRA EXCEPCIONES: Un trigger jamás debe romper la inserción de un mensaje en n8n
    BEGIN
        v_clean_content := TRIM(NEW.contenido);

        -- Obtener el teléfono del cliente que envió el mensaje
        SELECT REGEXP_REPLACE(telefono, '[^0-9]', '', 'g') INTO v_target_phone
        FROM public."Clientes"
        WHERE id = NEW.cliente_id;

        IF v_target_phone IS NOT NULL AND length(v_target_phone) > 13 THEN
            v_is_lid := true;
        END IF;

        -- 1. FILTRO INTELIGENTE DE CALIFICACIÓN:
        IF NEW.direccion = 'entrante' AND length(v_clean_content) <= 30 THEN
            IF v_clean_content ~ '^[1-5](\s.*)?$' 
               OR v_clean_content ~* '^(un |le doy |nota )?[1-5](\s*estrellas?|\s*pts)?$' THEN
                SELECT substring(v_clean_content FROM '[1-5]') INTO v_digit;
            ELSIF length(v_clean_content) <= 10 THEN
                SELECT substring(v_clean_content FROM '[1-5]') INTO v_digit;
            END IF;
        END IF;

        -- CASO A: Mensaje entrante que contiene calificación 1 al 5
        IF NEW.direccion = 'entrante' AND v_digit IS NOT NULL THEN

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
            IF v_target_cliente_id IS NULL THEN
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

            -- Fallback a nilah_autopilot_log
            IF v_target_cliente_id IS NULL THEN
                SELECT c.cliente_id INTO v_target_cliente_id
                FROM public.nilah_autopilot_log l
                JOIN public."Citas" c ON c.id = l.cita_id
                WHERE l.business_id = NEW.business_id
                  AND l.flujo_origen IN ('fidelizacion', 'encuesta_satisfaccion', 'post_cita', 'calificacion_encuesta')
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

            -- Si hay cita pendiente confirmada, procesar calificación y enviar respuesta
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

                        -- Disparo inmediato a Evolution API
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
                                            'linkPreview', false,
                                            'options', jsonb_build_object(
                                                'delay', (public.calcular_delay_escritura_humana(v_res.mensaje_recompensa, 1.5, 3.5) * 1000)::int,
                                                'presence', 'composing',
                                                'linkPreview', false
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

        -- CASO B: Mensaje entrante de TEXTO (Sin número del 1 al 5)
        -- Si la clienta acaba de calificar con 1, 2 o 3 y este es su siguiente mensaje,
        -- lo capturamos como su feedback_cliente (motivo de la queja) para la dueña.
        ELSIF NEW.direccion = 'entrante' AND v_digit IS NULL AND length(v_clean_content) > 1 THEN
            SELECT c.id INTO v_queja_cita_id
            FROM public."Citas" c
            JOIN public."Clientes" cl ON cl.id = c.cliente_id
            WHERE c.business_id = NEW.business_id
              AND c.calificacion IN ('1', '2', '3')
              AND (c.feedback_cliente IS NULL OR c.feedback_cliente ~ '^[1-5]$' OR TRIM(c.feedback_cliente) = '')
              AND COALESCE(c.fecha_feedback, c.updated_at, c.created_at) >= NOW() - INTERVAL '24 hours'
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

            IF v_queja_cita_id IS NOT NULL THEN
                UPDATE public."Citas"
                SET feedback_cliente = v_clean_content,
                    updated_at = NOW()
                WHERE id = v_queja_cita_id;
            END IF;
        END IF;

    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Error en trg_fn_procesar_feedback_fidelizacion: %', SQLERRM;
    END;

    RETURN NEW;
END;
$function$;
`);
  console.log('Captura de feedback del siguiente mensaje instalada exitosamente.');

  await client.end();
}

run().catch(console.error);
