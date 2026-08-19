import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, QrCode, Banknote, CreditCard, ArrowRight, UserCheck, Trash2, ShoppingBag } from 'lucide-react';
import { PosCustomer, PosItem } from '../../services/posService';

interface CartItem {
  item: PosItem;
  quantity: number;
}

interface CustomNumpadItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface PosCheckoutBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  customNumpadItems: CustomNumpadItem[];
  totalAmount: number;
  selectedCustomer: PosCustomer | null;
  paymentMethod: 'yape_plin' | 'efectivo' | 'tarjeta' | 'transferencia';
  setPaymentMethod: (m: 'yape_plin' | 'efectivo' | 'tarjeta' | 'transferencia') => void;
  cashGiven: string;
  setCashGiven: (v: string) => void;
  onConfirmSale: (isPaidNow: boolean) => void;
  onRemoveCartItem: (itemId: string) => void;
  onRemoveCustomItem: (customId: string) => void;
}

export const PosCheckoutBottomSheet: React.FC<PosCheckoutBottomSheetProps> = ({
  isOpen,
  onClose,
  cart,
  customNumpadItems,
  totalAmount,
  selectedCustomer,
  paymentMethod,
  setPaymentMethod,
  cashGiven,
  setCashGiven,
  onConfirmSale,
  onRemoveCartItem,
  onRemoveCustomItem,
}) => {
  const cashNum = parseFloat(cashGiven) || 0;
  const changeAmount = cashNum > totalAmount ? cashNum - totalAmount : 0;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        {/* Overlay backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm"
        />

        {/* Bottom Sheet Drawer */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative w-full max-w-lg bg-white dark:bg-[#0d0b18] border-t sm:border border-slate-200 dark:border-white/10 sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col z-10"
        >
          {/* Drag Handle Indicator */}
          <div className="pt-3 pb-1 flex justify-center cursor-grab active:cursor-grabbing">
            <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-white/20" />
          </div>

          {/* Sheet Header */}
          <div className="px-5 py-3 flex items-center justify-between border-b border-slate-100 dark:border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Resumen de Cobro
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedCustomer ? `Cliente: ${selectedCustomer.name}` : 'Cliente General (Mostrador)'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sheet Body Scrollable */}
          <div className="p-5 overflow-y-auto space-y-5 flex-1">
            {/* Lista de Ítems */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Detalle del Pedido
              </span>

              {cart.map(({ item, quantity }) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {quantity} x S/ {item.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      S/ {(item.price * quantity).toFixed(2)}
                    </span>
                    <button
                      onClick={() => onRemoveCartItem(item.id)}
                      className="text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {customNumpadItems.map((cItem) => (
                <div
                  key={cItem.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                      {cItem.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Monto Libre
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      S/ {(cItem.price * cItem.quantity).toFixed(2)}
                    </span>
                    <button
                      onClick={() => onRemoveCustomItem(cItem.id)}
                      className="text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Selector de Método de Pago */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Método de Pago
              </span>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPaymentMethod('yape_plin')}
                  className={`p-3 rounded-2xl flex items-center gap-2.5 border text-xs font-bold transition-all ${
                    paymentMethod === 'yape_plin'
                      ? 'bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-400 ring-2 ring-purple-500/20'
                      : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-purple-500" />
                  <span>Yape / Plin / QR</span>
                </button>

                <button
                  onClick={() => setPaymentMethod('efectivo')}
                  className={`p-3 rounded-2xl flex items-center gap-2.5 border text-xs font-bold transition-all ${
                    paymentMethod === 'efectivo'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Banknote className="w-4 h-4 text-emerald-500" />
                  <span>Efectivo</span>
                </button>

                <button
                  onClick={() => setPaymentMethod('tarjeta')}
                  className={`p-3 rounded-2xl flex items-center gap-2.5 border text-xs font-bold transition-all ${
                    paymentMethod === 'tarjeta'
                      ? 'bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20'
                      : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-blue-500" />
                  <span>Tarjeta</span>
                </button>

                <button
                  onClick={() => setPaymentMethod('transferencia')}
                  className={`p-3 rounded-2xl flex items-center gap-2.5 border text-xs font-bold transition-all ${
                    paymentMethod === 'transferencia'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 ring-2 ring-amber-500/20'
                      : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <ArrowRight className="w-4 h-4 text-amber-500" />
                  <span>Transferencia</span>
                </button>
              </div>
            </div>

            {/* Input de Efectivo Recibido si aplica */}
            {paymentMethod === 'efectivo' && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300">
                    Monto Recibido
                  </span>
                  <button
                    onClick={() => setCashGiven(totalAmount.toString())}
                    className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 underline"
                  >
                    Paga Exacto (S/ {totalAmount.toFixed(2)})
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
                    S/
                  </span>
                  <input
                    type="number"
                    value={cashGiven}
                    onChange={(e) => setCashGiven(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-white dark:bg-black/40 border border-emerald-300 dark:border-emerald-500/40 rounded-xl px-3 py-1.5 text-base font-black text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                {cashNum > 0 && (
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-emerald-700 dark:text-emerald-300 font-semibold">
                      Vuelto a entregar:
                    </span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      S/ {changeAmount.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Total Resumen */}
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
                  Total a Cobrar
                </span>
                <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  S/ {totalAmount.toFixed(2)}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Sin Comisiones
                </span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-slate-50 dark:bg-[#06040f] border-t border-slate-100 dark:border-white/10 flex gap-3">
            <button
              onClick={() => onConfirmSale(false)}
              className="flex-1 py-3 px-4 rounded-2xl bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/15 text-slate-800 dark:text-slate-200 text-xs font-extrabold transition-all active:scale-95"
            >
              Fiado / Pendiente
            </button>

            <button
              onClick={() => onConfirmSale(true)}
              className="flex-[2] py-3.5 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-black shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <span>CONFIRMAR PAGO</span>
              <Check className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
