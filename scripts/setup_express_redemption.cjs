const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function main() {
  await client.connect();

  console.log('--- CREANDO RPC fn_canjear_premio_express ---');

  const sql = `
    CREATE OR REPLACE FUNCTION public.fn_canjear_premio_express(
        p_business_id uuid,
        p_telefono_o_id text,
        p_usuario_id bigint DEFAULT NULL
    )
    RETURNS jsonb
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
        v_tel_limpio text;
        v_cliente_id bigint;
        v_premio record;
        v_hito record;
        v_cliente record;
        v_negocio record;
        v_inst record;
        v_msg_confirmacion text;
    BEGIN
        v_tel_limpio := REGEXP_REPLACE(p_telefono_o_id, '[^0-9]', '', 'g');

        -- Buscar cliente por ID directo o por teléfono
        IF p_telefono_o_id ~ '^[0-9]+$' AND length(p_telefono_o_id) <= 6 THEN
            SELECT * INTO v_cliente FROM public."Clientes"
            WHERE id = p_telefono_o_id::bigint AND business_id = p_business_id;
        END IF;

        IF v_cliente.id IS NULL THEN
            SELECT * INTO v_cliente FROM public."Clientes"
            WHERE business_id = p_business_id
              AND (
                telefono LIKE '%' || RIGHT(v_tel_limpio, 9) || '%'
                OR RIGHT(REGEXP_REPLACE(telefono, '[^0-9]', '', 'g'), 9) = RIGHT(v_tel_limpio, 9)
              )
            LIMIT 1;
        END IF;

        IF v_cliente.id IS NULL THEN
            RETURN jsonb_build_object(
                'ok', false,
                'error', 'Cliente no encontrado con ese teléfono o ID.'
            );
        END IF;

        v_cliente_id := v_cliente.id;

        -- Buscar premio pendiente más antiguo o próximo a vencer
        SELECT * INTO v_premio
        FROM public.sellos_premios_ganados
        WHERE cliente_id = v_cliente_id
          AND business_id = p_business_id
          AND estado = 'pendiente'
          AND expira_en >= now()
        ORDER BY ganado_en ASC
        LIMIT 1;

        IF v_premio.id IS NULL THEN
            RETURN jsonb_build_object(
                'ok', false,
                'error', 'El cliente no tiene premios pendientes para canjear.'
            );
        END IF;

        -- Marcar premio como canjeado
        UPDATE public.sellos_premios_ganados
        SET estado = 'canjeado',
            canjeado_en = now(),
            canjeado_por = p_usuario_id
        WHERE id = v_premio.id;

        SELECT * INTO v_hito FROM public.sellos_roadmap WHERE id = v_premio.roadmap_id;
        SELECT * INTO v_negocio FROM public.negocios WHERE id = p_business_id;

        -- Opcional: enviar confirmación por WhatsApp a la clienta
        SELECT ie.instance_name, ie.api_key INTO v_inst
        FROM public.instancias_evolution ie
        WHERE ie.business_id = p_business_id AND ie.status = 'conectado'
        LIMIT 1;

        IF v_inst.instance_name IS NOT NULL AND v_cliente.telefono IS NOT NULL THEN
            v_msg_confirmacion := '¡Premio canjeado con éxito en recepción! 🎉 Esperamos que disfrutes tu *' || COALESCE(v_hito.nombre, 'regalo VIP') || '*. ¡Gracias por tu visita y nos vemos pronto para seguir sumando sellitos! 👑✨';

            PERFORM extensions.http((
                'POST',
                'https://evo.koratflow.agency/message/sendText/' || v_inst.instance_name,
                ARRAY[
                    extensions.http_header('apikey', v_inst.api_key),
                    extensions.http_header('Content-Type', 'application/json')
                ],
                'application/json',
                jsonb_build_object(
                    'number', v_cliente.telefono,
                    'text', v_msg_confirmacion,
                    'linkPreview', false
                )::text
            )::extensions.http_request);
        END IF;

        RETURN jsonb_build_object(
            'ok', true,
            'cliente_id', v_cliente_id,
            'cliente_nombre', v_cliente.nombre,
            'premio_id', v_premio.id,
            'premio_nombre', v_hito.nombre,
            'codigo_canje', v_premio.codigo_canje,
            'mensaje', '¡Premio ' || v_hito.nombre || ' canjeado exitosamente!'
        );
    END;
    $$;

    -- Función auxiliar para listar premios pendientes con datos del cliente
    CREATE OR REPLACE FUNCTION public.get_premios_pendientes_canje(p_business_id uuid)
    RETURNS TABLE (
        premio_id bigint,
        codigo_canje text,
        ganado_en timestamptz,
        expira_en timestamptz,
        cliente_id bigint,
        cliente_nombre text,
        cliente_telefono text,
        premio_nombre text,
        hito_sello integer
    )
    LANGUAGE sql
    SECURITY DEFINER
    AS $$
        SELECT 
            spg.id AS premio_id,
            spg.codigo_canje,
            spg.ganado_en,
            spg.expira_en,
            cl.id AS cliente_id,
            cl.nombre AS cliente_nombre,
            cl.telefono AS cliente_telefono,
            sr.nombre AS premio_nombre,
            sr.hito_sello
        FROM public.sellos_premios_ganados spg
        JOIN public."Clientes" cl ON cl.id = spg.cliente_id
        JOIN public.sellos_roadmap sr ON sr.id = spg.roadmap_id
        WHERE spg.business_id = p_business_id
          AND spg.estado = 'pendiente'
          AND spg.expira_en >= now()
        ORDER BY spg.ganado_en DESC;
    $$;
  `;

  await client.query(sql);
  console.log('RPCs fn_canjear_premio_express y get_premios_pendientes_canje creadas.');

  await client.end();
}

main().catch(console.error);
