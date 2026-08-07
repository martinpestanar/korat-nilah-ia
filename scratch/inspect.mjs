import { createClient } from '@supabase/supabase-js';

const url = 'https://cfggpqpbqqeavdbdzwoz.supabase.co';
const service_role_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmZ2dwcXBicXFlYXZkYmR6d296Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjY4MzAyMSwiZXhwIjoyMDgyMjU5MDIxfQ.fh8lCvqZG8vsTx65VGcOF-I9TXsRHC-XyrzdIU9BfUI';

const supabase = createClient(url, service_role_key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function run() {
  try {
    // Let's check the client query error
    const { data: clients, error: clientErr } = await supabase
      .from('Clientes') // Note: Postgres table names are case-sensitive if created with quotes
      .select('*')
      .eq('business_id', 'df33a62b-a6cc-40b1-993e-5364cddc9c9e');
    console.log("Clientes count (capital C):", clients?.length);
    if (clientErr) console.error("Clientes error:", clientErr);

    // Let's check appointments count (capital C)
    const { data: appointments, error: apptErr } = await supabase
      .from('Citas')
      .select('*')
      .eq('business_id', 'df33a62b-a6cc-40b1-993e-5364cddc9c9e');
    console.log("Citas count:", appointments?.length);
    if (apptErr) console.error("Citas error:", apptErr);

    // If we have clients, let's print their info
    if (clients && clients.length > 0) {
      console.log("First 5 clients:", clients.slice(0, 5).map(c => ({
        id: c.id,
        nombre: c.nombre,
        dias_ausentes: c.dias_ausentes,
        estado_lifecycle: c.estado_lifecycle,
        Estado: c.Estado
      })));
    }

    // If we have appointments, let's check recent ones
    if (appointments && appointments.length > 0) {
      console.log("First 5 appointments:", appointments.slice(0, 5).map(a => ({
        id: a.id,
        cliente_id: a.cliente_id,
        cliente: a.cliente,
        servicio: a.servicio,
        fecha: a.fecha,
        estado: a.estado
      })));
    }

  } catch (e) {
    console.error(e);
  }
}
run();
