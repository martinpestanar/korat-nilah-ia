-- Migración: Blindaje hermético de rutinas de Club Glow / Sellos contra salones con fidelización 'ninguno' o Club Glow inactivo

-- 1. ENCOLAR RECORDATORIO PROXIMA CITA SELLOS
CREATE OR REPLACE FUNCTION public.encolar_recordatorio_proxima_cita_sellos()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_negocio record;
  v_cliente record;
  v_encolados int := 0;
  v_mensaje text;
  v_booking_url text;
  v_card_url text;
  v_proximo_premio text;
  v_faltan_sellos int;
BEGIN
  FOR v_negocio IN
    SELECT 
      n.id, 
      n.nombre, 
      n.slug, 
      n.instance_name, 
      n.api_key, 
      n.recursos_saas
    FROM negocios n
    WHERE n.instance_name IS NOT NULL 
      AND n.api_key IS NOT NULL
      AND n.modo_fidelizacion IN ('sellos', 'ambos')
      AND n.modo_fidelizacion <> 'ninguno'
      AND COALESCE((n.recursos_saas->'modulos'->'club_glow'->>'activo')::boolean, false) IS TRUE
      AND COALESCE((n.recursos_saas->'sellos_addons'->>'proxima_cita_reminder')::boolean, (n.recursos_saas->'sellos_addons'->>'recordatorio')::boolean, false) IS TRUE
  LOOP
    v_booking_url := 'https://nilah.app/' || COALESCE(v_negocio.slug, v_negocio.id::text);

    FOR v_cliente IN
      SELECT 
        cl.id AS cliente_id,
        cl.nombre AS cliente_nombre,
        cl.telefono AS cliente_telefono,
        MAX(c.fecha) AS ultima_fecha_cita
      FROM "Clientes" cl
      JOIN "Citas" c ON c.cliente_id = cl.id AND c.business_id = v_negocio.id
      WHERE cl.business_id = v_negocio.id
        AND c.estado = 'Completada'
        AND cl.telefono IS NOT NULL
      GROUP BY cl.id, cl.nombre, cl.telefono
      HAVING MAX(c.fecha) BETWEEN (CURRENT_DATE - 21) AND (CURRENT_DATE - 14)
        AND NOT EXISTS (
          SELECT 1 FROM "Citas" cf
          WHERE cf.cliente_id = cl.id
            AND cf.business_id = v_negocio.id
            AND cf.fecha >= CURRENT_DATE
            AND cf.estado IN ('Pendiente', 'Confirmada')
        )
        AND NOT EXISTS (
          SELECT 1 FROM cola_mensajes_salientes cq
          WHERE cq.cliente_id = cl.id
            AND cq.business_id = v_negocio.id
            AND cq.flujo = 'recordatorio_proxima_cita_sellos'
            AND cq.created_at >= (NOW() - interval '20 days')
        )
    LOOP
      IF LENGTH(REGEXP_REPLACE(v_cliente.cliente_telefono, '[^0-9]', '', 'g')) < 8 THEN
        CONTINUE;
      END IF;

      v_card_url := 'https://nilah.app/club-glow/' || v_negocio.id || '?c=' || v_cliente.cliente_id;

      SELECT 
        COALESCE(r.nombre, 'Premio VIP'),
        GREATEST(1, r.hito_sello - public.fn_sellos_activos(v_cliente.cliente_id, v_negocio.id))
      INTO v_proximo_premio, v_faltan_sellos
      FROM sellos_roadmap r
      WHERE r.business_id = v_negocio.id
        AND r.activo = true
        AND r.hito_sello > public.fn_sellos_activos(v_cliente.cliente_id, v_negocio.id)
      ORDER BY r.hito_sello ASC
      LIMIT 1;

      v_mensaje := '✨ *¡Hola ' || COALESCE(v_cliente.cliente_nombre, 'bonita') || '!* Te extrañamos en ' || COALESCE(v_negocio.nombre, 'nuestro salón') || ' 💖' || chr(10) || chr(10) ||
        'Han pasado un par de semanas desde tu última visita. Recuerda que estás a solo *' || COALESCE(v_faltan_sellos, 1) || ' sello(s)* de desbloquear tu: *' || COALESCE(v_proximo_premio, 'Regalo VIP') || '* 🎁' || chr(10) || chr(10) ||
        '¿Nos vemos esta semana para renovar tu brillo y sumar tu sello?' || chr(10) || chr(10) ||
        '📅 *Reserva tu cita aquí:*' || chr(10) || v_booking_url || chr(10) || chr(10) ||
        '📲 *Ver tus sellos acumulados:* ' || v_card_url;

      INSERT INTO cola_mensajes_salientes (
        business_id,
        cliente_id,
        telefono,
        flujo,
        mensaje,
        instance_name,
        api_key,
        estado,
        created_at,
        metadata
      ) VALUES (
        v_negocio.id,
        v_cliente.cliente_id,
        REGEXP_REPLACE(v_cliente.cliente_telefono, '[^0-9]', '', 'g'),
        'recordatorio_proxima_cita_sellos',
        v_mensaje,
        v_negocio.instance_name,
        v_negocio.api_key,
        'pendiente',
        now(),
        jsonb_build_object(
          'dias_sin_visita', CURRENT_DATE - v_cliente.ultima_fecha_cita,
          'proximo_premio', v_proximo_premio,
          'faltan_sellos', v_faltan_sellos
        )
      );

      v_encolados := v_encolados + 1;
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true,
    'encolados', v_encolados,
    'fecha', CURRENT_DATE
  );
