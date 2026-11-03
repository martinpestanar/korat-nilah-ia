const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function run() {
  await client.connect();

  console.log('1. Actualizando fn_dias_para_cumpleanos para soportar DD/MM y MM-DD sin año...');
  await client.query(`
CREATE OR REPLACE FUNCTION public.fn_dias_para_cumpleanos(p_cumpleanos text, p_referencia date DEFAULT CURRENT_DATE)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
AS $function$
DECLARE
  v_str text;
  v_dia int;
  v_mes int;
  v_ano_ref int;
  v_proximo_cumple date;
  v_dias int;
BEGIN
  IF p_cumpleanos IS NULL OR btrim(p_cumpleanos) = '' THEN
    RETURN -1;
  END IF;

  -- Limpiar timestamps ISO si vienen con T o espacio (ej: 1994-09-28T00:00:00)
  v_str := btrim(p_cumpleanos);
  v_str := btrim(split_part(v_str, 'T', 1));
  v_str := btrim(split_part(v_str, ' ', 1));

  -- Formato DD/MM/YYYY o DD-MM-YYYY (con año de 4 dígitos al final)
  IF v_str ~ '^[0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{4}$' THEN
    v_dia := split_part(regexp_replace(v_str, '[-]', '/', 'g'), '/', 1)::int;
    v_mes := split_part(regexp_replace(v_str, '[-]', '/', 'g'), '/', 2)::int;

  -- Formato YYYY-MM-DD o YYYY/MM/DD (con año de 4 dígitos al inicio)
  ELSIF v_str ~ '^[0-9]{4}[/-][0-9]{1,2}[/-][0-9]{1,2}$' THEN
    v_dia := split_part(regexp_replace(v_str, '[-]', '/', 'g'), '/', 3)::int;
    v_mes := split_part(regexp_replace(v_str, '[-]', '/', 'g'), '/', 2)::int;

  -- NUEVO FORMATO SIN AÑO: DD/MM o DD-MM (ej: 07/11, 7/11, 28/09)
  ELSIF v_str ~ '^[0-9]{1,2}[/-][0-9]{1,2}$' THEN
    v_dia := split_part(regexp_replace(v_str, '[-]', '/', 'g'), '/', 1)::int;
    v_mes := split_part(regexp_replace(v_str, '[-]', '/', 'g'), '/', 2)::int;

  -- NUEVO FORMATO SIN AÑO ISO: MM-DD (si el primer número es mes y segundo día > 12)
  -- Nota: si ambos son <= 12, DD/MM es el estándar en Latinoamérica
  ELSE
    BEGIN
      v_dia := extract(day from v_str::timestamptz)::int;
      v_mes := extract(month from v_str::timestamptz)::int;
    EXCEPTION WHEN OTHERS THEN
      RETURN -1;
    END;
  END IF;

  IF v_dia IS NULL OR v_mes IS NULL OR v_dia < 1 OR v_dia > 31 OR v_mes < 1 OR v_mes > 12 THEN
    RETURN -1;
  END IF;

  v_ano_ref := extract(year from p_referencia)::int;

  -- Manejo de 29 de febrero en años no bisiestos
  IF v_mes = 2 AND v_dia = 29 THEN
    IF NOT ((mod(v_ano_ref, 4) = 0 AND mod(v_ano_ref, 100) != 0) OR mod(v_ano_ref, 400) = 0) THEN
      v_dia := 28;
    END IF;
  END IF;

  BEGIN
    v_proximo_cumple := make_date(v_ano_ref, v_mes, v_dia);
  EXCEPTION WHEN OTHERS THEN
    RETURN -1;
  END;

  -- Si ya pasó este año, el próximo cumpleaños es el siguiente año
  IF v_proximo_cumple < p_referencia THEN
    v_ano_ref := v_ano_ref + 1;
    IF v_mes = 2 AND v_dia = 29 THEN
      IF NOT ((mod(v_ano_ref, 4) = 0 AND mod(v_ano_ref, 100) != 0) OR mod(v_ano_ref, 400) = 0) THEN
        v_dia := 28;
      END IF;
    END IF;
    v_proximo_cumple := make_date(v_ano_ref, v_mes, v_dia);
  END IF;

  v_dias := (v_proximo_cumple - p_referencia);
  RETURN v_dias;
END;
$function$;
  `);

  console.log('2. Probando fn_dias_para_cumpleanos con casos reales...');
  const tests = await client.query(`
    SELECT 
      public.fn_dias_para_cumpleanos('07/11', '2026-11-02'::date) as dd_mm_barra,
      public.fn_dias_para_cumpleanos('07-11', '2026-11-02'::date) as dd_mm_guion,
      public.fn_dias_para_cumpleanos('7/11', '2026-11-02'::date) as d_m_barra,
      public.fn_dias_para_cumpleanos('1989-11-07', '2026-11-02'::date) as yyyy_mm_dd,
      public.fn_dias_para_cumpleanos('07/11/1989', '2026-11-02'::date) as dd_mm_yyyy,
      public.fn_dias_para_cumpleanos('02/11', '2026-11-02'::date) as hoy_sin_ano,
      public.fn_coincide_dia_mes_cumpleanos('07/11', '2026-11-07'::date) as coincide_sin_ano
  `);
  console.log('Resultados de pruebas en DB:', tests.rows[0]);

  await client.end();
}

run().catch(console.error);
