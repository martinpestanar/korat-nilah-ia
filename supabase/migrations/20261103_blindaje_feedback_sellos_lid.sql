-- Migración: Blindaje permanente contra cruce de calificaciones y sellos en fidelización
-- Fecha: 2026-11-03
-- Salón impactado de referencia: Glamour y Capricho
-- Problema resuelto:
-- 1. trg_fn_procesar_feedback_fidelizacion activaba el fallback de LID (dispositivos vinculados)
--    incluso cuando el remitente era un cliente con teléfono real normal (<= 13 dígitos) que enviaba
--    un número del 1 al 5 sin tener cita pendiente, tomando citas de otros clientes.
-- 2. Limpieza de whatsapp_lid contaminados con números telefónicos normales.
-- 3. Candado anti-doble envío de sellos de 18 horas en procesar_respuesta_calificacion_fidelizacion
--    y trg_fn_cita_calificada.
-- 4. Soporte para 'solo_si_responde' y 'recompensa_previa_enviada' en procesar_encuestas_omitidas.

-- 1. Limpieza preventiva de LIDs que contengan números normales
UPDATE public."Clientes"
SET whatsapp_lid = NULL
WHERE whatsapp_lid IS NOT NULL
  AND LENGTH(REGEXP_REPLACE(whatsapp_lid, '[^0-9]', '', 'g')) <= 13
  AND whatsapp_lid NOT ILIKE '%@lid%';

