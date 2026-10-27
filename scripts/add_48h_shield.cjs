const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function run() {
  await client.connect();

  console.log('--- Agregando blindaje de ventana de 48h a trg_fn_procesar_feedback_fidelizacion ---');

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

    -- 1. Extraer dígito del 1 al 5 si está presente en el mensaje
    SELECT substring(v_clean_content FROM '[1-5]') INTO v_digit;

    -- 2. FILTRO ESTRICTO: Solo mensajes entrantes que contengan un número del 1 al 5
    IF NEW.direccion = 'entrante' AND v_digit IS NOT NULL THEN

        -- Obtener el teléfono del cliente que envió el mensaje
        SELECT REGEXP_REPLACE(telefono, '[^0-9]', '', 'g') INTO v_target_phone
        FROM public."Clientes"
        WHERE id = NEW.cliente_id;

        -- 3. BLINDAJE DE SEGURIDAD TOTAL:
        -- Solo se activa SI Y SOLO SI:
        -- a) Existe una cita donde encuesta_enviada = true
        -- b) La calificación sigue pendiente (NULL, '0' o vacía)
        -- c) La encuesta fue enviada en las ÚLTIMAS 48 HORAS (ventana de feedback activa)
        -- Si pasaron más de 48 horas o si ya calificó, NO SE ACTIVA y no interfiere con recepción
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
                      OR RIGHT(REGEXP_REPLACE(cl.telefono, '[^0-9]', '', 'g'), 9) = RIGHT(v_target_phone, 9)
                  )
              )
          )
        ORDER BY c.id DESC
        LIMIT 1;

        -- Fallback a nilah_autopilot_log SOLO si ocurrió en las últimas 48 horas
        IF v_target_cliente_id IS NULL THEN
            SELECT c.cliente_id INTO v_target_cliente_id
            FROM public.nilah_autopilot_log l
            JOIN public."Citas" c ON c.id = l.cita_id
            WHERE l.business_id = NEW.business_id
              AND l.flujo_origen IN ('fidelizacion', 'fidelizacion_encuesta')
              AND l.created_at >= NOW() - INTERVAL '48 hours'
              AND (
                  REGEXP_REPLACE(l.telefono, '[^0-9]', '', 'g') = v_target_phone
                  OR RIGHT(REGEXP_REPLACE(l.telefono, '[^0-9]', '', 'g'), 9) = RIGHT(v_target_phone, 9)
              )
              AND c.encuesta_enviada = true
              AND (c.calificacion IS NULL OR c.calificacion = '0' OR c.calificacion = '')
            ORDER BY l.id DESC
            LIMIT 1;
        END IF;

        -- 4. Si NO hay cita pendiente en ventana de 48h, IGNORAR SILENCIOSAMENTE
        -- (Permite que la recepcionista hable libremente con la clienta sin interrupciones del bot)
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
  console.log('Trigger blindado con ventana de 48h con éxito!');

  await client.end();
}
run().catch(e => console.error(e.message));
