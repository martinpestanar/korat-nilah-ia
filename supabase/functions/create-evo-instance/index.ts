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
    const { businessId } = await req.json();

    if (!businessId) {
      return new Response(JSON.stringify({ success: false, error: 'businessId requerido' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!EVO_URL || !EVO_KEY) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Secrets EVO_API_URL / EVO_API_KEY no configurados en Supabase.',
      }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── Nombre único de instancia ────────────────────────────────────────────
    const instanceName = `kr${Date.now()}`;

    // ── PASO 1: Crear instancia (Evolution API v2) ───────────────────────────
    const createRes = await fetch(`${EVO_URL}/instance/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': EVO_KEY },
      body: JSON.stringify({
        instanceName,
        token: '',
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
        webhook: {
          enabled: true,
          url: 'https://n8n.koratflow.agency/webhook/whatsapp',
          byEvents: false,
          base64: false,
          events: ['MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'MESSAGES_DELETE', 'SEND_MESSAGE', 'CONNECTION_UPDATE'],
        },
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      return new Response(JSON.stringify({
        success: false,
        error: `Evolution /instance/create fallo ${createRes.status}: ${errText}`,
      }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const createData = await createRes.json();
    const clientInstanceId = createData?.instance?.instanceId ?? '';
    const clientApiKey     = createData?.hash ?? '';

    // ── PASO 2: Esperar 2s y obtener QR fresco via /instance/connect ─────────
    await new Promise(r => setTimeout(r, 2000));

    const connectRes = await fetch(`${EVO_URL}/instance/connect/${instanceName}`, {
      method: 'GET',
      headers: { 'apikey': EVO_KEY },
    });

    let base64QR: string | null = null;

    if (connectRes.ok) {
      const cd = await connectRes.json();
      // Evolution v2.x devuelve: { code, base64, count }
      base64QR = cd?.base64 ?? cd?.qrcode?.base64 ?? null;
    }

    // Fallback: usar el QR que vino en el create (puede estar caducado)
    if (!base64QR) {
      base64QR = createData?.qrcode?.base64 ?? null;
    }

    // ── Guardar en Supabase ──────────────────────────────────────────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: existing } = await supabase
      .from('instancias_evolution')
      .select('id')
      .eq('business_id', businessId)
      .maybeSingle();

    const payload: Record<string, unknown> = {
      business_id:   businessId,
      instance_name: instanceName,
      instance_id:   clientInstanceId,
      api_key:       clientApiKey,
      status:        'pendiente',
      updated_at:    new Date().toISOString(),
    };

    if (existing?.id) {
      await supabase.from('instancias_evolution').update(payload).eq('id', existing.id);
    } else {
      await supabase.from('instancias_evolution').insert(payload);
    }

    return new Response(JSON.stringify({
      success: true,
      instanceName,
      clientInstanceId,
      clientApiKey,
      base64QR,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error interno';
    console.error('[create-evo-instance]', msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
