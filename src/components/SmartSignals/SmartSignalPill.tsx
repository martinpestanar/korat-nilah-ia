/**
 * SmartSignalPill
 * 
 * Píldora flotante mobile-first que aparece en todos los módulos.
 * Posición: encima del BottomNavBar en móvil, junto al CopilotButton en desktop.
 * 
 * UX:
 * - Pulso sutil cada 4s para llamar la atención sin ser invasivo
 * - Badge numérico si hay más de 1 señal activa
 * - Tap → abre SmartSignalDrawer
 * - Aparece con animación spring desde abajo
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";
import { useSmartSignals } from "../../hooks/useSmartSignals";
import SmartSignalDrawer from "./SmartSignalDrawer";
import { useAuth } from "../../context/AuthContext";

const URGENCY_COLORS = {
    alta:  { bg: "from-red-500 to-rose-600",    ring: "ring-red-400",    text: "text-white", shadow: "shadow-red-500/40" },
    media: { bg: "from-amber-500 to-orange-500", ring: "ring-amber-400",  text: "text-white", shadow: "shadow-amber-500/40" },
    baja:  { bg: "from-violet-500 to-purple-600", ring: "ring-violet-400", text: "text-white", shadow: "shadow-violet-500/40" },
};

const SmartSignalPill: React.FC = () => {
    const { isAdmin } = useAuth();
    const { activeSignal, totalSignals, dismissSignal, activeIndex, setActiveIndex, isLoading } = useSmartSignals();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isPulsing, setIsPulsing] = useState(false);

    // Pulso cada 4 segundos para llamar la atención
    useEffect(() => {
        if (!activeSignal) return;
        const interval = setInterval(() => {
            setIsPulsing(true);
            setTimeout(() => setIsPulsing(false), 800);
        }, 4000);
        return () => clearInterval(interval);
    }, [activeSignal]);

    if (!isAdmin || isLoading || !activeSignal) return null;

    const colors = URGENCY_COLORS[activeSignal.urgencia];
    const hasMoneyAtStake = activeSignal.dinero_estimado > 0;

    return (
        <>
            <AnimatePresence>
                {!isDrawerOpen && (
                    <motion.button
                        initial={{ opacity: 0, y: 60, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 60, scale: 0.8 }}
                        transition={{ type: "spring", stiffness: 320, damping: 28 }}
                        onClick={() => setIsDrawerOpen(true)}
                        aria-label={`Señal de negocio: ${activeSignal.titulo}`}
                        className={`
                            fixed z-40
                            bottom-[76px] right-3
                            sm:bottom-6 sm:right-[5.5rem]
                            flex items-center gap-2
                            rounded-full px-3.5 py-2.5 sm:px-4 sm:py-2.5
                            bg-gradient-to-r ${colors.bg}
                            shadow-xl ${colors.shadow}
                            ${isPulsing ? `ring-2 ring-offset-2 ${colors.ring}` : ""}
                            transition-shadow duration-200
                            min-h-[44px]
                            active:scale-95
                        `}
                        style={{ willChange: "transform" }}
                    >
                        {/* Emoji */}
                        <span className="text-lg leading-none shrink-0">{activeSignal.emoji}</span>

                        {/* Texto — visible solo en sm+ o si cabe */}
                        <div className="flex flex-col leading-tight max-w-[160px] sm:max-w-[220px] text-left">
                            <span className={`text-[11px] font-black uppercase tracking-wider ${colors.text} opacity-80`}>
                                {activeSignal.urgencia === "alta" ? "URGENTE" : activeSignal.urgencia === "media" ? "Oportunidad" : "Consejo"}
                            </span>
                            <span className={`text-xs sm:text-sm font-bold ${colors.text} truncate`}>
                                {hasMoneyAtStake
                                    ? `${activeSignal.moneda} ${Math.round(activeSignal.dinero_estimado).toLocaleString()} en juego`
                                    : activeSignal.descripcion_corta.slice(0, 40)}
                            </span>
                        </div>

                        {/* Badge contador */}
                        {totalSignals > 1 && (
                            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/25 text-[10px] font-black text-white shrink-0">
                                {totalSignals}
                            </span>
                        )}
                    </motion.button>
                )}
            </AnimatePresence>

            <SmartSignalDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onDismiss={(id) => {
                    dismissSignal(id);
                    setIsDrawerOpen(false);
                }}
                activeIndex={activeIndex}
                setActiveIndex={setActiveIndex}
                totalSignals={totalSignals}
            />
        </>
    );
};

export default SmartSignalPill;
