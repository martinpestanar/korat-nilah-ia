import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    /** Altura máxima del sheet como porcentaje de la ventana. Default: 92dvh */
    maxHeight?: string;
    showCloseButton?: boolean;
    headerActions?: React.ReactNode;
    /**
     * Si true, el contenedor interno NO tendrá overflow-y-auto.
     * Úsalo cuando el children ya gestiona su propio scroll internamente
     * (ej: modales complejos con header+body+footer propios).
     */
    noScroll?: boolean;
}

/**
 * Primitivo Maestro Móvil: Bottom Sheet (Drawer) — v2
 * ────────────────────────────────────────────────────────
 * Fixes v2:
 * 1. drag="y" ahora solo se activa desde el grab handle, no desde el panel completo.
 *    Esto evita que el scroll interno "active" el drag y encoja el modal.
 * 2. El pb-safe se aplica SOLO al footer (wrapper externo del children),
 *    no al panel completo, para evitar el doble padding en los botones.
 * 3. El contenedor interno usa flex-col con altura fija para que el scroll
 *    sea contenido y los botones nunca queden escondidos.
 */
export const BottomSheet: React.FC<BottomSheetProps> = ({
    isOpen,
    onClose,
    title,
    children,
    maxHeight = '92dvh',
    showCloseButton = true,
    headerActions,
    noScroll = false,
}) => {
    const panelRef = useRef<HTMLDivElement>(null);
    const dragStartY = useRef(0);
    const isDragging = useRef(false);

    // Cerrar con Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    // Bloquear el scroll del body pero permitir scroll táctil DENTRO del sheet
    useEffect(() => {
        if (isOpen) {
            // Solo bloqueamos position del body, no overflow (para que el scroll interno funcione)
            const scrollY = window.scrollY;
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';
        } else {
            const scrollY = document.body.style.top;
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            if (scrollY) window.scrollTo(0, -parseInt(scrollY || '0', 10));
        }
        return () => {
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
        };
    }, [isOpen]);

    // Swipe-to-dismiss manual desde el grab handle (evita conflicto con scroll)
    const handleHandleTouchStart = (e: React.TouchEvent) => {
        dragStartY.current = e.touches[0].clientY;
        isDragging.current = true;
    };
    const handleHandleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging.current || !panelRef.current) return;
        const delta = e.touches[0].clientY - dragStartY.current;
        if (delta > 0) {
            panelRef.current.style.transform = `translateY(${delta}px)`;
            panelRef.current.style.transition = 'none';
        }
    };
    const handleHandleTouchEnd = (e: React.TouchEvent) => {
        if (!isDragging.current || !panelRef.current) return;
        isDragging.current = false;
        const delta = e.changedTouches[0].clientY - dragStartY.current;
        panelRef.current.style.transform = '';
        panelRef.current.style.transition = '';
        if (delta > 80) {
            onClose();
        }
    };

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:items-center sm:justify-center">
                    {/* ── Backdrop ─────────────────────────── */}
                    <motion.div
                        key="bottom-sheet-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                        style={{ touchAction: 'none' }}
                    />

                    {/* ── Panel ──────────────────────────── */}
                    <motion.div
                        ref={panelRef}
                        key="bottom-sheet-panel"
                        initial={{ y: '100%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                        className="relative z-[105] w-full flex flex-col rounded-t-3xl sm:rounded-2xl bg-white dark:bg-dark-card shadow-2xl sm:max-w-lg sm:mb-0"
                        style={{
                            maxHeight,
                            // La altura fija asegura que flex-col funcione correctamente
                            // y que el footer siempre sea visible
                            height: maxHeight,
                        }}
                    >
                        {/* Grab Handle — ÚNICO punto de swipe-to-dismiss */}
                        <div
                            className="flex-shrink-0 flex w-full cursor-grab active:cursor-grabbing flex-col items-center justify-center pt-3 pb-1 sm:hidden select-none"
                            style={{ touchAction: 'none' }}
                            onTouchStart={handleHandleTouchStart}
                            onTouchMove={handleHandleTouchMove}
                            onTouchEnd={handleHandleTouchEnd}
                        >
                            <div className="h-1.5 w-12 rounded-full bg-gray-300 dark:bg-gray-600" />
                        </div>

                        {/* Header del Sheet (opcional) */}
                        {(title || showCloseButton || headerActions) && (
                            <div className="flex-shrink-0 flex items-center justify-between border-b border-gray-100 dark:border-dark-border px-5 py-3">
                                {title ? (
                                    <h2 className="text-base font-black text-gray-900 dark:text-white">{title}</h2>
                                ) : <div />}

                                <div className="flex items-center gap-2">
                                    {headerActions}
                                    {showCloseButton && (
                                        <button
                                            onClick={onClose}
                                            className="flex h-11 w-11 items-center justify-center rounded-full bg-transparent text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-border active:scale-95 transition-all"
                                            aria-label="Cerrar panel"
                                        >
                                            <X size={20} strokeWidth={2.5} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Contenido — flex-1 + overflow-y-auto para scroll contenido */}
                        <div
                            className={`flex-1 min-h-0 ${noScroll ? 'overflow-hidden flex flex-col' : 'overflow-y-auto overscroll-contain'}`}
                            style={noScroll ? undefined : {
                                WebkitOverflowScrolling: 'touch',
                            }}
                        >
                            {children}
                        </div>

                        {/* Safe area bottom — sólo aquí, una sola vez */}
                        <div
                            className="flex-shrink-0"
                            style={{ height: 'env(safe-area-inset-bottom, 0px)' }}
                        />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default BottomSheet;
