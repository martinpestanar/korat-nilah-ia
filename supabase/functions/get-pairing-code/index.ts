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
    const { businessId, instanceName: reqInstanceName, phoneNumber } = await req.json();

    if ((!businessId && !reqInstanceName) || !phoneNumber) {
      return new Response(JSON.stringify({ success: false, error: 'Se requiere phoneNumber y (instanceName o businessId)' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cleanPhone = String(phoneNumber).replace(/\D/g, '');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let instanceName = reqInstanceName;

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
      return new Response(JSON.stringify({
        success: false,
        error: 'No se encontró la instancia especificada.',
      }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── 1. Solicitar Pairing Code vía GET /instance/connect/{name}?number={phone} ──
    let connectRes = await fetch(`${EVO_URL}/instance/connect/${instanceName}?number=${cleanPhone}`, {
      method: 'GET',
      headers: { 'apikey': EVO_KEY },
    });

    let connectData: Record<string, unknown> = {};
    if (connectRes.ok) {
      try { connectData = await connectRes.json(); } catch {}
    }

    let code = (connectData?.pairingCode) as string | null;

    // Si pairingCode es nulo (común cuando la instancia inició en modo QR), reintentamos reconectar
    if (!code || code.includes('@') || code.length > 15) {
      try {
        await fetch(`${EVO_URL}/instance/restart/${instanceName}`, {
          method: 'PUT',
          headers: { 'apikey': EVO_KEY },
        });
        await new Promise(r => setTimeout(r, 1500));
      } catch {}

      connectRes = await fetch(`${EVO_URL}/instance/connect/${instanceName}?number=${cleanPhone}`, {
        method: 'GET',
        headers: { 'apikey': EVO_KEY },
      });

      if (connectRes.ok) {
        try {
          const retryData = await connectRes.json();
          if (retryData?.pairingCode && !retryData.pairingCode.includes('@')) {
            code = retryData.pairingCode;
          }
        } catch {}
      }
    }

    if (!code || code.includes('@') || code.length > 15) {
      return new Response(JSON.stringify({
        success: false,
        error: `Evolution no generó el código para el número +${cleanPhone}. Intenta recargar o vincular mediante QR.`,
      }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Guardar teléfono en la base de datos
    await supabase
      .from('instancias_evolution')
      .update({ telefono: cleanPhone, updated_at: new Date().toISOString() })
      .eq('instance_name', instanceName);

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