END;
$function$;


-- 2. ENCOLAR SELLOS POR VENCER
CREATE OR REPLACE FUNCTION public.encolar_sellos_por_vencer()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_negocio record;
  v_cliente record;
  v_encolados int := 0;
  v_premios_vencidos int := 0;
  v_mensaje text;
  v_card_url text;
  v_booking_url text;
BEGIN
  UPDATE sellos_premios_ganados
  SET estado = 'vencido'
  WHERE estado = 'pendiente' AND expira_en < now();
  GET DIAGNOSTICS v_premios_vencidos = ROW_COUNT;

  FOR v_negocio IN
    SELECT 
      n.id, 
      n.nombre, 
      n.slug, 
      n.instance_name, 
      n.api_key, 
      n.recursos_saas
    FROM negocios n
    WHERE n.instance_name IS NOT NULL 
      AND n.api_key IS NOT NULL
      AND n.modo_fidelizacion IN ('sellos', 'ambos')
      AND n.modo_fidelizacion <> 'ninguno'
      AND COALESCE((n.recursos_saas->'modulos'->'club_glow'->>'activo')::boolean, false) IS TRUE
      AND COALESCE((n.recursos_saas->'sellos_addons'->>'alerta_vencimiento')::boolean, (n.recursos_saas->'sellos_addons'->>'reactivacion')::boolean, false) IS TRUE
  LOOP
    v_booking_url := 'https://nilah.app/' || COALESCE(v_negocio.slug, v_negocio.id::text);

    FOR v_cliente IN
      SELECT 
        cl.id AS cliente_id,
        cl.nombre AS cliente_nombre,
        cl.telefono AS cliente_telefono,
        SUM(sm.cantidad) AS sellos_por_vencer,
        MIN(sm.expira_en) AS expira_fecha
      FROM sellos_movimientos sm
      JOIN "Clientes" cl ON cl.id = sm.cliente_id
      WHERE sm.business_id = v_negocio.id
        AND sm.cantidad > 0
        AND sm.expira_en BETWEEN now() AND (now() + interval '14 days')
        AND cl.telefono IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM cola_mensajes_salientes cq
          WHERE cq.cliente_id = cl.id
            AND cq.business_id = v_negocio.id
            AND cq.flujo = 'sello_por_vencer'
            AND cq.created_at >= (NOW() - interval '10 days')
        )
      GROUP BY cl.id, cl.nombre, cl.telefono
    LOOP
      IF LENGTH(REGEXP_REPLACE(v_cliente.cliente_telefono, '[^0-9]', '', 'g')) < 8 THEN
        CONTINUE;
      END IF;

      v_card_url := 'https://nilah.app/club-glow/' || v_negocio.id || '?c=' || v_cliente.cliente_id;

      v_mensaje := '⏰ *¡Aviso especial de ' || COALESCE(v_negocio.nombre, 'tu salón') || '!*' || chr(10) || chr(10) ||
        'Hola ' || COALESCE(v_cliente.cliente_nombre, 'bonita') || ', tienes *' || v_cliente.sellos_por_vencer || ' sello(s)* acumulados que están por vencer en los próximos 14 días.' || chr(10) || chr(10) ||
        '¡No pierdas tu avance hacia tu regalo VIP! Visítanos o agenda tu próxima cita para mantener tus sellos vigentes y consentirte 💕' || chr(10) || chr(10) ||
        '📅 *Agendar ahora:*' || chr(10) || v_booking_url || chr(10) || chr(10) ||
        '📲 *Revisar tus sellos:* ' || v_card_url;

      INSERT INTO cola_mensajes_salientes (
        business_id,
        cliente_id,
        telefono,
        flujo,
        mensaje,
        instance_name,
        api_key,
        estado,
        created_at,
        metadata
      ) VALUES (
        v_negocio.id,
        v_cliente.cliente_id,
        REGEXP_REPLACE(v_cliente.cliente_telefono, '[^0-9]', '', 'g'),
        'sello_por_vencer',
        v_mensaje,
        v_negocio.instance_name,
        v_negocio.api_key,
        'pendiente',
        now(),
        jsonb_build_object(
          'sellos_por_vencer', v_cliente.sellos_por_vencer,
          'expira_fecha', v_cliente.expira_fecha
        )
      );

      v_encolados := v_encolados + 1;
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true,
    'premios_vencidos', v_premios_vencidos,
    'encolados_aviso', v_encolados,
    'fecha', CURRENT_DATE
  );
