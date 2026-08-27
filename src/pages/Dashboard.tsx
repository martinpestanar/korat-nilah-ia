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
import { RefreshCw, AlertCircle, Sparkles, Moon, Settings2 } from "lucide-react";

// ===========================================
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

                {/* Botón Personalizar PROMINENTE */}
                <button
                    onClick={onOpenCustomize}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-500/15 hover:bg-violet-100 dark:hover:bg-violet-500/25 border border-violet-200/80 dark:border-violet-700/50 rounded-xl transition-all shadow-xs active:scale-95"
                    title="Personalizar qué widgets ver en tu dashboard"
                >
                    <Settings2 className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
                    <span className="font-semibold">Personalizar</span>
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
// Dashboard Content con Pestañas
// ===========================================

type DashboardTab = "hoy" | "finanzas" | "clientes";

interface DashboardContentProps {
    onOpenAcademy: () => void;
}

const DashboardContent: React.FC<DashboardContentProps> = ({ onOpenAcademy }) => {
    const { isAdmin, isPro, user, hasSaaSFeature } = useAuth();
    const { shouldShow, briefingType, dismissMorning, dismissEvening, streakDays, showMorning, showEvening } = useDailyBriefing();
    const { openCopilot } = useCopilot();
    const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);

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
        isEnabled,
        toggleWidget,
        moveWidgetUp,
        moveWidgetDown,
        resetWidgets,
    } = useDashboardWidgets(user?.email);

    // Helper para envolver widget en contenedor consistente
    const WidgetShell: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
        <div className={`animate-widget-enter ${className}`}>{children}</div>
    );

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
                    {/* Operativa del Día (Agenda, citas, sillones) */}
                    {isEnabled("operativa") && (
                        <WidgetShell>
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
                    )}

                    {/* KPIs del Mes y Meta */}
                    {isEnabled("kpis") && (
                        <WidgetShell>
                            <DashboardStats />
                        </WidgetShell>
                    )}

                    {/* Recordatorios de Retoque */}
                    {isEnabled("citas_pendientes") && (
                        <WidgetShell>
                            <MaintenanceRemindersWidget />
                        </WidgetShell>
                    )}

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
                    {/* Oracle — Pronóstico IA */}
                    {isEnabled("oracle") && isAdmin && isPro && (
                        <WidgetShell>
                            <OracleCard />
                        </WidgetShell>
                    )}

                    {/* Resumen Financiero (Growth) */}
                    {isEnabled("financiero_resumen") && isAdmin && (
                        <WidgetShell>
                            <GrowthFinancialWidget />
                        </WidgetShell>
                    )}

                    {/* Ingresos (versión Pro vs free) */}
                    {isEnabled("financiero_resumen") && isAdmin && (
                        <WidgetShell>
                            <div id="tour-revenue" className="rounded-xl border border-gray-100 bg-white p-4 sm:p-5 md:p-6 shadow-sm dark:border-dark-border dark:bg-dark-card dark:shadow-none">
                                {isPro ? <FinancialFlowChart /> : <RevenueChart />}
                            </div>
                        </WidgetShell>
                    )}

                    {/* Mapa de Horas Muertas */}
                    {isEnabled("horas_muertas") && isAdmin && (
                        <WidgetShell>
                            <div className="rounded-xl border border-gray-100 bg-white p-4 sm:p-5 md:p-6 shadow-sm dark:border-dark-border dark:bg-dark-card dark:shadow-none">
                                <ProfitHeatmap />
                            </div>
                        </WidgetShell>
                    )}

                    {/* Servicios Más Vendidos + Ocupación */}
                    {isEnabled("servicios_top") && isAdmin && (
                        <WidgetShell>
                            <GrowthOperationalWidget />
                        </WidgetShell>
                    )}

                    {/* Servicios Populares */}
                    {isEnabled("servicios_top") && isAdmin && (
                        <WidgetShell>
                            <div className="rounded-xl border border-gray-100 bg-white p-4 sm:p-5 md:p-6 shadow-sm dark:border-dark-border dark:bg-dark-card dark:shadow-none">
                                <ServicePopularityChart />
                            </div>
                        </WidgetShell>
                    )}
                </div>
            )}

            {/* ─────────────────────────────────────────────────────────────────
                PESTAÑA 3: 👥 CLIENTAS & EQUIPO (Retención y Personal)
            ───────────────────────────────────────────────────────────────── */}
            {activeTab === "clientes" && (
                <div className="space-y-4 sm:space-y-5 animate-fadeIn">
                    {/* Clientas en Riesgo */}
                    {isEnabled("clientes_riesgo") && isAdmin && (
                        <WidgetShell>
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
                    )}

                    {/* Inteligencia de Retención */}
                    {isEnabled("retention_intel") && isAdmin && (
                        <WidgetShell>
                            <div className="rounded-xl border border-gray-100 bg-white p-4 sm:p-5 md:p-6 shadow-sm dark:border-dark-border dark:bg-dark-card dark:shadow-none">
                                <RetentionIntelligenceWidget />
                            </div>
                        </WidgetShell>
                    )}

                    {/* Tendencia de Clientes (Growth) */}
                    {isEnabled("clientes_tendencia") && isAdmin && (
                        <WidgetShell>
                            <GrowthClientsWidget
                                whatsAppActive={hasSaaSFeature("automations", "whatsapp_campaigns")}
                            />
                        </WidgetShell>
                    )}

                    {/* Ranking de Staff */}
                    {isEnabled("staff_ranking") && isAdmin && (
                        <WidgetShell>
                            <div className="rounded-xl border border-gray-100 bg-white p-4 sm:p-5 md:p-6 shadow-sm dark:border-dark-border dark:bg-dark-card dark:shadow-none">
                                <StaffWeeklyRanking />
                            </div>
                        </WidgetShell>
                    )}

                    {/* Trabajo de Nilah */}
                    {isEnabled("nilah_impact") && isAdmin && (
                        <WidgetShell>
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
                    )}
                </div>
            )}

            {/* Bottom Callout: Personalizar Vista */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-violet-50 to-indigo-50/60 dark:from-violet-950/20 dark:to-indigo-950/20 border border-violet-100 dark:border-violet-900/30 text-center sm:text-left shadow-2xs">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
                        <Settings2 className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">¿Quieres organizar esta pantalla?</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">Activa, desactiva o cambia el orden de los módulos según tu día a día.</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsCustomizeOpen(true)}
                    className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-violet-700 dark:text-violet-300 bg-white dark:bg-dark-card border border-violet-200 dark:border-violet-800 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all shadow-2xs active:scale-95 shrink-0 min-h-[38px]"
                >
                    Personalizar widgets
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
