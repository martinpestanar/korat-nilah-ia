import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

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
    const { businessId, phoneNumber } = await req.json();

    if (!businessId || !phoneNumber) {
      return new Response(JSON.stringify({ success: false, error: 'businessId y phoneNumber son requeridos' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Limpiar número: solo dígitos, sin + ni espacios
    const cleanPhone = String(phoneNumber).replace(/\D/g, '');

    // Buscar instancia del negocio en Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: instancia } = await supabase
      .from('instancias_evolution')
      .select('instance_name, api_key, status')
      .eq('business_id', businessId)
      .maybeSingle();

    if (!instancia?.instance_name) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No se encontró una instancia activa para este negocio. Genera primero el QR.',
      }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const instanceName = instancia.instance_name;

    // ── Solicitar Pairing Code a Evolution API v2.3.7 ────────────────────────
    // POST /instance/pairingCode/{instanceName}
    // Body: { "number": "5219812345678" }
    const pairRes = await fetch(`${EVO_URL}/instance/pairingCode/${instanceName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': EVO_KEY },
      body: JSON.stringify({ number: cleanPhone }),
    });

    const pairText = await pairRes.text();
    let pairData: Record<string, unknown> = {};
    try { pairData = JSON.parse(pairText); } catch { /* no es json */ }

    if (!pairRes.ok) {
      return new Response(JSON.stringify({
        success: false,
        error: `Evolution pairingCode fallo (${pairRes.status}): ${pairText}`,
        rawStatus: pairRes.status,
      }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Evolution v2 devuelve: { "code": "ABCD-EFGH" } o { "pairingCode": "ABCD-EFGH" }
    const code = (pairData?.code ?? pairData?.pairingCode ?? '') as string;

    if (!code) {
      return new Response(JSON.stringify({
        success: false,
        error: `Evolution no devolvió código de emparejamiento. Respuesta: ${pairText}`,
      }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      success: true,
      pairingCode: code,
      instanceName,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error interno';
    console.error('[get-pairing-code]', msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
