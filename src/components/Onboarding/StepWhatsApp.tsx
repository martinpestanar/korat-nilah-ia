import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { Phone } from 'lucide-react';

interface Props {
  businessId: string;
  tokenId: string;
  onComplete: () => void;
  onSkip: () => void;
  onBack?: () => void;
}

type Screen = 'form' | 'requesting' | 'qr_ready' | 'requesting_code' | 'code_ready' | 'connected' | 'error';
type Mode = 'qr' | 'pairing';

const StepWhatsApp: React.FC<Props> = ({ businessId, onComplete, onSkip, onBack }) => {
  const [screen, setScreen] = useState<Screen>('form');
  const [mode, setMode] = useState<Mode>('qr');
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [phoneInput, setPhoneInput] = useState('');
  const [instanceName, setInstanceName] = useState('');
  const [instanceApiKey, setInstanceApiKey] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);



  // Check if already connected
  useEffect(() => {
    if (!businessId) return;
    supabase
      .from('instancias_evolution')
      .select('instance_name, status, api_key')
      .eq('business_id', businessId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.status === 'conectado') {
          setInstanceName(data.instance_name);
          setInstanceApiKey(data.api_key || '');
          setScreen('connected');
        } else if (data?.status === 'pendiente') {
          // Si está pendiente, al menos recordamos el nombre de la instancia
          setInstanceName(data.instance_name);
          setInstanceApiKey(data.api_key || '');
        }
      });
  }, [businessId]);

  useEffect(() => {
    return () => stopPolling();
  }, []);

  const stopPolling = () => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
  };

  const handleResetConnection = async () => {
    const ok = window.confirm('¿Estás seguro de que quieres desvincular WhatsApp y empezar de nuevo?');
    if (!ok) return;

    stopPolling();
    try {
      await supabase
        .from('instancias_evolution')
        .delete()
        .eq('business_id', businessId);
      
      setScreen('form');
      setQrBase64(null);
      setInstanceName('');
      setInstanceApiKey('');
      setSyncStatus('idle');
      setSyncResult(null);
    } catch (err) {
      console.error('Error al resetear conexión:', err);
    }
  };



  const startPolling = (name: string, apiKey: string, instanceId?: string) => {
    stopPolling();
    pollingRef.current = setInterval(async () => {
      try {
        const { data } = await supabase.functions.invoke('check-evo-connection', {
          body: { instanceName: name },
        });
        if (data?.isConnected) {
          stopPolling();

          const telefonoConectado = data.owner ? data.owner.replace('@s.whatsapp.net', '') : null;
          const updatePayload: Record<string, unknown> = { status: 'conectado' };
          if (telefonoConectado) updatePayload.telefono = telefonoConectado;

          await supabase
            .from('instancias_evolution')
            .update(updatePayload)
            .eq('instance_name', name);

          await supabase
            .from('negocios')
            .update({
              instance_name: name,
              api_key: apiKey,
              ...(instanceId ? { instance_id: instanceId } : {}),
            })
            .eq('id', businessId);

          setScreen('connected');
        }
      } catch { /* polling continúa silenciosamente */ }
    }, 3000);
    timeoutRef.current = setTimeout(() => stopPolling(), 120_000);
  };

  // --- REQUEST PAIRING CODE ---
  const handleRequestPairingCode = async () => {
    const clean = phoneInput.replace(/\D/g, '');
    if (clean.length < 10) {
      setErrorMessage('Ingresa tu número con código de país (ej: 521XXXXXXXXXX).');
      return;
    }

    setScreen('requesting');
    setErrorMessage('');
    setPairingCode(null);
    stopPolling();

    try {
      let name = instanceName;
      let apiKey = instanceApiKey;

      // Si no hay instancia, crearla primero
      if (!name) {
        const { data: createData, error: createErr } = await supabase.functions.invoke('create-evo-instance', {
          body: { businessId },
        });
        if (createErr || !createData?.success) {
          throw new Error(createData?.error || createErr?.message || 'No se pudo crear la instancia.');
        }
        name = createData.instanceName;
        apiKey = createData.clientApiKey || '';
        setInstanceName(name);
        setInstanceApiKey(apiKey);
      }

      const { data, error } = await supabase.functions.invoke('get-pairing-code', {
        body: { businessId, phoneNumber: clean },
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'No se pudo obtener el código.');

      setPairingCode(data.pairingCode);
      setScreen('code_ready');
      startPolling(name, apiKey);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      setErrorMessage(msg);
      setScreen('error');
    }
  };

  const handleFinalize = async () => {
    try {
      // Guardar progreso final en el token antes de ir al paso 13
      const { updateTokenProgress } = await import('../../services/onboarding');
      await updateTokenProgress(tokenId, 13);
    } catch (err) {
      console.error('Error al guardar progreso final:', err);
    }
    onComplete();
  };

  const handleSkipFinalize = async () => {
    try {
      const { updateTokenProgress } = await import('../../services/onboarding');
      await updateTokenProgress(tokenId, 13);
    } catch (err) {
      console.error('Error al guardar progreso final (skip):', err);
    }
    onSkip();
  };

  // --- GENERATE QR ---
  const handleGenerateQR = async () => {
    setScreen('requesting');
    setErrorMessage('');
    setQrBase64(null);
    setPairingCode(null);
    stopPolling();

    try {
      const { data, error } = await supabase.functions.invoke('create-evo-instance', {
        body: { businessId },
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'No se pudo generar el QR.');

      const resolvedApiKey = data.clientApiKey || '';

      setInstanceName(data.instanceName);
      setInstanceApiKey(resolvedApiKey);
      setQrBase64(data.base64QR || null);

      setScreen('qr_ready');
      startPolling(data.instanceName, resolvedApiKey, data.clientInstanceId);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      setErrorMessage(msg);
      setScreen('error');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Connected
  // ─────────────────────────────────────────────────────────────────────────────
  if (screen === 'connected') {
    return (
      <div className="ob-step">
        {/* Hero icon animado */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '40px',
            boxShadow: '0 8px 32px rgba(37,211,102,0.40)',
          }}>✅</div>
          <h2 className="ob-step-title" style={{ marginBottom: '6px' }}>
            ¡WhatsApp conectado a Nilah IA!
          </h2>
          <p className="ob-step-subtitle" style={{ marginBottom: '0' }}>
            Tu número está activo. Nilah ya puede recibir y responder mensajes de tus clientes.
          </p>
        </div>

        {/* Connection badge */}
        <div style={{
          background: 'linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)',
          border: '2px solid #86efac', borderRadius: '14px',
          padding: '16px 20px', margin: '20px 0',
          display: 'flex', alignItems: 'center', gap: '14px',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%', background: '#22c55e',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px', flexShrink: 0,
          }}>📱</div>
          <div>
            <p style={{ fontWeight: 700, color: '#166534', margin: 0, fontSize: '14px' }}>
              Número vinculado exitosamente
            </p>
            <p style={{ fontSize: '12px', color: '#15803d', margin: '2px 0 0', fontFamily: 'monospace' }}>
              {instanceName}
            </p>
          </div>
        </div>

        {/* Qué pasa ahora */}
        <div style={{
          background: '#f8fafc', border: '1px solid #e2e8f0',
          borderRadius: '14px', padding: '18px 20px', marginBottom: '24px',
        }}>
          <p style={{ fontWeight: 700, color: '#334155', margin: '0 0 12px', fontSize: '13px' }}>
            🚀 ¿Qué pasa ahora?
          </p>
          {[
            { icon: '🚀', text: 'Sistemas de Retención y Rescate de Ausentes activados' },
            { icon: '⏰', text: 'Recordatorios automáticos de citas y servicios habilitados' },
            { icon: '📊', text: 'Tus clientes se registrarán automáticamente en el CRM para su seguimiento' },
          ].map((item) => (
            <div key={item.text} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '16px', flexShrink: 0 }}>{item.icon}</span>
              <span style={{ fontSize: '13px', color: '#475569', lineHeight: 1.4 }}>{item.text}</span>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="ob-btn-primary ob-btn-primary--large ob-btn-primary--glow"
          onClick={handleFinalize}
        >
          Ir a mi Dashboard →
        </button>

        <button
          type="button"
          onClick={handleResetConnection}
          style={{
            display: 'block', width: '100%', marginTop: '20px', background: 'none',
            border: 'none', fontSize: '12px', color: '#f87171', cursor: 'pointer',
            textAlign: 'center', opacity: 0.8
          }}
        >
          ⚠️ Desvincular y empezar de nuevo
        </button>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Requesting / Loading
  // ─────────────────────────────────────────────────────────────────────────────
  if (screen === 'requesting') {
    return (
      <div className="ob-step">
        <div className="ob-step-icon">📱</div>
        <h2 className="ob-step-title">Preparando tu conexión...</h2>
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div className="ob-spinner" style={{ width: 48, height: 48, margin: '0 auto 16px' }} />
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            Esto tomará unos segundos. Generando tu servidor privado en la nube para Nilah.
          </p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: QR Ready
  // ─────────────────────────────────────────────────────────────────────────────
  if (screen === 'qr_ready') {
    return (
      <div className="ob-step">
        <div className="ob-step-icon">📷</div>
        <h2 className="ob-step-title">Escanea el código QR</h2>
        <p className="ob-step-subtitle">
          Abre WhatsApp → Ajustes → Dispositivos Vinculados → Vincular dispositivo.
        </p>

        {qrBase64 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{
              padding: '12px', background: '#fff',
              border: '3px solid #e2e8f0', borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
            }}>
              <img src={qrBase64} alt="Código QR WhatsApp" style={{ width: 220, height: 220, display: 'block', borderRadius: '8px' }} />
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', textAlign: 'center' }} className="ob-pulse">
              ⏳ Esperando escaneo...
            </p>
            <button
              type="button"
              onClick={handleGenerateQR}
              style={{
                background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px',
                padding: '8px 16px', fontSize: '13px', color: '#64748b',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              }}
            >
              🔄 Recargar QR
            </button>
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '14px', padding: '24px 0' }}>
            No se pudo cargar el QR. Intenta recargar.
          </p>
        )}

        {/* Fallback a Pairing Code */}
        <div style={{
          background: '#f5f3ff', border: '1px solid #ddd6fe',
          borderRadius: '12px', padding: '14px 16px', marginBottom: '16px', textAlign: 'center',
        }}>
          <p style={{ fontWeight: 700, color: '#5b21b6', margin: '0 0 6px', fontSize: '13px' }}>
            ¿El QR no funciona desde tu celular?
          </p>
          <p style={{ fontSize: '12px', color: '#6d28d9', margin: '0 0 10px' }}>
            Usa el Código de Emparejamiento y conéctate sin necesitar segunda pantalla.
          </p>
          <button
            type="button"
            onClick={() => { stopPolling(); setMode('pairing'); setScreen('requesting_code'); }}
            style={{
              background: '#7c3aed', color: '#fff', border: 'none',
              borderRadius: '8px', padding: '8px 20px',
              fontWeight: 700, cursor: 'pointer', fontSize: '13px',
            }}
          >
            Usar Código de Emparejamiento →
          </button>
        </div>

        <FooterNav onBack={() => setScreen('form')} onSkip={onSkip} />
      </div>
    );
  }

  // ─── RENDER: Requesting Pairing Code (form) ─────────────────────────────────
  if (screen === 'requesting_code') {
    return (
      <div className="ob-step">
        <div className="ob-step-icon">🔢</div>
        <h2 className="ob-step-title">Código de Emparejamiento</h2>
        <p className="ob-step-subtitle">
          Recibirás un código de 8 letras que ingresas directamente en tu WhatsApp.
        </p>

        <div style={{
          background: '#f5f3ff', border: '1px solid #ddd6fe',
          borderRadius: '12px', padding: '16px', marginBottom: '20px',
        }}>
          {[
            'Escribe tu número con código de país (sin + ni espacios).',
            'Recibirás un código de 8 letras.',
            'En WhatsApp → Ajustes → Dispositivos Vinculados → Vincular con número.',
            'Ingresa el código. ¡Listo!',
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%', background: '#ddd6fe',
                textAlign: 'center', fontSize: '11px', fontWeight: 700,
                lineHeight: '20px', color: '#5b21b6', flexShrink: 0,
              }}>{i + 1}</div>
              <span style={{ fontSize: '13px', color: '#5b21b6' }}>{step}</span>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
            Número de WhatsApp Business
          </label>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            border: '2px solid #e5e7eb', borderRadius: '10px',
            padding: '10px 14px', background: '#f9fafb',
          }}>
            <span style={{ fontSize: '16px' }}>📱</span>
            <input
              type="tel"
              value={phoneInput}
              onChange={e => { setPhoneInput(e.target.value); setErrorMessage(''); }}
              placeholder="521XXXXXXXXXX"
              style={{
                flex: 1, border: 'none', background: 'transparent',
                fontSize: '14px', color: '#111827', outline: 'none',
              }}
              onKeyDown={e => e.key === 'Enter' && handleRequestPairingCode()}
            />
          </div>
          <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '6px' }}>
            Incluye código de país: México=521, Colombia=57, España=34, Argentina=549
          </p>
          {errorMessage && (
            <p style={{ fontSize: '13px', color: '#ef4444', marginTop: '6px' }}>{errorMessage}</p>
          )}
        </div>

        <button
          type="button"
          onClick={handleRequestPairingCode}
          style={{
            width: '100%', background: '#7c3aed', color: '#fff',
            border: 'none', borderRadius: '12px', padding: '14px 24px',
            fontWeight: 700, fontSize: '15px', cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(124,58,237,0.35)',
          }}
        >
          🔢 Obtener Código
        </button>

        {/* Volver a QR */}
        <button
          type="button"
          onClick={() => { setMode('qr'); setScreen('form'); }}
          style={{
            display: 'block', width: '100%', marginTop: '12px',
            background: 'none', border: 'none', fontSize: '13px',
            color: '#9ca3af', cursor: 'pointer', textDecoration: 'underline',
          }}
        >
          ← Volver a usar el QR
        </button>

        <FooterNav onBack={onBack} onSkip={onSkip} />
      </div>
    );
  }

  // ─── RENDER: Code Ready ─────────────────────────────────────────────────────
  if (screen === 'code_ready' && pairingCode) {
    return (
      <div className="ob-step">
        <div className="ob-step-icon">🔐</div>
        <h2 className="ob-step-title">Tu Código de Emparejamiento</h2>
        <p className="ob-step-subtitle">Ingresa este código en tu WhatsApp ahora.</p>

        {/* Código destacado */}
        <div style={{
          background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
          border: '2px solid #c4b5fd', borderRadius: '20px',
          padding: '28px 24px', textAlign: 'center', margin: '12px 0 20px',
        }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#6d28d9', letterSpacing: '0.15em', marginBottom: '10px', textTransform: 'uppercase' }}>
            Código de emparejamiento
          </p>
          <p style={{
            fontSize: '38px', fontWeight: 900, letterSpacing: '0.3em',
            color: '#4c1d95', fontFamily: 'monospace', margin: 0,
          }}>
            {pairingCode}
          </p>
        </div>

        {/* Pasos */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
          {[
            'Abre WhatsApp en tu celular de negocio.',
            'Ve a Ajustes → Dispositivos Vinculados.',
            'Toca "Vincular dispositivo" → "Vincular con número de teléfono".',
            `Escribe el código: ${pairingCode}`,
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%', background: '#e2e8f0',
                textAlign: 'center', fontSize: '11px', fontWeight: 700,
                lineHeight: '20px', color: '#475569', flexShrink: 0,
              }}>{i + 1}</div>
              <span style={{ fontSize: '13px', color: '#475569' }}>{step}</span>
            </div>
          ))}
        </div>

        <p style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', marginBottom: '12px' }} className="ob-pulse">
          ⏳ Esperando que ingreses el código...
        </p>

        <button
          type="button"
          onClick={handleRequestPairingCode}
          style={{
            display: 'block', width: '100%', background: 'none',
            border: '1px solid #e2e8f0', borderRadius: '8px',
            padding: '8px', fontSize: '13px', color: '#64748b',
            cursor: 'pointer', marginBottom: '8px',
          }}
        >
          🔄 Generar nuevo código
        </button>

        {/* Fallback a QR */}
        <div style={{
          background: '#fffbeb', border: '1px solid #fcd34d',
          borderRadius: '10px', padding: '12px', textAlign: 'center', marginBottom: '8px',
        }}>
          <p style={{ fontSize: '12px', color: '#92400e', margin: '0 0 8px' }}>
            ¿El código no funciona? Prueba con el QR.
          </p>
          <button
            type="button"
            onClick={() => { stopPolling(); setMode('qr'); handleGenerateQR(); }}
            style={{
              background: 'none', border: 'none', fontSize: '13px',
              fontWeight: 700, color: '#b45309', cursor: 'pointer', textDecoration: 'underline',
            }}
          >
            Usar Código QR →
          </button>
        </div>

        <FooterNav onBack={() => { setScreen('requesting_code'); }} onSkip={onSkip} />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Error
  // ─────────────────────────────────────────────────────────────────────────────
  if (screen === 'error') {
    return (
      <div className="ob-step">
        <div className="ob-step-icon">⚠️</div>
        <h2 className="ob-step-title">Algo salió mal</h2>
        <div style={{
          background: '#fef2f2', border: '1px solid #fca5a5',
          borderRadius: '12px', padding: '20px', textAlign: 'left', margin: '16px 0',
          maxHeight: '300px', overflowY: 'auto',
        }}>
          <p style={{ fontSize: '13px', color: '#dc2626', margin: 0 }}>{errorMessage}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={() => setScreen('form')}
            style={{
              background: '#ef4444', color: '#fff', border: 'none',
              borderRadius: '8px', padding: '10px 24px',
              fontWeight: 600, cursor: 'pointer', fontSize: '14px',
            }}
          >
            Intentar de nuevo
          </button>
        </div>
        <FooterNav onBack={onBack} onSkip={onSkip} />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Form (default screen)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="ob-step">
      <div className="ob-step-icon">📱</div>
      <h2 className="ob-step-title">Activa tu WhatsApp Inteligente</h2>
      <p className="ob-step-subtitle">
        Para que Nilah pueda hablar con tus clientes, necesitamos que escanees un Código QR.
        Este proceso es exactamente igual a abrir WhatsApp Web.
      </p>

      {/* Benefits */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: '10px',
        background: '#f8fafc', border: '1px solid #e2e8f0',
        borderRadius: '14px', padding: '20px', marginBottom: '28px',
      }}>
        {[
          { icon: '🤖', text: 'Nilah asistirá a tus clientes con respuestas inteligentes' },
          { icon: '📅', text: 'Agendará citas leyendo tu disponibilidad' },
          { icon: '💰', text: 'Escalará tu negocio liberando tu tiempo' },
        ].map((item) => (
          <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>{item.icon}</span>
            <span style={{ fontSize: '14px', color: '#475569' }}>{item.text}</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleGenerateQR}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '10px', background: '#25D366', color: '#fff', fontWeight: 700,
          fontSize: '15px', border: 'none', borderRadius: '12px',
          padding: '14px 24px', cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(37,211,102,0.35)',
          marginTop: '8px',
          transition: 'transform 0.2s',
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        Generar Código QR
      </button>

      <FooterNav onBack={onBack} onSkip={onSkip} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Small reusable footer component
// ─────────────────────────────────────────────────────────────────────────────
const FooterNav: React.FC<{ onBack?: () => void; onSkip: () => void }> = ({ onBack, onSkip }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginTop: '28px', paddingTop: '16px', borderTop: '1px solid #f1f5f9',
  }}>
    {onBack && (
      <button type="button" className="ob-back-link" onClick={onBack}>
        ← Volver
      </button>
    )}
    <button
      type="button"
      onClick={onSkip}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: '13px', color: '#94a3b8', textDecoration: 'underline',
        marginLeft: 'auto',
      }}
    >
      Omitir por ahora (Configurar después)
    </button>
  </div>
);

export default StepWhatsApp;
