const { Pool } = require('pg');
const p = new Pool({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function clean() {
  const instanceName = 'glamour_y_capricho_1790187774';
  const businessId = '4b004ede-64e0-4f30-84fd-190a17b369eb';

  // 1. Intentar borrar en Evolution API por si quedó algún rastro
  try {
    await fetch(`https://evo.koratflow.agency/instance/delete/${instanceName}`, {
      method: 'DELETE',
      headers: { apikey: '76778d9719d9c1a0b7a604c5d960d8c5' }
    });
    console.log('Evolution delete intentado.');
  } catch(e) {
    console.log('Evolution delete error (ignorable si ya no existía):', e.message);
  }

  // 2. Limpiar instancias_evolution
  const delInst = await p.query("DELETE FROM instancias_evolution WHERE business_id = $1 OR instance_name = $2", [businessId, instanceName]);
  console.log('Instancias eliminadas de Supabase:', delInst.rowCount);

  // 3. Limpiar referencias en tabla negocios
  const updNeg = await p.query("UPDATE negocios SET instance_name = NULL, api_key = NULL, instance_id = NULL WHERE id = $1", [businessId]);
  console.log('Negocio reseteado (limpio de llaves viejas):', updNeg.rowCount);

  await p.end();
}

clean().catch(e => { console.error('Error limpiando:', e); p.end(); });
