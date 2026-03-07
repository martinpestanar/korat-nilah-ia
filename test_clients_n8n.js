async function testFetch() {
    try {
        const response = await fetch('https://martingreen.app.n8n.cloud/webhook/clientes?business_id=brilla-studio');
        const data = await response.json();
        const clients = data.clientes || [];
        console.log(`Found ${clients.length} clients`);

        const blockedClients = clients.filter(c => c.bloqueado_hasta);
        console.log(`Found ${blockedClients.length} clients with bloqueado_hasta`);

        if (blockedClients.length > 0) {
            console.log("Sample blocked_hasta:", blockedClients.map(c => ({
                id: c.id,
                nombre: c.nombre,
                bloqueado_hasta: c.bloqueado_hasta
            })).slice(0, 5));
        }
    } catch (e) {
        console.error("Fetch failed", e);
    }
}

testFetch();
