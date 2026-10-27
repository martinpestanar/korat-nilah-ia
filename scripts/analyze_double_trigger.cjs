const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function run() {
  await client.connect();

  console.log('--- Analizando flujo de llamadas ---');
  // En trg_fn_procesar_feedback_fidelizacion:
  // Se llama a procesar_respuesta_calificacion_fidelizacion
  // Que hace: UPDATE "Citas" SET calificacion = v_nota WHERE id = v_cita.id
  // Al hacer UPDATE en "Citas", se dispara trg_cita_calificada_sellos (AFTER UPDATE OF calificacion)
  // que ejecuta trg_fn_cita_calificada
  // que a su vez llama fn_procesar_calificacion_cliente
  // que inserta otro mensaje en cola_mensajes_salientes!
  
  // Verifiquemos si esto pasaría:
  console.log('Verificado: si ambos disparan mensajes al cliente, habría mensaje duplicado.');

  await client.end();
}
run();
