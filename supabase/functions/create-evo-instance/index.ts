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
    const { businessId, label, number, qrcode } = await req.json();

    const isValidUUID = (id: string | null | undefined): boolean =>
      Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));

    const validBusinessId = isValidUUID(businessId) ? businessId : null;
    const instanceLabel = label || (!validBusinessId && businessId ? businessId : null) || 'Instancia independiente';
    const cleanPhone = number ? String(number).replace(/\D/g, '') : null;
    const wantQr = qrcode !== undefined ? Boolean(qrcode) : !cleanPhone;

    // ── Nombre único de instancia ────────────────────────────────────────────
    const instanceName = `kr${Date.now()}`;

    // ── PASO 1: Crear instancia (Evolution API v2) ───────────────────────────
    const createBody: Record<string, unknown> = {
      instanceName,
      token: '',
      qrcode: wantQr,
      integration: 'WHATSAPP-BAILEYS',
      webhook: {
        enabled: true,
        url: 'https://n8n.koratflow.agency/webhook/whatsapp',
        byEvents: false,
        base64: false,
        events: ['MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'MESSAGES_DELETE', 'SEND_MESSAGE', 'CONNECTION_UPDATE'],
      },
    };

    if (cleanPhone) {
      createBody.number = cleanPhone;
    }

    const createRes = await fetch(`${EVO_URL}/instance/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': EVO_KEY },
      body: JSON.stringify(createBody),
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

    // ── PASO 2: Obtener QR o Pairing Code ─────────────────────────────────────
    await new Promise(r => setTimeout(r, 1500));

    const connectUrl = cleanPhone
      ? `${EVO_URL}/instance/connect/${instanceName}?number=${cleanPhone}`
      : `${EVO_URL}/instance/connect/${instanceName}`;

    const connectRes = await fetch(connectUrl, {
      method: 'GET',
      headers: { 'apikey': EVO_KEY },
    });

    let base64QR: string | null = null;
    let pairingCode: string | null = null;

    if (connectRes.ok) {
      const cd = await connectRes.json();
      base64QR = cd?.base64 ?? cd?.qrcode?.base64 ?? null;
      if (cd?.pairingCode && !cd.pairingCode.includes('@') && cd.pairingCode.length <= 15) {
        pairingCode = cd.pairingCode;
      }
    }

    if (!base64QR && wantQr) {
      base64QR = createData?.qrcode?.base64 ?? null;
    }

    // ── Guardar en Supabase ──────────────────────────────────────────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let existingId: string | null = null;
    if (validBusinessId) {
      const { data: existing } = await supabase
        .from('instancias_evolution')
        .select('id')
        .eq('business_id', validBusinessId)
        .maybeSingle();
      if (existing?.id) existingId = existing.id;
    }

    const payload: Record<string, unknown> = {
      business_id:   validBusinessId,
      instance_name: instanceName,
      instance_id:   clientInstanceId,
      api_key:       clientApiKey,
      status:        'pendiente',
      label:         instanceLabel,
      telefono:      cleanPhone,
      updated_at:    new Date().toISOString(),
    };

    if (existingId) {
      await supabase.from('instancias_evolution').update(payload).eq('id', existingId);
    } else {
      await supabase.from('instancias_evolution').insert(payload);
    }

    return new Response(JSON.stringify({
      success: true,
      instanceName,
      clientInstanceId,
      clientApiKey,
      base64QR,
      pairingCode,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error interno';
    console.error('[create-evo-instance]', msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
