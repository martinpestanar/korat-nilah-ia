const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function getPaolaEvo() {
  await client.connect();

  const res = await client.query(`
    SELECT ie.*, n.nombre as salon_nombre 
    FROM instancias_evolution ie
    JOIN negocios n ON n.id = ie.business_id
    WHERE n.nombre ILIKE '%paola%' OR ie.instance_name ILIKE '%paola%'
  `);

  console.log('Instancias Paola Chau:', JSON.stringify(res.rows, null, 2));

  // Buscar si existe cliente con 981482289
  const cli = await client.query(`
    SELECT * FROM "Clientes" 
    WHERE telefono ILIKE '%981482289%' OR whatsapp ILIKE '%981482289%'
  `);
  console.log('Clientes con ese telefono:', cli.rows);

  await client.end();
}

getPaolaEvo().catch(console.error);
