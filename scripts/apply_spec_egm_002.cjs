const { Client } = require('pg');

const connectionString = 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

async function run() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log('Connected to Supabase PostgreSQL');

  const sql = `
  -- 1. Enriquecer get_tarjeta_club_glow_publica con proxima_cita
  CREATE OR REPLACE FUNCTION public.get_tarjeta_club_glow_publica(p_identifier text, p_cliente_id bigint)
   RETURNS jsonb
   LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path TO 'public'
  AS $function$
  DECLARE
    v_neg record;
    v_cli record;
    v_cfg record;
    v_sellos_activos integer := 0;
    v_roadmap jsonb := '[]'::jsonb;
    v_premios jsonb := '[]'::jsonb;
    v_proxima_cita jsonb := null;
    v_is_uuid boolean;
  BEGIN
    v_is_uuid := (p_identifier ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');

    IF v_is_uuid THEN
      SELECT id, nombre, slug, telefono_recepcionista, ubicacion, color_primario, recursos_saas, logo_url
      INTO v_neg
      FROM negocios
      WHERE id = p_identifier::uuid
      LIMIT 1;
    ELSE
      SELECT id, nombre, slug, telefono_recepcionista, ubicacion, color_primario, recursos_saas, logo_url
      INTO v_neg
      FROM negocios
      WHERE slug = p_identifier
      LIMIT 1;
    END IF;

    IF v_neg.id IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Salón no encontrado');
    END IF;

    -- Buscar cliente
    SELECT id, nombre, telefono
    INTO v_cli
    FROM "Clientes"
    WHERE id = p_cliente_id AND business_id = v_neg.id
    LIMIT 1;

    IF v_cli.id IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Cliente no encontrado');
    END IF;

    -- Sellos config
    SELECT total_sellos_roadmap
    INTO v_cfg
    FROM sellos_config
    WHERE business_id = v_neg.id
    LIMIT 1;

    -- Roadmap
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'hito', hito_sello,
      'nombre', nombre,
      'descripcion', descripcion
    ) ORDER BY hito_sello ASC), '[]'::jsonb)
    INTO v_roadmap
    FROM sellos_roadmap
    WHERE business_id = v_neg.id AND activo = true;

    -- Sellos activos
    SELECT COALESCE(fn_sellos_activos(v_cli.id, v_neg.id), 0)
    INTO v_sellos_activos;

    -- Premios ganados
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'codigo_canje', p.codigo_canje,
      'nombre_premio', COALESCE(r.nombre, 'Premio Glow'),
      'estado', p.estado,
      'expira_en', p.expira_en
    ) ORDER BY p.ganado_en DESC), '[]'::jsonb)
    INTO v_premios
    FROM sellos_premios_ganados p
    LEFT JOIN sellos_roadmap r ON r.id = p.roadmap_id
    WHERE p.business_id = v_neg.id AND p.cliente_id = v_cli.id;

    -- Próxima Cita Activa (desde hace 1h hasta el futuro)
    SELECT jsonb_build_object(
      'id', c.id,
      'fecha', c.fecha,
      'hora_fin', c.hora_fin,
      'duracion_min', COALESCE(c.duracion_min, 60),
      'estado', c.estado,
      'servicio', c.servicio,
      'precio', c.precio,
      'staff_nombre', s.nombre
    )
    INTO v_proxima_cita
    FROM "Citas" c
    LEFT JOIN staff s ON s.id = c.staff_id
    WHERE c.business_id = v_neg.id
      AND c.cliente_id = v_cli.id
      AND c.fecha >= NOW() - INTERVAL '1 hour'
      AND c.estado NOT IN ('Cancelada', 'No-Show', 'Completada')
    ORDER BY c.fecha ASC
    LIMIT 1;

    RETURN jsonb_build_object(
      'ok', true,
      'negocio', jsonb_build_object(
        'id', v_neg.id,
        'nombre', v_neg.nombre,
        'slug', v_neg.slug,
        'telefono', v_neg.telefono_recepcionista,
        'direccion', v_neg.ubicacion,
        'color_primario', v_neg.color_primario,
        'recursos_saas', v_neg.recursos_saas,
        'logo_url', v_neg.logo_url
      ),
      'cliente', jsonb_build_object(
        'id', v_cli.id,
        'nombre', v_cli.nombre,
        'telefono', v_cli.telefono
      ),
      'sellos_activos', v_sellos_activos,
      'total_roadmap', COALESCE(v_cfg.total_sellos_roadmap, 12),
      'roadmap', v_roadmap,
      'premios', v_premios,
      'proxima_cita', v_proxima_cita
    );
  END;
  $function$;

  -- 2. Crear función RPC segura confirmar_cita_cliente
  CREATE OR REPLACE FUNCTION public.confirmar_cita_cliente(
    p_cita_id bigint,
    p_cliente_id bigint,
    p_business_id uuid
  )
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $$
  DECLARE
    v_cita record;
  BEGIN
    -- Validar existencia e identidad de la cita (Anti-IDOR)
    SELECT id, estado, fecha INTO v_cita
    FROM "Citas"
    WHERE id = p_cita_id 
      AND cliente_id = p_cliente_id 
      AND business_id = p_business_id;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Cita no encontrada o no pertenece al cliente');
    END IF;

    -- Si ya está confirmada, respuesta idempotente exitosa
    IF v_cita.estado = 'Confirmada' THEN
      RETURN jsonb_build_object('ok', true, 'ya_confirmada', true, 'estado', 'Confirmada');
    END IF;

    -- Evitar confirmar citas canceladas, no-show o completadas
    IF v_cita.estado IN ('Cancelada', 'No-Show', 'Completada') THEN
      RETURN jsonb_build_object('ok', false, 'error', 'No se puede confirmar una cita ' || v_cita.estado);
    END IF;

    IF v_cita.fecha < NOW() - INTERVAL '2 hours' THEN
      RETURN jsonb_build_object('ok', false, 'error', 'La cita ya ha transcurrido');
    END IF;

    -- Actualizar estado a Confirmada
    UPDATE "Citas"
    SET estado = 'Confirmada',
        updated_at = NOW()
    WHERE id = p_cita_id;

    RETURN jsonb_build_object('ok', true, 'cita_id', p_cita_id, 'estado', 'Confirmada');
  END;
  $$;

  GRANT EXECUTE ON FUNCTION public.confirmar_cita_cliente(bigint, bigint, uuid) TO anon, authenticated, service_role;
  GRANT EXECUTE ON FUNCTION public.get_tarjeta_club_glow_publica(text, bigint) TO anon, authenticated, service_role;
  `;

  await client.query(sql);
  console.log('✅ Migration EGM #002 applied successfully in Supabase');
  await client.end();
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
