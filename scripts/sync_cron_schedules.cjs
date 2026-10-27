const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();

  console.log('1. Sincronizando ventana de atención 7am a 10pm en get_candidatos_calificacion_post_cita...');
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

        -- Ventana sincronizada con horario de atención común (7:00 AM a 10:00 PM) según timezone del negocio
        v_hora_actual := (now() AT TIME ZONE COALESCE(v_negocio.timezone, 'America/Lima'))::time;
        IF v_hora_actual < '07:00:00'::time OR v_hora_actual > '22:00:00'::time THEN
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
              AND NOT EXISTS (
                  SELECT 1 FROM public.cola_mensajes_salientes cms
                  WHERE cms.cliente_id = c.cliente_id
                    AND cms.business_id = p_business_id
                    AND cms.created_at >= (NOW() - INTERVAL '24 hours')
                    AND cms.flujo IN ('fidelizacion_encuesta', 'calificacion_encuesta')
              )
              -- Blindaje multi-servicio mismo día: esperar si tiene otra cita pendiente hoy
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

  console.log('2. Sincronizando ventana 7am a 10pm en get_candidatos_encuesta_fidelizacion...');
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
        IF v_hora_actual < '07:00:00'::time OR v_hora_actual > '22:00:00'::time THEN
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

  console.log('3. Ajustando frecuencias en pg_cron: encolar cada 15 min, despachar cada 5 min...');
  // Actualizar cron job 8 (encolar_calificacion_post_cita) a cada 15 min
  await client.query(`
    SELECT cron.unschedule('encolar_calificacion_post_cita');
    SELECT cron.schedule(
      'encolar_calificacion_post_cita',
      '*/15 * * * *',
      'SELECT public.encolar_calificacion_post_cita();'
    );
  `);

  // Actualizar cron job 7 (despachar-cola-outbox) a cada 5 min
  await client.query(`
    SELECT cron.unschedule('despachar-cola-outbox');
    SELECT cron.schedule(
      'despachar-cola-outbox',
      '*/5 * * * *',
      'SELECT public.despachar_cola_mensajes(5);'
    );
  `);

  const jobsRes = await client.query('SELECT jobid, jobname, schedule, command, active FROM cron.job');
  console.log('Cron jobs actualizados:', jobsRes.rows);

  await client.end();
}

run().catch(console.error);
