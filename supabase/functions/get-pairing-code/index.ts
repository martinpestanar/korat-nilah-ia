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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { businessId, instanceName: reqInstanceName, phoneNumber } = await req.json();

    console.log('[get-pairing-code] Params:', { businessId, reqInstanceName, phoneNumber });

    if ((!businessId && !reqInstanceName) || !phoneNumber) {
      return jsonResponse({
        success: false,
        error: 'Se requiere phoneNumber y (instanceName o businessId)',
      }, 400);
    }

    const cleanPhone = String(phoneNumber).replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return jsonResponse({
        success: false,
        error: `Número inválido: "${cleanPhone}" (debe tener al menos 10 dígitos).`,
      }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // ── Resolver instance name ────────────────────────────────────
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
      return jsonResponse({
        success: false,
        error: 'No se encontró la instancia especificada.',
      }, 404);
    }

    console.log('[get-pairing-code] Using instance:', instanceName, 'phone:', cleanPhone);

    // ── 0. Verificar si la instancia existe en Evolution ──────────
    let instanceExists = true;
    try {
      const fetchRes = await fetch(`${EVO_URL}/instance/fetchInstances?instanceName=${instanceName}`, {
        method: 'GET',
        headers: { 'apikey': EVO_KEY },
      });
      if (fetchRes.ok) {
        const instances = await fetchRes.json();
        console.log('[get-pairing-code] fetchInstances result:', JSON.stringify(instances));
        // Si es un array vacío o la instancia no existe
        if (Array.isArray(instances) && instances.length === 0) {
          instanceExists = false;
        }
        // Si es un solo objeto, verificar que tenga datos
        if (!Array.isArray(instances) && (!instances || !instances.instance)) {
          instanceExists = false;
        }
      } else {
        console.log('[get-pairing-code] fetchInstances failed:', fetchRes.status, await fetchRes.text().catch(() => ''));
        instanceExists = false;
      }
    } catch (e) {
      console.error('[get-pairing-code] Error checking instance existence:', e);
      // Continuar de todos modos
    }

    // Si la instancia no existe en Evolution, intentar recrearla
    if (!instanceExists) {
      console.log('[get-pairing-code] Instance not found in Evolution, attempting to recreate...');
      try {
        const createRes = await fetch(`${EVO_URL}/instance/create`, {
          method: 'POST',
          headers: {
            'apikey': EVO_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            instanceName,
            qrcode: false,
            number: cleanPhone,
            integration: 'WHATSAPP-BAILEYS',
          }),
        });
        const createData = await createRes.json().catch(() => ({}));
        console.log('[get-pairing-code] Recreate result:', JSON.stringify(createData));

        // Si la creación devolvió un pairingCode directamente, retornarlo
        if (createData?.pairingCode) {
          await supabase
            .from('instancias_evolution')
            .update({ telefono: cleanPhone, updated_at: new Date().toISOString() })
            .eq('instance_name', instanceName);

          return jsonResponse({
            success: true,
            pairingCode: createData.pairingCode,
            instanceName,
          });
        }

        // Esperar a que se inicialice
        await new Promise(r => setTimeout(r, 2000));
      } catch (e) {
        console.error('[get-pairing-code] Recreate failed:', e);
      }
    }

    // ── 1. Intentar obtener estado actual de la instancia ─────────
    let currentState = 'unknown';
    try {
      const stateRes = await fetch(`${EVO_URL}/instance/connectionState/${instanceName}`, {
        method: 'GET',
        headers: { 'apikey': EVO_KEY },
      });
      if (stateRes.ok) {
        const stateData = await stateRes.json();
        currentState = stateData?.instance?.state || stateData?.state || 'unknown';
        console.log('[get-pairing-code] Current state:', currentState, JSON.stringify(stateData));
      }
    } catch (e) {
      console.log('[get-pairing-code] Could not fetch state:', e);
    }

    // Si ya está conectada, retornar error apropiado
    if (currentState === 'open') {
      return jsonResponse({
        success: false,
        error: 'Esta instancia ya está conectada. Desconéctala primero si quieres re-vincular.',
      }, 409);
    }

    // ── 2. Si la instancia está en estado "close" o desconocido, reiniciar ──
    if (currentState === 'close' || currentState === 'unknown') {
      console.log('[get-pairing-code] Instance needs restart, current state:', currentState);
      try {
        const restartRes = await fetch(`${EVO_URL}/instance/restart/${instanceName}`, {
          method: 'PUT',
          headers: { 'apikey': EVO_KEY },
        });
        console.log('[get-pairing-code] Restart status:', restartRes.status);
        await new Promise(r => setTimeout(r, 2000));
      } catch (e) {
        console.log('[get-pairing-code] Restart error (non-fatal):', e);
      }
    }

    // ── 3. Solicitar Pairing Code ────────────────────────────────
    const connectUrl = `${EVO_URL}/instance/connect/${instanceName}?number=${cleanPhone}`;
    console.log('[get-pairing-code] Requesting connect:', connectUrl);

    let connectRes = await fetch(connectUrl, {
      method: 'GET',
      headers: { 'apikey': EVO_KEY },
    });

    let connectText = '';
    let connectData: Record<string, unknown> = {};

    if (connectRes.ok) {
      try {
        connectText = await connectRes.text();
        console.log('[get-pairing-code] Connect response text:', connectText);
        connectData = JSON.parse(connectText);
      } catch (e) {
        console.error('[get-pairing-code] Failed to parse connect response:', connectText, e);
      }
    } else {
      const errText = await connectRes.text().catch(() => '');
      console.error('[get-pairing-code] Connect failed:', connectRes.status, errText);
    }

    let code = (connectData?.pairingCode) as string | null;

    // Validar que sea un código real (8 chars alfanuméricos, no un JID)
    const isValidCode = (c: string | null | undefined): boolean => {
      if (!c || typeof c !== 'string') return false;
      if (c.includes('@')) return false;
      if (c.length > 20) return false;
      // Debe contener al menos letras o números
      return /^[A-Z0-9-]{4,20}$/i.test(c.replace(/\s/g, ''));
    };

    // ── 4. Si el código no es válido, reiniciar y reintentar ─────
    if (!isValidCode(code)) {
      console.log('[get-pairing-code] Invalid or no code, restarting and retrying... got:', code);

      try {
        await fetch(`${EVO_URL}/instance/restart/${instanceName}`, {
          method: 'PUT',
          headers: { 'apikey': EVO_KEY },
        });
        await new Promise(r => setTimeout(r, 2500));
      } catch { /* silencio */ }

      connectRes = await fetch(connectUrl, {
        method: 'GET',
        headers: { 'apikey': EVO_KEY },
      });

      if (connectRes.ok) {
        try {
          const retryText = await connectRes.text();
          console.log('[get-pairing-code] Retry response:', retryText);
          const retryData = JSON.parse(retryText);
          if (isValidCode(retryData?.pairingCode)) {
            code = retryData.pairingCode;
          }
        } catch (e) {
          console.error('[get-pairing-code] Retry parse error:', e);
        }
      } else {
        console.error('[get-pairing-code] Retry connect failed:', connectRes.status);
      }
    }

    if (!isValidCode(code)) {
      console.error('[get-pairing-code] Final: No valid code obtained. Last code value:', code);
      return jsonResponse({
        success: false,
        error: `Evolution no generó el código para +${cleanPhone}. Intenta eliminar la instancia y crearla de nuevo, o usa QR.`,
      }, 500);
    }

    // ── 5. Guardar teléfono en DB ────────────────────────────────
    await supabase
      .from('instancias_evolution')
      .update({ telefono: cleanPhone, status: 'pendiente', updated_at: new Date().toISOString() })
      .eq('instance_name', instanceName);

    console.log('[get-pairing-code] Success! Code:', code);

    return jsonResponse({
      success: true,
      pairingCode: code,
      instanceName,
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error interno';
    console.error('[get-pairing-code] Unhandled error:', msg, err);
    return jsonResponse({ success: false, error: msg }, 500);
  }
});
