-- Migración: Corrección SuperAdmin Fidelización, Sellos y Persistencia Completa
-- Corrige superadmin_fetch_all_negocios_v2, superadmin_fetch_all_negocios, v_superadmin_negocios y superadmin_update_negocio_full

-- 1. Actualizar v_superadmin_negocios
DROP VIEW IF EXISTS public.v_superadmin_negocios CASCADE;

CREATE OR REPLACE VIEW public.v_superadmin_negocios AS
 SELECT n.id,
    n.nombre,
    n.plan_suscripcion AS plan,
    n.estado,
    n.recursos_saas,
    n.tipo_fidelizacion,
    COALESCE(n.modo_fidelizacion::text, 'sellos') AS modo_fidelizacion,
    n.destellos_disponibles,
    n.destellos_limite_mensual,
    n.destellos_reset_fecha,
    n.fecha_registro,
    n.color_primario,
    n.logo_url,
    n.telefono_recepcionista,
    n.email AS email_negocio,
    n.pais,
    n.moneda,
    n.nombre_admin,
    ( SELECT row_to_json(u_sub.*) AS row_to_json
           FROM ( SELECT u.nombre_persona,
                    u.email,
                    u.role
                   FROM "Usuarios" u
                  WHERE ((u.business_id = n.id) AND (lower(u.role) = ANY (ARRAY['admin'::text, 'dueno'::text, 'dueño'::text, 'owner'::text])))
                 LIMIT 1) u_sub) AS owner,
    ( SELECT (count(*))::integer AS count
           FROM "Usuarios" u
          WHERE (u.business_id = n.id)) AS total_usuarios,
    ( SELECT (count(*))::integer AS count
           FROM staff s
          WHERE (s.business_id = n.id)) AS total_staff,
    ( SELECT (count(*))::integer AS count
           FROM "Citas" c
          WHERE ((c.business_id = n.id) AND (c.fecha >= date_trunc('month'::text, now())))) AS citas_mes,
    ( SELECT t.token
           FROM onboarding_tokens t
          WHERE ((t.business_id = n.id) OR (t.email = n.email))
          ORDER BY t.created_at DESC
         LIMIT 1) AS ultimo_token,
    ( SELECT t.completado
           FROM onboarding_tokens t
          WHERE ((t.business_id = n.id) OR (t.email = n.email))
          ORDER BY t.created_at DESC
         LIMIT 1) AS onboarding_completado,
    ( SELECT t.paso_actual
           FROM onboarding_tokens t
          WHERE ((t.business_id = n.id) OR (t.email = n.email))
          ORDER BY t.created_at DESC
         LIMIT 1) AS onboarding_paso,
    ( SELECT (EXISTS ( SELECT 1
                   FROM business_briefs b
                  WHERE (b.business_id = n.id))) AS "exists") AS brief_completado,
    ( SELECT (count(*))::integer AS count
           FROM "Clientes" cl
          WHERE ((cl.business_id = n.id) AND (cl."Estado" = 'Activo'::text))) AS clientes_activos,
    ( SELECT (count(*))::integer AS count
           FROM servicios s
          WHERE (s.business_id = n.id)) AS tutorial_servicios_count,
    ( SELECT (count(*))::integer AS count
           FROM "Clientes" cl
          WHERE (cl.business_id = n.id)) AS tutorial_clientes_count,
    ( SELECT (count(*))::integer AS count
           FROM "Citas" ct
          WHERE (ct.business_id = n.id)) AS tutorial_citas_count,
    COALESCE(n.idioma, 'es-PE'::text) AS idioma
   FROM negocios n;

-- 2. Actualizar superadmin_fetch_all_negocios_v2
DROP FUNCTION IF EXISTS public.superadmin_fetch_all_negocios_v2();

