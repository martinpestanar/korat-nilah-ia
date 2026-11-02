const { Client } = require('pg');

const connectionString = 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log("=== INICIANDO DESPLIEGUE DEL PARSER Y REPARACIÓN DE CUMPLEAÑOS ===");

  // 1. Desplegar función inmutable fn_coincide_dia_mes_cumpleanos
  console.log("1. Desplegando public.fn_coincide_dia_mes_cumpleanos...");
  await client.query(`
    CREATE OR REPLACE FUNCTION public.fn_coincide_dia_mes_cumpleanos(p_cumple_raw text, p_fecha_objetivo date)
    RETURNS boolean
    LANGUAGE plpgsql
    IMMUTABLE
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
    DECLARE
        v_clean text;
        v_parts text[];
        v_dia int;
        v_mes int;
        v_obj_dia int := EXTRACT(DAY FROM p_fecha_objetivo)::int;
        v_obj_mes int := EXTRACT(MONTH FROM p_fecha_objetivo)::int;
    BEGIN
        IF p_cumple_raw IS NULL OR TRIM(p_cumple_raw) = '' THEN
            RETURN false;
        END IF;

        -- Limpiar hora si viene como ISO timestamp (ej: 1994-09-28T00:00:00)
        v_clean := TRIM(SPLIT_PART(p_cumple_raw, 'T', 1));
        v_clean := TRIM(SPLIT_PART(v_clean, ' ', 1));

        -- Caso 1: Formato con guiones (YYYY-MM-DD o DD-MM-YYYY)
        IF v_clean LIKE '%-%' THEN
            v_parts := STRING_TO_ARRAY(v_clean, '-');
            IF ARRAY_LENGTH(v_parts, 1) >= 3 THEN
                -- Si el primer elemento tiene 4 dígitos es YYYY-MM-DD
                IF LENGTH(v_parts[1]) = 4 THEN
                    v_mes := v_parts[2]::int;
                    v_dia := v_parts[3]::int;
                ELSE
                    -- DD-MM-YYYY
                    v_dia := v_parts[1]::int;
                    v_mes := v_parts[2]::int;
                END IF;
            ELSIF ARRAY_LENGTH(v_parts, 1) = 2 THEN
                -- MM-DD o DD-MM
                v_dia := v_parts[1]::int;
                v_mes := v_parts[2]::int;
            END IF;

        -- Caso 2: Formato con barras (DD/MM/YYYY o YYYY/MM/DD)
        ELSIF v_clean LIKE '%/%' THEN
            v_parts := STRING_TO_ARRAY(v_clean, '/');
            IF ARRAY_LENGTH(v_parts, 1) >= 3 THEN
                IF LENGTH(v_parts[1]) = 4 THEN
                    v_mes := v_parts[2]::int;
                    v_dia := v_parts[3]::int;
                ELSE
                    v_dia := v_parts[1]::int;
                    v_mes := v_parts[2]::int;
                END IF;
            ELSIF ARRAY_LENGTH(v_parts, 1) = 2 THEN
                v_dia := v_parts[1]::int;
                v_mes := v_parts[2]::int;
            END IF;
        END IF;

        IF v_dia IS NOT NULL AND v_mes IS NOT NULL THEN
            RETURN (v_dia = v_obj_dia AND v_mes = v_obj_mes);
        END IF;

        RETURN false;
    EXCEPTION WHEN OTHERS THEN
        RETURN false;
    END;
    $$;
  `);
  console.log("   -> public.fn_coincide_dia_mes_cumpleanos creada con éxito.");

  // 2. Actualizar public.encolar_cumpleanos() para usar el parser tolerante y la tabla mensajes
  console.log("2. Actualizando public.encolar_cumpleanos()...");
  await client.query(`
    CREATE OR REPLACE FUNCTION public.encolar_cumpleanos()
    RETURNS jsonb
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $function$
    DECLARE
      v_negocio record;
      v_cliente record;
      v_hoy date;
      v_dias_anticipacion int := 7;
      v_fecha_anticipada date;
      v_plantilla_anticipada text;
      v_plantilla_dia_d text;
      v_mensaje text;
      v_total_encolados int := 0;
      v_instancia record;
      v_delay_ms int;
      v_tel_limpio text;
    BEGIN
      FOR v_negocio IN
        SELECT n.id, n.nombre, n.pais, n.bot_config, n.recursos_saas, n.timezone, n.slug
        FROM public.negocios n
        WHERE n.activo IS TRUE
          AND n.modo_fidelizacion <> 'ninguno'
          AND COALESCE((n.recursos_saas->'sellos_addons'->>'cumpleanos_vip')::boolean, (n.recursos_saas->'sellos_addons'->>'cumpleanos')::boolean, (n.recursos_saas->'automatizaciones'->>'permitir_cumpleanos')::boolean, false) IS TRUE
          AND (
            (n.recursos_saas->'automatizaciones'->'flujos_activos'->>'cumpleanos')::boolean IS TRUE
            OR (n.bot_config->'flujos_activos'->>'cumpleanos')::boolean IS TRUE
          )
      LOOP
        SELECT instance_name, api_key INTO v_instancia
        FROM public.instancias_evolution
        WHERE business_id = v_negocio.id AND status = 'conectado'
        LIMIT 1;

        IF v_instancia.instance_name IS NULL THEN
          CONTINUE;
        END IF;

        -- Zona horaria respetuosa del salón
        v_hoy := (now() AT TIME ZONE COALESCE(v_negocio.timezone, 'America/Lima'))::date;

        v_dias_anticipacion := COALESCE(
          (v_negocio.bot_config->'cumpleanos_config'->>'dias_anticipacion')::int,
          7
        );
        v_fecha_anticipada := v_hoy + v_dias_anticipacion;

        -- Plantilla anticipada
        SELECT contenido INTO v_plantilla_anticipada
        FROM public.plantillas_automatizacion
        WHERE business_id = v_negocio.id
          AND flujo = 'cumpleanos_anticipado'
          AND activo IS TRUE
        LIMIT 1;

        IF v_plantilla_anticipada IS NULL THEN
          SELECT contenido INTO v_plantilla_anticipada
          FROM public.plantillas_automatizacion_globales
          WHERE flujo = 'cumpleanos_anticipado'
          LIMIT 1;
        END IF;

        -- Plantilla día D
        SELECT contenido INTO v_plantilla_dia_d
        FROM public.plantillas_automatizacion
        WHERE business_id = v_negocio.id
          AND flujo = 'cumpleanos_dia_d'
          AND activo IS TRUE
        LIMIT 1;

        IF v_plantilla_dia_d IS NULL THEN
          SELECT contenido INTO v_plantilla_dia_d
          FROM public.plantillas_automatizacion_globales
          WHERE flujo = 'cumpleanos_dia_d'
          LIMIT 1;
        END IF;

        -- 1. Cumpleaños anticipado (ej. 7 días antes)
        IF v_plantilla_anticipada IS NOT NULL THEN
          FOR v_cliente IN
            SELECT c.id, c.nombre, c.telefono, c.cumpleanos
            FROM public."Clientes" c
            WHERE c.business_id = v_negocio.id
              AND c.telefono IS NOT NULL
              AND c.cumpleanos IS NOT NULL
              AND public.fn_coincide_dia_mes_cumpleanos(c.cumpleanos, v_fecha_anticipada) = true
              AND NOT EXISTS (
                SELECT 1 FROM public.mensajes m
                WHERE m.business_id = v_negocio.id
                  AND m.cliente_id = c.id
                  AND m.campana_origen = 'cumpleanos_anticipado'
                  AND EXTRACT(YEAR FROM m.created_at) = EXTRACT(YEAR FROM v_hoy)
              )
              AND NOT EXISTS (
                SELECT 1 FROM public.cola_mensajes_salientes q
                WHERE q.business_id = v_negocio.id
                  AND q.cliente_id = c.id
                  AND q.flujo = 'cumpleanos_anticipado'
                  AND EXTRACT(YEAR FROM q.created_at) = EXTRACT(YEAR FROM v_hoy)
              )
          LOOP
            v_tel_limpio := public.fn_sanitizar_y_resolver_telefono_cliente(v_negocio.id, v_cliente.id, v_cliente.telefono, v_cliente.nombre, v_negocio.pais);
            IF v_tel_limpio IS NOT NULL THEN
              v_mensaje := REPLACE(v_plantilla_anticipada, '{cliente}', public.extraer_primer_nombre(v_cliente.nombre));
              v_mensaje := REPLACE(v_mensaje, '{nombre_cliente}', public.extraer_primer_nombre(v_cliente.nombre));
              v_mensaje := REPLACE(v_mensaje, '{salon}', COALESCE(v_negocio.nombre, 'el salón'));
              v_mensaje := REPLACE(v_mensaje, '{nombre_negocio}', COALESCE(v_negocio.nombre, 'el salón'));
              v_mensaje := REPLACE(v_mensaje, '{dias_faltantes}', v_dias_anticipacion::text);

              v_delay_ms := (public.calcular_delay_escritura_humana(v_mensaje) * 1000)::int;

              INSERT INTO public.cola_mensajes_salientes (
                business_id, cliente_id, telefono, flujo, mensaje,
                instance_name, api_key, delay_ms, estado, metadata
              ) VALUES (
                v_negocio.id, v_cliente.id, v_tel_limpio,
                'cumpleanos_anticipado',
                v_mensaje,
                v_instancia.instance_name, v_instancia.api_key,
                v_delay_ms,
                'pendiente',
                jsonb_build_object('anticipacion_dias', v_dias_anticipacion, 'fecha_cumple', v_cliente.cumpleanos)
              );

              v_total_encolados := v_total_encolados + 1;
            END IF;
          END LOOP;
        END IF;

        -- 2. Cumpleaños día D (hoy)
        IF v_plantilla_dia_d IS NOT NULL THEN
          FOR v_cliente IN
            SELECT c.id, c.nombre, c.telefono, c.cumpleanos
            FROM public."Clientes" c
            WHERE c.business_id = v_negocio.id
              AND c.telefono IS NOT NULL
              AND c.cumpleanos IS NOT NULL
              AND public.fn_coincide_dia_mes_cumpleanos(c.cumpleanos, v_hoy) = true
              AND NOT EXISTS (
                SELECT 1 FROM public.mensajes m
                WHERE m.business_id = v_negocio.id
                  AND m.cliente_id = c.id
                  AND m.campana_origen = 'cumpleanos_dia_d'
                  AND EXTRACT(YEAR FROM m.created_at) = EXTRACT(YEAR FROM v_hoy)
              )
              AND NOT EXISTS (
                SELECT 1 FROM public.cola_mensajes_salientes q
                WHERE q.business_id = v_negocio.id
                  AND q.cliente_id = c.id
                  AND q.flujo = 'cumpleanos_dia_d'
                  AND EXTRACT(YEAR FROM q.created_at) = EXTRACT(YEAR FROM v_hoy)
              )
          LOOP
            v_tel_limpio := public.fn_sanitizar_y_resolver_telefono_cliente(v_negocio.id, v_cliente.id, v_cliente.telefono, v_cliente.nombre, v_negocio.pais);
            IF v_tel_limpio IS NOT NULL THEN
              v_mensaje := REPLACE(v_plantilla_dia_d, '{cliente}', public.extraer_primer_nombre(v_cliente.nombre));
              v_mensaje := REPLACE(v_mensaje, '{nombre_cliente}', public.extraer_primer_nombre(v_cliente.nombre));
              v_mensaje := REPLACE(v_mensaje, '{salon}', COALESCE(v_negocio.nombre, 'el salón'));
              v_mensaje := REPLACE(v_mensaje, '{nombre_negocio}', COALESCE(v_negocio.nombre, 'el salón'));

              v_delay_ms := (public.calcular_delay_escritura_humana(v_mensaje) * 1000)::int;

              INSERT INTO public.cola_mensajes_salientes (
                business_id, cliente_id, telefono, flujo, mensaje,
                instance_name, api_key, delay_ms, estado, metadata
              ) VALUES (
                v_negocio.id, v_cliente.id, v_tel_limpio,
                'cumpleanos_dia_d',
                v_mensaje,
                v_instancia.instance_name, v_instancia.api_key,
                v_delay_ms,
                'pendiente',
                jsonb_build_object('fecha_cumple', v_cliente.cumpleanos)
              );

              v_total_encolados := v_total_encolados + 1;
            END IF;
          END LOOP;
        END IF;

      END LOOP;

      RETURN jsonb_build_object('ok', true, 'encolados', v_total_encolados, 'fecha', v_hoy);
    END;
    $function$;
  `);
  console.log("   -> public.encolar_cumpleanos() actualizada con éxito.");

  // 3. Probar ejecución controlada de public.encolar_cumpleanos()
  console.log("3. Probando ejecución de public.encolar_cumpleanos()...");
  const result = await client.query('SELECT public.encolar_cumpleanos() as res');
  console.log("   -> Resultado de ejecución:", JSON.stringify(result.rows[0].res, null, 2));

  console.log("=== REPARACIÓN COMPLETADA CON ÉXITO ===");
  await client.end();
}

main().catch(console.error);
