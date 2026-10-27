const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function main() {
  await client.connect();

  const sql = `
    CREATE OR REPLACE FUNCTION public.fn_reset_cliente_fidelizacion(
        p_business_id uuid,
        p_telefono text
    )
    RETURNS jsonb
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
        v_tel_limpio text;
        v_clientes bigint[];
        v_citas_eliminadas integer := 0;
        v_sellos_eliminados integer := 0;
        v_premios_eliminados integer := 0;
        v_mensajes_eliminados integer := 0;
    BEGIN
        v_tel_limpio := REGEXP_REPLACE(p_telefono, '[^0-9]', '', 'g');
        IF length(v_tel_limpio) = 9 THEN
            v_tel_limpio := '51' || v_tel_limpio;
        END IF;

        -- Localizar IDs de clientes asociados a ese teléfono en este negocio
        SELECT array_agg(id) INTO v_clientes
        FROM public."Clientes"
        WHERE business_id = p_business_id
          AND (
            telefono LIKE '%' || v_tel_limpio || '%'
            OR RIGHT(REGEXP_REPLACE(telefono, '[^0-9]', '', 'g'), 9) = RIGHT(v_tel_limpio, 9)
          );

        IF v_clientes IS NULL OR array_length(v_clientes, 1) = 0 THEN
            RETURN jsonb_build_object(
                'success', false,
                'message', 'No se encontró ningún cliente con ese teléfono en este negocio.'
            );
        END IF;

        -- 1. Limpiar cola de mensajes salientes pendientes o enviados
        DELETE FROM public.cola_mensajes_salientes
        WHERE business_id = p_business_id
          AND (cliente_id = ANY(v_clientes) OR telefono LIKE '%' || RIGHT(v_tel_limpio, 9) || '%');

        -- 2. Limpiar premios ganados
        WITH del_premios AS (
            DELETE FROM public.sellos_premios_ganados
            WHERE business_id = p_business_id AND cliente_id = ANY(v_clientes)
            RETURNING id
        )
        SELECT count(*) INTO v_premios_eliminados FROM del_premios;

        -- 3. Limpiar movimientos de sellos
        WITH del_sellos AS (
            DELETE FROM public.sellos_movimientos
            WHERE business_id = p_business_id AND cliente_id = ANY(v_clientes)
            RETURNING id
        )
        SELECT count(*) INTO v_sellos_eliminados FROM del_sellos;

        -- 4. Limpiar sobrante de sellos
        DELETE FROM public.sellos_sobrante
        WHERE business_id = p_business_id AND cliente_id = ANY(v_clientes);

        -- 5. Limpiar mensajes de chat
        WITH del_msgs AS (
            DELETE FROM public.mensajes
            WHERE business_id = p_business_id AND cliente_id = ANY(v_clientes)
            RETURNING id
        )
        SELECT count(*) INTO v_mensajes_eliminados FROM del_msgs;

        -- 6. Limpiar citas
        WITH del_citas AS (
            DELETE FROM public."Citas"
            WHERE business_id = p_business_id AND cliente_id = ANY(v_clientes)
            RETURNING id
        )
        SELECT count(*) INTO v_citas_eliminadas FROM del_citas;

        -- 7. Resetear ficha del cliente a estado 0 limpio
        UPDATE public."Clientes"
        SET puntos_acumulados = 0,
            puntos_totales_historicos = 0,
            puntos_canjeados = 0,
            fecha_ultimo_canje = NULL,
            total_visitas = 0,
            primera_visita = NULL,
            ultima_visita = NULL,
            bot_pausado = false,
            bot_pausado_hasta = NULL,
            bot_pausado_razon = NULL,
            mensajes_semana = 0,
            club_glow_nivel = 'BRONCE',
            club_glow_ciclos_completados = 0,
            club_glow_ultimo_ciclo_at = NULL,
            acepta_marketing = true,
            "Estado" = 'Activo'
        WHERE id = ANY(v_clientes);

        RETURN jsonb_build_object(
            'success', true,
            'telefono', v_tel_limpio,
            'clientes_afectados', v_clientes,
            'citas_eliminadas', v_citas_eliminadas,
            'sellos_eliminados', v_sellos_eliminados,
            'premios_eliminados', v_premios_eliminados,
            'mensajes_eliminados', v_mensajes_eliminados,
            'mensaje', 'Historial y sellos reseteados a 0 exitosamente.'
        );
    END;
    $$;
  `;

  await client.query(sql);
  console.log('RPC fn_reset_cliente_fidelizacion creada exitosamente.');

  await client.end();
}

main().catch(console.error);
