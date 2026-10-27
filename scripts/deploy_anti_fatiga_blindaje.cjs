const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();

  console.log('1. Blindando get_candidatos_calificacion_post_cita...');
  await client.query(`
CREATE OR REPLACE FUNCTION public.get_candidatos_calificacion_post_cita(p_business_id uuid)
 RETURNS TABLE(cita_id bigint, cliente_id bigint, nombre_cliente text, telefono_cliente text, servicio_realizado text, nombre_negocio text, instance_name text, api_key text, mensaje_texto text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_hora_actual  time;
    v_negocio      record;
    v_ie           record;
BEGIN
    SELECT * INTO v_negocio FROM public.negocios WHERE id = p_business_id;
    IF NOT FOUND OR v_negocio.activo = false THEN
        RETURN;
    END IF;

    -- Validar que el negocio tenga activa la automatización post-cita / calificacion
    IF COALESCE(
        (v_negocio.bot_config->'flujos_activos'->>'calificacion')::boolean,
        (v_negocio.bot_config->'flujos_activos'->>'fidelizacion')::boolean,
        (v_negocio.recursos_saas->'automatizaciones'->>'calificacion_activa')::boolean,
        (v_negocio.recursos_saas->'automatizaciones'->>'post_cita_activo')::boolean,
        true
    ) = false THEN
        RETURN;
    END IF;

    SELECT ie.instance_name, ie.api_key INTO v_ie
    FROM public.instancias_evolution ie
    WHERE ie.business_id = p_business_id
      AND ie.status = 'conectado'
      AND ie.instance_name IS NOT NULL
      AND ie.api_key IS NOT NULL
    LIMIT 1;

    IF NOT FOUND THEN RETURN; END IF;

    v_hora_actual := (now() AT TIME ZONE COALESCE(v_negocio.timezone, 'America/Lima'))::time;
    IF v_hora_actual < '10:00:00'::time OR v_hora_actual > '20:30:00'::time THEN
        RETURN;
    END IF;

    RETURN QUERY
    WITH
    negocio_prefijo(prefijo) AS (
        SELECT CASE LOWER(COALESCE(v_negocio.pais, 'peru'))
            WHEN 'peru'      THEN '51'
            WHEN 'perú'     THEN '51'
            WHEN 'pe'        THEN '51'
            WHEN 'colombia'  THEN '57'
            WHEN 'co'        THEN '57'
            WHEN 'mexico'    THEN '52'
            WHEN 'méxico'   THEN '52'
            WHEN 'mx'        THEN '52'
            WHEN 'chile'     THEN '56'
            WHEN 'cl'        THEN '56'
            WHEN 'ecuador'   THEN '593'
            WHEN 'ec'        THEN '593'
            WHEN 'venezuela' THEN '58'
            WHEN 've'        THEN '58'
            WHEN 'argentina' THEN '54'
            WHEN 'ar'        THEN '54'
            WHEN 'bolivia'   THEN '591'
            WHEN 'bo'        THEN '591'
            ELSE '51'
        END
    ),
    candidatos AS (
        SELECT
            c.id AS cid,
            c.cliente_id AS clid,
            COALESCE(
                NULLIF(TRIM(public.extraer_primer_nombre(cl.nombre)), ''),
                'amiga'
            ) AS n_cliente_limpio,
            CASE
                WHEN LENGTH(REGEXP_REPLACE(cl.telefono, '[^0-9]', '', 'g')) BETWEEN 8 AND 10
                THEN (SELECT np.prefijo FROM negocio_prefijo np)
                     || REGEXP_REPLACE(cl.telefono, '[^0-9]', '', 'g')
                ELSE REGEXP_REPLACE(cl.telefono, '[^0-9]', '', 'g')
            END AS t_cliente_limpio,
            COALESCE(c.servicio, 'tu servicio') AS s_nombre,
            v_negocio.nombre AS neg_nombre,
            v_ie.instance_name AS i_name,
            v_ie.api_key AS i_key,
            COALESCE(c.hora_fin, c.fecha + INTERVAL '90 minutes') AS f_estimado,
            CASE
                WHEN COALESCE(c.hora_fin, c.fecha + INTERVAL '90 minutes') >= (NOW() - INTERVAL '6 hours')
                THEN 'hoy'
                WHEN COALESCE(c.hora_fin, c.fecha + INTERVAL '90 minutes') >= (NOW() - INTERVAL '24 hours')
                THEN 'hace unas horas'
                ELSE 'recientemente'
            END AS rel_tiempo
        FROM public."Citas" c
        JOIN public."Clientes" cl ON cl.id = c.cliente_id
        WHERE c.business_id = p_business_id
          AND c.estado ILIKE 'completada'
          AND (c.encuesta_enviada IS NULL OR c.encuesta_enviada = false)
          AND COALESCE(c.hora_fin, c.fecha + INTERVAL '90 minutes') <= (NOW() - INTERVAL '30 minutes')
          AND COALESCE(c.hora_fin, c.fecha + INTERVAL '90 minutes') >= (NOW() - INTERVAL '48 hours')
          AND cl."Estado" = 'Activo'
          AND (cl.acepta_marketing IS NULL OR cl.acepta_marketing = true)
          AND (
              cl.bot_pausado IS NULL
              OR cl.bot_pausado = false
              OR (cl.bot_pausado_hasta IS NOT NULL AND cl.bot_pausado_hasta < NOW())
          )
          AND cl.telefono IS NOT NULL
          -- 1. COOLDOWN ESTRICTO 24H: Si ya se le envió encuesta en las últimas 24h, NO enviar otra
          AND NOT EXISTS (
              SELECT 1 FROM public.mensajes m
              WHERE m.cliente_id = c.cliente_id
                AND m.business_id = p_business_id
                AND m.created_at >= (NOW() - INTERVAL '24 hours')
                AND (
                    m.campana_origen IN (
                        'campana_masiva', 'rescate_45d', 'rescate_75d',
                        'rescate_120d', 'fidelizacion_encuesta', 'post_cita_fidelizacion',
                        'calificacion_encuesta', 'encuesta_fidelizacion'
                    )
                    OR m.contenido ILIKE '%¿cómo te sentiste con la atención?%'
                    OR m.contenido ILIKE '%¿cómo calificarías tu atención%'
                )
          )
          AND NOT EXISTS (
              SELECT 1 FROM public.cola_mensajes_salientes cms
              WHERE cms.cliente_id = c.cliente_id
                AND cms.business_id = p_business_id
                AND cms.created_at >= (NOW() - INTERVAL '24 hours')
                AND cms.flujo IN ('fidelizacion_encuesta', 'calificacion_encuesta')
          )
          -- 2. BLINDAJE MULTI-SERVICIO MISMO DÍA: Esperar si tiene otra cita hoy que aún no termina
          AND NOT EXISTS (
              SELECT 1 FROM public."Citas" c_futura
              WHERE c_futura.cliente_id = c.cliente_id
                AND c_futura.business_id = p_business_id
                AND c_futura.id <> c.id
                AND c_futura.fecha::date = c.fecha::date
                AND c_futura.estado NOT IN ('Cancelada', 'No Asistio', 'completada')
          )
        ORDER BY c.fecha ASC
        LIMIT 10
    )
    SELECT
        c.cid AS cita_id,
        c.clid AS cliente_id,
        c.n_cliente_limpio AS nombre_cliente,
        c.t_cliente_limpio AS telefono_cliente,
        c.s_nombre AS servicio_realizado,
        c.neg_nombre AS nombre_negocio,
        c.i_name AS instance_name,
        c.i_key AS api_key,
        COALESCE(
            NULLIF(TRIM(
                REPLACE(
                    REPLACE(
                        REPLACE(
                            public.reemplazar_servicio_gramatical(
                                REPLACE((
                                    SELECT p.contenido
                                    FROM public.plantillas_automatizacion p
                                    WHERE p.business_id = p_business_id
                                      AND p.flujo IN ('fidelizacion_encuesta', 'calificacion_encuesta')
                                      AND p.activo = true
                                    ORDER BY RANDOM()
                                    LIMIT 1
                                ), '{nombre_cliente}',
                                COALESCE(NULLIF(TRIM(public.extraer_primer_nombre(
                                    (SELECT cl2.nombre FROM public."Clientes" cl2 WHERE cl2.id = c.clid)
                                )), ''), 'amiga')
                                ),
                                c.s_nombre
                            ),
                            '{nombre_negocio}', c.neg_nombre
                        ),
                        '{tiempo_relativo}', c.rel_tiempo
                    ),
                    '{nombre_negocio}', c.neg_nombre
                )
            ), ''),
            '🌸 Qué alegría haberte tenido con nosotras.\n\nUna preguntita rápida... del 1 al 5, ¿cómo te sentiste con la atención? (Responde solo con el número porfa) 👇'
        ) AS mensaje_texto
    FROM candidatos c;
END;
$function$;
`);
  console.log('get_candidatos_calificacion_post_cita blindado exitosamente.');

  console.log('2. Blindando encolar_calificacion_post_cita (Auto-cierre citas hermanas mismo día)...');
  await client.query(`
CREATE OR REPLACE FUNCTION public.encolar_calificacion_post_cita()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_negocio   record;
    v_cand      record;
    v_encolados integer := 0;
    v_delay_ms  integer;
BEGIN
    FOR v_negocio IN
        SELECT n.id, n.nombre, ie.instance_name, ie.api_key, n.timezone
        FROM public.negocios n
        JOIN public.instancias_evolution ie
             ON ie.business_id = n.id AND ie.status = 'conectado'
        WHERE n.activo = true
          AND ie.instance_name IS NOT NULL
          AND ie.api_key IS NOT NULL
          AND COALESCE(
              (n.bot_config->'flujos_activos'->>'calificacion')::boolean,
              (n.bot_config->'flujos_activos'->>'fidelizacion')::boolean,
              (n.recursos_saas->'automatizaciones'->>'calificacion_activa')::boolean,
              (n.recursos_saas->'automatizaciones'->>'post_cita_activo')::boolean,
              true
          ) = true
    LOOP
        FOR v_cand IN
            SELECT * FROM public.get_candidatos_calificacion_post_cita(v_negocio.id)
        LOOP
            BEGIN
                v_delay_ms := (public.calcular_delay_escritura_humana(v_cand.mensaje_texto) * 1000)::integer;

                INSERT INTO public.cola_mensajes_salientes (
                    business_id, cliente_id, cita_id, telefono,
                    flujo, mensaje, delay_ms,
                    instance_name, api_key,
                    estado, proximo_intento_at,
                    metadata
                ) VALUES (
                    v_negocio.id,
                    v_cand.cliente_id,
                    v_cand.cita_id,
                    v_cand.telefono_cliente,
                    'calificacion_encuesta',
                    v_cand.mensaje_texto,
                    v_delay_ms,
                    v_cand.instance_name,
                    v_cand.api_key,
                    'pendiente',
                    now(),
                    jsonb_build_object(
                        'servicio', v_cand.servicio_realizado,
                        'canal', 'calificacion_encuesta'
                    )
                )
                ON CONFLICT DO NOTHING;

                -- Marcar cita como encuesta enviada
                UPDATE public."Citas"
                SET encuesta_enviada = true,
                    fecha_encuesta_enviada = now(),
                    updated_at = now()
                WHERE id = v_cand.cita_id;

                -- Blindaje Multi-servicio mismo día:
                -- Marcar las otras citas completadas de esta clienta en la misma fecha para no enviar encuesta duplicada
                UPDATE public."Citas"
                SET encuesta_enviada = true,
                    fecha_encuesta_enviada = now(),
                    updated_at = now()
                WHERE cliente_id = v_cand.cliente_id
                  AND business_id = v_negocio.id
                  AND id <> v_cand.cita_id
                  AND fecha::date = (SELECT c_orig.fecha::date FROM public."Citas" c_orig WHERE c_orig.id = v_cand.cita_id)
                  AND estado ILIKE 'completada';

                v_encolados := v_encolados + 1;
            EXCEPTION WHEN OTHERS THEN
                RAISE WARNING 'encolar_calificacion_post_cita - cita %: %', v_cand.cita_id, SQLERRM;
            END;
        END LOOP;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'encolados', v_encolados,
        'timestamp', now()
    );
END;
$function$;
`);
  console.log('encolar_calificacion_post_cita blindado exitosamente.');

  console.log('3. Blindando get_candidatos_encuesta_fidelizacion...');
  await client.query(`
CREATE OR REPLACE FUNCTION public.get_candidatos_encuesta_fidelizacion(p_business_id uuid)
 RETURNS TABLE(cita_id bigint, cliente_id bigint, nombre_cliente text, telefono_cliente text, servicio_realizado text, nombre_negocio text, instance_name text, api_key text, mensaje_texto text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_hora_actual  time;
    v_negocio      record;
    v_ie           record;
BEGIN
    SELECT * INTO v_negocio FROM public.negocios WHERE id = p_business_id;
    IF NOT FOUND OR v_negocio.activo = false THEN
        RETURN;
    END IF;

    IF COALESCE(
        (v_negocio.bot_config->'flujos_activos'->>'fidelizacion')::boolean,
        (v_negocio.bot_config->'flujos_activos'->>'calificacion')::boolean,
        (v_negocio.recursos_saas->'automatizaciones'->>'calificacion_activa')::boolean,
        (v_negocio.recursos_saas->'automatizaciones'->>'post_cita_activo')::boolean,
        true
    ) = false THEN
        RETURN;
    END IF;

    SELECT ie.instance_name, ie.api_key INTO v_ie
    FROM public.instancias_evolution ie
    WHERE ie.business_id = p_business_id
      AND ie.status = 'conectado'
      AND ie.instance_name IS NOT NULL
      AND ie.api_key IS NOT NULL
    LIMIT 1;

    IF NOT FOUND THEN RETURN; END IF;

    v_hora_actual := (now() AT TIME ZONE COALESCE(v_negocio.timezone, 'America/Lima'))::time;
    IF v_hora_actual < '10:00:00'::time OR v_hora_actual > '20:30:00'::time THEN
        RETURN;
    END IF;

    RETURN QUERY
    WITH
    negocio_prefijo(prefijo) AS (
        SELECT CASE LOWER(COALESCE(v_negocio.pais, 'peru'))
            WHEN 'peru'      THEN '51'
            WHEN 'perú'     THEN '51'
            WHEN 'pe'        THEN '51'
            WHEN 'colombia'  THEN '57'
            WHEN 'co'        THEN '57'
            WHEN 'mexico'    THEN '52'
            WHEN 'méxico'   THEN '52'
            WHEN 'mx'        THEN '52'
            WHEN 'chile'     THEN '56'
            WHEN 'cl'        THEN '56'
            WHEN 'ecuador'   THEN '593'
            WHEN 'ec'        THEN '593'
            WHEN 'venezuela' THEN '58'
            WHEN 've'        THEN '58'
            WHEN 'argentina' THEN '54'
            WHEN 'ar'        THEN '54'
            WHEN 'bolivia'   THEN '591'
            WHEN 'bo'        THEN '591'
            ELSE '51'
        END
    ),
    candidatos AS (
        SELECT
            c.id AS cid,
            c.cliente_id AS clid,
            COALESCE(
                NULLIF(TRIM(public.extraer_primer_nombre(cl.nombre)), ''),
                'amiga'
            ) AS n_cliente_limpio,
            CASE
                WHEN LENGTH(REGEXP_REPLACE(cl.telefono, '[^0-9]', '', 'g')) BETWEEN 8 AND 10
                THEN (SELECT np.prefijo FROM negocio_prefijo np)
                     || REGEXP_REPLACE(cl.telefono, '[^0-9]', '', 'g')
                ELSE REGEXP_REPLACE(cl.telefono, '[^0-9]', '', 'g')
            END AS t_cliente_limpio,
            COALESCE(c.servicio, 'tu servicio') AS s_nombre,
            v_negocio.nombre AS neg_nombre,
            v_ie.instance_name AS i_name,
            v_ie.api_key AS i_key,
            COALESCE(c.hora_fin, c.fecha + INTERVAL '90 minutes') AS f_estimado,
            CASE
                WHEN COALESCE(c.hora_fin, c.fecha + INTERVAL '90 minutes') >= (NOW() - INTERVAL '6 hours')
                THEN 'hoy'
                WHEN COALESCE(c.hora_fin, c.fecha + INTERVAL '90 minutes') >= (NOW() - INTERVAL '24 hours')
                THEN 'hace unas horas'
                ELSE 'recientemente'
            END AS rel_tiempo
        FROM public."Citas" c
        JOIN public."Clientes" cl ON cl.id = c.cliente_id
        WHERE c.business_id = p_business_id
          AND c.estado ILIKE 'completada'
          AND (c.encuesta_enviada IS NULL OR c.encuesta_enviada = false)
          AND COALESCE(c.hora_fin, c.fecha + INTERVAL '90 minutes') <= (NOW() - INTERVAL '30 minutes')
          AND COALESCE(c.hora_fin, c.fecha + INTERVAL '90 minutes') >= (NOW() - INTERVAL '48 hours')
          AND cl."Estado" = 'Activo'
          AND (cl.acepta_marketing IS NULL OR cl.acepta_marketing = true)
          AND (
              cl.bot_pausado IS NULL
              OR cl.bot_pausado = false
              OR (cl.bot_pausado_hasta IS NOT NULL AND cl.bot_pausado_hasta < NOW())
          )
          AND cl.telefono IS NOT NULL
          -- Cooldown estricto 24h
          AND NOT EXISTS (
              SELECT 1 FROM public.mensajes m
              WHERE m.cliente_id = c.cliente_id
                AND m.business_id = p_business_id
                AND m.created_at >= (NOW() - INTERVAL '24 hours')
                AND (
                    m.campana_origen IN (
                        'campana_masiva', 'rescate_45d', 'rescate_75d',
                        'rescate_120d', 'fidelizacion_encuesta', 'post_cita_fidelizacion',
                        'calificacion_encuesta', 'encuesta_fidelizacion'
                    )
                    OR m.contenido ILIKE '%¿cómo te sentiste con la atención?%'
                    OR m.contenido ILIKE '%¿cómo calificarías tu atención%'
                )
          )
          -- Esperar si tiene otra cita hoy pendiente
          AND NOT EXISTS (
              SELECT 1 FROM public."Citas" c_futura
              WHERE c_futura.cliente_id = c.cliente_id
                AND c_futura.business_id = p_business_id
                AND c_futura.id <> c.id
                AND c_futura.fecha::date = c.fecha::date
                AND c_futura.estado NOT IN ('Cancelada', 'No Asistio', 'completada')
          )
        ORDER BY c.fecha ASC
        LIMIT 10
    )
    SELECT
        c.cid AS cita_id,
        c.clid AS cliente_id,
        c.n_cliente_limpio AS nombre_cliente,
        c.t_cliente_limpio AS telefono_cliente,
        c.s_nombre AS servicio_realizado,
        c.neg_nombre AS nombre_negocio,
        c.i_name AS instance_name,
        c.i_key AS api_key,
        '🌸 Qué alegría haberte tenido con nosotras.\n\nUna preguntita rápida... del 1 al 5, ¿cómo te sentiste con la atención? (Responde solo con el número porfa) 👇' AS mensaje_texto
    FROM candidatos c;
END;
$function$;
`);
  console.log('get_candidatos_encuesta_fidelizacion blindado exitosamente.');

  await client.end();
}

run().catch(console.error);
