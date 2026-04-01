-- =========================================================================
-- SCRIPT DE CORRECCIÓN: FIX NOMBRE SALON + RETOQUES EN RPC
-- =========================================================================

-- 1. Eliminamos el nombre_salon vacio de todos los negocios actuales (Opcional, pero limpia la DB)
DELETE FROM public.negocio_info WHERE clave = 'nombre_salon' AND (valor = '' OR valor IS NULL);

-- 2. Sobre-escribimos el RPC onboarding_step_1_cuenta para NO insertar 'nombre_salon'
CREATE OR REPLACE FUNCTION public.onboarding_step_1_cuenta(
    p_token_id uuid,
    p_nombre_persona text,
    p_nombre_negocio text,
    p_email text,
    p_password text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_business_id uuid;
    v_user_id uuid;
BEGIN
    -- NOTA: Supabase Auth ya creó el usuario mediante signUp, aquí necesitamos el ID del admin
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_email LIMIT 1;
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no encontrado en auth.users con el email %', p_email;
    END IF;

    -- 1. Insertar el negocio (nombre del negocio va directamente a la tabla `negocios`)
    INSERT INTO public.negocios (nombre, user_id)
    VALUES (p_nombre_negocio, v_user_id)
    RETURNING id INTO v_business_id;

    -- (YA NO INSERTAMOS 'nombre_salon' VACÍO EN negocio_info)
    -- Insertamos otras cosas si hiciera falta como onboarding status inicial, o lo dejamos así
    INSERT INTO public.negocio_info (business_id, clave, valor, descripcion)
    VALUES (v_business_id, 'email_contacto', p_email, 'Email del administrador principal');

    -- 2. Actualizar el token con el ID del negocio y avanzar al paso 2
    UPDATE public.onboarding_tokens
    SET business_id = v_business_id,
        paso_actual = 2,
        updated_at = NOW()
    WHERE id = p_token_id;

    RETURN v_business_id;
END;
$$;

-- 3. Creamos un nuevo RPC para guardar el paso de Retoques de Mantenimiento (Paso 7)
CREATE OR REPLACE FUNCTION public.onboarding_step_7_retoques(
    p_token_id uuid,
    p_business_id uuid,
    p_retoques jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Guardamos la lista de retoques como un JSON array en negocio_info
    INSERT INTO public.negocio_info (business_id, clave, valor, descripcion)
    VALUES (p_business_id, 'recordatorios_retoque', p_retoques::text, 'Lista de configuración de retenciones y retoques de mantenimiento')
    ON CONFLICT (business_id, clave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW();

    -- Actualizamos el token al siguiente paso (8: Fidelización)
    UPDATE public.onboarding_tokens
    SET paso_actual = 8,
        datos_parciales = p_retoques,
        updated_at = NOW()
    WHERE id = p_token_id;
END;
$$;
