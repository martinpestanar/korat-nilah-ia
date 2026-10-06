import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Gift, CheckCircle2, ChevronRight, ArrowLeft, Sparkles,
  Smartphone, Share2, Copy, Check, ExternalLink, Clock, ShieldCheck,
  Heart, Tag, MapPin, AlertCircle, Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  fetchPublicSalonData, emitirCuponPublico, CATEGORIAS_PREDEFINIDAS
} from '../services/resenasService';
import { ResenasPublicData, ResenaPremio, ResenaCupon } from '../types/resenas';

export const PublicReviewFlow: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const [loading, setLoading] = useState(true);
  const [salonData, setSalonData] = useState<ResenasPublicData | null>(null);
  const [activeCoupon, setActiveCoupon] = useState<ResenaCupon | null>(null);

  // Pasos: 1 = Categoria, 2 = Premio, 3 = Datos & Google, 4 = Desbloqueado
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedCategoria, setSelectedCategoria] = useState<string>('Uñas');
  const [selectedPremio, setSelectedPremio] = useState<ResenaPremio | null>(null);

  // Formulario de activación
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleOpened, setGoogleOpened] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Carga de datos del salón
  useEffect(() => {
    if (!slug) return;

    const loadSalon = async () => {
      setLoading(true);
      try {
        const data = await fetchPublicSalonData(slug);
        if (data) {
          setSalonData(data);

          // Verificar si ya tiene cupón guardado en este dispositivo
          const storageKey = `nilah_coupon_${data.negocio.id}`;
          const saved = localStorage.getItem(storageKey);
          if (saved) {
            try {
              const parsed: ResenaCupon = JSON.parse(saved);
              // Verificar si no está vencido
              if (new Date(parsed.expira_en) > new Date()) {
                setActiveCoupon(parsed);
                setStep(4);
              }
            } catch (e) {
              console.warn('Error reading saved coupon:', e);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching public salon data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSalon();
  }, [slug]);

  // Disparar confeti
  const fireConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#E11D48', '#FB7185', '#F59E0B', '#10B981'],
    });
  };

  // Paso 1 -> Paso 2
  const handleSelectCategoria = (catId: string) => {
    setSelectedCategoria(catId);
    setStep(2);
  };

  // Paso 2 -> Paso 3
  const handleSelectPremio = (premio: ResenaPremio) => {
    setSelectedPremio(premio);
    setStep(3);
  };

  // Paso 3: Activar cupón y redirigir a Google
  const handleUnlockCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salonData || !selectedPremio || !clienteNombre.trim() || !clienteTelefono.trim()) return;

    setSubmitting(true);
    try {
      // 1. Emitir / Registrar en Supabase y CRM
      const { cupon } = await emitirCuponPublico({
        businessId: salonData.negocio.id,
        businessName: salonData.negocio.nombre,
        premioId: selectedPremio.id,
        categoriaServicio: selectedCategoria,
        tituloBeneficio: selectedPremio.titulo_premio,
        diasValidez: selectedPremio.dias_validez || salonData.config.dias_validez_default || 30,
        clienteNombre: clienteNombre.trim(),
        clienteTelefono: clienteTelefono.trim(),
        webhookUrl: salonData.config.webhook_n8n_url,
      });

      // 2. Guardar en localStorage
      const storageKey = `nilah_coupon_${salonData.negocio.id}`;
      localStorage.setItem(storageKey, JSON.stringify(cupon));
      setActiveCoupon(cupon);

      // 3. Abrir Google Maps Reviews en pestaña nueva
      const googleLink = salonData.config.google_review_url || 'https://google.com';
      window.open(googleLink, '_blank');
      setGoogleOpened(true);

      // 4. Celebración y avance a paso final
      fireConfetti();
      setStep(4);
    } catch (err) {
      console.error('Error emitiendo cupon:', err);
      alert('Hubo un inconveniente al generar tu beneficio. Por favor verifica tus datos.');
    } finally {
      setSubmitting(false);
    }
  };

  // Copiar código
  const handleCopyCode = () => {
    if (!activeCoupon) return;
    navigator.clipboard.writeText(activeCoupon.codigo);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Guardar en WhatsApp
  const handleShareWhatsApp = () => {
    if (!activeCoupon || !salonData) return;
    const msg = `✨ ¡Hola ${salonData.negocio.nombre}! Soy ${activeCoupon.cliente_nombre}. Acabo de dejar mi reseña de 5 estrellas ⭐⭐⭐⭐⭐ en Google.\n\n🎁 *Mi cupón de premio es:*\n• Beneficio: *${activeCoupon.titulo_beneficio}*\n• Código: *${activeCoupon.codigo}*\n• Válido hasta: *${new Date(activeCoupon.expira_en).toLocaleDateString()}*\n\n¡Nos vemos en mi próxima cita! 💕`;
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-rose-50/40 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-rose-500 mb-3" />
        <p className="text-sm font-semibold text-gray-600">Cargando beneficios del salón...</p>
      </div>
    );
  }

  if (!salonData) {
    return (
      <div className="min-h-screen bg-rose-50/30 flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 rounded-3xl bg-white shadow-xl max-w-sm space-y-3">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-gray-900">Salón no encontrado</h2>
          <p className="text-xs text-gray-500">
            El código o enlace escaneado no coincide con ningún salón registrado.
          </p>
        </div>
      </div>
    );
  }

  // Premios filtrados para la categoría seleccionada
  const premiosCategoria = salonData.premios.filter(
    (p) => p.categoria === selectedCategoria || p.categoria === 'General'
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/60 via-white to-pink-50/40 flex flex-col items-center justify-between p-4 sm:p-6 text-gray-900 font-sans">
      {/* ── HEADER SALÓN ── */}
      <header className="w-full max-w-md pt-2 pb-4 text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white shadow-sm border border-rose-100 text-[11px] font-extrabold uppercase tracking-wider text-rose-500">
          <Star size={12} className="fill-amber-400 text-amber-400" /> Club de Clientas 5⭐
        </div>

        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">
          {salonData.negocio.nombre}
        </h1>

        <p className="text-xs text-gray-500 max-w-xs mx-auto">
          {step === 4
            ? '¡Tu beneficio está listo para tu próxima visita!'
            : 'Califícanos en Google y llévate un beneficio especial para tu próxima cita'}
        </p>
      </header>

      {/* ── CUERPO PRINCIPAL DEL FLUJO ── */}
      <main className="w-full max-w-md my-auto">
        <AnimatePresence mode="wait">
          {/* PASO 1: SELECCIÓN DE CATEGORÍA */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-4"
            >
              <div className="text-center mb-5">
                <span className="text-xs font-bold text-rose-500 uppercase tracking-widest">Paso 1 de 3</span>
                <h2 className="text-lg font-black text-gray-900 mt-0.5">
                  ¿Qué servicio te realizaste hoy?
                </h2>
                <p className="text-xs text-gray-500">
                  Selecciona la categoría para ver los premios disponibles
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {CATEGORIAS_PREDEFINIDAS.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleSelectCategoria(cat.id)}
                    className="w-full p-4 rounded-2xl bg-white hover:bg-rose-50/50 border border-rose-100/80 shadow-sm hover:shadow-md transition-all flex items-center justify-between group active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="text-2xl p-2 rounded-xl bg-rose-50 group-hover:scale-110 transition-transform">
                        {cat.emoji}
                      </span>
                      <span className="text-sm font-bold text-gray-800 text-left">
                        {cat.label}
                      </span>
                    </div>
                    <ChevronRight size={18} className="text-gray-400 group-hover:text-rose-500 transition-colors" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* PASO 2: ELECCIÓN DEL PREMIO */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft size={14} /> Volver
                </button>
                <span className="text-xs font-bold text-rose-500 uppercase tracking-widest">Paso 2 de 3</span>
              </div>

              <div className="text-center mb-4">
                <h2 className="text-lg font-black text-gray-900">
                  Elige tu beneficio para la próxima visita
                </h2>
                <p className="text-xs text-gray-500">
                  Categoría seleccionada: <span className="font-bold text-rose-500">{selectedCategoria}</span>
                </p>
              </div>

              <div className="space-y-3">
                {premiosCategoria.length === 0 ? (
                  <div className="p-8 bg-white rounded-3xl text-center text-gray-400 text-xs border border-rose-100">
                    No hay promociones activas en esta categoría en este momento.
                  </div>
                ) : (
                  premiosCategoria.map((premio) => (
                    <div
                      key={premio.id}
                      onClick={() => handleSelectPremio(premio)}
                      className="p-5 rounded-3xl bg-white border border-rose-100 shadow-sm hover:shadow-lg hover:border-rose-300 transition-all cursor-pointer flex flex-col justify-between active:scale-[0.98] group"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-sm font-extrabold text-gray-900 group-hover:text-rose-600 transition-colors">
                          {premio.titulo_premio}
                        </h3>
                        <span className="px-2.5 py-1 rounded-full bg-rose-500 text-white font-black text-xs shrink-0 shadow-sm">
                          {premio.valor_recompensa || 'Especial'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-rose-50">
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> Validez: {premio.dias_validez || 30} días
                        </span>
                        <span className="text-rose-500 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                          Elegir <ChevronRight size={12} />
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* PASO 3: FORMULARIO Y REDIRECCIÓN A GOOGLE */}
          {step === 3 && selectedPremio && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft size={14} /> Cambiar premio
                </button>
                <span className="text-xs font-bold text-rose-500 uppercase tracking-widest">Paso 3 de 3</span>
              </div>

              {/* Tarjeta del Premio Seleccionado */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md text-center space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-widest opacity-85">Premio Seleccionado</span>
                <h3 className="text-base font-extrabold">{selectedPremio.titulo_premio}</h3>
              </div>

              {/* Formulario */}
              <form onSubmit={handleUnlockCoupon} className="p-5 rounded-3xl bg-white border border-rose-100 shadow-xl space-y-4">
                <div className="text-center space-y-1">
                  <h4 className="text-sm font-extrabold text-gray-900">
                    Ingresa tus datos para respaldar tu cupón
                  </h4>
                  <p className="text-[11px] text-gray-400">
                    Te enviaremos el código a tu WhatsApp para que no lo pierdas.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tu Nombre Completo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Valeria Torres"
                    value={clienteNombre}
                    onChange={(e) => setClienteNombre(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tu WhatsApp</label>
                  <input
                    type="tel"
                    required
                    placeholder="Ej: 999 888 777"
                    value={clienteTelefono}
                    onChange={(e) => setClienteTelefono(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-extrabold text-sm shadow-lg shadow-rose-500/25 hover:opacity-95 transition-opacity flex items-center justify-center gap-2"
                  >
                    <Star size={16} className="fill-amber-300 text-amber-300" />
                    <span>{submitting ? 'Generando cupón...' : 'Calificar en Google & Desbloquear'}</span>
                  </button>
                  <p className="text-[10px] text-center text-gray-400 mt-2">
                    🔒 Al hacer clic, se abrirá la ficha de reseñas de Google Maps en una nueva pestaña.
                  </p>
                </div>
              </form>
            </motion.div>
          )}

          {/* PASO 4: CUPÓN DESBLOQUEADO Y GUARDADO */}
          {step === 4 && activeCoupon && (
            <motion.div
              key="step4"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-4"
            >
              {/* Tarjeta del Cupón Activo Estilo Ticket */}
              <div className="rounded-[32px] bg-white border-2 border-dashed border-rose-200 shadow-2xl overflow-hidden p-6 text-center space-y-4 relative">
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-extrabold border border-emerald-200">
                  <CheckCircle2 size={13} /> ¡CUPÓN DESBLOQUEADO!
                </div>

                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Beneficio Activo</span>
                  <h3 className="text-lg font-black text-rose-600 mt-0.5">
                    {activeCoupon.titulo_beneficio}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Para: <span className="font-semibold text-gray-800">{activeCoupon.cliente_nombre}</span>
                  </p>
                </div>

                {/* Código Destacado */}
                <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100 inline-block w-full">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    CÓDIGO ÚNICO DE CANJE
                  </span>
                  <div className="text-2xl font-mono font-black tracking-widest text-gray-900">
                    {activeCoupon.codigo}
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="mt-2 text-xs font-bold text-rose-500 hover:text-rose-600 inline-flex items-center gap-1"
                  >
                    {copiedCode ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedCode ? '¡Copiado al portapapeles!' : 'Copiar código'}</span>
                  </button>
                </div>

                {/* Fecha de Expiración */}
                <div className="text-xs text-gray-500 flex items-center justify-center gap-1.5">
                  <Clock size={13} className="text-amber-500" />
                  <span>Válido hasta el <b>{new Date(activeCoupon.expira_en).toLocaleDateString()}</b></span>
                </div>

                {/* Acciones de Respaldo */}
                <div className="space-y-2 pt-2">
                  <button
                    onClick={handleShareWhatsApp}
                    className="w-full py-3 px-4 rounded-2xl bg-emerald-500 text-white font-extrabold text-xs shadow-md hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Smartphone size={16} />
                    <span>Guardar mi cupón en WhatsApp</span>
                  </button>

                  {salonData.config.google_review_url && (
                    <a
                      href={salonData.config.google_review_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 border border-gray-200"
                    >
                      <ExternalLink size={13} />
                      <span>Ver o Editar mi Reseña en Google</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Instrucción de Canje */}
              <div className="p-4 rounded-2xl bg-white/70 border border-rose-100 text-center text-xs text-gray-500 space-y-1">
                <p className="font-bold text-gray-700">¿Cómo lo canjeo?</p>
                <p>Presenta este código en recepción cuando visites el salón para tu próximo servicio.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── FOOTER DISCRETO ── */}
      <footer className="w-full max-w-md py-4 text-center">
        <span className="text-[11px] text-gray-400 font-medium">
          Powered by <b className="text-rose-500">Nilah</b> • Korat Flow Agency
        </span>
      </footer>
    </div>
  );
};

export default PublicReviewFlow;
