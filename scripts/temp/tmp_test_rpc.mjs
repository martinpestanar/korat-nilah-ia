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
  const { data, error } = await supabase.rpc('get_function_src_debug', { fn_name: 'onboarding_step_5_servicios' });
  if (error) {
    console.error("RPC Error:", error);
  } else {
    console.log(data);
  }
}
check();
