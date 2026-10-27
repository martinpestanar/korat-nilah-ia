const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function main() {
  await client.connect();

  const res = await client.query(`
    SELECT count(*) as total, 
           count(staff_id) as con_staff, 
           count(case when staff_id is null then 1 end) as sin_staff 
    FROM public."Citas" 
    WHERE business_id = '4b004ede-64e0-4f30-84fd-190a17b369eb';
  `);
  console.log('Citas en Glamour:', res.rows[0]);

  const staff = await client.query(`
    SELECT id, nombre, activo FROM public.staff WHERE business_id = '4b004ede-64e0-4f30-84fd-190a17b369eb';
  `);
  console.log('Staff en Glamour:', staff.rows);

  await client.end();
}

main().catch(console.error);
