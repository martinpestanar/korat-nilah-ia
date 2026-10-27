const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function run() {
  await client.connect();

  console.log('--- TEST DE BLINDAJE ANTI-INTERRUPCIÓN ---');

  // Test Cita 1378: currently calificacion is '0' and encuesta_enviada is true
  const c1 = await client.query(`
    SELECT c.id, c.cliente_id, c.calificacion, c.encuesta_enviada,
      (c.encuesta_enviada = true AND (c.calificacion IS NULL OR c.calificacion = '0' OR c.calificacion = '') 
       AND COALESCE(c.fecha_encuesta_enviada, c.fecha_completada, c.fecha, c.created_at) >= NOW() - INTERVAL '48 hours') as activa
    FROM "Citas" c WHERE c.id = 1378
  `);
  console.log('1. Cita 1378 antes de calificar (debe ser activa):', c1.rows[0].activa);

  // Simular que ya calificó (calificacion = '5')
  await client.query(`UPDATE "Citas" SET calificacion = '5' WHERE id = 1378`);
  
  const c2 = await client.query(`
    SELECT c.id, c.cliente_id, c.calificacion, c.encuesta_enviada,
      (c.encuesta_enviada = true AND (c.calificacion IS NULL OR c.calificacion = '0' OR c.calificacion = '') 
       AND COALESCE(c.fecha_encuesta_enviada, c.fecha_completada, c.fecha, c.created_at) >= NOW() - INTERVAL '48 hours') as activa
    FROM "Citas" c WHERE c.id = 1378
  `);
  console.log('2. Cita 1378 DESPUÉS de calificar (debe ser FALSE):', c2.rows[0].activa);

  // Revertir Cita 1378 para que quede lista para prueba
  await client.query(`UPDATE "Citas" SET calificacion = '0', feedback_cliente = NULL WHERE id = 1378`);

  await client.end();
}
run().catch(e => console.error(e.message));
