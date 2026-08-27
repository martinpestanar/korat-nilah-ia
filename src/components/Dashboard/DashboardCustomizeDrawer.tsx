import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronUp, ChevronDown, RotateCcw, Settings2, Check, Sparkles } from "lucide-react";
import { WidgetConfig, WidgetMeta, WidgetTabCategory, WIDGET_CATALOG } from "../../hooks/useDashboardWidgets";

interface DashboardCustomizeDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    widgets: WidgetConfig[];
    initialCategory?: WidgetTabCategory;
    onToggle: (id: string) => void;
    onMoveUp: (id: string, groupCategory?: WidgetTabCategory) => void;
    onMoveDown: (id: string, groupCategory?: WidgetTabCategory) => void;
    onReset: () => void;
}

const CATEGORY_TABS: { id: WidgetTabCategory; label: string; icon: string; badgeBg: string; badgeColor: string }[] = [
    { id: "hoy",      label: "Hoy",      icon: "⚡", badgeBg: "bg-blue-50 dark:bg-blue-500/10",    badgeColor: "text-blue-700 dark:text-blue-400" },
    { id: "finanzas", label: "Finanzas", icon: "💰", badgeBg: "bg-emerald-50 dark:bg-emerald-500/10", badgeColor: "text-emerald-700 dark:text-emerald-400" },
    { id: "clientes", label: "Clientas", icon: "👥", badgeBg: "bg-rose-50 dark:bg-rose-500/10",   badgeColor: "text-rose-700 dark:text-rose-400" },
];

const WidgetRow: React.FC<{
    meta: WidgetMeta;
    config: WidgetConfig;
    positionIndex: number;
    isFirst: boolean;
    isLast: boolean;
    onToggle: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
}> = ({ meta, config, positionIndex, isFirst, isLast, onToggle, onMoveUp, onMoveDown }) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className={`flex items-center gap-2.5 rounded-2xl p-3 transition-all ${
                config.enabled
                    ? "bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border shadow-xs"
                    : "bg-gray-50/70 dark:bg-dark-bg/60 border border-dashed border-gray-200 dark:border-dark-border opacity-50"
            }`}
        >
            {/* Position Badge & Icon */}
            <div className="flex items-center gap-2 shrink-0">
                <span
                    className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-black transition-colors ${
                        config.enabled
                            ? "bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                    }`}
                >
                    {positionIndex + 1}º
                </span>
                <span className="text-xl leading-none">{meta.icon}</span>
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
                <p className={`text-xs sm:text-sm font-bold truncate ${config.enabled ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500 line-through"}`}>
                    {meta.label}
                </p>
                <p className="text-[10px] sm:text-[11px] text-gray-400 dark:text-gray-500 truncate leading-tight mt-0.5">
                    {meta.description}
                </p>
            </div>

            {/* Controls: Up/Down Arrows + Switch */}
            <div className="flex items-center gap-1 shrink-0">
                {/* Up/Down buttons */}
                <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-dark-bg p-0.5 rounded-xl">
                    <button
                        type="button"
                        onClick={onMoveUp}
                        disabled={isFirst}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 hover:text-violet-600 hover:bg-white dark:hover:bg-dark-card disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all active:scale-85"
                        aria-label={`Subir ${meta.label}`}
                        title="Mover arriba"
                    >
                        <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={onMoveDown}
                        disabled={isLast}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 hover:text-violet-600 hover:bg-white dark:hover:bg-dark-card disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all active:scale-85"
                        aria-label={`Bajar ${meta.label}`}
                        title="Mover abajo"
                    >
                        <ChevronDown className="h-4 w-4" />
                    </button>
                </div>

                {/* Toggle switch */}
                <button
                    type="button"
                    onClick={onToggle}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                        config.enabled ? "bg-violet-600 dark:bg-violet-500" : "bg-gray-200 dark:bg-gray-700"
                    }`}
                    aria-label={config.enabled ? "Desactivar widget" : "Activar widget"}
                    role="switch"
                    aria-checked={config.enabled}
                >
                    <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            config.enabled ? "translate-x-5" : "translate-x-0"
                        }`}
                    />
                </button>
            </div>
        </motion.div>
    );
};

