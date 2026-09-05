import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf8');
const envMap = {};
env.split('\n').filter(l => l.includes('=')).forEach(l => {
  const [k, ...v] = l.split('=');
  envMap[k.trim()] = v.join('=').trim().replace(/['"]/g, '').replace('\r', '');
});

const supabase = createClient(envMap.VITE_SUPABASE_URL, envMap.VITE_SUPABASE_ANON_KEY);

async function inspectCreated() {
  const { data: negs, error: nErr } = await supabase.from('negocios').select('*').eq('id', '45702e20-1d78-4563-bbf1-dc3fa8b3d220');
  console.log('Recent Negocios:', negs, nErr);
  if (negs && negs.length > 0) {
    const { data: users, error: uErr } = await supabase.from('Usuarios').select('*').eq('business_id', negs[0].id);
    console.log('Usuarios for recent negocio:', users, uErr);
  }
}

inspectCreated();
