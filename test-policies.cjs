const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data: d1, error: e1 } = await supabase.rpc('get_table_policies', { p_table_name: 'servicios' });
  console.log("Servicios Policies:", d1 || e1);

  const { data: d2, error: e2 } = await supabase.rpc('get_table_policies', { p_table_name: 'productos_inventario' });
  console.log("Productos Policies:", d2 || e2);
}
run();
