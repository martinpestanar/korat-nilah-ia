import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf8');
const envMap = {};
env.split('\n').filter(l => l.includes('=')).forEach(l => {
  const [k, ...v] = l.split('=');
  envMap[k.trim()] = v.join('=').trim().replace(/['"]/g, '').replace('\r', '');
});

const supabase = createClient(envMap.VITE_SUPABASE_URL, envMap.VITE_SUPABASE_ANON_KEY);

async function testRpc() {
  console.log('Testing create_free_negocio RPC call directly...');
  const { data, error } = await supabase.rpc('create_free_negocio', {
    p_nombre_persona: 'Test Salon',
    p_nombre_negocio: 'Test Salon',
    p_email: 'test_probe@nilah.app',
    p_user_uid: null,
    p_password: 'testpassword123',
  });
  console.log('RPC result:', data, 'RPC error:', error);
}

testRpc();
