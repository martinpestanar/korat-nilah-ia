const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function main() {
  await client.connect();

  // 1. Buscar negocio de Paola Chau
  const negRes = await client.query("SELECT * FROM negocios WHERE nombre ILIKE '%paola%' OR nombre ILIKE '%chau%'");
  console.log('Negocios encontrados:', negRes.rows.map(r => ({
    id: r.id,
    nombre: r.nombre,
    slug: r.slug,
    telefono: r.telefono,
    instance_name: r.instance_name,
    instance_evolution_api: r.instance_evolution_api,
    whatsapp_conectado: r.whatsapp_conectado,
    whatsapp_numero: r.whatsapp_numero
  })));

  if (negRes.rows.length === 0) {
    console.log('No se encontró por paola/chau, listando primeros 5 negocios:');
    const allNeg = await client.query("SELECT id, nombre, telefono, instance_name FROM negocios LIMIT 10");
    console.log(allNeg.rows);
  }

  await client.end();
}

main().catch(console.error);
