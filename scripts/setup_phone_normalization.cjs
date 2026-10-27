const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function main() {
  await client.connect();

  console.log('--- APLICANDO NORMALIZACIÓN DE TELÉFONOS EN BACKEND ---');

  const sql = `
    -- Función para normalizar números de teléfono según el país del negocio
    CREATE OR REPLACE FUNCTION public.fn_normalizar_telefono_cliente()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
        v_tel_limpio text;
        v_pais text := 'peru';
        v_prefijo text := '51';
    BEGIN
        IF NEW.telefono IS NOT NULL AND TRIM(NEW.telefono) <> '' THEN
            -- Eliminar espacios, guiones, paréntesis y símbolos
            v_tel_limpio := REGEXP_REPLACE(NEW.telefono, '[^0-9]', '', 'g');

            -- Obtener país del negocio si está disponible
            IF NEW.business_id IS NOT NULL THEN
                SELECT LOWER(COALESCE(pais, 'peru')) INTO v_pais
                FROM public.negocios
                WHERE id = NEW.business_id;

                v_prefijo := CASE v_pais
                    WHEN 'peru'      THEN '51'
                    WHEN 'perú'     THEN '51'
                    WHEN 'pe'        THEN '51'
                    WHEN 'colombia'  THEN '57'
                    WHEN 'co'        THEN '57'
                    WHEN 'mexico'    THEN '52'
                    WHEN 'méxico'   THEN '52'
                    WHEN 'mx'        THEN '52'
                    WHEN 'chile'     THEN '56'
                    WHEN 'cl'        THEN '56'
                    WHEN 'ecuador'   THEN '593'
                    WHEN 'ec'        THEN '593'
                    ELSE '51'
                END;
            END IF;

            -- Si es Perú y viene con 9 dígitos empezando en 9
            IF v_prefijo = '51' THEN
                IF LENGTH(v_tel_limpio) = 9 AND v_tel_limpio LIKE '9%' THEN
                    v_tel_limpio := '51' || v_tel_limpio;
                ELSIF LENGTH(v_tel_limpio) = 11 AND v_tel_limpio LIKE '519%' THEN
                    -- Ya tiene el 51 correctamente
                    NULL;
                END IF;
            -- Si es Colombia y viene con 10 dígitos empezando en 3
            ELSIF v_prefijo = '57' THEN
                IF LENGTH(v_tel_limpio) = 10 AND v_tel_limpio LIKE '3%' THEN
                    v_tel_limpio := '57' || v_tel_limpio;
                END IF;
            -- Si es Chile y viene con 9 dígitos empezando en 9
            ELSIF v_prefijo = '56' THEN
                IF LENGTH(v_tel_limpio) = 9 AND v_tel_limpio LIKE '9%' THEN
                    v_tel_limpio := '56' || v_tel_limpio;
                END IF;
            END IF;

            NEW.telefono := v_tel_limpio;
        END IF;

        RETURN NEW;
    END;
    $$;

    -- Trigger en Clientes
    DROP TRIGGER IF EXISTS trg_normalizar_telefono_cliente ON public."Clientes";
    CREATE TRIGGER trg_normalizar_telefono_cliente
    BEFORE INSERT OR UPDATE OF telefono ON public."Clientes"
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_normalizar_telefono_cliente();
  `;

  await client.query(sql);
  console.log('Trigger trg_normalizar_telefono_cliente creado exitosamente en Clientes.');

  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
