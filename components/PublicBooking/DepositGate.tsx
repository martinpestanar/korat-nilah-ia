import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Info, CheckCircle, Smartphone, Landmark, Loader2 } from 'lucide-react';

interface DepositGateProps {
  businessName: string;
  depositAmount: number;
  depositMessage: string;
  yape: string;
  plin: string;
  bankDetails: string;
  onVerify: () => Promise<void>;
  onCancel: () => void;
}

export const DepositGate: React.FC<DepositGateProps> = ({
  businessName,
  depositAmount,
  depositMessage,
  yape,
  plin,
  bankDetails,
  onVerify,
  onCancel,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVerifyClick = async () => {
    setIsSubmitting(true);
    try {
      await onVerify();
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Optional: add a small toast notification here
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-md w-full mx-auto bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-white/5"
    >
      <div className="bg-amber-500/10 p-6 text-center relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl"></div>
        <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-500/20 rounded-full flex items-center justify-center mb-4 text-amber-500">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Garantía de Asistencia
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {depositMessage || `Para confirmar tu cita en ${businessName}, requerimos un depósito previo de S/${depositAmount}.`}
        </p>
      </div>

      <div className="p-6 space-y-6">
        <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 border border-gray-100 dark:border-white/10">
          <div className="text-center mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Monto a depositar</span>
            <div className="text-3xl font-black text-gray-900 dark:text-white">
              S/ {depositAmount.toFixed(2)}
            </div>
          </div>

          <div className="space-y-3">
            {yape && (
              <div className="flex items-center justify-between bg-white dark:bg-[#141414] p-3 rounded-xl border border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                    <Smartphone size={16} />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-gray-500">Yape</span>
                    <span className="block font-bold text-gray-900 dark:text-white">{yape}</span>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(yape)}
                  className="text-xs font-bold text-violet-600 hover:text-violet-700 bg-violet-50 px-3 py-1 rounded-full dark:bg-violet-500/20 dark:text-violet-400"
                >
                  Copiar
                </button>
              </div>
            )}

            {plin && (
              <div className="flex items-center justify-between bg-white dark:bg-[#141414] p-3 rounded-xl border border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <Smartphone size={16} />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-gray-500">Plin</span>
                    <span className="block font-bold text-gray-900 dark:text-white">{plin}</span>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(plin)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1 rounded-full dark:bg-blue-500/20 dark:text-blue-400"
                >
                  Copiar
                </button>
              </div>
            )}

            {bankDetails && (
              <div className="bg-white dark:bg-[#141414] p-3 rounded-xl border border-gray-100 dark:border-white/5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                      <Landmark size={16} />
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-gray-500 mb-1">Cuentas Bancarias</span>
                      <p className="text-sm font-medium text-gray-900 dark:text-white whitespace-pre-wrap">
                        {bankDetails}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(bankDetails)}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full dark:bg-emerald-500/20 dark:text-emerald-400 shrink-0"
                  >
                    Copiar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            Volver
          </button>
          <button
            onClick={handleVerifyClick}
            disabled={isSubmitting}
            className="flex-[2] flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <CheckCircle size={20} />
                Ya deposité
              </>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500 justify-center">
          <Info size={14} />
          Tu cita no se confirmará hasta verificar el abono.
        </div>
      </div>
    </motion.div>
  );
};
