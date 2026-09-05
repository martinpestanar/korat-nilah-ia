import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf8');
const envMap = {};
env.split('\n').filter(l => l.includes('=')).forEach(l => {
  const [k, ...v] = l.split('=');
  envMap[k.trim()] = v.join('=').trim().replace(/['"]/g, '').replace('\r', '');
});

const supabase = createClient(envMap.VITE_SUPABASE_URL, envMap.VITE_SUPABASE_ANON_KEY);

// Reproduce exact provisionUserAccount logic in Node
const inFlightProvisions = new Map();

async function provisionUserAccount(params, client = supabase) {
  const cacheKey = params.userId || params.email.toLowerCase().trim();

  if (inFlightProvisions.has(cacheKey)) {
    console.log('[PROVISIONING MUTEX] Reusing in-flight promise for:', cacheKey);
    return inFlightProvisions.get(cacheKey);
  }

  const promise = (async () => {
    try {
      const cleanEmail = params.email.trim().toLowerCase();
      const cleanSalon = (params.salonName || '').trim() || 'Mi Salón';
      const userId = params.userId;

      // 1. Check existing
      const { data: existingUser } = await client
        .from('Usuarios')
        .select('*')
        .eq('auth_uid', userId)
        .maybeSingle();

      if (existingUser && existingUser.business_id) {
        return { success: true, businessId: existingUser.business_id, usuario: existingUser };
      }

      // 2. RPC call
      const { data: negId, error: rpcErr } = await client.rpc('create_free_negocio', {
        p_nombre_persona: cleanSalon,
        p_nombre_negocio: cleanSalon,
        p_email: cleanEmail,
        p_user_uid: userId,
        p_password: params.password || '',
      });

      if (rpcErr) {
        const { data: fallbackUser } = await client
          .from('Usuarios')
          .select('*')
          .eq('auth_uid', userId)
          .maybeSingle();

        if (fallbackUser && fallbackUser.business_id) {
          return { success: true, businessId: fallbackUser.business_id, usuario: fallbackUser };
        }
        return { success: false, businessId: null, usuario: null, error: rpcErr.message };
      }

      const businessId = negId;

      // 3. Verify final user profile
      const { data: finalUser, error: finalErr } = await client
        .from('Usuarios')
        .select('*')
        .eq('auth_uid', userId)
        .maybeSingle();

      return {
        success: !finalErr && !!finalUser,
        businessId: finalUser?.business_id || businessId,
        usuario: finalUser,
      };
    } finally {
      inFlightProvisions.delete(cacheKey);
    }
  })();

  inFlightProvisions.set(cacheKey, promise);
  return promise;
}

async function testMutexConcurrency() {
  const testEmail = `mutex_test_${Date.now()}@nilah.app`;
  const testPass = 'Password123!';
  console.log('[TEST] Registering user:', testEmail);

  const { data: signUpData, error: sErr } = await supabase.auth.signUp({
    email: testEmail,
    password: testPass,
  });

  if (sErr || !signUpData.user) {
    console.error('SignUp failed:', sErr);
    return;
  }

  const userClient = createClient(envMap.VITE_SUPABASE_URL, envMap.VITE_SUPABASE_ANON_KEY);
  await userClient.auth.signInWithPassword({
    email: testEmail,
    password: testPass,
  });

  console.log('[TEST] Simulating simultaneous call from Login.tsx and AuthContext.tsx...');

  // Disparar simultáneamente dos llamadas idénticas al servicio unificado
  const callFromLogin = provisionUserAccount({
    userId: signUpData.user.id,
    email: testEmail,
    salonName: 'Studio Mutex Test',
    password: testPass,
  }, userClient);

  const callFromAuthContext = provisionUserAccount({
    userId: signUpData.user.id,
    email: testEmail,
    salonName: 'Studio Mutex Test',
  }, userClient);

  const [resLogin, resAuth] = await Promise.all([callFromLogin, callFromAuthContext]);

  console.log('Login Provision Result:', resLogin.success, 'BusinessId:', resLogin.businessId);
  console.log('Auth Provision Result:', resAuth.success, 'BusinessId:', resAuth.businessId);

  if (resLogin.success && resAuth.success && resLogin.businessId === resAuth.businessId) {
    console.log('SUCCESS: Both callers received the exact same successful provisioning with zero collisions!');
  } else {
    console.error('FAILED: Inconsistency detected between concurrent calls');
  }
}

testMutexConcurrency();
