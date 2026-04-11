-- Fix onboarding step 3
CREATE OR REPLACE FUNCTION public.onboarding_step_3_categorias(
    p_token_id uuid,
    p_business_id uuid,
    p_categorias jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    cat jsonb;
BEGIN
    -- Eliminar las categorias previas (si el usuario regresa y cambia)
    DELETE FROM public.categorias_servicio WHERE business_id = p_business_id;

    -- Insertar nuevas categorias y capturar sus IDs si es necesario
    FOR cat IN SELECT * FROM jsonb_array_elements(p_categorias)
    LOOP
        INSERT INTO public.categorias_servicio (
            business_id, 
            nombre, 
            emoji, 
            descripcion
        )
        VALUES (
            p_business_id,
            cat->>'nombre',
            cat->>'emoji',
            cat->>'descripcion'
        );
    END LOOP;

    -- Update token progress
    UPDATE public.onboarding_tokens
    SET paso_actual = 4,
        datos_parciales = p_categorias,
        updated_at = NOW()
    WHERE id = p_token_id;
END;
$$;
