const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();

  // Trigger AFTER UPDATE OF calificacion ON Citas
  const sql = `
CREATE OR REPLACE FUNCTION trg_fn_cita_calificada()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_score int;
  v_cliente record;
BEGIN
  -- Solo ejecutar si se agregó o cambió la calificación
  IF NEW.calificacion IS NOT NULL AND (OLD.calificacion IS DISTINCT FROM NEW.calificacion) THEN
    v_score := (REGEXP_REPLACE(NEW.calificacion, '[^0-9]', '', 'g'))::int;
    
    IF v_score BETWEEN 1 AND 5 THEN
      SELECT telefono INTO v_cliente FROM "Clientes" WHERE id = NEW.cliente_id;
      
      -- Invocar de forma autónoma fn_procesar_calificacion_cliente
      PERFORM fn_procesar_calificacion_cliente(
        COALESCE(v_cliente.telefono, '000000000'),
        v_score,
        NEW.feedback_cliente,
        NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Aviso en trg_fn_cita_calificada: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cita_calificada_sellos ON "Citas";
CREATE TRIGGER trg_cita_calificada_sellos
AFTER UPDATE OF calificacion ON "Citas"
FOR EACH ROW
EXECUTE FUNCTION trg_fn_cita_calificada();
  `;

  await client.query(sql);
  console.log('✓ Trigger trg_cita_calificada_sellos instalado con éxito en tabla Citas');

  await client.end();
}

run().catch(console.error);
