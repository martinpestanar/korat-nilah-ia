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
    v_es_premio_desbloqueado boolean := false;
    v_sello_premio_desbloqueado int := 4;
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
        UPDATE public."Clientes"
        SET bot_pausado = true,
            bot_pausado_razon = 'Calificación de ' || v_nota || ' estrellas en cita #' || v_target_cita_id || ' — Atención humana requerida',
            bot_pausado_hasta = NOW() + INTERVAL '24 hours'
        WHERE "Clientes".id = p_cliente_id;

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

          -- Consultar sellos
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

          -- 1. DETECTAR SI EN ESTA CITA SE GANÓ UN PREMIO (sellos_premios_ganados)
          SELECT spg.codigo_canje, r.nombre, r.hito_sello
          INTO v_codigo_premio, v_premio_proximo, v_sello_premio_desbloqueado
          FROM sellos_premios_ganados spg
          JOIN sellos_roadmap r ON r.id = spg.roadmap_id
          WHERE spg.cliente_id = p_cliente_id
            AND spg.business_id = p_business_id
            AND (spg.cita_id = v_target_cita_id OR spg.ganado_en >= now() - interval '10 minutes')
          ORDER BY spg.id DESC
          LIMIT 1;

          IF v_codigo_premio IS NOT NULL AND v_codigo_premio <> '' THEN
            v_es_premio_desbloqueado := true;
          END IF;

          -- Obtener próximo hito futuro si no es premio
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

          -- SI SE DESBLOQUEÓ UN PREMIO EN ESTA CITA:
          IF v_es_premio_desbloqueado THEN
            -- BUSCAR IMAGEN REAL DE LA TARJETA DEL PREMIO (4, 8 o 12)
            SELECT elem->>'imagen_url' INTO v_media_url_out
            FROM nilah_config nc,
                 jsonb_array_elements(nc.tarjetas_club_glow) elem
            WHERE (elem->>'sello')::int = v_sello_premio_desbloqueado
              AND elem->>'imagen_url' IS NOT NULL
              AND length(trim(elem->>'imagen_url')) > 10
            LIMIT 1;

            -- BUSCAR COPY DE CELEBRACIÓN DE ESE PREMIO (ej: Sello 4)
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
              v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{salon}', v_negocio.nombre);
              v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{nombre_negocio}', v_negocio.nombre);
            ELSE
              v_mensaje_saliente := '¡Sii, nos alegra un montón que te haya encantado! Y las buenas noticias siguen... 👑🥂' || E'\n\n' ||
                                    '¡Acabas de desbloquear tu primer premio del Club Glow! 🎉' || E'\n' ||
                                    '🎁 *Regalo:* ' || v_premio_proximo || E'\n' ||
                                    '🎟️ *Código de canje:* `' || COALESCE(v_codigo_premio, '') || '`' || E'\n' ||
                                    '*(Solo muéstralo en recepción en tu próxima visita)*.' || E'\n\n' ||
                                    '📲 *Tu premio ya quedó guardado en tu tarjeta digital:*' || E'\n' || v_card_url;
            END IF;

          -- CASO REGULAR: NO SE DESBLOQUEÓ PREMIO
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
        CASE WHEN v_media_url_out IS NOT NULL THEN 'imagen' ELSE 'texto' END,
        'enviado',
        CASE WHEN v_nota IN ('1', '2', '3') THEN 'atencion_queja_feedback' ELSE 'recompensa_fidelizacion' END,
        v_media_url_out
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
