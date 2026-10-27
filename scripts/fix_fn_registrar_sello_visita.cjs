const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function applyAndTest() {
  await client.connect();

  // 1. Get current definition of fn_registrar_sello_visita
  const resProc = await client.query(`
    SELECT pg_get_functiondef(p.oid) as def
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'fn_registrar_sello_visita';
  `);
  let def = resProc.rows[0].def;

  // Let's inspect where v_sobrante is set in def
  console.log('Searching for v_sobrante in def:');
  const target = `  SELECT COALESCE(monto, 0) INTO v_sobrante
  FROM sellos_sobrante
  WHERE cliente_id = v_cita.cliente_id AND business_id = p_business_id;`;

  console.log('Includes target:', def.includes(target));

  // The replacement will be:
  const replacement = `  SELECT COALESCE(monto, 0) INTO v_sobrante
  FROM sellos_sobrante
  WHERE cliente_id = v_cita.cliente_id AND business_id = p_business_id;
  v_sobrante := COALESCE(v_sobrante, 0);

  -- Fallback de precio si la cita tiene precio 0 o nulo
  IF COALESCE(v_cita.precio, 0) <= 0 AND v_cita.servicio IS NOT NULL THEN
    SELECT COALESCE(s.precio, 0) INTO v_monto_efectivo
    FROM servicios s
    WHERE s.business_id = p_business_id
      AND (s.nombre ILIKE '%' || v_cita.servicio || '%' OR v_cita.servicio ILIKE '%' || s.nombre || '%')
    LIMIT 1;
    v_monto_efectivo := COALESCE(v_monto_efectivo, 0) + v_sobrante;
  ELSE
    v_monto_efectivo := COALESCE(v_cita.precio, 0) + v_sobrante;
  END IF;`;

  // Notice in current def:
  // v_monto_efectivo := COALESCE(v_cita.precio, 0) + v_sobrante;
  const fullTarget = `  SELECT COALESCE(monto, 0) INTO v_sobrante
  FROM sellos_sobrante
  WHERE cliente_id = v_cita.cliente_id AND business_id = p_business_id;

  v_monto_efectivo := COALESCE(v_cita.precio, 0) + v_sobrante;`;

  console.log('Includes full target:', def.includes(fullTarget));

  if (def.includes(fullTarget)) {
    const newDef = def.replace(fullTarget, replacement);
    await client.query(newDef);
    console.log('Updated fn_registrar_sello_visita successfully!');
  } else {
    console.log('Target not found, showing lines around v_sobrante:');
    const lines = def.split('\n');
    lines.forEach((l, idx) => {
      if (l.includes('v_sobrante')) console.log(`${idx}: ${l}`);
    });
  }

  await client.end();
}

applyAndTest().catch(console.error);
