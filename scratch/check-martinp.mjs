import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf8');
const envMap = {};
env.split('\n').filter(l => l.includes('=')).forEach(l => {
  const [k, ...v] = l.split('=');
  envMap[k.trim()] = v.join('=').trim().replace(/['"]/g, '').replace('\r', '');
});

const supabase = createClient(envMap.VITE_SUPABASE_URL, envMap.VITE_SUPABASE_ANON_KEY);

async function test() {
  console.log('--- Testing query on Usuarios with martinp ---');
  const { data: users, error: uErr } = await supabase.from('Usuarios').select('*').ilike('email', '%martinp%');
  console.log('Usuarios martinp:', users, 'Err:', uErr);

  const { data: allUsers, error: aErr } = await supabase.from('Usuarios').select('id, auth_uid, email, business_id, role').limit(5);
  console.log('All users sample:', allUsers, 'Err:', aErr);

  const { data: negocios, error: nErr } = await supabase.from('negocios').select('id, nombre').limit(5);
  console.log('Negocios sample:', negocios, 'Err:', nErr);
}

test();
