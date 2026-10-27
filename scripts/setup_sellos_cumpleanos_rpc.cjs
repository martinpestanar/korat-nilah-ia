const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  
  // 1. Agregar columnas a sellos_config si no existen (whatsapp_template, acelerador_martes, acelerador_ticket_alto)
  await client.query(`
    ALTER TABLE sellos_config 
    ADD COLUMN IF NOT EXISTS whatsapp_template text,
    ADD COLUMN IF NOT EXISTS acelerador_martes boolean DEFAULT true,
    ADD COLUMN IF NOT EXISTS acelerador_ticket_alto boolean DEFAULT true;
  `);
  console.log('✓ Columnas agregadas/verificadas en sellos_config');

  // 2. Crear la función RPC fn_calcular_sellos_regalo_cumpleanos
  const sqlRpcCumple = `
CREATE OR REPLACE FUNCTION fn_calcular_sellos_regalo_cumpleanos(
  p_cliente_id bigint,
  p_business_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sellos_actuales int := 0;
  v_proximo_hito record;
  v_faltantes int := 0;
  v_regalo int := 0;
  v_meta int := 0;
  v_premio_nombre text := 'Premio VIP';
  v_sellos_finales int := 0;
BEGIN
  -- 1. Obtener sellos activos actuales
  v_sellos_actuales := COALESCE(fn_sellos_activos(p_cliente_id, p_business_id), 0);

  -- 2. Buscar el hito activo más cercano que supere los sellos actuales
  SELECT hito_sello, nombre 
  INTO v_proximo_hito
  FROM sellos_roadmap
  WHERE business_id = p_business_id
    AND activo = true
    AND hito_sello > v_sellos_actuales
  ORDER BY hito_sello ASC
  LIMIT 1;

  -- Si ya completó o superó todos los hitos, buscar el hito máximo para ciclo siguiente
  IF NOT FOUND THEN
    SELECT hito_sello, nombre 
    INTO v_proximo_hito
    FROM sellos_roadmap
    WHERE business_id = p_business_id
      AND activo = true
    ORDER BY hito_sello DESC
    LIMIT 1;
  END IF;

  IF v_proximo_hito.hito_sello IS NOT NULL THEN
    v_meta := v_proximo_hito.hito_sello;
    v_premio_nombre := v_proximo_hito.nombre;
    v_faltantes := GREATEST(1, v_meta - v_sellos_actuales);

    -- LÓGICA DE NEGOCIO EXPERTA:
    -- A) Si tiene 0 sellos: regalar 2 sellos de cortesía de cumpleaños
    IF v_sellos_actuales = 0 THEN
      v_regalo := LEAST(2, v_faltantes);
    -- B) Si le falta solo 1 sello: regalar ese 1 sello para que alcance su premio
    ELSIF v_faltantes = 1 THEN
      v_regalo := 1;
    -- C) Si le faltan 2 o más sellos: regalar los sellos necesarios para que quede a exactamente 1 sello de su premio
    ELSE
      v_regalo := v_faltantes - 1;
    END IF;
  ELSE
    -- Fallback si no tiene hitos configurados
    v_regalo := 2;
    v_meta := 8;
  END IF;

  v_sellos_finales := v_sellos_actuales + v_regalo;

  RETURN jsonb_build_object(
    'ok', true,
    'cliente_id', p_cliente_id,
    'sellos_actuales', v_sellos_actuales,
    'sellos_regalo', v_regalo,
    'sellos_resultantes', v_sellos_finales,
    'sellos_meta', v_meta,
    'sellos_faltantes_post_regalo', GREATEST(0, v_meta - v_sellos_finales),
    'premio_nombre', v_premio_nombre
  );
END;
$$;
  `;
  await client.query(sqlRpcCumple);
  console.log('✓ RPC fn_calcular_sellos_regalo_cumpleanos creada con éxito');

  // 3. Crear función para otorgar sellos de regalo de cumpleaños en sellos_movimientos
  const sqlRpcOtorgarCumple = `
CREATE OR REPLACE FUNCTION fn_otorgar_sellos_cumpleanos(
  p_cliente_id bigint,
  p_business_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_calculo jsonb;
  v_regalo int;
  v_expira timestamptz;
  v_vencimiento_meses int := 3;
BEGIN
  -- Validar si ya se le otorgó sellos de cumpleaños este año
  IF EXISTS (
    SELECT 1 FROM sellos_movimientos
    WHERE cliente_id = p_cliente_id
      AND business_id = p_business_id
      AND motivo = 'cumpleanos'
      AND created_at >= (now() - interval '300 days')
  ) THEN
    RETURN jsonb_build_object(
      'ok', false,
      'motivo', 'El cliente ya recibió sellos de regalo de cumpleaños este año'
    );
  END IF;

  -- Calcular sellos
  v_calculo := fn_calcular_sellos_regalo_cumpleanos(p_cliente_id, p_business_id);
  v_regalo := (v_calculo->>'sellos_regalo')::int;

  IF v_regalo > 0 THEN
    SELECT COALESCE(vencimiento_sellos_meses, 3) INTO v_vencimiento_meses
    FROM sellos_config
    WHERE business_id = p_business_id;

    v_expira := now() + (v_vencimiento_meses || ' months')::interval;

    INSERT INTO sellos_movimientos (
      business_id, cliente_id, cantidad, motivo, expira_en,
      total_post, notas
    )
    VALUES (
      p_business_id, p_cliente_id, v_regalo, 'cumpleanos', v_expira,
      (v_calculo->>'sellos_resultantes')::int,
      'Regalo VIP de cumpleaños para alcanzar meta de premio'
    );
  END IF;

  RETURN v_calculo;
END;
$$;
  `;
  await client.query(sqlRpcOtorgarCumple);
  console.log('✓ RPC fn_otorgar_sellos_cumpleanos creada con éxito');

  await client.end();
}

run().catch(console.error);
