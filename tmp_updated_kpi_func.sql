CREATE OR REPLACE FUNCTION public.get_business_snapshot(p_business_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        
        -- 1. CONTEXTO DEL NEGOCIO
        'negocio', (
            SELECT jsonb_build_object('nombre', nombre, 'ubicacion', ubicacion, 'idioma', idioma, 'nombre_admin', nombre_admin) 
            FROM "public"."negocios" WHERE id = p_business_id
        ),
        
        -- 2. SALUD FINANCIERA (MES ACTUAL VS MES ANTERIOR) - Citas
        'finanzas_mes_citas', (
            WITH mes_actual AS (
                SELECT COALESCE(SUM(precio), 0) as ingresos, COUNT(id) as citas, COALESCE(AVG(precio), 0) as ticket_promedio
                FROM "public"."Citas" WHERE business_id = p_business_id AND date_trunc('month', fecha) = date_trunc('month', CURRENT_DATE) AND estado ILIKE '%completad%'
            ),
            mes_anterior AS (
                SELECT COALESCE(SUM(precio), 0) as ingresos, COUNT(id) as citas, COALESCE(AVG(precio), 0) as ticket_promedio
                FROM "public"."Citas" WHERE business_id = p_business_id AND date_trunc('month', fecha) = date_trunc('month', CURRENT_DATE - INTERVAL '1 month') AND estado ILIKE '%completad%'
            )
            SELECT jsonb_build_object(
                'actual_ingresos', a.ingresos, 'actual_citas', a.citas, 'actual_ticket', a.ticket_promedio,
                'anterior_ingresos', p.ingresos, 'anterior_citas', p.citas, 'anterior_ticket', p.ticket_promedio
            ) FROM mes_actual a CROSS JOIN mes_anterior p
        ),

        -- 3. GASTOS, NÓMINA E IMPUESTOS (NUEVO MÓDULO FINANZAS)
        'salud_financiera_integral', (
            WITH gastos_mes AS (
                SELECT COALESCE(SUM(amount), 0) as total_gastos
                FROM "public"."finances_expenses" 
                WHERE business_id = p_business_id AND date_trunc('month', expense_date) = date_trunc('month', CURRENT_DATE)
            ),
            nomina_mes AS (
                SELECT COALESCE(SUM(amount), 0) as total_nomina
                FROM "public"."finances_payroll" 
                WHERE business_id = p_business_id AND date_trunc('month', payment_date) = date_trunc('month', CURRENT_DATE)
            ),
            config_impuestos AS (
                SELECT tax_country, tax_regime, tax_percentage, currency
                FROM "public"."finances_settings" WHERE business_id = p_business_id
            )
            SELECT jsonb_build_object(
                'gastos_mes_actual', g.total_gastos,
                'nomina_mes_actual', n.total_nomina,
                'pais_impuestos', c.tax_country,
                'regimen_impuestos', c.tax_regime,
                'moneda', c.currency
            ) FROM gastos_mes g CROSS JOIN nomina_mes n LEFT JOIN config_impuestos c ON true LIMIT 1
        ),

        -- 4. EL PULSO DE HOY Y RESGUARDOS
        'metricas_hoy', (
            SELECT jsonb_build_object(
                'total_citas', COUNT(*),
                'pendientes', COUNT(*) FILTER (WHERE estado ILIKE 'pendiente'),
                'confirmadas', COUNT(*) FILTER (WHERE estado ILIKE 'confirmad%'),
                'ingreso_esperado', COALESCE(SUM(precio) FILTER (WHERE estado NOT ILIKE '%cancelad%' AND estado NOT ILIKE '%no_show%'), 0),
                'citas_con_deposito', COUNT(*) FILTER (WHERE requiere_deposito = true)
            ) FROM "public"."Citas" WHERE business_id = p_business_id AND fecha::date = CURRENT_DATE
        ),

        -- 5. CALIDAD DEL SERVICIO (ÚLTIMOS 14 DÍAS)
        'calidad_y_feedback_14d', (
            WITH feedbacks AS (
                SELECT calificacion, feedback_cliente
                FROM "public"."Citas"
                WHERE business_id = p_business_id 
                  AND fecha >= CURRENT_DATE - INTERVAL '14 days'
                  AND calificacion IS NOT NULL AND calificacion != '0' AND calificacion != ''
            )
            SELECT jsonb_build_object(
                'calificacion_promedio', (SELECT COALESCE(AVG(NULLIF(regexp_replace(calificacion, '[^0-9.]', '', 'g'), '')::numeric), 5.0) FROM feedbacks),
                'total_resenas', (SELECT COUNT(*) FROM feedbacks),
                'ultimos_comentarios', (SELECT COALESCE(jsonb_agg(feedback_cliente), '[]'::jsonb) FROM (SELECT feedback_cliente FROM feedbacks WHERE feedback_cliente IS NOT NULL AND feedback_cliente != '' LIMIT 5) f)
            )
        ),

        -- 6. FIABILIDAD PROMEDIO DE LA BASE DE CLIENTES
        'salud_base_clientes', (
            SELECT jsonb_build_object(
                'fiabilidad_score_promedio', COALESCE(AVG(fiabilidad_score), 100)
            ) FROM "public"."Clientes" WHERE business_id = p_business_id
        ),

        -- 7. DESEMPEÑO DEL STAFF (Top Staff del mes)
        'rendimiento_staff_mes', (
            SELECT COALESCE(jsonb_agg(d), '[]'::jsonb) FROM (
                SELECT s.nombre, COUNT(c.id) as total_citas, SUM(c.precio) as ingresos_generados
                FROM "public"."Citas" c
                LEFT JOIN "public"."staff" s ON c.staff_id = s.id
                WHERE c.business_id = p_business_id AND date_trunc('month', c.fecha) = date_trunc('month', CURRENT_DATE) AND c.estado ILIKE '%completad%'
                GROUP BY s.nombre
                ORDER BY ingresos_generados DESC NULLS LAST
                LIMIT 3
            ) d
        ),
        
        -- 8. REPORTE DE RETENCIÓN EXTREMA
        'adquisicion_y_fugas', (
            SELECT jsonb_build_object(
                'nuevos_este_mes', COUNT(*) FILTER (WHERE date_trunc('month', fecha) = date_trunc('month', CURRENT_DATE)),
                'en_riesgo_general', COUNT(*) FILTER (WHERE nivel_riesgo ILIKE 'alto' OR nivel_riesgo ILIKE 'medio'),
                'vip_fuga', COUNT(*) FILTER (WHERE (categoria ILIKE '%VIP%' OR categoria ILIKE '%Platino%') AND ultima_visita < (CURRENT_DATE - INTERVAL '45 days'))
            ) FROM "public"."Clientes" WHERE business_id = p_business_id
        ),
        
        -- 9. ESTRATEGIA: MARKETING ACTIVO Y OPORTUNIDADES (ACTUALIZADO)
        'marketing_estrategico', (
            SELECT jsonb_build_object(
                'cumpleaneros_proximos_7d', (SELECT COUNT(*) FROM "public"."Clientes" WHERE business_id = p_business_id AND cumpleanos IS NOT NULL AND cumpleanos != ''),
                'rescates_exitosos_historial', (SELECT COUNT(*) FROM "public"."Clientes" WHERE business_id = p_business_id AND rescate_exitoso = true),
                'campanas_activas', (
                    SELECT COALESCE(jsonb_agg(jsonb_build_object(
                        'nombre', titulo, 
                        'estado', estado, 
                        'segmento', segmento,
                        'semana_del_mes', semana_del_mes,
                        'tipo_promo', tipo_promo,
                        'tono', tono
                    )), '[]'::jsonb)
                    FROM "public"."campanas" WHERE business_id = p_business_id AND estado != 'completada' AND fecha_programada >= CURRENT_DATE - INTERVAL '30 days'
                ),
                'segmentos_creados', (
                    SELECT COALESCE(jsonb_agg(jsonb_build_object(
                        'nombre', name,
                        'filtros_usados', filters
                    )), '[]'::jsonb)
                    FROM "public"."crm_segments" WHERE business_id = p_business_id
                )
            )
        )

    ) INTO result;

    RETURN result;
END;
$function$;
