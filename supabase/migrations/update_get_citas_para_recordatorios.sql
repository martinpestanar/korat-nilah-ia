-- Migration: update_get_citas_para_recordatorios
-- Description: Optimizacion de intervalos para recordatorios de 24h y 3h para evitar desfases de horario y envios tempranos.

CREATE OR REPLACE FUNCTION public.get_citas_para_recordatorios(p_business_id uuid)
 RETURNS TABLE(cita_id bigint, cliente_id bigint, business_id uuid, nombre text, telefono text, servicio text, fecha timestamp with time zone, tipo_recordatorio text, campo_actualizar text, hora_formateada text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_now timestamp with time zone := now();
BEGIN
  RETURN QUERY
  SELECT 
    ci.id AS cita_id,
    c.id AS cliente_id,
    ci.business_id,
    initcap(split_part(trim(c.nombre), ' ', 1)) AS nombre,
    c.telefono,
    ci.servicio,
    ci.fecha,
    
    CASE 
      -- Recordatorio 24h: Margen de 2 horas desde la creación para evitar spam inmediato
      WHEN ci.recordatorio_24h_enviado = false 
           AND ci.fecha >= (v_now + interval '23 hours') 
           AND ci.fecha <= (v_now + interval '24 hours 30 minutes') 
           AND (v_now - ci.created_at) > interval '2 hours'
      THEN 'recordatorio_24h'
      
      -- Recordatorio 3h: Margen de 2 horas desde la creación
      WHEN ci.recordatorio_3h_enviado = false 
           AND ci.fecha >= (v_now + interval '1 hour') 
           AND ci.fecha <= (v_now + interval '3 hours 15 minutes') 
           AND (v_now - ci.created_at) > interval '2 hours'
      THEN 'recordatorio_3h'
    END AS tipo_recordatorio,
    
    CASE 
      WHEN ci.recordatorio_24h_enviado = false 
           AND ci.fecha >= (v_now + interval '23 hours') 
           AND ci.fecha <= (v_now + interval '24 hours 30 minutes') 
           AND (v_now - ci.created_at) > interval '2 hours'
      THEN 'recordatorio_24h_enviado'
      
      WHEN ci.recordatorio_3h_enviado = false 
           AND ci.fecha >= (v_now + interval '1 hour') 
           AND ci.fecha <= (v_now + interval '3 hours 15 minutes') 
           AND (v_now - ci.created_at) > interval '2 hours'
      THEN 'recordatorio_3h_enviado'
    END AS campo_actualizar,
    
    to_char(ci.fecha AT TIME ZONE coalesce(neg.timezone, 'America/Lima'), 'FMHH12:MI AM') AS hora_formateada
    
  FROM "Citas" ci
  JOIN "Clientes" c ON c.id = ci.cliente_id
  JOIN "negocios" neg ON neg.id = ci.business_id
  WHERE ci.business_id = p_business_id
    AND (ci.estado ILIKE 'pendiente' OR ci.estado ILIKE 'confirmada' OR ci.estado ILIKE 'reagendada')
    AND c.telefono IS NOT NULL AND c.telefono <> ''
    -- Horario de Silencio: Solo procesar recordatorios entre 8:00 AM y 9:00 PM hora local
    AND EXTRACT(HOUR FROM (v_now AT TIME ZONE coalesce(neg.timezone, 'America/Lima'))) BETWEEN 8 AND 20
    AND (
      (ci.recordatorio_24h_enviado = false 
       AND ci.fecha >= (v_now + interval '23 hours') 
       AND ci.fecha <= (v_now + interval '24 hours 30 minutes')
       AND (v_now - ci.created_at) > interval '2 hours')
      OR
      (ci.recordatorio_3h_enviado = false 
       AND ci.fecha >= (v_now + interval '1 hour') 
       AND ci.fecha <= (v_now + interval '3 hours 15 minutes')
       AND (v_now - ci.created_at) > interval '2 hours')
    )
  ORDER BY ci.fecha ASC;
END;
$function$;
