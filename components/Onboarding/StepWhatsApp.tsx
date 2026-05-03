import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../services/supabase';

interface Props {
  businessId: string;
  tokenId: string;
  onComplete: () => void;
  onSkip: () => void;
  onBack?: () => void;
}

type Screen = 'form' | 'requesting' | 'qr_ready' | 'connected' | 'error';

const StepWhatsApp: React.FC<Props> = ({ businessId, onComplete, onSkip, onBack }) => {
  const [screen, setScreen] = useState<Screen>('form');
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [instanceName, setInstanceName] = useState('');
  const [instanceApiKey, setInstanceApiKey] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync state
  type SyncStatus = 'idle' | 'syncing' | 'done' | 'error' | 'skipped';
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncResult, setSyncResult] = useState<{ total_importados: number; total_encontrados: number; total_ya_existentes: number; mensaje: string } | null>(null);
  const [syncError, setSyncError] = useState('');

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

  const handleSyncHistory = useCallback(async (name: string, bid: string) => {
    // Sincronización en segundo plano (fire and forget)
    setSyncStatus('done');
    setSyncResult({
      total_encontrados: 0,
      total_importados: 0,
      total_ya_existentes: 0,
      mensaje: '⏳ Sincronización iniciada en segundo plano. Tus clientes aparecerán en breve.',
    });

    try {
      // Reemplaza esta URL por la URL de producción (Production URL) de tu nodo Webhook de n8n
      const N8N_WEBHOOK_URL = 'https://n8n.koratflow.agency/webhook/sync-history';

      fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: bid,
          instance_name: name,
          api_key: instanceApiKey,
          background: true
        }),
      }).catch(err => console.error('Error al disparar el webhook de n8n:', err));

    } catch (e: any) {
      console.error('Error al iniciar la importación en segundo plano', e);
    }
  }, []);

  const startPolling = (name: string) => {
    stopPolling();
    pollingRef.current = setInterval(async () => {
      try {
        const { data } = await supabase.functions.invoke('check-evo-connection', {
          body: { instanceName: name },
        });
        if (data?.isConnected) {
          stopPolling();

          const telefonoConectado = data.owner ? data.owner.replace('@s.whatsapp.net', '') : null;
          const updatePayload: any = { status: 'conectado' };
          if (telefonoConectado) updatePayload.telefono = telefonoConectado;

          await supabase
            .from('instancias_evolution')
            .update(updatePayload)
            .eq('instance_name', name);

          setScreen('connected');
          // ✨ Auto-trigger history sync immediately after connection
          handleSyncHistory(name, businessId);
        }
      } catch { /* silencio */ }
    }, 3000);
    timeoutRef.current = setTimeout(() => stopPolling(), 120_000);
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

    try {
      const { data, error } = await supabase.functions.invoke('create-evo-instance', {
        body: { businessId, mode: 'qr' },
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'No se pudo generar el QR.');

      setInstanceName(data.instanceName);
      setInstanceApiKey(data.clientApiKey);
      setQrBase64(data.base64QR || null);

      // Guardar/actualizar instancia en base de datos (evita 409 con lógica manual)
      const { data: existente } = await supabase
        .from('instancias_evolution')
        .select('id')
        .eq('business_id', businessId)
        .maybeSingle();

      const dbPayload = {
        business_id: businessId,
        instance_name: data.instanceName,
        instance_id: data.clientInstanceId,
        api_key: data.clientApiKey,
        status: 'pendiente',
      };

      const dbQuery = existente?.id
        ? supabase.from('instancias_evolution').update(dbPayload).eq('id', existente.id)
        : supabase.from('instancias_evolution').insert(dbPayload);

      const { error: dbError } = await dbQuery;

      if (dbError) {
        console.error("Error al guardar la instancia de Evolution API:", dbError);
        // Podríamos throw error aquí, pero para no detener el flujo si el QR es válido, lo dejamos fluir
      }

      setScreen('qr_ready');
      startPolling(data.instanceName);
    } catch (e: any) {
      setErrorMessage(e.message || 'Error desconocido al intentar generar la conexión.');
      setScreen('error');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Connected
  // ─────────────────────────────────────────────────────────────────────────────
  if (screen === 'connected') {
    return (
      <div className="ob-step">
        <div className="ob-step-icon">🎉</div>
        <h2 className="ob-step-title">¡WhatsApp conectado!</h2>
        <p className="ob-step-subtitle">
          Nilah está activa. Ahora importamos tus contactos existentes para que empieces con tu CRM lleno.
        </p>

        {/* Connection badge */}
        <div style={{
          background: 'linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)',
          border: '2px solid #86efac', borderRadius: '14px',
          padding: '16px 20px', marginBottom: '20px',
          display: 'flex', alignItems: 'center', gap: '14px',
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%', background: '#22c55e',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px', flexShrink: 0, color: '#fff',
          }}>✓</div>
          <div>
            <p style={{ fontWeight: 700, color: '#166534', margin: 0, fontSize: '14px' }}>Número vinculado exitosamente</p>
            <p style={{ fontSize: '11px', color: '#15803d', margin: '2px 0 0', fontFamily: 'monospace' }}>{instanceName}</p>
          </div>
        </div>

        {/* Sync Panel */}
        <div style={{
          background: '#faf5ff', border: '1px solid #ddd6fe',
          borderRadius: '14px', padding: '18px 20px', marginBottom: '24px',
        }}>
          <p style={{ fontWeight: 700, color: '#5b21b6', margin: '0 0 6px', fontSize: '14px' }}>
            👥 Importando historial de contactos
          </p>

          {syncStatus === 'syncing' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
              <div className="ob-spinner" style={{ width: 20, height: 20, flexShrink: 0 }} />
              <p style={{ fontSize: '13px', color: '#6d28d9', margin: 0 }}>Leyendo tus chats de WhatsApp...</p>
            </div>
          )}

          {syncStatus === 'done' && syncResult && (
            <div>
              <p style={{ fontSize: '13px', color: '#059669', fontWeight: 600, margin: '8px 0 10px' }}>
                {syncResult.mensaje}
              </p>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {[{ label: 'Chats analizados', value: syncResult.total_encontrados, emoji: '📥' },
                { label: 'Clientes nuevos', value: syncResult.total_importados, emoji: '✅' },
                { label: 'Ya existían', value: syncResult.total_ya_existentes, emoji: '⏭' }]
                  .map(({ label, value, emoji }) => (
                    <div key={label} style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '22px', fontWeight: 800, color: '#4c1d95', margin: 0 }}>{value}</p>
                      <p style={{ fontSize: '11px', color: '#6d28d9', margin: 0 }}>{emoji} {label}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {syncStatus === 'error' && (
            <div>
              <p style={{ fontSize: '13px', color: '#dc2626', margin: '8px 0 10px' }}>{syncError}</p>
              <button
                type="button"
                onClick={() => handleSyncHistory(instanceName, businessId)}
                style={{ fontSize: '12px', color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
              >
                Reintentar importación
              </button>
            </div>
          )}

          {syncStatus === 'idle' && (
            <button
              type="button"
              onClick={() => handleSyncHistory(instanceName, businessId)}
              style={{
                marginTop: '8px', background: '#7c3aed', color: '#fff', border: 'none',
                borderRadius: '8px', padding: '9px 18px', fontSize: '13px',
                fontWeight: 600, cursor: 'pointer',
              }}
            >
              Importar historial manualmente
            </button>
          )}
        </div>

        <button
          type="button"
          className="ob-btn-primary ob-btn-primary--large ob-btn-primary--glow"
          onClick={handleFinalize}
          disabled={syncStatus === 'syncing'}
          style={syncStatus === 'syncing' ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
        >
          {syncStatus === 'syncing' ? 'Importando... un momento...' : 'Ir a mi Dashboard →'}
        </button>

        {(syncStatus === 'idle' || syncStatus === 'error') && (
          <button
            type="button"
            onClick={handleSkipFinalize}
            style={{
              display: 'block', width: '100%', marginTop: '10px', background: 'none',
              border: 'none', fontSize: '13px', color: '#94a3b8', cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Omitir importación e ir al Dashboard
          </button>
        )}
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
          Abre tu WhatsApp de negocio → Dispositivos Vinculados → Vincular dispositivo.
        </p>

        {/* Mobile warning */}
        <div style={{
          background: '#fffbeb', border: '1px solid #fcd34d',
          borderRadius: '12px', padding: '14px 16px', marginBottom: '20px',
        }}>
          <p style={{ fontWeight: 700, color: '#92400e', margin: '0 0 8px', fontSize: '13px' }}>
            ⚠️ ¿Estás usando el mismo celular de negocio?
          </p>
          <p style={{ fontSize: '13px', color: '#92400e', margin: 0 }}>
            Tómale captura al QR, envíala a otra pantalla (tu laptop o el celular de alguien más) y
            luego escanéala con el WhatsApp de tu negocio.
          </p>
        </div>

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
              🔄 Recargar QR (Caduca pronto)
            </button>
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '14px', padding: '24px 0' }}>
            No se pudo cargar el QR. Intenta recargar.
          </p>
        )}

        <FooterNav onBack={() => setScreen('form')} onSkip={onSkip} />
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
