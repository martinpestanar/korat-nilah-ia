/**
 * WidgetHelper
 *
 * Icono ? que explica el propósito de un widget al usuario.
 * — En desktop: muestra un tooltip al hover
 * — En mobile: abre un BottomSheet (iOS-style)
 */

import React, { useState, useRef } from 'react';
import { HelpCircle, Lightbulb, X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface WidgetHelperProps {
    /** Título del widget */
    title: string;
    /** Qué significa (traducción al "cristiano") */
    what: string;
    /** Para qué sirve (beneficio real para el salón) */
    why: string;
    /** Tip o acción para mejorar esta métrica (opcional) */
    tip?: string;
    /** Tamaño del ícono */
    iconSize?: 'sm' | 'md';
    /** ID único para rastrear si ya se vio la ayuda (para isPulsing) */
    id?: string;
    /** Si es true y no se ha visto, muestra un pulso animado para atraer atención */
    isPulsing?: boolean;
}

const WidgetHelper: React.FC<WidgetHelperProps> = ({
    title,
    what,
    why,
    tip,
    iconSize = 'sm',
    id,
    isPulsing = false,
}) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const [showSheet, setShowSheet] = useState(false);

    // Pulse logic
    const pulseKey = id ? `korat_seen_help_${id}` : null;
    const [hasSeenPulse, setHasSeenPulse] = useState(() => {
        if (!pulseKey) return true;
        return localStorage.getItem(pulseKey) === 'true';
    });

    const buttonRef = useRef<HTMLButtonElement>(null);
    const iconPx = iconSize === 'sm' ? 14 : 16;

    const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 640;

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();

        // Mark as seen
        if (pulseKey && !hasSeenPulse) {
            localStorage.setItem(pulseKey, 'true');
            setHasSeenPulse(true);
        }

        if (isMobile()) {
            setShowSheet(true);
        } else {
            setShowTooltip(prev => !prev);
        }
    };

    const handleMouseEnter = () => {
        if (!isMobile()) setShowTooltip(true);
    };

    const handleMouseLeave = () => {
        if (!isMobile()) setShowTooltip(false);
    };

    const sheetContent = (
        <div
            className="fixed inset-0 z-[200] flex flex-col justify-end animate-fade-in"
            onClick={() => setShowSheet(false)}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" style={{ backdropFilter: 'blur(4px)' }} />

            {/* Sheet */}
            <div
                className="relative z-10 w-full rounded-t-3xl bg-white dark:bg-dark-card shadow-2xl animate-slide-up"
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 1rem)' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-1">
                    <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-dark-border">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                            <HelpCircle size={16} className="text-violet-600 dark:text-violet-400" />
                        </div>
                        <h3 className="font-black text-gray-900 dark:text-white text-base">{title}</h3>
                    </div>
                    <button
                        onClick={() => setShowSheet(false)}
                        className="w-8 h-8 rounded-full bg-gray-100 dark:bg-dark-border flex items-center justify-center text-gray-500"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Content */}
                <div className="px-5 py-4 space-y-4">
                    {/* Qué es */}
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-sm">🤔</span>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">¿Qué significa?</p>
                            <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{what}</p>
                        </div>
                    </div>

                    {/* Para qué sirve */}
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-sm">💡</span>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">¿Para qué te sirve?</p>
                            <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{why}</p>
                        </div>
                    </div>

                    {/* Tip opcional */}
                    {tip && (
                        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
                            <Lightbulb size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-amber-700 dark:text-amber-300">{tip}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Trigger button */}
            <div className="relative inline-flex">
                <button
                    ref={buttonRef}
                    onClick={handleClick}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    className="flex items-center justify-center w-5 h-5 rounded-full text-gray-400 hover:text-violet-500 dark:text-gray-600 dark:hover:text-violet-400 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-400/50 focus:ring-offset-1 relative"
                    aria-label={`Ayuda: ${title}`}
                >
                    <HelpCircle size={iconPx} className="relative z-10" />
                    {/* Pulsing ring */}
                    {isPulsing && !hasSeenPulse && (
                        <div className="absolute inset-0 rounded-full border-2 border-violet-400 dark:border-violet-500 animate-ping opacity-75"></div>
                    )}
                </button>

                {/* Desktop Tooltip */}
                {showTooltip && (
                    <div
                        className="hidden sm:block absolute z-50 bottom-7 left-1/2 -translate-x-1/2 w-72 animate-scale-in"
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        <div className="bg-white dark:bg-[#1E1E2E] border border-gray-200 dark:border-violet-900/50 rounded-2xl shadow-xl p-4 space-y-3">
                            {/* Arrow */}
                            <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-[#1E1E2E] border-b border-r border-gray-200 dark:border-violet-900/50"
                                style={{ transform: 'translateX(-50%) rotate(45deg)' }}
                            />

                            <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-white/10">
                                <div className="w-6 h-6 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                                    <HelpCircle size={12} className="text-violet-600 dark:text-violet-400" />
                                </div>
                                <p className="font-black text-gray-900 dark:text-white text-sm">{title}</p>
                            </div>

                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">¿Qué es?</p>
                                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{what}</p>
                            </div>

                            <div>
                                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1">¿Para qué sirve?</p>
                                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{why}</p>
                            </div>

                            {tip && (
                                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                                    <p className="text-xs text-amber-700 dark:text-amber-300">💡 {tip}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile BottomSheet via portal */}
            {showSheet && typeof document !== 'undefined' && createPortal(sheetContent, document.body)}
        </>
    );
};

export default WidgetHelper;
