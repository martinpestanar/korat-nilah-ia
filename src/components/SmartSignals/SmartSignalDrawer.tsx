/**
 * SmartSignalDrawer
 * 
 * Bottom sheet drawer mobile-first con:
 * - Handle bar y swipe-down para cerrar
 * - Sección de clientas afectadas (colapsable)
 * - Preview de mensaje WhatsApp realista
 * - CTA principal + botones de dismiss
 * - Dots de navegación entre señales
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { X, ChevronDown, ChevronUp, MessageCircle, ArrowRight, Clock, Zap, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSmartSignals, SmartSignal, ClientePreview } from "../../hooks/useSmartSignals";

// ─── Colores por urgencia ──────────────────────────────────────────────────

const URGENCY_STYLES = {
    alta:  { badge: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",   dot: "bg-red-500",    gradient: "from-red-500/10 to-transparent" },
    media: { badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400", dot: "bg-amber-500", gradient: "from-amber-500/10 to-transparent" },
    baja:  { badge: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400", dot: "bg-violet-500", gradient: "from-violet-500/10 to-transparent" },
};

const URGENCY_LABELS = { alta: "URGENTE", media: "Oportunidad", baja: "Consejo" };

// ─── WhatsApp Bubble Preview ───────────────────────────────────────────────

const WhatsAppPreview: React.FC<{ message: string }> = ({ message }) => (
    <div className="rounded-2xl bg-[#ECE5DD] dark:bg-[#0D1117] p-3 mt-1">
        <div className="flex items-center gap-2 mb-2">
            <div className="h-7 w-7 rounded-full bg-emerald-500 flex items-center justify-center">
                <MessageCircle className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
                <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">Nilah IA · WhatsApp</p>
                <p className="text-[9px] text-gray-400">Mensaje automático de tu salón</p>
            </div>
        </div>
        <div className="relative ml-8">
            <div className="rounded-2xl rounded-tl-sm bg-white dark:bg-[#1A2028] px-3 py-2.5 shadow-sm">
                <p className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">{message}</p>
                <p className="text-[9px] text-gray-400 text-right mt-1">Ahora ✓✓</p>
            </div>
        </div>
    </div>
);

// ─── Lista de Clientas ─────────────────────────────────────────────────────

const ClientesList: React.FC<{ clientes: ClientePreview[]; signal: SmartSignal }> = ({ clientes, signal }) => {
    const [expanded, setExpanded] = useState(false);
    const visible = expanded ? clientes : clientes.slice(0, 3);
    const remaining = clientes.length - 3;

    if (!clientes.length) return null;

    return (
        <div className="mt-3">
            <div className="space-y-2">
                {visible.map((c, i) => (
                    <div key={i} className="flex items-center gap-2.5 rounded-xl bg-gray-50 dark:bg-white/5 px-3 py-2">
                        <div className="h-7 w-7 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                                {(c.nombre || "?").charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-800 dark:text-white truncate">{c.nombre || "Cliente"}</p>
                            <p className="text-[10px] text-gray-400 truncate">
                                {c.servicio || c.ultima_visita || c.cumpleanos || ""}
                                {c.dias ? ` · hace ${c.dias} días` : ""}
                                {c.hora ? ` · ${c.hora}` : ""}
                                {c.puntos ? ` · ${c.puntos} pts` : ""}
                            </p>
                        </div>
                        {c.fiabilidad && (
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${c.fiabilidad < 50 ? "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400" : "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"}`}>
                                {c.fiabilidad}pts
                            </span>
                        )}
                    </div>
                ))}
            </div>

            {remaining > 0 && (
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors"
                >
                    {expanded ? <><ChevronUp className="h-3.5 w-3.5" /> Ver menos</> : <><ChevronDown className="h-3.5 w-3.5" /> Ver {remaining} más</>}
                </button>
            )}
        </div>
    );
};

// ─── Dots de Navegación ────────────────────────────────────────────────────

const SignalDots: React.FC<{ total: number; active: number; onSelect: (i: number) => void }> = ({ total, active, onSelect }) => {
    if (total <= 1) return null;
    return (
        <div className="flex justify-center gap-1.5 pb-1">
            {Array.from({ length: total }).map((_, i) => (
                <button
                    key={i}
                    onClick={() => onSelect(i)}
                    className={`transition-all duration-200 rounded-full ${i === active ? "w-4 h-2 bg-violet-500" : "w-2 h-2 bg-gray-300 dark:bg-gray-600"}`}
                    aria-label={`Señal ${i + 1}`}
                />
            ))}
        </div>
    );
};

// ─── Drawer Principal ──────────────────────────────────────────────────────

interface SmartSignalDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onDismiss: (id: string) => void;
    activeIndex: number;
    setActiveIndex: (i: number) => void;
    totalSignals: number;
}

const SmartSignalDrawer: React.FC<SmartSignalDrawerProps> = ({
    isOpen, onClose, onDismiss, activeIndex, setActiveIndex, totalSignals
}) => {
    const navigate = useNavigate();
    const { signals } = useSmartSignals();
    const signal = signals[activeIndex];
    const bodyRef = useRef<HTMLDivElement>(null);

    // Bloquear scroll del body (técnica safe-area safe — no modifica geometría)
    useEffect(() => {
        if (isOpen) document.documentElement.classList.add('bottom-sheet-open');
        else document.documentElement.classList.remove('bottom-sheet-open');
        return () => { document.documentElement.classList.remove('bottom-sheet-open'); };
    }, [isOpen]);

    // Cerrar con Escape
    useEffect(() => {
        if (!isOpen) return;
        const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [isOpen, onClose]);

    const handlePan = (_: any, info: PanInfo) => {
        if (info.offset.y > 80) onClose();
    };

    const handleCTA = () => {
        if (!signal) return;
        if (signal.accion_tipo === "navigate") {
            navigate(signal.modulo_destino);
            onClose();
        } else if (signal.accion_tipo === "whatsapp" || signal.accion_tipo === "upgrade") {
            navigate(signal.modulo_destino);
            onClose();
        }
    };

    if (!signal) return null;

    const styles = URGENCY_STYLES[signal.urgencia];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                    />

                    {/* Bottom Sheet */}
                    <motion.div
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={{ top: 0, bottom: 0.4 }}
                        onDragEnd={handlePan}
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 32 }}
                        className="fixed inset-x-0 bottom-0 z-50 flex flex-col bg-white dark:bg-[#111827] rounded-t-3xl shadow-2xl max-h-[88vh] overflow-hidden sm:max-h-[80vh] sm:max-w-lg sm:mx-auto sm:rounded-3xl sm:bottom-6 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full"
                        style={{ touchAction: "pan-x" }}
                    >
                        {/* Handle */}
                        <div className="flex justify-center pt-3 pb-1 shrink-0">
                            <div className="h-1 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                        </div>

                        {/* Header con gradiente de urgencia */}
                        <div className={`shrink-0 px-5 pt-3 pb-4 bg-gradient-to-b ${styles.gradient}`}>
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                    <span className="text-3xl leading-none mt-0.5 shrink-0">{signal.emoji}</span>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${styles.badge}`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
                                                {URGENCY_LABELS[signal.urgencia]}
                                            </span>
                                            {signal.dinero_estimado > 0 && (
                                                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 rounded-full px-2 py-0.5">
                                                    💰 {signal.moneda} {Math.round(signal.dinero_estimado).toLocaleString()} en juego
                                                </span>
                                            )}
                                        </div>
                                        <h2 className="text-base font-black text-gray-900 dark:text-white leading-tight">{signal.titulo}</h2>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="shrink-0 h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                                >
                                    <X className="h-4 w-4 text-gray-500" />
                                </button>
                            </div>
                        </div>

                        {/* Scrollable body */}
                        <div ref={bodyRef} className="flex-1 overflow-y-auto px-5 pb-4 space-y-4 overscroll-contain">

                            {/* Diagnóstico */}
                            <div className="rounded-2xl bg-gray-50 dark:bg-white/5 p-4">
                                <div className="flex items-start gap-2">
                                    <Info className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{signal.descripcion_larga}</p>
                                </div>
                                {signal.conteo > 0 && (
                                    <div className="mt-3 flex items-center gap-1.5">
                                        <span className="text-2xl font-black text-gray-900 dark:text-white">{signal.conteo}</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {signal.tipo === "noshow_risk" ? "citas en riesgo" :
                                             signal.tipo === "encuesta_pendiente" ? "encuestas sin enviar" :
                                             signal.tipo === "horas_muertas" ? "días flojos detectados" :
                                             "clientas afectadas"}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Lista de clientas */}
                            {signal.clientes_preview && signal.clientes_preview.length > 0 && (
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">Clientas afectadas</p>
                                    <ClientesList clientes={signal.clientes_preview} signal={signal} />
                                </div>
                            )}

                            {/* Preview WhatsApp */}
                            {signal.whatsapp_preview && (
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">Preview del mensaje</p>
                                    <WhatsAppPreview message={signal.whatsapp_preview} />
                                </div>
                            )}
                        </div>

                        {/* Footer: CTAs */}
                        <div className="shrink-0 px-5 py-4 border-t border-gray-100 dark:border-white/5 space-y-2.5">
                            {/* Dots de navegación */}
                            <SignalDots total={totalSignals} active={activeIndex} onSelect={setActiveIndex} />

                            {/* CTA Principal */}
                            <button
                                onClick={handleCTA}
                                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-indigo-700 active:scale-[0.98] transition-all min-h-[50px]"
                            >
                                {signal.accion_tipo === "whatsapp" && <MessageCircle className="h-4 w-4 shrink-0" />}
                                {signal.accion_tipo === "navigate" && <ArrowRight className="h-4 w-4 shrink-0" />}
                                <span>{signal.accion_label}</span>
                            </button>

                            {/* Secundario: snooze / descartar */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onDismiss(signal.id)}
                                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors min-h-[44px]"
                                >
                                    <Clock className="h-3.5 w-3.5" />
                                    Ver en 48h
                                </button>
                                <button
                                    onClick={onClose}
                                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors min-h-[44px]"
                                >
                                    <X className="h-3.5 w-3.5" />
                                    Ahora no
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default SmartSignalDrawer;
