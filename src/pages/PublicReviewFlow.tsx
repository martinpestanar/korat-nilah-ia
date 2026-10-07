import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Gift, CheckCircle2, ChevronRight, ArrowLeft, Sparkles,
  Smartphone, Share2, Copy, Check, ExternalLink, Clock, ShieldCheck,
  Heart, Tag, MapPin, AlertCircle, Loader2, Camera
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

  // Guardar en WhatsApp directo al número del salón
  const handleShareWhatsApp = () => {
    if (!activeCoupon || !salonData) return;
    
    // Copy dopamínico, limpio y sin caracteres corruptos
    const msg = `✨ ¡Hola ${salonData.negocio.nombre}! Soy ${activeCoupon.cliente_nombre}.\nAcabo de dejarles mi reseña de 5 estrellas ⭐⭐⭐⭐⭐ en Google Maps.\n\n🎁 *Mi cupón de beneficio es:*\n• Premio: *${activeCoupon.titulo_beneficio}*\n• Código: *${activeCoupon.codigo}*\n• Válido hasta: *${new Date(activeCoupon.expira_en).toLocaleDateString()}*\n\n¡Por favor guarden mi beneficio para mi próxima cita! 💕`;
    
    // Limpiar teléfono del salón (si tiene) o abrir selector
    const rawTel = salonData.negocio.telefono || '';
    const cleanTel = rawTel.replace(/[^0-9]/g, '');
    
    // Si tiene 9 dígitos peruanos sin código de país, anteponer 51
    const finalPhone = cleanTel.length === 9 ? `51${cleanTel}` : cleanTel;
    
    const url = finalPhone 
      ? `https://wa.me/${finalPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
      
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-rose-50/30 flex flex-col items-center justify-center p-6 text-center">
        <div className="p-6 rounded-3xl bg-white shadow-xl max-w-sm space-y-3 border border-gray-100">
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

  // Paleta dinámica del negocio (sincronizada desde marca_identidad o BrandPalette)
  const temaNegocioId = salonData.negocio.marca_identidad?.tema?.paleta_id ||
    (typeof window !== 'undefined' ? localStorage.getItem('korat-brand-palette') : 'blush') ||
    'blush';

  const customPaletteNegocio = salonData.negocio.marca_identidad?.tema?.custom_palette;

  // Objeto de estilos visuales hiper-sincronizado con el tema del salón
  const theme = (() => {
    if (temaNegocioId === 'custom' && customPaletteNegocio?.primary) {
      const p = customPaletteNegocio.primary;
      const gFrom = customPaletteNegocio.gradientFrom || p;
      const gTo = customPaletteNegocio.gradientTo || customPaletteNegocio.primaryDark || p;
      return {
        id: 'custom',
        primary: p,
        primaryLight: customPaletteNegocio.primaryLight || p,
        primaryDark: customPaletteNegocio.primaryDark || p,
        gradient: `linear-gradient(135deg, ${gFrom}, ${gTo})`,
        gradientCard: `linear-gradient(145deg, #18181f 0%, #101015 100%)`,
        bgGlow: p,
        bgCanvas: '#f8fafc',
        cardBg: '#ffffff',
        borderSoft: `${p}25`,
        badgeBg: `${p}15`,
        badgeText: p,
        textAccent: p,
        ringGlow: `0 8px 30px ${p}35`,
      };
    }
    if (temaNegocioId === 'default') {
      return {
        id: 'default',
        primary: '#7c3aed',
        primaryLight: '#a78bfa',
        primaryDark: '#5b21b6',
        gradient: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
        gradientCard: 'linear-gradient(145deg, #1b1528 0%, #0f0c18 100%)',
        bgGlow: '#a78bfa',
        bgCanvas: '#faf8ff',
        cardBg: '#ffffff',
        borderSoft: '#7c3aed25',
        badgeBg: '#7c3aed15',
        badgeText: '#7c3aed',
        textAccent: '#7c3aed',
        ringGlow: '0 8px 30px rgba(124, 58, 237, 0.35)',
      };
    }
    if (temaNegocioId === 'lash') {
      return {
        id: 'lash',
        primary: '#b45309',
        primaryLight: '#fbbf24',
        primaryDark: '#78350f',
        gradient: 'linear-gradient(135deg, #18181b 0%, #78350f 70%, #b45309 100%)',
        gradientCard: 'linear-gradient(145deg, #18181b 0%, #09090b 100%)',
        bgGlow: '#fbbf24',
        bgCanvas: '#fcfbfa',
        cardBg: '#ffffff',
        borderSoft: '#b4530925',
        badgeBg: '#b4530915',
        badgeText: '#92400e',
        textAccent: '#b45309',
        ringGlow: '0 8px 30px rgba(180, 83, 9, 0.35)',
      };
    }
    if (temaNegocioId === 'peach') {
      return {
        id: 'peach',
        primary: '#ea580c',
        primaryLight: '#fb923c',
        primaryDark: '#9a3412',
        gradient: 'linear-gradient(135deg, #ea580c 0%, #ec4899 100%)',
        gradientCard: 'linear-gradient(145deg, #231713 0%, #140d0a 100%)',
        bgGlow: '#fb923c',
        bgCanvas: '#fffaf5',
        cardBg: '#ffffff',
        borderSoft: '#ea580c25',
        badgeBg: '#ea580c15',
        badgeText: '#c2410c',
        textAccent: '#ea580c',
        ringGlow: '0 8px 30px rgba(234, 88, 12, 0.35)',
      };
    }
    if (temaNegocioId === 'glamour') {
      return {
        id: 'glamour',
        primary: '#7c3aed',
        primaryLight: '#a78bfa',
        primaryDark: '#4c1d95',
        gradient: 'linear-gradient(135deg, #7c3aed 0%, #059669 100%)',
        gradientCard: 'linear-gradient(145deg, #131b1c 0%, #0c1214 100%)',
        bgGlow: '#34d399',
        bgCanvas: '#f8fafc',
        cardBg: '#ffffff',
        borderSoft: '#7c3aed25',
        badgeBg: '#7c3aed15',
        badgeText: '#6d28d9',
        textAccent: '#7c3aed',
        ringGlow: '0 8px 30px rgba(124, 58, 237, 0.35)',
      };
    }
    // 'blush' (Default favorito estética Nails / Spa)
    return {
      id: 'blush',
      primary: '#e11d7a',
      primaryLight: '#f472b6',
      primaryDark: '#9d174d',
      gradient: 'linear-gradient(135deg, #e11d7a 0%, #f97316 100%)',
      gradientCard: 'linear-gradient(145deg, #1f1218 0%, #12090e 100%)',
      bgGlow: '#f472b6',
      bgCanvas: '#fff8fa',
      cardBg: '#ffffff',
      borderSoft: '#e11d7a25',
      badgeBg: '#e11d7a15',
      badgeText: '#be185d',
      textAccent: '#e11d7a',
      ringGlow: '0 8px 30px rgba(225, 29, 122, 0.35)',
    };
  })();

  const logoUrl = salonData.negocio.logo_url;
  const nombreSalon = salonData.negocio.nombre;

  return (
    <div
      className="min-h-screen w-full flex flex-col justify-between p-3.5 sm:p-5 relative overflow-x-hidden font-sans selection:text-white"
      style={{ backgroundColor: theme.bgCanvas }}
    >
      {/* ── 1. LUZ DE FONDO Y AURA AMBIENTAL DINÁMICA (Inspirada en /soluciones) ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div
          key={`ambient-glow-${theme.id}`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.35, scale: 1 }}
          transition={{ duration: 0.7 }}
          className="absolute -top-28 left-1/2 -translate-x-1/2 w-[420px] h-[360px] rounded-full blur-[110px]"
          style={{ background: theme.bgGlow }}
        />
        <div
          className="absolute -bottom-24 right-0 w-[280px] h-[280px] rounded-full blur-[95px] opacity-20"
          style={{ background: theme.primary }}
        />
      </div>

      <div className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-start relative z-10">
        {/* ── 2. HERO PRINCIPAL SALÓN (Estilo Perfil / Soluciones) ── */}
        <header className="w-full pt-1 pb-3 text-center flex flex-col items-center">
          {/* AVATAR HERO CON ARO CONCÉNTRICO & MEDALLA VERIFICADA */}
          <div className="relative mb-2.5">
            <div
              className="w-18 h-18 rounded-full p-1 shadow-lg flex items-center justify-center relative"
              style={{ background: theme.gradient }}
            >
              {logoUrl ? (
                <div className="w-full h-full rounded-full bg-white p-1 overflow-hidden border-2 border-white flex items-center justify-center">
                  <img
                    src={logoUrl}
                    alt={nombreSalon}
                    className="w-full h-full object-contain rounded-full"
                  />
                </div>
              ) : (
                <div className="w-full h-full rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-white font-black text-2xl shadow-inner">
                  {nombreSalon.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Medalla Oficial de Verificación Google 5⭐ */}
            <div
              className="absolute -bottom-1 -right-1 text-white p-1 rounded-full border-2 border-white shadow-md flex items-center justify-center"
              style={{ background: theme.primary }}
              title="Salón Oficial Verificado en Google"
            >
              <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </div>

          {/* Nombre del Salón */}
          <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 leading-tight">
            {nombreSalon}
          </h1>

          {/* TRUST PILLS COMPACTAS (Inspiradas en /soluciones) */}
          <div className="mt-2 flex items-center justify-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-slate-200/90 text-[10px] font-black text-slate-800 shadow-2xs">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>Google 5 Estrellas</span>
            </span>
            <span
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border shadow-2xs"
              style={{
                backgroundColor: theme.badgeBg,
                color: theme.badgeText,
                borderColor: theme.borderSoft,
              }}
            >
              <Sparkles className="w-3 h-3" />
              <span>Beneficio Garantizado</span>
            </span>
          </div>

          {/* STEPPER VISUAL SEGMENTADO TIPO INSTAGRAM STORIES CON GLOW */}
          <div className="w-full flex items-center justify-center gap-1.5 mt-3.5 px-3">
            {[1, 2, 3].map((stepNumber) => (
              <div
                key={stepNumber}
                className="h-1.5 flex-1 rounded-full transition-all duration-300"
                style={{
                  backgroundColor:
                    step >= stepNumber ? theme.primary : 'rgba(0,0,0,0.08)',
                  boxShadow: step === stepNumber ? `0 0 10px ${theme.primary}80` : 'none',
                  opacity: step === stepNumber ? 1 : step > stepNumber ? 0.75 : 0.35,
                }}
              />
            ))}
          </div>
        </header>

        {/* ── 3. CUERPO PRINCIPAL DEL FLUJO ── */}
        <main className="w-full flex-1 flex flex-col justify-start pt-1 pb-3">
          <AnimatePresence mode="wait">
            {/* ══════════════════════════════════════════
                PASO 1: SELECCIÓN BENTO DE CATEGORÍA
            ══════════════════════════════════════════ */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                {/* HERO CARD BLACK VIP / FREEMIUM (Estilo /soluciones) */}
                <div
                  className="w-full rounded-2xl p-4 text-white shadow-xl relative overflow-hidden border border-white/10"
                  style={{ background: theme.gradientCard }}
                >
                  {/* Glow decorativo interior */}
                  <div
                    className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl opacity-40 pointer-events-none"
                    style={{ background: theme.primary }}
                  />

                  <div className="flex items-center justify-between gap-2 mb-1.5 relative z-10">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-white text-[9.5px] font-black uppercase tracking-wider backdrop-blur-xs border border-white/15">
                      <Sparkles size={11} className="text-amber-400 fill-amber-400" />
                      <span>Recompensa Exclusiva</span>
                    </span>
                    <span className="text-xl">🎁</span>
                  </div>

                  <h2 className="text-sm font-black text-white leading-snug relative z-10">
                    ¿Qué te atendiste hoy con nosotras?
                  </h2>
                  <p className="text-[11px] text-slate-300 font-medium leading-tight mt-0.5 relative z-10">
                    Toca tu servicio para elegir tu premio especial de agradecimiento por tu reseña.
                  </p>
                </div>

                {/* LISTA BENTO DE CATEGORÍAS TÁCTILES */}
                <div className="grid grid-cols-1 gap-2 w-full">
                  {CATEGORIAS_PREDEFINIDAS.map((cat, idx) => (
                    <motion.button
                      key={cat.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectCategoria(cat.id)}
                      className="w-full p-3 rounded-2xl bg-white border shadow-2xs hover:shadow-md transition-all flex items-center justify-between text-left group cursor-pointer"
                      style={{
                        borderColor: theme.borderSoft,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-10 h-10 rounded-xl text-xl flex items-center justify-center shrink-0 shadow-2xs transition-transform group-hover:scale-105"
                          style={{ backgroundColor: theme.badgeBg }}
                        >
                          {cat.emoji}
                        </span>
                        <div className="min-w-0">
                          <h3 className="text-xs font-black text-slate-900 group-hover:text-pink-600 transition-colors leading-tight">
                            {cat.label}
                          </h3>
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                            Premios y descuentos para tu próxima cita
                          </p>
                        </div>
                      </div>

                      <div
                        className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:translate-x-0.5"
                        style={{
                          backgroundColor: theme.badgeBg,
                          color: theme.primary,
                        }}
                      >
                        <ChevronRight size={15} />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════
                PASO 2: SELECCIÓN DEL PREMIO (BENTO CARDS)
            ══════════════════════════════════════════ */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <button
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1 text-[11px] font-black text-slate-600 hover:text-slate-900 transition-colors py-1"
                  >
                    <ArrowLeft size={13} /> Volver
                  </button>
                  <span
                    className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-2xs"
                    style={{
                      backgroundColor: theme.badgeBg,
                      color: theme.badgeText,
                      borderColor: theme.borderSoft,
                    }}
                  >
                    Servicio: {selectedCategoria}
                  </span>
                </div>

                <div className="text-center mb-1">
                  <h2 className="text-sm font-black text-slate-900">
                    Elige el beneficio que más te guste
                  </h2>
                  <p className="text-[10.5px] text-slate-500">
                    Se activará automáticamente al dejar tus 5 estrellas ⭐
                  </p>
                </div>

                {/* LISTA DE CUPONES & VALES DE ORO HIPER-DOPAMÍNICOS (SVG + HTML + CSS) */}
                <div className="space-y-3.5">
                  {premiosCategoria.length === 0 ? (
                    <div className="p-8 bg-white rounded-2xl text-center text-slate-400 text-xs border border-slate-200">
                      No hay promociones activas en esta categoría por ahora.
                    </div>
                  ) : (
                    premiosCategoria.map((premio) => {
                      const tipo = premio.tipo_recompensa || 'porcentaje';
                      const valor = premio.valor_recompensa || (tipo === 'porcentaje' ? '20%' : tipo === 'monto_fijo' ? 'S/ 20' : 'GIFT');
                      
                      // Determinar estilo dopamínico según el tipo de recompensa
                      const isGoldDiscount = tipo === 'porcentaje';
                      const isMoneyCash = tipo === 'monto_fijo';
                      const isGiftSpecial = tipo === 'regalo';
                      const isVipDiamond = tipo === 'especial';

                      return (
                        <motion.div
                          key={premio.id}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleSelectPremio(premio)}
                          className="relative cursor-pointer group select-none transition-all duration-300 filter drop-shadow-md hover:drop-shadow-xl"
                        >
                          {/* ── CONTENEDOR TIPO TICKET CON MUESCAS LATERALES (SVG TICKET EFFECT) ── */}
                          <div className={`relative rounded-3xl overflow-hidden border transition-all ${
                            isGoldDiscount 
                              ? 'bg-gradient-to-br from-[#fffdf5] via-[#fffbf0] to-[#fff4db] border-amber-300/80' 
                              : isMoneyCash
                              ? 'bg-gradient-to-br from-[#f2fcf6] via-[#e6f9ed] to-[#d1fae5] border-emerald-300/80'
                              : isGiftSpecial
                              ? 'bg-gradient-to-br from-[#fff5f8] via-[#ffe4ee] to-[#fce7f3] border-pink-300/80'
                              : 'bg-gradient-to-br from-[#1c1924] via-[#121118] to-[#0c0a10] border-amber-400/40 text-white'
                          }`}>
                            
                            {/* Muescas Circulares de Ticket Perforado (Izquierda y Derecha) */}
                            <div className="absolute top-1/2 -left-3 -translate-y-1/2 w-6 h-6 rounded-full bg-[#f8fafc] border-r border-slate-300/60 shadow-inner z-20 pointer-events-none" />
                            <div className="absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 rounded-full bg-[#f8fafc] border-l border-slate-300/60 shadow-inner z-20 pointer-events-none" />

                            {/* Brillo reflectante animado al hacer hover */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none z-10" />

                            {/* ── CUERPO DEL CUPÓN EN 2 SECCIONES (STUB IZQUIERDO + DETALLE DERECHO) ── */}
                            <div className="flex items-stretch min-h-[96px]">
                              
                              {/* SECCIÓN 1: STUB / VALOR EN GIGANTE (Con insignia SVG y degradado Glow) */}
                              <div className={`w-[108px] sm:w-[120px] p-2.5 flex flex-col items-center justify-center text-center relative border-r border-dashed ${
                                isGoldDiscount 
                                  ? 'bg-gradient-to-b from-amber-400 via-amber-500 to-yellow-600 text-slate-950 border-amber-600/40' 
                                  : isMoneyCash
                                  ? 'bg-gradient-to-b from-emerald-500 via-teal-600 to-emerald-700 text-white border-emerald-700/40'
                                  : isGiftSpecial
                                  ? 'bg-gradient-to-b from-rose-500 via-pink-500 to-rose-600 text-white border-rose-700/40'
                                  : 'bg-gradient-to-b from-amber-300 via-amber-500 to-amber-600 text-slate-950 border-white/20'
                              }`}>
                                
                                {/* Insignia Icono */}
                                <div className="mb-0.5">
                                  {isGoldDiscount && <Sparkles size={16} className="fill-slate-950 stroke-slate-950 animate-pulse" />}
                                  {isMoneyCash && <Tag size={16} className="fill-white stroke-white" />}
                                  {isGiftSpecial && <Gift size={16} className="fill-white stroke-white animate-bounce" />}
                                  {isVipDiamond && <Award size={16} className="fill-slate-950 stroke-slate-950" />}
                                </div>

                                {/* Valor Alfanumérico Gigante */}
                                <span className="font-mono font-black text-xl sm:text-2xl tracking-tighter leading-none drop-shadow-xs">
                                  {valor}
                                </span>

                                {/* Nombres de Alta Dopamina para el Rubro Belleza */}
                                <span className="text-[8.5px] font-black uppercase tracking-wider opacity-95 mt-1 bg-black/10 dark:bg-white/20 px-1.5 py-0.5 rounded-full">
                                  {isGoldDiscount 
                                    ? 'GLOW PASS' 
                                    : isMoneyCash 
                                    ? 'BEAUTY CASH' 
                                    : isGiftSpecial 
                                    ? 'REGALO VIP' 
                                    : 'DIAMOND PASS'}
                                </span>
                              </div>

                              {/* SECCIÓN 2: INFORMACIÓN & BENEFICIO */}
                              <div className="flex-1 p-3 sm:p-3.5 flex flex-col justify-between pl-4 pr-4">
                                <div>
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <span className={`inline-flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                      isGoldDiscount
                                        ? 'bg-amber-100/80 text-amber-900 border-amber-300/80'
                                        : isMoneyCash
                                        ? 'bg-emerald-100/80 text-emerald-900 border-emerald-300/80'
                                        : isGiftSpecial
                                        ? 'bg-pink-100/80 text-pink-900 border-pink-300/80'
                                        : 'bg-white/10 text-amber-300 border-white/15'
                                    }`}>
                                      {selectedCategoria}
                                    </span>

                                    <span className={`text-[10px] font-black flex items-center gap-0.5 ${
                                      isVipDiamond ? 'text-amber-300' : 'text-slate-600'
                                    }`}>
                                      <Clock size={11} className="text-amber-500" />
                                      <span>{premio.dias_validez || 30}d</span>
                                    </span>
                                  </div>

                                  {/* Título del Cupón */}
                                  <h3 className={`text-xs sm:text-[13px] font-black leading-snug ${
                                    isVipDiamond ? 'text-white' : 'text-slate-900 group-hover:text-pink-600'
                                  }`}>
                                    {premio.titulo_premio}
                                  </h3>
                                </div>

                                {/* Botón / Call To Action Táctil */}
                                <div className="mt-2 pt-1.5 border-t border-slate-200/50 dark:border-white/10 flex items-center justify-between">
                                  <span className={`text-[10px] font-extrabold flex items-center gap-1 ${
                                    isGoldDiscount
                                      ? 'text-amber-700'
                                      : isMoneyCash
                                      ? 'text-emerald-700'
                                      : isGiftSpecial
                                      ? 'text-rose-700'
                                      : 'text-amber-400'
                                  }`}>
                                    ★ Toca para Desbloquear
                                  </span>

                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all group-hover:translate-x-0.5 shadow-2xs ${
                                    isGoldDiscount
                                      ? 'bg-amber-500 text-slate-950'
                                      : isMoneyCash
                                      ? 'bg-emerald-600 text-white'
                                      : isGiftSpecial
                                      ? 'bg-rose-500 text-white'
                                      : 'bg-amber-400 text-slate-950'
                                  }`}>
                                    <ChevronRight size={14} className="stroke-[3]" />
                                  </div>
                                </div>

                              </div>
                            </div>

                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════
                PASO 3: FORMULARIO Y CANALIZACIÓN A GOOGLE
            ══════════════════════════════════════════ */}
            {step === 3 && selectedPremio && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <button
                    onClick={() => setStep(2)}
                    className="flex items-center gap-1 text-[11px] font-black text-slate-600 hover:text-slate-900 transition-colors py-1"
                  >
                    <ArrowLeft size={13} /> Cambiar premio
                  </button>
                  <span
                    className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-2xs"
                    style={{
                      backgroundColor: theme.badgeBg,
                      color: theme.badgeText,
                      borderColor: theme.borderSoft,
                    }}
                  >
                    Paso Final
                  </span>
                </div>

                {/* CARD RESUMEN VIP DEL PREMIO */}
                <div
                  className="p-3.5 rounded-2xl text-white shadow-md text-center relative overflow-hidden"
                  style={{ background: theme.gradient }}
                >
                  <span className="text-[9.5px] uppercase font-black tracking-widest opacity-85 block">
                    Beneficio Seleccionado
                  </span>
                  <h3 className="text-sm font-black mt-0.5">{selectedPremio.titulo_premio}</h3>
                </div>

                {/* FORMULARIO BENTO CLEAN */}
                <form
                  onSubmit={handleUnlockCoupon}
                  className="p-4 rounded-2xl bg-white border shadow-md space-y-3"
                  style={{ borderColor: theme.borderSoft }}
                >
                  <div className="text-center space-y-0.5 mb-1.5">
                    <h4 className="text-xs sm:text-[13px] font-black text-slate-900">
                      ¿A qué WhatsApp respaldamos tu cupón?
                    </h4>
                    <p className="text-[10.5px] text-slate-500">
                      Lo guardaremos para cuando vengas a tu próxima cita
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-700 mb-1">
                      Nombre y Apellido
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Valeria Torres"
                      value={clienteNombre}
                      onChange={(e) => setClienteNombre(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': theme.primary } as any}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-700 mb-1">
                      Número de WhatsApp
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Ej: 999 888 777"
                      value={clienteTelefono}
                      onChange={(e) => setClienteTelefono(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': theme.primary } as any}
                    />
                  </div>

                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3 px-3 rounded-xl text-white font-black text-xs shadow-md hover:opacity-95 transition-opacity flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
                      style={{
                        background: theme.gradient,
                        boxShadow: theme.ringGlow,
                      }}
                    >
                      <Star size={14} className="fill-amber-300 text-amber-300" />
                      <span>{submitting ? 'Generando cupón...' : 'Calificar en Google & Desbloquear'}</span>
                    </button>
                    <p className="text-[9.5px] text-center text-slate-400 mt-1.5 font-medium">
                      🔒 Abrirá la ficha oficial de Google Maps para tu calificación de 5 estrellas.
                    </p>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════
                PASO 4: CUPÓN DESBLOQUEADO (TICKET VIP)
            ══════════════════════════════════════════ */}
            {step === 4 && activeCoupon && (
              <motion.div
                key="step4"
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="space-y-3"
              >
                {/* TARJETA TICKET GOLD VIP */}
                <div
                  className="rounded-3xl bg-white border shadow-xl overflow-hidden p-5 text-center space-y-3 relative"
                  style={{ borderColor: theme.borderSoft }}
                >
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-200 shadow-2xs">
                    <CheckCircle2 size={12} className="text-emerald-600" />
                    <span>¡BENEFICIO DESBLOQUEADO!</span>
                  </div>

                  <div>
                    <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest block">
                      Recompensa exclusiva
                    </span>
                    <h3
                      className="text-base font-black mt-0.5 leading-tight"
                      style={{ color: theme.primary }}
                    >
                      {activeCoupon.titulo_beneficio}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Para: <span className="font-bold text-slate-800">{activeCoupon.cliente_nombre}</span>
                    </p>
                  </div>

                  {/* CÓDIGO ÚNICO DE CANJE */}
                  <div
                    className="p-3 rounded-2xl border inline-block w-full"
                    style={{
                      backgroundColor: theme.badgeBg,
                      borderColor: theme.borderSoft,
                    }}
                  >
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">
                      CÓDIGO ÚNICO DE CANJE
                    </span>
                    <div className="text-xl font-mono font-black tracking-widest text-slate-900">
                      {activeCoupon.codigo}
                    </div>
                    <button
                      onClick={handleCopyCode}
                      className="mt-1 text-[11px] font-black inline-flex items-center gap-1 transition-opacity hover:opacity-80 cursor-pointer"
                      style={{ color: theme.primary }}
                    >
                      {copiedCode ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedCode ? '¡Copiado!' : 'Copiar código'}</span>
                    </button>
                  </div>

                  {/* FECHA DE VALIDEZ */}
                  <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1 font-medium">
                    <Clock size={12} className="text-amber-500" />
                    <span>Válido hasta el <b>{new Date(activeCoupon.expira_en).toLocaleDateString()}</b></span>
                  </div>

                  {/* ACCIONES DE RESPALDO Y CAPTURA */}
                  <div className="space-y-2 pt-1">
                    {/* Botón WhatsApp Directo al Salón */}
                    <button
                      onClick={handleShareWhatsApp}
                      className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
                    >
                      <Smartphone size={15} />
                      <span>{salonData.negocio.telefono ? `Enviar a WhatsApp de ${salonData.negocio.nombre}` : 'Guardar mi cupón en WhatsApp'}</span>
                    </button>

                    {/* SUGERENCIA RÁPIDA: CAPTURA DE PANTALLA */}
                    <div className="p-2.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-center gap-2.5 text-left text-amber-950">
                      <div className="w-8 h-8 rounded-xl bg-amber-200/70 flex items-center justify-center shrink-0 text-amber-800">
                        <Camera size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[11px] font-black block leading-tight">
                          📸 Tip rápido: Toma una captura
                        </span>
                        <p className="text-[10px] text-amber-800/90 leading-tight mt-0.5">
                          Guárdala en tu galería y muéstrala en caja en tu próxima cita.
                        </p>
                      </div>
                    </div>

                    {salonData.config.google_review_url && (
                      <a
                        href={salonData.config.google_review_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-[11px] transition-colors flex items-center justify-center gap-1.5 border border-slate-200"
                      >
                        <ExternalLink size={12} />
                        <span>Ver o Editar mi Reseña en Google</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* INSTRUCCIÓN DE CANJE SENCILLA */}
                <div
                  className="p-3 rounded-2xl bg-white border text-center text-[10.5px] text-slate-500 space-y-0.5 shadow-2xs"
                  style={{ borderColor: theme.borderSoft }}
                >
                  <p className="font-black text-slate-800">¿Cómo lo canjeo?</p>
                  <p>Muestra tu código o captura de pantalla al pagar tu cuenta en recepción.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* ── 4. FOOTER LIMPIO ── */}
      <footer className="w-full max-w-sm mx-auto py-1 text-center relative z-10">
        <span className="text-[10px] text-slate-400 font-medium">
          Powered by <b style={{ color: theme.primary }}>Nilah</b> • Korat Flow Agency
        </span>
      </footer>
    </div>
  );
};

export default PublicReviewFlow;

