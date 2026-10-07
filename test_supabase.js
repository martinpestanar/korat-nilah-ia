import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://cfggpqpbqqeavdbdzwoz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmZ2dwcXBicXFlYXZkYmR6d296Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2ODMwMjEsImV4cCI6MjA4MjI1OTAyMX0.hko2l8IaJjbHLnGI8j_8czxC6q_b--hliidWbg2a8fM'
);

async function run() {
  // Let's test if we can query RPCs or functions in supabase
  // Check what RPCs exist or if there's any superadmin function
  const { data, error } = await supabase.rpc('get_superadmin_config', { p_clave: 'kill_switch' });
  console.log('get_superadmin_config:', data, error);
}

run();
