-- Migración: Soporte para 'ninguno' en fidelización y actualización de superadmin_update_negocio_full

ALTER TYPE modo_fidelizacion_enum ADD VALUE IF NOT EXISTS 'ninguno';

CREATE OR REPLACE FUNCTION public.superadmin_update_negocio_full(
  p_negocio_id uuid,
  p_recursos jsonb DEFAULT NULL::jsonb,
  p_tipo_fidelizacion text DEFAULT NULL::text,
  p_plan text DEFAULT NULL::text,
  p_estado text DEFAULT NULL::text,
  p_destellos_disponibles integer DEFAULT NULL::integer,
  p_destellos_limite_mensual integer DEFAULT NULL::integer,
  p_modo_fidelizacion text DEFAULT NULL::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_plan_clean text;
  v_plan_norm text;
  v_recursos_final jsonb;
  v_auto jsonb;
  v_flujos_activos jsonb;
  v_current_bc jsonb;
  v_has_any_active boolean;
  v_modo_enum modo_fidelizacion_enum;
BEGIN
  IF p_plan IS NOT NULL THEN
    v_plan_clean := lower(trim(p_plan));
    IF v_plan_clean LIKE '%pro%' OR v_plan_clean = 'glow_pro' THEN
      v_plan_norm := 'glow_pro';
    ELSE
      v_plan_norm := 'glow';
    END IF;
  END IF;

  IF p_recursos IS NOT NULL THEN
    v_recursos_final := p_recursos;
  ELSIF v_plan_norm IS NOT NULL THEN
    SELECT COALESCE(recursos_saas, '{}'::jsonb) || jsonb_build_object('plan_base', v_plan_norm, 'plan', v_plan_norm)
      INTO v_recursos_final
      FROM public.negocios WHERE id = p_negocio_id;
  END IF;

  IF p_modo_fidelizacion IS NOT NULL THEN
    IF lower(p_modo_fidelizacion) IN ('sellos', 'puntos', 'ambos', 'ninguno') THEN
      v_modo_enum := lower(p_modo_fidelizacion)::modo_fidelizacion_enum;
    END IF;
  END IF;

  -- Actualizar el negocio
  UPDATE public.negocios
  SET
    recursos_saas            = COALESCE(v_recursos_final, recursos_saas),
    tipo_fidelizacion        = COALESCE(p_tipo_fidelizacion, tipo_fidelizacion),
    modo_fidelizacion        = COALESCE(v_modo_enum, modo_fidelizacion),
    plan_suscripcion         = COALESCE(v_plan_norm, p_plan, plan_suscripcion),
    plan                     = COALESCE(v_plan_norm, p_plan, plan),
    estado                   = COALESCE(p_estado, estado),
    destellos_disponibles    = COALESCE(p_destellos_disponibles, destellos_disponibles),
    destellos_limite_mensual = COALESCE(p_destellos_limite_mensual, destellos_limite_mensual)
  WHERE id = p_negocio_id;

  -- Sincronizar add-ons en sellos_config si viene en recursos
  IF v_recursos_final IS NOT NULL AND v_recursos_final ? 'sellos_addons' THEN
    UPDATE public.sellos_config
    SET
      addons_activos = jsonb_build_object(
        'recordatorio', COALESCE((v_recursos_final->'sellos_addons'->>'proxima_cita_reminder')::boolean, (v_recursos_final->'sellos_addons'->>'recordatorio')::boolean, false),
        'reactivacion', COALESCE((v_recursos_final->'sellos_addons'->>'alerta_vencimiento')::boolean, (v_recursos_final->'sellos_addons'->>'reactivacion')::boolean, false),
        'cumpleanos', COALESCE((v_recursos_final->'sellos_addons'->>'cumpleanos_vip')::boolean, (v_recursos_final->'sellos_addons'->>'cumpleanos')::boolean, false),
        'referidas', COALESCE((v_recursos_final->'sellos_addons'->>'referidos_sellos')::boolean, (v_recursos_final->'sellos_addons'->>'referidas')::boolean, false),
        'dias_muertos', COALESCE((v_recursos_final->'sellos_addons'->>'dias_muertos_doble')::boolean, (v_recursos_final->'sellos_addons'->>'dias_muertos')::boolean, false),
        'iman_rescate', COALESCE((v_recursos_final->'sellos_addons'->>'rescate_ausentes')::boolean, (v_recursos_final->'sellos_addons'->>'iman_rescate')::boolean, false),
        'cierre_rapido', COALESCE((v_recursos_final->'sellos_addons'->>'cierre_rapido_whatsapp')::boolean, (v_recursos_final->'sellos_addons'->>'cierre_rapido')::boolean, false),
        'roi_dashboard', COALESCE((v_recursos_final->'sellos_addons'->>'roi_metrics_dashboard')::boolean, (v_recursos_final->'sellos_addons'->>'roi_dashboard')::boolean, false)
      ),
      acelerador_martes = COALESCE((v_recursos_final->'sellos_addons'->>'dias_muertos_doble')::boolean, false),
      updated_at = now()
    WHERE business_id = p_negocio_id;
  END IF;

  -- Cascada estricta: Si se actualizaron los recursos/automatizaciones, bajar a bot_config->flujos_activos
  IF v_recursos_final IS NOT NULL THEN
    v_auto := COALESCE(v_recursos_final->'automatizaciones', '{}'::jsonb);

    v_flujos_activos := jsonb_build_object(
      'mantenimiento', COALESCE((v_auto->>'permitir_mantenimiento')::boolean, (v_auto->>'mantenimiento_activo')::boolean, false),
      'retoques', COALESCE((v_auto->>'permitir_mantenimiento')::boolean, (v_auto->>'mantenimiento_activo')::boolean, false),
      'recordatorios', COALESCE((v_auto->>'permitir_recordatorios')::boolean, (v_auto->>'recordatorios_activos')::boolean, false),
      'rescate', COALESCE((v_auto->>'permitir_rescate')::boolean, (v_auto->>'rescate_activo')::boolean, false),
      'fidelizacion', CASE 
        WHEN v_modo_enum = 'ninguno' THEN false
        ELSE COALESCE((v_auto->>'permitir_post_cita')::boolean, (v_auto->>'post_cita_activo')::boolean, (v_auto->>'permitir_fidelizacion_directa')::boolean, (v_auto->>'fidelizacion_directa_activa')::boolean, false)
      END,
      'cuidados', COALESCE((v_auto->>'permitir_cuidados')::boolean, (v_auto->>'cuidados_activo')::boolean, false),
      'cumpleanos', COALESCE((v_auto->>'permitir_cumpleanos')::boolean, (v_auto->>'cumpleanos_activo')::boolean, false)
    );

    v_has_any_active := (
      (v_flujos_activos->>'mantenimiento')::boolean OR
      (v_flujos_activos->>'recordatorios')::boolean OR
      (v_flujos_activos->>'rescate')::boolean OR
      (v_flujos_activos->>'fidelizacion')::boolean OR
      (v_flujos_activos->>'cuidados')::boolean OR
      (v_flujos_activos->>'cumpleanos')::boolean
    );

    SELECT COALESCE(bot_config, '{}'::jsonb) INTO v_current_bc FROM public.negocios WHERE id = p_negocio_id;

    UPDATE public.negocios
    SET bot_config = jsonb_set(
      jsonb_set(v_current_bc, '{flujos_activos}', v_flujos_activos, true),
      '{bot_enabled}',
      to_jsonb(v_has_any_active),
      true
    )
    WHERE id = p_negocio_id;
  END IF;
END;
$function$;
