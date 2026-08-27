import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronUp, ChevronDown, RotateCcw, Settings2 } from "lucide-react";
import { WidgetConfig, WidgetMeta, WIDGET_CATALOG } from "../../hooks/useDashboardWidgets";

interface DashboardCustomizeDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    widgets: WidgetConfig[];
    onToggle: (id: string) => void;
    onMoveUp: (id: string) => void;
    onMoveDown: (id: string) => void;
    onReset: () => void;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string; bg: string }> = {
    operativo:   { label: "Operativo",   color: "text-blue-700 dark:text-blue-400",   bg: "bg-blue-50 dark:bg-blue-500/10" },
    clientes:    { label: "Clientes",    color: "text-rose-700 dark:text-rose-400",   bg: "bg-rose-50 dark:bg-rose-500/10" },
    crecimiento: { label: "Crecimiento", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
    equipo:      { label: "Equipo",      color: "text-violet-700 dark:text-violet-400",  bg: "bg-violet-50 dark:bg-violet-500/10" },
};

const WidgetRow: React.FC<{
    meta: WidgetMeta;
    config: WidgetConfig;
    isFirst: boolean;
    isLast: boolean;
    onToggle: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
}> = ({ meta, config, isFirst, isLast, onToggle, onMoveUp, onMoveDown }) => {
    const cat = CATEGORY_LABELS[meta.category];

    return (
        <div className={`flex items-center gap-3 rounded-2xl p-3 transition-all ${config.enabled ? "bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border shadow-sm" : "bg-gray-50 dark:bg-dark-bg border border-dashed border-gray-200 dark:border-dark-border opacity-60"}`}>
            {/* Emoji + Info */}
            <div className="flex-1 flex items-center gap-3 min-w-0">
                <span className="text-2xl shrink-0 leading-none">{meta.icon}</span>
                <div className="min-w-0">
                    <p className={`text-sm font-bold truncate ${config.enabled ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}`}>
                        {meta.label}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate leading-tight mt-0.5">{meta.description}</p>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1.5 shrink-0">
                {/* Up/Down */}
                <div className="flex flex-col gap-0.5">
                    <button
                        onClick={onMoveUp}
                        disabled={isFirst}
                        className="flex h-6 w-6 items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-90"
                        aria-label="Subir widget"
                    >
                        <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                        onClick={onMoveDown}
                        disabled={isLast}
                        className="flex h-6 w-6 items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-90"
                        aria-label="Bajar widget"
                    >
                        <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                </div>

                {/* Toggle switch */}
                <button
                    onClick={onToggle}
                    className={`relative h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${config.enabled ? "bg-violet-500" : "bg-gray-200 dark:bg-gray-700"}`}
                    aria-label={config.enabled ? "Desactivar widget" : "Activar widget"}
                    role="switch"
                    aria-checked={config.enabled}
                >
                    <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${config.enabled ? "translate-x-5.5" : "translate-x-0.5"}`}
                        style={{ transform: config.enabled ? "translateX(22px)" : "translateX(2px)" }}
                    />
                </button>
            </div>
        </div>
    );
};

const DashboardCustomizeDrawer: React.FC<DashboardCustomizeDrawerProps> = ({
    isOpen,
    onClose,
    widgets,
    onToggle,
    onMoveUp,
    onMoveDown,
    onReset,
}) => {
    // Cerrar con Escape
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [isOpen, onClose]);

    // Bloquear scroll del body cuando está abierto (técnica safe-area safe)
    useEffect(() => {
        if (isOpen) {
            document.documentElement.classList.add('bottom-sheet-open');
        } else {
            document.documentElement.classList.remove('bottom-sheet-open');
        }
        return () => { document.documentElement.classList.remove('bottom-sheet-open'); };
    }, [isOpen]);

    // Construir lookup de meta por id
    const metaById = Object.fromEntries(WIDGET_CATALOG.map(m => [m.id, m]));

    // Agrupar widgets por categoría (manteniendo el orden del usuario)
    const categories = ["operativo", "clientes", "crecimiento", "equipo"] as const;

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
                        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                    />

                    {/* Drawer — bottom sheet en móvil, panel derecho en desktop */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed inset-x-0 bottom-0 z-50 flex flex-col bg-white dark:bg-dark-card rounded-t-3xl shadow-2xl max-h-[85vh] sm:inset-x-auto sm:inset-y-0 sm:right-0 sm:rounded-none sm:rounded-l-3xl sm:w-96 sm:max-h-none"
                    >
                        {/* Handle bar — solo visible en móvil */}
                        <div className="flex justify-center pt-3 pb-1 sm:hidden">
                            <div className="h-1 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-dark-border shrink-0">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-500/10">
                                <Settings2 className="h-4.5 w-4.5 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">Personalizar Dashboard</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500">Activa, desactiva y reordena tus widgets</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="ml-auto flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                                aria-label="Cerrar"
                            >
                                <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>

                        {/* Scrollable body */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
                            {categories.map(cat => {
                                const catWidgets = widgets.filter(w => metaById[w.id]?.category === cat);
                                if (catWidgets.length === 0) return null;
                                const catMeta = CATEGORY_LABELS[cat];
                                return (
                                    <div key={cat}>
                                        <div className="flex items-center gap-2 mb-2.5 px-1">
                                            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest ${catMeta.bg} ${catMeta.color}`}>
                                                {catMeta.label}
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            {catWidgets.map((wConfig, idx) => {
                                                const meta = metaById[wConfig.id];
                                                if (!meta) return null;
                                                const globalIdx = widgets.findIndex(w => w.id === wConfig.id);
                                                return (
                                                    <WidgetRow
                                                        key={wConfig.id}
                                                        meta={meta}
                                                        config={wConfig}
                                                        isFirst={globalIdx === 0}
                                                        isLast={globalIdx === widgets.length - 1}
                                                        onToggle={() => onToggle(wConfig.id)}
                                                        onMoveUp={() => onMoveUp(wConfig.id)}
                                                        onMoveDown={() => onMoveDown(wConfig.id)}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="shrink-0 px-4 py-4 border-t border-gray-100 dark:border-dark-border">
                            <button
                                onClick={onReset}
                                className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all active:scale-[0.98] min-h-[44px]"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Restablecer valores por defecto
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default DashboardCustomizeDrawer;
