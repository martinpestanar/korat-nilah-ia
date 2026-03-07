import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    /** Altura máxima del sheet como porcentaje de la ventana. Default: 92% */
    maxHeight?: string;
}

/**
 * BottomSheet — componente iOS nativo
 *
 * Se desliza desde abajo hacia arriba con spring animation.
 * Incluye handle bar (barra gris) y backdrop con blur.
 * Respeta safe-area-inset-bottom del notch del iPhone.
 */
export const BottomSheet: React.FC<BottomSheetProps> = ({
    isOpen,
    onClose,
    title,
    children,
    maxHeight = '92vh',
}) => {
    const sheetRef = useRef<HTMLDivElement>(null);

    // Cerrar con Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    // Prevenir scroll del body cuando está abierto
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:items-center sm:justify-center">
            {/* ── Backdrop ─────────────────────────── */}
            <div
                className="absolute inset-0 bg-black/50 animate-fade-in"
                style={{ backdropFilter: 'blur(4px)' }}
                onClick={onClose}
            />

            {/* ── Sheet Panel ──────────────────────── */}
            <div
                ref={sheetRef}
                className="
          relative z-10 w-full rounded-t-3xl bg-white dark:bg-dark-card
          shadow-2xl animate-slide-up
          sm:max-w-lg sm:rounded-2xl sm:mb-0
        "
                style={{
                    maxHeight,
                    paddingBottom: 'env(safe-area-inset-bottom, 1rem)',
                }}
            >
                {/* ── Handle Bar (solo móvil, al estilo iOS) */}
                <div className="flex justify-center pt-3 pb-1 sm:hidden">
                    <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
                </div>

                {/* ── Header del Sheet ────────────────── */}
                {title && (
                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-dark-border px-5 py-3">
                        <h2 className="text-base font-black text-gray-900 dark:text-white">{title}</h2>
                        <button
                            onClick={onClose}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 dark:bg-dark-border text-gray-500 dark:text-gray-400 hover:bg-gray-200 transition-colors text-sm font-bold"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* ── Contenido scrolleable ────────────── */}
                <div className="overflow-y-auto" style={{ maxHeight: title ? 'calc(92vh - 80px)' : maxHeight }}>
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default BottomSheet;
