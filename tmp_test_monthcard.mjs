import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    const businessId = "10db8ed7-fa79-4092-9bae-760fdad63c75";
    const cardMonth = 3; // April implies mes = 4
    const cardYear = 2026;
    const { data, error } = await supabase
        .from('campanas')
        .select('*')
        .eq('business_id', businessId)
        .or(`anio.eq.${cardYear},anio.is.null`)
        .eq('mes', cardMonth + 1)
        .order('semana_del_mes', { ascending: true })
        .order('created_at', { ascending: true });
        
    console.log("Error:", error);
    console.log("Data count:", data?.length);
    console.log("Data:", data?.map(d => ({id: d.id, titulo: d.titulo, mes: d.mes})));
}
test();
