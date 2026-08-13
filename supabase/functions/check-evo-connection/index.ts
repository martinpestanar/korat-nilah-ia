import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const EVO_URL = Deno.env.get('EVO_API_URL') ?? '';
const EVO_KEY = Deno.env.get('EVO_API_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { instanceName } = await req.json();

    if (!instanceName) {
      return new Response(JSON.stringify({ isConnected: false, error: 'instanceName requerido' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Evolution API v2: GET /instance/connectionState/{instanceName}
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
    // Evolution v2 devuelve: { instance: { instanceName, state } }
    // state puede ser: "open" | "connecting" | "close"
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
