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
    const body = await req.json().catch(() => ({}));
    const { action, instanceName, businessId } = body;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // ─── ACCIÓN 1: Listar todas las instancias desde Evolution API ──────────────
    if (action === 'fetch_instances') {
      const evoRes = await fetch(`${EVO_URL}/instance/fetchInstances`, {
        method: 'GET',
        headers: { 'apikey': EVO_KEY },
      });

      if (!evoRes.ok) {
        const text = await evoRes.text();
        return new Response(JSON.stringify({ success: false, error: `Evolution error: ${text}` }), {
          status: evoRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const list = await evoRes.json();
      const instances = Array.isArray(list) ? list.map((inst: any) => ({
        id: inst.id,
        name: inst.name,
        token: inst.token,
        connectionStatus: inst.connectionStatus,
        number: inst.number || (inst.ownerJid ? inst.ownerJid.split('@')[0] : null),
        profileName: inst.profileName || null,
        profilePicUrl: inst.profilePicUrl || null,
      })) : [];

      return new Response(JSON.stringify({ success: true, instances }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── ACCIÓN 2: Sincronizar instancia con Supabase (negocios + instancias_evolution) ──
    if (action === 'sync_instance') {
      let targetInstanceName = instanceName;

      // Si no se pasó instanceName pero sí businessId, buscar la instancia actual en DB
      if (!targetInstanceName && businessId) {
        const { data: currentInst } = await supabase
          .from('instancias_evolution')
          .select('instance_name')
          .eq('business_id', businessId)
          .maybeSingle();

        if (currentInst?.instance_name) {
          targetInstanceName = currentInst.instance_name;
        }
      }

      if (!targetInstanceName) {
        return new Response(JSON.stringify({ success: false, error: 'instanceName o businessId requerido' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 1. Obtener la data fresca desde Evolution API
      const evoRes = await fetch(`${EVO_URL}/instance/fetchInstances`, {
        method: 'GET',
        headers: { 'apikey': EVO_KEY },
      });

      if (!evoRes.ok) {
        const text = await evoRes.text();
        return new Response(JSON.stringify({ success: false, error: `Error conectando con Evolution: ${text}` }), {
          status: evoRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const list = await evoRes.json();
      const matched = Array.isArray(list) ? list.find((i: any) => i.name === targetInstanceName) : null;

      if (!matched) {
        return new Response(JSON.stringify({
          success: false,
          error: `La instancia "${targetInstanceName}" no existe en Evolution API. Verifica el nombre o créala de nuevo.`,
        }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const isOpen = matched.connectionStatus === 'open';
      const cleanPhone = matched.number || (matched.ownerJid ? matched.ownerJid.split('@')[0] : null);
      const realToken = matched.token;
      const clientInstanceId = matched.id;

      // 2. Actualizar o insertar en instancias_evolution
      if (businessId) {
        const { data: existing } = await supabase
          .from('instancias_evolution')
          .select('id')
          .eq('business_id', businessId)
          .maybeSingle();

        if (existing?.id) {
          await supabase.from('instancias_evolution').update({
            instance_name: matched.name,
            instance_id: clientInstanceId,
            api_key: realToken,
            status: isOpen ? 'conectado' : 'desconectado',
            telefono: cleanPhone,
            updated_at: new Date().toISOString(),
          }).eq('id', existing.id);
        } else {
          await supabase.from('instancias_evolution').insert({
            business_id: businessId,
            instance_name: matched.name,
            instance_id: clientInstanceId,
            api_key: realToken,
            status: isOpen ? 'conectado' : 'desconectado',
            telefono: cleanPhone,
            updated_at: new Date().toISOString(),
          });
        }

        // 3. Actualizar tabla negocios en espejo
        await supabase.from('negocios').update({
          instance_name: matched.name,
          api_key: realToken,
          instance_id: clientInstanceId,
        }).eq('id', businessId);
      } else {
        // Actualizar por instance_name si no hay businessId
        await supabase.from('instancias_evolution').update({
          instance_id: clientInstanceId,
          api_key: realToken,
          status: isOpen ? 'conectado' : 'desconectado',
          telefono: cleanPhone,
          updated_at: new Date().toISOString(),
        }).eq('instance_name', matched.name);
      }

      return new Response(JSON.stringify({
        success: true,
        instance: {
          name: matched.name,
          id: clientInstanceId,
          token: realToken,
          status: isOpen ? 'conectado' : 'desconectado',
          phone: cleanPhone,
          profileName: matched.profileName,
          connectionStatus: matched.connectionStatus,
        },
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ─── ACCIÓN 3 (Default): Verificar estado de conexión de una instancia ────────
    if (!instanceName) {
      return new Response(JSON.stringify({ isConnected: false, error: 'instanceName requerido' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const stateRes = await fetch(`${EVO_URL}/instance/connectionState/${instanceName}`, {
      method: 'GET',
      headers: { 'apikey': EVO_KEY },
    });

    if (!stateRes.ok) {
      return new Response(JSON.stringify({ isConnected: false, status: 'unknown' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const stateData = await stateRes.json();
    const state  = stateData?.instance?.state ?? stateData?.state ?? 'unknown';
    const owner  = stateData?.instance?.owner ?? stateData?.owner ?? null;
    const isOpen = state === 'open';

    return new Response(JSON.stringify({
      isConnected: isOpen,
      state,
      owner,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error interno';
    console.error('[check-evo-connection]', msg);
    return new Response(JSON.stringify({ isConnected: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
