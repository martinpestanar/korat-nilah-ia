import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const env = {};
envFile.split('\n').filter(Boolean).forEach(l => {
    const splitIndex = l.indexOf('=');
    if (splitIndex !== -1) {
        env[l.substring(0, splitIndex).trim()] = l.substring(splitIndex + 1).trim();
    }
});

const supabase = createClient(env.VITE_SUPABASE_URL.trim(), env.VITE_SUPABASE_ANON_KEY.trim());

async function run() {
    const { data, error } = await supabase.from('campanas')
        .select('titulo, semana_del_mes, business_id')
        .eq('mes', 4)
        .order('created_at', { ascending: true });
    console.log("Error:", error);
    console.log("Data count:", data?.length);
}
run();
