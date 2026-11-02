const { Client } = require('pg');

const connectionString = 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log("=== INICIANDO DESPLIEGUE: RESOLUCIÓN DE PUNTOS CIEGOS 2 Y 3 ===");

  // =========================================================================
  // 1. PUNTO CIEGO 2: CLASIFICADOR TOLERANTE A ESCALA 10/10 Y EMOJIS (❤️, 🥰)
  // =========================================================================
  console.log("1. Actualizando public.fn_clasificar_respuesta_calificacion...");
  await client.query(`
    CREATE OR REPLACE FUNCTION public.fn_clasificar_respuesta_calificacion(p_texto text)
    RETURNS TABLE(nivel text, nota text)
    LANGUAGE plpgsql
    STABLE
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $function$
    DECLARE
      v_raw text;
      v_norm text;
      v_strict text;
      v_solo_alfanum text;
      v_stars_count int;
      v_hearts_count int;
    BEGIN
      v_raw := TRIM(REPLACE(COALESCE(p_texto, ''), chr(65039), ''));
      IF length(v_raw) = 0 THEN
        RETURN QUERY SELECT 'C'::text, NULL::text;
        RETURN;
      END IF;

      v_norm := LOWER(UNACCENT(v_raw));
      v_strict := TRIM(REGEXP_REPLACE(REGEXP_REPLACE(v_norm, '[.!¡?¿,;:]+', '', 'g'), '[[:space:]]+', ' ', 'g'));
      v_solo_alfanum := TRIM(REGEXP_REPLACE(v_norm, '[^0-9a-z]', '', 'g'));

      -- Contar emojis gráficos puros si no hay texto alfanumérico
      IF length(v_solo_alfanum) = 0 THEN
        v_stars_count := length(v_raw) - length(REPLACE(REPLACE(v_raw, '⭐', ''), '🌟', ''));
        IF v_stars_count BETWEEN 1 AND 5 THEN
          RETURN QUERY SELECT 'A'::text, v_stars_count::text;
          RETURN;
        END IF;

        v_hearts_count := length(v_raw) - length(REPLACE(REPLACE(REPLACE(REPLACE(v_raw, '❤️', ''), '❤', ''), '💖', ''), '💕', ''));
        IF v_hearts_count BETWEEN 1 AND 5 THEN
          RETURN QUERY SELECT 'A'::text, v_hearts_count::text;
          RETURN;
        END IF;
      END IF;

      -- NIVEL A (100% seguro)
      IF length(v_strict) <= 50 THEN
        -- Caso A1: Escala 10/10 -> Equivale a 5 estrellas
        IF v_strict ~ '^(un |una |nota |le doy |le pongo |te doy |mi nota es |es un )?10( ?(/ ?10|de 10|puntos?|pts?|estrellas?|[*]+|⭐|🌟|❤️|💖))?$'
           OR v_strict ~ '^10/10'
           OR v_strict ~ '10/10$'
           OR v_solo_alfanum IN ('10', '1010', 'un10', '10de10') THEN
          RETURN QUERY SELECT 'A'::text, '5'::text;
          RETURN;
        END IF;

        -- Caso A2: Número del 1 al 5 solo (incluso si viene con emojis de afecto, ej: "5 ❤️", "5 🥰")
        IF v_solo_alfanum IN ('1', '2', '3', '4', '5') THEN
          RETURN QUERY SELECT 'A'::text, v_solo_alfanum;
          RETURN;
        END IF;

        -- Caso A3: Número del 1 al 5 acompañado de sufijo estándar de nota
        IF v_strict ~ '^(un |una |nota |le doy |le pongo |te doy |mi nota es |es un )?[1-5]( ?(estrellas?|estrellitas?|pts|puntos|/ ?5|de 5|[*]+|⭐|🌟))?$' THEN
          RETURN QUERY SELECT 'A'::text, substring(v_strict FROM '[1-5]');
          RETURN;
        END IF;

        -- Caso A4: Número del 1 al 5 acompañado de elogio común
        IF v_strict ~ '(^|[^0-9])[1-5]([^0-9]|$)' AND
           v_strict ~* '(exelente|excelente|eselente|ecselente|super|supper|perfecto|perfecta|genial|lindo|linda|bello|bella|divino|divina|hermoso|hermosa|bien|muy bien|bueno|buena|muy buena|muy bueno|gracias|atencion|servicio|todo bien|todo lindo|me encanto|me gusto|estrella)' THEN
          RETURN QUERY SELECT 'A'::text, substring(v_strict FROM '[1-5]');
          RETURN;
        END IF;

        -- Caso A5: Palabras numéricas
        IF v_strict ~ '^(uno|dos|tres|cuatro|cinco)$' THEN
          RETURN QUERY SELECT 'A'::text, (CASE v_strict WHEN 'uno' THEN '1' WHEN 'dos' THEN '2' WHEN 'tres' THEN '3' WHEN 'cuatro' THEN '4' ELSE '5' END);
          RETURN;
        END IF;
      END IF;

      -- NIVEL B (probable): intención de nota / opinión pero SIN número explícito -> se repregunta amablemente
      IF v_norm ~* '(me encanto|me gusto mucho|quedo hermoso|quedo lindo|quedo bello|quedo divino|quedaron bellas|quedaron hermosas|excelente|exelente|eselente|ecselente|espectacular|maravilloso|impecable|perfecto|bellisimo|divino|super bien|las mejores|mejor atencion|muy buena atencion|no me gusto|se me cayo|se salio|se me despego|me dolio|me ardio|me mancho|chueco|mal hecho|demoraron|espere mucho|esperamos mucho|pesimo|mala atencion|no vuelvo|no me atendieron bien)' THEN
        RETURN QUERY SELECT 'B'::text, NULL::text;
        RETURN;
      END IF;
      IF v_norm ~ '(^|[^0-9])[1-5]([^0-9]|$)'
         AND v_norm ~* '(estrella|nota|califico|calificacion|puntos|pongo|doy|de 5|/ ?5|del 1 al 5|un [1-5]([^0-9]|$))' THEN
        RETURN QUERY SELECT 'B'::text, NULL::text;
        RETURN;
      END IF;

      -- NIVEL C: cualquier otra cosa (conversación normal) -> se ignora para calificar
      RETURN QUERY SELECT 'C'::text, NULL::text;
    END;
    $function$;
  `);
  console.log("   -> public.fn_clasificar_respuesta_calificacion actualizada.");

  // =========================================================================
  // 2. PUNTO CIEGO 3: AUTO-RECUPERACIÓN DE TELÉFONOS EN CHATS DE CLIENTES LID (CON MERGE SEGURO)
  // =========================================================================
  console.log("2. Actualizando public.fn_sanitizar_y_resolver_telefono_cliente...");
  await client.query(`
    CREATE OR REPLACE FUNCTION public.fn_sanitizar_y_resolver_telefono_cliente(
        p_business_id uuid,
        p_cliente_id bigint,
        p_telefono_raw text,
        p_nombre_cliente text,
        p_pais text DEFAULT 'peru'::text
    )
    RETURNS text
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $function$
    DECLARE
        v_clean text;
        v_prefijo text;
        v_alt_telefono text;
        v_alt_cliente_id bigint;
        v_dup_id bigint;
    BEGIN
        IF p_telefono_raw IS NULL OR TRIM(p_telefono_raw) = '' THEN
            RETURN NULL;
        END IF;

        -- Obtener prefijo de país (default '51' Perú)
        v_prefijo := CASE LOWER(COALESCE(p_pais, 'peru'))
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
        END;

        -- 1. Limpiar caracteres no numéricos
        v_clean := REGEXP_REPLACE(p_telefono_raw, '[^0-9]', '', 'g');

        -- 2. DETECCIÓN DE LID (WhatsApp Linked ID > 13 dígitos o contiene @lid)
        IF LENGTH(v_clean) > 13 OR p_telefono_raw ILIKE '%@lid%' THEN
            -- Búsqueda A: Duplicado en el mismo negocio por nombre normalizado o whatsapp_lid previo
            SELECT cl2.id, REGEXP_REPLACE(cl2.telefono, '[^0-9]', '', 'g')
            INTO v_alt_cliente_id, v_alt_telefono
            FROM public."Clientes" cl2
            WHERE cl2.business_id = p_business_id
              AND cl2.id <> p_cliente_id
              AND cl2.telefono IS NOT NULL
              AND LENGTH(REGEXP_REPLACE(cl2.telefono, '[^0-9]', '', 'g')) BETWEEN 8 AND 13
              AND (
                LOWER(TRIM(REGEXP_REPLACE(cl2.nombre, '[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]', '', 'g'))) = 
                LOWER(TRIM(REGEXP_REPLACE(COALESCE(p_nombre_cliente, ''), '[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]', '', 'g')))
                OR cl2.whatsapp_lid = v_clean
              )
            ORDER BY cl2.total_visitas DESC NULLS LAST, cl2.id DESC
            LIMIT 1;

            -- Búsqueda B: ¿El cliente envió su número de teléfono en los mensajes entrantes de su chat?
            IF v_alt_telefono IS NULL AND p_cliente_id IS NOT NULL THEN
                SELECT SUBSTRING(REGEXP_REPLACE(m.contenido, '[^0-9]', '', 'g') FROM '(?:51)?(9[0-9]{8})')
                INTO v_alt_telefono
                FROM public.mensajes m
                WHERE m.cliente_id = p_cliente_id
                  AND m.direccion = 'entrante'
                  AND m.contenido ~ '(^|[^0-9])(?:(?:\\+?51)|(?:51))?[ -]?(9[0-9]{2}[ -]?[0-9]{3}[ -]?[0-9]{3})([^0-9]|$)'
                ORDER BY m.created_at DESC
                LIMIT 1;
            END IF;

            IF v_alt_telefono IS NOT NULL THEN
                -- Formatear con prefijo si falta
                IF v_alt_telefono NOT LIKE (v_prefijo || '%') THEN
                    v_alt_telefono := v_prefijo || v_alt_telefono;
                END IF;

                -- Blindaje de unicidad: comprobar si ya existe otra ficha con ese teléfono
                SELECT id INTO v_dup_id
                FROM public."Clientes"
                WHERE business_id = p_business_id
                  AND telefono = v_alt_telefono
                  AND id <> p_cliente_id
                LIMIT 1;

                IF v_dup_id IS NOT NULL THEN
                    -- Ya existe la ficha oficial: vincular el whatsapp_lid en ella
                    UPDATE public."Clientes"
                    SET whatsapp_lid = COALESCE(whatsapp_lid, v_clean)
                    WHERE id = v_dup_id;
                ELSE
                    -- Actualizar la ficha actual de forma segura
                    BEGIN
                        UPDATE public."Clientes"
                        SET telefono = v_alt_telefono,
                            whatsapp_lid = COALESCE(whatsapp_lid, v_clean)
                        WHERE id = p_cliente_id;
                    EXCEPTION WHEN OTHERS THEN
                    END;
                END IF;

                v_clean := v_alt_telefono;
            ELSE
                -- Es un LID sin número real conocido
                RETURN NULL;
            END IF;
        END IF;

        -- 3. AUTO-NORMALIZACIÓN DE FORMATOS:
        -- a) Remover ceros a la izquierda (ej. '0942999251' -> '942999251')
        IF LENGTH(v_clean) = 10 AND v_clean LIKE '09%' THEN
            v_clean := SUBSTRING(v_clean FROM 2);
        END IF;

        -- b) Remover prefijo duplicado (ej. '5151942999251' -> '51942999251')
        IF LENGTH(v_clean) = 13 AND v_clean LIKE (v_prefijo || v_prefijo || '%') THEN
            v_clean := SUBSTRING(v_clean FROM (LENGTH(v_prefijo) + 1));
        END IF;

        -- c) Si es número local (ej. 9 dígitos en Perú: '942999251'), anteponer prefijo de país
        IF LENGTH(v_clean) BETWEEN 8 AND 10 AND NOT (v_clean LIKE (v_prefijo || '%') AND LENGTH(v_clean) >= 11) THEN
            v_clean := v_prefijo || v_clean;
        END IF;

        -- 4. VALIDACIÓN FINAL:
        IF LENGTH(v_clean) BETWEEN 10 AND 14 THEN
            RETURN v_clean;
        ELSE
            RETURN NULL;
        END IF;
    END;
    $function$;
  `);
  console.log("   -> public.fn_sanitizar_y_resolver_telefono_cliente actualizada.");

  // 3. Ejecutar auto-sanación segura de clientes LID existentes
  console.log("3. Ejecutando auto-sanación segura de clientas con LID existentes...");
  await client.query(`
    DO $$
    DECLARE
        r record;
    BEGIN
        FOR r IN
            SELECT id, business_id, telefono, nombre
            FROM public."Clientes"
            WHERE LENGTH(REGEXP_REPLACE(COALESCE(telefono, ''), '[^0-9]', '', 'g')) > 13
        LOOP
            PERFORM public.fn_sanitizar_y_resolver_telefono_cliente(r.business_id, r.id, r.telefono, r.nombre, 'peru');
        END LOOP;
    END $$;
  `);
  console.log("   -> Auto-sanación completada.");

  // Comprobar clientas sanadas
  const sanados = await client.query(`
    SELECT id, nombre, telefono, whatsapp_lid
    FROM public."Clientes"
    WHERE id IN (2314, 2119, 2175)
  `);
  console.log("   -> Muestra de clientas sanadas:", sanados.rows);

  console.log("=== DESPLIEGUE FINALIZADO CON ÉXITO ===");
  await client.end();
}

main().catch(console.error);
