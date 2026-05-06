import React, { useState, useEffect } from 'react';
import { Bot, Link as LinkIcon, Smartphone, RefreshCw, CheckCircle2, AlertCircle, SmartphoneCharging, Loader2, Download, Users } from 'lucide-react';
import { supabase } from '../../services/supabase';

interface VincularWhatsAppProps {
  businessId: string;
}

type SyncStatus = 'idle' | 'syncing' | 'done' | 'error';

interface SyncResult {
  total_encontrados: number;
  total_importados: number;
  total_ya_existentes: number;
  mensaje: string;
}

export const VincularWhatsApp: React.FC<VincularWhatsAppProps> = ({ businessId }) => {
  const [status, setStatus] = useState<'idle' | 'generating' | 'qr_ready' | 'connected' | 'error'>('idle');
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [instanceName, setInstanceName] = useState('');

  // Sync state
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [syncError, setSyncError] = useState('');

  // Verificar si ya existe en la DB
  useEffect(() => {
    checkExistingInstance();
  }, [businessId]);

  const checkExistingInstance = async () => {
    try {
      const { data } = await supabase
        .from('instancias_evolution')
        .select('*')
        .eq('business_id', businessId)
        .maybeSingle();

      if (data && data.status === 'conectado') {
        setStatus('connected');
        setInstanceName(data.instance_name);
      }
    } catch (e) {
      console.error('Error al revisar BD de instancias', e);
    }
  };

  // ─── Sync historial de WhatsApp ────────────────────────────────────────────
  const handleSyncHistory = async (name: string) => {
    setSyncStatus('syncing');
    setSyncError('');
    setSyncResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('sync-whatsapp-history', {
        body: { business_id: businessId, instance_name: name },
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'La sincronización falló.');

      setSyncResult({
        total_encontrados: data.total_encontrados ?? 0,
        total_importados: data.total_importados ?? 0,
        total_ya_existentes: data.total_ya_existentes ?? 0,
        mensaje: data.mensaje ?? '✅ Sincronización completada.',
      });
      setSyncStatus('done');
    } catch (e: any) {
      console.error('Sync error:', e);
      setSyncError(e.message || 'Error al importar el historial.');
      setSyncStatus('error');
    }
  };

  const handleCreateInstance = async () => {
    setStatus('generating');
    setErrorMessage('');

    try {
      const { data, error } = await supabase.functions.invoke('create-evo-instance', {
        body: { businessId }
      });

      if (error) throw new Error(error.message || 'Error al conectar con el servidor.');
      if (!data || !data.success) throw new Error(data?.error || 'Error al generar la instancia de Nilah.');

      const newInstanceName = data.instanceName;
      const base64QR = data.base64QR;

      if (!base64QR) throw new Error('La API de Evolution no devolvió un código QR.');

      setInstanceName(newInstanceName);
      setQrBase64(base64QR);
      setStatus('qr_ready');

      await supabase.from('instancias_evolution').upsert({
        business_id: businessId,
        instance_name: newInstanceName,
        instance_id: data.clientInstanceId,
        api_key: data.clientApiKey,
        status: 'pendiente'
      }, { onConflict: 'business_id' });

      startPollingConnection(newInstanceName);
    } catch (e: any) {
      console.error('Evolution API Error:', e);
      setStatus('error');
      setErrorMessage(e.message || 'Hubo un error al generar la llave maestra de la IA.');
    }
  };

  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    if (!confirm('¿Estás seguro de que deseas desvincular WhatsApp? Se eliminará la conexión actual y deberás escanear el QR nuevamente.')) return;
    
    setIsResetting(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-evo-instance', {
        body: { businessId }
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'No se pudo desvincular.');

      setStatus('idle');
      setQrBase64(null);
      setInstanceName('');
      setSyncStatus('idle');
      setSyncResult(null);
    } catch (e: any) {
      console.error('Reset error:', e);
      alert('Error al desvincular: ' + e.message);
    } finally {
      setIsResetting(false);
    }
  };

  const startPollingConnection = (name: string) => {
    const interval = setInterval(async () => {
      try {
        const { data } = await supabase.functions.invoke('check-evo-connection', {
          body: { instanceName: name }
        });

        if (data?.isConnected) {
          clearInterval(interval);
          setStatus('connected');
          setInstanceName(name);
          await supabase.from('instancias_evolution').update({ status: 'conectado' }).eq('instance_name', name);

          // ✨ Auto-trigger sync after connection — wait 5s for Evolution to stabilize
          setTimeout(() => handleSyncHistory(name), 5000);
        }
      } catch { /* silencio */ }
    }, 3000);

    setTimeout(() => clearInterval(interval), 120000);
  };

  // ─── Render: Connected ──────────────────────────────────────────────────────
  if (status === 'connected') {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-500/5">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle2 size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">WhatsApp Vinculado Exitosamente</h3>
              <button
                onClick={handleReset}
                disabled={isResetting}
                className="text-xs text-rose-500 hover:text-rose-600 hover:underline disabled:opacity-50 font-medium"
              >
                {isResetting ? 'Desvinculando...' : 'Desvincular'}
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Nilah ahora tiene control remoto sobre tu cuenta de WhatsApp.{' '}
              <span className="font-mono text-xs text-gray-400">{instanceName}</span>
            </p>

          </div>
        </div>
      </div>
    );
  }

  // ─── Render: Disconnected states ────────────────────────────────────────────
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-white/5 dark:bg-[#161622]">
      <div className="border-b border-gray-100 px-6 py-5 dark:border-white/5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-green-500/10 p-2 text-green-500">
            <Smartphone size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Conexión de WhatsApp</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ataquemos a tu canal principal. Nilah tomará vida a través de tu número de empresa.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {status === 'idle' && (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <div className="mb-4 rounded-full bg-gray-50 p-6 dark:bg-white/5">
              <Bot size={48} className="text-violet-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Todo listo para lanzar a Nilah 🚀</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-sm">
              Tu IA utilizará este número para conversar, agendar y enviar promociones.
            </p>
            <button
              onClick={handleCreateInstance}
              className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-8 py-3 text-sm font-bold text-white shadow-lg shadow-[#25D366]/20 transition-all hover:-translate-y-1 hover:bg-[#1fa952]"
            >
              <LinkIcon size={18} />
              Generar QR para Vincular
            </button>
          </div>
        )}

        {status === 'generating' && (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-violet-500 mb-4" />
            <p className="font-semibold text-gray-900 dark:text-white">Creando servidor exclusivo en Evolution...</p>
            <p className="text-sm text-gray-500 mt-2">Dándole vida a tu IA en la nube.</p>
          </div>
        )}

        {status === 'qr_ready' && qrBase64 && (
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1 space-y-5">
              <div className="rounded-xl bg-amber-50 p-4 border border-amber-200 dark:bg-amber-900/10 dark:border-amber-500/20">
                <h4 className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-400 mb-2">
                  <AlertCircle size={18} />
                  ¿Estás desde tu celular ahora mismo?
                </h4>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Para vincular correctamente necesitas leer este QR con el WhatsApp de tu negocio.
                </p>
                <div className="mt-3 space-y-2">
                  {[
                    'Tómale una foto o captura a este QR.',
                    'Envíalo a una Laptop u otro celular para verlo en pantalla.',
                    'Abre WhatsApp de negocio → Ajustes → Dispositivos Vinculados.',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-amber-200 text-center text-xs font-bold leading-5 text-amber-800 dark:bg-amber-800 dark:text-amber-200">{i + 1}</div>
                      <p className="text-sm text-amber-700 dark:text-amber-300">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-500 text-center animate-pulse">Esperando conexión...</p>
            </div>

            <div className="shrink-0 flex flex-col items-center">
              <div className="rounded-2xl border-4 border-gray-100 bg-white p-2 shadow-xl dark:border-white/10">
                <img src={qrBase64} alt="QR Code" className="w-56 h-56 rounded-xl object-contain" />
              </div>
              <button
                onClick={handleCreateInstance}
                className="mt-4 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-white transition"
              >
                <RefreshCw size={14} /> Recargar QR
              </button>

              <button
                onClick={handleReset}
                className="mt-2 text-xs text-rose-400 hover:text-rose-500 transition"
              >
                Cancelar vinculación
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-center dark:border-rose-500/20 dark:bg-rose-500/5">
            <AlertCircle size={32} className="mx-auto text-rose-500 mb-2" />
            <h3 className="font-bold text-gray-900 dark:text-white">Algo salió mal</h3>
            <p className="mt-1 mb-4 text-sm text-gray-600 dark:text-gray-400">{errorMessage}</p>
            <button
              onClick={handleCreateInstance}
              className="rounded-lg bg-rose-500 px-6 py-2 text-sm font-bold text-white hover:bg-rose-600 shadow-sm"
            >
              Reintentar Conexión
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
