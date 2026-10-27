const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function check() {
  await client.connect();
  client.on('notice', msg => console.log('NOTICE:', msg.message));
  await client.query(`
    DO $$
    DECLARE
      v_sob numeric := 99;
    BEGIN
      SELECT COALESCE(monto, 0) INTO v_sob FROM sellos_sobrante WHERE cliente_id = -999;
      RAISE NOTICE 'v_sob after query: %', v_sob;
    END $$;
  `);
  await client.end();
}

check().catch(console.error);
