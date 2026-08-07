import { createClient } from '@supabase/supabase-js';

const url = 'https://cfggpqpbqqeavdbdzwoz.supabase.co';
const service_role_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmZ2dwcXBicXFlYXZkYmR6d296Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjY4MzAyMSwiZXhwIjoyMDgyMjU5MDIxfQ.fh8lCvqZG8vsTx65VGcOF-I9TXsRHC-XyrzdIU9BfUI';

const supabase = createClient(url, service_role_key);

async function testRpc(ruleName, params) {
  console.log(`\n--- Testing RPC for Rule: ${ruleName} ---`);
  console.log("Parameters:", params);
  const { data, error } = await supabase.rpc('get_retoques_audience', params);
  if (error) {
    console.error("RPC Error:", error);
  } else {
    console.log(`Audience count: ${data?.length || 0}`);
    console.log("Audience:", data);
  }
}

async function run() {
  const business_id = 'df33a62b-a6cc-40b1-993e-5364cddc9c9e';
  
  // Rule 16 (Retoque Acrílicas / Gel)
  await testRpc("Retoque Acrílicas / Gel", {
    p_business_id: business_id,
    p_dias_min: 15,
    p_dias_max: 21,
    p_keywords: "acrilica, gel, kapping"
  });

  // Rule 17 (Base Rubber)
  await testRpc("Base Rubber", {
    p_business_id: business_id,
    p_dias_min: 12,
    p_dias_max: 21,
    p_keywords: "Rubber"
  });
}
run();
