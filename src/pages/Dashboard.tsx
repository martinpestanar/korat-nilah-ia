import React, { useState, useEffect } from "react";
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
import { FirstStepsTour } from "../components/Dashboard/FirstStepsTour";
import { useAuth } from "../context/AuthContext";
import { useDashboardData } from "../context/DashboardDataContext";
import { useDailyBriefing } from "../hooks/useDailyBriefing";
import { useCopilot } from "../context/CopilotContext";
import { useDashboardWidgets } from "../hooks/useDashboardWidgets";
import { useNavigate } from "react-router-dom";
import { RefreshCw, AlertCircle, Sparkles, Moon, SlidersHorizontal, ArrowUpDown, CalendarPlus, UserPlus, Scissors } from "lucide-react";
import { Button } from "../components/UI/Button";
import { PageHeader } from "../components/UI/PageHeader";
import { SegmentedTabs } from "../components/UI/SegmentedTabs";
import { SkeletonStatCard } from "../components/UI/SkeletonLoaders";

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
        <PageHeader
            title={<span>{isAdmin ? "📊 Dashboard" : "📋 Operativo"}</span>}
            subtitle={
                <>
                    Bienvenida,{" "}
                    <span className="font-semibold text-[var(--color-brand)]">
                        {user?.name || "Dueña"}
                    </span>
                    {lastUpdate && (
                        <span className="hidden sm:inline text-[var(--text-muted)]">
                            {" "}
                            ·{" "}
                            {lastUpdate.toLocaleTimeString("es-PE", {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </span>
                    )}
                </>
            }
            actions={
                <>
                    {error && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Error</span>
                        </span>
                    )}

                    {/* Academy */}
                    <Button
                        id="tour-academy"
                        variant="secondary"
                        size="sm"
                        onClick={onOpenAcademy}
                        title="Nilah Academy: Guías y tácticas"
                        leftIcon={<span className="text-sm leading-none">🎓</span>}
                    >
                        <span className="hidden sm:inline">Academy</span>
                    </Button>

                    {/* Botón Organizar PROMINENTE */}
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={onOpenCustomize}
                        title="Organizar orden y visibilidad de los widgets"
                        leftIcon={
                            <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--color-brand)] shrink-0" />
                        }
                    >
                        <span>Organizar</span>
                    </Button>

                    {/* Refresh */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => refresh(true)}
                        disabled={isLoading}
                        title="Actualizar datos"
                        aria-label="Actualizar datos"
                        className="px-2.5 border border-[var(--border-subtle)] bg-[var(--bg-surface)]"
                    >
                        <RefreshCw
                            className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[var(--color-brand)]" : ""}`}
                        />
                    </Button>
                </>
            }
        />
    );
};

// ===========================================
// Dashboard Content con Pestañas Dinámicas
// ===========================================

type DashboardTab = "hoy" | "finanzas" | "clientes";

interface DashboardContentProps {
    onOpenAcademy: () => void;
}

// Helper para envolver widget en contenedor consistente (a nivel de módulo para evitar remontajes)
const WidgetShell: React.FC<{
    children: React.ReactNode;
    className?: string;
    surface?: boolean;
    id?: string;
}> = ({ children, className = "", surface = false, id }) => (
    <div
        id={id}
        className={[
            "animate-widget-enter",
            surface
                ? "relative rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-5 md:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-none"
                : "",
            className,
        ]
            .filter(Boolean)
            .join(" ")}
    >
        {children}
    </div>
);

