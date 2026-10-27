const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function main() {
  await client.connect();

  const plantilla24h = `¡Hola {nombre_cliente}! Esperamos que hoy estés teniendo un lindo día 🌸✨

Queremos confirmarte que los sellitos de tu visita ya quedaron acreditados en tu tarjeta: *{sellos_actuales} de {sellos_totales_meta} sellos* 👑

Siempre serás de la casa y esperamos volver a consentirte pronto como te mereces 💕

📲 *Tu tarjeta:* {link_tarjeta}`;

  await client.query(`
    DELETE FROM public.plantillas_automatizacion 
    WHERE business_id = '4b004ede-64e0-4f30-84fd-190a17b369eb' 
      AND flujo IN ('reconciliacion_24h', 'fidelizacion_reconciliacion_24h');
  `);

  await client.query(`
    INSERT INTO public.plantillas_automatizacion (
      business_id, flujo, titulo, contenido, activo
    ) VALUES (
      '4b004ede-64e0-4f30-84fd-190a17b369eb',
      'reconciliacion_24h',
      'Reconciliación 24h tras calificación baja',
      $1,
      true
    );
  `, [plantilla24h]);

  console.log('Plantilla reconciliacion_24h registrada con éxito en plantillas_automatizacion.');
  await client.end();
}

main().catch(console.error);