const DashboardCustomizeDrawer: React.FC<DashboardCustomizeDrawerProps> = ({
    isOpen,
    onClose,
    widgets,
    initialCategory = "hoy",
    onToggle,
    onMoveUp,
    onMoveDown,
    onReset,
}) => {
    const [selectedTab, setSelectedTab] = useState<WidgetTabCategory>(initialCategory);

    // Sincronizar tab inicial cuando se abre el drawer
    useEffect(() => {
        if (isOpen) {
            setSelectedTab(initialCategory);
        }
    }, [isOpen, initialCategory]);

    // Cerrar con Escape
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [isOpen, onClose]);

    // Bloquear scroll del body cuando está abierto
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

    // Filtrar widgets que pertenecen a la pestaña seleccionada, manteniendo el orden de usuario
    const categoryWidgets = widgets.filter(w => metaById[w.id]?.category === selectedTab);

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
                        className="fixed inset-x-0 bottom-0 z-50 flex flex-col bg-white dark:bg-dark-card rounded-t-3xl shadow-2xl max-h-[90vh] sm:inset-x-auto sm:inset-y-0 sm:right-0 sm:rounded-none sm:rounded-l-3xl sm:w-[420px] sm:max-h-none"
                    >
                        {/* Handle bar — solo visible en móvil */}
                        <div className="flex justify-center pt-3 pb-1 sm:hidden">
                            <div className="h-1.5 w-12 rounded-full bg-gray-300 dark:bg-gray-700" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-dark-border shrink-0">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-500/10">
                                <Settings2 className="h-4.5 w-4.5 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">Organizar Dashboard</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500">Mueve con ▲ ▼ y activa tus módulos</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="ml-auto flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                                aria-label="Cerrar"
                            >
                                <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>

                        {/* Category Segmented Tabs */}
                        <div className="px-5 pt-3 pb-1 shrink-0">
                            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                                Sección a organizar:
                            </p>
                            <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-100/80 dark:bg-dark-bg rounded-xl">
                                {CATEGORY_TABS.map(tab => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setSelectedTab(tab.id)}
                                        className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
                                            selectedTab === tab.id
                                                ? "bg-white dark:bg-violet-600 text-gray-900 dark:text-white shadow-xs"
                                                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                                        }`}
                                    >
                                        <span>{tab.icon}</span>
                                        <span>{tab.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Scrollable list with Layout Animation */}
                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
                            <AnimatePresence initial={false}>
                                {categoryWidgets.map((wConfig, idx) => {
                                    const meta = metaById[wConfig.id];
                                    if (!meta) return null;
                                    return (
                                        <WidgetRow
                                            key={wConfig.id}
                                            meta={meta}
                                            config={wConfig}
                                            positionIndex={idx}
                                            isFirst={idx === 0}
                                            isLast={idx === categoryWidgets.length - 1}
                                            onToggle={() => onToggle(wConfig.id)}
                                            onMoveUp={() => onMoveUp(wConfig.id, selectedTab)}
                                            onMoveDown={() => onMoveDown(wConfig.id, selectedTab)}
                                        />
                                    );
                                })}
                            </AnimatePresence>
                        </div>

                        {/* Footer */}
                        <div className="shrink-0 px-4 py-3.5 border-t border-gray-100 dark:border-dark-border bg-gray-50/50 dark:bg-dark-card/50 flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onReset}
                                className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg px-3.5 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 transition-all active:scale-95 min-h-[40px]"
                                title="Volver al orden recomendado"
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                                <span>Restablecer</span>
                            </button>

                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 text-xs font-bold shadow-sm transition-all active:scale-95 min-h-[40px]"
                            >
                                <Check className="h-4 w-4" />
                                <span>Listo, guardar</span>
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default DashboardCustomizeDrawer;
