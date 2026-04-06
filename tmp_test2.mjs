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

const supabaseUrl = env.VITE_SUPABASE_URL.trim();
const supabaseKey = env.VITE_SUPABASE_ANON_KEY.trim();
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log("Fetching...");
    const { data, error } = await supabase.from('campanas').select('titulo, mes, anio, business_id').eq('business_id', '10db8ed7-fa79-4092-9bae-760fdad63c75');
    console.log("Error:", error);
    console.log(data);
}
test();
