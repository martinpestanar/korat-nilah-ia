-- =========================================================================
-- SCRIPT DE ACTUALIZACIÓN DE RPCs - KORAT MVP
-- Función 1: onboarding_step_2_negocio (Arreglo de sincronización de horarios)
-- =========================================================================

CREATE OR REPLACE FUNCTION public.onboarding_step_2_negocio(
    p_token_id uuid,
    p_business_id uuid,
    p_data jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 1. Actualizar datos en la tabla `negocios` (país, moneda, logo, etc.)
    UPDATE public.negocios
    SET 
        pais = p_data->>'pais',
        ciudad = p_data->>'ubicacion',
        moneda = p_data->>'moneda',
        zonahoraria = p_data->>'timezone',
        color_primario = p_data->>'color_primario',
        logo_url = p_data->>'logo_url',
        updated_at = NOW()
    WHERE id = p_business_id;

    -- 2. Asegurar que los horarios, teléfono, etc., se guarden también en `negocio_info`
    -- Teléfono
    INSERT INTO public.negocio_info (business_id, clave, valor, descripcion)
    VALUES (p_business_id, 'telefono_recepcionista', p_data->>'telefono_recepcionista', 'Teléfono principal del negocio para el bot')
    ON CONFLICT (business_id, clave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW();

    -- Email del negocio
    IF p_data->>'email_negocio' IS NOT NULL THEN
        INSERT INTO public.negocio_info (business_id, clave, valor, descripcion)
        VALUES (p_business_id, 'email_negocio', p_data->>'email_negocio', 'Email público del negocio')
        ON CONFLICT (business_id, clave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW();
    END IF;

    -- Días de trabajo y horarios del bot
    -- Guardamos horario_semana explícitamente porque Setting.tsx lo busca.
    INSERT INTO public.negocio_info (business_id, clave, valor, descripcion)
    VALUES (p_business_id, 'horario_semana', p_data->>'horario_semana', 'Horario regular L-V')
    ON CONFLICT (business_id, clave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW();

    INSERT INTO public.negocio_info (business_id, clave, valor, descripcion)
    VALUES (p_business_id, 'hora_apertura', p_data->>'hora_apertura', 'Hora general apertura')
    ON CONFLICT (business_id, clave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW();

    INSERT INTO public.negocio_info (business_id, clave, valor, descripcion)
    VALUES (p_business_id, 'hora_cierre', p_data->>'hora_cierre', 'Hora general cierre')
    ON CONFLICT (business_id, clave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW();

    INSERT INTO public.negocio_info (business_id, clave, valor, descripcion)
    VALUES (p_business_id, 'horario_sabado', p_data->>'horario_sabado', 'Horario de los sábados')
    ON CONFLICT (business_id, clave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW();

    INSERT INTO public.negocio_info (business_id, clave, valor, descripcion)
    VALUES (p_business_id, 'horario_domingo', p_data->>'horario_domingo', 'Horario de los domingos')
    ON CONFLICT (business_id, clave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW();

    INSERT INTO public.negocio_info (business_id, clave, valor, descripcion)
    VALUES (p_business_id, 'hora_almuerzo', p_data->>'hora_almuerzo', 'Horario de refrigerio/almuerzo')
    ON CONFLICT (business_id, clave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW();

    -- Políticas
    INSERT INTO public.negocio_info (business_id, clave, valor, descripcion)
    VALUES (p_business_id, 'metodos_pago', p_data->>'metodos_pago', 'Métodos de pago aceptados')
    ON CONFLICT (business_id, clave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW();

    INSERT INTO public.negocio_info (business_id, clave, valor, descripcion)
    VALUES (p_business_id, 'politicas_reserva', p_data->>'politicas_reserva', 'Políticas de reserva del bot')
    ON CONFLICT (business_id, clave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW();

    -- Redes Sociales
    IF p_data->>'Instagram' IS NOT NULL THEN
        INSERT INTO public.negocio_info (business_id, clave, valor, descripcion)
        VALUES (p_business_id, 'Instagram', p_data->>'Instagram', 'Instagram del negocio')
        ON CONFLICT (business_id, clave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW();
    END IF;

    IF p_data->>'Facebook' IS NOT NULL THEN
        INSERT INTO public.negocio_info (business_id, clave, valor, descripcion)
        VALUES (p_business_id, 'Facebook', p_data->>'Facebook', 'Facebook del negocio')
        ON CONFLICT (business_id, clave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW();
    END IF;

    IF p_data->>'Tiktok' IS NOT NULL THEN
        INSERT INTO public.negocio_info (business_id, clave, valor, descripcion)
        VALUES (p_business_id, 'Tiktok', p_data->>'Tiktok', 'Tiktok del negocio')
        ON CONFLICT (business_id, clave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW();
    END IF;

    -- 3. Actualizar progreso del token
    UPDATE public.onboarding_tokens
    SET paso_actual = 3,  -- Siguiente paso
        datos_parciales = p_data,
        updated_at = NOW()
    WHERE id = p_token_id;

END;
$$;


-- =========================================================================
-- Función 2: onboarding_step_8_identidad_bot (Directo a tabla 'negocios')
-- =========================================================================

CREATE OR REPLACE FUNCTION public.onboarding_step_8_identidad_bot(
    p_token_id uuid,
    p_business_id uuid,
    p_respuestas jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Volcamos todo el JSON anidado que llega en p_respuestas explícitamente 
    -- en la columna 'marca_identidad' (tipo JSONB) en la tabla 'negocios'
    UPDATE public.negocios
    SET 
        marca_identidad = p_respuestas,
        updated_at = NOW()
    WHERE id = p_business_id;

    -- Actualizar el progreso del token (siguiente paso 9: brief)
    UPDATE public.onboarding_tokens
    SET paso_actual = 9,
        datos_parciales = p_respuestas,
        updated_at = NOW()
    WHERE id = p_token_id;
END;
$$;