END;
$function$;


-- 3. FN_CLUB_GLOW_RESCATE_AUSENTES
CREATE OR REPLACE FUNCTION public.fn_club_glow_rescate_ausentes()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_neg record;
  v_cli record;
  v_total_encolados int := 0;
  v_encolados_etapa1 int := 0;
  v_encolados_etapa2 int := 0;
  v_tarjetas_globales jsonb;
  v_meta_hito int;
  v_nombre_premio text;
  v_mensaje text;
  v_card_url text;
  v_expira timestamptz;
  v_slug text;
BEGIN
  SELECT tarjetas_club_glow INTO v_tarjetas_globales FROM nilah_config LIMIT 1;

  FOR v_neg IN
    SELECT 
      n.id, 
      n.nombre, 
      n.slug, 
      n.instance_name, 
      n.api_key, 
      n.recursos_saas
    FROM negocios n
    WHERE n.instance_name IS NOT NULL 
      AND n.api_key IS NOT NULL
      AND n.modo_fidelizacion IN ('sellos', 'ambos')
      AND n.modo_fidelizacion <> 'ninguno'
      AND COALESCE((n.recursos_saas->'modulos'->'club_glow'->>'activo')::boolean, false) IS TRUE
      AND COALESCE((n.recursos_saas->'sellos_addons'->>'rescate_ausentes')::boolean, (n.recursos_saas->'sellos_addons'->>'iman_rescate')::boolean, false) IS TRUE
  LOOP
    v_slug := COALESCE(v_neg.slug, v_neg.id::text);
    v_expira := now() + interval '6 months';

    FOR v_cli IN
      SELECT 
        cl.id AS cliente_id,
        cl.nombre AS cliente_nombre,
        cl.telefono AS cliente_telefono,
        public.fn_sellos_activos(cl.id, v_neg.id) AS sellos_actuales,
        DATE_PART('day', now() - MAX(c.fecha))::int AS dias_desde_ultima_cita
      FROM "Clientes" cl
      JOIN "Citas" c ON c.cliente_id = cl.id AND c.business_id = v_neg.id
      WHERE cl.business_id = v_neg.id
        AND c.estado = 'Completada'
        AND cl.telefono IS NOT NULL
      GROUP BY cl.id, cl.nombre, cl.telefono
      HAVING DATE_PART('day', now() - MAX(c.fecha))::int BETWEEN 25 AND 55
        AND NOT EXISTS (
          SELECT 1 FROM "Citas" cf
          WHERE cf.cliente_id = cl.id
            AND cf.business_id = v_neg.id
            AND cf.fecha >= CURRENT_DATE
            AND cf.estado IN ('Pendiente', 'Confirmada')
        )
    LOOP
      IF LENGTH(REGEXP_REPLACE(v_cli.cliente_telefono, '[^0-9]', '', 'g')) < 8 THEN
        CONTINUE;
      END IF;

      v_card_url := 'https://koratflow.agency/club/' || v_slug || '?c=' || v_cli.cliente_id;

      -- ETAPA 1: DÍA 25 (Bono 2X)
      IF v_cli.dias_desde_ultima_cita BETWEEN 25 AND 35 THEN
        IF EXISTS (
          SELECT 1 FROM cola_mensajes_salientes cq
          WHERE cq.cliente_id = v_cli.cliente_id
            AND cq.business_id = v_neg.id
            AND cq.flujo IN ('club_glow_rescate_etapa1', 'sellos_rescate_25d')
            AND cq.created_at >= (NOW() - interval '30 days')
        ) THEN
          CONTINUE;
        END IF;

        SELECT r.hito_sello, r.nombre INTO v_meta_hito, v_nombre_premio
        FROM sellos_roadmap r
        WHERE r.business_id = v_neg.id AND r.activo = true AND r.hito_sello > v_cli.sellos_actuales
        ORDER BY r.hito_sello ASC LIMIT 1;

        v_meta_hito := COALESCE(v_meta_hito, 4);
        v_nombre_premio := COALESCE(v_nombre_premio, 'Premio Especial');

        v_mensaje := 'Hola ' || public.extraer_primer_nombre(v_cli.cliente_nombre) || ' 💕 Te extrañamos en ' || v_neg.nombre || '. Te dejamos un bono especial: tu próxima visita suma *2 sellos* para tu tarjeta de fidelización. 📲 Mira tus sellos aquí: ' || v_card_url;

        INSERT INTO cola_mensajes_salientes (
          business_id, cliente_id, telefono, flujo, mensaje,
          instance_name, api_key, estado, created_at, metadata
        ) VALUES (
          v_neg.id, v_cli.cliente_id,
          REGEXP_REPLACE(v_cli.cliente_telefono, '[^0-9]', '', 'g'),
          'club_glow_rescate_etapa1', v_mensaje,
          v_neg.instance_name, v_neg.api_key, 'pendiente', now(),
          jsonb_build_object('etapa', 1, 'dias_ausente', v_cli.dias_desde_ultima_cita)
        );

        v_encolados_etapa1 := v_encolados_etapa1 + 1;

      -- ETAPA 2: DÍA 45 (A 1 sello del premio)
      ELSIF v_cli.dias_desde_ultima_cita BETWEEN 45 AND 55 THEN
        IF EXISTS (
          SELECT 1 FROM cola_mensajes_salientes cq
          WHERE cq.cliente_id = v_cli.cliente_id
            AND cq.business_id = v_neg.id
            AND cq.flujo IN ('club_glow_rescate_etapa2', 'sellos_rescate_45d')
            AND cq.created_at >= (NOW() - interval '40 days')
        ) THEN
          CONTINUE;
        END IF;

        SELECT r.hito_sello, r.nombre INTO v_meta_hito, v_nombre_premio
        FROM sellos_roadmap r
        WHERE r.business_id = v_neg.id AND r.activo = true AND r.hito_sello > v_cli.sellos_actuales
        ORDER BY r.hito_sello ASC LIMIT 1;

        v_meta_hito := COALESCE(v_meta_hito, 4);
        v_nombre_premio := COALESCE(v_nombre_premio, 'Premio Especial');

        v_mensaje := '¡Hola ' || public.extraer_primer_nombre(v_cli.cliente_nombre) || '! 💖 En ' || v_neg.nombre || ' te premiamos: te regalamos sellos directo a tu tarjeta para quedar a solo 1 de tu premio: *' || v_nombre_premio || '*. 📲 Revisa tu avance: ' || v_card_url;

        INSERT INTO cola_mensajes_salientes (
          business_id, cliente_id, telefono, flujo, mensaje,
          instance_name, api_key, estado, created_at, metadata
        ) VALUES (
          v_neg.id, v_cli.cliente_id,
          REGEXP_REPLACE(v_cli.cliente_telefono, '[^0-9]', '', 'g'),
          'club_glow_rescate_etapa2', v_mensaje,
          v_neg.instance_name, v_neg.api_key, 'pendiente', now(),
          jsonb_build_object('etapa', 2, 'dias_ausente', v_cli.dias_desde_ultima_cita)
        );

        v_encolados_etapa2 := v_encolados_etapa2 + 1;
      END IF;
    END LOOP;
  END LOOP;

  v_total_encolados := v_encolados_etapa1 + v_encolados_etapa2;
  RETURN jsonb_build_object('ok', true, 'total_encolados', v_total_encolados, 'fecha', CURRENT_DATE);
