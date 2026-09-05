import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cfggpqpbqqeavdbdzwoz.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmZ2dwcXBicXFlYXZkYmR6d296Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2ODMwMjEsImV4cCI6MjA4MjI1OTAyMX0.hko2l8IaJjbHLnGI8j_8czxC6q_b--hliidWbg2a8fM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

async function testSimulatedRegistration() {
  const timestamp = Date.now();
  const testEmail = `audit_${timestamp}@nilah.app`;
  const testPassword = `TestPass_${timestamp}`;
  const salonName = `Salon Audit ${timestamp}`;

  console.log(`[TEST] Creating test auth user: ${testEmail}`);
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });

  if (signUpErr || !signUpData.user) {
    console.error('[TEST] SignUp error:', signUpErr);
    return;
  }

  const userId = signUpData.user.id;
  console.log(`[TEST] User registered with ID: ${userId}`);

  // Simulate concurrent calls (e.g., Login.tsx and AuthContext.tsx both running)
  console.log('[TEST] Simulating concurrent provisioning calls to test RPC idempotence and locking...');
  
  const call1 = supabase.rpc('create_free_negocio', {
    p_nombre_persona: salonName,
    p_nombre_negocio: salonName,
    p_email: testEmail,
    p_user_uid: userId,
    p_password: testPassword,
  });

  const call2 = supabase.rpc('create_free_negocio', {
    p_nombre_persona: salonName,
    p_nombre_negocio: salonName,
    p_email: testEmail,
    p_user_uid: userId,
    p_password: testPassword,
  });

  const [res1, res2] = await Promise.allSettled([call1, call2]);

  console.log('Result 1:', res1.status, res1.status === 'fulfilled' ? res1.value : res1.reason);
  console.log('Result 2:', res2.status, res2.status === 'fulfilled' ? res2.value : res2.reason);

  // Check Usuarios table
  const { data: users, error: uErr } = await supabase
    .from('Usuarios')
    .select('id, nombre, email, auth_uid, business_id, plan')
    .eq('auth_uid', userId);

  console.log(`[TEST] Found ${users?.length || 0} records in Usuarios for this user:`, users);

  if (users && users.length === 1 && users[0].business_id) {
    console.log('[TEST] SUCCESS! Exactly 1 valid profile in Usuarios with business_id:', users[0].business_id);
  } else {
    console.error('[TEST] FAILURE or unexpected state in Usuarios!');
  }
}

testSimulatedRegistration();
