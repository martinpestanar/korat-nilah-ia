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
    v_negocio record;
    v_primer_nombre text;
    v_mensaje_saliente text;
    v_clean_phone text;
    v_raw_phone text;
    v_nota_int int := 5;
    v_inst record;
    v_cliente_id bigint := NULL;
    v_modo text := 'sellos';
    v_config record;
    -- Sellos variables
    v_sellos_totales int := 12;
    v_sellos_actuales int := 0;
    v_sellos_despues int := 1;
    v_sellos_faltantes int := 0;
    v_proximo_hito record;
    v_premio_texto text;
    v_card_url text;
    v_tarjetas_pack jsonb;
    v_tarjeta_pack_item jsonb;
    v_media_url text := NULL;
    v_codigo_premio text := '';
    -- Puntos variables
    v_puntos_ganados integer := 50;
    v_puntos_actuales integer := 50;
    v_costo_premio integer := 200;
    v_nombre_premio text := 'Premio VIP';
    v_premio record;
    v_precio_servicio numeric := 0;
BEGIN
    SELECT * INTO v_negocio FROM public.negocios WHERE id = p_business_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Negocio no encontrado');
    END IF;

    SELECT * INTO v_config FROM sellos_config WHERE business_id = p_business_id;
    v_modo := COALESCE(v_negocio.modo_fidelizacion, 'sellos');

    v_raw_phone := REGEXP_REPLACE(p_telefono_cliente, '[^0-9]', '', 'g');
    IF LENGTH(v_raw_phone) = 9 THEN
        v_clean_phone := '51' || v_raw_phone;
    ELSE
        v_clean_phone := v_raw_phone;
    END IF;

    -- Extraer primer nombre limpio
    v_primer_nombre := public.extraer_primer_nombre(p_nombre_cliente);
    IF v_primer_nombre IS NULL 
       OR LENGTH(v_primer_nombre) < 2 
       OR LOWER(v_primer_nombre) IN ('cliente', 'usuario', 'lead', 'null', 'undefined', 'prospecto', 'amigo', 'amiga') THEN
      v_primer_nombre := 'Bella';
    ELSE
      v_primer_nombre := INITCAP(LOWER(v_primer_nombre));
    END IF;

    -- Buscar cliente
    SELECT id, puntos_acumulados INTO v_cliente_id, v_puntos_actuales
    FROM public."Clientes"
    WHERE business_id = p_business_id
      AND (
          REGEXP_REPLACE(telefono, '[^0-9]', '', 'g') = v_raw_phone
          OR REGEXP_REPLACE(telefono, '[^0-9]', '', 'g') = v_clean_phone
          OR (LENGTH(v_raw_phone) >= 9 AND REGEXP_REPLACE(telefono, '[^0-9]', '', 'g') LIKE '%' || RIGHT(v_raw_phone, 9))
      )
    LIMIT 1;

    -- =========================================================================
    -- ACCELERADOR TEMPORAL: FORZAR ENVÍO DE RESUMEN 24H (POST-QUEJA)
    -- =========================================================================
    IF p_forzar_24h_resumen THEN
      v_sellos_actuales := COALESCE(public.fn_sellos_activos(v_cliente_id, p_business_id), 1);
      v_sellos_totales := COALESCE(v_config.total_sellos_roadmap, 12);
      v_card_url := 'https://koratflow.agency/club/' || COALESCE(v_negocio.slug, v_negocio.id::text) || '?c=' || COALESCE(v_cliente_id::text, 'demo');

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

      v_mensaje_saliente := 'Hola ' || v_primer_nombre || ' 💕 Te compartimos tu tarjeta del Club Glow de ' || COALESCE(v_negocio.nombre, 'nuestro salón') || '. Ya tienes ' || v_sellos_actuales || ' de ' || v_sellos_totales || ' sellos acumulados. Te faltan ' || v_sellos_faltantes || ' sellos para: ' || v_premio_texto || '. 📲 Míralos aquí: ' || v_card_url;

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
                  jsonb_build_object('number', v_clean_phone, 'text', v_mensaje_saliente)::text
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

    -- MODO SELLOS CLUB GLOW
    IF v_modo IN ('sellos', 'ambos') THEN
      v_sellos_actuales := COALESCE(public.fn_sellos_activos(v_cliente_id, p_business_id), 0);
      v_sellos_despues := v_sellos_actuales + 1;
      v_sellos_totales := COALESCE(v_config.total_sellos_roadmap, 12);

      SELECT id, hito_sello, nombre INTO v_proximo_hito
      FROM sellos_roadmap
      WHERE business_id = p_business_id AND activo = true AND hito_sello >= v_sellos_despues
      ORDER BY hito_sello ASC LIMIT 1;

      IF v_proximo_hito.nombre IS NULL THEN
        SELECT id, hito_sello, nombre INTO v_proximo_hito
        FROM sellos_roadmap
        WHERE business_id = p_business_id AND activo = true
        ORDER BY hito_sello ASC LIMIT 1;
      END IF;

      v_sellos_faltantes := GREATEST(0, COALESCE(v_proximo_hito.hito_sello, v_sellos_totales) - v_sellos_despues);
      v_premio_texto := COALESCE(v_proximo_hito.nombre, 'Regalo VIP Especial');
      v_card_url := 'https://koratflow.agency/club/' || COALESCE(v_negocio.slug, v_negocio.id::text) || '?c=' || COALESCE(v_cliente_id::text, 'demo');

      IF v_nota_int <= 3 THEN
        -- CASO QUEJA (1, 2 o 3 ⭐)
        v_mensaje_saliente := 'Lamentamos mucho que tu experiencia no haya sido de 5 estrellas 😔. En ' || COALESCE(v_negocio.nombre, 'nuestro salón') || ' nos importa mucho tu satisfacción. ¿Nos podrías contar qué sucedió con tu ' || p_servicio || ' para que podamos solucionarlo? 🙏';
      ELSE
        -- CASO FELIZ (4 o 5 ⭐)
        -- Usar los copys del pack calificacion + sellos de nilah_config
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

        IF v_mensaje_saliente IS NULL THEN
          v_mensaje_saliente := '¡Muchísimas gracias por tu calificación! 💖 Sellito acreditado: ya tienes *{sellos_actuales} de {sellos_totales_meta} sellos*. Te faltan {sellos_faltantes} para: *{premio_proximo}*. 📲 Mira tu tarjeta: {link_tarjeta}';
        END IF;

        IF v_proximo_hito.hito_sello IS NOT NULL AND v_sellos_despues = v_proximo_hito.hito_sello THEN
          v_codigo_premio := 'GLOW-' || UPPER(SUBSTRING(MD5(clock_timestamp()::text) FROM 1 FOR 6));
        END IF;

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
      END IF;

    ELSE
      -- MODO PUNTOS TRADICIONAL
      SELECT COALESCE(s.precio, 50) INTO v_precio_servicio
      FROM public.servicios s
      WHERE s.business_id = p_business_id
        AND (s.nombre ILIKE '%' || p_servicio || '%' OR p_servicio ILIKE '%' || s.nombre || '%')
      LIMIT 1;
      IF v_precio_servicio <= 0 THEN v_precio_servicio := 50; END IF;
      v_puntos_ganados := ROUND(v_precio_servicio)::integer;

      SELECT p.nombre, p.costo_puntos INTO v_premio
      FROM public."Premios" p
      WHERE p.business_id = p_business_id AND p.activo = true
      ORDER BY p.costo_puntos ASC LIMIT 1;

      IF FOUND THEN
          v_costo_premio := v_premio.costo_puntos;
          v_nombre_premio := v_premio.nombre;
      END IF;

      IF v_nota_int <= 3 THEN
          v_mensaje_saliente := '¡Ay, ' || v_primer_nombre || '! 🥺 Nos duele mucho saber que no saliste 100% feliz con tu atención.' || E'\n\n' ||
                                'En *' || v_negocio.nombre || '* nos importa de corazón que te sientas hermosa y cuidada. ¿Nos cuentas qué pasó con tu *{servicio}*? Queremos ayudarte y corregirlo ya mismo 💕';
          v_mensaje_saliente := public.reemplazar_servicio_gramatical(v_mensaje_saliente, p_servicio);
      ELSE
          v_mensaje_saliente := '¡Qué bella, muchísimas gracias ' || v_primer_nombre || '! 🙌💖' || E'\n\n' ||
                                'Sumaste *+' || v_puntos_ganados || ' pts* hoy y ya tienes *' || (COALESCE(v_puntos_actuales, 0) + v_puntos_ganados) || '/' || v_costo_premio || ' pts* para canjear tu *' || v_nombre_premio || '* 🎁.' || E'\n\n' ||
                                '¡Un abrazo enorme y que tengas un lindo día! 🌸';
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
                    'text', v_mensaje_saliente
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
        'media_url', v_media_url,
        'tipo', CASE WHEN v_nota_int <= 3 THEN 'queja' ELSE 'recompensa' END,
        'telefono', v_clean_phone
    );
END;
$function$;
