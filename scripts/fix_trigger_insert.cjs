const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function main() {
  await client.connect();

  // 1. Modificar la función trg_fn_cita_completada_sellos para que soporte INSERT y UPDATE
  const sqlFunc = `
    CREATE OR REPLACE FUNCTION public.trg_fn_cita_completada_sellos()
     RETURNS trigger
     LANGUAGE plpgsql
     SECURITY DEFINER
    AS $$
    DECLARE
      v_sellos_activos boolean := false;
      v_ahora_negocio time;
      v_timezone text := 'America/Lima';
      v_es_completada boolean := false;
    BEGIN
      -- Si es INSERT con estado Completada, o UPDATE pasando a Completada
      IF TG_OP = 'INSERT' THEN
        v_es_completada := (NEW.estado ILIKE 'completada');
      ELSIF TG_OP = 'UPDATE' THEN
        v_es_completada := (NEW.estado ILIKE 'completada' AND OLD.estado NOT ILIKE 'completada');
      END IF;

      IF v_es_completada THEN
        -- 1. Registrar sellos del club si aplica
        SELECT EXISTS (
          SELECT 1 FROM public.sellos_config sc
          JOIN public.negocios n ON n.id = sc.business_id
          WHERE sc.business_id = NEW.business_id
            AND (sc.addons_activos IS NOT NULL OR sc.valor_sello_base > 0)
            AND (n.modo_fidelizacion IS NULL OR n.modo_fidelizacion IN ('sellos', 'ambos'))
        ) INTO v_sellos_activos;

        IF v_sellos_activos THEN
          PERFORM public.fn_registrar_sello_visita(NEW.id, NEW.business_id);
        END IF;

        -- 2. Disparo instantaneo de encuesta post-cita si la cita ya finalizo hace > 30 min y estamos en horario habil (7am - 10pm)
        SELECT COALESCE(timezone, 'America/Lima') INTO v_timezone FROM public.negocios WHERE id = NEW.business_id;
        v_ahora_negocio := (now() AT TIME ZONE v_timezone)::time;

        IF v_ahora_negocio >= '07:00:00'::time AND v_ahora_negocio <= '22:00:00'::time THEN
          IF COALESCE(NEW.hora_fin, NEW.fecha + INTERVAL '90 minutes') <= (NOW() - INTERVAL '30 minutes') THEN
            PERFORM public.encolar_calificacion_post_cita();
            PERFORM public.despachar_cola_mensajes(5);
          END IF;
        END IF;

      END IF;

      RETURN NEW;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Error en trg_fn_cita_completada_sellos: %', SQLERRM;
      RETURN NEW;
    END;
    $$;
  `;

  await client.query(sqlFunc);
  console.log('Función trg_fn_cita_completada_sellos actualizada para INSERT y UPDATE.');

  // 2. Modificar el trigger en la tabla Citas para que escuche AFTER INSERT OR UPDATE
  await client.query(`DROP TRIGGER IF EXISTS trg_cita_completada_sellos ON public."Citas";`);
  await client.query(`
    CREATE TRIGGER trg_cita_completada_sellos
    AFTER INSERT OR UPDATE ON public."Citas"
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_fn_cita_completada_sellos();
  `);
  console.log('Trigger trg_cita_completada_sellos recreado como AFTER INSERT OR UPDATE.');

  // 3. Disparar ahora mismo para la cita 1405 recién creada
  await client.query(`SELECT public.encolar_calificacion_post_cita();`);
  const dispatchRes = await client.query(`SELECT public.despachar_cola_mensajes(5);`);
  console.log('Despacho ejecutado:', dispatchRes.rows);

  const cola = await client.query(`
    SELECT id, cliente_id, telefono, flujo, estado, error_mensaje, enviado_at
    FROM public.cola_mensajes_salientes
    WHERE cita_id = 1405;
  `);
  console.log('Mensaje en cola para cita 1405:', cola.rows);

  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
