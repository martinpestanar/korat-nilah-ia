import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf8');
const envMap = {};
env.split('\n').filter(l => l.includes('=')).forEach(l => {
  const [k, ...v] = l.split('=');
  envMap[k.trim()] = v.join('=').trim().replace(/['"]/g, '').replace('\r', '');
});

const supabase = createClient(envMap.VITE_SUPABASE_URL, envMap.VITE_SUPABASE_ANON_KEY);

async function testAuth() {
  const testEmail = 'audittest_' + Date.now() + '@nilah.app';
  const testPass = 'Password123!';
  console.log('Testing signUp with', testEmail);
  const { data: signUpData, error: sErr } = await supabase.auth.signUp({
    email: testEmail,
    password: testPass,
  });
  console.log('SignUp result:', signUpData?.user?.id, 'Err:', sErr);

  if (signUpData?.user) {
    const userClient = createClient(envMap.VITE_SUPABASE_URL, envMap.VITE_SUPABASE_ANON_KEY);
    const { data: signInData, error: siErr } = await userClient.auth.signInWithPassword({
      email: testEmail,
      password: testPass,
    });
    console.log('SignIn result:', signInData?.user?.id, 'Err:', siErr);

    const { data: negId, error: rpcErr } = await userClient.rpc('create_free_negocio', {
      p_nombre_persona: 'Audit Salon',
      p_nombre_negocio: 'Audit Salon',
      p_email: testEmail,
      p_user_uid: signInData.user.id,
      p_password: testPass,
    });
    console.log('RPC result:', negId, 'Err:', rpcErr);

    const { data: userProfile, error: uErr } = await userClient
      .from('Usuarios')
      .select('*')
      .eq('auth_uid', signInData.user.id)
      .maybeSingle();
    console.log('User profile in Usuarios:', userProfile, 'Err:', uErr);

    const { data: negocio, error: nErr } = await userClient
      .from('negocios')
      .select('*')
      .eq('id', negId)
      .maybeSingle();
    console.log('Negocio created:', negocio, 'Err:', nErr);
  }
}

testAuth();