END;
$function$;


-- 4. ENCOLAR CITAS SIN CERRAR DUENA
CREATE OR REPLACE FUNCTION public.encolar_citas_sin_cerrar_duena()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_negocio record;
  v_total_citas_abiertas int;
  v_telefono_duena text;
  v_mensaje text;
  v_encolados int := 0;
  v_agenda_url text;
BEGIN
  FOR v_negocio IN
    SELECT 
      n.id, 
      n.nombre, 
      n.slug, 
      n.telefono_recepcionista, 
      n.instance_name, 
      n.api_key, 
      n.bot_config, 
      n.recursos_saas
    FROM negocios n
    WHERE n.instance_name IS NOT NULL 
      AND n.api_key IS NOT NULL
      AND n.modo_fidelizacion IN ('sellos', 'ambos')
      AND n.modo_fidelizacion <> 'ninguno'
      AND COALESCE((n.recursos_saas->'modulos'->'club_glow'->>'activo')::boolean, false) IS TRUE
      AND COALESCE((n.recursos_saas->'sellos_addons'->>'cierre_diario_alerta')::boolean, (n.recursos_saas->'sellos_addons'->>'cierre_diario')::boolean, false) IS TRUE
  LOOP
    v_telefono_duena := COALESCE(
      v_negocio.bot_config->>'telefono_duena',
      v_negocio.bot_config->>'telefono_notificaciones',
      v_negocio.telefono_recepcionista
    );

    IF v_telefono_duena IS NULL OR LENGTH(REGEXP_REPLACE(v_telefono_duena, '[^0-9]', '', 'g')) < 8 THEN
      CONTINUE;
    END IF;

    SELECT COUNT(*) INTO v_total_citas_abiertas
    FROM "Citas" c
    WHERE c.business_id = v_negocio.id
      AND c.fecha = CURRENT_DATE
      AND c.estado IN ('Pendiente', 'Confirmada')
      AND c.hora_inicio <= (CURRENT_TIME + interval '15 minutes');

    IF v_total_citas_abiertas > 0 THEN
      IF EXISTS (
        SELECT 1 FROM cola_mensajes_salientes cq
        WHERE cq.business_id = v_negocio.id
          AND cq.flujo = 'alerta_cierre_citas_duena'
          AND cq.created_at >= (NOW() - interval '12 hours')
      ) THEN
        CONTINUE;
      END IF;

      v_agenda_url := 'https://nilah.app/calendar';

      v_mensaje := '🔔 *Atención ' || COALESCE(v_negocio.nombre, 'Equipo') || ' - Cierre de Jornada*' || chr(10) || chr(10) ||
        'Tienes *' || v_total_citas_abiertas || ' cita(s)* de hoy sin marcar como *Completadas* en tu agenda.' || chr(10) || chr(10) ||
        '👉 Marca las citas como atendidas aquí:' || chr(10) || v_agenda_url;

      INSERT INTO cola_mensajes_salientes (
        business_id,
        telefono,
        flujo,
        mensaje,
        instance_name,
        api_key,
        estado,
        created_at,
        metadata
      ) VALUES (
        v_negocio.id,
        REGEXP_REPLACE(v_telefono_duena, '[^0-9]', '', 'g'),
        'alerta_cierre_citas_duena',
        v_mensaje,
        v_negocio.instance_name,
        v_negocio.api_key,
        'pendiente',
        now(),
        jsonb_build_object(
          'citas_pendientes', v_total_citas_abiertas,
          'fecha', CURRENT_DATE
        )
      );

      v_encolados := v_encolados + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true,
    'encolados', v_encolados,
    'fecha', CURRENT_DATE
  );
