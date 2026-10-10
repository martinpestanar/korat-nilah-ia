import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, AlertTriangle, Send, Copy, Check, FileText,
  Clock, Eye, Sparkles, RefreshCw, Loader2, ExternalLink
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';

interface ClientConsentSectionProps {
  clientId: number;
  clientName: string;
  clientPhone: string;
  businessId?: string;
}

export const ClientConsentSection: React.FC<ClientConsentSectionProps> = ({
  clientId,
  clientName,
  clientPhone,
  businessId,
}) => {
  const { user } = useAuth();
  const effectiveBusinessId = businessId || user?.business_id || localStorage.getItem('korat_business_id') || '';
  const [consentimiento, setConsentimiento] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showFirmaModal, setShowFirmaModal] = useState(false);

  const fetchConsentimiento = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('consentimientos_clientes')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setConsentimiento(data);
      } else {
        setConsentimiento(null);
      }
    } catch (err) {
      console.error('Error fetching consent:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchConsentimiento();
    }
  }, [clientId]);

  // Generar link manual
  const handleGenerateLink = async () => {
    setGenerating(true);
    try {
      // Generar token limpio criptográfico corto (ej: 7a8f9c1b)
      const randomToken = Math.random().toString(36).substring(2, 6) + Date.now().toString(36).substring(4, 8);
      const cleanPhone = clientPhone ? clientPhone.replace(/\D/g, '') : '';

      const { data, error } = await supabase
        .from('consentimientos_clientes')
        .insert({
          business_id: effectiveBusinessId,
          client_id: clientId,
          token: randomToken,
          tipo_servicio: 'pestanas',
          estado: 'pendiente',
          cliente_nombre: clientName,
          cliente_telefono: cleanPhone,
          sent_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      setConsentimiento(data);
    } catch (err: any) {
      alert('Error creando enlace de consentimiento: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  // Obtener slug del negocio si existe
  const salonSlug = user?.nombre_negocio
    ? user.nombre_negocio.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    : '';

  const consentUrl = consentimiento?.token
    ? salonSlug
      ? `${window.location.origin}/c/${salonSlug}/${consentimiento.token}`
      : `${window.location.origin}/c/${consentimiento.token}`
    : '';

  const handleCopy = () => {
    if (!consentUrl) return;
    navigator.clipboard.writeText(consentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    if (!consentUrl) return;
    const cleanPhone = clientPhone.replace(/\D/g, '');
    const salonNombre = user?.nombre_negocio || 'el salón';
    const mensaje = encodeURIComponent(
      `¡Hola ${clientName}! ✨ Para tu cita de Extensiones de Pestañas en ${salonNombre}, por favor completa tu ficha médica y consentimiento informado antes de tu sesión:\n\n${consentUrl}\n\n⏱️ Solo toma 1 minuto y tiene vigencia de 1 año (no tendrás que volver a llenarlo en tus próximos retoques).\n\n🌸 Recomendaciones: Recuerda venir con tus ojos limpios, sin rímel ni maquillaje, y retirar lentes de contacto antes de la aplicación.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${mensaje}`, '_blank');
  };

  if (loading) {
    return (
      <div className="py-6 flex items-center justify-center gap-2 text-zinc-400 text-xs">
        <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
        <span>Consultando consentimientos...</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-rose-100 dark:border-zinc-800 bg-rose-50/20 dark:bg-zinc-900/40 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
              Consentimiento Informado
            </h4>
            <p className="text-[10px] text-zinc-400">Ficha médica legal y preferencias</p>
          </div>
        </div>

        {/* Badge de Estado */}
        {consentimiento?.estado === 'firmado' ? (
          <div className="flex flex-col items-end">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <Check className="w-3 h-3" /> Firmado (Vigente)
            </span>
            <span className="text-[9px] text-zinc-400 mt-0.5 font-medium">Válido x 12 meses</span>
          </div>
        ) : consentimiento?.estado === 'pendiente' ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3 h-3" /> Pendiente de Firma
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
            No solicitado
          </span>
        )}
      </div>

      {/* Caso: Consentimiento FIRMADO */}
      {consentimiento?.estado === 'firmado' && (
        <div className="space-y-3 pt-1">
          {/* Alertas Detectadas */}
          {consentimiento.alertas_detectadas && consentimiento.alertas_detectadas.length > 0 ? (
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[11px] text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5" /> Alertas Médicas Reportadas:
              </div>
              <ul className="list-disc pl-4 text-[10px] space-y-0.5">
                {consentimiento.alertas_detectadas.map((alerta: string, idx: number) => (
                  <li key={idx}>{alerta}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 text-[11px] flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-500" /> Sin alergias ni contraindicaciones reportadas
            </div>
          )}

          {/* Preferencias de Diseño Elegidas */}
          {consentimiento.preferencias_diseno && (
            <div className="grid grid-cols-2 gap-2 text-[11px] bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
              <div>
                <span className="text-zinc-400 block text-[9px] uppercase font-bold">Efecto Deseado</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {consentimiento.preferencias_diseno.volumen || 'Clásicas'}
                </span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[9px] uppercase font-bold">Curvatura & Largo</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {consentimiento.preferencias_diseno.curvatura} · {consentimiento.preferencias_diseno.longitud}
                </span>
              </div>
            </div>
          )}

          {/* Acciones: Ver Firma / Renovar */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-zinc-400">
              Firmado el {new Date(consentimiento.signed_at).toLocaleDateString()}
            </span>
            <div className="flex gap-1.5">
              {consentimiento.firma_png && (
                <button
                  type="button"
                  onClick={() => setShowFirmaModal(true)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[11px] font-medium flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" /> Ver Firma
                </button>
              )}
              <button
                type="button"
                onClick={handleGenerateLink}
                disabled={generating}
                className="px-2.5 py-1 rounded-lg text-rose-600 hover:bg-rose-100/50 dark:hover:bg-rose-950/40 text-[11px] font-medium flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Renovar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Caso: PENDIENTE o NO SOLICITADO */}
      {consentimiento?.estado !== 'firmado' && (
        <div className="space-y-2.5 pt-1">
          {consentimiento?.token ? (
            <>
              <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 flex items-center justify-between text-xs">
                <span className="truncate max-w-[200px] text-[11px] text-zinc-500 font-mono">
                  {consentUrl}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="p-1 rounded-md text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                    title="Copiar link"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <a
                    href={consentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded-md text-zinc-500 hover:text-zinc-700"
                    title="Abrir vista clienta"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-emerald-500/20"
                >
                  <Send className="w-3.5 h-3.5" /> Enviar por WhatsApp
                </button>
                <button
                  type="button"
                  onClick={handleGenerateLink}
                  disabled={generating}
                  className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-700"
                  title="Generar nuevo enlace"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-2">
              <p className="text-xs text-zinc-500 mb-2">
                Aún no has solicitado el consentimiento informado a esta clienta.
              </p>
              <button
                type="button"
                onClick={handleGenerateLink}
                disabled={generating}
                className="py-2 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm shadow-rose-500/20"
              >
                {generating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                Generar Enlace de Consentimiento
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal de Firma */}
      {showFirmaModal && consentimiento?.firma_png && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Firma Táctil Registrada
              </h4>
              <button
                type="button"
                onClick={() => setShowFirmaModal(false)}
                className="text-xs font-bold text-zinc-400 hover:text-zinc-600"
              >
                Cerrar
              </button>
            </div>
            <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
              <img
                src={consentimiento.firma_png}
                alt="Firma digital"
                className="max-h-32 object-contain"
              />
            </div>
            <p className="text-[10px] text-zinc-400 text-center">
              Registrado con sello de fecha: {new Date(consentimiento.signed_at).toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
