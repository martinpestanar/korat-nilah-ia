import React, { useState, useEffect, useRef } from 'react';
import {
  Bot, Link as LinkIcon, Smartphone, RefreshCw, CheckCircle2,
  AlertCircle, SmartphoneCharging, Loader2, QrCode, Hash,
  ChevronRight, ArrowLeft, Phone,
} from 'lucide-react';
import { supabase } from '../../services/supabase';

interface VincularWhatsAppProps {
  businessId: string;
}

type Status = 'idle' | 'generating' | 'qr_ready' | 'requesting_code' | 'code_ready' | 'connected' | 'error';
type Mode   = 'qr' | 'pairing';

export const VincularWhatsApp: React.FC<VincularWhatsAppProps> = ({ businessId }) => {
  const [status, setStatus]       = useState<Status>('idle');
  const [mode, setMode]           = useState<Mode>('qr');
  const [qrBase64, setQrBase64]   = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [phoneInput, setPhoneInput]   = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [instanceName, setInstanceName] = useState('');
  const [isResetting, setIsResetting]   = useState(false);
  const [copied, setCopied]             = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>  | null>(null);

  useEffect(() => {
    checkExistingInstance();
    return () => stopPolling();
  }, [businessId]);

  const stopPolling = () => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current);  timeoutRef.current  = null; }
  };

  const checkExistingInstance = async () => {
    try {
      const { data } = await supabase
        .from('instancias_evolution')
        .select('*')
        .eq('business_id', businessId)
        .maybeSingle();
      if (data?.status === 'conectado') {
        setStatus('connected');
        setInstanceName(data.instance_name);
      }
    } catch (e) {
      console.error('Error revisando instancia existente', e);
    }
  };

  // ─── Crear instancia + obtener QR fresco ────────────────────────────────
  const handleCreateInstance = async () => {
    setStatus('generating');
    setErrorMessage('');
    setQrBase64(null);
    setPairingCode(null);
    stopPolling();

    try {
      const { data, error } = await supabase.functions.invoke('create-evo-instance', {
        body: { businessId },
      });

      if (error) throw new Error(error.message || 'Error al conectar con el servidor.');
      if (!data?.success) throw new Error(data?.error || 'Error al generar la instancia.');

      const newInstanceName = data.instanceName;
      const base64QR = data.base64QR;

      if (!base64QR) throw new Error('Evolution API no devolvió un QR. Intenta el Código de Emparejamiento.');

      setInstanceName(newInstanceName);
      setQrBase64(base64QR);
      setStatus('qr_ready');
      startPolling(newInstanceName);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      setStatus('error');
      setErrorMessage(msg);
    }
  };

  // ─── Solicitar Pairing Code ──────────────────────────────────────────────
  const handleRequestPairingCode = async () => {
    const clean = phoneInput.replace(/\D/g, '');
    if (clean.length < 10) {
      setErrorMessage('Ingresa tu número con código de país (ej: 521XXXXXXXXXX).');
      return;
    }

    setStatus('requesting_code');
    setErrorMessage('');
    setPairingCode(null);
    stopPolling();

    try {
      // Si no hay instancia aún, crearla primero
      let name = instanceName;
      if (!name) {
        const { data: createData, error: createErr } = await supabase.functions.invoke('create-evo-instance', {
          body: { businessId },
        });
        if (createErr || !createData?.success) {
          throw new Error(createData?.error || createErr?.message || 'No se pudo crear la instancia.');
        }
        name = createData.instanceName;
        setInstanceName(name);
      }

      // Solicitar pairing code
      const { data, error } = await supabase.functions.invoke('get-pairing-code', {
        body: { businessId, phoneNumber: clean },
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'No se pudo obtener el código.');

      setPairingCode(data.pairingCode);
      setStatus('code_ready');
      startPolling(name);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      setStatus('error');
      setErrorMessage(msg);
    }
  };

  // ─── Polling de conexión ─────────────────────────────────────────────────
  const startPolling = (name: string) => {
    stopPolling();
    pollingRef.current = setInterval(async () => {
      try {
        const { data } = await supabase.functions.invoke('check-evo-connection', {
          body: { instanceName: name },
        });
        if (data?.isConnected) {
          stopPolling();
          setStatus('connected');
          setInstanceName(name);
          await supabase
            .from('instancias_evolution')
            .update({ status: 'conectado' })
            .eq('instance_name', name);
        }
      } catch { /* silencio — seguir intentando */ }
    }, 3000);
    timeoutRef.current = setTimeout(() => stopPolling(), 120_000);
  };

  // ─── Desvincular ─────────────────────────────────────────────────────────
  const handleReset = async () => {
    if (!confirm('¿Desvincular WhatsApp? Deberás reconectar después.')) return;
    setIsResetting(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-evo-instance', {
        body: { businessId },
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'No se pudo desvincular.');
      setStatus('idle');
      setQrBase64(null);
      setPairingCode(null);
      setInstanceName('');
      setPhoneInput('');
    } catch (e: unknown) {
      alert('Error al desvincular: ' + (e instanceof Error ? e.message : 'Error'));
    } finally {
      setIsResetting(false);
    }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER: Conectado
  // ════════════════════════════════════════════════════════════════════════════
  if (status === 'connected') {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-500/5">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle2 size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">WhatsApp Vinculado ✅</h3>
              <button
                onClick={handleReset}
                disabled={isResetting}
                className="text-xs text-rose-500 hover:text-rose-600 hover:underline disabled:opacity-50 font-medium"
              >
                {isResetting ? 'Desvinculando...' : 'Desvincular'}
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Nilah ya tiene control sobre tu WhatsApp.{' '}
              <span className="font-mono text-xs text-gray-400">{instanceName}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER: States con dos modos
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-white/5 dark:bg-[#161622]">
      {/* Header */}
      <div className="border-b border-gray-100 px-6 py-5 dark:border-white/5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-green-500/10 p-2 text-green-500">
            <Smartphone size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Conexión de WhatsApp</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Elige el método que más te convenga para conectar.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">

        {/* ── IDLE: selector de método ─────────────────────────────────────── */}
        {status === 'idle' && (
          <div className="flex flex-col gap-5">
            <div className="rounded-xl bg-violet-500/10 border border-violet-500/20 p-4 text-center">
              <span className="inline-block text-2xl mb-1">💡</span>
              <p className="text-sm font-semibold text-violet-900 dark:text-violet-200">
                ¿Desde dónde estás configurando la App?
              </p>
              <p className="text-xs text-violet-700 dark:text-violet-300 mt-0.5">
                Elige la opción más fácil según el dispositivo que tengas a la mano.
              </p>
            </div>

            {/* Opción Pairing Code (Destacada para móvil) */}
            <button
              onClick={() => { setMode('pairing'); setStatus('requesting_code' as Status); }}
              className="relative group flex items-start gap-4 rounded-2xl border-2 border-violet-500/40 bg-gradient-to-r from-violet-500/5 to-purple-500/5 p-5 text-left transition-all hover:border-violet-500 hover:shadow-lg hover:shadow-violet-500/10 dark:border-violet-500/30"
            >
              <span className="absolute -top-3 right-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                ⭐ Más fácil para celular
              </span>
              <div className="rounded-xl bg-violet-500/10 p-3 text-violet-600 dark:bg-violet-400/20 dark:text-violet-300">
                <Hash size={28} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-gray-900 dark:text-white text-base">Código de 8 dígitos</p>
                </div>
                <p className="text-xs text-violet-600 dark:text-violet-400 font-medium mt-0.5">
                  Recomendado si estás navegando desde tu propio celular.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Ingresas tu número, recibes un código en pantalla y lo pegas en WhatsApp. No necesitas tomar fotos ni usar otra pantalla.
                </p>
              </div>
              <ChevronRight size={20} className="text-violet-400 group-hover:translate-x-1 transition-transform self-center" />
            </button>

            {/* Opción QR */}
            <button
              onClick={() => { setMode('qr'); handleCreateInstance(); }}
              className="group flex items-start gap-4 rounded-2xl border-2 border-gray-100 bg-gray-50 p-5 text-left transition-all hover:border-green-400 hover:bg-green-50 dark:border-white/5 dark:bg-white/3 dark:hover:border-green-500/40 dark:hover:bg-green-500/5"
            >
              <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-white/10 text-green-500">
                <QrCode size={28} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 dark:text-white text-base">Escanear Código QR</p>
                <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-0.5">
                  Ideal si estás desde una Laptop / Computadora.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Escaneas el código directo en la pantalla de la computadora con la cámara de tu celular.
                </p>
              </div>
              <ChevronRight size={20} className="text-gray-400 group-hover:translate-x-1 transition-transform self-center" />
            </button>
          </div>
        )}

        {/* ── GENERATING: spinner ──────────────────────────────────────────── */}
        {status === 'generating' && (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-violet-500 mb-4" />
            <p className="font-semibold text-gray-900 dark:text-white">Preparando tu conexión segura...</p>
            <p className="text-sm text-gray-500 mt-2">Esto tarda unos segundos.</p>
          </div>
        )}

        {/* ── QR_READY: mostrar QR ─────────────────────────────────────────── */}
        {status === 'qr_ready' && qrBase64 && (
          <div className="flex flex-col gap-6">
            {/* Instrucciones */}
            <div className="rounded-xl bg-amber-50 p-4 border border-amber-200 dark:bg-amber-900/10 dark:border-amber-500/20">
              <h4 className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-400 mb-3">
                <AlertCircle size={18} />
                Cómo escanear
              </h4>
              {[
                'Abre WhatsApp de negocio en tu celular.',
                'Ve a Ajustes → Dispositivos Vinculados → Vincular dispositivo.',
                'Apunta la cámara al QR que aparece en pantalla.',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3 mb-2">
                  <div className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-amber-200 text-center text-xs font-bold leading-5 text-amber-800 dark:bg-amber-800 dark:text-amber-200">{i + 1}</div>
                  <p className="text-sm text-amber-700 dark:text-amber-300">{step}</p>
                </div>
              ))}
            </div>

            {/* QR */}
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-2xl border-4 border-gray-100 bg-white p-3 shadow-xl dark:border-white/10">
                <img src={qrBase64} alt="QR Code WhatsApp" className="w-56 h-56 rounded-xl object-contain" />
              </div>
              <p className="text-sm text-gray-500 text-center animate-pulse">⏳ Esperando que escanees...</p>

              <div className="flex flex-col items-center gap-2 w-full">
                <button
                  onClick={handleCreateInstance}
                  className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-white transition"
                >
                  <RefreshCw size={14} /> Recargar QR
                </button>

                {/* Cambiar a pairing code */}
                <div className="mt-2 rounded-xl border border-violet-200 bg-violet-50 p-3 w-full text-center dark:border-violet-500/20 dark:bg-violet-500/5">
                  <p className="text-sm text-violet-700 dark:text-violet-300 mb-2">
                    ¿El QR no funciona? Prueba con el código de emparejamiento.
                  </p>
                  <button
                    onClick={() => { stopPolling(); setStatus('requesting_code' as Status); setMode('pairing'); }}
                    className="text-sm font-bold text-violet-600 hover:text-violet-700 dark:text-violet-400 underline"
                  >
                    Usar Código de Emparejamiento →
                  </button>
                </div>

                <button
                  onClick={handleReset}
                  className="mt-1 text-xs text-rose-400 hover:text-rose-500 transition"
                >
                  Cancelar vinculación
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── REQUESTING_CODE: formulario de número ────────────────────────── */}
        {status === 'requesting_code' && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => setStatus('idle')}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Código de Emparejamiento</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Ingresa tu número de WhatsApp Business con código de país.</p>
              </div>
            </div>

            <div className="rounded-xl bg-violet-50 p-4 border border-violet-200 dark:bg-violet-900/10 dark:border-violet-500/20">
              <h4 className="flex items-center gap-2 font-bold text-violet-800 dark:text-violet-300 mb-3">
                <SmartphoneCharging size={16} />
                ¿Cómo funciona?
              </h4>
              {[
                'Escribe tu número con código de país (sin + ni espacios).',
                'Recibirás un código de 8 letras en esta pantalla.',
                'En tu WhatsApp → Ajustes → Dispositivos Vinculados → Vincular con número.',
                'Ingresa el código de 8 letras. ¡Listo!',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3 mb-2">
                  <div className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-violet-200 text-center text-xs font-bold leading-5 text-violet-800 dark:bg-violet-800 dark:text-violet-200">{i + 1}</div>
                  <p className="text-sm text-violet-700 dark:text-violet-300">{step}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Número de WhatsApp Business
              </label>
              <div className="flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 focus-within:border-violet-400 dark:border-white/10 dark:bg-white/5 transition">
                <Phone size={16} className="text-gray-400 shrink-0" />
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={e => { setPhoneInput(e.target.value); setErrorMessage(''); }}
                  placeholder="521XXXXXXXXXX"
                  className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none"
                  onKeyDown={e => e.key === 'Enter' && handleRequestPairingCode()}
                />
              </div>
              <p className="text-xs text-gray-400">
                Incluye el código de país. Ej: México = 521, Colombia = 57, España = 34.
              </p>
              {errorMessage && (
                <p className="text-sm text-rose-500">{errorMessage}</p>
              )}
            </div>

            <button
              onClick={handleRequestPairingCode}
              className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition-all hover:-translate-y-0.5 hover:bg-violet-700"
            >
              <Hash size={16} />
              Obtener Código de Emparejamiento
            </button>

            {/* Alternativa: volver a QR */}
            <button
              onClick={() => { setStatus('idle'); setMode('qr'); }}
              className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-white text-center underline transition"
            >
              ← Volver a usar el QR
            </button>
          </div>
        )}

        {/* ── CODE_READY: mostrar código ───────────────────────────────────── */}
        {status === 'code_ready' && pairingCode && (
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-violet-100 dark:bg-violet-900/30 mb-2">
                <Hash size={28} className="text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tu Código de Emparejamiento</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Copia este código e ingrésalo en tu WhatsApp</p>
            </div>

            {/* Código destacado con botón de copia */}
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="relative group rounded-2xl border-2 border-violet-300 bg-violet-50 px-8 py-5 dark:border-violet-500/40 dark:bg-violet-500/10">
                <p className="text-4xl font-black tracking-[0.3em] text-violet-700 dark:text-violet-300 font-mono text-center">
                  {pairingCode}
                </p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(pairingCode);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2500);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-900/40 dark:text-violet-300 text-xs font-bold transition"
              >
                {copied ? <CheckCircle2 size={16} className="text-emerald-500" /> : <RefreshCw size={14} />}
                {copied ? '¡Código Copiado!' : 'Copiar Código al Portapapeles'}
              </button>
            </div>

            {/* Instrucciones */}
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 dark:bg-white/5 dark:border-white/5">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                Pasos para ingresar el código:
              </p>
              {[
                'Abre WhatsApp en tu celular de negocio.',
                'Ve a Ajustes → Dispositivos Vinculados.',
                'Toca "Vincular dispositivo" → "Vincular con número de teléfono".',
                `Ingresa el código: ${pairingCode}`,
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3 mb-2">
                  <div className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-gray-200 text-center text-xs font-bold leading-5 text-gray-700 dark:bg-gray-700 dark:text-gray-200">{i + 1}</div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{step}</p>
                </div>
              ))}
            </div>

            <p className="text-sm text-gray-500 text-center animate-pulse">⏳ Esperando que ingreses el código...</p>

            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleRequestPairingCode}
                className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-white transition"
              >
                <RefreshCw size={14} /> Generar nuevo código
              </button>
              {/* Fallback a QR */}
              <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 w-full text-center dark:border-amber-500/20 dark:bg-amber-500/5">
                <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">
                  ¿El código no funciona? Prueba con el QR.
                </p>
                <button
                  onClick={() => { stopPolling(); setMode('qr'); handleCreateInstance(); }}
                  className="text-sm font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 underline"
                >
                  Usar Código QR →
                </button>
              </div>
              <button
                onClick={handleReset}
                className="text-xs text-rose-400 hover:text-rose-500 transition"
              >
                Cancelar vinculación
              </button>
            </div>
          </div>
        )}

        {/* ── ERROR ────────────────────────────────────────────────────────── */}
        {status === 'error' && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-center dark:border-rose-500/20 dark:bg-rose-500/5">
            <AlertCircle size={32} className="mx-auto text-rose-500 mb-3" />
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">Algo salió mal</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">{errorMessage}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => { setStatus('idle'); setErrorMessage(''); }}
                className="rounded-lg border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-white dark:hover:bg-white/5 transition"
              >
                ← Elegir método
              </button>
              <button
                onClick={mode === 'qr' ? handleCreateInstance : handleRequestPairingCode}
                className="rounded-lg bg-rose-500 px-5 py-2 text-sm font-bold text-white hover:bg-rose-600 shadow-sm transition"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
