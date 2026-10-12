import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, Check,
  Loader2, Clock, Eye, AlertCircle
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { SignaturePad } from '../components/consentimiento/SignaturePad';
import confetti from 'canvas-confetti';

interface ConsentData {
  id: string;
  token: string;
  business_id: string;
  tipo_servicio: string;
  estado: string;
  cliente_nombre: string;
  cliente_telefono: string;
  respuestas_salud: Record<string, boolean>;
  preferencias_diseno: Record<string, string>;
  alertas_detectadas: string[];
}

export const PublicConsentimiento: React.FC = () => {
  const { token, salonSlug } = useParams<{ token?: string; salonSlug?: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<ConsentData | null>(null);
  const [salonNombre, setSalonNombre] = useState<string>('el salón');
  const [notFound, setNotFound] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // 1. Salud (Solo se marca lo que aplique - enfoque ágil)
  const [salud, setSalud] = useState({
    alergia_adhesivo: false,
    lentes_contacto: false,
    ojos_sensibles: false,
    cirugia_reciente: false,
    embarazo: false,
  });

  // 2. Acabado deseado
  const [acabado, setAcabado] = useState<'Natural' | 'Volumen' | 'Efecto Mojado' | 'Asesoría'>('Natural');

  // 3. Firma y Términos
  const [firmaBase64, setFirmaBase64] = useState('');
  const [aceptaTerminos, setAceptaTerminos] = useState(true); // Pre-marcado para agilizar

  useEffect(() => {
    async function fetchConsentimiento() {
      if (!token) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const { data: consent, error } = await supabase
          .from('consentimientos_clientes')
          .select('*')
          .eq('token', token)
          .single();

        if (error || !consent) {
          setNotFound(true);
        } else {
          setData(consent);
          if (consent.estado === 'firmado') {
            setIsCompleted(true);
          }
          if (consent.respuestas_salud && Object.keys(consent.respuestas_salud).length > 0) {
            setSalud((prev) => ({ ...prev, ...consent.respuestas_salud }));
          }
          if (consent.preferencias_diseno?.acabado) {
            setAcabado(consent.preferencias_diseno.acabado as any);
          }

          // Cargar nombre del negocio
          if (consent.business_id) {
            const { data: neg } = await supabase
              .from('negocios')
              .select('nombre')
              .eq('id', consent.business_id)
              .maybeSingle();

            if (neg?.nombre) {
              setSalonNombre(neg.nombre);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching consentimiento:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    fetchConsentimiento();
  }, [token]);

  const handleSubmit = async () => {
    if (!firmaBase64) {
      alert('Por favor dibuja tu firma con el dedo para confirmar.');
      return;
    }
    if (!aceptaTerminos) {
      alert('Debes aceptar los términos de cuidado para continuar.');
      return;
    }

    setSaving(true);
    try {
      // Calcular alertas clínicas
      const alertas: string[] = [];
      if (salud.alergia_adhesivo) alertas.push('Sensibilidad o alergia a adhesivos/cianoacrilato');
      if (salud.lentes_contacto) alertas.push('Usa lentes de contacto (retirar antes de iniciar)');
      if (salud.ojos_sensibles) alertas.push('Ojos sensibles o lagrimeo frecuente');
      if (salud.cirugia_reciente) alertas.push('Cirugía ocular en los últimos 6 meses');
      if (salud.embarazo) alertas.push('Embarazo o cambios hormonales');

      const { error } = await supabase
        .from('consentimientos_clientes')
        .update({
          estado: 'firmado',
          respuestas_salud: salud,
          preferencias_diseno: { acabado },
          alertas_detectadas: alertas,
          firma_png: firmaBase64,
          signed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('token', token);

      if (error) throw error;

      setIsCompleted(true);
      confetti({
        particleCount: 70,
        spread: 55,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      alert('Error guardando tu ficha: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-rose-50/40 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-rose-500 animate-spin mb-3" />
        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Cargando ficha rápida...</p>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen bg-rose-50/40 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-900/30 text-rose-500 flex items-center justify-center mb-3">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Enlace no disponible</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs">
          Este formulario ya no existe o fue completado previamente.
        </p>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50/80 to-white dark:from-zinc-950 dark:to-zinc-900 flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/10"
        >
          <CheckCircle2 className="w-8 h-8" />
        </motion.div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-1.5">¡Ficha de Consentimiento Lista! ✨</h2>
        <p className="text-zinc-600 dark:text-zinc-300 max-w-sm text-xs mb-5 leading-relaxed">
          ¡Gracias <strong className="text-zinc-900 dark:text-white">{data.cliente_nombre || ''}</strong>! Tu ficha fue guardada con vigencia de <strong>1 año</strong>.
        </p>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-rose-100 dark:border-zinc-800 text-left max-w-xs w-full shadow-sm mb-6 text-[11px] space-y-1.5 text-zinc-600 dark:text-zinc-400">
          <p className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Tips para tu cita en {salonNombre}:
          </p>
          <p>• Asiste con tus ojos limpios y sin rímel.</p>
          <p>• Retira tus lentes de contacto antes de iniciar.</p>
          <p>• Evita mojar tus pestañas en las primeras 24 horas.</p>
        </div>

        <p className="text-[10px] text-zinc-400">Tu lashista ya tiene tus respuestas listas</p>
      </div>
    );
  }

  const hasHealthAlerts = Object.values(salud).some(Boolean);

  return (
    <div className="min-h-screen bg-rose-50/25 dark:bg-zinc-950 py-5 px-4 max-w-md mx-auto flex flex-col justify-between">
      <div>
        {/* Header Compacto */}
        <header className="mb-4 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 text-[11px] font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Ficha Médica & Consentimiento
          </div>
          <h1 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
            {salonNombre}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Hola <strong>{data.cliente_nombre || 'Guapa'}</strong> · Completa en <strong>30 segundos</strong> (Válido x 1 año)
          </p>
        </header>

        {/* Formulario One-Page */}
        <div className="bg-white dark:bg-zinc-900/90 rounded-3xl p-4 sm:p-5 border border-rose-100 dark:border-zinc-800 shadow-xl shadow-rose-950/5 space-y-4">
          
          {/* SECCIÓN 1: SALUD OCULAR (Toggles Rápidos) */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-rose-500" /> 1. Salud de tus Ojos:
              </label>
              <span className="text-[10px] text-zinc-400">Toca solo si aplica</span>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              {[
                { key: 'lentes_contacto', label: '👓 Uso lentes de contacto', tip: 'Deberás retirarlos durante la sesión' },
                { key: 'alergia_adhesivo', label: '⚠️ Alergia o sensibilidad a adhesivos / látex', tip: 'Usaremos adhesivo hipoalergénico' },
                { key: 'ojos_sensibles', label: '💧 Ojo seco o lagrimeo frecuente', tip: 'Ajustamos la ventilación' },
                { key: 'cirugia_reciente', label: '👁️ Cirugía ocular en los últimos 6 meses', tip: 'LASIK u otra' },
                { key: 'embarazo', label: '🌸 Embarazo o lactancia', tip: 'Puede variar la retención' },
              ].map(({ key, label, tip }) => {
                const checked = salud[key as keyof typeof salud];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSalud((prev) => ({ ...prev, [key]: !prev[key as keyof typeof salud] }))}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-start justify-between transition-all ${
                      checked
                        ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 shadow-xs'
                        : 'border-zinc-200/70 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-semibold leading-tight">{label}</p>
                      <p className="text-[10px] opacity-70 mt-0.5">{tip}</p>
                    </div>
                    <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border transition-all ${
                      checked ? 'bg-rose-500 border-rose-500 text-white' : 'border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800'
                    }`}>
                      {checked && <Check className="w-3 h-3" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {!hasHealthAlerts && (
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 pt-0.5">
                <Check className="w-3 h-3" /> Sin condiciones reportadas (Ojos 100% aptos)
              </p>
            )}
          </section>

          {/* SECCIÓN 2: ACABADO DESEADO (1 Toque) */}
          <section className="space-y-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
            <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-500" /> 2. ¿Qué acabado prefieres hoy?
            </label>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'Natural', title: '🌸 Natural / Sutil', desc: 'Como con rímel puesto' },
                { id: 'Efecto Mojado', title: '💧 Efecto Mojado', desc: 'Pestañas glossy y definidas' },
                { id: 'Volumen', title: '👑 Volumen Tupido', desc: 'Mirada poblada e intensa' },
                { id: 'Asesoría', title: '🪄 Recomiéndame', desc: 'Que mi lashista decida' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAcabado(opt.id as any)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    acabado === opt.id
                      ? 'border-pink-500 bg-pink-50/80 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 font-bold shadow-xs'
                      : 'border-zinc-200/70 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <p className="text-xs font-bold text-zinc-900 dark:text-white leading-tight">{opt.title}</p>
                  <p className="text-[10px] opacity-75 mt-0.5 leading-tight">{opt.desc}</p>
                </button>
              ))}
            </div>
          </section>

          {/* SECCIÓN 3: FIRMA TÁCTIL & CONSENTIMIENTO */}
          <section className="space-y-2.5 pt-1 border-t border-zinc-100 dark:border-zinc-800">
            <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">
              3. Firma con tu dedo:
            </label>

            <SignaturePad onSave={(base64) => setFirmaBase64(base64)} />

            {/* Términos resumidos en 1 tarjeta */}
            <div className="bg-zinc-50 dark:bg-zinc-800/40 p-2.5 rounded-xl border border-zinc-200/70 dark:border-zinc-800 text-[10px] text-zinc-500 dark:text-zinc-400 leading-snug space-y-1">
              <p>• Comprendo las recomendaciones de cuidado (no mojar por 24h, no usar aceites).</p>
              <p>• Entiendo el ciclo natural de muda de pestañas (2-4 al día) y la necesidad de retoque cada 15-20 días.</p>
              <p>• Esta firma tiene una validez de <strong>12 meses</strong> para todas tus sesiones en el salón.</p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-0.5">
              <input
                type="checkbox"
                checked={aceptaTerminos}
                onChange={(e) => setAceptaTerminos(e.target.checked)}
                className="rounded text-rose-500 focus:ring-rose-400 h-4 w-4"
              />
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                He leído y acepto los términos de consentimiento.
              </span>
            </label>
          </section>

          {/* BOTÓN PRINCIPAL */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !firmaBase64 || !aceptaTerminos}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:to-pink-700 disabled:opacity-40 text-white font-bold text-xs sm:text-sm shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Guardando tu ficha...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" /> Confirmar Ficha & Consentimiento (30 seg)
              </>
            )}
          </button>
        </div>
      </div>

      <footer className="mt-4 text-center">
        <p className="text-[10px] text-zinc-400">
          Consentimiento respaldado por <span className="font-semibold text-rose-500">Nilah IA / Korat</span>
        </p>
      </footer>
    </div>
  );
};
export default PublicConsentimiento;