END;
$function$;


-- 5. FN_OTORGAR_SELLOS_CUMPLEANOS
CREATE OR REPLACE FUNCTION public.fn_otorgar_sellos_cumpleanos(
  p_cliente_id bigint,
  p_business_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_negocio record;
  v_calculo jsonb;
  v_regalo int;
  v_expira timestamptz;
  v_vencimiento_meses int := 3;
BEGIN
  SELECT modo_fidelizacion, recursos_saas INTO v_negocio
  FROM public.negocios
  WHERE id = p_business_id;

  IF v_negocio.modo_fidelizacion = 'ninguno' 
     OR COALESCE((v_negocio.recursos_saas->'modulos'->'club_glow'->>'activo')::boolean, false) IS FALSE THEN
    RETURN jsonb_build_object(
      'ok', false,
      'motivo', 'Fidelización desactivada para el negocio'
    );
  END IF;

  -- Validar si ya se le otorgó sellos de cumpleaños este año
  IF EXISTS (
    SELECT 1 FROM sellos_movimientos
    WHERE cliente_id = p_cliente_id
      AND business_id = p_business_id
      AND motivo = 'cumpleanos'
      AND created_at >= (now() - interval '300 days')
  ) THEN
    RETURN jsonb_build_object(
      'ok', false,
      'motivo', 'El cliente ya recibió sellos de regalo de cumpleaños este año'
    );
  END IF;

  -- Calcular sellos
  v_calculo := fn_calcular_sellos_regalo_cumpleanos(p_cliente_id, p_business_id);
  v_regalo := (v_calculo->>'sellos_regalo')::int;

  IF v_regalo > 0 THEN
    SELECT COALESCE(vencimiento_sellos_meses, 3) INTO v_vencimiento_meses
    FROM sellos_config
    WHERE business_id = p_business_id;

    v_expira := now() + (v_vencimiento_meses || ' months')::interval;

    INSERT INTO sellos_movimientos (
      business_id, cliente_id, cantidad, motivo, expira_en,
      total_post, notas
    )
    VALUES (
      p_business_id, p_cliente_id, v_regalo, 'cumpleanos', v_expira,
      (v_calculo->>'sellos_resultantes')::int,
      'Regalo VIP de cumpleaños para alcanzar meta de premio'
    );
  END IF;

  RETURN v_calculo;
END;
$function$;
