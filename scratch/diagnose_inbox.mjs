import { createClient } from '@supabase/supabase-js';

const url = 'https://cfggpqpbqqeavdbdzwoz.supabase.co';
const service_role_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmZ2dwcXBicXFlYXZkYmR6d296Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjY4MzAyMSwiZXhwIjoyMDgyMjU5MDIxfQ.fh8lCvqZG8vsTx65VGcOF-I9TXsRHC-XyrzdIU9BfUI';

const supabase = createClient(url, service_role_key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function run() {
  try {
    // Let's get the list of unique business_ids in Clientes and mensajes to see which businesses exist
    const { data: businesses, error: busErr } = await supabase
      .from('Clientes')
      .select('business_id')
      .limit(100);
    
    const uniqueBusinessIds = Array.from(new Set((businesses || []).map(b => b.business_id)));
    console.log("Unique business IDs in Clientes (sample):", uniqueBusinessIds);

    for (const businessId of uniqueBusinessIds) {
      if (!businessId) continue;
      console.log(`\n================ BUSINESS ID: ${businessId} ================`);
      
      // Count clients
      const { count: clientCount, error: clientCountErr } = await supabase
        .from('Clientes')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId);
      
      console.log(`Total Clientes in Clientes table:`, clientCount, clientCountErr || '');

      // Count messages
      const { count: msgCount, error: msgCountErr } = await supabase
        .from('mensajes')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId);
      
      console.log(`Total messages in mensajes table:`, msgCount, msgCountErr || '');

      // Let's see some messages to see what client_ids they have and when they were created
      const { data: recentMsgs } = await supabase
        .from('mensajes')
        .select('created_at, cliente_id')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      console.log(`10 most recent messages:`);
      recentMsgs?.forEach(m => {
        console.log(`  - Date: ${m.created_at}, Cliente ID: ${m.cliente_id}`);
      });

      // Let's see if we query messages from more than 24 hours ago
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count: oldMsgCount } = await supabase
        .from('mensajes')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .lt('created_at', twentyFourHoursAgo);
      
      console.log(`Messages older than 24 hours:`, oldMsgCount);

      // Check if some client_ids in mensajes table do not exist in Clientes table
      const { data: allMsgClientIdsData } = await supabase
        .from('mensajes')
        .select('cliente_id')
        .eq('business_id', businessId)
        .limit(1000);
      
      const msgClientIds = Array.from(new Set(allMsgClientIdsData?.map(m => m.cliente_id).filter(Boolean)));
      console.log(`Sample of distinct client_ids in recent messages (up to 1000 msgs):`, msgClientIds.length);

      if (msgClientIds.length > 0) {
        // Query Clientes for these IDs
        const { data: matchingClients } = await supabase
          .from('Clientes')
          .select('id')
          .in('id', msgClientIds);
        
        const matchingIds = new Set(matchingClients?.map(c => c.id));
        const missingIds = msgClientIds.filter(id => !matchingIds.has(id));
        console.log(`Client IDs in messages that are MISSING in Clientes table:`, missingIds.length, missingIds.slice(0, 10));
      }
    }
  } catch (e) {
    console.error(e);
  }
}

run();
