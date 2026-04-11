const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const payload = {
    business_id: '10db8ed7-fa79-4092-9bae-760fdad63c75', // user's business ID from logs
    nombre: 'Test Insumo',
    cantidad_total: 1,
    unidad_medida: 'Unidades',
    rinde_servicios: 1,
    costo_unidad: 0,
    stock_minimo: 0,
    categorias_aplicables: []
  };

  // The client will use the anon key so RLS might block it unless authenticated!
  // Oh, wait, the web app auths using an access token! The script is unauthenticated and will ALWAYS hit RLS!
}
run();
