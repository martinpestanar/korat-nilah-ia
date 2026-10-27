-- ============================================================================
-- Sincronización Completa de Sello de Bienvenida (Club Glow)
-- 1. fn_registrar_sello_visita:
--    Si v_config.bienvenida_activo es true y el cliente NO tiene movimientos previos,
--    se inserta un sello extra de bienvenida ('bienvenida'::sello_motivo_enum),
--    por lo que su total inicial pasa a 2 sellos (1 bienvenida + 1 servicio).
--    Además, si es su primera visita con bienvenida activa, usa la plantilla de bienvenida
--    (o v_config.whatsapp_template) donde se explica claramente que empieza con 2 sellos.
--
-- 2. fn_procesar_calificacion_cliente:
--    Sincronizado de la misma manera: si es el primer movimiento del cliente y
--    v_config.bienvenida_activo = true, otorga el sello de bienvenida + el de la cita,
--    llegando a 2 sellos, y despacha la plantilla de bienvenida con 2 sellos.
-- ============================================================================

-- A. Actualizar fn_registrar_sello_visita
CREATE OR REPLACE FUNCTION public.fn_registrar_sello_visita(
  p_cita_id bigint,
  p_business_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_config              sellos_config%ROWTYPE;
  v_negocio             record;
  v_cita                record;
  v_sobrante            numeric(10,2) := 0;
  v_monto_efectivo      numeric(10,2);
  v_sellos_raw          numeric;
  v_sellos_nuevos       int;
  v_sellos_antes        int;
  v_sellos_despues      int;
  v_expira              timestamptz;
  v_movimiento_id       bigint;
  v_hitos               sellos_roadmap[];
  v_hito                sellos_roadmap%ROWTYPE;
  v_premio_ganado       jsonb := 'null'::jsonb;
  v_codigo_canje        text;
  v_roadmap_id          uuid;
  v_msg_tipo            text;
  v_sellos_para_proximo int;
  v_proximo_hito        sellos_roadmap%ROWTYPE;
  v_texto_mensaje       text;
  v_card_url            text;
  v_media_url           text;
  v_tarjetas_globales   jsonb;
  v_tarjeta_hito        jsonb;
  -- Add-ons flags
  v_referidor_id        bigint;
  v_referidor           record;
  v_referidos_activo    boolean := false;
  v_dias_muertos_activo boolean := false;
  v_ticket_alto_activo  boolean := false;
  v_msg_referidor       text;
  v_card_url_referidor  text;
  v_dia_semana          int;
  -- Delay orgánico psicológico (25 a 35 minutos)
  v_delay_minutos       int := 30;
  v_programado_para     timestamptz;
  v_salon_slug          text;
  v_primer_nombre       text;
  v_es_primera_vez      boolean := false;
  i                     int;
BEGIN
  SELECT * INTO v_config FROM sellos_config WHERE business_id = p_business_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'El negocio no tiene configuracion de sellos activa');
  END IF;

  SELECT id, nombre, slug, instance_name, api_key, recursos_saas INTO v_negocio 
  FROM negocios 
  WHERE id = p_business_id;

  SELECT c.*, cl.nombre AS cliente_nombre, cl.telefono AS cliente_telefono,
         COALESCE(c.referido_por_cliente_id, cl.referido_por_cliente_id) AS ref_id
  INTO v_cita
  FROM "Citas" c
  JOIN "Clientes" cl ON cl.id = c.cliente_id
  WHERE c.id = p_cita_id AND c.business_id = p_business_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Cita no encontrada');
  END IF;

  IF v_cita.estado != 'Completada' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'La cita debe estar en estado Completada');
  END IF;

  IF EXISTS (
    SELECT 1 FROM sellos_movimientos
    WHERE cita_id = p_cita_id AND motivo = 'cita'
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Esta cita ya tiene sellos registrados');
  END IF;

  -- Normalizar primer nombre de la clienta
  v_primer_nombre := public.extraer_primer_nombre(v_cita.cliente_nombre);
  IF v_primer_nombre IS NULL 
     OR LENGTH(v_primer_nombre) < 2 
     OR LOWER(v_primer_nombre) IN ('cliente', 'usuario', 'lead', 'null', 'undefined', 'prospecto', 'amigo', 'amiga') THEN
    v_primer_nombre := 'Bella';
  ELSE
    v_primer_nombre := INITCAP(LOWER(v_primer_nombre));
  END IF;

  -- 1. Calcular sellos base por gasto y saldo sobrante
  SELECT COALESCE(monto, 0) INTO v_sobrante
  FROM sellos_sobrante
  WHERE cliente_id = v_cita.cliente_id AND business_id = p_business_id;
  v_sobrante := COALESCE(v_sobrante, 0);

  IF COALESCE(v_cita.precio, 0) <= 0 AND v_cita.servicio IS NOT NULL THEN
    SELECT COALESCE(s.precio, 0) INTO v_monto_efectivo
    FROM servicios s
    WHERE s.business_id = p_business_id
      AND (s.nombre ILIKE '%' || v_cita.servicio || '%' OR v_cita.servicio ILIKE '%' || s.nombre || '%')
    LIMIT 1;
    v_monto_efectivo := COALESCE(v_monto_efectivo, 0) + v_sobrante;
  ELSE
    v_monto_efectivo := COALESCE(v_cita.precio, 0) + v_sobrante;
  END IF;
  v_sellos_raw     := FLOOR(v_monto_efectivo / v_config.valor_sello_base);
  v_sellos_nuevos  := LEAST(v_sellos_raw::int, v_config.max_sellos_por_visita);

  -- Calcular el sobrante que queda guardado en la alcancía
  v_sobrante := v_monto_efectivo - (v_sellos_nuevos * v_config.valor_sello_base);
  INSERT INTO sellos_sobrante (business_id, cliente_id, monto, updated_at)
  VALUES (p_business_id, v_cita.cliente_id, v_sobrante, now())
  ON CONFLICT (business_id, cliente_id)
  DO UPDATE SET monto = EXCLUDED.monto, updated_at = now();

  IF v_sellos_nuevos <= 0 THEN
    RETURN jsonb_build_object(
      'ok', true,
      'sellos_nuevos', 0,
      'sobrante_guardado', v_sobrante,
      'mensaje', 'El monto no alcanzó el ticket mínimo. Saldo acumulado en alcancía para su próxima visita.'
    );
  END IF;

  -- 2. ACELERADOR: Días Muertos (Martes = 2, Miércoles = 3)
  v_dias_muertos_activo := COALESCE(
    (v_negocio.recursos_saas->'sellos_addons'->>'dias_muertos_doble')::boolean,
    false
  );
  v_dia_semana := EXTRACT(DOW FROM COALESCE(v_cita.fecha, CURRENT_DATE))::int;

  IF v_dias_muertos_activo AND v_dia_semana IN (2, 3) THEN
    v_sellos_nuevos := LEAST(v_sellos_nuevos * 2, v_config.max_sellos_por_visita * 2);
  END IF;

  -- 3. ACELERADOR: Ticket Alto
  v_ticket_alto_activo := COALESCE(
    (v_negocio.recursos_saas->'sellos_addons'->>'ticket_alto_boost')::boolean,
    false
  );
  IF v_ticket_alto_activo AND COALESCE(v_cita.precio, 0) >= (v_config.valor_sello_base * 2.5) THEN
    v_sellos_nuevos := v_sellos_nuevos + 1;
  END IF;

  v_sellos_antes := fn_sellos_activos(v_cita.cliente_id, p_business_id);
  v_expira       := now() + (v_config.vencimiento_sellos_meses || ' months')::interval;

  -- =========================================================================
  -- ⭐ BONO BIENVENIDA (SI ESTÁ ACTIVO EN AJUSTES Y ES PRIMERA VISITA) ⭐
  -- =========================================================================
  IF COALESCE(v_config.bienvenida_activo, true) AND v_sellos_antes = 0 THEN
    IF NOT EXISTS (
      SELECT 1 FROM sellos_movimientos 
      WHERE cliente_id = v_cita.cliente_id AND business_id = p_business_id
    ) THEN
      v_es_primera_vez := true;
      INSERT INTO sellos_movimientos (
        business_id, cliente_id, cita_id,
        cantidad, motivo, sobrante_monto, expira_en,
        total_post, notas
      ) VALUES (
        p_business_id, v_cita.cliente_id, NULL,
        1, 'bienvenida'::sello_motivo_enum, 0, v_expira,
        1, 'Sello de Bienvenida por unirse al Club Glow'
      );
      v_sellos_antes := 1;
    END IF;
  END IF;

  INSERT INTO sellos_movimientos (
    business_id, cliente_id, cita_id,
    cantidad, motivo, sobrante_monto, expira_en,
    total_post, notas
  )
  VALUES (
    p_business_id, v_cita.cliente_id, p_cita_id,
    v_sellos_nuevos, 'cita', v_sobrante, v_expira,
    v_sellos_antes + v_sellos_nuevos,
    'Cita completada: ' || COALESCE(v_cita.servicio, '') ||
    CASE WHEN v_dias_muertos_activo AND v_dia_semana IN (2, 3) THEN ' [Promo x2 Martes/Miércoles]' ELSE '' END ||
    CASE WHEN v_ticket_alto_activo AND COALESCE(v_cita.precio, 0) >= (v_config.valor_sello_base * 2.5) THEN ' [Bono Ticket Alto]' ELSE '' END
  )
  RETURNING id INTO v_movimiento_id;

  v_sellos_despues := v_sellos_antes + v_sellos_nuevos;

  -- 4. ACELERADOR: Programa de Referidas 1+1
  v_referidor_id := v_cita.ref_id;
  v_referidos_activo := COALESCE(
    (v_negocio.recursos_saas->'sellos_addons'->>'referidos_sellos')::boolean,
    false
  );

  IF v_referidos_activo AND v_referidor_id IS NOT NULL AND v_referidor_id != v_cita.cliente_id THEN
    IF NOT EXISTS (
      SELECT 1 FROM sellos_movimientos
      WHERE cliente_id = v_cita.cliente_id AND motivo = 'referida_recibida'
    ) THEN
      INSERT INTO sellos_movimientos (
        business_id, cliente_id, cita_id,
        cantidad, motivo, sobrante_monto, expira_en,
        total_post, notas
      ) VALUES (
        p_business_id, v_cita.cliente_id, p_cita_id,
        1, 'referida_recibida', 0, v_expira,
        v_sellos_despues + 1, 'Bono bienvenida referida por cliente #' || v_referidor_id
      );
      v_sellos_despues := v_sellos_despues + 1;

      SELECT cl.id, cl.nombre, cl.telefono,
             fn_sellos_activos(cl.id, p_business_id) AS sellos_actuales
      INTO v_referidor
      FROM "Clientes" cl
      WHERE cl.id = v_referidor_id AND cl.business_id = p_business_id;

      IF FOUND THEN
        INSERT INTO sellos_movimientos (
          business_id, cliente_id, cita_id,
          cantidad, motivo, sobrante_monto, expira_en,
          total_post, notas
        ) VALUES (
          p_business_id, v_referidor.id, p_cita_id,
          1, 'referida_enviada', 0,
          now() + (v_config.vencimiento_sellos_meses || ' months')::interval,
          v_referidor.sellos_actuales + 1,
          'Tu amiga ' || v_primer_nombre || ' completó su primera cita'
        );

        v_card_url_referidor := 'https://koratflow.agency/club/' ||
          COALESCE(v_negocio.slug, v_negocio.id::text) || '?c=' || v_referidor.id;

        v_msg_referidor := '🎁 *¡Tu amiga ' || v_primer_nombre || ' se atendió en ' ||
          COALESCE(v_negocio.nombre, 'el salón') || '!*' || chr(10) || chr(10) ||
          'Como regalo de agradecimiento, sumaste *+1 sello* en tu tarjeta Club Glow 👑' || chr(10) ||
          'Total acumulado: *' || (v_referidor.sellos_actuales + 1) || ' / ' || v_config.total_sellos_roadmap || ' sellos*' || chr(10) || chr(10) ||
          '📲 *Mira tu tarjeta actualizada:*' || chr(10) || v_card_url_referidor;

        IF v_referidor.telefono IS NOT NULL AND LENGTH(REGEXP_REPLACE(v_referidor.telefono, '[^0-9]', '', 'g')) >= 8 THEN
          INSERT INTO cola_mensajes_salientes (
            business_id, cliente_id, cita_id, telefono, flujo, mensaje,
            instance_name, api_key, estado, proximo_intento_at, created_at, metadata
          ) VALUES (
            p_business_id, v_referidor.id, p_cita_id,
            REGEXP_REPLACE(v_referidor.telefono, '[^0-9]', '', 'g'),
            'club_glow_referida_premio', v_msg_referidor,
            v_negocio.instance_name, v_negocio.api_key, 'pendiente',
            now() + interval '3 minutes', now(),
            jsonb_build_object('tipo', 'premio_referidor', 'amiga_nombre', v_primer_nombre)
          );
        END IF;
      END IF;
    END IF;
  END IF;

  -- 5. Detectar si desbloqueó algún Hito
  SELECT ARRAY_AGG(r ORDER BY r.hito_sello ASC) INTO v_hitos
  FROM sellos_roadmap r
  WHERE r.business_id = p_business_id
    AND r.activo = true
    AND r.hito_sello > v_sellos_antes
    AND r.hito_sello <= v_sellos_despues;

  IF v_hitos IS NOT NULL AND array_length(v_hitos, 1) > 0 THEN
    v_hito := v_hitos[array_length(v_hitos, 1)];
    v_codigo_canje := 'GLOW-' || UPPER(SUBSTRING(MD5(p_cita_id::text || clock_timestamp()::text) FROM 1 FOR 6));

    INSERT INTO sellos_premios_ganados (
      business_id, cliente_id, roadmap_id, cita_id,
      codigo_canje, estado, ganado_en, expira_en
    )
    VALUES (
      p_business_id, v_cita.cliente_id, v_hito.id, p_cita_id,
      v_codigo_canje, 'pendiente', now(),
      now() + (v_config.vencimiento_premio_dias || ' days')::interval
    )
    RETURNING id INTO v_roadmap_id;

    v_premio_ganado := jsonb_build_object(
      'id',           v_roadmap_id,
      'roadmap_id',   v_hito.id,
      'nombre',       v_hito.nombre,
      'descripcion',  v_hito.descripcion,
      'hito_sello',   v_hito.hito_sello,
      'codigo_canje', v_codigo_canje,
      'expira_en',    now() + (v_config.vencimiento_premio_dias || ' days')::interval
    );

    v_media_url := v_hito.imagen_url;
    v_msg_tipo := 'premio_desbloqueado';
  END IF;

  -- 6. Calcular próximo hito y url de tarjeta
  v_salon_slug := COALESCE(v_negocio.slug, v_negocio.id::text);
  v_card_url := 'https://koratflow.agency/club/' || v_salon_slug || '?c=' || v_cita.cliente_id;

  SELECT * INTO v_proximo_hito
  FROM sellos_roadmap
  WHERE business_id = p_business_id
    AND activo = true
    AND hito_sello > v_sellos_despues
  ORDER BY hito_sello ASC
  LIMIT 1;

  IF v_proximo_hito.id IS NULL THEN
    SELECT * INTO v_proximo_hito
    FROM sellos_roadmap
    WHERE business_id = p_business_id AND activo = true
    ORDER BY hito_sello ASC
    LIMIT 1;
  END IF;

  v_sellos_para_proximo := CASE
    WHEN v_proximo_hito.id IS NOT NULL THEN GREATEST(0, v_proximo_hito.hito_sello - v_sellos_despues)
    ELSE 0
  END;

  IF v_msg_tipo IS NULL THEN
    IF v_sellos_para_proximo = 1 THEN
      v_msg_tipo := 'a_1_sello';
    ELSE
      v_msg_tipo := 'visita_regular';
    END IF;
  END IF;

  -- 7. Redacción del Mensaje WhatsApp
  IF v_es_primera_vez AND v_config.whatsapp_template IS NOT NULL AND v_config.whatsapp_template <> '' THEN
    -- USAR LA PLANTILLA CONFIGURADA EN EL SUBMÓDULO AJUSTES DE CLUB GLOW
    v_texto_mensaje := v_config.whatsapp_template;
    v_texto_mensaje := REPLACE(v_texto_mensaje, '{nombre}', v_primer_nombre);
    v_texto_mensaje := REPLACE(v_texto_mensaje, '{salon}', COALESCE(v_negocio.nombre, 'nuestro salón'));
    v_texto_mensaje := REPLACE(v_texto_mensaje, '{sello_actual}', v_sellos_despues::text);
    v_texto_mensaje := REPLACE(v_texto_mensaje, '{premio_1}', COALESCE(v_proximo_hito.nombre, 'Regalo VIP'));
    v_texto_mensaje := REPLACE(v_texto_mensaje, '{premio_proximo}', COALESCE(v_proximo_hito.nombre, 'Regalo VIP'));
    v_texto_mensaje := REPLACE(v_texto_mensaje, '{link_tarjeta}', v_card_url);
  ELSE
    SELECT tarjetas_club_glow INTO v_tarjetas_globales FROM nilah_config LIMIT 1;
    IF v_tarjetas_globales IS NOT NULL AND jsonb_typeof(v_tarjetas_globales) = 'array' THEN
      SELECT elem INTO v_tarjeta_hito
      FROM jsonb_array_elements(v_tarjetas_globales) elem
      WHERE (elem->>'sello')::int = LEAST(12, v_sellos_despues)
      LIMIT 1;

      IF v_tarjeta_hito IS NOT NULL AND (v_tarjeta_hito->>'copy_sugerido') IS NOT NULL THEN
        v_texto_mensaje := v_tarjeta_hito->>'copy_sugerido';
        v_texto_mensaje := REPLACE(v_texto_mensaje, '{nombre}', v_primer_nombre);
        v_texto_mensaje := REPLACE(v_texto_mensaje, '{salon}', COALESCE(v_negocio.nombre, 'nuestro salón'));
        v_texto_mensaje := REPLACE(v_texto_mensaje, '{sello_actual}', v_sellos_despues::text);
        v_texto_mensaje := REPLACE(v_texto_mensaje, '{premio_proximo}', COALESCE(v_proximo_hito.nombre, 'Regalo VIP'));
        v_texto_mensaje := REPLACE(v_texto_mensaje, '{codigo}', COALESCE(v_codigo_canje, ''));
        v_texto_mensaje := REPLACE(v_texto_mensaje, '{link_tarjeta}', v_card_url);
      END IF;
    END IF;
  END IF;

  -- Fallback si no había copy configurado
  IF v_texto_mensaje IS NULL THEN
    IF v_premio_ganado != 'null'::jsonb THEN
      v_texto_mensaje := '👑 *¡Felicidades ' || v_primer_nombre || '! Has desbloqueado un premio en ' || COALESCE(v_negocio.nombre, 'nuestro salón') || '!*' || chr(10) || chr(10) ||
        '✨ *Premio Desbloqueado:* ' || (v_premio_ganado->>'nombre') || chr(10) ||
        '🎟️ *Código de Canje:* `' || (v_premio_ganado->>'codigo_canje') || '`' || chr(10) ||
        '🌟 Tienes ' || v_sellos_despues || ' sellos acumulados en tu Club Glow.' || chr(10) || chr(10) ||
        '📲 *Mira tu tarjeta digital aquí:*' || chr(10) || v_card_url;
    ELSIF v_sellos_para_proximo = 1 THEN
      v_texto_mensaje := '✨ *¡Estás a solo 1 sello de tu regalo, ' || v_primer_nombre || '!*' || chr(10) || chr(10) ||
        'Sumaste +' || v_sellos_nuevos || ' sellos hoy y ya tienes *' || v_sellos_despues || ' sellos* en tu Club Glow.' || chr(10) ||
        '🎁 Tu próximo premio es: *' || COALESCE(v_proximo_hito.nombre, 'Regalo VIP') || '*' || chr(10) || chr(10) ||
        '📲 *Tu tarjeta en vivo:* ' || v_card_url;
    ELSE
      v_texto_mensaje := '✨ *¡Gracias por visitarnos hoy en ' || COALESCE(v_negocio.nombre, 'nuestro salón') || ', ' || v_primer_nombre || '!*' || chr(10) || chr(10) ||
        'Sumaste +' || v_sellos_nuevos || ' sello(s) a tu membresía *Club Glow* 👑' || chr(10) ||
        'Total acumulado: *' || v_sellos_despues || ' / ' || v_config.total_sellos_roadmap || ' sellos*' || chr(10) ||
        CASE WHEN v_proximo_hito.id IS NOT NULL THEN 'Te faltan solo ' || v_sellos_para_proximo || ' sellos para: *' || v_proximo_hito.nombre || '*' || chr(10) ELSE '' END || chr(10) ||
        '📲 *Revisa tu progreso en vivo:* ' || v_card_url;
    END IF;
  END IF;

  v_programado_para := now() + (v_delay_minutos || ' minutes')::interval;

  IF v_cita.cliente_telefono IS NOT NULL AND LENGTH(REGEXP_REPLACE(v_cita.cliente_telefono, '[^0-9]', '', 'g')) >= 8 THEN
    INSERT INTO cola_mensajes_salientes (
      business_id, cliente_id, cita_id, telefono, flujo, mensaje,
      media_url, media_type, instance_name, api_key, estado,
      proximo_intento_at, created_at, metadata
    )
    VALUES (
      p_business_id, v_cita.cliente_id, p_cita_id,
      REGEXP_REPLACE(v_cita.cliente_telefono, '[^0-9]', '', 'g'),
      'club_glow_sellos', v_texto_mensaje, v_media_url,
      CASE WHEN v_media_url IS NOT NULL THEN 'image' ELSE NULL END,
      v_negocio.instance_name, v_negocio.api_key, 'pendiente',
      v_programado_para, now(),
      jsonb_build_object(
        'sellos_nuevos',         v_sellos_nuevos,
        'sellos_total',          v_sellos_despues,
        'sellos_roadmap',        v_config.total_sellos_roadmap,
        'sellos_para_proximo',   v_sellos_para_proximo,
        'proximo_premio_nombre', v_proximo_hito.nombre,
        'premio_ganado',         v_premio_ganado,
        'tipo_mensaje',          v_msg_tipo,
        'card_url',              v_card_url,
        'delay_minutos',         v_delay_minutos,
        'programado_para',       v_programado_para
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'ok',               true,
    'sellos_nuevos',    v_sellos_nuevos,
    'sellos_antes',     v_sellos_antes,
    'sellos_despues',   v_sellos_despues,
    'sellos_roadmap',   v_config.total_sellos_roadmap,
    'sobrante_guardado', v_sobrante,
    'premio_ganado',    v_premio_ganado,
    'mensaje_encolado', true,
    'tipo_mensaje',     v_msg_tipo,
    'programado_para',  v_programado_para
  );
END;
$function$;

-- B. Actualizar fn_procesar_calificacion_cliente
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
  v_config record;
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
  v_primer_nombre text;
  v_premio_texto text;
  v_es_primera_vez boolean := false;
  v_expira timestamptz;
BEGIN
  v_telefono_limpio := REGEXP_REPLACE(p_telefono, '[^0-9]', '', 'g');

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

  UPDATE "Citas"
  SET calificacion = p_calificacion::text,
      feedback_cliente = COALESCE(p_feedback, feedback_cliente)
  WHERE id = v_cita.id;

  SELECT * INTO v_negocio FROM negocios WHERE id = v_cita.business_id;
  SELECT * INTO v_cliente FROM "Clientes" WHERE id = v_cita.cliente_id;
  SELECT * INTO v_config FROM sellos_config WHERE business_id = v_cita.business_id;
  v_modo := COALESCE(v_negocio.modo_fidelizacion, 'sellos');
  v_expira := now() + (COALESCE(v_config.vencimiento_sellos_meses, 6) || ' months')::interval;

  SELECT instance_name, api_key INTO v_instancia
  FROM instancias_evolution
  WHERE business_id = v_cita.business_id AND status = 'conectado'
  LIMIT 1;

  v_primer_nombre := public.extraer_primer_nombre(v_cliente.nombre);
  IF v_primer_nombre IS NULL 
     OR LENGTH(v_primer_nombre) < 2 
     OR LOWER(v_primer_nombre) IN ('cliente', 'usuario', 'lead', 'null', 'undefined', 'prospecto', 'amigo', 'amiga') THEN
    v_primer_nombre := 'Bella';
  ELSE
    v_primer_nombre := INITCAP(LOWER(v_primer_nombre));
  END IF;

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

  IF p_calificacion <= 3 THEN
    -- A) QUEJA (1, 2 o 3 ⭐):
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
      v_mensaje_saliente := REPLACE(REPLACE(v_plantilla, '{nombre_cliente}', v_primer_nombre), '{nombre_negocio}', COALESCE(v_negocio.nombre, 'nuestro salón'));
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

      -- Si es primera visita y tiene bienvenida activa
      IF COALESCE(v_config.bienvenida_activo, true) AND v_sellos_actuales = 0 THEN
        IF NOT EXISTS (
          SELECT 1 FROM sellos_movimientos 
          WHERE cliente_id = v_cita.cliente_id AND business_id = v_cita.business_id
        ) THEN
          v_es_primera_vez := true;
          INSERT INTO sellos_movimientos (
            business_id, cliente_id, cita_id,
            cantidad, motivo, sobrante_monto, expira_en,
            total_post, notas
          ) VALUES (
            v_cita.business_id, v_cita.cliente_id, NULL,
            1, 'bienvenida'::sello_motivo_enum, 0, v_expira,
            1, 'Sello de Bienvenida por unirse al Club Glow'
          );
          v_sellos_actuales := 1;
        END IF;
      END IF;

      v_sellos_despues := v_sellos_actuales + 1;

      IF NOT EXISTS (
        SELECT 1 FROM sellos_movimientos 
        WHERE cita_id = v_cita.id AND motivo = 'cita'
      ) THEN
        INSERT INTO sellos_movimientos (
          business_id, cliente_id, cita_id, cantidad, motivo, total_post, created_at
        ) VALUES (
          v_cita.business_id, v_cita.cliente_id, v_cita.id, 1, 'cita'::sello_motivo_enum, v_sellos_despues, now()
        );
      END IF;

      v_sellos_totales := COALESCE(v_config.total_sellos_roadmap, 12);
      v_card_url := 'https://koratflow.agency/club/' || COALESCE(v_negocio.slug, v_negocio.id::text) || '?c=' || v_cita.cliente_id;

      SELECT id, hito_sello, nombre INTO v_proximo_hito
      FROM sellos_roadmap
      WHERE business_id = v_cita.business_id AND activo = true AND hito_sello >= v_sellos_despues
      ORDER BY hito_sello ASC LIMIT 1;

      IF v_proximo_hito.nombre IS NULL THEN
        SELECT id, hito_sello, nombre INTO v_proximo_hito
        FROM sellos_roadmap
        WHERE business_id = v_cita.business_id AND activo = true
        ORDER BY hito_sello ASC LIMIT 1;
      END IF;

      v_sellos_faltantes := GREATEST(0, COALESCE(v_proximo_hito.hito_sello, v_sellos_totales) - v_sellos_despues);
      v_premio_texto := COALESCE(v_proximo_hito.nombre, 'Regalo VIP Especial');

      v_mensaje_saliente := 'Hola ' || v_primer_nombre || ' 💕 Te compartimos tu tarjeta del Club Glow de ' || COALESCE(v_negocio.nombre, 'nuestro salón') || '. Ya tienes ' || v_sellos_despues || ' de ' || v_sellos_totales || ' sellos acumulados. Te faltan ' || v_sellos_faltantes || ' sellos para: ' || v_premio_texto || '. 📲 Míralos aquí: ' || v_card_url;

      IF v_instancia.instance_name IS NOT NULL THEN
        INSERT INTO cola_mensajes_salientes (
          business_id, cliente_id, cita_id, telefono, flujo, mensaje,
          instance_name, api_key, estado, proximo_intento_at, created_at,
          metadata
        ) VALUES (
          v_cita.business_id, v_cita.cliente_id, v_cita.id, v_telefono_limpio,
          'fidelizacion_sellos_recompensa', v_mensaje_saliente,
          v_instancia.instance_name, v_instancia.api_key, 'pendiente',
          v_programado_para, now(),
          jsonb_build_object('calificacion', p_calificacion, 'staff_id', v_cita.staff_id, 'programado_24h', true)
        );
      END IF;
    END IF;

  ELSE
    -- B) SATISFACCIÓN (4 o 5 ⭐):
    IF v_modo IN ('sellos', 'ambos') THEN
      v_sellos_actuales := fn_sellos_activos(v_cita.cliente_id, v_cita.business_id);

      -- ⭐ DETECCIÓN Y ASIGNACIÓN DE SELLO DE BIENVENIDA ⭐
      IF COALESCE(v_config.bienvenida_activo, true) AND v_sellos_actuales = 0 THEN
        IF NOT EXISTS (
          SELECT 1 FROM sellos_movimientos 
          WHERE cliente_id = v_cita.cliente_id AND business_id = v_cita.business_id
        ) THEN
          v_es_primera_vez := true;
          INSERT INTO sellos_movimientos (
            business_id, cliente_id, cita_id,
            cantidad, motivo, sobrante_monto, expira_en,
            total_post, notas
          ) VALUES (
            v_cita.business_id, v_cita.cliente_id, NULL,
            1, 'bienvenida'::sello_motivo_enum, 0, v_expira,
            1, 'Sello de Bienvenida por unirse al Club Glow'
          );
          v_sellos_actuales := 1;
        END IF;
      END IF;

      v_sellos_despues := v_sellos_actuales + 1;

      IF NOT EXISTS (
        SELECT 1 FROM sellos_movimientos 
        WHERE cita_id = v_cita.id AND motivo = 'cita'
      ) THEN
        INSERT INTO sellos_movimientos (
          business_id, cliente_id, cita_id, cantidad, motivo, total_post, created_at
        ) VALUES (
          v_cita.business_id, v_cita.cliente_id, v_cita.id, 1, 'cita'::sello_motivo_enum, v_sellos_despues, now()
        );
      END IF;

      v_sellos_totales := COALESCE(v_config.total_sellos_roadmap, 12);

      SELECT id, hito_sello, nombre INTO v_proximo_hito
      FROM sellos_roadmap
      WHERE business_id = v_cita.business_id AND activo = true AND hito_sello >= v_sellos_despues
      ORDER BY hito_sello ASC LIMIT 1;

      IF v_proximo_hito.nombre IS NULL THEN
        SELECT id, hito_sello, nombre INTO v_proximo_hito
        FROM sellos_roadmap
        WHERE business_id = v_cita.business_id AND activo = true
        ORDER BY hito_sello ASC LIMIT 1;
      END IF;

      v_sellos_faltantes := GREATEST(0, COALESCE(v_proximo_hito.hito_sello, v_sellos_totales) - v_sellos_despues);
      v_premio_texto := COALESCE(v_proximo_hito.nombre, 'Regalo VIP Especial');
      v_card_url := 'https://koratflow.agency/club/' || COALESCE(v_negocio.slug, v_negocio.id::text) || '?c=' || v_cita.cliente_id;

      IF v_proximo_hito.hito_sello IS NOT NULL AND v_sellos_despues = v_proximo_hito.hito_sello THEN
        v_codigo_premio := 'GLOW-' || UPPER(SUBSTRING(MD5(RANDOM()::text || clock_timestamp()::text) FROM 1 FOR 6));
        INSERT INTO sellos_premios_ganados (
          business_id, cliente_id, roadmap_id, codigo_canje, estado, ganado_en, expira_en
        ) VALUES (
          v_cita.business_id, v_cita.cliente_id, v_proximo_hito.id, v_codigo_premio, 'pendiente'::estado_canje_enum, now(), now() + interval '60 days'
        );
      END IF;

      -- =========================================================================
      -- PLANTILLA SI ES PRIMERA VEZ (EMPIEZA CON 2 SELLOS: BIENVENIDA + CITA)
      -- =========================================================================
      IF v_es_primera_vez AND v_config.whatsapp_template IS NOT NULL AND v_config.whatsapp_template <> '' THEN
        v_mensaje_saliente := v_config.whatsapp_template;
        v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{nombre}', v_primer_nombre);
        v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{nombre_cliente}', v_primer_nombre);
        v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{salon}', COALESCE(v_negocio.nombre, 'nuestro salón'));
        v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{nombre_negocio}', COALESCE(v_negocio.nombre, 'nuestro salón'));
        v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{sello_actual}', v_sellos_despues::text);
        v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{sellos_actuales}', v_sellos_despues::text);
        v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{premio_1}', v_premio_texto);
        v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{premio_proximo}', v_premio_texto);
        v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{codigo}', COALESCE(v_codigo_premio, ''));
        v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{link_tarjeta}', v_card_url);
      ELSE
        -- Tarjetas globales de nilah_config o plantilla estándar
        SELECT tarjetas_club_glow INTO v_tarjetas_globales FROM nilah_config LIMIT 1;
        IF v_tarjetas_globales IS NOT NULL AND jsonb_typeof(v_tarjetas_globales) = 'array' THEN
          SELECT elem INTO v_tarjeta_hito
          FROM jsonb_array_elements(v_tarjetas_globales) elem
          WHERE (elem->>'sello')::int = LEAST(v_sellos_despues, 12)
          LIMIT 1;
        END IF;

        IF v_tarjeta_hito IS NOT NULL AND (v_tarjeta_hito->>'copy_sugerido') IS NOT NULL THEN
          v_mensaje_saliente := v_tarjeta_hito->>'copy_sugerido';
          v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{nombre}', v_primer_nombre);
          v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{nombre_cliente}', v_primer_nombre);
          v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{salon}', COALESCE(v_negocio.nombre, 'nuestro salón'));
          v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{nombre_negocio}', COALESCE(v_negocio.nombre, 'nuestro salón'));
          v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{sello_actual}', v_sellos_despues::text);
          v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{sellos_actuales}', v_sellos_despues::text);
          v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{codigo}', COALESCE(v_codigo_premio, ''));
          v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{link_tarjeta}', v_card_url);
          v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{premio_proximo}', v_premio_texto);
        ELSE
          SELECT contenido INTO v_plantilla
          FROM plantillas_automatizacion
          WHERE business_id = v_cita.business_id
            AND flujo = 'fidelizacion_sellos_recompensa'
            AND activo = true
          LIMIT 1;

          IF v_plantilla IS NULL THEN
            v_mensaje_saliente := '¡Muchas gracias por tu visita a ' || COALESCE(v_negocio.nombre, 'nuestro salón') || ', ' || v_primer_nombre || '! 👑✨ Llevas ' || v_sellos_despues || ' de ' || v_sellos_totales || ' sellos. Te faltan ' || v_sellos_faltantes || ' para: ' || v_premio_texto || '. 📲 Mira tu tarjeta: ' || v_card_url;
          ELSE
            v_mensaje_saliente := REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(v_plantilla,
              '{nombre_cliente}', v_primer_nombre),
              '{nombre_negocio}', COALESCE(v_negocio.nombre, 'nuestro salón')),
              '{sellos_ganados}', '+1'),
              '{sellos_actuales}', v_sellos_despues::text),
              '{sellos_totales_meta}', v_sellos_totales::text),
              '{sellos_faltantes}', v_sellos_faltantes::text);
            v_mensaje_saliente := REPLACE(REPLACE(REPLACE(v_mensaje_saliente,
              '{premio_proximo}', v_premio_texto),
              '{codigo}', COALESCE(v_codigo_premio, '')),
              '{link_tarjeta}', v_card_url);
          END IF;
        END IF;
      END IF;

      -- Limpieza final de placeholders
      v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{premio_proximo}', v_premio_texto);
      v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{premio_1}', v_premio_texto);
      v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{nombre}', v_primer_nombre);
      v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{nombre_cliente}', v_primer_nombre);

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
          jsonb_build_object(
            'calificacion', p_calificacion, 
            'staff_id', v_cita.staff_id, 
            'primer_nombre', v_primer_nombre, 
            'premio_proximo', v_premio_texto,
            'es_primera_vez_bienvenida', v_es_primera_vez,
            'sellos_totales', v_sellos_despues
          )
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
    'primer_nombre', v_primer_nombre,
    'premio_proximo', v_premio_texto,
    'es_primera_vez_bienvenida', v_es_primera_vez,
    'sellos_totales', v_sellos_despues,
    'mensaje_generado', v_mensaje_saliente
  );
END;
$function$;