CREATE OR REPLACE FUNCTION public.superadmin_fetch_all_negocios_v2()
 RETURNS TABLE(
   id uuid,
   nombre text,
   plan text,
   estado text,
   recursos_saas jsonb,
   tipo_fidelizacion text,
   modo_fidelizacion text,
   destellos_disponibles integer,
   destellos_limite_mensual integer,
   destellos_reset_fecha timestamp with time zone,
   fecha_registro timestamp with time zone,
   color_primario text,
   logo_url text,
   telefono_recepcionista text,
   email_negocio text,
   pais text,
   moneda text,
   idioma text,
   nombre_admin text,
   instance_id text,
   instance_name text,
   api_key text,
   owner jsonb,
   total_usuarios integer,
   total_staff integer,
   citas_mes integer,
   ultimo_token text,
   onboarding_completado boolean,
   onboarding_paso text,
   brief_completado boolean,
   clientes_activos integer,
   tutorial_servicios_count integer,
   tutorial_clientes_count integer,
   tutorial_citas_count integer
 )
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
      SELECT
        n.id,
        n.nombre,
        n.plan_suscripcion AS plan,
        n.estado,
        n.recursos_saas,
        n.tipo_fidelizacion,
        COALESCE(n.modo_fidelizacion::text, 'sellos') AS modo_fidelizacion,
        n.destellos_disponibles,
        n.destellos_limite_mensual,
        n.destellos_reset_fecha,
        n.fecha_registro,
        n.color_primario,
        n.logo_url,
        n.telefono_recepcionista,
        n.email AS email_negocio,
        n.pais,
        n.moneda,
        COALESCE(n.idioma, 'es-PE') AS idioma,
        n.nombre_admin,
        n.instance_id::text,
        n.instance_name,
        n.api_key,
        (SELECT row_to_json(u_sub)::jsonb
           FROM (
             SELECT u.nombre_persona, u.email, u.role
             FROM "Usuarios" u
             WHERE u.business_id = n.id
               AND lower(u.role) = ANY(ARRAY['admin','dueno','dueño','owner'])
             LIMIT 1
           ) u_sub
        ) AS owner,
        (SELECT count(*)::int FROM "Usuarios" u WHERE u.business_id = n.id) AS total_usuarios,
        (SELECT count(*)::int FROM staff s WHERE s.business_id = n.id) AS total_staff,
        (SELECT count(*)::int FROM "Citas" c WHERE c.business_id = n.id AND c.fecha >= date_trunc('month', now())) AS citas_mes,
        (SELECT t.token FROM onboarding_tokens t WHERE (t.business_id = n.id OR t.email = n.email) ORDER BY t.created_at DESC LIMIT 1) AS ultimo_token,
        (SELECT t.completado FROM onboarding_tokens t WHERE (t.business_id = n.id OR t.email = n.email) ORDER BY t.created_at DESC LIMIT 1) AS onboarding_completado,
        (SELECT t.paso_actual::text FROM onboarding_tokens t WHERE (t.business_id = n.id OR t.email = n.email) ORDER BY t.created_at DESC LIMIT 1) AS onboarding_paso,
        (SELECT EXISTS(SELECT 1 FROM business_briefs b WHERE b.business_id = n.id)) AS brief_completado,
        (SELECT count(*)::int FROM "Clientes" cl WHERE cl.business_id = n.id AND cl."Estado" = 'Activo') AS clientes_activos,
        (SELECT count(*)::int FROM "servicios" s WHERE s.business_id = n.id) AS tutorial_servicios_count,
        (SELECT count(*)::int FROM "Clientes" cl WHERE cl.business_id = n.id) AS tutorial_clientes_count,
        (SELECT count(*)::int FROM "Citas" ct WHERE ct.business_id = n.id) AS tutorial_citas_count
      FROM negocios n
      ORDER BY n.fecha_registro DESC;
$function$;

-- 3. Actualizar superadmin_fetch_all_negocios (v1 fallback)
DROP FUNCTION IF EXISTS public.superadmin_fetch_all_negocios();

