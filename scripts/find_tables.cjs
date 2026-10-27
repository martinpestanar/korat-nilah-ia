const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function findRecentMessages() {
  await client.connect();

  // Buscar todas las tablas que tengan columnas 'mensaje', 'telefono', 'cliente_id' o 'fecha'
  const tables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name NOT LIKE 'pg_%'
    ORDER BY table_name;
  `);
  console.log('Todas las tablas públicas:', tables.rows.map(r => r.table_name).join(', '));

  await client.end();
}
findRecentMessages().catch(console.error);
