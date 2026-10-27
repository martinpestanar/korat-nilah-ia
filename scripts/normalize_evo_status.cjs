const { Pool } = require('pg');
const p = new Pool({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});
const sql = `UPDATE instancias_evolution SET status=CASE WHEN status='disconnected' THEN 'desconectado' WHEN status IN ('open','connected') THEN 'conectado' WHEN status='pending' THEN 'pendiente' ELSE status END,updated_at=NOW() WHERE status IN ('disconnected','open','connected','pending')`;
p.query(sql).then(r=>{console.log('Updated rows:',r.rowCount);p.end();}).catch(e=>{console.error(e.message);p.end();});
