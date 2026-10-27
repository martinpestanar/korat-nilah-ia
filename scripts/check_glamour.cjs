const { Pool } = require('pg');
const p = new Pool({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});
p.query("SELECT instance_name, status, telefono FROM instancias_evolution WHERE instance_name='glamour_y_capricho_1790187774'")
  .then(r=>{console.log(JSON.stringify(r.rows,null,2));p.end();})
  .catch(e=>{console.error(e.message);p.end();});
