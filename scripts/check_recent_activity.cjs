const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function checkRecentActivity() {
  await client.connect();
  
  // 1. Ver qué triggers están en Citas o en Mensajes
  const trgs = await client.query(`
    SELECT event_object_table, trigger_name 
    FROM information_schema.triggers 
    WHERE trigger_name LIKE '%calif%' OR trigger_name LIKE '%fidel%' OR trigger_name LIKE '%cita%' OR trigger_name LIKE '%encolar%'
  `);
  console.log('Triggers activos:', trgs.rows);

  // 2. Ver citas completadas o actualizadas recientemente (últimos 30 min)
  const citas = await client.query(`
    SELECT id, business_id, cliente_id, estado, fecha, hora_inicio, created_at
    FROM "Citas"
    WHERE business_id = '4b004ede-64e0-4f30-84fd-190a17b369eb'
    ORDER BY id DESC
    LIMIT 10
  `);
  console.log('Últimas 10 citas Glamour:');
  console.log(citas.rows);

  // 3. Ver columnas de la tabla mensajes
  const cols = await client.query(`
    SELECT column_name FROM information_schema.columns WHERE table_name = 'mensajes'
  `);
  console.log('Columnas en mensajes:', cols.rows.map(r => r.column_name));

  // 4. Ver los últimos 10 mensajes de la tabla mensajes
  const msgs = await client.query(`
    SELECT * FROM mensajes ORDER BY id DESC LIMIT 10
  `);
  console.log('Últimos 10 registros en mensajes:');
  console.log(msgs.rows);

  await client.end();
}

checkRecentActivity().catch(console.error);