-- 2. Función procesar_respuesta_calificacion_fidelizacion con ventana de no duplicidad de 18h
CREATE OR REPLACE FUNCTION public.procesar_respuesta_calificacion_fidelizacion(p_business_id uuid, p_cliente_id bigint, p_contenido_mensaje text)
 RETURNS TABLE(debe_responder boolean, cita_id bigint, nota_recibida text, telefono_cliente text, instance_name text, api_key text, mensaje_recompensa text, media_url text)
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
        v_config_sellos record;
        v_sellos_totales int := 12;
        v_sellos_actuales int := 0;
        v_sellos_despues int := 1;
        v_sellos_faltantes int := 0;
        v_proximo_hito record;
        v_card_url text;
        v_codigo_premio text := '';
        v_valor_base numeric(10,2) := 30;
        v_copy_item jsonb;
        v_premio_1 text := 'Regalo VIP';
        v_premio_proximo text := 'Regalo VIP';
        v_es_primera_vez boolean := false;
        v_es_premio_desbloqueado boolean := false;
        v_sello_premio_desbloqueado int := 4;
        v_expira timestamptz;
        v_puntos_ganados integer := 50;
        v_puntos_actuales bigint := 50;
        v_costo_premio bigint := 200;
        v_nombre_premio text := 'Premio VIP';
        v_premio record;
        v_precio_servicio numeric := 0;
        v_ya_recibio_recompensa boolean := false;
    BEGIN
        SELECT substring(p_contenido_mensaje FROM '[1-5]') INTO v_nota;
        IF v_nota IS NULL THEN
            RETURN;
        END IF;

        SELECT c.* INTO v_cita 
        FROM public."Citas" c
        WHERE c.business_id = p_business_id
          AND c.cliente_id = p_cliente_id
          AND c.encuesta_enviada = true
          AND (c.calificacion IS NULL OR c.calificacion = '0' OR c.calificacion = '')
        ORDER BY c.fecha DESC, c.id DESC
        LIMIT 1;

        IF v_cita.id IS NULL THEN
            RETURN;
        END IF;

        v_target_cita_id := v_cita.id;

        -- Verificar si la clienta ya recibió su mensaje de sellos/recompensa en las últimas 18 horas
        SELECT (
            COALESCE(v_cita.calificacion_origen, '') = 'recompensa_previa_enviada'
            OR EXISTS (
                SELECT 1 FROM public.mensajes m
                WHERE m.cliente_id = p_cliente_id
                  AND m.business_id = p_business_id
                  AND m.campana_origen IN ('recompensa_fidelizacion', 'fidelizacion_recompensa', 'club_glow_sellos', 'fidelizacion_sellos_recompensa')
                  AND m.created_at >= now() - interval '18 hours'
            )
            OR EXISTS (
                SELECT 1 FROM public.cola_mensajes_salientes cms
                WHERE cms.cliente_id = p_cliente_id
                  AND cms.business_id = p_business_id
                  AND cms.flujo IN ('fidelizacion_recompensa', 'fidelizacion_sellos_recompensa', 'club_glow_sellos')
                  AND cms.estado IN ('enviado', 'procesando')
                  AND cms.created_at >= now() - interval '18 hours'
            )
        ) INTO v_ya_recibio_recompensa;

        -- Si ya recibió el mensaje de sellos previamente (ej. por omisión o adelanto) y califica 4 o 5,
        -- guardamos su calificación real silenciosamente en la cita sin duplicarle el WhatsApp.
        IF v_ya_recibio_recompensa AND v_nota IN ('4', '5') THEN
            UPDATE public."Citas"
            SET calificacion = v_nota,
                feedback_cliente = p_contenido_mensaje,
                fecha_feedback = CURRENT_DATE,
                calificacion_origen = 'whatsapp'
            WHERE cliente_id = p_cliente_id
              AND business_id = p_business_id
              AND (
                id = v_target_cita_id
                OR (fecha::date = v_cita.fecha::date AND estado ILIKE 'completada')
              );
            RETURN;
        END IF;

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

        -- =========================================================================
        -- RAMA A: CALIFICACIÓN BAJA / QUEJA (1, 2 o 3 Estrellas)
        -- =========================================================================
        IF v_nota IN ('1', '2', '3') THEN
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
              IF NOT EXISTS (
                SELECT 1 FROM sellos_movimientos sm
                LEFT JOIN "Citas" c_prev ON c_prev.id = sm.cita_id
                WHERE sm.cliente_id = p_cliente_id
                  AND sm.business_id = p_business_id
                  AND sm.motivo = 'cita'::sello_motivo_enum
                  AND (sm.cita_id = v_target_cita_id OR COALESCE(c_prev.fecha::date, sm.created_at::date) = v_cita.fecha::date)
              ) THEN
                PERFORM public.fn_registrar_sello_visita(v_target_cita_id, p_business_id);
              END IF;

              -- Cancelar cualquier mensaje diferido pendiente en cola para este cliente
              UPDATE public.cola_mensajes_salientes cms
              SET estado = 'cancelado'
              WHERE cms.cliente_id = p_cliente_id
                AND cms.business_id = p_business_id
                AND cms.flujo IN ('club_glow_sellos', 'fidelizacion_sellos_recompensa', 'fidelizacion_recompensa')
                AND cms.estado = 'pendiente';

              SELECT * INTO v_config_sellos FROM sellos_config WHERE sellos_config.business_id = p_business_id;
              v_valor_base := COALESCE(v_config_sellos.valor_sello_base, 30);
              v_sellos_totales := COALESCE(v_config_sellos.total_sellos_roadmap, 12);
              v_expira := CASE
                WHEN COALESCE(v_config_sellos.vencimiento_sellos_meses, 0) > 0
                THEN now() + (v_config_sellos.vencimiento_sellos_meses || ' months')::interval
                ELSE NULL
              END;

              v_sellos_actuales := public.fn_sellos_activos(p_cliente_id, p_business_id);
              v_card_url := 'https://koratflow.agency/club/' || COALESCE(v_negocio.slug, v_negocio.id::text) || '?c=' || p_cliente_id;

              IF COALESCE(v_config_sellos.bienvenida_activo, true) AND v_sellos_actuales <= 1 THEN
                IF NOT EXISTS (
                  SELECT 1 FROM sellos_movimientos
                  WHERE cliente_id = p_cliente_id AND business_id = p_business_id AND motivo = 'bienvenida'::sello_motivo_enum
                ) THEN
                  INSERT INTO sellos_movimientos (
                    business_id, cliente_id, cita_id, cantidad, motivo, expira_en, total_post, created_at
                  ) VALUES (
                    p_business_id, p_cliente_id, v_target_cita_id, 1, 'bienvenida'::sello_motivo_enum, v_expira, v_sellos_actuales + 1, now()
                  );
                  v_sellos_actuales := v_sellos_actuales + 1;
                  v_es_primera_vez := true;
                END IF;
              END IF;

              v_sellos_despues := LEAST(v_sellos_totales, GREATEST(1, v_sellos_actuales));

              SELECT spg.codigo_canje, r.nombre, r.hito_sello
              INTO v_codigo_premio, v_premio_proximo, v_sello_premio_desbloqueado
              FROM sellos_premios_ganados spg
              JOIN sellos_roadmap r ON r.id = spg.roadmap_id
              WHERE spg.cliente_id = p_cliente_id
                AND spg.business_id = p_business_id
                AND (spg.cita_id = v_target_cita_id OR spg.ganado_en >= now() - interval '24 hours')
                AND spg.estado = 'pendiente'
              ORDER BY spg.id DESC
              LIMIT 1;

              IF v_codigo_premio IS NOT NULL AND v_codigo_premio <> '' AND v_sellos_despues = v_sello_premio_desbloqueado THEN
                v_es_premio_desbloqueado := true;
              END IF;

              SELECT r.id, r.hito_sello, r.nombre INTO v_proximo_hito
              FROM sellos_roadmap r
              WHERE r.business_id = p_business_id AND r.activo = true AND r.hito_sello > v_sellos_despues
              ORDER BY r.hito_sello ASC LIMIT 1;

              v_sellos_faltantes := GREATEST(0, COALESCE(v_proximo_hito.hito_sello, v_sellos_totales) - v_sellos_despues);
              IF NOT v_es_premio_desbloqueado THEN
                v_premio_proximo := COALESCE(v_proximo_hito.nombre, 'Regalo VIP Sorpresa');
              END IF;

              SELECT r.nombre INTO v_premio_1
              FROM sellos_roadmap r
              WHERE r.business_id = p_business_id AND r.activo = true
              ORDER BY r.hito_sello ASC LIMIT 1;
              v_premio_1 := COALESCE(v_premio_1, 'Regalo VIP');

              IF v_es_premio_desbloqueado THEN
                SELECT elem->>'imagen_url' INTO v_media_url_out
                FROM nilah_config nc,
                     jsonb_array_elements(nc.tarjetas_club_glow) elem
                WHERE (elem->>'sello')::int = v_sello_premio_desbloqueado
                  AND elem->>'imagen_url' IS NOT NULL
                  AND length(trim(elem->>'imagen_url')) > 10
                LIMIT 1;

                SELECT elem INTO v_copy_item
                FROM nilah_config nc,
                     jsonb_array_elements(nc.copys_calificacion_sellos) elem
                WHERE (elem->>'sello')::int = v_sello_premio_desbloqueado
                LIMIT 1;

                IF v_copy_item IS NOT NULL AND (v_copy_item->>'copy') IS NOT NULL THEN
                  v_mensaje_saliente := v_copy_item->>'copy';
                  v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{link_tarjeta}', v_card_url);
                  v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{premio_proximo}', v_premio_proximo);
                  v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{premio_1}', v_premio_1);
                  v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{codigo}', COALESCE(v_codigo_premio, ''));
                  v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{nombre}', v_primer_nombre);
                  v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{salon}', v_negocio.nombre);
                  v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{nombre_negocio}', v_negocio.nombre);
                ELSE
                  v_mensaje_saliente := '¡Sii, nos alegra un montón que te haya encantado! Y las buenas noticias siguen... 👑🥂' || E'\n\n' ||
                                        '¡Acabas de desbloquear tu premio del Club Glow! 🎉' || E'\n' ||
                                        '🎁 *Regalo:* ' || v_premio_proximo || E'\n' ||
                                        '🎟️ *Código de canje:* *' || COALESCE(v_codigo_premio, '') || '*' || E'\n' ||
                                        '*(Solo muéstralo en recepción en tu próxima visita)*.' || E'\n\n' ||
                                        '📲 *Tu premio ya quedó guardado en tu tarjeta digital:*' || E'\n' || v_card_url;
                END IF;
              ELSE
                SELECT elem INTO v_copy_item
                FROM nilah_config nc,
                     jsonb_array_elements(nc.copys_calificacion_sellos) elem
                WHERE (elem->>'sello')::int = v_sellos_despues
                LIMIT 1;

                IF v_copy_item IS NOT NULL AND (v_copy_item->>'copy') IS NOT NULL THEN
                  v_mensaje_saliente := v_copy_item->>'copy';
                  v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{link_tarjeta}', v_card_url);
                  v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{premio_proximo}', v_premio_proximo);
                  v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{premio_1}', v_premio_1);
                  v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{codigo}', COALESCE(v_codigo_premio, ''));
                  v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{nombre}', v_primer_nombre);
                  v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{salon}', v_negocio.nombre);
                  v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{nombre_negocio}', v_negocio.nombre);
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
              FROM public.\"Premios\" p WHERE p.business_id = p_business_id AND p.activo = true
              ORDER BY p.costo_puntos ASC LIMIT 1;
              IF FOUND THEN
                  v_costo_premio := v_premio.costo_puntos;
                  v_nombre_premio := v_premio.nombre;
              END IF;

              v_puntos_actuales := COALESCE(v_cliente.puntos_acumulados, 0) + v_puntos_ganados;
              UPDATE public.\"Clientes\" SET puntos_acumulados = v_puntos_actuales WHERE \"Clientes\".id = p_cliente_id;

              v_mensaje_saliente := '¡Muchísimas gracias por tu calificación! 🙌💖' || E'\n\n' ||
                                    'Sumaste *+' || v_puntos_ganados || ' pts* con tu visita. Llevas *' || v_puntos_actuales || '/' || v_costo_premio || ' pts* para canjear tu *' || v_nombre_premio || '* 🎁.' || E'\n\n' ||
                                    '📲 *Mira tu balance aquí:*' || E'\n' || v_card_url;
            END IF;
        END IF;

        -- 1. Registrar PRIMERO en tabla mensajes
        INSERT INTO public.mensajes (
            business_id, cliente_id, contenido, direccion, tipo, estado, campana_origen, url_archivo
        ) VALUES (
            p_business_id, p_cliente_id, v_mensaje_saliente, 'saliente',
            CASE WHEN v_media_url_out IS NOT NULL THEN 'imagen' ELSE 'texto' END,
            'enviado',
            CASE WHEN v_nota IN ('1', '2', '3') THEN 'atencion_queja_feedback' ELSE 'recompensa_fidelizacion' END,
            v_media_url_out
        );

        -- 2. Actualizar calificación en la cita y en todas las citas completadas del mismo día de esa clienta
        UPDATE public.\"Citas\"
        SET calificacion = v_nota,
            feedback_cliente = p_contenido_mensaje,
            fecha_feedback = CURRENT_DATE,
            calificacion_origen = 'whatsapp'
        WHERE cliente_id = p_cliente_id
          AND business_id = p_business_id
          AND (
            id = v_target_cita_id
            OR (fecha::date = v_cita.fecha::date AND estado ILIKE 'completada')
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
            v_media_url_out AS media_url;
    END;
$function$;

-- 3. Blindaje estricto de trigger trg_fn_procesar_feedback_fidelizacion
CREATE OR REPLACE FUNCTION public.trg_fn_procesar_feedback_fidelizacion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_res record;
    v_target_cliente_id bigint := NULL;
    v_target_phone text;
    v_raw_phone text;
    v_clean_content text;
    v_norm_content text;
    v_evo_phone text;
    v_http_res extensions.http_response;
    v_digit text;
    v_is_lid boolean := false;
    v_queja_cita_id bigint;
    v_cita_pendiente record;
    v_inst record;
    v_repregunta_msg text;
    v_repregunta_enviada boolean := false;
    v_nivel text;
    v_intencion_nota boolean := false;
    v_pendientes_count int := 0;
BEGIN
    BEGIN
        v_clean_content := TRIM(NEW.contenido);
        v_norm_content := LOWER(UNACCENT(v_clean_content));

        SELECT telefono, REGEXP_REPLACE(telefono, '[^0-9]', '', 'g')
        INTO v_raw_phone, v_target_phone
        FROM public."Clientes"
        WHERE id = NEW.cliente_id;

        IF (v_target_phone IS NOT NULL AND length(v_target_phone) > 13)
           OR COALESCE(v_raw_phone, '') ILIKE '%@lid%' THEN
            v_is_lid := true;
        END IF;

        IF NEW.direccion = 'entrante' THEN
            SELECT k.nivel, k.nota INTO v_nivel, v_digit
            FROM public.fn_clasificar_respuesta_calificacion(v_clean_content) k;
            v_intencion_nota := (v_nivel = 'B');
        END IF;

        IF NEW.direccion = 'entrante' AND v_digit IS NOT NULL THEN

            -- Paso 1: Coincidencia directa por ID o teléfono real
            SELECT c.cliente_id INTO v_target_cliente_id
            FROM public."Citas" c
            JOIN public."Clientes" cl ON cl.id = c.cliente_id
            WHERE c.business_id = NEW.business_id
              AND c.encuesta_enviada = true
              AND (c.calificacion IS NULL OR c.calificacion = '0' OR c.calificacion = '')
              AND (c.calificacion_origen IS NULL OR c.calificacion_origen IN ('solo_si_responde', 'recompensa_previa_enviada'))
              AND COALESCE(c.fecha_encuesta_enviada, c.fecha_completada, c.fecha, c.created_at) >= NOW() - INTERVAL '48 hours'
              AND (
                  c.cliente_id = NEW.cliente_id
                  OR (
                      v_target_phone IS NOT NULL
                      AND (
                          REGEXP_REPLACE(cl.telefono, '[^0-9]', '', 'g') = v_target_phone
                          OR (
                              NOT v_is_lid
                              AND length(v_target_phone) BETWEEN 9 AND 13
                              AND length(REGEXP_REPLACE(cl.telefono, '[^0-9]', '', 'g')) BETWEEN 9 AND 13
                              AND RIGHT(REGEXP_REPLACE(cl.telefono, '[^0-9]', '', 'g'), 9) = RIGHT(v_target_phone, 9)
                          )
                          OR (
                              v_is_lid
                              AND cl.whatsapp_lid IS NOT NULL
                              AND REGEXP_REPLACE(cl.whatsapp_lid, '[^0-9]', '', 'g') = v_target_phone
                          )
                      )
                  )
              )
            ORDER BY c.id DESC
            LIMIT 1;

            -- Pasos de rescate SOLO si el remitente es un identificador LID
            IF v_target_cliente_id IS NULL AND v_is_lid THEN
                SELECT c.cliente_id INTO v_target_cliente_id
                FROM public."Citas" c
                JOIN public."Clientes" cl ON cl.id = c.cliente_id
                JOIN public."Clientes" sender ON sender.id = NEW.cliente_id
                WHERE c.business_id = NEW.business_id
                  AND c.encuesta_enviada = true
                  AND (c.calificacion IS NULL OR c.calificacion = '0' OR c.calificacion = '')
                  AND (c.calificacion_origen IS NULL OR c.calificacion_origen IN ('solo_si_responde', 'recompensa_previa_enviada'))
                  AND COALESCE(c.fecha_encuesta_enviada, c.fecha_completada, c.fecha, c.created_at) >= NOW() - INTERVAL '48 hours'
                  AND sender.push_name IS NOT NULL
                  AND TRIM(sender.push_name) <> ''
                  AND LOWER(TRIM(sender.push_name)) NOT IN ('cliente whatsapp', 'cliente', '.')
                  AND (
                      LOWER(TRIM(cl.nombre)) = LOWER(TRIM(sender.push_name))
                      OR LOWER(TRIM(cl.push_name)) = LOWER(TRIM(sender.push_name))
                  )
                ORDER BY c.id DESC
                LIMIT 1;
            END IF;

            IF v_target_cliente_id IS NULL AND v_is_lid THEN
                SELECT COUNT(DISTINCT c.cliente_id) INTO v_pendientes_count
                FROM public."Citas" c
                WHERE c.business_id = NEW.business_id
                  AND c.encuesta_enviada = true
                  AND (c.calificacion IS NULL OR c.calificacion = '0' OR c.calificacion = '')
                  AND (c.calificacion_origen IS NULL OR c.calificacion_origen IN ('solo_si_responde', 'recompensa_previa_enviada'))
                  AND COALESCE(c.fecha_encuesta_enviada, c.fecha_completada, c.fecha, c.created_at) >= NOW() - INTERVAL '2 hours';

                IF v_pendientes_count = 1 THEN
                    SELECT c.cliente_id INTO v_target_cliente_id
                    FROM public."Citas" c
                    WHERE c.business_id = NEW.business_id
                      AND c.encuesta_enviada = true
                      AND (c.calificacion IS NULL OR c.calificacion = '0' OR c.calificacion = '')
                      AND (c.calificacion_origen IS NULL OR c.calificacion_origen IN ('solo_si_responde', 'recompensa_previa_enviada'))
                      AND COALESCE(c.fecha_encuesta_enviada, c.fecha_completada, c.fecha, c.created_at) >= NOW() - INTERVAL '2 hours'
                    ORDER BY c.id DESC
                    LIMIT 1;
                END IF;
            END IF;

            IF v_target_cliente_id IS NOT NULL AND v_target_cliente_id <> NEW.cliente_id AND v_is_lid AND length(v_target_phone) > 13 THEN
                UPDATE public."Clientes"
                SET whatsapp_lid = COALESCE(whatsapp_lid, v_target_phone)
                WHERE id = v_target_cliente_id;

                UPDATE public.mensajes
                SET cliente_id = v_target_cliente_id
                WHERE id = NEW.id;
            END IF;

            IF v_target_cliente_id IS NOT NULL THEN
                FOR v_res IN
                    SELECT * FROM public.procesar_respuesta_calificacion_fidelizacion(
                        NEW.business_id,
                        v_target_cliente_id,
                        v_digit
                    )
                LOOP
                    IF v_res.debe_responder AND v_res.mensaje_recompensa IS NOT NULL THEN
                        v_evo_phone := v_res.telefono_cliente;

                        IF length(v_clean_content) > 2 AND v_clean_content !~ '^[1-5]$' THEN
                            UPDATE public."Citas"
                            SET feedback_cliente = v_clean_content, updated_at = now()
                            WHERE id = v_res.cita_id;
                        END IF;

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
                          OR (
                              NOT v_is_lid
                              AND length(v_target_phone) BETWEEN 9 AND 13
                              AND length(REGEXP_REPLACE(cl.telefono, '[^0-9]', '', 'g')) BETWEEN 9 AND 13
                              AND RIGHT(REGEXP_REPLACE(cl.telefono, '[^0-9]', '', 'g'), 9) = RIGHT(v_target_phone, 9)
                          )
                          OR (
                              v_is_lid
                              AND cl.whatsapp_lid IS NOT NULL
                              AND REGEXP_REPLACE(cl.whatsapp_lid, '[^0-9]', '', 'g') = v_target_phone
                          )
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

            ELSE
                SELECT c.* INTO v_cita_pendiente
                FROM public."Citas" c
                JOIN public."Clientes" cl ON cl.id = c.cliente_id
                WHERE c.business_id = NEW.business_id
                  AND c.encuesta_enviada = true
                  AND (c.calificacion IS NULL OR c.calificacion = '0' OR c.calificacion = '')
                  AND (c.calificacion_origen IS NULL OR c.calificacion_origen IN ('solo_si_responde', 'recompensa_previa_enviada'))
                  AND COALESCE(c.fecha_encuesta_enviada, c.created_at) >= NOW() - INTERVAL '24 hours'
                  AND (
                      c.cliente_id = NEW.cliente_id
                      OR (
                          v_target_phone IS NOT NULL
                          AND (
                              REGEXP_REPLACE(cl.telefono, '[^0-9]', '', 'g') = v_target_phone
                              OR (
                                  NOT v_is_lid
                                  AND length(v_target_phone) BETWEEN 9 AND 13
                                  AND length(REGEXP_REPLACE(cl.telefono, '[^0-9]', '', 'g')) BETWEEN 9 AND 13
                                  AND RIGHT(REGEXP_REPLACE(cl.telefono, '[^0-9]', '', 'g'), 9) = RIGHT(v_target_phone, 9)
                              )
                              OR (
                                  v_is_lid
                                  AND cl.whatsapp_lid IS NOT NULL
                                  AND REGEXP_REPLACE(cl.whatsapp_lid, '[^0-9]', '', 'g') = v_target_phone
                              )
                          )
                      )
                  )
                ORDER BY c.id DESC
                LIMIT 1;

                IF v_cita_pendiente.id IS NOT NULL AND v_intencion_nota THEN
                    SELECT EXISTS (
                        SELECT 1 FROM public.mensajes m
                        WHERE m.cliente_id = v_cita_pendiente.cliente_id
                          AND m.business_id = NEW.business_id
                          AND m.campana_origen = 'repregunta_calificacion'
                          AND m.created_at >= NOW() - INTERVAL '24 hours'
                    ) INTO v_repregunta_enviada;

                    IF NOT v_repregunta_enviada THEN
                        SELECT ie.instance_name, ie.api_key INTO v_inst
                        FROM public.instancias_evolution ie
                        WHERE ie.business_id = NEW.business_id AND ie.status = 'conectado'
                        LIMIT 1;

                        IF v_inst.instance_name IS NOT NULL THEN
                            v_repregunta_msg := 'Para que el sistema pueda sumarte tus sellitos a tu tarjeta digital, ¿del *1 al 5* cuánto le pondrías a tu atención de hoy? (Porfis responde solo con el numerito, ej: *5*) 👇';

                            INSERT INTO public.calificacion_decision_log (business_id, cliente_id, contenido, nivel, decision)
                            VALUES (NEW.business_id, NEW.cliente_id, left(v_clean_content, 300), 'B', 'repregunta_enviada');

                            INSERT INTO public.mensajes (
                                business_id, cliente_id, contenido, direccion, tipo, estado, campana_origen
                            ) VALUES (
                                NEW.business_id, v_cita_pendiente.cliente_id, v_repregunta_msg, 'saliente', 'texto', 'enviado', 'repregunta_calificacion'
                            );

                            PERFORM extensions.http((
                                'POST',
                                'https://evo.koratflow.agency/message/sendText/' || v_inst.instance_name,
                                ARRAY[
                                    extensions.http_header('apikey', v_inst.api_key),
                                    extensions.http_header('Content-Type', 'application/json')
                                ],
                                'application/json',
                                jsonb_build_object(
                                    'number', COALESCE(
                                        CASE WHEN NOT v_is_lid THEN v_target_phone ELSE NULL END,
                                        (SELECT REGEXP_REPLACE(telefono, '[^0-9]', '', 'g') FROM public."Clientes" WHERE id = v_cita_pendiente.cliente_id)
                                    ),
                                    'text', v_repregunta_msg,
                                    'linkPreview', false
                                )::text
                            )::extensions.http_request);
                        END IF;
                    END IF;
                END IF;

            END IF;
        END IF;

    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Error en trg_fn_procesar_feedback_fidelizacion: %', SQLERRM;
    END;

    RETURN NEW;
END;
$function$;

-- 4. Blindaje en trg_fn_cita_calificada a 18 horas
CREATE OR REPLACE FUNCTION public.trg_fn_cita_calificada()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
    DECLARE
      v_score int;
      v_cliente record;
    BEGIN
      IF NEW.calificacion IS NOT NULL AND (OLD.calificacion IS DISTINCT FROM NEW.calificacion) THEN
        IF EXISTS (
          SELECT 1 FROM public.mensajes
          WHERE cliente_id = NEW.cliente_id
            AND campana_origen IN ('recompensa_fidelizacion', 'fidelizacion_recompensa', 'fidelizacion_sellos_recompensa', 'club_glow_sellos', 'atencion_queja_feedback', 'fidelizacion_queja')
            AND created_at > now() - interval '18 hours'
        ) OR EXISTS (
          SELECT 1 FROM public.cola_mensajes_salientes
          WHERE cliente_id = NEW.cliente_id
            AND flujo IN ('fidelizacion_recompensa', 'fidelizacion_sellos_recompensa', 'club_glow_sellos', 'fidelizacion_queja')
            AND estado IN ('pendiente', 'procesando', 'enviado')
            AND created_at > now() - interval '18 hours'
        ) THEN
          RETURN NEW;
        END IF;

        v_score := (REGEXP_REPLACE(NEW.calificacion, '[^0-9]', '', 'g'))::int;
        IF v_score BETWEEN 1 AND 5 THEN
          SELECT telefono INTO v_cliente FROM "Clientes" WHERE id = NEW.cliente_id;
          PERFORM fn_procesar_calificacion_cliente(
            COALESCE(v_cliente.telefono, '000000000'),
            v_score,
            NEW.feedback_cliente,
            NEW.id
          );
        END IF;
      END IF;

      RETURN NEW;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Aviso en trg_fn_cita_calificada: %', SQLERRM;
      RETURN NEW;
    END;
$function$;

-- 5. Blindaje en procesar_encuestas_omitidas
CREATE OR REPLACE FUNCTION public.procesar_encuestas_omitidas(p_horas_espera numeric DEFAULT 3, p_dry_run boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
    DECLARE
      v_c record; v_r record; v_enc int := 0; v_lista jsonb := '[]'::jsonb; v_delay int;
      v_vigente_desde CONSTANT timestamptz := '2026-10-29 17:00:00-05';
    BEGIN
      FOR v_c IN
        SELECT DISTINCT ON (c.business_id, c.cliente_id)
               c.business_id, c.cliente_id, c.id AS cita_id, c.fecha_encuesta_enviada, n.nombre AS salon
        FROM public."Citas" c
        JOIN public.negocios n ON n.id = c.business_id AND n.activo = true
        WHERE c.encuesta_enviada = true
          AND (c.calificacion IS NULL OR c.calificacion IN ('', '0'))
          AND (c.calificacion_origen IS NULL OR c.calificacion_origen NOT IN ('omitida_sellos', 'manual_superadmin', 'solo_si_responde', 'recompensa_previa_enviada', 'whatsapp'))
          AND c.fecha_encuesta_enviada >= v_vigente_desde
          AND c.fecha_encuesta_enviada >= now() - interval '48 hours'
          AND c.fecha_encuesta_enviada <= now() - (p_horas_espera * interval '1 hour')
          AND COALESCE(n.modo_fidelizacion, 'sellos') IN ('sellos', 'ambos')
          AND COALESCE((n.recursos_saas->'modulos'->'club_glow'->>'activo')::boolean, true) = true
          AND (now() AT TIME ZONE COALESCE(n.timezone, 'America/Lima'))::time BETWEEN '07:00' AND '22:00'
          AND NOT EXISTS (
            SELECT 1 FROM public.mensajes m
            WHERE m.cliente_id = c.cliente_id AND m.business_id = c.business_id
              AND m.created_at > now() - interval '30 minutes'
          )
          AND NOT EXISTS (
            SELECT 1 FROM public.mensajes m2
            WHERE m2.cliente_id = c.cliente_id AND m2.business_id = c.business_id
              AND m2.campana_origen IN ('recompensa_fidelizacion', 'atencion_queja_feedback', 'fidelizacion_recompensa', 'fidelizacion_queja', 'club_glow_sellos', 'fidelizacion_sellos_recompensa')
              AND m2.created_at >= (now() - interval '18 hours')
          )
          AND NOT EXISTS (
            SELECT 1 FROM public.cola_mensajes_salientes q
            WHERE q.cliente_id = c.cliente_id AND q.business_id = c.business_id
              AND q.flujo IN ('fidelizacion_recompensa', 'fidelizacion_queja', 'fidelizacion_sellos_recompensa', 'club_glow_sellos')
              AND q.estado IN ('pendiente', 'procesando', 'enviado')
              AND q.created_at >= (now() - interval '18 hours')
          )
        ORDER BY c.business_id, c.cliente_id, c.fecha DESC, c.id DESC
      LOOP
        IF p_dry_run THEN
          v_lista := v_lista || jsonb_build_object('salon', v_c.salon, 'cliente_id', v_c.cliente_id, 'cita_id', v_c.cita_id, 'encuesta_enviada', v_c.fecha_encuesta_enviada);
          CONTINUE;
        END IF;

        BEGIN
          FOR v_r IN SELECT * FROM public.procesar_sellos_encuesta_omitida(v_c.business_id, v_c.cliente_id) LOOP
            IF v_r.r_debe_responder AND v_r.r_mensaje IS NOT NULL AND v_r.r_instance_name IS NOT NULL THEN
              v_delay := (public.calcular_delay_escritura_humana(v_r.r_mensaje) * 1000)::integer;
              INSERT INTO public.cola_mensajes_salientes (
                business_id, cliente_id, cita_id, telefono, flujo, mensaje, media_url, media_type,
                delay_ms, instance_name, api_key, estado, proximo_intento_at, metadata
              ) VALUES (
                v_c.business_id, v_c.cliente_id, v_r.r_cita_id, v_r.r_telefono, 'fidelizacion_recompensa', v_r.r_mensaje,
                v_r.r_media_url, CASE WHEN v_r.r_media_url IS NOT NULL THEN 'image' ELSE NULL END,
                v_delay, v_r.r_instance_name, v_r.r_api_key, 'pendiente', now(),
                jsonb_build_object('tipo', 'respuesta_calificacion_omitida', 'nota', 'omitida', 'cita_id', v_r.r_cita_id)
              );
              INSERT INTO public.calificacion_decision_log (business_id, cliente_id, contenido, nivel, decision)
              VALUES (v_c.business_id, v_c.cliente_id, NULL, 'OMITIDA', 'sellos_enviados_sin_nota');
              v_enc := v_enc + 1;
            END IF;
          END LOOP;
        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING 'procesar_encuestas_omitidas cliente %: %', v_c.cliente_id, SQLERRM;
        END;
      END LOOP;

      RETURN jsonb_build_object('ok', true, 'dry_run', p_dry_run, 'encolados', v_enc, 'candidatos', v_lista);
    END;
$function$;
