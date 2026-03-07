import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function testRpc() {
    // Get an existing negocio
    const { data: negocios } = await supabase.from('negocios').select('*').limit(1);
    const negocio = negocios[0];

    console.log("Testing with negocio:", negocio.id);

    // Call the RPC
    const { data, error } = await supabase.rpc('superadmin_update_negocio_recursos', {
        p_negocio_id: negocio.id,
        p_recursos: negocio.recursos_saas,
        p_tipo_fidelizacion: 'staff' // we test passing the parameter
    });

    console.log("RPC Error:", error);
    console.log("RPC Data:", data);
}

testRpc();
