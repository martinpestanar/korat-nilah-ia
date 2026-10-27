const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

const BUSINESS_ID = '4b004ede-64e0-4f30-84fd-190a17b369eb'; // Glamour y Capricho
const PHONE = '51926285289';

async function main() {
  const action = process.argv[2] || 'status';
  await client.connect();

  // 1. Obtener o verificar cliente
  let clRes = await client.query(`SELECT * FROM "Clientes" WHERE business_id = $1 AND telefono = $2`, [BUSINESS_ID, PHONE]);
  if (clRes.rows.length === 0) {
    clRes = await client.query(`
      INSERT INTO "Clientes" (business_id, nombre, telefono, "Estado", acepta_marketing)
      VALUES ($1, 'Valeria', $2, 'Activo', true)
      RETURNING *;
    `, [BUSINESS_ID, PHONE]);
  }
  const cliente = clRes.rows[0];

  console.log(`\n======================================================`);
  console.log(`📱 CLIENTA: ${cliente.nombre} | Cel: ${cliente.telefono} | ID: ${cliente.id}`);
  console.log(`======================================================`);

  if (action === 'reset') {
    await client.query(`DELETE FROM "Citas" WHERE cliente_id = $1 AND business_id = $2`, [cliente.id, BUSINESS_ID]);
    await client.query(`DELETE FROM sellos_movimientos WHERE cliente_id = $1 AND business_id = $2`, [cliente.id, BUSINESS_ID]);
    await client.query(`DELETE FROM sellos_sobrante WHERE cliente_id = $1 AND business_id = $2`, [cliente.id, BUSINESS_ID]);
    await client.query(`DELETE FROM sellos_premios_ganados WHERE cliente_id = $1 AND business_id = $2`, [cliente.id, BUSINESS_ID]);
    await client.query(`DELETE FROM mensajes WHERE cliente_id = $1 AND business_id = $2`, [cliente.id, BUSINESS_ID]);
    await client.query(`DELETE FROM cola_mensajes_salientes WHERE cliente_id = $1 AND business_id = $2`, [cliente.id, BUSINESS_ID]);
    await client.query(`UPDATE "Clientes" SET bot_pausado = false, bot_pausado_hasta = null, cumpleanos = null WHERE id = $1`, [cliente.id]);
    console.log(`🧹 Historial reiniciado a CERO con éxito. Valeria está como clienta nueva sin sellos.`);
  }

  else if (action === 'status') {
    const sellos = await client.query(`SELECT public.fn_sellos_activos($1, $2) as total;`, [cliente.id, BUSINESS_ID]);
    const sobrante = await client.query(`SELECT monto FROM sellos_sobrante WHERE cliente_id = $1 AND business_id = $2;`, [cliente.id, BUSINESS_ID]);
    const movs = await client.query(`SELECT id, cantidad, motivo, total_post, created_at FROM sellos_movimientos WHERE cliente_id = $1 AND business_id = $2 ORDER BY id ASC;`, [cliente.id, BUSINESS_ID]);
    const citas = await client.query(`SELECT id, servicio, precio, estado, calificacion FROM "Citas" WHERE cliente_id = $1 AND business_id = $2 ORDER BY id DESC LIMIT 3;`, [cliente.id, BUSINESS_ID]);
    const bot = await client.query(`SELECT bot_pausado, bot_pausado_hasta, cumpleanos FROM "Clientes" WHERE id = $1;`, [cliente.id]);

    console.log(`🌟 Sellos actuales activos: ${sellos.rows[0]?.total || 0} de 12`);
    console.log(`👛 Saldo en Alcancía: S/ ${sobrante.rows[0]?.monto || '0.00'}`);
    console.log(`🤖 Estado del Bot: ${bot.rows[0]?.bot_pausado ? '⛔ PAUSADO hasta ' + bot.rows[0].bot_pausado_hasta : '🟢 ACTIVO'}`);
    console.log(`🎂 Cumpleaños registrado: ${bot.rows[0]?.cumpleanos || 'No asignado'}`);
    console.log(`📜 Movimientos de sellos:`, movs.rows);
    console.log(`🗓️ Últimas citas:`, citas.rows);
  }

  else if (action === 'step1') {
    // 1er Servicio: Lifting de Pestañas S/ 50 -> Califica 5
    console.log(`\n➡️ PASO 1: Valeria se realiza 'Lifting de Pestañas' (S/ 50.00)`);
    const c = await client.query(`
      INSERT INTO "Citas" (business_id, cliente_id, servicio, precio, fecha, estado, encuesta_enviada)
      VALUES ($1, $2, 'Lifting de Pestañas', 50.00, CURRENT_DATE, 'Completada', true)
      RETURNING id;
    `, [BUSINESS_ID, cliente.id]);
    const citaId = c.rows[0].id;
    console.log(`   Cita #${citaId} creada y marcada como Completada.`);

    console.log(`\n💬 Clienta responde en WhatsApp: "5 excelente me encanto"`);
    const res = await client.query(`
      SELECT * FROM public.procesar_respuesta_calificacion_fidelizacion($1, $2, '5 excelente me encanto');
    `, [BUSINESS_ID, cliente.id]);

    console.log(`\n📩 MENSAJE ENVIADO POR EL BOT AL WHATSAPP DE VALERIA:`);
    console.log(`------------------------------------------------------`);
    console.log(res.rows[0]?.mensaje_recompensa);
    console.log(`------------------------------------------------------`);
  }

  else if (action === 'step2') {
    // 2do Servicio: Manicure Rusa S/ 50 -> Califica 4
    console.log(`\n➡️ PASO 2: Valeria vuelve y se hace 'Manicure Rusa' (S/ 50.00)`);
    const c = await client.query(`
      INSERT INTO "Citas" (business_id, cliente_id, servicio, precio, fecha, estado, encuesta_enviada)
      VALUES ($1, $2, 'Manicure Rusa', 50.00, CURRENT_DATE, 'Completada', true)
      RETURNING id;
    `, [BUSINESS_ID, cliente.id]);
    const citaId = c.rows[0].id;
    console.log(`   Cita #${citaId} creada y marcada como Completada.`);

    console.log(`\n💬 Clienta responde en WhatsApp: "4 muy lindo trabajo"`);
    const res = await client.query(`
      SELECT * FROM public.procesar_respuesta_calificacion_fidelizacion($1, $2, '4 muy lindo trabajo');
    `, [BUSINESS_ID, cliente.id]);

    console.log(`\n📩 MENSAJE ENVIADO POR EL BOT AL WHATSAPP DE VALERIA:`);
    console.log(`------------------------------------------------------`);
    console.log(res.rows[0]?.mensaje_recompensa);
    console.log(`------------------------------------------------------`);
  }

  else if (action === 'step3_queja') {
    // 3er Servicio: Pedicure Spa S/ 60 -> Califica 2 (Queja)
    console.log(`\n➡️ PASO 3: Valeria se hace 'Pedicure Spa' pero califica con 2 ⭐ (Queja)`);
    const c = await client.query(`
      INSERT INTO "Citas" (business_id, cliente_id, servicio, precio, fecha, estado, encuesta_enviada)
      VALUES ($1, $2, 'Pedicure Spa', 60.00, CURRENT_DATE, 'Completada', true)
      RETURNING id;
    `, [BUSINESS_ID, cliente.id]);
    const citaId = c.rows[0].id;
    console.log(`   Cita #${citaId} completada.`);

    console.log(`\n💬 Clienta responde en WhatsApp: "2 no me gusto se demoro mucho"`);
    const res = await client.query(`
      SELECT * FROM public.procesar_respuesta_calificacion_fidelizacion($1, $2, '2 no me gusto se demoro mucho');
    `, [BUSINESS_ID, cliente.id]);

    console.log(`\n📩 MENSAJE ENVIADO POR EL BOT (RESPUESTA DE CONTENCIÓN HUMANA):`);
    console.log(`------------------------------------------------------`);
    console.log(res.rows[0]?.mensaje_recompensa);
    console.log(`------------------------------------------------------`);

    const clCheck = await client.query(`SELECT bot_pausado, bot_pausado_razon, bot_pausado_hasta FROM "Clientes" WHERE id = $1`, [cliente.id]);
    console.log(`\n🛡️ ESTADO DEL BOT DE VALERIA:`);
    console.log(`   Bot pausado: ${clCheck.rows[0].bot_pausado}`);
    console.log(`   Razón: ${clCheck.rows[0].bot_pausado_razon}`);
    console.log(`   Pausado hasta: ${clCheck.rows[0].bot_pausado_hasta}`);
    console.log(`   (No se envió mensaje festivo de sellos; se protegió la relación con la clienta)`);
  }

  else if (action === 'step4_cumple_anticipado') {
    // Cumpleaños anticipado: Faltan 6 días
    console.log(`\n➡️ PASO 4: Simulación de Cumpleaños a 6 días`);
    const fechaCumple = new Date();
    fechaCumple.setDate(fechaCumple.getDate() + 6);
    const mm = String(fechaCumple.getMonth() + 1).padStart(2, '0');
    const dd = String(fechaCumple.getDate()).padStart(2, '0');
    const cumpleStr = `1998-${mm}-${dd}`;

    await client.query(`UPDATE "Clientes" SET cumpleanos = $1, bot_pausado = false WHERE id = $2`, [cumpleStr, cliente.id]);
    console.log(`   Cumpleaños de Valeria fijado en: ${cumpleStr} (dentro de 6 días)`);

    // Ejecutar trigger o plantilla de anticipación
    const neg = await client.query(`SELECT nombre FROM negocios WHERE id = $1`, [BUSINESS_ID]);
    const plantilla = await client.query(`
      SELECT contenido FROM plantillas_automatizacion 
      WHERE business_id = $1 AND flujo = 'cumpleanos_anticipado' AND activo = true LIMIT 1;
    `, [BUSINESS_ID]);

    let msg = plantilla.rows[0]?.contenido || '¡Hola {nombre_cliente}! 🎂✨ Se acerca tu día especial en {nombre_negocio}...';
    msg = msg.replace('{nombre_cliente}', 'Valeria').replace('{nombre_negocio}', neg.rows[0].nombre);

    console.log(`\n📩 MENSAJE AUTOMÁTICO DE CUMPLEAÑOS ANTICIPADO:`);
    console.log(`------------------------------------------------------`);
    console.log(msg);
    console.log(`------------------------------------------------------`);
  }

  else if (action === 'step5_cumple_dia_d') {
    // Cumpleaños HOY
    console.log(`\n➡️ PASO 5: Simulación del Día de su Cumpleaños (Hoy)`);
    const hoy = new Date();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    const cumpleHoyStr = `1998-${mm}-${dd}`;

    await client.query(`UPDATE "Clientes" SET cumpleanos = $1, bot_pausado = false WHERE id = $2`, [cumpleHoyStr, cliente.id]);

    // Otorgar sellos de regalo de cumpleaños
    const resRegalo = await client.query(`
      SELECT public.fn_otorgar_sellos_cumpleanos($1, $2) as resultado;
    `, [cliente.id, BUSINESS_ID]);
    console.log(`   Sellos de regalo otorgados:`, resRegalo.rows[0]?.resultado);

    const neg = await client.query(`SELECT nombre FROM negocios WHERE id = $1`, [BUSINESS_ID]);
    const plantilla = await client.query(`
      SELECT contenido FROM plantillas_automatizacion 
      WHERE business_id = $1 AND flujo = 'cumpleanos_dia_d' AND activo = true LIMIT 1;
    `, [BUSINESS_ID]);

    let msg = plantilla.rows[0]?.contenido || '¡Feliz cumpleaños, {nombre_cliente}! 🥳🎂🎉';
    msg = msg.replace('{nombre_cliente}', 'Valeria').replace('{nombre_negocio}', neg.rows[0].nombre);

    console.log(`\n📩 MENSAJE AUTOMÁTICO EL DÍA DEL CUMPLEAÑOS:`);
    console.log(`------------------------------------------------------`);
    console.log(msg);
    console.log(`------------------------------------------------------`);
  }

  else if (action === 'step6_alcancia_depilacion') {
    // Ticket bajo: Depilación de cejas S/ 20 cuando base es S/ 40 (o S/ 30) -> Califica 5
    console.log(`\n➡️ PASO 6: Ticket menor al monto base (Depilación Cejas S/ 20.00 vs Base S/ 30.00)`);
    const c = await client.query(`
      INSERT INTO "Citas" (business_id, cliente_id, servicio, precio, fecha, estado, encuesta_enviada)
      VALUES ($1, $2, 'Depilación de Cejas', 20.00, CURRENT_DATE, 'Completada', true)
      RETURNING id;
    `, [BUSINESS_ID, cliente.id]);
    const citaId = c.rows[0].id;

    console.log(`\n💬 Clienta responde en WhatsApp: "5 todo perfecto"`);
    const res = await client.query(`
      SELECT * FROM public.procesar_respuesta_calificacion_fidelizacion($1, $2, '5 todo perfecto');
    `, [BUSINESS_ID, cliente.id]);

    console.log(`\n📩 MENSAJE ENVIADO POR EL BOT (CONFIRMACIÓN DE ALCANCÍA):`);
    console.log(`------------------------------------------------------`);
    console.log(res.rows[0]?.mensaje_recompensa);
    console.log(`------------------------------------------------------`);

    const sob = await client.query(`SELECT monto FROM sellos_sobrante WHERE cliente_id = $1 AND business_id = $2`, [cliente.id, BUSINESS_ID]);
    console.log(`👛 Alcancía guardada en base de datos: S/ ${sob.rows[0]?.monto}`);
  }

  else if (action === 'step7_alcancia_segunda_visita') {
    // Segunda visita: Otros S/ 20.00 (acumula 20 + 20 = S/ 40 >= S/ 30) -> Califica 5
    console.log(`\n➡️ PASO 7: Segunda visita de S/ 20.00 (Consume la alcancía y completa el sello)`);
    const c = await client.query(`
      INSERT INTO "Citas" (business_id, cliente_id, servicio, precio, fecha, estado, encuesta_enviada)
      VALUES ($1, $2, 'Perfilado de Cejas Express', 20.00, CURRENT_DATE + 5, 'Completada', true)
      RETURNING id;
    `, [BUSINESS_ID, cliente.id]);
    const citaId = c.rows[0].id;

    console.log(`\n💬 Clienta responde en WhatsApp: "5 quedé bella"`);
    const res = await client.query(`
      SELECT * FROM public.procesar_respuesta_calificacion_fidelizacion($1, $2, '5 quedé bella');
    `, [BUSINESS_ID, cliente.id]);

    console.log(`\n📩 MENSAJE ENVIADO POR EL BOT (SELLO DESBLOQUEADO):`);
    console.log(`------------------------------------------------------`);
    console.log(res.rows[0]?.mensaje_recompensa);
    console.log(`------------------------------------------------------`);

    const sob = await client.query(`SELECT monto FROM sellos_sobrante WHERE cliente_id = $1 AND business_id = $2`, [cliente.id, BUSINESS_ID]);
    console.log(`👛 Saldo restante en Alcancía tras consumir: S/ ${sob.rows[0]?.monto}`);
  }

  await client.end();
}

main().catch(console.error);
