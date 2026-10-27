const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();

  // Obtener todos los business_id existentes en plantillas_automatizacion
  const resBiz = await client.query(`
    SELECT DISTINCT business_id 
    FROM plantillas_automatizacion 
    WHERE business_id IS NOT NULL;
  `);

  console.log('Negocios a aprovisionar:', resBiz.rows.length);

  for (const b of resBiz.rows) {
    const bId = b.business_id;

    // Insertar plantilla por defecto para fidelizacion_sellos_recompensa si no existe
    await client.query(`
      INSERT INTO plantillas_automatizacion (
        business_id, flujo, tiempo, titulo, contenido, activo, es_default
      )
      SELECT 
        $1, 
        'fidelizacion_sellos_recompensa', 
        'tiempo_5', 
        'Sellos Club Glow (4-5 ⭐ o Reconciliación 24h)', 
        '✨ *¡Muchas gracias por tu visita a {nombre_negocio}, {nombre_cliente}!* 👑💖\n\n' ||
        'Sumaste *{sellos_ganados} sello* a tu tarjeta digital del Club Glow. ✨\n\n' ||
        'Progreso actual: *{sellos_actuales} de {sellos_totales_meta} sellos*.\n' ||
        '🎯 Te faltan solo *{sellos_faltantes} sellos* para tu próximo regalo VIP: *{premio_proximo}* 🌸💎\n\n' ||
        '📲 *Mira tu progreso en vivo aquí:*\n{link_tarjeta}',
        true,
        true
      WHERE NOT EXISTS (
        SELECT 1 FROM plantillas_automatizacion 
        WHERE business_id = $1 AND flujo = 'fidelizacion_sellos_recompensa'
      );
    `, [bId]);
  }

  console.log('✓ Plantillas para fidelizacion_sellos_recompensa aprovisionadas con éxito.');
  await client.end();
}

run().catch(console.error);
