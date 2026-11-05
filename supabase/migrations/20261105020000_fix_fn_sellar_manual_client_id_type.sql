CREATE OR REPLACE FUNCTION public.fn_sellar_manual_club_glow(
  p_business_id uuid,
  p_cliente_id text,
  p_cantidad integer DEFAULT 1,
  p_motivo text DEFAULT 'ajuste_manual'::text,
  p_notas text DEFAULT 'Sellado manual por administración'::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_cliente_id_bigint   bigint;
  v_config              sellos_config%ROWTYPE;
  v_negocio             record;
  v_cliente             record;
  v_sellos_antes        int := 0;
  v_sellos_despues      int := 0;
  v_hitos               sellos_roadmap[];
  v_hito                sellos_roadmap%ROWTYPE;
  v_proximo_hito        sellos_roadmap%ROWTYPE;
  v_roadmap_id          uuid;
  v_codigo_canje        text;
  v_premio_ganado       jsonb := 'null'::jsonb;
  v_sellos_para_proximo int := 0;
  v_card_url            text;
  v_salon_slug          text;
  v_media_url           text := NULL;
  v_es_hito_premio      boolean := false;
  v_texto_mensaje       text;
  v_mensaje_enviado     boolean := false;
  v_motivo_enum         sello_motivo_enum;
BEGIN
  -- 0. Casteo seguro de cliente_id (en Korat Clientes.id es BIGINT)
  BEGIN
    v_cliente_id_bigint := p_cliente_id::bigint;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Identificador de clienta inválido: ' || p_cliente_id);
  END;

  -- 0.1 Mapeo seguro al enum sello_motivo_enum
  v_motivo_enum := CASE 
    WHEN p_motivo IN ('bienvenida', 'cita', 'referida_enviada', 'referida_recibida', 'cumpleanos', 'reactivacion', 'ajuste_manual', 'vencido') 
      THEN p_motivo::sello_motivo_enum
    WHEN p_motivo = 'amiga_referida' THEN 'referida_enviada'::sello_motivo_enum
    WHEN p_motivo = 'visita_mostrador' THEN 'cita'::sello_motivo_enum
    ELSE 'ajuste_manual'::sello_motivo_enum
  END;

  -- 1. Validar negocio y config
  SELECT * INTO v_config
  FROM sellos_config
  WHERE business_id = p_business_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Programa de sellos no configurado para este negocio');
  END IF;

  SELECT id, nombre, slug, instance_name, api_key INTO v_negocio
  FROM negocios
  WHERE id = p_business_id;

  v_salon_slug := COALESCE(v_negocio.slug, p_business_id::text);

  -- 2. Validar cliente
  SELECT id, nombre, telefono, categoria, club_glow_nivel, club_glow_ciclos_completados
  INTO v_cliente
  FROM "Clientes"
  WHERE id = v_cliente_id_bigint AND business_id = p_business_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Clienta no encontrada en este negocio');
  END IF;

  IF p_cantidad <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'La cantidad de sellos debe ser mayor a 0');
  END IF;

  -- 3. Calcular sellos actuales
  SELECT COALESCE(SUM(cantidad), 0) INTO v_sellos_antes
  FROM sellos_movimientos
  WHERE cliente_id = v_cliente_id_bigint AND business_id = p_business_id;

  v_sellos_despues := v_sellos_antes + p_cantidad;

  -- 4. Registrar movimiento manual con el motivo convertido a ENUM
  INSERT INTO sellos_movimientos (
    business_id, cliente_id, cantidad, motivo, notas, created_at
  ) VALUES (
    p_business_id, v_cliente_id_bigint, p_cantidad, v_motivo_enum, p_notas, now()
  );

  -- 5. Detectar si cruzó o desbloqueó hito de premio
  SELECT ARRAY_AGG(r ORDER BY r.hito_sello)
  INTO v_hitos
  FROM sellos_roadmap r
  WHERE r.business_id = p_business_id AND r.activo = true
    AND r.hito_sello > v_sellos_antes
    AND r.hito_sello <= v_sellos_despues;

  IF v_hitos IS NOT NULL AND array_length(v_hitos, 1) > 0 THEN
    v_hito           := v_hitos[array_length(v_hitos, 1)];
    v_roadmap_id     := v_hito.id;
    v_codigo_canje   := 'SL-' || UPPER(SUBSTRING(md5(random()::text), 1, 6));
    v_es_hito_premio := true;

    -- Registrar premio ganado
    INSERT INTO sellos_premios_ganados (
      business_id, cliente_id, roadmap_id,
      codigo_canje, estado, ganado_en, expira_en
    ) VALUES (
      p_business_id, v_cliente_id_bigint, v_roadmap_id,
      v_codigo_canje, 'pendiente',
      now(),
      now() + (COALESCE(v_config.vencimiento_premio_dias, 30) || ' days')::interval
    );

    v_premio_ganado := jsonb_build_object(
      'hito',         v_hito.hito_sello,
      'nombre',       v_hito.nombre,
      'descripcion',  v_hito.descripcion,
      'codigo_canje', v_codigo_canje,
      'expira_en',    (now() + (COALESCE(v_config.vencimiento_premio_dias, 30) || ' days')::interval)::text
    );

    -- Coronación VIP si llega a los 12 sellos
    IF v_hito.hito_sello >= v_config.total_sellos_roadmap THEN
      UPDATE "Clientes"
      SET 
        categoria = 'VIP 👑',
        estado_lifecycle = 'Activo',
        club_glow_nivel = 'VIP DIAMANTE',
        club_glow_ciclos_completados = COALESCE(club_glow_ciclos_completados, 0) + 1,
        club_glow_ultimo_ciclo_at = now()
      WHERE id = v_cliente_id_bigint AND business_id = p_business_id;

      INSERT INTO club_glow_ciclos_vip (
        business_id, cliente_id, ciclo_numero, nivel_alcanzado, premio_canje_codigo, metadata
      )
      SELECT 
        p_business_id, 
        v_cliente_id_bigint, 
        COALESCE(c.club_glow_ciclos_completados, 1),
        'VIP DIAMANTE 👑',
        v_codigo_canje,
        jsonb_build_object(
          'motivo', p_motivo,
          'premio_nombre', v_hito.nombre,
          'total_sellos', v_sellos_despues
        )
      FROM "Clientes" c
      WHERE c.id = v_cliente_id_bigint;
    END IF;

    -- URL de la tarjeta
    v_card_url := 'https://koratflow.agency/club/' || v_salon_slug || '?c=' || v_cliente_id_bigint::text;

    -- Imagen 3D correspondiente al premio
    v_media_url := COALESCE(
      v_hito.imagen_url,
      CASE
        WHEN v_hito.hito_sello = 4  THEN 'https://cfggpqpbqqeavdbdzwoz.supabase.co/storage/v1/object/public/nilah_assets/club-glow-prizes/premio_hito_4.jpg'
        WHEN v_hito.hito_sello = 8  THEN 'https://cfggpqpbqqeavdbdzwoz.supabase.co/storage/v1/object/public/nilah_assets/club-glow-prizes/premio_hito_8.jpg'
        WHEN v_hito.hito_sello = 12 THEN 'https://cfggpqpbqqeavdbdzwoz.supabase.co/storage/v1/object/public/nilah_assets/club-glow-prizes/premio_hito_12.jpg'
        ELSE 'https://cfggpqpbqqeavdbdzwoz.supabase.co/storage/v1/object/public/nilah_assets/club-glow-prizes/premio_hito_4.jpg'
      END
    );

    -- Mensaje de Premio
    v_texto_mensaje := '👑 *¡Felicidades ' || COALESCE(v_cliente.nombre, 'Reina') || '! Has ganado un premio en ' || COALESCE(v_negocio.nombre, 'nuestro salón') || '!*' || chr(10) || chr(10) ||
      '✨ *Premio Desbloqueado:* ' || (v_premio_ganado->>'nombre') || chr(10) ||
      '🎟️ *Código de Canje:* `' || (v_premio_ganado->>'codigo_canje') || '`' || chr(10) ||
      '🌟 Ya tienes ' || v_sellos_despues || ' sellos acumulados en tu Club Glow.' || chr(10) || chr(10) ||
      '📲 *Muestra este código en tu próxima visita o mira tu tarjeta digital aquí:*' || chr(10) || v_card_url;

    -- Solo enviar WhatsApp si la clienta tiene teléfono válido
    IF v_cliente.telefono IS NOT NULL AND LENGTH(REGEXP_REPLACE(v_cliente.telefono, '[^0-9]', '', 'g')) >= 8 THEN
      INSERT INTO cola_mensajes_salientes (
        business_id, cliente_id, telefono, flujo, mensaje,
        media_url, media_type, instance_name, api_key, estado,
        proximo_intento_at, created_at, metadata
      ) VALUES (
        p_business_id, v_cliente_id_bigint,
        REGEXP_REPLACE(v_cliente.telefono, '[^0-9]', '', 'g'),
        'club_glow_premio_manual', v_texto_mensaje, v_media_url,
        'image',
        v_negocio.instance_name, v_negocio.api_key, 'pendiente',
        now(), now(),
        jsonb_build_object(
          'sellos_nuevos',         p_cantidad,
          'sellos_total',          v_sellos_despues,
          'premio_ganado',         v_premio_ganado,
          'tipo_mensaje',          'sello_premio_manual'
        )
      );
      v_mensaje_enviado := true;
    END IF;
  END IF;

  -- 6. Próximo hito informativo
  SELECT * INTO v_proximo_hito
  FROM sellos_roadmap
  WHERE business_id = p_business_id
    AND activo = true
    AND hito_sello > v_sellos_despues
  ORDER BY hito_sello ASC
  LIMIT 1;

  v_sellos_para_proximo := CASE
    WHEN v_proximo_hito.id IS NOT NULL THEN v_proximo_hito.hito_sello - v_sellos_despues
    ELSE 0
  END;

  RETURN jsonb_build_object(
    'ok', true,
    'cliente_id', v_cliente_id_bigint::text,
    'cliente_nombre', v_cliente.nombre,
    'sellos_antes', v_sellos_antes,
    'sellos_agregados', p_cantidad,
    'sellos_despues', v_sellos_despues,
    'es_premio', v_es_hito_premio,
    'premio_ganado', v_premio_ganado,
    'mensaje_enviado', v_mensaje_enviado,
    'proximo_hito', CASE WHEN v_proximo_hito.id IS NOT NULL THEN v_proximo_hito.nombre ELSE NULL END,
    'sellos_para_proximo', v_sellos_para_proximo
  );
END;
$function$;
