/**
 * DestellosShop — Tienda de Destellos ✨
 * ══════════════════════════════════════
 * Módulo premium para recargar créditos (Destellos) en Nilah IA.
 * - Muestra balance actual y plan del usuario
 * - Info de recarga automática mensual por plan
 * - Packs adicionales con precio en Soles
 * - Flow de compra: selección → instrucciones Yape → WhatsApp con captura
 *
 * Pago: Yape a 984 822 890 — Martín Pestaña
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Zap, Crown, Star, RefreshCw, MessageCircle,
  ShieldCheck, ArrowRight, Check, X, Info, ChevronRight,
  Gift, CreditCard
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// ─── Configuración de planes ───────────────────────────────────────────────

interface PlanInfo {
  id: string;
  name: string;
  monthlyDestellos: number;
  icon: string;
  color: string;
  gradient: string;
  border: string;
  badge: string;
}

const PLAN_CONFIG: Record<string, PlanInfo> = {
  'Glow Pro': {
    id: 'glow_pro',
    name: 'Glow Pro',
    monthlyDestellos: 200,
    icon: '⚡',
    color: 'text-violet-400',
    gradient: 'from-violet-500/20 to-purple-500/20',
    border: 'border-violet-500/40',
    badge: 'bg-violet-500/20 text-violet-300',
  },
  'Glow Elite': {
    id: 'glow_elite',
    name: 'Glow Elite',
    monthlyDestellos: 1000,
    icon: '👑',
    color: 'text-amber-400',
    gradient: 'from-amber-500/20 to-orange-500/20',
    border: 'border-amber-500/40',
    badge: 'bg-amber-500/20 text-amber-300',
  },
  'Pro': {
    id: 'glow_pro',
    name: 'Glow Pro',
    monthlyDestellos: 200,
    icon: '⚡',
    color: 'text-violet-400',
    gradient: 'from-violet-500/20 to-purple-500/20',
    border: 'border-violet-500/40',
    badge: 'bg-violet-500/20 text-violet-300',
  },
  'Copilot': {
    id: 'glow_elite',
    name: 'Glow Elite',
    monthlyDestellos: 1000,
    icon: '👑',
    color: 'text-amber-400',
    gradient: 'from-amber-500/20 to-orange-500/20',
    border: 'border-amber-500/40',
    badge: 'bg-amber-500/20 text-amber-300',
  },
};

// ─── Packs a la venta ──────────────────────────────────────────────────────

interface CreditPack {
  id: string;
  name: string;
  destellos: number;
  bonus?: number;
  price: number;
  images: number;
  badge?: string;
  popular?: boolean;
  emoji: string;
  colorClass: string;
  borderSelected: string;
  btnClass: string;
  waMsg: string;
}

const PACKS: CreditPack[] = [
  {
    id: 'mini',
    name: 'Destello Mini',
    destellos: 100,
    price: 14,
    images: 4,
    emoji: '⚡',
    colorClass: 'from-indigo-500/15 via-violet-500/10 to-transparent',
    borderSelected: 'border-violet-400/60',
    btnClass: 'from-violet-600 to-indigo-600 shadow-violet-500/30',
    waMsg: 'Hola! Quiero activar el Pack Destello Mini: 100 Destellos por S/ 14. Te envío el comprobante de Yape adjunto. 🙏',
  },
  {
    id: 'glow',
    name: 'Destello Glow',
    destellos: 500,
    bonus: 50,
    price: 39,
    images: 22,
    badge: '⚡ Más elegido',
    popular: true,
    emoji: '✨',
    colorClass: 'from-fuchsia-500/20 via-pink-500/10 to-transparent',
    borderSelected: 'border-fuchsia-400/60',
    btnClass: 'from-fuchsia-600 to-pink-600 shadow-fuchsia-500/30',
    waMsg: 'Hola! Quiero activar el Pack Destello Glow: 550 Destellos (500 + 50 bonus) por S/ 39. Te envío el comprobante de Yape adjunto. 🙏',
  },
  {
    id: 'luxe',
    name: 'Destello Luxe',
    destellos: 1200,
    bonus: 200,
    price: 79,
    images: 56,
    badge: '🔥 Mejor valor',
    emoji: '🔥',
    colorClass: 'from-amber-500/15 via-orange-500/10 to-transparent',
    borderSelected: 'border-amber-400/60',
    btnClass: 'from-amber-500 to-orange-500 shadow-amber-500/30',
    waMsg: 'Hola! Quiero activar el Pack Destello Luxe: 1400 Destellos (1200 + 200 bonus) por S/ 79. Te envío el comprobante de Yape adjunto. 🔥',
  },
];

// ─── WhatsApp / Yape info ───────────────────────────────────────────────────

const YAPE_NUMBER = '981482289';
const YAPE_TITULAR = 'Martín Pestaña';
const WA_NUMBER = '51981482289';

// ─── Componente Principal ──────────────────────────────────────────────────

export const DestellosShop: React.FC = () => {
  const { user, destellosUsuario, refreshDestellos } = useAuth();
  const [selectedPack, setSelectedPack] = useState<string>('glow');
  const [step, setStep] = useState<'shop' | 'payment' | 'success'>('shop');
  const [packChosen, setPackChosen] = useState<CreditPack | null>(null);

  const plan = user?.plan || 'Glow';
  const planInfo = PLAN_CONFIG[plan];

  const handleBuyPack = (pack: CreditPack) => {
    setPackChosen(pack);
    setSelectedPack(pack.id);
    setStep('payment');
  };

  const handleWhatsApp = () => {
    if (!packChosen) return;
    const msg = encodeURIComponent(packChosen.waMsg);
    window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank');
    setStep('success');
  };

  const handleReset = () => {
    setStep('shop');
    setPackChosen(null);
    setSelectedPack('glow');
    refreshDestellos();
  };

  return (
    <div className="flex flex-col min-h-full bg-bg-base overflow-y-auto custom-scrollbar">

      {/* ─── HERO HEADER ─── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-500/5 via-transparent to-amber-500/5 dark:from-[#0d1220] dark:via-[#100d20] dark:to-[#0d1220] border-b border-border-subtle dark:border-white/5 px-5 pt-8 pb-7">
        {/* Orbs de fondo */}
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-10 left-1/3 w-56 h-56 bg-pink-600/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-24 bg-fuchsia-600/8 rounded-full blur-2xl pointer-events-none" />

        <div className="relative max-w-2xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 dark:bg-yellow-500/10 border border-amber-500/20 dark:border-yellow-500/25 mb-4"
          >
            <Sparkles size={12} className="text-amber-600 dark:text-yellow-400" />
            <span className="text-xs font-bold text-amber-800 dark:text-yellow-200">Centro de Destellos ✨</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-3xl font-black text-text-primary leading-tight mb-2"
          >
            Recarga tus{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 dark:from-violet-400 dark:via-fuchsia-400 dark:to-pink-400">
              Destellos ✨
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm text-text-secondary leading-relaxed max-w-md"
          >
            Cada Destello es combustible creativo para tu salón. Genera imágenes,
            flyers y contenido que convierte —sin fricción.
          </motion.p>

          {/* Balance pill */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="mt-5 inline-flex items-center gap-3 bg-bg-surface dark:bg-white/5 border border-border-strong dark:border-white/10 rounded-2xl px-5 py-3 shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <p className="text-[11px] text-text-muted font-black uppercase tracking-widest">Tu saldo actual</p>
              <p className="text-2xl font-black text-text-primary leading-none">
                {destellosUsuario ?? 0}
                <span className="text-sm text-amber-600 dark:text-yellow-400 font-bold ml-1">Destellos</span>
              </p>
            </div>
            <div className="ml-2 flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
              <Zap size={10} />
              {Math.floor((destellosUsuario ?? 0) / 25)} imágenes
            </div>
          </motion.div>
        </div>
      </div>

      <div className="flex flex-col gap-6 px-4 py-6 max-w-2xl mx-auto w-full">

        {/* ─── PLAN INFO CARD ─── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`relative rounded-2xl border bg-gradient-to-br ${
            planInfo 
              ? `${planInfo.gradient} ${planInfo.border}` 
              : 'from-gray-500/5 to-transparent border-border-subtle'
          } p-5 overflow-hidden shadow-sm`}
        >
          <div className="absolute top-0 right-0 w-32 h-32 opacity-5 dark:opacity-10">
            <Star size={128} />
          </div>

          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
              planInfo ? `bg-gradient-to-br ${planInfo.gradient}` : 'bg-gray-500/10'
            } border ${planInfo?.border || 'border-border-subtle'}`}>
              {planInfo?.icon || '🌟'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-base font-black text-text-primary">
                  Plan {planInfo?.name || plan}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  planInfo?.badge || 'bg-gray-100 dark:bg-gray-500/20 text-text-muted border-border-subtle'
                }`}>
                  {planInfo ? 'Activo' : 'Básico'}
                </span>
              </div>

              {planInfo ? (
                <div className="flex items-center gap-2">
                  <RefreshCw size={12} className={planInfo.color} />
                  <p className="text-sm text-text-secondary">
                    <span className="font-black text-text-primary">{planInfo.monthlyDestellos} Destellos</span>
                    {' '}se recargan automáticamente cada mes
                  </p>
                </div>
              ) : (
                <p className="text-sm text-text-muted">
                  Tu plan no incluye recarga mensual automática.{' '}
                  <span className="text-violet-600 dark:text-violet-400 font-bold">Considera mejorar tu plan.</span>
                </p>
              )}

              {planInfo && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 text-text-muted text-[11px] bg-bg-surface dark:bg-white/5 px-2 py-1 rounded-lg">
                    <ShieldCheck size={11} className="text-emerald-500 dark:text-emerald-400" />
                    Recarga sin acción requerida
                  </div>
                  <div className="flex items-center gap-1.5 text-text-muted text-[11px] bg-bg-surface dark:bg-white/5 px-2 py-1 rounded-lg">
                    <Gift size={11} className="text-pink-500 dark:text-pink-400" />
                    Los destellos no vencen
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Comparativa planes */}
          {!planInfo && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {[
                { plan: 'Glow Pro', destellos: 200, icon: '⚡', color: 'violet' },
                { plan: 'Glow Elite', destellos: 1000, icon: '👑', color: 'amber' },
              ].map(p => (
                <div key={p.plan} className={`bg-${p.color}-500/10 border border-${p.color}-500/20 rounded-xl p-3 text-center`}>
                  <div className="text-xl mb-1">{p.icon}</div>
                  <p className={`text-xs font-bold text-${p.color}-600 dark:text-${p.color}-300`}>{p.plan}</p>
                  <p className="text-sm font-black text-text-primary mt-0.5">{p.destellos}/mes</p>
                  <p className="text-[10px] text-text-muted">automáticos</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ─── CÓMO FUNCIONA ─── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-bg-surface dark:bg-white/3 border border-border-subtle dark:border-white/8 rounded-2xl p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-3">
            <Info size={13} className="text-sky-500 dark:text-sky-400" />
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">
              ¿Cómo funcionan los Destellos?
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: '✨', label: '25 Destellos', sub: 'por imagen generada' },
              { icon: '🔄', label: 'Auto-recarga', sub: 'según tu plan cada mes' },
              { icon: '♾️', label: 'Sin vencimiento', sub: 'acumulas para siempre' },
            ].map((item, i) => (
              <div key={i} className="text-center bg-bg-base dark:bg-white/3 rounded-xl p-3 border border-border-subtle dark:border-transparent">
                <div className="text-xl mb-1">{item.icon}</div>
                <p className="text-xs font-black text-text-primary leading-tight">{item.label}</p>
                <p className="text-[10px] text-text-muted mt-0.5">{item.sub}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ─── PACKS ─── */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="flex items-center gap-2 mb-3"
          >
            <Zap size={14} className="text-fuchsia-500 dark:text-fuchsia-400" />
            <h2 className="text-sm font-black text-text-primary uppercase tracking-widest">
              Packs adicionales
            </h2>
          </motion.div>

          <div className="space-y-3">
            {PACKS.map((pack, idx) => {
              const total = pack.destellos + (pack.bonus ?? 0);
              const isSelected = selectedPack === pack.id;
              return (
                <motion.button
                  key={pack.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + idx * 0.07 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedPack(pack.id)}
                  className={`relative w-full text-left p-4 rounded-2xl border-2 transition-all overflow-hidden ${
                    isSelected
                      ? `${pack.borderSelected} bg-gradient-to-br ${pack.colorClass} shadow-md`
                      : 'border-border-subtle dark:border-white/10 bg-bg-elevated dark:bg-white/3 hover:border-violet-500/30'
                  }`}
                >
                  {pack.badge && (
                    <div className={`absolute top-3 right-3 text-[10px] font-black px-2 py-0.5 rounded-full ${
                      pack.popular 
                        ? 'bg-fuchsia-100 dark:bg-fuchsia-500/30 text-fuchsia-700 dark:text-fuchsia-200 border border-fuchsia-200 dark:border-fuchsia-500/30'
                        : 'bg-amber-100 dark:bg-amber-500/30 text-amber-700 dark:text-amber-200 border border-amber-200 dark:border-amber-500/30'
                    }`}>
                      {pack.badge}
                    </div>
                  )}

                  <div className="flex items-center gap-3 pr-12 lg:pr-16">
                    {/* Emoji icon */}
                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center text-xl lg:text-2xl flex-shrink-0 bg-gradient-to-br border border-border-subtle dark:border-white/10" style={{ background: pack.colorClass.includes('from-') ? '' : pack.colorClass }}>
                      <span>{pack.emoji}</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] lg:text-sm font-black text-text-primary">{pack.name}</p>
                      <p className="text-sm lg:text-base font-black text-text-primary leading-tight">
                        {total.toLocaleString()} Destellos
                        {pack.bonus && (
                          <span className="text-[10px] lg:text-xs text-emerald-600 dark:text-emerald-400 font-black ml-1">
                            +{pack.bonus} BONUS
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Price + check */}
                    <div className="flex flex-col items-end flex-shrink-0 mr-1">
                      <span className="text-xl lg:text-2xl font-black text-text-primary">S/{pack.price}</span>
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className={`mt-1 w-5 h-5 rounded-full bg-gradient-to-br ${pack.btnClass} flex items-center justify-center shadow-lg shadow-brand/20`}
                          >
                            <Check size={11} className="text-white" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* ─── CTA de compra ─── */}
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              const pack = PACKS.find(p => p.id === selectedPack);
              if (pack) handleBuyPack(pack);
            }}
            className={`mt-4 w-full py-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-2 shadow-xl transition-all ${
              (() => {
                const pack = PACKS.find(p => p.id === selectedPack);
                return `bg-gradient-to-r ${pack?.btnClass || 'from-violet-600 to-fuchsia-600'} hover:opacity-90`;
              })()
            }`}
          >
            <CreditCard size={18} />
            Comprar {(() => {
              const pack = PACKS.find(p => p.id === selectedPack);
              if (!pack) return '';
              return `${(pack.destellos + (pack.bonus ?? 0)).toLocaleString()} Destellos — S/${pack.price}`;
            })()}
            <ArrowRight size={16} />
          </motion.button>
        </div>

        {/* ─── SOPORTE ─── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42 }}
          className="bg-bg-surface dark:bg-white/3 border border-border-subtle dark:border-white/8 rounded-2xl p-4 text-center shadow-sm"
        >
          <p className="text-xs text-text-muted font-medium">
            ¿Preguntas sobre tu plan o método de pago?
          </p>
          <a
            href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Hola, necesito ayuda con mi plan de Destellos en Nilah IA.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors mt-1"
          >
            <MessageCircle size={12} />
            Contactar soporte por WhatsApp
          </a>
        </motion.div>

        <div className="pb-6" />
      </div>

      {/* ─── PAYMENT OVERLAY ─── */}
      <AnimatePresence>
        {(step === 'payment' || step === 'success') && packChosen && (
          <>
            <motion.div
              key="overlay-bg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 dark:bg-black/75 backdrop-blur-md z-50"
              onClick={step === 'success' ? handleReset : undefined}
            />
            <motion.div
              key="overlay-panel"
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className="fixed bottom-0 left-0 right-0 z-[60] bg-bg-elevated dark:bg-[#0d1220] border-t border-border-strong dark:border-white/10 rounded-t-3xl shadow-2xl max-h-[92vh] overflow-y-auto w-full lg:max-w-lg lg:left-1/2 lg:-translate-x-1/2"
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
              </div>

              {step === 'success' ? (
                /* SUCCESS */
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center px-8 py-10 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-2xl shadow-emerald-500/40 mb-5"
                  >
                    <Check size={36} className="text-white" />
                  </motion.div>
                  <h2 className="text-2xl font-black text-text-primary mb-2">¡Listo! Captura enviada 🎉</h2>
                  <p className="text-text-secondary text-sm leading-relaxed max-w-xs">
                    Recibimos la solicitud. Validaremos tu Yape y tus{' '}
                    <strong className="text-text-primary">
                      {(packChosen.destellos + (packChosen.bonus ?? 0)).toLocaleString()} Destellos
                    </strong>{' '}
                    serán acreditados en minutos.
                  </p>
                  <button
                    onClick={handleReset}
                    className="mt-7 px-8 py-3 rounded-2xl bg-bg-surface dark:bg-white/8 border border-border-strong dark:border-white/12 text-text-primary text-sm font-bold hover:bg-gray-200 dark:hover:bg-white/12 transition-all shadow-sm"
                  >
                    Entendido ✓
                  </button>
                </motion.div>
              ) : (
                /* PAYMENT FLOW */
                <div className="px-5 pb-8">
                  <div className="flex items-center justify-between mb-5">
                    <button
                      onClick={() => setStep('shop')}
                      className="text-text-muted text-xs font-bold hover:text-text-primary transition-colors flex items-center gap-1"
                    >
                      ← Volver
                    </button>
                    <button
                      onClick={() => setStep('shop')}
                      className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                    >
                      <X size={14} className="text-text-muted" />
                    </button>
                  </div>

                  {/* Título */}
                  <div className="text-center mb-6">
                    <div className="text-4xl mb-2">{packChosen.emoji}</div>
                    <h3 className="text-2xl font-black text-text-primary">{packChosen.name}</h3>
                    <p className="text-text-muted text-sm font-medium">
                      {(packChosen.destellos + (packChosen.bonus ?? 0)).toLocaleString()} Destellos
                      {packChosen.bonus && <span className="text-emerald-600 dark:text-emerald-400 font-bold"> (+{packChosen.bonus} bonus)</span>}
                    </p>
                  </div>

                  {/* Instrucciones Yape */}
                  <div className="bg-bg-surface dark:bg-white/4 border border-border-strong dark:border-white/10 rounded-2xl p-5 mb-5 shadow-inner">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-full bg-[#7b44d8] flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <span className="text-white text-xs font-black">Y</span>
                      </div>
                      <div>
                        <p className="text-xs text-text-muted uppercase tracking-wider font-extrabold">Paga con Yape</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-bg-base dark:bg-white/5 border border-border-subtle dark:border-transparent rounded-xl p-3 text-center">
                        <p className="text-[10px] text-text-muted uppercase tracking-widest mb-1 font-bold">Número Yape</p>
                        <p className="text-xl font-black text-text-primary tracking-tight">{YAPE_NUMBER}</p>
                      </div>
                      <div className="bg-bg-base dark:bg-white/5 border border-border-subtle dark:border-transparent rounded-xl p-3 text-center">
                        <p className="text-[10px] text-text-muted uppercase tracking-widest mb-1 font-bold">Titular</p>
                        <p className="text-sm font-black text-text-primary leading-tight">{YAPE_TITULAR}</p>
                      </div>
                    </div>

                    <div className="border-t border-border-subtle dark:border-white/10 pt-4 text-center">
                      <p className="text-xs text-text-muted mb-0.5 font-medium">Monto a transferir</p>
                      <p className="text-4xl font-black text-text-primary">S/ {packChosen.price}.00</p>
                    </div>
                  </div>

                  {/* Pasos */}
                  <div className="space-y-2 mb-6">
                    {[
                      { n: '1', text: 'Yapea S/ ' + packChosen.price + ' al número arriba', icon: '📱' },
                      { n: '2', text: 'Toma captura de pantalla del comprobante', icon: '📸' },
                      { n: '3', text: 'Envíala por WhatsApp con el botón abajo', icon: '💬' },
                    ].map(step => (
                      <div key={step.n} className="flex items-center gap-3 bg-bg-surface dark:bg-white/3 rounded-xl px-4 py-3 border border-border-subtle dark:border-transparent">
                        <div className="w-8 h-8 rounded-full bg-bg-base dark:bg-white/10 flex items-center justify-center text-sm flex-shrink-0 shadow-sm">
                          {step.icon}
                        </div>
                        <p className="text-sm text-text-secondary font-medium">{step.text}</p>
                      </div>
                    ))}
                  </div>

                  {/* CTA WhatsApp */}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleWhatsApp}
                    className="w-full py-4 rounded-2xl bg-[#00e676] text-white font-black text-base flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 hover:bg-[#00c65e] transition-all"
                  >
                    <MessageCircle size={20} />
                    Enviar captura por WhatsApp
                    <ChevronRight size={16} />
                  </motion.button>

                  <p className="text-[10px] text-center text-text-muted mt-4 leading-relaxed px-4 font-medium">
                    También puedes contactar soporte para otro método de pago.<br/>
                    Los Destellos se acreditan en minutos tras validar el pago.
                  </p>

                  {/* Trust badges */}
                  <div className="flex items-center justify-center gap-5 mt-5">
                    <div className="flex items-center gap-1.5 text-text-muted opacity-80">
                      <ShieldCheck size={11} className="text-emerald-500" />
                      <span className="text-[10px] font-bold">Pago seguro</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-text-muted opacity-80">
                      <Sparkles size={11} className="text-amber-500" />
                      <span className="text-[10px] font-bold">Acreditación rápida</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-text-muted opacity-80">
                      <Star size={11} className="text-violet-500" />
                      <span className="text-[10px] font-bold">Sin vencimiento</span>
                    </div>
                  </div>

                  {/* Espaciador para la Navigation Bar inferior de la App */}
                  <div className="h-20 lg:h-4" />
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DestellosShop;
