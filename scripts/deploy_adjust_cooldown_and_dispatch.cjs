const { Client } = require('pg');

const connectionString = 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log("=== 1. DESPLEGANDO FUNCION encolar_cumpleanos CON COOLDOWN 12H Y TABLAS REALES ===");

  await client.query(`
CREATE OR REPLACE FUNCTION public.encolar_cumpleanos()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_total_encolados INT := 0;
  v_negocio RECORD;
  v_cliente RECORD;
  v_mensaje TEXT;
  v_primer_nombre TEXT;
  v_telefono_limpio TEXT;
  v_hoy DATE;
  v_dias_anticipacion INT := 6;
  v_dias_faltantes INT;
  v_expira TIMESTAMPTZ;
  v_sellos_actuales INT;
  v_hito_objetivo INT;
  v_sellos_regalo INT;
  v_sellos_post INT;
  v_premio_nombre TEXT;
  v_card_url TEXT;
  v_media_premio_url TEXT;
  v_ya_estaba_a_uno BOOLEAN := FALSE;
  v_roadmap_rec RECORD;
  v_delay_ms INT;
  v_cita_futura RECORD;
BEGIN
  FOR v_negocio IN
    SELECT 
      n.id, 
      n.nombre, 
      n.pais,
      n.timezone,
      n.bot_config, 
      n.recursos_saas,
      ie.instance_name,
      ie.api_key,
      n.slug
    FROM public.negocios n
    JOIN public.instancias_evolution ie ON ie.business_id = n.id AND ie.status = 'conectado'
    WHERE n.activo = true
      AND (
        (n.recursos_saas->'sellos_addons'->>'cumpleanos_vip')::boolean IS TRUE
        OR (n.recursos_saas->'sellos_addons'->>'cumpleanos')::boolean IS TRUE
        OR (n.recursos_saas->'automatizaciones'->>'permitir_cumpleanos')::boolean IS TRUE
        OR (n.bot_config->'flujos_activos'->>'cumpleanos')::boolean IS TRUE
      )
  LOOP
    IF v_negocio.instance_name IS NULL OR v_negocio.api_key IS NULL THEN
      CONTINUE;
    END IF;

    -- Fecha local del negocio
    v_hoy := (now() AT TIME ZONE COALESCE(v_negocio.timezone, 'America/Lima'))::date;

    -- Días de anticipación configurados (por defecto 6)
    v_dias_anticipacion := COALESCE(
      (v_negocio.bot_config->'cumpleanos_config'->>'dias_anticipacion')::int,
      6
    );

    -- =========================================================================
    -- TIEMPO 1: Anticipado (Ventana Flotante de 2 a v_dias_anticipacion días)
    -- =========================================================================
    FOR v_cliente IN
      SELECT c.id, c.nombre, c.telefono, c.cumpleanos,
             public.fn_dias_para_cumpleanos(c.cumpleanos, v_hoy) as dias_para_cumple
      FROM public."Clientes" c
      WHERE c.business_id = v_negocio.id
        AND c.telefono IS NOT NULL
        AND c.cumpleanos IS NOT NULL
        AND public.fn_dias_para_cumpleanos(c.cumpleanos, v_hoy) BETWEEN 2 AND v_dias_anticipacion
        -- Cooldown inteligente de 12 horas: Respeta el descanso nocturno tras una interacción reciente
        AND NOT EXISTS (
          SELECT 1 FROM public.mensajes m
          WHERE m.cliente_id = c.id
            AND m.created_at >= (now() - interval '12 hours')
        )
        AND NOT EXISTS (
          SELECT 1 FROM public.cola_mensajes_salientes q
          WHERE q.cliente_id = c.id
            AND q.created_at >= (now() - interval '12 hours')
        )
        -- Candado anual: Solo 1 mensaje anticipado en los últimos 300 días
        AND NOT EXISTS (
          SELECT 1 FROM public.mensajes m
          WHERE m.business_id = v_negocio.id
            AND m.cliente_id = c.id
            AND m.campana_origen = 'cumpleanos_anticipado'
            AND m.created_at >= (now() - interval '300 days')
        )
        AND NOT EXISTS (
          SELECT 1 FROM public.cola_mensajes_salientes q
          WHERE q.business_id = v_negocio.id
            AND q.cliente_id = c.id
            AND q.flujo = 'cumpleanos_anticipado'
            AND q.created_at >= (now() - interval '300 days')
        )
    LOOP
      v_telefono_limpio := public.fn_sanitizar_y_resolver_telefono_cliente(
        v_negocio.id, v_cliente.id, v_cliente.telefono, v_cliente.nombre, v_negocio.pais
      );
      IF v_telefono_limpio IS NULL THEN
        CONTINUE;
      END IF;

      v_primer_nombre := public.extraer_primer_nombre(COALESCE(v_cliente.nombre, 'linda'));
      v_sellos_actuales := public.fn_sellos_activos(v_cliente.id, v_negocio.id);
      v_dias_faltantes := v_cliente.dias_para_cumple;

      -- Verificar si la clienta YA tiene una cita agendada en los próximos días
      SELECT id, fecha, servicio INTO v_cita_futura
      FROM public."Citas"
      WHERE cliente_id = v_cliente.id
        AND business_id = v_negocio.id
        AND estado IN ('Pendiente', 'Confirmada')
        AND (fecha AT TIME ZONE COALESCE(v_negocio.timezone, 'America/Lima'))::date >= v_hoy
        AND (fecha AT TIME ZONE COALESCE(v_negocio.timezone, 'America/Lima'))::date <= (v_hoy + v_dias_faltantes)
      ORDER BY fecha ASC
      LIMIT 1;

      -- Determinar hito objetivo en el roadmap
      SELECT r.id, r.hito_sello, r.nombre INTO v_roadmap_rec
      FROM public.sellos_roadmap r
      WHERE r.business_id = v_negocio.id AND r.activo = true AND r.hito_sello > v_sellos_actuales
      ORDER BY r.hito_sello ASC
      LIMIT 1;

      IF v_roadmap_rec.hito_sello IS NOT NULL THEN
        v_hito_objetivo := v_roadmap_rec.hito_sello;
        v_premio_nombre := v_roadmap_rec.nombre;
      ELSE
        SELECT r.id, r.hito_sello, r.nombre INTO v_roadmap_rec
        FROM public.sellos_roadmap r
        WHERE r.business_id = v_negocio.id AND r.activo = true
        ORDER BY r.hito_sello DESC
        LIMIT 1;
        v_hito_objetivo := COALESCE(v_roadmap_rec.hito_sello, 4);
        v_premio_nombre := COALESCE(v_roadmap_rec.nombre, 'Regalo VIP');
      END IF;

      v_media_premio_url := 'https://cfggpqpbqqeavdbdzwoz.supabase.co/storage/v1/object/public/nilah_assets/club-glow-prizes/premio_hito_' || v_hito_objetivo || '.jpg';
      v_card_url := 'https://koratflow.agency/club/' || COALESCE(v_negocio.slug, v_negocio.id::text) || '?c=' || v_cliente.id;
      v_expira := now() + interval '3 months';

      -- =======================================================================
      -- EVALUACIÓN DE CASO: VERSIÓN B (PREMIO DESBLOQUEADO) VS VERSIÓN A (IMPULSO)
      -- =======================================================================
      IF v_sellos_actuales >= (v_hito_objetivo - 1) THEN
        v_ya_estaba_a_uno := TRUE;
        v_sellos_regalo := 1;
        v_sellos_post := v_hito_objetivo;

        INSERT INTO public.sellos_movimientos (
          business_id, cliente_id, cantidad, motivo, total_post, notas, expira_en
        ) VALUES (
          v_negocio.id, v_cliente.id, 1, 'cumpleanos', v_sellos_post, 'Regalo de cumpleaños VIP (Completar Hito)', v_expira
        );

        INSERT INTO public.sellos_premios_ganados (
          business_id, cliente_id, roadmap_id, codigo_canje, estado, ganado_en, expira_en, notas
        ) VALUES (
          v_negocio.id, v_cliente.id, v_roadmap_rec.id, 'GLOW-CUMPLE-' || upper(substr(md5(random()::text), 1, 6)), 'pendiente', now(), v_expira, 'Premio desbloqueado por cumpleaños VIP'
        );

        IF v_cita_futura.id IS NOT NULL THEN
          v_mensaje := '¡Se acerca tu cumple, *' || v_primer_nombre || '*! 🎂✨' || E'\n\n' ||
            '¡Completaste tu tarjeta con nuestro regalo VIP y *desbloqueaste tu premio*: *' || v_premio_nombre || '*! 🎁' || E'\n\n' ||
            '✨ *Vimos que ya tienes cita agendada.* ¡Tu regalo te espera listo en recepción para engreírte! 💖';
        ELSE
          v_mensaje := '¡Se acerca tu cumple, *' || v_primer_nombre || '*! 🎂✨' || E'\n\n' ||
            '¡Completaste tu tarjeta con nuestro regalo VIP y *desbloqueaste tu premio*: *' || v_premio_nombre || '*! 🎁' || E'\n\n' ||
            'Ven a visitarnos en estos días y pide tu regalo en recepción. ¡Queremos engreírte como te mereces! 💖';
        END IF;

        v_delay_ms := floor(random() * (12000 - 3000 + 1) + 3000)::int;

        INSERT INTO public.cola_mensajes_salientes (
          business_id, cliente_id, telefono, flujo, mensaje,
          media_url, media_type, instance_name, api_key, delay_ms, metadata
        ) VALUES (
          v_negocio.id, v_cliente.id, v_telefono_limpio, 'cumpleanos_anticipado',
          v_mensaje, v_media_premio_url, 'image', v_negocio.instance_name, v_negocio.api_key,
          v_delay_ms, jsonb_build_object(
            'tipo', 'cumpleanos_anticipado_premio',
            'dias_faltantes', v_dias_faltantes,
            'premio', v_premio_nombre,
            'hito', v_hito_objetivo,
            'cita_futura_id', v_cita_futura.id
          )
        );
      ELSE
        -- VERSIÓN A: Impulso (sellos faltantes para quedar a exactamente 1 sello)
        v_ya_estaba_a_uno := FALSE;
        v_sellos_regalo := (v_hito_objetivo - 1) - v_sellos_actuales;
        IF v_sellos_regalo < 1 THEN
          v_sellos_regalo := 1;
        END IF;
        v_sellos_post := v_sellos_actuales + v_sellos_regalo;

        INSERT INTO public.sellos_movimientos (
          business_id, cliente_id, cantidad, motivo, total_post, notas, expira_en
        ) VALUES (
          v_negocio.id, v_cliente.id, v_sellos_regalo, 'cumpleanos', v_sellos_post, 'Regalo de cumpleaños VIP (Impulso)', v_expira
        );

        IF v_cita_futura.id IS NOT NULL THEN
          v_mensaje := '¡Se acerca tu cumple, *' || v_primer_nombre || '*! 🎂✨' || E'\n\n' ||
            'Te adelantamos *' || v_sellos_regalo || ' sellos VIP* 🎁 ¡Ya estás en *' || v_sellos_post || ' de ' || v_hito_objetivo || ' sellos*, a solo 1 de tu premio: *' || v_premio_nombre || '*!' || E'\n\n' ||
            '✨ *Vimos que ya tienes cita agendada.* ¡En tu visita completas tu último sello y te llevas tu regalo! 🌸' || E'\n\n' ||
            '📲 *Tu tarjeta en vivo:* ' || v_card_url;
        ELSE
          v_mensaje := '¡Se acerca tu cumple, *' || v_primer_nombre || '*! 🎂✨' || E'\n\n' ||
            'Te adelantamos *' || v_sellos_regalo || ' sellos VIP* 🎁 ¡Ya estás en *' || v_sellos_post || ' de ' || v_hito_objetivo || ' sellos*, a solo 1 de tu premio: *' || v_premio_nombre || '*!' || E'\n\n' ||
            'Ven en estos días para ganar tu último sello y disfrutar tu premio 🌸' || E'\n\n' ||
            '📲 *Tu tarjeta en vivo:* ' || v_card_url;
        END IF;

        v_delay_ms := floor(random() * (12000 - 3000 + 1) + 3000)::int;

        INSERT INTO public.cola_mensajes_salientes (
          business_id, cliente_id, telefono, flujo, mensaje,
          media_url, media_type, instance_name, api_key, delay_ms, metadata
        ) VALUES (
          v_negocio.id, v_cliente.id, v_telefono_limpio, 'cumpleanos_anticipado',
          v_mensaje, NULL, NULL, v_negocio.instance_name, v_negocio.api_key,
          v_delay_ms, jsonb_build_object(
            'tipo', 'cumpleanos_anticipado_impulso',
            'dias_faltantes', v_dias_faltantes,
            'sellos_regalados', v_sellos_regalo,
            'hito', v_hito_objetivo,
            'cita_futura_id', v_cita_futura.id
          )
        );
      END IF;

      v_total_encolados := v_total_encolados + 1;
    END LOOP;

    -- =========================================================================
    -- TIEMPO 2: Día D (Día exacto de cumpleaños: dias_para_cumple = 0)
    -- =========================================================================
    FOR v_cliente IN
      SELECT c.id, c.nombre, c.telefono, c.cumpleanos
      FROM public."Clientes" c
      WHERE c.business_id = v_negocio.id
        AND c.telefono IS NOT NULL
        AND c.cumpleanos IS NOT NULL
        AND public.fn_dias_para_cumpleanos(c.cumpleanos, v_hoy) = 0
        AND NOT EXISTS (
          SELECT 1 FROM public.mensajes m
          WHERE m.business_id = v_negocio.id
            AND m.cliente_id = c.id
            AND m.campana_origen = 'cumpleanos_dia_d'
            AND m.created_at >= (now() - interval '300 days')
        )
        AND NOT EXISTS (
          SELECT 1 FROM public.cola_mensajes_salientes q
          WHERE q.business_id = v_negocio.id
            AND q.cliente_id = c.id
            AND q.flujo = 'cumpleanos_dia_d'
            AND q.created_at >= (now() - interval '300 days')
        )
    LOOP
      v_telefono_limpio := public.fn_sanitizar_y_resolver_telefono_cliente(
        v_negocio.id, v_cliente.id, v_cliente.telefono, v_cliente.nombre, v_negocio.pais
      );
      IF v_telefono_limpio IS NULL THEN
        CONTINUE;
      END IF;

      v_primer_nombre := public.extraer_primer_nombre(COALESCE(v_cliente.nombre, 'linda'));

      v_mensaje := '¡Feliz cumpleaños, *' || v_primer_nombre || '*! 🥳🎉🎂' || E'\n\n' ||
        'De parte de todo el equipo de *' || v_negocio.nombre || '*, te deseamos un día maravilloso lleno de amor, sonrisas y momentos lindos.' || E'\n\n' ||
        '¡Gracias por ser parte de nuestra familia! Que la pases increíble hoy 💖✨';

      v_delay_ms := floor(random() * (10000 - 3000 + 1) + 3000)::int;

      INSERT INTO public.cola_mensajes_salientes (
        business_id, cliente_id, telefono, flujo, mensaje,
        media_url, media_type, instance_name, api_key, delay_ms, metadata
      ) VALUES (
        v_negocio.id, v_cliente.id, v_telefono_limpio, 'cumpleanos_dia_d',
        v_mensaje, NULL, NULL, v_negocio.instance_name, v_negocio.api_key,
        v_delay_ms, jsonb_build_object('tipo', 'cumpleanos_dia_d')
      );

      v_total_encolados := v_total_encolados + 1;
    END LOOP;

  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'fecha', v_hoy,
    'encolados', v_total_encolados
  );
END;
$function$;
  `);
  console.log("-> Función public.encolar_cumpleanos actualizada.");

  console.log("\n=== 2. EJECUTANDO encolar_cumpleanos() ===");
  const encolarRes = await client.query("SELECT public.encolar_cumpleanos();");
  console.log("Resultado:", encolarRes.rows[0]);

  console.log("\n=== 3. AUDITORIA DE COLA PARA KAREN NUÑEZ (2445) ===");
  const colaKaren = await client.query(`
    SELECT id, cliente_id, telefono, flujo, estado, mensaje, delay_ms, metadata, created_at
    FROM public.cola_mensajes_salientes
    WHERE cliente_id = 2445 AND estado = 'pendiente';
  `);
  console.log("Mensajes pendientes en cola para Karen:", colaKaren.rows);

  if (colaKaren.rows.length === 1) {
    console.log("\n=== 4. DESPACHANDO COLA SALIENTE CON PROTECCION IDEMPOTENTE ===");
    const despacharRes = await client.query("SELECT public.despachar_cola_mensajes(5);");
    console.log("Resultado despacho:", despacharRes.rows[0]);

    // Esperar 4 segundos para que Evolution API procese y actualice
    await new Promise(r => setTimeout(r, 4500));

    const postDespacho = await client.query(`
      SELECT id, flujo, estado, enviado_at, error_mensaje, created_at
      FROM public.cola_mensajes_salientes
      WHERE cliente_id = 2445 AND flujo = 'cumpleanos_anticipado';
    `);
    console.log("Estado post-despacho en cola:", postDespacho.rows);

    const msgEnviado = await client.query(`
      SELECT id, campana_origen, created_at, contenido
      FROM public.mensajes
      WHERE cliente_id = 2445 AND campana_origen = 'cumpleanos_anticipado';
    `);
    console.log("Registro en tabla mensajes:", msgEnviado.rows);
  }

  console.log("\n=== 5. PRUEBA DE IDEMPOTENCIA (RE-EJECUCIÓN INMEDIATA) ===");
  const reEjecucion = await client.query("SELECT public.encolar_cumpleanos();");
  console.log("Resultado re-ejecución (debe dar 0 encolados):", reEjecucion.rows[0]);

  await client.end();
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
