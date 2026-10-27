const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  const sql = fs.readFileSync('scripts/update_proc_with_prize_img.sql', 'utf8');
  await client.query(sql);
  console.log('SQL executed successfully!');
  await client.end();
}

run().catch(console.error);
