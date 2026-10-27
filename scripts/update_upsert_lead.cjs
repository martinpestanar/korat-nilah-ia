const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();

  console.log('1. Updating upsert_lead_entrante...');
  await client.query(`
    CREATE OR REPLACE FUNCTION public.upsert_lead_entrante(
      p_business_id uuid,
      p_telefono text,
      p_push_name text DEFAULT NULL::text,
      p_origen text DEFAULT 'whatsapp'::text
    )
    RETURNS jsonb
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $function$
    DECLARE
      v_cliente RECORD;
      v_nombre_inicial TEXT;
      v_cliente_existente_id bigint;
      v_clean_phone TEXT;
      v_is_lid boolean := false;
    BEGIN
      IF p_telefono IS NULL OR TRIM(p_telefono) = '' THEN
        RAISE EXCEPTION 'El teléfono no puede estar vacío';
      END IF;

      v_clean_phone := regexp_replace(p_telefono, '\\D', '', 'g');
      IF p_telefono LIKE '%@lid' OR length(v_clean_phone) > 13 THEN
        v_is_lid := true;
      END IF;

      -- 1. Buscar si ya existe por whatsapp_lid o por teléfono (o coincidencia de 9 dígitos)
      SELECT id INTO v_cliente_existente_id
      FROM public."Clientes"
      WHERE business_id = p_business_id
        AND (
          whatsapp_lid = p_telefono
          OR whatsapp_lid = v_clean_phone
          OR telefono = p_telefono
          OR telefono = v_clean_phone
          OR (length(v_clean_phone) >= 9 AND length(v_clean_phone) <= 13 AND regexp_replace(telefono, '\\D', '', 'g') LIKE '%' || right(v_clean_phone, 9))
        )
      ORDER BY total_visitas DESC NULLS LAST, id ASC
      LIMIT 1;

      -- 2. BLINDAJE LID / MULTI-DEVICE / COMPANION:
      -- Si es un identificador LID y no se encontró por teléfono:
      IF v_cliente_existente_id IS NULL AND v_is_lid THEN
        -- a) Buscar si enviamos un mensaje saliente a algún cliente en este negocio en los últimos 45 minutos
        SELECT m.cliente_id INTO v_cliente_existente_id
        FROM public.mensajes m
        WHERE m.business_id = p_business_id
          AND m.direccion = 'saliente'
          AND m.created_at >= NOW() - INTERVAL '45 minutes'
        ORDER BY m.created_at DESC
        LIMIT 1;

        -- b) Si no hay mensaje saliente reciente, buscar por coincidencia de push_name
        IF v_cliente_existente_id IS NULL AND p_push_name IS NOT NULL AND TRIM(p_push_name) <> '' AND LOWER(TRIM(p_push_name)) NOT IN ('cliente', 'usuario', 'null', 'undefined') THEN
          SELECT id INTO v_cliente_existente_id
          FROM public."Clientes"
          WHERE business_id = p_business_id
            AND (LOWER(nombre) = LOWER(TRIM(p_push_name)) OR LOWER(push_name) = LOWER(TRIM(p_push_name)))
          ORDER BY total_visitas DESC NULLS LAST, id ASC
          LIMIT 1;
        END IF;
      END IF;

      -- 3. Si ya existe, actualizamos su interacción y su push_name/whatsapp_lid
      IF v_cliente_existente_id IS NOT NULL THEN
        UPDATE public."Clientes"
        SET 
          ultima_interaccion = NOW(),
          whatsapp_lid = CASE WHEN v_is_lid THEN COALESCE(v_clean_phone, p_telefono) ELSE whatsapp_lid END,
          push_name = COALESCE(NULLIF(TRIM(p_push_name), ''), push_name),
          nombre = CASE 
            WHEN nombre IS NULL OR nombre = 'Cliente WhatsApp' OR nombre LIKE 'Prospecto%' 
            THEN COALESCE(NULLIF(TRIM(p_push_name), ''), nombre)
            ELSE nombre 
          END
        WHERE id = v_cliente_existente_id
        RETURNING * INTO v_cliente;

        RETURN to_jsonb(v_cliente);
      END IF;

      -- 4. Si no existe, insertamos con ON CONFLICT para proteger contra concurrencia
      v_nombre_inicial := NULLIF(TRIM(COALESCE(p_push_name, '')), '');
      IF v_nombre_inicial IS NULL OR v_nombre_inicial = 'Cliente' THEN
        v_nombre_inicial := 'Cliente WhatsApp';
      END IF;

      INSERT INTO public."Clientes" (
        business_id,
        telefono,
        whatsapp_lid,
        push_name,
        nombre,
        "Estado",
        origen_captacion,
        ultima_interaccion,
        fecha,
        total_visitas,
        acepta_marketing
      )
      VALUES (
        p_business_id,
        p_telefono,
        CASE WHEN v_is_lid THEN COALESCE(v_clean_phone, p_telefono) ELSE NULL END,
        p_push_name,
        v_nombre_inicial,
        'Potencial',
        COALESCE(p_origen, 'whatsapp'),
        NOW(),
        NOW(),
        0,
        true
      )
      ON CONFLICT (telefono, business_id) DO UPDATE
      SET
        ultima_interaccion = NOW(),
        whatsapp_lid = CASE WHEN EXCLUDED.whatsapp_lid IS NOT NULL THEN EXCLUDED.whatsapp_lid ELSE public."Clientes".whatsapp_lid END,
        push_name = COALESCE(NULLIF(TRIM(EXCLUDED.push_name), ''), public."Clientes".push_name),
        nombre = CASE 
          WHEN public."Clientes".nombre IS NULL OR public."Clientes".nombre = 'Cliente WhatsApp' OR public."Clientes".nombre LIKE 'Prospecto%' 
          THEN COALESCE(NULLIF(TRIM(EXCLUDED.push_name), ''), public."Clientes".nombre)
          ELSE public."Clientes".nombre 
        END
      RETURNING * INTO v_cliente;

      RETURN to_jsonb(v_cliente);
    END;
    $function$;
  `);
  console.log('upsert_lead_entrante updated successfully.');

  await client.end();
}

run().catch(console.error);
