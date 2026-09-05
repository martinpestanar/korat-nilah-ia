import React, { useState } from "react";
import DashboardStats from "../components/Dashboard/DashboardStats";
import FinancialFlowChart from "../components/Dashboard/FinancialFlowChart";
import OracleCard from "../components/Dashboard/OracleCard";
import ProfitHeatmap from "../components/Dashboard/ProfitHeatmap";
import RevenueChart from "../components/Dashboard/RevenueChart";
import NilahImpactWidget from "../components/Dashboard/NilahImpactWidget";
import OperativaWidget from "../components/Dashboard/OperativaWidget";
import MaintenanceRemindersWidget from "../components/Dashboard/MaintenanceRemindersWidget";
import StaffWeeklyRanking from "../components/Dashboard/StaffWeeklyRanking";
import ServicePopularityChart from "../components/Dashboard/ServicePopularityChart";
import DailyBriefingModal from "../components/Dashboard/DailyBriefingModal";
import NilahEveningSummary from "../components/Dashboard/NilahEveningSummary";
import AtRiskClientsWidget from "../components/Dashboard/AtRiskClientsWidget";
import RetentionIntelligenceWidget from "../components/Dashboard/RetentionIntelligenceWidget";
import GrowthFinancialWidget from "../components/Dashboard/GrowthFinancialWidget";
import GrowthClientsWidget from "../components/Dashboard/GrowthClientsWidget";
import GrowthOperationalWidget from "../components/Dashboard/GrowthOperationalWidget";
import DashboardCustomizeDrawer from "../components/Dashboard/DashboardCustomizeDrawer";
import KnowledgeCenter from "../components/KnowledgeBase/KnowledgeCenter";
import InsightSparkle from "../components/Copilot/InsightSparkle";
import { useAuth } from "../context/AuthContext";
import { useDashboardData } from "../context/DashboardDataContext";
import { useDailyBriefing } from "../hooks/useDailyBriefing";
import { useCopilot } from "../context/CopilotContext";
import { useDashboardWidgets } from "../hooks/useDashboardWidgets";
import { useNavigate } from "react-router-dom";
import { RefreshCw, AlertCircle, Sparkles, Moon, SlidersHorizontal, ArrowUpDown, CheckCircle2, ChevronRight, Calendar, Users, X } from "lucide-react";

// ===========================================
// Dashboard Header
// ===========================================

interface DashboardHeaderProps {
    onOpenAcademy: () => void;
    onOpenCustomize: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    onOpenAcademy,
    onOpenCustomize,
}) => {
    const { isAdmin, user } = useAuth();
    const { isLoading, lastUpdate, refresh, error } = useDashboardData();

    return (
        <div className="flex items-center justify-between gap-2">
            <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                    <span>{isAdmin ? "📊 Dashboard" : "📋 Operativo"}</span>
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Bienvenida, <span className="font-semibold text-primary">{user?.name || "Dueña"}</span>
                    {lastUpdate && (
                        <span className="hidden sm:inline text-gray-400 dark:text-gray-500">
                            {" "}· {lastUpdate.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                    )}
                </p>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2 shrink-0">
                {error && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Error</span>
                    </span>
                )}

                {/* Academy */}
                <button
                    id="tour-academy"
                    onClick={onOpenAcademy}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all shadow-xs active:scale-95"
                    title="Nilah Academy: Guías y tácticas"
                >
                    <span className="text-sm leading-none">🎓</span>
                    <span className="hidden sm:inline">Academy</span>
                </button>

                {/* Botón Organizar PROMINENTE */}
                <button
                    onClick={onOpenCustomize}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-500/15 hover:bg-violet-100 dark:hover:bg-violet-500/25 border border-violet-200/90 dark:border-violet-700/60 rounded-xl transition-all shadow-xs active:scale-95"
                    title="Organizar orden y visibilidad de los widgets"
                >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
                    <span>Organizar</span>
                </button>

                {/* Refresh */}
                <button
                    onClick={() => refresh(true)}
                    disabled={isLoading}
                    className="flex h-9 w-9 items-center justify-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl border border-gray-200 dark:border-dark-border transition-all disabled:opacity-50 active:scale-95 shrink-0"
                    title="Actualizar datos"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-primary" : ""}`} />
                </button>
            </div>
        </div>
    );
};

