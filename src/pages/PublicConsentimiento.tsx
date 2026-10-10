import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, Heart,
  Eye, Calendar, Clock, ChevronRight, Check, ArrowLeft, Loader2
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
  negocio_nombre?: string;
  negocio_logo?: string;
}

export const PublicConsentimiento: React.FC = () => {
  const { token, salonSlug } = useParams<{ token?: string; salonSlug?: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<ConsentData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Bienvenida, 2: Salud/Alertas, 3: Preferencias/Estilo, 4: Firma & Consentimiento

  // Respuestas del Formulario
  const [salud, setSalud] = useState({
    alergia_adhesivo: false,
    alergia_latex: false,
    lentes_contacto: false,
    ojos_secos_blefaritis: false,
    cirugia_ocular_reciente: false,
    embarazo_lactancia: false,
    primera_vez: true,
  });

  const [estilo, setEstilo] = useState({
    volumen: 'Efecto Rímel (Clásicas / Híbridas)',
    curvatura: 'C (Natural abierta)',
    longitud: 'Media (10-12mm)',
    forma_ojo: 'Almendrado',
  });

  const [firmaBase64, setFirmaBase64] = useState('');
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

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
          if (consent.preferencias_diseno && Object.keys(consent.preferencias_diseno).length > 0) {
            setEstilo((prev) => ({ ...prev, ...consent.preferencias_diseno }));
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
      alert('Por favor realiza tu firma con el dedo para continuar.');
      return;
    }
    if (!aceptaTerminos) {
      alert('Debes confirmar que leíste y aceptas las políticas de cuidado.');
      return;
    }

    setSaving(true);
    try {
      // Calcular alertas de salud
      const alertas: string[] = [];
      if (salud.alergia_adhesivo) alertas.push('Alergia o sensibilidad al cianoacrilato/adhesivos');
      if (salud.alergia_latex) alertas.push('Alergia al látex');
      if (salud.lentes_contacto) alertas.push('Usa lentes de contacto (retirar antes de cita)');
      if (salud.ojos_secos_blefaritis) alertas.push('Padece de ojo seco o blefaritis');
      if (salud.cirugia_ocular_reciente) alertas.push('Cirugía ocular en últimos 6 meses');
      if (salud.embarazo_lactancia) alertas.push('Embarazo / Hormonas (posible menor retención)');

      const { error } = await supabase
        .from('consentimientos_clientes')
        .update({
          estado: 'firmado',
          respuestas_salud: salud,
          preferencias_diseno: estilo,
          alertas_detectadas: alertas,
          firma_png: firmaBase64,
          signed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('token', token);

      if (error) throw error;

      setIsCompleted(true);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      alert('Ocurrió un error guardando tu consentimiento: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-rose-50/40 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-rose-500 animate-spin mb-3" />
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Cargando tu ficha de consentimiento...</p>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen bg-rose-50/40 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-900/30 text-rose-500 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Enlace no encontrado o vencido</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mb-6">
          Este formulario no existe o ya caducó. Por favor contacta al salón para solicitar un nuevo enlace.
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
          className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/10"
        >
          <CheckCircle2 className="w-10 h-10" />
        </motion.div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">¡Ficha de Consentimiento Lista! ✨</h2>
        <p className="text-zinc-600 dark:text-zinc-300 max-w-md text-sm mb-6 leading-relaxed">
          Muchas gracias, <strong className="text-zinc-900 dark:text-white">{data.cliente_nombre || 'hermosa'}</strong>. 
          Tu lashista ya tiene tus preferencias y notas de salud listas para tu cita.
        </p>

        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl p-5 border border-rose-100 dark:border-zinc-800 text-left max-w-sm w-full shadow-sm mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4" /> Recomendaciones para tu cita:
          </div>
          <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-2 list-disc pl-4">
            <li>Llega con tus ojos limpios, sin rímel ni sombras.</li>
            <li>Si usas lentes de contacto, recuerda traer tu estuche para retirarlos.</li>
            <li>Evita cafeína 2 horas antes para mantener tus ojos relajados.</li>
          </ul>
        </div>

        <p className="text-xs text-zinc-400">Protegido y respaldado por Nilah IA</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rose-50/30 dark:bg-zinc-950 flex flex-col justify-between py-6 px-4 max-w-lg mx-auto">
      {/* Header */}
      <header className="mb-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100/80 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-medium mb-3">
          <ShieldCheck className="w-3.5 h-3.5" /> Ficha de Consentimiento & Salud
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
          Extensiones de Pestañas
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Hola <strong>{data.cliente_nombre || 'Guapa'}</strong>, ayúdanos a personalizar tu cita y proteger tus ojitos
        </p>

        {/* Stepper Dots */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step === s
                  ? 'w-7 bg-rose-500'
                  : step > s
                  ? 'w-3 bg-emerald-500'
                  : 'w-3 bg-zinc-200 dark:bg-zinc-800'
              }`}
            />
          ))}
        </div>
      </header>

      {/* Main Body with Steps */}
      <main className="flex-1 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-rose-100/70 dark:border-zinc-800/80 rounded-3xl p-5 shadow-xl shadow-rose-950/5 flex flex-col justify-between">
        <AnimatePresence mode="wait">
          {/* STEP 1: Bienvenida & Datos */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="text-center py-2">
                <div className="w-14 h-14 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Eye className="w-7 h-7" />
                </div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-white">Antes de comenzar</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 px-4 leading-relaxed">
                  Para que tu experiencia sea 100% segura y con la mejor retención, necesitamos hacerte unas breves preguntas sobre la salud de tus ojos y tu estilo soñado.
                </p>
              </div>

              <div className="bg-rose-50/60 dark:bg-zinc-800/50 rounded-2xl p-4 border border-rose-100 dark:border-zinc-700/50 text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Servicio Agendado:</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">Extensiones de Pestañas</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Frecuencia:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Solo 1 vez (Vigencia 1 año)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Tiempo estimado:</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400">~ 1 minuto</span>
                </div>
                <div className="pt-2 border-t border-rose-100 dark:border-zinc-700/60 text-[11px] text-zinc-500 dark:text-zinc-400">
                  ✨ <em>¡Tranquila! Esta ficha solo se completa una vez para tus futuras citas y retoques durante los próximos 12 meses.</em>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-medium text-sm shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  Comenzar Ficha <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Salud & Seguridad */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-rose-500" /> Cuestionario de Salud Ocular
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Marca los aspectos que apliquen en tu caso:
                </p>
              </div>

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {[
                  { key: 'primera_vez', label: '¿Es tu primera vez con extensiones?', desc: 'Para explicarte a detalle el procedimiento' },
                  { key: 'alergia_adhesivo', label: '¿Alergia a adhesivos o cianoacrilato?', desc: 'Importante para usar parches o pegamento hipoalergénico' },
                  { key: 'lentes_contacto', label: '¿Usas lentes de contacto?', desc: 'Deberás retirarlos antes de la aplicación' },
                  { key: 'ojos_secos_blefaritis', label: '¿Padeces ojo seco o lagrimeo constante?', desc: 'Ajustamos la ventilación durante la sesión' },
                  { key: 'cirugia_ocular_reciente', label: '¿Cirugía ocular (LASIK u otra) en 6 meses?', desc: 'Por recomendación médica' },
                  { key: 'embarazo_lactancia', label: '¿Estás embarazada o en lactancia?', desc: 'Los cambios hormonales pueden alterar la retención' },
                ].map(({ key, label, desc }) => (
                  <label
                    key={key}
                    className={`flex items-start justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                      salud[key as keyof typeof salud]
                        ? 'border-rose-400 bg-rose-50/70 dark:bg-rose-950/30 dark:border-rose-700/60'
                        : 'border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-800/30'
                    }`}
                  >
                    <div className="pr-3">
                      <p className="text-xs font-medium text-zinc-900 dark:text-white leading-tight">{label}</p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">{desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={salud[key as keyof typeof salud]}
                      onChange={(e) =>
                        setSalud((prev) => ({ ...prev, [key]: e.target.checked }))
                      }
                      className="mt-0.5 rounded text-rose-500 focus:ring-rose-400 h-4 w-4"
                    />
                  </label>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="py-3 px-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-medium text-xs shadow-md shadow-rose-500/20 flex items-center justify-center gap-2"
                >
                  Siguiente: Tu Estilo Soñado <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Preferencias & Diseño Visual */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-pink-500" /> Diseño y Efecto Deseado
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Elige cómo te imaginas tu mirada:
                </p>
              </div>

              <div className="space-y-3">
                {/* Estilo / Efecto */}
                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                    Efecto de Pestaña:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      'Efecto Rímel (Clásicas)',
                      'Efecto Mojado (Wet Look)',
                      'Volumen Ruso / Glam',
                      'Foxy Eye / Cat Eye',
                    ].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setEstilo((prev) => ({ ...prev, volumen: opt }))}
                        className={`p-2.5 rounded-2xl border text-left text-xs font-medium transition-all ${
                          estilo.volumen === opt
                            ? 'border-pink-500 bg-pink-50/80 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 font-semibold shadow-xs'
                            : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Longitud */}
                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                    Largo preferido:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Natural (8-10mm)', 'Media (10-12mm)', 'Dramático (13mm+)'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setEstilo((prev) => ({ ...prev, longitud: opt }))}
                        className={`p-2 rounded-xl border text-center text-[11px] transition-all ${
                          estilo.longitud === opt
                            ? 'border-pink-500 bg-pink-50/80 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 font-semibold'
                            : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Curvatura */}
                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                    Curvatura de pestaña:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Curva C (Natural)', 'Curva D (Elevada)', 'Curva L/M (Efecto Lift)'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setEstilo((prev) => ({ ...prev, curvatura: opt }))}
                        className={`p-2 rounded-xl border text-center text-[11px] transition-all ${
                          estilo.curvatura === opt
                            ? 'border-pink-500 bg-pink-50/80 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 font-semibold'
                            : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="py-3 px-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-medium text-xs shadow-md shadow-rose-500/20 flex items-center justify-center gap-2"
                >
                  Siguiente: Términos & Firma <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Consentimiento Legal & Firma Digital */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Consentimiento Informado
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Por favor lee las condiciones y firma en el recuadro abajo:
                </p>
              </div>

              {/* Caja de términos */}
              <div className="bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl p-3 border border-zinc-200/80 dark:border-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-400 space-y-1.5 max-h-28 overflow-y-auto leading-relaxed">
                <p>• Comprendo que las extensiones se aplican pestaña por pestaña con adhesivo profesional para uso estético.</p>
                <p>• Esta ficha y firma tienen una validez de <strong>12 meses</strong> para todas tus sesiones y retoques regulares (no tendrás que volver a firmar cada semana, salvo cambios médicos).</p>
                <p>• Me comprometo a no mojar las extensiones durante las primeras 24-48 horas si así lo requiere la técnica y a no aplicar desmaquillantes a base de aceite.</p>
                <p>• Entiendo el ciclo natural de caída (muda) de 2 a 5 pestañas diarias y la necesidad de retoque cada 15-20 días.</p>
                <p>• Declaro que las respuestas sobre mi salud ocular son verdaderas y eximo de responsabilidad al salón ante reacciones alérgicas no reportadas previamente.</p>
              </div>

              {/* Checkbox Aceptación */}
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aceptaTerminos}
                  onChange={(e) => setAceptaTerminos(e.target.checked)}
                  className="mt-0.5 rounded text-rose-500 focus:ring-rose-400 h-4 w-4"
                />
                <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                  He leído, comprendo y acepto los términos y cuidados expuestos.
                </span>
              </label>

              {/* Signature Pad */}
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Tu Firma Táctil:
                </label>
                <SignaturePad onSave={(base64) => setFirmaBase64(base64)} />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="py-3 px-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving || !firmaBase64 || !aceptaTerminos}
                  className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 text-white font-semibold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Guardando tu firma...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Enviar y Confirmar Ficha
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Branding */}
      <footer className="mt-4 text-center">
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
          Tecnología de gestión estética · <span className="font-semibold text-rose-500">Korat Flow / Nilah</span>
        </p>
      </footer>
    </div>
  );
};
export default PublicConsentimiento;