const DashboardContent: React.FC<DashboardContentProps> = ({ onOpenAcademy }) => {
    const { isAdmin, isPro, user, hasSaaSFeature, hasSaaSModule } = useAuth();
    const { clients, appointments, services, isLoading, refresh } = useDashboardData();
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

    const hasServices = (services || []).length > 0;
    const hasAppts = (appointments || []).length > 0;
    const hasClients = (clients || []).length > 0;

    // Si aún faltan pasos de activación, refrescar silenciosamente al volver al Dashboard
    useEffect(() => {
        if (!isGuideDismissed && (!hasServices || !hasClients || !hasAppts)) {
            refresh(true, true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    // Solo mostramos la guía cuando ya no está cargando los datos iniciales y si falta completar algún paso
    const showQuickStart = !isLoading && !isGuideDismissed && (!hasServices || !hasClients || !hasAppts);
    // Evitar apilar widgets pesados vacíos en la pestaña "hoy" durante la configuración inicial sin citas ni clientas
    const isMinimalOnboardingHoy = showQuickStart && !hasAppts && !hasClients;

    const handleDismissGuide = () => {
        setIsGuideDismissed(true);
        try {
            localStorage.setItem("nilah_quickstart_dismissed", "true");
        } catch {}
    };

    // Pestaña activa persistida en localStorage
    const [storedTab, setActiveTab] = useState<DashboardTab>(() => {
        try {
            return (localStorage.getItem("nilah_dashboard_tab") as DashboardTab) || "hoy";
        } catch {
            return "hoy";
        }
    });

    // Usuarios no admin solo ven la pestaña "Hoy" (las demás no tienen widgets para ellos)
    const activeTab: DashboardTab = isAdmin ? storedTab : "hoy";

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

            {/* ─── HERO DE MARCA + ACCIONES RÁPIDAS (HEREDA --color-brand DE AJUSTES) ─── */}
            <div
                aria-label="Acciones rápidas"
                className="rounded-2xl p-3.5 sm:p-4 border transition-colors"
                style={{
                    background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-brand) 10%, var(--bg-surface)), color-mix(in srgb, var(--color-brand) 3%, var(--bg-surface)))',
                    borderColor: 'color-mix(in srgb, var(--color-brand) 22%, transparent)',
                }}
            >
                <div className={`grid gap-2 ${isAdmin ? "grid-cols-3" : "grid-cols-2"}`}>
                    <button
                        type="button"
                        onClick={() => navigate("/nilah/app/calendar")}
                        className="flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2.5 rounded-xl bg-[var(--color-brand)] text-white text-xs sm:text-sm font-semibold shadow-sm hover:opacity-95 active:scale-[0.98] transition-all min-w-0 cursor-pointer"
                    >
                        <CalendarPlus className="w-4 h-4 shrink-0" />
                        <span className="truncate">+ Cita</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate("/nilah/app/clients")}
                        className="flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs sm:text-sm font-semibold text-[var(--text-primary)] hover:border-[var(--color-brand)]/40 active:scale-[0.98] transition-all shadow-2xs min-w-0 cursor-pointer"
                    >
                        <UserPlus className="w-4 h-4 text-[var(--color-brand)] shrink-0" />
                        <span className="truncate">+ Clienta</span>
                    </button>
                    {isAdmin && (
                        <button
                            type="button"
                            onClick={() => navigate("/nilah/app/settings?tab=services")}
                            className="flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs sm:text-sm font-semibold text-[var(--text-primary)] hover:border-[var(--color-brand)]/40 active:scale-[0.98] transition-all shadow-2xs min-w-0 cursor-pointer"
                        >
                            <Scissors className="w-4 h-4 text-[var(--color-brand)] shrink-0" />
                            <span className="truncate">+ Servicios</span>
                        </button>
                    )}
                </div>
            </div>

            {/* ─── GUÍA / TOUR DE PRIMEROS PASOS (3 PASOS MOBILE-FIRST) ─── */}
            {showQuickStart && (
                <FirstStepsTour
                    servicesCount={(services || []).length}
                    clientsCount={(clients || []).length}
                    appointmentsCount={(appointments || []).length}
                    onDismiss={handleDismissGuide}
                />
            )}

            {/* ─── NAVEGACIÓN POR PESTAÑAS (3 MODOS CLAVE) ───────────────────── */}
            {isAdmin && (
                <SegmentedTabs<DashboardTab>
                    fullWidth
                    activeId={activeTab}
                    onChange={handleTabChange}
                    ariaLabel="Vistas del Dashboard"
                    tabs={[
                        { id: "hoy", label: "Hoy en Salón", icon: "⚡" },
                        { id: "finanzas", label: "Finanzas & Metas", icon: "💰" },
                        { id: "clientes", label: "Clientas & Equipo", icon: "👥" },
                    ]}
                />
            )}

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
            {isLoading && appointments.length === 0 && clients.length === 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <SkeletonStatCard />
                    <SkeletonStatCard />
                    <SkeletonStatCard />
                </div>
            ) : (
            <>
            {activeTab === "hoy" && (
                <div className="space-y-4 sm:space-y-5 animate-fadeIn">
                    {hoyWidgetOrder.map(w => {
                        if (!w.enabled) return null;
                        if (isMinimalOnboardingHoy && w.id !== "operativa") return null;

                        // Operativa del Día (Agenda, citas, sillones)
                        if (w.id === "operativa") {
                            return (
                                <WidgetShell key="operativa" surface>
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

                        // Recordatorios de Retoque (solo si automatizaciones está activo en SuperAdmin)
                        if (w.id === "citas_pendientes") {
                            if (!hasSaaSModule("automatizaciones")) return null;
                            return (
                                <WidgetShell key="citas_pendientes">
                                    <MaintenanceRemindersWidget />
                                </WidgetShell>
                            );
                        }

                        return null;
                    })}

                    {/* Acciones de la Jornada (Acceso manual opcional y contextual) */}
                    <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2">
                            <span className="text-sm">🕒</span>
                            <p className="text-xs font-semibold text-[var(--text-primary)]">
                                Rutina del día
                            </p>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={showMorning}
                                className="flex-1 sm:flex-none"
                                leftIcon={<Sparkles className="w-3.5 h-3.5 text-[var(--color-brand)]" />}
                            >
                                Ver Briefing
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={showEvening}
                                className="flex-1 sm:flex-none"
                                leftIcon={<Moon className="w-3.5 h-3.5 text-pink-500" />}
                            >
                                Cierre de Caja
                            </Button>
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
                                    <WidgetShell surface id="tour-revenue">
                                        {isPro ? <FinancialFlowChart /> : <RevenueChart />}
                                    </WidgetShell>
                                </React.Fragment>
                            );
                        }

                        // Mapa de Horas Muertas
                        if (w.id === "horas_muertas" && isAdmin) {
                            return (
                                <WidgetShell key="horas_muertas" surface>
                                    <ProfitHeatmap />
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
                                    <WidgetShell surface>
                                        <ServicePopularityChart />
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
                                <WidgetShell key="clientes_riesgo" surface>
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
                                </WidgetShell>
                            );
                        }

                        // Inteligencia de Retención
                        if (w.id === "retention_intel" && isAdmin) {
                            return (
                                <WidgetShell key="retention_intel" surface>
                                    <RetentionIntelligenceWidget />
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
                                <WidgetShell key="staff_ranking" surface>
                                    <StaffWeeklyRanking />
                                </WidgetShell>
                            );
                        }

                        // Trabajo de Nilah (solo si automatizaciones está activo en SuperAdmin)
                        if (w.id === "nilah_impact" && isAdmin && hasSaaSModule("automatizaciones")) {
                            return (
                                <WidgetShell key="nilah_impact" surface>
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
                                </WidgetShell>
                            );
                        }

                        return null;
                    })}
                </div>
            )}
            </>
            )}

            {/* Bottom Callout: Organizar Vista */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center sm:text-left shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-none">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand)] text-white shadow-xs">
                        <ArrowUpDown className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs sm:text-sm font-semibold text-[var(--text-primary)]">¿Quieres organizar tus módulos?</p>
                        <p className="text-[11px] text-[var(--text-secondary)]">Sube, baja o activa módulos para adaptar la vista a tu ritmo de trabajo.</p>
                    </div>
                </div>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsCustomizeOpen(true)}
                    className="w-full sm:w-auto shrink-0"
                >
                    Organizar módulos
                </Button>
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
