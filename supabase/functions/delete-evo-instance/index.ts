import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const EVO_URL = Deno.env.get('EVO_API_URL') || 'https://evo.koratflow.agency';
const EVO_KEY = '76778d9719d9c1a0b7a604c5d960d8c5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { businessId, instanceName: reqInstanceName } = await req.json();

    if (!businessId && !reqInstanceName) {
      return new Response(JSON.stringify({ success: false, error: 'businessId o instanceName requerido' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let instanceName = reqInstanceName;

    // Si no vino instanceName pero sí businessId, buscarlo
    if (!instanceName && businessId) {
      const { data: instancia } = await supabase
        .from('instancias_evolution')
        .select('instance_name')
        .eq('business_id', businessId)
        .maybeSingle();

      if (instancia?.instance_name) {
        instanceName = instancia.instance_name;
      }
    }

    if (!instanceName) {
      return new Response(JSON.stringify({ success: true, message: 'No hay instancia que eliminar' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── PASO 1: Cerrar sesión en Evolution API (logout) ──────────────────────
    try {
      await fetch(`${EVO_URL}/instance/logout/${instanceName}`, {
        method: 'DELETE',
        headers: { 'apikey': EVO_KEY },
      });
    } catch {
      // Silenciar error de logout
    }

    // ── PASO 2: Eliminar instancia de Evolution API ──────────────────────────
    try {
      const deleteRes = await fetch(`${EVO_URL}/instance/delete/${instanceName}`, {
        method: 'DELETE',
        headers: { 'apikey': EVO_KEY },
      });

      if (!deleteRes.ok) {
        const errText = await deleteRes.text();
        console.warn(`[delete-evo-instance] Evolution delete returned ${deleteRes.status}: ${errText}`);
      }
    } catch (evoErr) {
      console.warn('[delete-evo-instance] Error calling Evolution delete:', evoErr);
    }

    // ── PASO 3: Eliminar registro de Supabase ────────────────────────────────
    let query = supabase.from('instancias_evolution').delete();
    if (instanceName) {
      query = query.eq('instance_name', instanceName);
    } else if (businessId) {
      query = query.eq('business_id', businessId);
    }

    const { error: dbError } = await query;

    if (dbError) {
      return new Response(JSON.stringify({
        success: false,
        error: `Instancia eliminada de Evolution pero falló en DB: ${dbError.message}`,
      }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      success: true,
      instanceName,
      message: 'Instancia eliminada correctamente',
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error interno';
    console.error('[delete-evo-instance]', msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
