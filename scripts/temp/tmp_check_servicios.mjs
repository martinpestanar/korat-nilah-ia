import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const env = {};
envFile.split('\n').filter(Boolean).forEach(line => {
  const [k, ...v] = line.split('=');
  if(k) env[k.trim()] = v.join('=').trim().replace(/"/g, '');
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('servicios').select('*').limit(1);
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Columns:", data && data.length ? Object.keys(data[0]) : "No data, but table exists.");
    
    // Check RPC source
    const { data: rpc, error: rpcErr } = await supabase.rpc('buscar_servicios', { p_query: 'test', p_business_id: 'test' });
    console.log("buscar_servicios exists?:", !rpcErr);

    if (data && data.length === 0) {
       console.log("Need another way to check columns if table empty.");
    }
  }
}
check();
