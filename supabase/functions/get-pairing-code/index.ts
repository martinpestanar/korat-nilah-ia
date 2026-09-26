import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const EVO_URL = Deno.env.get('EVO_API_URL') || 'https://evo.koratflow.agency';
const EVO_KEY = '76778d9719d9c1a0b7a604c5d960d8c5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function evoFetch(path: string, method = 'GET', body?: unknown): Promise<{ ok: boolean; status: number; data: any }> {
  const opts: RequestInit = {
    method,
    headers: { 'apikey': EVO_KEY, 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  try {
    const res = await fetch(`${EVO_URL}${path}`, opts);
    let data: any = null;
    try {
      const txt = await res.text();
      data = JSON.parse(txt);
    } catch {}
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    console.error('[evoFetch] Network error:', path, e);
    return { ok: false, status: 0, data: null };
  }
}

const isValidCode = (c: string | null | undefined): boolean => {
  if (!c || typeof c !== 'string') return false;
  if (c.includes('@')) return false;
  if (c.length > 20) return false;
  return /^[A-Z0-9-]{4,20}$/i.test(c.replace(/\s/g, ''));
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { businessId, instanceName: reqInstanceName, phoneNumber } = await req.json();
    console.log('[get-pairing-code] START', JSON.stringify({ businessId, reqInstanceName, phoneNumber }));

    if ((!businessId && !reqInstanceName) || !phoneNumber) {
      return jsonResponse({ success: false, error: 'Se requiere phoneNumber y (instanceName o businessId)' }, 400);
    }

    const cleanPhone = String(phoneNumber).replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return jsonResponse({ success: false, error: `Numero invalido: "${cleanPhone}"` }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // -- Resolver instance name --
    let instanceName = reqInstanceName;
    if (!instanceName && businessId) {
      const { data: inst } = await supabase
        .from('instancias_evolution')
        .select('instance_name')
        .eq('business_id', businessId)
        .maybeSingle();
      if (inst?.instance_name) instanceName = inst.instance_name;
    }
    if (!instanceName) {
      return jsonResponse({ success: false, error: 'No se encontro la instancia.' }, 404);
    }
    console.log('[get-pairing-code] instance:', instanceName, 'phone:', cleanPhone);

    // -- 0. Verificar existencia en Evolution --
    const fetchResult = await evoFetch(`/instance/fetchInstances?instanceName=${instanceName}`);
    console.log('[get-pairing-code] fetchInstances:', fetchResult.status, JSON.stringify(fetchResult.data)?.substring(0, 300));

    let instanceExists = fetchResult.ok;
    if (fetchResult.ok && Array.isArray(fetchResult.data) && fetchResult.data.length === 0) {
      instanceExists = false;
    }

    // -- Si no existe, RECREAR la instancia con numero y sin QR --
    if (!instanceExists) {
      console.log('[get-pairing-code] Instance missing, creating fresh...');
      const createResult = await evoFetch('/instance/create', 'POST', {
        instanceName,
        qrcode: false,
        number: cleanPhone,
        integration: 'WHATSAPP-BAILEYS',
      });
      console.log('[get-pairing-code] Create result:', JSON.stringify(createResult.data)?.substring(0, 500));

      if (createResult.data?.pairingCode && isValidCode(createResult.data.pairingCode)) {
        await supabase.from('instancias_evolution')
          .update({ telefono: cleanPhone, status: 'pendiente', updated_at: new Date().toISOString() })
          .eq('instance_name', instanceName);
        console.log('[get-pairing-code] SUCCESS from create:', createResult.data.pairingCode);
        return jsonResponse({ success: true, pairingCode: createResult.data.pairingCode, instanceName });
      }
      await new Promise(r => setTimeout(r, 2000));
    }

    // -- 1. Obtener estado actual --
    const stateResult = await evoFetch(`/instance/connectionState/${instanceName}`);
    const currentState = stateResult.data?.instance?.state || stateResult.data?.state || 'unknown';
    console.log('[get-pairing-code] State:', currentState);

    if (currentState === 'open') {
      return jsonResponse({ success: false, error: 'Esta instancia ya esta conectada. Desconectala primero.' }, 409);
    }

    // -- 2. ESTRATEGIA: Eliminar y recrear la instancia en modo pairing --
    // Esto es lo mas confiable porque si la instancia fue creada en modo QR,
    // Evolution NO genera pairing codes aunque hagas restart.
    console.log('[get-pairing-code] Deleting and recreating instance for pairing...');
    
    // 2a. Intentar logout primero
    await evoFetch(`/instance/logout/${instanceName}`, 'DELETE');
    await new Promise(r => setTimeout(r, 500));

    // 2b. Eliminar la instancia de Evolution
    const deleteResult = await evoFetch(`/instance/delete/${instanceName}`, 'DELETE');
    console.log('[get-pairing-code] Delete result:', deleteResult.status);
    await new Promise(r => setTimeout(r, 1000));

    // 2c. Recrear con mode pairing (qrcode: false, number: phone)
    const recreateResult = await evoFetch('/instance/create', 'POST', {
      instanceName,
      qrcode: false,
      number: cleanPhone,
      integration: 'WHATSAPP-BAILEYS',
    });
    console.log('[get-pairing-code] Recreate result:', JSON.stringify(recreateResult.data)?.substring(0, 500));

    // Si la recreacion ya devolvio pairingCode, usarlo
    if (recreateResult.data?.pairingCode && isValidCode(recreateResult.data.pairingCode)) {
      await supabase.from('instancias_evolution')
        .update({ telefono: cleanPhone, status: 'pendiente', updated_at: new Date().toISOString() })
        .eq('instance_name', instanceName);
      console.log('[get-pairing-code] SUCCESS from recreate:', recreateResult.data.pairingCode);
      return jsonResponse({ success: true, pairingCode: recreateResult.data.pairingCode, instanceName });
    }

    // 2d. Si no vino con la creacion, esperar e intentar connect
    await new Promise(r => setTimeout(r, 2000));

    const connectUrl = `/instance/connect/${instanceName}?number=${cleanPhone}`;
    console.log('[get-pairing-code] Trying connect:', connectUrl);
    const connectResult = await evoFetch(connectUrl);
    console.log('[get-pairing-code] Connect result:', JSON.stringify(connectResult.data)?.substring(0, 500));

    let code = connectResult.data?.pairingCode as string | null;

    // -- 3. Si aun no hay codigo, reiniciar y reintentar --
    if (!isValidCode(code)) {
      console.log('[get-pairing-code] No code from connect, restarting...');
      await evoFetch(`/instance/restart/${instanceName}`, 'PUT');
      await new Promise(r => setTimeout(r, 2500));

      const retryResult = await evoFetch(connectUrl);
      console.log('[get-pairing-code] Retry result:', JSON.stringify(retryResult.data)?.substring(0, 500));
      if (isValidCode(retryResult.data?.pairingCode)) {
        code = retryResult.data.pairingCode;
      }
    }

    if (!isValidCode(code)) {
      console.error('[get-pairing-code] FINAL FAIL. No valid code.');
      return jsonResponse({
        success: false,
        error: `No se pudo generar codigo para +${cleanPhone}. Intenta de nuevo en 30 segundos.`,
      }, 500);
    }

    // -- 4. Guardar en DB --
    await supabase.from('instancias_evolution')
      .update({ telefono: cleanPhone, status: 'pendiente', updated_at: new Date().toISOString() })
      .eq('instance_name', instanceName);

    console.log('[get-pairing-code] SUCCESS! Code:', code);
    return jsonResponse({ success: true, pairingCode: code, instanceName });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error interno';
    console.error('[get-pairing-code] UNHANDLED:', msg, err);
    return jsonResponse({ success: false, error: msg }, 500);
  }
});
