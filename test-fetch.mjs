const service_role_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmZ2dwcXBicXFlYXZkYmR6d296Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjY4MzAyMSwiZXhwIjoyMDgyMjU5MDIxfQ.fh8lCvqZG8vsTx65VGcOF-I9TXsRHC-XyrzdIU9BfUI';
const url = 'https://cfggpqpbqqeavdbdzwoz.supabase.co/rest/v1/rpc/get_retoques_audience';
const headers = {
    'apikey': service_role_key,
    'Authorization': `Bearer ${service_role_key}`,
    'Content-Type': 'application/json'
};

async function run() {
    try {
        const payload = {
            p_business_id: 'df33a62b-a6cc-40b1-993e-5364cddc9c9e',
            p_dias_min: 20,
            p_dias_max: 30,
            p_keywords: 'tinte, raiz, color'
        };
        const res = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        console.log("RPC result status:", res.status);
        console.log("RPC result data:", JSON.stringify(data, null, 2));
    } catch(err) {
        console.error(err);
    }
}
run();
