const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();

  const sql = `
CREATE OR REPLACE FUNCTION fn_procesar_calificacion_cliente(
  p_telefono text,
  p_calificacion int,
  p_feedback text DEFAULT NULL,
  p_cita_id bigint DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cita record;
  v_cliente record;
  v_negocio record;
  v_modo text := 'sellos';
  v_telefono_limpio text;
  v_plantilla text;
  v_mensaje_saliente text;
  v_sellos_info jsonb;
  v_proximo_hito record;
  v_sellos_totales int := 8;
  v_sellos_actuales int := 0;
  v_sellos_faltantes int := 0;
  v_card_url text;
  v_programado_para timestamptz;
  v_instancia record;
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
    RETURN jsonb_build_object('ok', false, 'error', 'No se encontró cita completada para este teléfono');
  END IF;

  -- 2. Guardar calificación, feedback y asegurar staff_id en Citas
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

  -- 3. BIFURCACIÓN DE LÓGICA DE NEGOCIO SEGÚN CALIFICACIÓN
  IF p_calificacion <= 3 THEN
    -- A) CASO QUEJA (1, 2 o 3 ⭐):
    -- Pausar bot para atención humana
    UPDATE "Clientes"
    SET bot_pausado = true,
        bot_pausado_hasta = now() + interval '24 hours'
    WHERE id = v_cita.cliente_id;

    -- Obtener plantilla de queja empática inmediata
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

    -- Enviar de inmediato el mensaje de queja
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

    -- PROGRAMAR ENVÍO DEL RESUMEN DE SELLOS A LAS 24 HORAS (Reconciliación)
    IF v_modo IN ('sellos', 'ambos') THEN
      v_programado_para := now() + interval '24 hours';
      v_sellos_actuales := fn_sellos_activos(v_cita.cliente_id, v_cita.business_id);
      
      SELECT total_sellos_roadmap INTO v_sellos_totales
      FROM sellos_config WHERE business_id = v_cita.business_id;
      v_sellos_totales := COALESCE(v_sellos_totales, 8);

      SELECT hito_sello, nombre INTO v_proximo_hito
      FROM sellos_roadmap
      WHERE business_id = v_cita.business_id AND activo = true AND hito_sello > v_sellos_actuales
      ORDER BY hito_sello ASC LIMIT 1;

      v_sellos_faltantes := GREATEST(1, COALESCE(v_proximo_hito.hito_sello, v_sellos_totales) - v_sellos_actuales);
      v_card_url := 'https://app.koratflow.com/club/' || COALESCE(v_negocio.slug, v_negocio.id::text) || '?c=' || v_cita.cliente_id;

      SELECT contenido INTO v_plantilla
      FROM plantillas_automatizacion
      WHERE business_id = v_cita.business_id
        AND flujo = 'fidelizacion_sellos_recompensa'
        AND activo = true
      LIMIT 1;

      IF v_plantilla IS NULL THEN
        v_mensaje_saliente := 'Hola ' || COALESCE(v_cliente.nombre, 'amiga') || ' 🌸, para nosotros tu experiencia es lo primero. Queremos confirmarte que los sellos de tu visita ya fueron acreditados a tu tarjeta VIP (' || v_sellos_actuales || ' de ' || v_sellos_totales || '). Tu opinión nos ayuda a mejorar y esperamos consentirte pronto ✨';
      ELSE
        v_mensaje_saliente := REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(v_plantilla,
          '{nombre_cliente}', COALESCE(v_cliente.nombre, 'amiga')),
          '{nombre_negocio}', COALESCE(v_negocio.nombre, 'nuestro salón')),
          '{sellos_ganados}', '+1'),
          '{sellos_actuales}', v_sellos_actuales::text),
          '{sellos_totales_meta}', v_sellos_totales::text),
          '{sellos_faltantes}', v_sellos_faltantes::text);
        v_mensaje_saliente := REPLACE(REPLACE(v_mensaje_saliente,
          '{premio_proximo}', COALESCE(v_proximo_hito.nombre, 'Regalo VIP')),
          '{link_tarjeta}', v_card_url);
      END IF;

      IF v_instancia.instance_name IS NOT NULL THEN
        INSERT INTO cola_mensajes_salientes (
          business_id, cliente_id, cita_id, telefono, flujo, mensaje,
          instance_name, api_key, estado, proximo_intento_at, created_at,
          metadata
        ) VALUES (
          v_cita.business_id, v_cita.cliente_id, v_cita.id, v_telefono_limpio,
          'fidelizacion_sellos_recompensa_reconciliacion', v_mensaje_saliente,
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
      
      SELECT total_sellos_roadmap INTO v_sellos_totales
      FROM sellos_config WHERE business_id = v_cita.business_id;
      v_sellos_totales := COALESCE(v_sellos_totales, 8);

      SELECT hito_sello, nombre INTO v_proximo_hito
      FROM sellos_roadmap
      WHERE business_id = v_cita.business_id AND activo = true AND hito_sello > v_sellos_actuales
      ORDER BY hito_sello ASC LIMIT 1;

      v_sellos_faltantes := GREATEST(1, COALESCE(v_proximo_hito.hito_sello, v_sellos_totales) - v_sellos_actuales);
      v_card_url := 'https://app.koratflow.com/club/' || COALESCE(v_negocio.slug, v_negocio.id::text) || '?c=' || v_cita.cliente_id;

      SELECT contenido INTO v_plantilla
      FROM plantillas_automatizacion
      WHERE business_id = v_cita.business_id
        AND flujo = 'fidelizacion_sellos_recompensa'
        AND activo = true
      LIMIT 1;

      IF v_plantilla IS NULL THEN
        v_mensaje_saliente := '¡Muchas gracias por tu visita a ' || COALESCE(v_negocio.nombre, 'nuestro salón') || ', ' || COALESCE(v_cliente.nombre, 'reina') || '! 👑✨ Llevas ' || v_sellos_actuales || ' de ' || v_sellos_totales || ' sellos. Te faltan ' || v_sellos_faltantes || ' para: ' || COALESCE(v_proximo_hito.nombre, 'Premio VIP') || '. 📲 Mira tu tarjeta: ' || v_card_url;
      ELSE
        v_mensaje_saliente := REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(v_plantilla,
          '{nombre_cliente}', COALESCE(v_cliente.nombre, 'amiga')),
          '{nombre_negocio}', COALESCE(v_negocio.nombre, 'nuestro salón')),
          '{sellos_ganados}', '+1'),
          '{sellos_actuales}', v_sellos_actuales::text),
          '{sellos_totales_meta}', v_sellos_totales::text),
          '{sellos_faltantes}', v_sellos_faltantes::text);
        v_mensaje_saliente := REPLACE(REPLACE(v_mensaje_saliente,
          '{premio_proximo}', COALESCE(v_proximo_hito.nombre, 'Regalo VIP')),
          '{link_tarjeta}', v_card_url);
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
$$;
  `;

  await client.query(sql);
  console.log('✓ RPC fn_procesar_calificacion_cliente creada con éxito');

  await client.end();
}

run().catch(console.error);
