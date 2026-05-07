/**
 * CreditReloadModal — Recarga de Destellos (Magic Flyers Credits)
 * ═══════════════════════════════════════════════════════════════
 * Modal de upsell premium para cuando el usuario se queda sin créditos.
 * Diseño: frictionless, emocionalmente cálido, precio visible y atractivo.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Zap, Check, Star, ArrowRight, ShieldCheck, MessageCircle } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';

interface CreditPack {
  id: string;
  credits: number;
  price: number;
  currency: string;
  label: string;
  badge?: string;
  popular?: boolean;
  color: string;
  perCredit: string;
  bonus?: number;
}

const CREDIT_PACKS: CreditPack[] = [
  {
    id: 'starter',
    credits: 100,
    price: 14,
    currency: 'S/',
    label: 'Pack Inicial',
    color: 'from-violet-500/10 to-purple-500/10',
    perCredit: 'S/ 0.14 c/u',
  },
  {
    id: 'popular',
    credits: 500,
    price: 39,
    currency: 'S/',
    label: 'Pack Crecimiento',
    badge: '⚡ Más elegido',
    popular: true,
    color: 'from-fuchsia-500/15 to-pink-500/15',
    perCredit: 'S/ 0.08 c/u',
  },
  {
    id: 'pro',
    credits: 1200,
    price: 79,
    currency: 'S/',
    label: 'Pack Impulso',
    badge: '🔥 Mejor valor',
    color: 'from-amber-500/10 to-orange-500/10',
    perCredit: 'S/ 0.06 c/u',
  },
];

interface CreditReloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  onSuccess: () => Promise<void>;
}

export const CreditReloadModal: React.FC<CreditReloadModalProps> = ({
  isOpen,
  onClose,
  currentBalance,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [selectedPack, setSelectedPack] = useState<string>('popular');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'choose' | 'payment' | 'success'>('choose');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const chosen = CREDIT_PACKS.find((p) => p.id === selectedPack)!;

  const handleReload = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      // Get current session for auth_uid
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No hay sesión activa');

      const totalCredits = chosen.credits + (chosen.bonus ?? 0);

      // Call RPC to add credits atomically using auth_uid
      const { data: newBalance, error } = await supabase.rpc('add_destellos', {
        auth_uid: session.user.id,
        amount: totalCredits,
      });

      if (error) {
        // Fallback: direct update if RPC fails
        const { error: updateError } = await supabase
          .from('Usuarios')
          .update({ destellos: currentBalance + totalCredits })
          .eq('auth_uid', session.user.id);

        if (updateError) throw updateError;
      }

      setStep('success');
      // Give user a moment to see success animation, then sync
      setTimeout(async () => {
        await onSuccess();
      }, 2000);
    } catch (err: any) {
      console.error('[CreditReloadModal] Error adding credits:', err);
      setErrorMsg(err.message || 'Error al procesar la recarga. Intenta de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (isProcessing) return;
    setStep('choose');
    setErrorMsg(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="fixed inset-0 flex items-center justify-center z-50 px-4 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-md bg-[#0d1220] border border-white/10 rounded-3xl shadow-2xl shadow-black/60 overflow-hidden">

              {step === 'success' ? (
                /* ─── SUCCESS STATE ─── */
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center px-8 py-14 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 22, delay: 0.1 }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-2xl shadow-yellow-500/40 mb-6"
                  >
                    <Sparkles size={36} className="text-white" />
                  </motion.div>
                  <h2 className="text-2xl font-black text-white mb-2">
                    ¡Captura enviada! ✨
                  </h2>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Estamos validando tu pago con Yape.
                    Tus <strong>{chosen.credits} Destellos</strong> se liberarán automáticamente en unos minutos.
                  </p>
                  <button
                    onClick={handleClose}
                    className="mt-8 px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-bold hover:bg-white/10 transition-all font-sans"
                  >
                    Entendido
                  </button>
                </motion.div>
              ) : step === 'payment' ? (
                /* ─── PAYMENT FLOW (YAPE) ─── */
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-6 md:p-8"
                >
                  <button
                    onClick={() => setStep('choose')}
                    className="text-gray-500 text-xs font-bold hover:text-white mb-6 flex items-center gap-1 transition-colors"
                  >
                    ← Volver a elegir pack
                  </button>

                  <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-[#71277a] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-purple-900/40">
                      <Zap size={32} className="text-cyan-300" />
                    </div>
                    <h3 className="text-xl font-black text-white px-4">
                      Pago seguro con <span className="text-cyan-400">Yape</span>
                    </h3>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 text-center">
                    <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">Número de destino</p>
                    <p className="text-3xl font-black text-white mb-1">51981482289</p>
                    <p className="text-sm text-cyan-400 font-bold mb-4">Titular: Korat Flow</p>
                    
                    <div className="flex justify-center mb-4">
                       <img 
                         src="https://media-korat.s3.amazonaws.com/yape-qr-placeholder.png" 
                         alt="QR Yape" 
                         className="w-40 h-40 rounded-xl border-4 border-white/10 opacity-50 grayscale" 
                       />
                    </div>

                    <div className="text-lg font-black text-white border-t border-white/10 pt-4 mt-2">
                      Total: S/ {chosen.price}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <a
                      href={`https://wa.me/51981482289?text=${encodeURIComponent(`Hola! Ya hice el Yape de S/ ${chosen.price} por el ${chosen.label} (${chosen.credits} Destellos) para mi salón. Adjunto captura para la liberación automática.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setStep('success')}
                      className="w-full py-4 rounded-2xl bg-[#00e676] text-white text-md font-black shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
                    >
                      <MessageCircle size={20} />
                      Enviar captura por WhatsApp
                    </a>
                    
                    <p className="text-[10px] text-center text-gray-500 leading-relaxed px-4">
                      Al hacer clic en el botón, te redirigiremos a WhatsApp para enviar el comprobante. Los créditos se cargarán tras la validación inmediata del sistema.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <>
                  {/* ─── HEADER ─── */}
                  <div className="relative px-6 pt-6 pb-4">
                    <div className="absolute -top-20 -right-20 w-48 h-48 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -top-10 -left-10 w-36 h-36 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

                    <button
                      onClick={handleClose}
                      className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                      <X size={16} className="text-gray-400" />
                    </button>

                    {/* Balance pill */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4">
                      <Sparkles size={12} className="text-yellow-400" />
                      <span className="text-xs font-bold text-yellow-100">{currentBalance} Destellos restantes</span>
                    </div>

                    <h2 className="text-2xl font-black text-white leading-tight">
                      Recarga tus <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-pink-400">Destellos ✨</span>
                    </h2>
                    <p className="text-gray-400 text-sm mt-1.5 leading-relaxed">
                      Cada imagen vale el esfuerzo. Elige tu pack y sigue creando sin parar.
                    </p>
                  </div>

                  {/* ─── PACKS ─── */}
                  <div className="px-5 space-y-3 pb-2">
                    {CREDIT_PACKS.map((pack) => {
                      const isSelected = selectedPack === pack.id;
                      const totalCredits = pack.credits + (pack.bonus ?? 0);
                      return (
                        <motion.button
                          key={pack.id}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedPack(pack.id)}
                          className={`relative w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                            isSelected
                              ? pack.popular
                                ? 'border-fuchsia-500/60 bg-gradient-to-r from-fuchsia-500/15 to-pink-500/15 shadow-lg shadow-fuchsia-500/10'
                                : pack.id === 'pro'
                                ? 'border-amber-500/60 bg-gradient-to-r from-amber-500/10 to-orange-500/10 shadow-lg shadow-amber-500/10'
                                : 'border-violet-500/60 bg-gradient-to-r from-violet-500/15 to-purple-500/15 shadow-lg shadow-violet-500/10'
                              : 'border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/5'
                          }`}
                        >
                          {/* Icon */}
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${
                            pack.id === 'starter' ? 'bg-violet-500/20'
                            : pack.id === 'popular' ? 'bg-fuchsia-500/20'
                            : 'bg-amber-500/20'
                          }`}>
                            {pack.id === 'starter' ? '⚡' : pack.id === 'popular' ? '✨' : '🔥'}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-black text-white">{pack.label}</span>
                              {pack.badge && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  pack.popular ? 'bg-fuchsia-500/30 text-fuchsia-300'
                                  : 'bg-amber-500/30 text-amber-300'
                                }`}>
                                  {pack.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-gray-300 text-sm font-bold mt-0.5">
                              {totalCredits} Destellos
                              {pack.bonus ? <span className="text-emerald-400 ml-1 text-xs font-black">+{pack.bonus} BONUS</span> : null}
                            </p>
                            <p className="text-gray-500 text-[11px]">{pack.perCredit}</p>
                          </div>

                          {/* Price */}
                          <div className="flex flex-col items-end flex-shrink-0">
                            <span className="text-xl font-black text-white">{pack.currency}{pack.price}</span>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className={`w-5 h-5 rounded-full flex items-center justify-center mt-1 ${
                                  pack.popular ? 'bg-fuchsia-500' : pack.id === 'pro' ? 'bg-amber-500' : 'bg-violet-500'
                                }`}
                              >
                                <Check size={12} className="text-white" />
                              </motion.div>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* ─── ERROR ─── */}
                  {errorMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mx-5 mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300"
                    >
                      {errorMsg}
                    </motion.div>
                  )}

                  {/* ─── CTA ─── */}
                  <div className="px-5 pb-6 pt-4">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setStep('payment')}
                      disabled={isProcessing}
                      className={`w-full py-4 rounded-2xl text-white text-sm font-black shadow-xl flex items-center justify-center gap-2 transition-all ${
                        isProcessing
                          ? 'bg-gray-700 cursor-not-allowed opacity-60'
                          : chosen?.popular
                          ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 shadow-fuchsia-500/30 hover:opacity-90'
                          : chosen?.id === 'pro'
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/30 hover:opacity-90'
                          : 'bg-gradient-to-r from-violet-600 to-purple-600 shadow-violet-500/30 hover:opacity-90'
                      }`}
                    >
                      {isProcessing ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                            className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
                          />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <Zap size={16} />
                          Continuar con {chosen?.credits} Destellos
                          <ArrowRight size={14} />
                        </>
                      )}
                    </motion.button>

                    {/* Trust badges */}
                    <div className="flex items-center justify-center gap-4 mt-3">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <ShieldCheck size={12} className="text-emerald-500" />
                        <span className="text-[10px]">Pago seguro</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Sparkles size={12} className="text-yellow-500" />
                        <span className="text-[10px]">Acreditación inmediata</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Star size={12} className="text-violet-400" />
                        <span className="text-[10px]">Sin vencimiento</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