// ===========================================
// Dashboard Content con Pestañas Dinámicas
// ===========================================

type DashboardTab = "hoy" | "finanzas" | "clientes";

interface DashboardContentProps {
    onOpenAcademy: () => void;
}

const DashboardContent: React.FC<DashboardContentProps> = ({ onOpenAcademy }) => {
    const { isAdmin, isPro, user, hasSaaSFeature } = useAuth();
    const { clients, appointments } = useDashboardData();
    const navigate = useNavigate();
    const { shouldShow, briefingType, dismissMorning, dismissEvening, streakDays, showMorning, showEvening } = useDailyBriefing();
    const { openCopilot } = useCopilot();
    const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
    const [isGuideDismissed, setIsGuideDismissed] = useState<boolean>(() => {
        try {
            return localStorage.getItem("nilah_quickstart_dismissed") === "true";
        } catch {
            return false;
        }
    });

    const hasAppts = (appointments || []).length > 0;
    const hasClients = (clients || []).length > 0;
    const showQuickStart = !isGuideDismissed && (!hasAppts || !hasClients);

    const handleDismissGuide = () => {
        setIsGuideDismissed(true);
        try {
            localStorage.setItem("nilah_quickstart_dismissed", "true");
        } catch {}
    };

    // Pestaña activa persistida en localStorage
    const [activeTab, setActiveTab] = useState<DashboardTab>(() => {
        try {
            return (localStorage.getItem("nilah_dashboard_tab") as DashboardTab) || "hoy";
        } catch {
            return "hoy";
        }
    });

    const handleTabChange = (tab: DashboardTab) => {
        setActiveTab(tab);
        try {
            localStorage.setItem("nilah_dashboard_tab", tab);
        } catch {}
    };

    const {
        widgets,
        toggleWidget,
        moveWidgetUp,
        moveWidgetDown,
        resetWidgets,
    } = useDashboardWidgets(user?.email);

    // Helper para envolver widget en contenedor consistente
    const WidgetShell: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
        <div className={`animate-widget-enter ${className}`}>{children}</div>
    );

    // Listas de widgets ordenadas dinámicamente según la preferencia del usuario
    const hoyWidgetOrder = widgets.filter(w => ["operativa", "kpis", "citas_pendientes"].includes(w.id));
    const finanzasWidgetOrder = widgets.filter(w => ["oracle", "financiero_resumen", "horas_muertas", "servicios_top"].includes(w.id));
    const clientesWidgetOrder = widgets.filter(w => ["clientes_riesgo", "retention_intel", "clientes_tendencia", "staff_ranking", "nilah_impact"].includes(w.id));

    return (
        <div className="space-y-4 sm:space-y-5 pb-24 sm:pb-10 w-full min-w-0 px-3 py-4 sm:px-0 sm:py-0">
            {/* Modales Automáticos (Briefing Matutino & Cierre Nocturno) */}
            <DailyBriefingModal
                isOpen={shouldShow && briefingType === "morning"}
                onClose={dismissMorning}
                streakDays={streakDays}
            />
            <NilahEveningSummary
                isOpen={shouldShow && briefingType === "evening"}
                onClose={dismissEvening}
            />

            {/* Encabezado Limpio */}
            <DashboardHeader
                onOpenAcademy={onOpenAcademy}
                onOpenCustomize={() => setIsCustomizeOpen(true)}
            />

            {/* ─── TARJETA DE PRIMEROS PASOS ("Tu Salón en 3 Pasos") ─── */}
            {showQuickStart && (
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 p-4 sm:p-5 text-white shadow-xl shadow-purple-500/15 animate-fade-in border border-white/20">
                    <button
                        onClick={handleDismissGuide}
                        className="absolute top-3.5 right-3.5 p-1 rounded-full bg-black/20 hover:bg-black/40 text-white/80 transition-colors"
                        title="Ocultar guía"
                    >
                        <X size={15} />
                    </button>

                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[10px] font-black uppercase tracking-wider">
                            ✨ Primeros Pasos
                        </span>
                        <span className="text-xs text-purple-200 font-semibold">
                            {hasAppts && hasClients ? '3/3 Listo' : hasAppts || hasClients ? '2/3 Avanzado' : '1/3 Listo'}
                        </span>
                    </div>

                    <h3 className="text-base font-black leading-tight text-white">
                        ¡Bienvenida a Nilah! Empieza tu salón en 2 minutos
                    </h3>
                    <p className="text-xs text-purple-100 font-medium mt-1 leading-relaxed max-w-lg">
                        Pre-configuramos tus servicios. Sigue estos sencillos pasos para ver tu agenda funcionando:
                    </p>

                    <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {/* Paso 1: Cuenta lista */}
                        <div className="p-3 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <span className="p-1.5 rounded-lg bg-emerald-500 text-white shrink-0">
                                    <CheckCircle2 size={15} />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-white truncate">1. Espacio Creado</p>
                                    <p className="text-[10px] text-emerald-200">¡Tu cuenta está activa!</p>
                                </div>
                            </div>
                        </div>

                        {/* Paso 2: Registrar Cita */}
                        <button
                            onClick={() => navigate('/nilah/app/calendar')}
                            className={`p-3 rounded-xl text-left border transition-all flex items-center justify-between gap-2 cursor-pointer active:scale-95 ${
                                hasAppts
                                    ? 'bg-white/10 border-white/15 text-white'
                                    : 'bg-white text-slate-900 shadow-md hover:bg-purple-50'
                            }`}
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                <span className={`p-1.5 rounded-lg shrink-0 ${hasAppts ? 'bg-emerald-500 text-white' : 'bg-purple-100 text-purple-700'}`}>
                                    {hasAppts ? <CheckCircle2 size={15} /> : <Calendar size={15} />}
                                </span>
                                <div className="min-w-0">
                                    <p className={`text-xs font-black truncate ${hasAppts ? 'text-white' : 'text-slate-900'}`}>
                                        2. Tu Primera Cita
                                    </p>
                                    <p className={`text-[10px] truncate ${hasAppts ? 'text-emerald-200' : 'text-slate-500'}`}>
                                        {hasAppts ? '✓ Cita registrada' : 'Toca para abrir agenda'}
                                    </p>
                                </div>
                            </div>
                            {!hasAppts && <ChevronRight size={15} className="text-purple-600 shrink-0" />}
                        </button>

                        {/* Paso 3: Registrar Clienta */}
                        <button
                            onClick={() => navigate('/nilah/app/clients')}
                            className={`p-3 rounded-xl text-left border transition-all flex items-center justify-between gap-2 cursor-pointer active:scale-95 ${
                                hasClients
                                    ? 'bg-white/10 border-white/15 text-white'
                                    : 'bg-white text-slate-900 shadow-md hover:bg-purple-50'
                            }`}
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                <span className={`p-1.5 rounded-lg shrink-0 ${hasClients ? 'bg-emerald-500 text-white' : 'bg-pink-100 text-pink-700'}`}>
                                    {hasClients ? <CheckCircle2 size={15} /> : <Users size={15} />}
                                </span>
                                <div className="min-w-0">
                                    <p className={`text-xs font-black truncate ${hasClients ? 'text-white' : 'text-slate-900'}`}>
                                        3. Ficha de Clienta
                                    </p>
                                    <p className={`text-[10px] truncate ${hasClients ? 'text-emerald-200' : 'text-slate-500'}`}>
                                        {hasClients ? '✓ Clienta guardada' : 'Toca para agregar'}
                                    </p>
                                </div>
                            </div>
                            {!hasClients && <ChevronRight size={15} className="text-pink-600 shrink-0" />}
                        </button>
                    </div>
                </div>
            )}

            {/* ─── NAVEGACIÓN POR PESTAÑAS (3 MODOS CLAVE) ───────────────────── */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-100/90 dark:bg-dark-card rounded-2xl border border-gray-200/70 dark:border-dark-border shadow-2xs">
                <button
                    onClick={() => handleTabChange("hoy")}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                        activeTab === "hoy"
                            ? "bg-white dark:bg-violet-600 text-gray-900 dark:text-white shadow-xs"
                            : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
                    }`}
                >
                    <span className="text-sm">⚡</span>
                    <span className="truncate">Hoy en Salón</span>
                </button>

                <button
                    onClick={() => handleTabChange("finanzas")}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                        activeTab === "finanzas"
                            ? "bg-white dark:bg-violet-600 text-gray-900 dark:text-white shadow-xs"
                            : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
                    }`}
                >
                    <span className="text-sm">💰</span>
                    <span className="truncate">Finanzas & Metas</span>
                </button>

                <button
                    onClick={() => handleTabChange("clientes")}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                        activeTab === "clientes"
                            ? "bg-white dark:bg-violet-600 text-gray-900 dark:text-white shadow-xs"
                            : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
                    }`}
                >
                    <span className="text-sm">👥</span>
                    <span className="truncate">Clientas & Equipo</span>
                </button>
            </div>

            {/* Drawer de personalización */}
            <DashboardCustomizeDrawer
                isOpen={isCustomizeOpen}
                onClose={() => setIsCustomizeOpen(false)}
                widgets={widgets}
                initialCategory={activeTab}
                onToggle={toggleWidget}
                onMoveUp={moveWidgetUp}
                onMoveDown={moveWidgetDown}
                onReset={resetWidgets}
            />

            {/* ─────────────────────────────────────────────────────────────────
                PESTAÑA 1: ⚡ HOY EN SALÓN (Operación del día a día)
            ───────────────────────────────────────────────────────────────── */}
            {activeTab === "hoy" && (
                <div className="space-y-4 sm:space-y-5 animate-fadeIn">
                    {hoyWidgetOrder.map(w => {
                        if (!w.enabled) return null;

                        // Operativa del Día (Agenda, citas, sillones)
                        if (w.id === "operativa") {
                            return (
                                <WidgetShell key="operativa">
                                    <div className="relative rounded-xl border border-gray-100 bg-white p-4 sm:p-5 md:p-6 shadow-sm dark:border-dark-border dark:bg-dark-card dark:shadow-none">
                                        <InsightSparkle
                                            id="spark-operativa"
                                            tooltipText="Ver oportunidad en ocupación del día"
                                            className="absolute right-3 top-3"
                                            onClick={() => openCopilot({
                                                sourceContext: "dashboard_operativa",
                                                seedPrompt: "Detecté una oportunidad en tu operación de hoy. Si quieres, preparo una acción rápida para mejorar la ocupación.",
                                            })}
                                        />
                                        <OperativaWidget />
                                    </div>
                                </WidgetShell>
                            );
                        }

                        // KPIs del Mes y Meta
                        if (w.id === "kpis") {
                            return (
                                <WidgetShell key="kpis">
                                    <DashboardStats />
                                </WidgetShell>
                            );
                        }

                        // Recordatorios de Retoque
                        if (w.id === "citas_pendientes") {
                            return (
                                <WidgetShell key="citas_pendientes">
                                    <MaintenanceRemindersWidget />
                                </WidgetShell>
                            );
                        }

                        return null;
                    })}

                    {/* Acciones de la Jornada (Acceso manual opcional y contextual) */}
                    <div className="p-3.5 rounded-2xl bg-gray-50/80 dark:bg-dark-card/60 border border-gray-200/70 dark:border-dark-border flex flex-col sm:flex-row items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2">
                            <span className="text-sm">🕒</span>
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                Rutina del día
                            </p>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                                onClick={showMorning}
                                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-violet-700 dark:text-violet-300 bg-white dark:bg-dark-card border border-violet-200 dark:border-violet-800 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all shadow-2xs active:scale-95 min-h-[34px]"
                            >
                                <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                                <span>Ver Briefing</span>
                            </button>
                            <button
                                onClick={showEvening}
                                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-pink-700 dark:text-pink-300 bg-white dark:bg-dark-card border border-pink-200 dark:border-pink-800 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-all shadow-2xs active:scale-95 min-h-[34px]"
                            >
                                <Moon className="w-3.5 h-3.5 text-pink-500" />
                                <span>Cierre de Caja</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─────────────────────────────────────────────────────────────────
                PESTAÑA 2: 💰 FINANZAS & METAS (Estratégico / Dirección)
            ───────────────────────────────────────────────────────────────── */}
            {activeTab === "finanzas" && (
                <div className="space-y-4 sm:space-y-5 animate-fadeIn">
                    {finanzasWidgetOrder.map(w => {
                        if (!w.enabled) return null;

                        // Oracle — Pronóstico IA
                        if (w.id === "oracle" && isAdmin && isPro) {
                            return (
                                <WidgetShell key="oracle">
                                    <OracleCard />
                                </WidgetShell>
                            );
                        }

                        // Resumen Financiero + Flujo de Ingresos
                        if (w.id === "financiero_resumen" && isAdmin) {
                            return (
                                <React.Fragment key="financiero_resumen">
                                    <WidgetShell>
                                        <GrowthFinancialWidget />
                                    </WidgetShell>
                                    <WidgetShell>
                                        <div id="tour-revenue" className="rounded-xl border border-gray-100 bg-white p-4 sm:p-5 md:p-6 shadow-sm dark:border-dark-border dark:bg-dark-card dark:shadow-none">
                                            {isPro ? <FinancialFlowChart /> : <RevenueChart />}
                                        </div>
                                    </WidgetShell>
                                </React.Fragment>
                            );
                        }

                        // Mapa de Horas Muertas
                        if (w.id === "horas_muertas" && isAdmin) {
                            return (
                                <WidgetShell key="horas_muertas">
                                    <div className="rounded-xl border border-gray-100 bg-white p-4 sm:p-5 md:p-6 shadow-sm dark:border-dark-border dark:bg-dark-card dark:shadow-none">
                                        <ProfitHeatmap />
                                    </div>
                                </WidgetShell>
                            );
                        }

                        // Servicios Más Vendidos & Populares
                        if (w.id === "servicios_top" && isAdmin) {
                            return (
                                <React.Fragment key="servicios_top">
                                    <WidgetShell>
                                        <GrowthOperationalWidget />
                                    </WidgetShell>
                                    <WidgetShell>
                                        <div className="rounded-xl border border-gray-100 bg-white p-4 sm:p-5 md:p-6 shadow-sm dark:border-dark-border dark:bg-dark-card dark:shadow-none">
                                            <ServicePopularityChart />
                                        </div>
                                    </WidgetShell>
                                </React.Fragment>
                            );
                        }

                        return null;
                    })}
                </div>
            )}

            {/* ─────────────────────────────────────────────────────────────────
                PESTAÑA 3: 👥 CLIENTAS & EQUIPO (Retención y Personal)
            ───────────────────────────────────────────────────────────────── */}
            {activeTab === "clientes" && (
                <div className="space-y-4 sm:space-y-5 animate-fadeIn">
                    {clientesWidgetOrder.map(w => {
                        if (!w.enabled) return null;

                        // Clientas en Riesgo
                        if (w.id === "clientes_riesgo" && isAdmin) {
                            return (
                                <WidgetShell key="clientes_riesgo">
                                    <div className="relative rounded-xl border border-gray-100 bg-white p-4 sm:p-5 md:p-6 shadow-sm dark:border-dark-border dark:bg-dark-card dark:shadow-none">
                                        <InsightSparkle
                                            id="spark-risk"
                                            tooltipText="Ver estrategia de rescate de clientas"
                                            className="absolute right-3 top-3"
                                            onClick={() => openCopilot({
                                                sourceContext: "dashboard_risk",
                                                seedPrompt: "Analiza mis clientas en riesgo y sugiere la mejor estrategia de rescate por WhatsApp.",
                                            })}
                                        />
                                        <AtRiskClientsWidget />
                                    </div>
                                </WidgetShell>
                            );
                        }

                        // Inteligencia de Retención
                        if (w.id === "retention_intel" && isAdmin) {
                            return (
                                <WidgetShell key="retention_intel">
                                    <div className="rounded-xl border border-gray-100 bg-white p-4 sm:p-5 md:p-6 shadow-sm dark:border-dark-border dark:bg-dark-card dark:shadow-none">
                                        <RetentionIntelligenceWidget />
                                    </div>
                                </WidgetShell>
                            );
                        }

                        // Tendencia de Clientes
                        if (w.id === "clientes_tendencia" && isAdmin) {
                            return (
                                <WidgetShell key="clientes_tendencia">
                                    <GrowthClientsWidget
                                        whatsAppActive={hasSaaSFeature("automations", "whatsapp_campaigns")}
                                    />
                                </WidgetShell>
                            );
                        }

                        // Ranking de Staff
                        if (w.id === "staff_ranking" && isAdmin) {
                            return (
                                <WidgetShell key="staff_ranking">
                                    <div className="rounded-xl border border-gray-100 bg-white p-4 sm:p-5 md:p-6 shadow-sm dark:border-dark-border dark:bg-dark-card dark:shadow-none">
                                        <StaffWeeklyRanking />
                                    </div>
                                </WidgetShell>
                            );
                        }

                        // Trabajo de Nilah
                        if (w.id === "nilah_impact" && isAdmin) {
                            return (
                                <WidgetShell key="nilah_impact">
                                    <div className="relative rounded-xl border border-gray-100 bg-white p-4 sm:p-5 md:p-6 shadow-sm dark:border-dark-border dark:bg-dark-card dark:shadow-none">
                                        <InsightSparkle
                                            id="spark-impact"
                                            tooltipText="Ver detalle del trabajo de Nilah"
                                            className="absolute right-3 top-3"
                                            onClick={() => openCopilot({
                                                sourceContext: "dashboard_impact",
                                                seedPrompt: "Aquí puedes ver un resumen del trabajo que he realizado recuperando clientas automáticamente.",
                                            })}
                                        />
                                        <NilahImpactWidget />
                                    </div>
                                </WidgetShell>
                            );
                        }

                        return null;
                    })}
                </div>
            )}

            {/* Bottom Callout: Organizar Vista */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-violet-50 to-indigo-50/60 dark:from-violet-950/20 dark:to-indigo-950/20 border border-violet-100 dark:border-violet-900/30 text-center sm:text-left shadow-2xs">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
                        <ArrowUpDown className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">¿Quieres organizar tus módulos?</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">Sube, baja o activa módulos para adaptar la vista a tu ritmo de trabajo.</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsCustomizeOpen(true)}
                    className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-violet-700 dark:text-violet-300 bg-white dark:bg-dark-card border border-violet-200 dark:border-violet-800 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all shadow-2xs active:scale-95 shrink-0 min-h-[38px]"
                >
                    Organizar módulos
                </button>
            </div>
        </div>
    );
};

// ===========================================
// Main Dashboard Component
// ===========================================

const Dashboard: React.FC = () => {
    const [showAcademy, setShowAcademy] = React.useState(false);

    if (showAcademy) {
        return <KnowledgeCenter onBack={() => setShowAcademy(false)} />;
    }

    return <DashboardContent onOpenAcademy={() => setShowAcademy(true)} />;
};

export default Dashboard;
