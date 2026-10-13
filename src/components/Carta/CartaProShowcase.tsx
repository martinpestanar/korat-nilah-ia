import React from 'react';
import { motion } from 'framer-motion';
import { 
  Check, X, Sparkles, Crown, Zap, Flame, CalendarCheck, 
  Palette, Eye, ArrowRight, ShieldCheck, HeartHandshake, PhoneCall
} from 'lucide-react';

interface Props {
  isPro: boolean;
  onSelectTab: (tab: any) => void;
  salonNombre?: string;
}

export const CartaProShowcase: React.FC<Props> = ({ isPro, onSelectTab, salonNombre = 'Tu Salón' }) => {
  const whatsappUrl = `https://wa.me/51921389771?text=${encodeURIComponent(
    `¡Hola Martín! Quiero activar la Vitrina Digital PRO (Agendamiento Directo + Banners FOMO + Marca Blanca) para mi salón: ${salonNombre}`
  )}`;

  const features = [
    {
      titulo: 'Catálogo de Servicios y Precios',
      free: 'Ilimitado con fotos y categorías',
      pro: 'Ilimitado con fotos y categorías',
      desc: 'Tus clientas navegan tus servicios por categorías en el smartphone.',
      freeOk: true,
      proOk: true,
    },
    {
      titulo: 'Botón de Reserva por WhatsApp',
      free: 'Abre chat con mensaje pre-armado',
      pro: 'Abre chat con mensaje pre-armado',
      desc: 'Deriva a las clientas directo a tu WhatsApp con el servicio seleccionado.',
      freeOk: true,
      proOk: true,
    },
    {
      titulo: 'Promociones del Mes y Ofertas',
      free: 'Promo del Mes + Oferta Semanal',
      pro: 'Promo del Mes + Oferta Semanal',
      desc: 'Banners estáticos para destacar tus mejores paquetes.',
      freeOk: true,
      proOk: true,
    },
    {
      titulo: 'Agendamiento Directo Online (Self-Booking)',
      free: 'No disponible (Solo chat manual)',
      pro: '100% Automático en tu Agenda',
      desc: 'La clienta escoge fecha y hora disponible. La cita entra directo a tu calendario sin que respondas chats.',
      freeOk: false,
      proOk: true,
      highlight: true,
    },
    {
      titulo: 'Banners Flash Sales con Cuenta Regresiva (FOMO)',
      free: 'No disponible',
      pro: 'Cronómetro en vivo y cupos limitados',
      desc: 'Crea urgencia en días lentos con ofertas relámpago con barra de cupos restantes.',
      freeOk: false,
      proOk: true,
      highlight: true,
    },
    {
      titulo: 'Slider Interactivo Antes / Después',
      free: '1 resultado de muestra',
      pro: 'Ilimitado en todos los servicios',
      desc: 'Comparador deslizable de fotos que demuestra tus cambios de look y multiplica las ventas.',
      freeOk: false,
      proOk: true,
      highlight: true,
    },
    {
      titulo: 'Marca Blanca (Branding 100% Tuyo)',
      free: 'Incluye badge "Creado con Korat Flow"',
      pro: 'Cero menciones de terceros + Paletas PRO',
      desc: 'Tu salón se ve como una marca boutique de lujo totalmente independiente.',
      freeOk: false,
      proOk: true,
      highlight: true,
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-8">
      {/* ── Banner Principal Mobile First ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 via-purple-950 to-neutral-900 text-white p-6 sm:p-8 border border-purple-500/30 shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-56 h-56 rounded-full bg-rose-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-300 text-xs font-black uppercase tracking-wider">
            <Sparkles size={13} className="text-purple-300" />
            <span>Modelo Freemium · Vitrina Digital</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              ¿Qué incluye la versión <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">Free vs. PRO</span>?
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-2xl">
              Tu salón puede empezar gratis para siempre con su catálogo público. Cuando quieras que las clientas se agenden solas o lanzar ofertas relámpago, activas las funciones PRO.
            </p>
          </div>

          {/* Estado actual del negocio */}
          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
            <span className="font-semibold text-gray-400">Tu cuenta actual:</span>
            {isPro ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                <Crown size={13} /> Plan PRO Activo (Acceso Total)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                ⚡ Versión Estándar (Freemium)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Las 4 Armas de Venta de la Versión PRO (Tarjetas Visuales) ── */}
      <div>
        <h2 className="text-sm font-black uppercase tracking-wider text-gray-400 mb-3 px-1">
          Las 4 Superpotencias de la Versión PRO
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Card 1: Agendamiento */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-white/5 border border-purple-200/70 dark:border-white/10 shadow-sm space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-300 flex items-center justify-center font-bold text-lg">
              📅
            </div>
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
              Agendamiento Directo (Self-Booking)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Tus clientas eligen servicio, día y hora disponible directamente en su celular. La cita queda registrada en tu calendario sin pérdida de tiempo en WhatsApp.
            </p>
            <div className="pt-1 flex items-center gap-1 text-[11px] font-bold text-purple-600 dark:text-purple-400">
              <Zap size={13} /> Ahorra 2 horas al día en responder mensajes
            </div>
          </div>

          {/* Card 2: Banners FOMO */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-white/5 border border-amber-200/70 dark:border-white/10 shadow-sm space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-300 flex items-center justify-center font-bold text-lg">
              🔥
            </div>
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
              Banners Flash con Reloj Regresivo
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Lanza ofertas relámpago con cronómetro en cuenta regresiva y contador de cupos restantes. Ideal para llenar martes y miércoles de baja afluencia.
            </p>
            <div className="pt-1 flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
              <Flame size={13} /> Dispara compras impulsivas de última hora
            </div>
          </div>

          {/* Card 3: Antes / Después */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-white/5 border border-rose-200/70 dark:border-white/10 shadow-sm space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-300 flex items-center justify-center font-bold text-lg">
              ✨
            </div>
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
              Slider Interactivo Antes / Después
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              La clienta desliza con el dedo para comparar la transformación real (Lash lifting, Balayage, Uñas esculpidas). Convence visualmente al instante.
            </p>
            <div className="pt-1 flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
              <Eye size={13} /> Multiplica la confianza en servicios de alto ticket
            </div>
          </div>

          {/* Card 4: Marca Blanca */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-white/5 border border-emerald-200/70 dark:border-white/10 shadow-sm space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-bold text-lg">
              💎
            </div>
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
              Branding Boutique (Marca Blanca)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Oculta el footer de la plataforma y personaliza los colores con paletas de alta gama. Tu salón proyecta exclusividad y nivel internacional.
            </p>
            <div className="pt-1 flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck size={13} /> Percepción de marca 100% propia
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabla Comparativa Detallada ── */}
      <div className="rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.02]">
          <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
            Comparativa Frente a Frente
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Descubre todo lo que puedes desbloquear en la Vitrina de tu salón.
          </p>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-white/10">
          {features.map((f, i) => (
            <div key={i} className={`p-4 transition-colors ${f.highlight ? 'bg-purple-500/[0.02] dark:bg-purple-500/[0.04]' : ''}`}>
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <p className="text-xs font-bold text-gray-900 dark:text-white">
                  {f.titulo}
                </p>
                {f.highlight && (
                  <span className="text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 px-2 py-0.5 rounded-full shrink-0">
                    Pro
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed mb-2.5">
                {f.desc}
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Free Column */}
                <div className="p-2 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 flex items-center gap-2">
                  {f.freeOk ? (
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 flex items-center justify-center text-[10px] shrink-0 font-bold">✓</span>
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 dark:bg-white/10 dark:text-gray-400 flex items-center justify-center text-[10px] shrink-0 font-bold">✕</span>
                  )}
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">Free</span>
                    <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300 truncate block">{f.free}</span>
                  </div>
                </div>

                {/* Pro Column */}
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200/60 dark:border-purple-800/40 flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] shrink-0 font-bold">✓</span>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 block uppercase tracking-wider">PRO</span>
                    <span className="text-[11px] font-bold text-purple-900 dark:text-purple-200 truncate block">{f.pro}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Call To Action / Activación ── */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-950 to-neutral-900 text-white text-center space-y-4 shadow-xl border border-purple-500/30">
        <div className="max-w-md mx-auto space-y-1.5">
          <p className="text-base font-black tracking-tight">
            ¿Quieres activar estas funciones en tu salón?
          </p>
          <p className="text-xs text-purple-200/80 leading-relaxed">
            Puedes solicitar la activación de las funciones PRO directamente por WhatsApp o gestionarlo con tu asesor.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95 flex items-center justify-center gap-2"
          >
            <PhoneCall size={14} />
            <span>Hablar por WhatsApp para Activar PRO</span>
          </a>

          <button
            onClick={() => onSelectTab('servicios')}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Volver a Gestionar Mis Servicios</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartaProShowcase;
