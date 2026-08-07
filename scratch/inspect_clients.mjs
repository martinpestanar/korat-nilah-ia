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
    const names = ['Ana Luz', 'Solangel', 'Alexa Ju', 'Iris S', 'Danitza'];
    console.log("Searching for clients containing names:", names);

    // 1. Get client records
    const { data: clients, error: clientErr } = await supabase
      .from('Clientes')
      .select('*')
      .or(names.map(name => `nombre.ilike.%${name}%`).join(','));

    if (clientErr) {
      console.error("Error fetching Clientes:", clientErr);
      return;
    }

    console.log(`Found ${clients.length} matching clients:`);
    for (const client of clients) {
      console.log(`\n--- Client: ${client.nombre} (ID: ${client.id}) ---`);
      console.log(`Telefono: ${client.telefono}`);
      console.log(`Business ID: ${client.business_id}`);
      
      // Get all appointments for this client
      const { data: appts, error: apptErr } = await supabase
        .from('Citas')
        .select('*')
        .eq('cliente_id', client.id)
        .order('fecha', { ascending: false });

      if (apptErr) {
        console.error(`Error fetching appointments for client ${client.id}:`, apptErr);
      } else {
        console.log(`Appointments (${appts.length}):`);
        appts.forEach(a => {
          console.log(`  - ID: ${a.id}, Fecha: ${a.fecha}, Servicio: "${a.servicio}", Estado: "${a.estado}", Recordatorio Enviado: ${a.recordatorio_enviado}`);
        });
      }

      // Get autopilot logs
      const { data: logs, error: logErr } = await supabase
        .from('nilah_autopilot_log')
        .select('*')
        .eq('cliente_id', client.id)
        .order('created_at', { ascending: false });

      if (logErr) {
        console.error(`Error fetching autopilot logs for client ${client.id}:`, logErr);
      } else {
        console.log(`Autopilot Logs (${logs.length}):`);
        logs.forEach(l => {
          console.log(`  - Log ID: ${l.id}, Cita ID: ${l.cita_id}, Tipo: ${l.tipo_mensaje}, Estado: "${l.estado}", Razón: "${l.razon_bloqueo}", Created At: ${l.created_at}`);
        });
      }
    }

    // Check config rules for Paola Beauty Studio
    const paola_business_id = 'df33a62b-a6cc-40b1-993e-5364cddc9c9e';
    const { data: rules, error: rulesErr } = await supabase
      .from('configuracion_recordatorios')
      .select('*')
      .eq('business_id', paola_business_id);

    console.log(`\n--- Rules for Paola Beauty Studio (${paola_business_id}) ---`);
    if (rulesErr) {
      console.error("Error fetching rules:", rulesErr);
    } else {
      rules.forEach(r => {
        console.log(`  - Rule ID: ${r.id}, Servicio: "${r.servicio}", Activo: ${r.activo}, Dias: ${r.dias_min}-${r.dias_max}, Keywords: "${r.keywords}"`);
      });
    }

  } catch (e) {
    console.error(e);
  }
}

run();
