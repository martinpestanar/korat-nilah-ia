import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('.env') });

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function run() {
    const { data: canjes, error: errCanjes } = await supabase.from('Canjes').select('*').limit(1);
    console.log('Canjes error:', errCanjes?.message);
    console.log('Canjes fields:', canjes && canjes[0] ? Object.keys(canjes[0]) : 'no data');

    const { data: puntos, error: errPuntos } = await supabase.from('puntos_por_categoria').select('*').limit(1);
    console.log('puntos_por_categoria error:', errPuntos?.message);
    console.log('puntos_por_categoria fields:', puntos && puntos[0] ? Object.keys(puntos[0]) : 'no data');
}

run();
