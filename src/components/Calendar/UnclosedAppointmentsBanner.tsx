import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle2, UserX, Ban, ChevronRight, X, Sparkles, Loader2, Phone } from 'lucide-react';
import { Appointment } from '../../types';
import { BottomSheet } from '../UI/BottomSheet';
import { getTimeInLima } from '../../utils/timezone';

interface UnclosedAppointmentsBannerProps {
  appointments: Appointment[];
  onUpdateStatus: (citaId: number, status: 'Completada' | 'No-Show' | 'Cancelada') => Promise<void>;
  isUpdatingStatus?: boolean;
}

export const UnclosedAppointmentsBanner: React.FC<UnclosedAppointmentsBannerProps> = ({
  appointments,
  onUpdateStatus,
  isUpdatingStatus = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Filtrar citas pasadas que siguen en 'Pendiente' o 'Confirmada'
  // Consideramos pasada si su hora de inicio + duración + 15 min de gracia ya ocurrió
  const unclosedList = useMemo(() => {
    const now = new Date();
    return (appointments || []).filter(apt => {
      if (!apt.fecha) return false;
      const st = (apt.estado || '').toLowerCase();
      if (st !== 'pendiente' && st !== 'confirmada') return false;

      try {
        const aptDate = new Date(apt.fecha);
        const durationMin = apt.duracion_min || 60;
        const endTime = new Date(aptDate.getTime() + (durationMin + 15) * 60 * 1000);
        return endTime <= now;
      } catch {
        return false;
      }
    });
  }, [appointments]);

  if (unclosedList.length === 0) return null;

  const handleAction = async (citaId: number, status: 'Completada' | 'No-Show' | 'Cancelada') => {
    try {
      setProcessingId(citaId);
      await onUpdateStatus(citaId, status);
      if (unclosedList.length <= 1) {
        setIsOpen(false);
      }
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <>
      {/* ── Banner Sutil Superior (100% Mobile-First) ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="mx-4 sm:mx-0 mb-3"
      >
        <div
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-violet-600/10 via-purple-600/10 to-pink-600/10 dark:from-violet-900/30 dark:via-purple-900/25 dark:to-pink-900/30 border border-violet-500/25 dark:border-violet-500/30 shadow-sm hover:shadow-md transition-all active:scale-[0.99] cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white shadow-md shadow-violet-500/25 shrink-0">
              <Clock className="h-5 w-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-black text-violet-950 dark:text-violet-200">
                  {unclosedList.length} {unclosedList.length === 1 ? 'cita pasada' : 'citas pasadas'} por verificar
                </span>
                <span className="px-1.5 py-0.2 rounded-md bg-violet-500/20 text-violet-700 dark:text-violet-300 text-[10px] font-bold">
                  Acción rápida
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                Toca para registrar asistencia o plantón en 1 toque
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0 text-violet-600 dark:text-violet-400 font-bold text-xs">
            <span className="hidden sm:inline">Revisar</span>
            <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </motion.div>

      {/* ── Drawer de Cierre Rápido ── */}
      <BottomSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title=""
        showCloseButton={true}
      >
        <div className="px-4 pb-6 sm:px-6">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900 dark:text-white">
                Verificar Citas Pasadas
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Registra el resultado real para mantener la fiabilidad y finanzas al día.
              </p>
            </div>
          </div>

          {/* Lista de citas pendientes de cierre */}
          <div className="space-y-3 mt-4 max-h-[60vh] overflow-y-auto overscroll-contain pr-1">
            {unclosedList.map((apt) => {
              const isProcessing = processingId === apt.id || isUpdatingStatus;
              const timePart = apt.fecha ? getTimeInLima(apt.fecha) : '--:--';
              const phone = apt.telefono || (apt as any).cliente?.telefono || '';

              return (
                <div
                  key={apt.id}
                  className="p-3.5 rounded-2xl bg-gray-50 dark:bg-dark-bg border border-gray-200/80 dark:border-dark-border space-y-3"
                >
                  {/* Header de la tarjeta */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 tabular-nums">
                          {timePart}
                        </span>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                          {apt.nombre || (apt as any).nombre_cliente || 'Cliente'}
                        </h4>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                        {apt.servicio} · S/ {(apt.precio || 0).toFixed(0)}
                      </p>
                    </div>

                    {phone && (
                      <a
                        href={`https://wa.me/${phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 transition-colors shrink-0"
                        title="Abrir WhatsApp"
                      >
                        <Phone size={15} />
                      </a>
                    )}
                  </div>

                  {/* Botones de acción directa con 44px min-touch target */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {/* 1. Atendida / Completada */}
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleAction(apt.id, 'Completada')}
                      className="min-h-[44px] flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-97 text-white font-bold text-xs transition-all shadow-sm shadow-emerald-600/20 disabled:opacity-50"
                    >
                      {isProcessing && processingId === apt.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 size={16} />
                          <span className="text-[11px] leading-tight">✓ Atendida</span>
                        </>
                      )}
                    </button>

                    {/* 2. No Asistió (No-Show) */}
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleAction(apt.id, 'No-Show')}
                      className="min-h-[44px] flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-97 text-white font-bold text-xs transition-all shadow-sm shadow-rose-600/20 disabled:opacity-50"
                    >
                      <UserX size={16} />
                      <span className="text-[11px] leading-tight">✕ Plantón</span>
                    </button>

                    {/* 3. Canceló */}
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleAction(apt.id, 'Cancelada')}
                      className="min-h-[44px] flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-1.5 rounded-xl bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 active:scale-97 text-gray-700 dark:text-gray-300 font-bold text-xs transition-all disabled:opacity-50"
                    >
                      <Ban size={15} />
                      <span className="text-[11px] leading-tight">🚫 Canceló</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </BottomSheet>
    </>
  );
};
