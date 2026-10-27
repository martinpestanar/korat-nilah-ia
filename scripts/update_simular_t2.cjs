const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();

  const sql = `
CREATE OR REPLACE FUNCTION simular_respuesta_tiempo2_fidelizacion(
  p_business_id uuid,
  p_telefono_cliente text,
  p_nota text,
  p_nombre_cliente text DEFAULT 'Valeria',
  p_servicio text DEFAULT 'Lifting de Pestañas',
  p_es_simulacion boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_negocio record;
    v_primer_nombre text;
    v_mensaje_saliente text;
    v_clean_phone text;
    v_raw_phone text;
    v_clean_nota text;
    v_inst record;
    v_cliente_id bigint := NULL;
    v_modo text := 'sellos';
    -- Sellos variables
    v_sellos_totales int := 8;
    v_sellos_actuales int := 0;
    v_sellos_faltantes int := 0;
    v_proximo_hito record;
    v_card_url text;
    v_plantilla text;
    -- Puntos fallback
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

    v_modo := COALESCE(v_negocio.modo_fidelizacion, 'sellos');

    v_raw_phone := REGEXP_REPLACE(p_telefono_cliente, '[^0-9]', '', 'g');
    IF LENGTH(v_raw_phone) = 9 THEN
        v_clean_phone := '51' || v_raw_phone;
    ELSE
        v_clean_phone := v_raw_phone;
    END IF;

    v_clean_nota := TRIM(REGEXP_REPLACE(p_nota, '[^0-9]', '', 'g'));
    IF v_clean_nota NOT IN ('1','2','3','4','5') THEN
        v_clean_nota := '5';
    END IF;

    v_primer_nombre := public.extraer_primer_nombre(p_nombre_cliente);

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

    -- SI EL NEGOCIO OPERA EN MODO SELLOS:
    IF v_modo IN ('sellos', 'ambos') THEN
      v_sellos_actuales := COALESCE(public.fn_sellos_activos(v_cliente_id, p_business_id), 0);
      
      SELECT total_sellos_roadmap INTO v_sellos_totales
      FROM sellos_config WHERE business_id = p_business_id;
      v_sellos_totales := COALESCE(v_sellos_totales, 8);

      SELECT hito_sello, nombre INTO v_proximo_hito
      FROM sellos_roadmap
      WHERE business_id = p_business_id AND activo = true AND hito_sello > v_sellos_actuales
      ORDER BY hito_sello ASC LIMIT 1;

      v_sellos_faltantes := GREATEST(1, COALESCE(v_proximo_hito.hito_sello, v_sellos_totales) - v_sellos_actuales);
      v_card_url := 'https://app.koratflow.com/club/' || COALESCE(v_negocio.slug, v_negocio.id::text) || '?c=' || COALESCE(v_cliente_id::text, 'demo');

      IF v_clean_nota IN ('1', '2', '3') THEN
        SELECT contenido INTO v_plantilla
        FROM plantillas_automatizacion
        WHERE business_id = p_business_id AND flujo = 'fidelizacion_queja' AND activo = true
        LIMIT 1;

        IF v_plantilla IS NOT NULL THEN
          v_mensaje_saliente := REPLACE(REPLACE(v_plantilla, '{nombre_cliente}', v_primer_nombre), '{nombre_negocio}', v_negocio.nombre);
        ELSE
          v_mensaje_saliente := '¡Ay, ' || v_primer_nombre || '! 🥺 Nos duele mucho saber que no saliste 100% feliz con tu atención.' || E'\n\n' ||
                                'En *' || v_negocio.nombre || '* nos importa de corazón que te sientas hermosa y cuidada. ¿Nos cuentas qué pasó con tu *' || p_servicio || '*? Queremos ayudarte y corregirlo ya mismo 💕';
        END IF;
      ELSE
        SELECT contenido INTO v_plantilla
        FROM plantillas_automatizacion
        WHERE business_id = p_business_id AND flujo = 'fidelizacion_sellos_recompensa' AND activo = true
        LIMIT 1;

        IF v_plantilla IS NOT NULL THEN
          v_mensaje_saliente := REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(v_plantilla,
            '{nombre_cliente}', v_primer_nombre),
            '{nombre_negocio}', v_negocio.nombre),
            '{sellos_ganados}', '+1'),
            '{sellos_actuales}', (v_sellos_actuales + 1)::text),
            '{sellos_totales_meta}', v_sellos_totales::text),
            '{sellos_faltantes}', GREATEST(0, v_sellos_faltantes - 1)::text);
          v_mensaje_saliente := REPLACE(REPLACE(v_mensaje_saliente,
            '{premio_proximo}', COALESCE(v_proximo_hito.nombre, 'Regalo VIP')),
            '{link_tarjeta}', v_card_url);
        ELSE
          v_mensaje_saliente := '¡Qué bella, muchísimas gracias ' || v_primer_nombre || '! 👑💖' || E'\n\n' ||
                                'Sumaste *+1 sello* hoy y ya tienes *' || (v_sellos_actuales + 1) || ' de ' || v_sellos_totales || ' sellos* en tu Club Glow.' || E'\n' ||
                                '🎯 Te faltan solo *' || GREATEST(0, v_sellos_faltantes - 1) || ' sellos* para tu premio: *' || COALESCE(v_proximo_hito.nombre, 'Regalo VIP') || '* 🎁.' || E'\n\n' ||
                                '📲 Mira tu tarjeta en vivo: ' || v_card_url;
        END IF;
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

      IF v_clean_nota IN ('1', '2', '3') THEN
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
        'nota', v_clean_nota,
        'modo', v_modo,
        'sellos_actuales', v_sellos_actuales,
        'tipo', CASE WHEN v_clean_nota IN ('1','2','3') THEN 'queja' ELSE 'recompensa' END,
        'telefono', v_clean_phone
    );
END;
$$;
  `;

  await client.query(sql);
  console.log('✓ RPC simular_respuesta_tiempo2_fidelizacion actualizada con soporte dual (sellos / puntos)');

  await client.end();
}

run().catch(console.error);