CREATE OR REPLACE FUNCTION public.superadmin_fetch_all_negocios()
 RETURNS TABLE(
   id uuid,
   nombre text,
   plan text,
   estado text,
   recursos_saas jsonb,
   tipo_fidelizacion text,
   modo_fidelizacion text,
   destellos_disponibles integer,
   destellos_limite_mensual integer,
   destellos_reset_fecha timestamp with time zone,
   fecha_registro timestamp with time zone,
   color_primario text,
   logo_url text,
   telefono_recepcionista text,
   email_negocio text,
   pais text,
   moneda text,
   idioma text,
   nombre_admin text,
   instance_id text,
   instance_name text,
   api_key text,
   owner jsonb,
   total_usuarios integer,
   total_staff integer,
   citas_mes integer,
   ultimo_token text,
   onboarding_completado boolean,
   onboarding_paso text,
   brief_completado boolean,
   clientes_activos integer
 )
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
      SELECT
        n.id,
        n.nombre,
        n.plan_suscripcion AS plan,
        n.estado,
        n.recursos_saas,
        n.tipo_fidelizacion,
        COALESCE(n.modo_fidelizacion::text, 'sellos') AS modo_fidelizacion,
        n.destellos_disponibles,
        n.destellos_limite_mensual,
        n.destellos_reset_fecha,
        n.fecha_registro,
        n.color_primario,
        n.logo_url,
        n.telefono_recepcionista,
        n.email AS email_negocio,
        n.pais,
        n.moneda,
        COALESCE(n.idioma, 'es-PE') AS idioma,
        n.nombre_admin,
        n.instance_id::text,
        n.instance_name,
        n.api_key,
        (SELECT row_to_json(u_sub)::jsonb
           FROM (
             SELECT u.nombre_persona, u.email, u.role
             FROM "Usuarios" u
             WHERE u.business_id = n.id
               AND lower(u.role) = ANY(ARRAY['admin','dueno','dueño','owner'])
             LIMIT 1
           ) u_sub
        ) AS owner,
        (SELECT count(*)::int FROM "Usuarios" u WHERE u.business_id = n.id) AS total_usuarios,
        (SELECT count(*)::int FROM staff s WHERE s.business_id = n.id) AS total_staff,
        (SELECT count(*)::int FROM "Citas" c WHERE c.business_id = n.id AND c.fecha >= date_trunc('month', now())) AS citas_mes,
        (SELECT t.token FROM onboarding_tokens t WHERE (t.business_id = n.id OR t.email = n.email) ORDER BY t.created_at DESC LIMIT 1) AS ultimo_token,
        (SELECT t.completado FROM onboarding_tokens t WHERE (t.business_id = n.id OR t.email = n.email) ORDER BY t.created_at DESC LIMIT 1) AS onboarding_completado,
        (SELECT t.paso_actual::text FROM onboarding_tokens t WHERE (t.business_id = n.id OR t.email = n.email) ORDER BY t.created_at DESC LIMIT 1) AS onboarding_paso,
        (SELECT EXISTS(SELECT 1 FROM business_briefs b WHERE b.business_id = n.id)) AS brief_completado,
        (SELECT count(*)::int FROM "Clientes" cl WHERE cl.business_id = n.id AND cl."Estado" = 'Activo') AS clientes_activos
      FROM negocios n
      ORDER BY n.fecha_registro DESC;
$function$;

-- 4. Actualizar superadmin_update_negocio_full (con p_modo_fidelizacion y sincronización sellos_config)
DROP FUNCTION IF EXISTS public.superadmin_update_negocio_full(uuid, jsonb, text, text, text, integer, integer);
DROP FUNCTION IF EXISTS public.superadmin_update_negocio_full(uuid, jsonb, text, text, text, integer, integer, text);

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
  v_plan_clean := lower(COALESCE(p_plan, ''));
  v_plan_norm := CASE
    WHEN v_plan_clean IN ('glow_pro', 'pro', 'automatico', 'auto') THEN 'glow_pro'
    WHEN v_plan_clean IN ('glow', 'free', 'basico') THEN 'glow'
    ELSE NULL
  END;

  IF p_recursos IS NOT NULL THEN
    v_recursos_final := p_recursos;
  ELSIF v_plan_norm IS NOT NULL THEN
    SELECT COALESCE(recursos_saas, '{}'::jsonb) || jsonb_build_object('plan_base', v_plan_norm, 'plan', v_plan_norm)
      INTO v_recursos_final
      FROM public.negocios WHERE id = p_negocio_id;
  END IF;

  IF p_modo_fidelizacion IS NOT NULL THEN
    IF lower(p_modo_fidelizacion) IN ('sellos', 'puntos', 'ambos') THEN
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
      'fidelizacion', COALESCE((v_auto->>'permitir_post_cita')::boolean, (v_auto->>'post_cita_activo')::boolean, (v_auto->>'permitir_fidelizacion_directa')::boolean, (v_auto->>'fidelizacion_directa_activa')::boolean, false),
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

  -- Sincronizar tabla Usuarios para que el plan se refleje inmediatamente
  IF v_plan_norm IS NOT NULL OR p_plan IS NOT NULL THEN
    UPDATE public."Usuarios"
    SET plan = CASE 
      WHEN COALESCE(v_plan_norm, p_plan) IN ('glow_pro', 'pro') THEN 'Glow Pro'
      ELSE 'Glow'
    END
    WHERE business_id = p_negocio_id;
  END IF;
END;
$function$;
