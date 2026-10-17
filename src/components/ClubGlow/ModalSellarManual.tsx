import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  Search,
  Gift,
  CheckCircle2,
  AlertTriangle,
  Send,
  User,
  Plus,
  Minus,
  Crown,
  Flame,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase } from '@/services/supabase';

interface ClienteGlowOption {
  cliente_id: string;
  cliente_nombre: string;
  telefono: string;
  sellos_activos: number;
  sellos_roadmap: number;
  categoria?: string;
}

interface SelloRoadmapHito {
  id: string;
  hito_sello: number;
  nombre: string;
  descripcion: string;
  imagen_url?: string | null;
}

interface ModalSellarManualProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  clientes: ClienteGlowOption[];
  roadmap: SelloRoadmapHito[];
  initialClient?: ClienteGlowOption | null;
  onSuccess: () => void;
}

export const ModalSellarManual: React.FC<ModalSellarManualProps> = ({
  isOpen,
  onClose,
  businessId,
  clientes,
  roadmap,
  initialClient,
  onSuccess
}) => {
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClienteGlowOption | null>(initialClient || null);
  const [stampsToAdd, setStampsToAdd] = useState(1);
  const [motivo, setMotivo] = useState('visita_mostrador');
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estado de confirmación de premio
  const [showPrizeConfirm, setShowPrizeConfirm] = useState(false);
  const [unlockedPrizeInfo, setUnlockedPrizeInfo] = useState<SelloRoadmapHito | null>(null);

  // Bloquear scroll de la pantalla de atrás mientras el modal esté abierto
  React.useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Inicializar si viene un cliente preseleccionado
  React.useEffect(() => {
    if (initialClient) {
      setSelectedClient(initialClient);
    }
  }, [initialClient]);

  // Lista filtrada de clientes
  const filteredClients = useMemo(() => {
    if (!search.trim()) return clientes.slice(0, 8);
    const q = search.toLowerCase();
    return clientes
      .filter(
        c =>
          (c.cliente_nombre || '').toLowerCase().includes(q) ||
          (c.telefono || '').includes(q)
      )
      .slice(0, 15);
  }, [clientes, search]);

  const currentStamps = selectedClient ? selectedClient.sellos_activos || 0 : 0;
  const targetStamps = currentStamps + stampsToAdd;

  // Detectar si el nuevo total cruza algún hito de premio
  const prizeCrossing = useMemo(() => {
    if (!selectedClient) return null;
    // Buscar si algún hito activo está entre currentStamps + 1 y targetStamps
    const hitosCruza = roadmap
      .filter(r => r.hito_sello > currentStamps && r.hito_sello <= targetStamps)
      .sort((a, b) => b.hito_sello - a.hito_sello);

    return hitosCruza.length > 0 ? hitosCruza[0] : null;
  }, [selectedClient, currentStamps, targetStamps, roadmap]);

  const handlePreSubmit = () => {
    if (!selectedClient) {
      setErrorMsg('Por favor selecciona una clienta');
      return;
    }
    setErrorMsg(null);

    // Si cruza un premio, mostramos la modal de confirmación obligatoria
    if (prizeCrossing) {
      setUnlockedPrizeInfo(prizeCrossing);
      setShowPrizeConfirm(true);
    } else {
      // Si es un sello regular común, ejecutamos directo sin confirmación molesta y sin WhatsApp
      executeSellar(false);
    }
  };

  const executeSellar = async (isConfirmingPrize: boolean) => {
    if (!selectedClient || !businessId) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.rpc('fn_sellar_manual_club_glow', {
        p_business_id: businessId,
        p_cliente_id: selectedClient.cliente_id,
        p_cantidad: stampsToAdd,
        p_motivo: motivo,
        p_notas: notas.trim() || 'Sellado manual por administración'
      });

      if (error) throw error;

      if (!data?.ok) {
        throw new Error(data?.error || 'No se pudo registrar el sello');
      }

      // Animación de éxito
      confetti({
        particleCount: data.es_premio ? 90 : 40,
        spread: data.es_premio ? 80 : 50,
        origin: { y: 0.6 },
        colors: data.es_premio ? ['#f59e0b', '#fbbf24', '#8b5cf6', '#ec4899'] : ['#f59e0b', '#10b981']
      });

      setShowPrizeConfirm(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error sellando manualmente:', err);
      setErrorMsg(err.message || 'Error en la conexión con la base de datos');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="bg-white dark:bg-[#141124] border border-amber-300/40 dark:border-[#d4af37]/30 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-[#f5d77f] flex items-center justify-center font-black text-sm">
                ⭐
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white">
                  Sellar Clienta Manualmente
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Suma sellos libres al instante sin trabas ni PINs
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

          <div className="p-5 sm:p-6 space-y-5">
            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Paso 1: Selección de Clienta */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                <span>1. Seleccionar Clienta:</span>
                {selectedClient && (
                  <button
                    onClick={() => setSelectedClient(null)}
                    className="text-[11px] text-amber-600 dark:text-[#f5d77f] hover:underline cursor-pointer"
                  >
                    Cambiar clienta
                  </button>
                )}
              </label>

              {selectedClient ? (
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-400/30 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-amber-200 dark:bg-amber-500/30 text-amber-800 dark:text-[#f5d77f] font-bold text-sm flex items-center justify-center shrink-0">
                      {selectedClient.cliente_nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-gray-900 dark:text-white truncate">
                          {selectedClient.cliente_nombre}
                        </span>
                        {selectedClient.categoria === 'VIP 👑' && (
                          <span className="text-[9px] bg-amber-400/20 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded-full font-black border border-amber-400/40">
                            👑 VIP
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {selectedClient.telefono || 'Sin teléfono'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-amber-600 dark:text-[#f5d77f] flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> {selectedClient.sellos_activos} sellos
                    </span>
                    <span className="text-[10px] text-gray-400">Actualmente</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre o celular..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Resultados sugeridos */}
                  <div className="max-h-40 overflow-y-auto divide-y divide-gray-100 dark:divide-white/5 border border-gray-200 dark:border-white/10 rounded-2xl bg-white dark:bg-[#110e1f]">
                    {filteredClients.length === 0 ? (
                      <div className="p-3 text-center text-xs text-gray-400">
                        No se encontraron clientas
                      </div>
                    ) : (
                      filteredClients.map(c => (
                        <button
                          key={c.cliente_id}
                          type="button"
                          onClick={() => setSelectedClient(c)}
                          className="w-full p-2.5 text-left flex items-center justify-between hover:bg-amber-50/50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-800 dark:text-white truncate">
                              {c.cliente_nombre}
                            </p>
                            <p className="text-[10px] text-gray-400 font-mono">{c.telefono || 'Sin celular'}</p>
                          </div>
                          <span className="text-xs font-extrabold text-amber-600 dark:text-[#f5d77f] shrink-0">
                            {c.sellos_activos} ★
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Paso 2: Selector de Sellos a Sumar */}
            {selectedClient && (
              <div className="space-y-4 pt-1">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-2">
                    2. ¿Cuántos sellos deseas agregar hoy?
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-1">
                      <button
                        type="button"
                        onClick={() => setStampsToAdd(prev => Math.max(1, prev - 1))}
                        className="w-10 h-10 rounded-xl bg-white dark:bg-white/10 text-gray-800 dark:text-white flex items-center justify-center font-bold hover:bg-gray-200 dark:hover:bg-white/20 transition-colors cursor-pointer"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-14 text-center font-black text-lg text-amber-600 dark:text-[#f5d77f]">
                        +{stampsToAdd}
                      </span>
                      <button
                        type="button"
                        onClick={() => setStampsToAdd(prev => prev + 1)}
                        className="w-10 h-10 rounded-xl bg-white dark:bg-white/10 text-gray-800 dark:text-white flex items-center justify-center font-bold hover:bg-gray-200 dark:hover:bg-white/20 transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4].map(num => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setStampsToAdd(num)}
                          className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            stampsToAdd === num
                              ? 'bg-amber-500 text-slate-950 shadow-sm'
                              : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
                          }`}
                        >
                          +{num}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Previsualización del Progreso */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border border-amber-300/40 dark:border-amber-400/20 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-300 font-semibold">Progreso resultante:</span>
                    <span className="font-extrabold text-amber-700 dark:text-[#f5d77f]">
                      {currentStamps} ➔ <span className="text-sm underline">{targetStamps} sellos</span>
                    </span>
                  </div>

                  {/* Barra de sellos mini */}
                  <div className="w-full bg-gray-200 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (targetStamps / 12) * 100)}%` }}
                    />
                  </div>

                  {/* Detección de Premio vs Sello Regular */}
                  {prizeCrossing ? (
                    <div className="flex items-center gap-2 pt-1 text-xs text-amber-800 dark:text-[#f5d77f] font-bold animate-pulse">
                      <Gift className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>
                        ¡Desbloqueará el Premio {prizeCrossing.hito_sello}: "{prizeCrossing.nombre}"! 🎁
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 pt-1 text-[11px] text-gray-500 dark:text-gray-400">
                      <span>💬 Visita regular: Se guardará silenciosamente sin molestar con WhatsApp.</span>
                    </div>
                  )}
                </div>

                {/* Motivo Opcional */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block">
                    Motivo (Opcional):
                  </label>
                  <select
                    value={motivo}
                    onChange={e => setMotivo(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-gray-800 dark:text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="visita_mostrador">Visita en mostrador / Pago directo</option>
                    <option value="cortesia">Cortesía / Compensación del salón</option>
                    <option value="promocion">Promoción especial / Campaña</option>
                    <option value="amiga_referida">Recomendó a una amiga</option>
                    <option value="ajuste_manual">Ajuste de sellos anterior</option>
                  </select>
                </div>

                {/* Botón Principal Guardar */}
                <button
                  type="button"
                  onClick={handlePreSubmit}
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    'Guardando...'
                  ) : prizeCrossing ? (
                    <>
                      <Gift className="w-4 h-4 text-slate-950" />
                      <span>Continuar hacia entrega de Premio ({targetStamps} sellos) →</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-slate-950" />
                      <span>Guardar +{stampsToAdd} Sello(s) Silenciosamente</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── MODAL HIJA DE CONFIRMACIÓN DE PREMIO (Requerimiento del Usuario) ── */}
        <AnimatePresence>
          {showPrizeConfirm && unlockedPrizeInfo && selectedClient && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[10000] bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white dark:bg-[#151226] border-2 border-amber-400 rounded-3xl w-full max-w-md p-6 shadow-2xl text-center space-y-4 relative overflow-hidden"
              >
                {/* Glow decorativo */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-amber-400/20 blur-3xl pointer-events-none" />

                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-white flex items-center justify-center text-3xl mx-auto shadow-lg shadow-amber-500/30">
                  🎁
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-[#f5d77f] border border-amber-400/40">
                    Confirmación de Premio
                  </span>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white">
                    ¿Estás segura de otorgarle este premio a {selectedClient.cliente_nombre}?
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    Al confirmar, alcanzará el <strong className="text-amber-600 dark:text-[#f5d77f]">Sello {unlockedPrizeInfo.hito_sello}</strong> y se generará su código de canje oficial para:
                  </p>
                </div>

                {/* Tarjeta de Premio a Otorgar */}
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-white/5 border border-amber-300 dark:border-white/10 text-left flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 overflow-hidden flex items-center justify-center shrink-0 border border-amber-400/40">
                    {unlockedPrizeInfo.imagen_url ? (
                      <img
                        src={unlockedPrizeInfo.imagen_url}
                        alt="Premio"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xl">👑</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-gray-900 dark:text-white truncate">
                      {unlockedPrizeInfo.nombre}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                      {unlockedPrizeInfo.descripcion || 'Regalo consentido de Club Glow'}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold text-left flex items-start gap-2">
                  <Send className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span>
                    Se enviará automáticamente el mensaje a su WhatsApp (<strong>{selectedClient.telefono}</strong>) con la imagen 3D del regalo y su código.
                  </span>
                </div>

                {/* Acciones de Confirmación */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPrizeConfirm(false)}
                    disabled={loading}
                    className="py-3 px-4 rounded-xl border border-gray-200 dark:border-white/15 text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    No, Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => executeSellar(true)}
                    disabled={loading}
                    className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-md shadow-emerald-600/30 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    {loading ? 'Entregando...' : '¡Sí, Otorgar Premio! 🚀'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
};
