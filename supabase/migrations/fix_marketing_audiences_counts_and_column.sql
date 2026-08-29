-- Migración: Asegurar columna ultimo_mensaje_marketing y actualizar funciones RPC de conteos y audiencias
ALTER TABLE public."Clientes" ADD COLUMN IF NOT EXISTS ultimo_mensaje_marketing TIMESTAMPTZ;

-- 1. Actualizar get_marketing_audience_counts
CREATE OR REPLACE FUNCTION public.get_marketing_audience_counts(p_business_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
  v_bid uuid;
BEGIN
  BEGIN
    v_bid := p_business_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN '{}'::json;
  END;

  WITH cita_stats AS (
    SELECT 
      c.cliente_id,
      COUNT(*) AS total_citas,
      MAX(c.fecha) AS ultima_cita_fecha,
      bool_or(c.servicio ILIKE '%Rubber%' OR c.servicio ILIKE '%Mani%' OR c.servicio ILIKE '%Semipermanente%' OR c.servicio ILIKE '%Kapping%' OR c.servicio ILIKE '%Acr%' OR c.servicio ILIKE '%Uñas%' OR c.servicio ILIKE '%uña%') AS hizo_unas,
      bool_or(c.servicio ILIKE '%Lifting%' OR c.servicio ILIKE '%Pestañ%' OR c.servicio ILIKE '%Cejas%' OR c.servicio ILIKE '%Laminado%' OR c.servicio ILIKE '%lash%') AS hizo_pestanas,
      bool_or(c.servicio ILIKE '%Capilar%' OR c.servicio ILIKE '%Alisado%' OR c.servicio ILIKE '%Coloraci%' OR c.servicio ILIKE '%Corte%' OR c.servicio ILIKE '%Tinte%' OR c.servicio ILIKE '%Davines%' OR c.servicio ILIKE '%cabello%') AS hizo_cabello,
      bool_or(c.servicio ILIKE '%Facial%' OR c.servicio ILIKE '%Limpieza%' OR c.servicio ILIKE '%Hidra%' OR c.servicio ILIKE '%rostro%') AS hizo_facial,
      bool_or(c.servicio ILIKE '%Pedicura%' OR c.servicio ILIKE '%Pies%' OR c.servicio ILIKE '%pedi%') AS hizo_pedicura
    FROM public."Citas" c
    WHERE c.business_id = v_bid
    GROUP BY c.cliente_id
  ),
  clientes_eval AS (
    SELECT
      cl.id,
      COALESCE(sc.total_citas, 0) AS total_citas,
      COALESCE(cl.ultima_visita, sc.ultima_cita_fecha::date) AS fecha_visita,
      COALESCE(CURRENT_DATE - COALESCE(cl.ultima_visita, sc.ultima_cita_fecha::date), 999) AS dias_sin_visita,
      cl.cumpleanos,
      COALESCE(sc.hizo_unas, false) AS hizo_unas,
      COALESCE(sc.hizo_pestanas, false) AS hizo_pestanas,
      COALESCE(sc.hizo_cabello, false) AS hizo_cabello,
      COALESCE(sc.hizo_facial, false) AS hizo_facial,
      COALESCE(sc.hizo_pedicura, false) AS hizo_pedicura,
      
      -- Filtro de elegibilidad real (Cooldown 15d + Optin + Leyes Cruzadas)
      (
        (cl.bloqueado_hasta IS NULL OR cl.bloqueado_hasta <= NOW())
        AND
        (
          COALESCE(cl.ultimo_mensaje_marketing, cl.ultimo_mensaje_enviado, cl.ultima_promo_enviada) IS NULL 
          OR COALESCE(cl.ultimo_mensaje_marketing, cl.ultimo_mensaje_enviado, cl.ultima_promo_enviada) <= (NOW() - INTERVAL '15 days')
        )
        AND
        (cl.acepta_marketing IS TRUE OR cl.acepta_marketing IS NULL)
        AND NOT EXISTS (
          SELECT 1 FROM public."Citas" cf
          WHERE cf.cliente_id = cl.id AND cf.fecha > NOW() AND cf.estado NOT IN ('Cancelada')
        )
        AND NOT EXISTS (
          SELECT 1 FROM public.nilah_autopilot_log al
          WHERE al.cliente_id = cl.id
            AND al.flujo_origen IN ('retoque', 'rescate_45d', 'rescate_75d', 'rescate_120d')
            AND al.created_at >= (NOW() - INTERVAL '5 days')
        )
      ) AS elegible_real
    FROM public."Clientes" cl
    LEFT JOIN cita_stats sc ON cl.id = sc.cliente_id
    WHERE cl.business_id = v_bid
      AND (cl."Estado" IN ('Activo', 'Potencial') OR cl."Estado" IS NULL)
  )
  SELECT json_build_object(
    'leads', COUNT(*) FILTER (WHERE total_citas = 0 AND elegible_real),
    'potenciales', COUNT(*) FILTER (WHERE total_citas = 0 AND elegible_real),
    'vip', COUNT(*) FILTER (WHERE total_citas >= 5 AND elegible_real),
    'alto_valor', COUNT(*) FILTER (WHERE total_citas >= 4 AND elegible_real),
    'frecuentes', COUNT(*) FILTER (WHERE total_citas BETWEEN 3 AND 9 AND elegible_real),
    'nuevas', COUNT(*) FILTER (WHERE total_citas BETWEEN 1 AND 2 AND elegible_real),
    'recientes', COUNT(*) FILTER (WHERE fecha_visita IS NOT NULL AND dias_sin_visita <= 30 AND elegible_real),
    'servicio_unas', COUNT(*) FILTER (WHERE hizo_unas AND elegible_real),
    'servicio_pestanas', COUNT(*) FILTER (WHERE hizo_pestanas AND elegible_real),
    'servicio_cabello', COUNT(*) FILTER (WHERE hizo_cabello AND elegible_real),
    'servicio_facial', COUNT(*) FILTER (WHERE hizo_facial AND elegible_real),
    'servicio_pedicura', COUNT(*) FILTER (WHERE hizo_pedicura AND elegible_real),
    'cross_unas_pestanas', COUNT(*) FILTER (WHERE ((hizo_unas AND NOT hizo_pestanas) OR (hizo_pestanas AND NOT hizo_unas)) AND elegible_real),
    'cross_cabello_facial', COUNT(*) FILTER (WHERE ((hizo_cabello AND NOT hizo_facial) OR (hizo_facial AND NOT hizo_cabello)) AND elegible_real),
    'cross_mani_pedi', COUNT(*) FILTER (WHERE (hizo_unas AND NOT hizo_pedicura) AND elegible_real),
    'cross_pestanas_cejas', COUNT(*) FILTER (WHERE hizo_pestanas AND elegible_real),
    'cumpleanos', COUNT(*) FILTER (WHERE cumpleanos IS NOT NULL AND cumpleanos != '' AND elegible_real),
    'todas', COUNT(*) FILTER (WHERE elegible_real)
  ) INTO v_result
  FROM clientes_eval;

  RETURN COALESCE(v_result, '{}'::json);
END;
$$;

-- 2. Actualizar get_combined_broadcast_audience
CREATE OR REPLACE FUNCTION public.get_combined_broadcast_audience(
  p_business_id text,
  p_servicio_keyword text DEFAULT '',
  p_dias_sin_visita integer DEFAULT 0,
  p_segmento text DEFAULT '',
  p_solo_optin boolean DEFAULT false,
  p_limit integer DEFAULT 100
)
RETURNS TABLE(
  id bigint,
  nombre text,
  telefono text,
  categoria text,
  ultima_visita date,
  dias_sin_visita integer,
  ultimo_servicio text,
  dia_preferido text,
  descuento_sugerido text,
  regalo_sugerido text,
  bloqueado_hasta timestamp with time zone,
  cooldown_activo boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bid uuid;
  v_segmento_tiene_dias_propios BOOLEAN;
  v_es_categoria_dinamica BOOLEAN;
  v_cat_nombre TEXT;
  v_cross_cat1 TEXT;
  v_cross_cat2 TEXT;
BEGIN
  BEGIN
    v_bid := p_business_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN;
  END;

  v_segmento_tiene_dias_propios := (p_segmento IN (
    'recientes','vip','leads','potenciales'
  ));

  IF p_segmento ILIKE 'cat_%' THEN
    v_es_categoria_dinamica := TRUE;
    v_cat_nombre := SUBSTRING(p_segmento FROM 5);
  ELSE
    v_es_categoria_dinamica := FALSE;
  END IF;

  IF p_segmento ILIKE 'cross_dyn_%' THEN
    v_cross_cat1 := SPLIT_PART(SUBSTRING(p_segmento FROM 11), '__', 1);
    v_cross_cat2 := SPLIT_PART(SUBSTRING(p_segmento FROM 11), '__', 2);
  END IF;

  RETURN QUERY
  WITH
  cita_servicio_especifico AS (
    SELECT DISTINCT ON (c.cliente_id)
      c.cliente_id,
      c.servicio AS servicio_especifico,
      c.fecha AS fecha_servicio_especifico
    FROM public."Citas" c
    WHERE c.business_id = v_bid
      AND (
        p_servicio_keyword IS NULL OR p_servicio_keyword = '' OR p_servicio_keyword ILIKE 'todos'
        OR c.servicio ILIKE '%' || p_servicio_keyword || '%'
        OR EXISTS (
          SELECT 1 FROM public.servicios s
          WHERE s.business_id = v_bid
            AND (s.categoria ILIKE '%' || p_servicio_keyword || '%' OR s.nombre ILIKE '%' || p_servicio_keyword || '%')
            AND c.servicio ILIKE '%' || s.nombre || '%'
        )
      )
    ORDER BY c.cliente_id, c.fecha DESC
  ),
  ultima_cita_general AS (
    SELECT DISTINCT ON (c.cliente_id)
      c.cliente_id,
      c.servicio AS ultimo_servicio_general,
      c.fecha AS fecha_ultima_cita_general
    FROM public."Citas" c
    WHERE c.business_id = v_bid
    ORDER BY c.cliente_id, c.fecha DESC
  ),
  stats_cliente AS (
    SELECT 
      c.cliente_id, 
      COUNT(*) as num_citas
    FROM public."Citas" c
    WHERE c.business_id = v_bid
    GROUP BY c.cliente_id
  ),
  clientes_raw AS (
    SELECT
      cl.id, cl.nombre, cl.telefono, cl.categoria,
      COALESCE(cl.ultima_visita, ucg.fecha_ultima_cita_general::date, cse.fecha_servicio_especifico::date) AS fecha_visita_real,
      cl.bloqueado_hasta,
      -- =========================================================================
      -- COOLDOWN DE MARKETING: 15 DÍAS (o bloqueado explícito)
      -- =========================================================================
      (
        (cl.bloqueado_hasta IS NOT NULL AND cl.bloqueado_hasta > NOW())
        OR
        (
          COALESCE(cl.ultimo_mensaje_marketing, cl.ultimo_mensaje_enviado, cl.ultima_promo_enviada) IS NOT NULL 
          AND COALESCE(cl.ultimo_mensaje_marketing, cl.ultimo_mensaje_enviado, cl.ultima_promo_enviada) > (NOW() - INTERVAL '15 days')
        )
      ) AS is_cooldown,
      COALESCE(
        (CURRENT_DATE - COALESCE(cl.ultima_visita, ucg.fecha_ultima_cita_general::date, cse.fecha_servicio_especifico::date)),
        30
      )::INT AS calc_dias,
      COALESCE(
        cse.servicio_especifico, ucg.ultimo_servicio_general, cl.ultimo_servicio, 'Servicio General'
      ) AS calc_ultimo_servicio,
      COALESCE(
        CASE
          WHEN cl.ia_dias_preferidos IS NOT NULL AND array_length(cl.ia_dias_preferidos, 1) > 0
          THEN cl.ia_dias_preferidos[1]
          ELSE NULL
        END,
        'Viernes'
      ) AS calc_dia_pref,
      COALESCE(sc.num_citas, 0) AS num_citas,
      cl.cumpleanos,
      cl."Estado" as estado_cliente,
      cl.acepta_marketing,
      COALESCE(cl.ultimo_mensaje_marketing, cl.ultimo_mensaje_enviado, cl.ultima_promo_enviada) as ultimo_mensaje_marketing
    FROM public."Clientes" cl
    LEFT JOIN cita_servicio_especifico cse ON cl.id = cse.cliente_id
    LEFT JOIN ultima_cita_general ucg ON cl.id = ucg.cliente_id
    LEFT JOIN stats_cliente sc ON cl.id = sc.cliente_id
    WHERE
      cl.business_id = v_bid
      AND (cl."Estado" IN ('Activo', 'Potencial') OR cl."Estado" IS NULL)
      AND (p_solo_optin IS FALSE OR (cl.acepta_marketing IS TRUE OR cl.acepta_marketing IS NULL))
      AND (cl.bloqueado_hasta IS NULL OR cl.bloqueado_hasta <= NOW())

      -- LEY CRUZADA #3: Excluir clientas que ya tengan cita futura agendada
      AND NOT EXISTS (
        SELECT 1 FROM public."Citas" cf
        WHERE cf.cliente_id = cl.id
          AND cf.fecha > NOW()
          AND cf.estado NOT IN ('Cancelada')
      )

      -- LEY CRUZADA #2: Excluir clientas que hayan recibido mensaje automático (Retoque o Rescate) en los últimos 5 días
      AND NOT EXISTS (
        SELECT 1 FROM public.nilah_autopilot_log al
        WHERE al.cliente_id = cl.id
          AND al.flujo_origen IN ('retoque', 'rescate_45d', 'rescate_75d', 'rescate_120d')
          AND al.created_at >= (NOW() - INTERVAL '5 days')
      )

      AND (
        v_segmento_tiene_dias_propios IS TRUE
        OR p_dias_sin_visita <= 0
        OR COALESCE(cl.ultima_visita, ucg.fecha_ultima_cita_general::date) IS NULL
        OR (CURRENT_DATE - COALESCE(cl.ultima_visita, ucg.fecha_ultima_cita_general::date)) >= p_dias_sin_visita
      )
      AND (
        p_servicio_keyword IS NULL OR p_servicio_keyword = '' OR p_servicio_keyword ILIKE 'todos'
        OR cl.id IN (SELECT cliente_id FROM cita_servicio_especifico)
      )
  )
  SELECT
    cr.id, cr.nombre, cr.telefono, cr.categoria,
    cr.fecha_visita_real AS ultima_visita,
    cr.calc_dias AS dias_sin_visita,
    cr.calc_ultimo_servicio AS ultimo_servicio,
    cr.calc_dia_pref AS dia_preferido,
    CASE
      WHEN cr.calc_dias > 90 THEN '30% OFF'
      WHEN cr.calc_dias >= 60 THEN '25% OFF'
      WHEN cr.calc_dias >= 30 THEN '15% OFF'
      ELSE '10% OFF'
    END AS descuento_sugerido,
    'Tratamiento Spa de Cortesía' AS regalo_sugerido,
    cr.bloqueado_hasta,
    cr.is_cooldown AS cooldown_activo
  FROM clientes_raw cr
  WHERE
    p_segmento IS NULL OR p_segmento = '' OR p_segmento = 'todas'
    OR (
      CASE
        WHEN v_es_categoria_dinamica IS TRUE
          THEN EXISTS (
            SELECT 1 FROM public."Citas" c2
            WHERE c2.business_id = v_bid AND c2.cliente_id = cr.id
              AND (
                c2.servicio ILIKE '%' || v_cat_nombre || '%'
                OR EXISTS (
                  SELECT 1 FROM public.servicios s2
                  WHERE s2.business_id = v_bid AND s2.categoria = v_cat_nombre AND c2.servicio ILIKE '%' || s2.nombre || '%'
                )
              )
          )
        WHEN v_cross_cat1 IS NOT NULL AND v_cross_cat2 IS NOT NULL
          THEN (
            (
              EXISTS (
                SELECT 1 FROM public."Citas" c1 WHERE c1.business_id = v_bid AND c1.cliente_id = cr.id
                  AND (c1.servicio ILIKE '%' || v_cross_cat1 || '%' OR EXISTS (SELECT 1 FROM public.servicios s1 WHERE s1.business_id = v_bid AND s1.categoria = v_cross_cat1 AND c1.servicio ILIKE '%' || s1.nombre || '%'))
              )
              AND NOT EXISTS (
                SELECT 1 FROM public."Citas" c2 WHERE c2.business_id = v_bid AND c2.cliente_id = cr.id
                  AND (c2.servicio ILIKE '%' || v_cross_cat2 || '%' OR EXISTS (SELECT 1 FROM public.servicios s2 WHERE s2.business_id = v_bid AND s2.categoria = v_cross_cat2 AND c2.servicio ILIKE '%' || s2.nombre || '%'))
              )
            )
            OR
            (
              EXISTS (
                SELECT 1 FROM public."Citas" c2 WHERE c2.business_id = v_bid AND c2.cliente_id = cr.id
                  AND (c2.servicio ILIKE '%' || v_cross_cat2 || '%' OR EXISTS (SELECT 1 FROM public.servicios s2 WHERE s2.business_id = v_bid AND s2.categoria = v_cross_cat2 AND c2.servicio ILIKE '%' || s2.nombre || '%'))
              )
              AND NOT EXISTS (
                SELECT 1 FROM public."Citas" c1 WHERE c1.business_id = v_bid AND c1.cliente_id = cr.id
                  AND (c1.servicio ILIKE '%' || v_cross_cat1 || '%' OR EXISTS (SELECT 1 FROM public.servicios s1 WHERE s1.business_id = v_bid AND s1.categoria = v_cross_cat1 AND c1.servicio ILIKE '%' || s1.nombre || '%'))
              )
            )
          )
        WHEN p_segmento IN ('leads', 'potenciales')
          THEN cr.num_citas = 0
        WHEN p_segmento = 'vip'
          THEN cr.num_citas >= 5
        WHEN p_segmento = 'frecuentes'
          THEN cr.num_citas BETWEEN 3 AND 9
        WHEN p_segmento = 'nuevas'
          THEN cr.num_citas BETWEEN 1 AND 2
        WHEN p_segmento = 'recientes'
          THEN cr.fecha_visita_real IS NOT NULL AND cr.calc_dias <= 30
        WHEN p_segmento = 'alto_valor'
          THEN cr.num_citas >= 4
        WHEN p_segmento = 'cumpleanos'
          THEN cr.cumpleanos IS NOT NULL AND cr.cumpleanos != ''
        WHEN p_segmento = 'servicio_unas' THEN cr.calc_ultimo_servicio ILIKE '%uñ%' OR cr.calc_ultimo_servicio ILIKE '%mani%' OR cr.calc_ultimo_servicio ILIKE '%rubber%'
        WHEN p_segmento = 'servicio_pestanas' THEN cr.calc_ultimo_servicio ILIKE '%pesta%' OR cr.calc_ultimo_servicio ILIKE '%cejas%' OR cr.calc_ultimo_servicio ILIKE '%lifting%'
        WHEN p_segmento = 'servicio_cabello' THEN cr.calc_ultimo_servicio ILIKE '%cabello%' OR cr.calc_ultimo_servicio ILIKE '%corte%' OR cr.calc_ultimo_servicio ILIKE '%color%'
        WHEN p_segmento = 'servicio_facial' THEN cr.calc_ultimo_servicio ILIKE '%facial%' OR cr.calc_ultimo_servicio ILIKE '%piel%' OR cr.calc_ultimo_servicio ILIKE '%limpieza%'
        WHEN p_segmento = 'servicio_pedicura' THEN cr.calc_ultimo_servicio ILIKE '%pedicura%' OR cr.calc_ultimo_servicio ILIKE '%pies%'
        ELSE TRUE
      END
    )
  ORDER BY cr.calc_dias DESC
  LIMIT p_limit;
END;
$$;
