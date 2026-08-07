import { createClient } from '@supabase/supabase-js';

const url = 'https://cfggpqpbqqeavdbdzwoz.supabase.co';
const service_role_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmZ2dwcXBicXFlYXZkYmR6d296Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjY4MzAyMSwiZXhwIjoyMDgyMjU5MDIxfQ.fh8lCvqZG8vsTx65VGcOF-I9TXsRHC-XyrzdIU9BfUI';

const supabase = createClient(url, service_role_key);

async function run() {
  const { data, error } = await supabase.from('configuracion_recordatorios').select('*').limit(1);
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Keys of configuracion_recordatorios row:", Object.keys(data[0]));
    console.log("Data of configuracion_recordatorios row:", data[0]);
  }
}
run();
