const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function inspectTriggersAndRecent() {
  await client.connect();

  // Ver los triggers en Citas con su definicion
  const trgDefs = await client.query(`
    SELECT tgname, pg_get_triggerdef(oid)
    FROM pg_trigger
    WHERE tgrelid = '"Citas"'::regclass;
  `);
  console.log('Trigger defs en Citas:');
  for (const r of trgDefs.rows) {
    console.log(r.tgname, '-->', r.pg_get_triggerdef);
  }

  // Ver últimos registros en Citas
  const lastCitas = await client.query(`
    SELECT id, business_id, cliente_id, estado, fecha, total, origen, calificacion, calificacion_estado
    FROM "Citas"
    WHERE business_id = '4b004ede-64e0-4f30-84fd-190a17b369eb'
    ORDER BY id DESC
    LIMIT 5
  `);
  console.log('Últimas citas Glamour:', lastCitas.rows);

  // Ver las tablas de mensajes que existen
  const msgTables = await client.query(`
    SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%msg%' OR table_name LIKE '%mensaje%' OR table_name LIKE '%cola%' OR table_name LIKE '%log%'
  `);
  console.log('Tablas relevantes:', msgTables.rows.map(r => r.table_name));

  await client.end();
}
inspectTriggersAndRecent().catch(console.error);
