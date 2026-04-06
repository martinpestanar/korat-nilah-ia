import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env');
let envFile;
try {
    envFile = fs.readFileSync(envPath, 'utf8');
} catch (e) {
    console.error("Can't read .env");
    process.exit(1);
}
const env = {};
envFile.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key) env[key.trim()] = values.join('=').trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
    const { data: citas } = await supabase.from('citas').select('*').limit(1);
    console.log('CITAS:', citas ? Object.keys(citas[0] || {}) : 'no data');
    const { data: clientes } = await supabase.from('clientes').select('*').limit(1);
    console.log('CLIENTES:', clientes ? Object.keys(clientes[0] || {}) : 'no data');
}
run();
