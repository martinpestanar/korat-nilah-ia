import React, { useEffect } from 'react';
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
}

/**
 * Primitivo Maestro Móvil: Bottom Sheet (Drawer)
 * ────────────────────────────────────────────────────────
 * Panel que se desliza desde abajo, estándar de 2026 para
 * reemplazar modales centrados en dispositivos móviles.
 * 
 * - Usa AnimatePresence para animaciones fluidas.
 * - Soporta Swipe-to-dismiss (Arrastrar hacia abajo para cerrar).
 * - Respeta safe-area-inset-bottom del notch del iPhone.
 */
export const BottomSheet: React.FC<BottomSheetProps> = ({
    isOpen,
    onClose,
    title,
    children,
    maxHeight = '92dvh',
    showCloseButton = true,
    headerActions,
}) => {
    // Cerrar con Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    // Bloquear el scroll del body dinámicamente
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:items-center sm:justify-center">
                    {/* ── Backdrop Blur oscuro ─────────────────────────── */}
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

                    {/* ── Panel Deslizable ──────────────────────── */}
                    <motion.div
                        key="bottom-sheet-panel"
                        initial={{ y: '100%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        drag="y"
                        dragConstraints={{ top: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(_, info) => {
                            // Si se arrastra hacia abajo más de 80px o muy rápido, se cierra
                            if (info.offset.y > 80 || info.velocity.y > 400) {
                                onClose();
                            }
                        }}
                        className="relative z-[105] flex w-full flex-col rounded-t-3xl sm:rounded-2xl bg-white dark:bg-dark-card shadow-2xl overflow-hidden pb-safe sm:max-w-lg sm:mb-0"
                        style={{
                            maxHeight,
                        }}
                    >
                        {/* Grab Handle (Píldora superior) */}
                        <div 
                            className="flex w-full cursor-grab active:cursor-grabbing flex-col items-center justify-center pt-3 pb-2 sm:hidden"
                            style={{ touchAction: 'none' }} // Exclusivo de framer-motion
                        >
                            <div className="h-1.5 w-12 rounded-full bg-gray-300 dark:bg-gray-600 transition-colors hover:bg-gray-400 dark:hover:bg-white/40" />
                        </div>

                        {/* Header del Sheet */}
                        {(title || showCloseButton || headerActions) && (
                            <div className="flex items-center justify-between border-b border-gray-100 dark:border-dark-border px-5 py-3">
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

                        {/* Contenido scrolleable (el usuario usa overscroll-behavior-y: contain) */}
                        <div 
                            className="flex-1 overflow-y-auto px-5 pb-8"
                            style={{ overscrollBehaviorY: 'contain' }}
                        >
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default BottomSheet;
