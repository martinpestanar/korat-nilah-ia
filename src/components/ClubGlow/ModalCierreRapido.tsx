import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CheckCircle2,
  Clock,
  Calendar,
  Sparkles,
  AlertTriangle,
  User,
  Zap,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase } from '@/services/supabase';

interface CitaPendiente {
  id: string;
  fecha: string;
  precio: number;
  servicio: string;
  estado: string;
  cliente_id: string;
  cliente_nombre: string;
  cliente_telefono: string;
}

interface ModalCierreRapidoProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  onSuccess: () => void;
}

export const ModalCierreRapido: React.FC<ModalCierreRapidoProps> = ({
  isOpen,
  onClose,
  businessId,
  onSuccess
}) => {
  const [loading, setLoading] = useState(true);
  const [citas, setCitas] = useState<CitaPendiente[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [completing, setCompleting] = useState(false);
  const [resultMsg, setResultMsg] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && businessId) {
      cargarCitasPendientes();
    }
  }, [isOpen, businessId]);

  const cargarCitasPendientes = async () => {
    setLoading(true);
    setResultMsg(null);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('Citas')
        .select(`
          id, fecha, precio, servicio, estado, cliente_id,
          Clientes ( nombre, telefono )
        `)
        .eq('business_id', businessId)
        .in('estado', ['Pendiente', 'Confirmada'])
        .lte('fecha', today)
        .order('fecha', { ascending: false });

      if (error) throw error;

      const mapped: CitaPendiente[] = (data || []).map((c: any) => ({
        id: c.id,
        fecha: c.fecha,
        precio: Number(c.precio || 0),
        servicio: c.servicio || 'Servicio de Belleza',
        estado: c.estado,
        cliente_id: c.cliente_id,
        cliente_nombre: c.Clientes?.nombre || 'Clienta',
        cliente_telefono: c.Clientes?.telefono || ''
      }));

      setCitas(mapped);
      // Por defecto seleccionar todas para cierre masivo
      setSelectedIds(mapped.map(c => c.id));
    } catch (err: any) {
      console.error('Error cargando citas para cierre:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === citas.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(citas.map(c => c.id));
    }
  };

  const handleCompletarBatch = async () => {
    if (selectedIds.length === 0 || !businessId) return;
    setCompleting(true);
    setResultMsg(null);

    try {
      const { data, error } = await supabase.rpc('fn_completar_citas_pendientes_batch', {
        p_business_id: businessId,
        p_cita_ids: selectedIds
      });

      if (error) throw error;

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
      });

      setResultMsg({
        ok: true,
        msg: `¡Éxito! Se completaron ${data.completadas} cita(s) y se acreditaron ${data.sellos_acreditados} sellos a tus clientas.`
      });

      onSuccess();
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      console.error('Error completando citas en lote:', err);
      setResultMsg({ ok: false, msg: err.message || 'Error al completar las citas' });
    } finally {
      setCompleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="bg-white dark:bg-[#141124] border border-emerald-300 dark:border-emerald-500/40 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-black text-sm">
                🔔
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white">
                  Cierre Rápido de Citas Pendientes
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Guardián Club Glow: Completa citas y acredita sellos en 1 clic
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 sm:p-6 space-y-4">
            {resultMsg && (
              <div
                className={`p-3 rounded-2xl text-xs font-bold leading-relaxed flex items-center gap-2 ${
                  resultMsg.ok
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300'
                }`}
              >
                {resultMsg.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                <span>{resultMsg.msg}</span>
              </div>
            )}

            {loading ? (
              <div className="py-8 text-center text-xs text-gray-400">
                Buscando citas pendientes de hoy...
              </div>
            ) : citas.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mx-auto text-xl font-bold">
                  ✓
                </div>
                <h4 className="text-sm font-black text-gray-900 dark:text-white">
                  ¡Al día! No tienes citas pendientes
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                  Todas las citas programadas para hoy ya fueron marcadas como completadas y sus clientas tienen sus sellos.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs font-bold text-gray-600 dark:text-gray-300">
                  <span>{citas.length} cita(s) pendientes por cerrar:</span>
                  <button
                    onClick={selectAll}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    {selectedIds.length === citas.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 dark:divide-white/5 border border-gray-200 dark:border-white/10 rounded-2xl bg-white dark:bg-[#110e1f]">
                  {citas.map(c => {
                    const isChecked = selectedIds.includes(c.id);
                    return (
                      <div
                        key={c.id}
                        onClick={() => toggleSelect(c.id)}
                        className={`p-3 flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                          isChecked ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : 'hover:bg-gray-50 dark:hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                              {c.cliente_nombre}
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                              {c.servicio} • <span className="font-mono">{c.fecha}</span>
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-[#f5d77f]">
                            {c.estado}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={completing || selectedIds.length === 0}
                  onClick={handleCompletarBatch}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {completing ? (
                    'Completando y acreditando sellos...'
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-white" />
                      <span>Completar y Acreditar Sellos ({selectedIds.length})</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
