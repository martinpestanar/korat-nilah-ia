import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env');
const envStr = fs.readFileSync(envPath, 'utf8');
const env = {};
envStr.split('\n').forEach(line => {
    const [k, v] = line.split('=');
    if (k && v) env[k.trim()] = v.trim();
});

const url = env['VITE_SUPABASE_URL'];
const key = env['VITE_SUPABASE_ANON_KEY'];

async function fetchS(path, opts = {}) {
    const reqUrl = `${url}/rest/v1/${path}`;
    const headers = {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        ...(opts.headers || {})
    };
    const res = await fetch(reqUrl, { ...opts, headers });
    if (!res.ok) {
        const text = await res.text();
        console.error('Error fetching', reqUrl, text);
        return null;
    }
    return await res.json();
}

async function run() {
    const negocios = await fetchS('negocios?select=id,nombre&limit=1');
    if (!negocios?.length) return console.log('No negocios');
    const business_id = negocios[0].id;

    const clientes = await fetchS(`Clientes?select=id&business_id=eq.${business_id}&limit=3`);
    if (!clientes?.length) return console.log('No clientes');

    const categorias = await fetchS(`categorias_calendario?select=id&business_id=eq.${business_id}&limit=2`);
    if (!categorias?.length) return console.log('No categorias');

    for (const c of clientes) {
        for (const cat of categorias) {
            const result = await fetchS('puntos_por_categoria', {
                method: 'POST',
                headers: { 'Prefer': 'resolution=merge-duplicates' },
                body: JSON.stringify({
                    cliente_id: c.id,
                    categoria_id: cat.id,
                    business_id: business_id,
                    puntos: Math.floor(Math.random() * 50) + 10,
                    ultima_actualizacion: new Date().toISOString()
                })
            });
            if (result) console.log(`Points inserted for ${c.id} - ${cat.id}`);
        }
    }
}
run();
