import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('mensajes').select('*, cliente:Clientes(*)').limit(1);
  console.log(data ? JSON.stringify(data, null, 2) : error);
}

test();
