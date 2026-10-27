const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function main() {
  await client.connect();

  const sql = `
    CREATE OR REPLACE FUNCTION public.trg_fn_cita_completada_sellos()
     RETURNS trigger
     LANGUAGE plpgsql
     SECURITY DEFINER
    AS $$
    DECLARE
      v_sellos_activos boolean := false;
      v_ahora_negocio time;
      v_timezone text := 'America/Lima';
    BEGIN
      IF NEW.estado = 'Completada' AND (OLD.estado IS DISTINCT FROM 'Completada') THEN
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

        -- 2. Disparo instantaneo de encuesta post-cita si la cita ya finalizo hace > 30 min y estamos en horario habil
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

  await client.query(sql);
  console.log('Trigger trg_fn_cita_completada_sellos actualizado exitosamente.');
  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
