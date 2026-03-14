
import React from 'react';
import DashboardStats from '../components/Dashboard/DashboardStats';
import FinancialFlowChart from '../components/Dashboard/FinancialFlowChart';
import OracleCard from '../components/Dashboard/OracleCard';
import ProfitHeatmap from '../components/Dashboard/ProfitHeatmap';
import RevenueChart from '../components/Dashboard/RevenueChart';
import AtRiskClientsWidget from '../components/Dashboard/AtRiskClientsWidget';
import RetentionIntelligenceWidget from '../components/Dashboard/RetentionIntelligenceWidget';
import OperativaWidget from '../components/Dashboard/OperativaWidget';
import MaintenanceRemindersWidget from '../components/Dashboard/MaintenanceRemindersWidget';
import StaffWeeklyRanking from '../components/Dashboard/StaffWeeklyRanking';
import ServicePopularityChart from '../components/Dashboard/ServicePopularityChart';
import DailyBriefingModal from '../components/Dashboard/DailyBriefingModal';
import NilahEveningSummary from '../components/Dashboard/NilahEveningSummary';
import KnowledgeCenter from '../components/KnowledgeBase/KnowledgeCenter';
import OnboardingTour from '../components/Onboarding/OnboardingTour';
import InsightSparkle from '../components/Copilot/InsightSparkle';
import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../context/DashboardDataContext';
import { useDailyBriefing } from '../hooks/useDailyBriefing';
import { useOnboarding } from '../hooks/useOnboarding';
import { useCopilot } from '../context/CopilotContext';
import { Lock, RefreshCw, AlertCircle, Sparkles, Moon } from 'lucide-react';

// ===========================================
// Dashboard Header Component
// ===========================================

interface DashboardHeaderProps {
    onShowMorning: () => void;
    onShowEvening: () => void;
    onOpenAcademy: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onShowMorning, onShowEvening, onOpenAcademy }) => {
    const { isAdmin, user } = useAuth();
    const { isLoading, lastUpdate, data, refresh, error } = useDashboardData();

    return (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 className="text-xl sm:text-2xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                    Dashboard {isAdmin ? 'General' : 'Operativo'}
                </h1>
                <p className="text-xs sm:text-sm md:text-sm text-gray-500 dark:text-gray-400">
                    Bienvenido, <span className="font-semibold text-primary">{user?.name}</span>. Tu salón está en buenas manos.
                </p>
            </div>

            {/* Cache Status & Refresh Button */}
            <div className="flex items-center gap-3">
                {/* Error Badge */}
                {error && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        <AlertCircle className="w-3 h-3" />
                        Error
                    </span>
                )}

                {/* Status Badge */}
                {lastUpdate && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                        Actualizado: {lastUpdate.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                )}

                {/* Stats Badge */}
                {data?.stats && (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        {data.stats.totalClientes || 0} clientes
                    </span>
                )}

                {/* Ver Briefing Buttons */}
                <button
                    onClick={onShowMorning}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 rounded-lg border border-violet-200 dark:border-violet-800 hover:border-violet-300 transition-colors"
                    title="Ver briefing matutino de Nilah"
                >
                    <Sparkles className="w-4 h-4" />
                    <span className="hidden sm:inline">Mañana</span>
                </button>
                <button
                    onClick={onShowEvening}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300 rounded-lg border border-pink-200 dark:border-pink-800 hover:border-pink-300 transition-colors"
                    title="Ver cierre de caja de Nilah"
                >
                    <Moon className="w-4 h-4" />
                    <span className="hidden sm:inline">Noche</span>
                </button>
                {/* Test Tour Button (Temporary) */}
                <button
                    onClick={() => {
                        localStorage.removeItem('korat_onboarding_completed');
                        window.location.reload();
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-gray-500 bg-gray-100 dark:bg-dark-border dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                    title="Probar Tour de Onboarding"
                >
                    <RefreshCw size={14} />
                    <span className="hidden sm:inline">Test Tour</span>
                </button>

                {/* Nilah Academy Enter Button */}
                <button
                    id="tour-academy"
                    onClick={onOpenAcademy}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-white bg-gradient-to-r from-violet-500 to-indigo-600 rounded-lg shadow-sm hover:from-violet-600 hover:to-indigo-700 transition-all hover:shadow-md"
                    title="Centro de Ayuda y Estrategia"
                >
                    <span className="text-amber-300">🎓</span>
                    <span className="hidden sm:inline">Nilah Academy</span>
                </button>

                {/* Refresh Button */}
                <button
                    onClick={() => refresh(true)}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary-light rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary/30 transition-colors disabled:opacity-50"
                    title="Forzar actualización de datos"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Actualizar</span>
                </button>
            </div>
        </div>
    );
};

// ===========================================
// Dashboard Content Component
// ===========================================

interface DashboardContentProps {
    onOpenAcademy: () => void;
}

const DashboardContent: React.FC<DashboardContentProps> = ({ onOpenAcademy }) => {
    const { isAdmin, isPro, user } = useAuth();
    const { shouldShow, briefingType, dismissMorning, dismissEvening, streakDays, showMorning, showEvening } = useDailyBriefing();
    const { openCopilot } = useCopilot();

    return (
        <div className="space-y-6 pb-10 animate-page-enter w-full min-w-0">
            {/* Nilah Morning Briefing */}
            <DailyBriefingModal
                isOpen={shouldShow && briefingType === 'morning'}
                onClose={dismissMorning}
                streakDays={streakDays}
            />
            {/* Nilah Evening Summary (Cierre de Caja) */}
            <NilahEveningSummary
                isOpen={shouldShow && briefingType === 'evening'}
                onClose={dismissEvening}
            />

            {/* Header: passes callbacks from single hook instance */}
            <DashboardHeader onShowMorning={showMorning} onShowEvening={showEvening} onOpenAcademy={onOpenAcademy} />

            {/* ═══════════════════════════════════════════════════════════════
                FILA 1: PRONÓSTICO + OPERATIVA DEL DÍA (Max Prioridad Mobile)
                Izq: "¿Voy a cumplir mi meta?" | Der: "¿Qué tengo que hacer HOY?"
            ═══════════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-5 items-stretch animate-widget-enter widget-delay-1">
                {/* Oracle Card - Pronóstico IA (3/5 del ancho) */}
                {isAdmin && isPro && (
                    <div className="lg:col-span-3 h-full">
                        <OracleCard />
                    </div>
                )}
                {/* Operativa del Día (2/5 del ancho) */}
                <div className={`relative h-full rounded-xl border border-gray-100 bg-white p-4 sm:p-5 md:p-6 shadow-sm dark:border-dark-border dark:bg-dark-card dark:shadow-none ${isAdmin && isPro ? 'lg:col-span-2' : 'lg:col-span-5'}`}>
                    <InsightSparkle
                        id="spark-operativa"
                        tooltipText="Ver oportunidad en ocupacion del dia"
                        className="absolute right-3 top-3"
                        onClick={() => openCopilot({
                            sourceContext: 'dashboard_operativa',
                            seedPrompt: 'Detecte una oportunidad en tu operacion de hoy. Si quieres, preparo una accion rapida para mejorar la ocupacion.',
                        })}
                    />
                    <OperativaWidget />
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                FILA 2: KPIs GENERALES
                "¿Cómo está mi negocio hoy?"
            ═══════════════════════════════════════════════════════════════ */}
            <div className="animate-widget-enter widget-delay-2">
                <DashboardStats />
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                FILA 3: ACCIÓN URGENTE - DINERO EN JUEGO
                Izq: "¿A quién puedo perder?" | Der: "¿Quién está listo para volver?"
            ═══════════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 items-stretch animate-widget-enter widget-delay-3">
                {/* Widget: Clientes en Riesgo (Condicional por UI Config) */}
                {isAdmin && user?.recursos_saas?.ui_config?.dashboard_widgets?.citas_canceladas !== false && (
                    <div id="tour-risk" className="relative h-full rounded-xl border border-gray-100 bg-white p-4 sm:p-5 md:p-6 shadow-sm dark:border-dark-border dark:bg-dark-card dark:shadow-none">
                        <InsightSparkle
                            id="spark-risk"
                            tooltipText="Ver plan de rescate para clientas en riesgo"
                            className="absolute right-3 top-3"
                            onClick={() => openCopilot({
                                sourceContext: 'dashboard_risk',
                                seedPrompt: 'Veo clientas en riesgo de fuga. Puedo ejecutar un rescate ahora mismo.',
                            })}
                        />
                        <AtRiskClientsWidget />
                    </div>
                )}
                {/* Widget: Recordatorios de Mantenimiento/Retoque */}
                <div className="relative h-full">
                    <InsightSparkle
                        id="spark-reminders"
                        tooltipText="Sugerencia de recordatorios automáticos"
                        className="absolute right-3 top-3 z-10"
                        onClick={() => openCopilot({
                            sourceContext: 'dashboard_reminders',
                            seedPrompt: 'Te conviene reforzar recordatorios para bajar no-shows esta semana.',
                        })}
                    />
                    <MaintenanceRemindersWidget />
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                FILA 4: INTELIGENCIA FINANCIERA
                "¿Cuál es la tendencia de mis ingresos?"
            ═══════════════════════════════════════════════════════════════ */}
            {isAdmin && user?.recursos_saas?.ui_config?.dashboard_widgets?.ingresos_chart !== false && (
                <div id="tour-revenue" className="rounded-xl border border-gray-100 bg-white p-4 sm:p-5 md:p-6 shadow-sm dark:border-dark-border dark:bg-dark-card dark:shadow-none animate-widget-enter widget-delay-4">
                    {isPro ? <FinancialFlowChart /> : <RevenueChart />}
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                FILA 5: ANÁLISIS Y OPTIMIZACIÓN
                Izq: "Métricas de retención" | Der: "Zonas muertas para optimizar"
            ═══════════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-5 items-stretch animate-widget-enter widget-delay-5">
                {/* Widget: Inteligencia de Retención (2/5 del ancho) */}
                {isAdmin && (
                    <div className="lg:col-span-2 h-full rounded-xl border border-gray-100 bg-white p-4 sm:p-5 md:p-6 shadow-sm dark:border-dark-border dark:bg-dark-card dark:shadow-none">
                        <RetentionIntelligenceWidget />
                    </div>
                )}
                {/* Heatmap / Teaser (3/5 del ancho) */}
                {isAdmin && (
                    <div className="lg:col-span-3 h-full relative rounded-xl border border-gray-100 bg-white p-4 sm:p-5 md:p-6 shadow-sm dark:border-dark-border dark:bg-dark-card dark:shadow-none overflow-hidden">
                        {isPro ? (
                            <ProfitHeatmap />
                        ) : (
                            /* Locked State for Starter - Teaser */
                            <div className="relative h-64 flex flex-col items-center justify-center text-center">
                                <div className="absolute inset-0 blur-sm opacity-50 pointer-events-none select-none" aria-hidden="true">
                                    {/* Mock background to show what they are missing */}
                                    <div className="grid grid-cols-7 gap-1 h-full w-full opacity-20">
                                        {Array.from({ length: 28 }).map((_, i) => (
                                            <div key={i} className={`rounded ${i % 3 === 0 ? 'bg-green-200' : 'bg-gray-100'}`}></div>
                                        ))}
                                    </div>
                                </div>

                                <div className="z-10 bg-white/90 dark:bg-black/80 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl backdrop-blur-sm max-w-md">
                                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                        <Lock size={24} />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Optimizador de Horarios (IA)</h3>
                                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                                        Detecta automáticamente tus "Horas Muertas" y crea promociones flash para llenarlas. Disponible en el plan Pro.
                                    </p>
                                    <button className="text-sm font-bold text-primary hover:underline">
                                        Ver características Pro
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                FILA 6: SERVICIOS POPULARES E INTELIGENCIA DE EQUIPO (PRO)
                "Top Servicios" y "¿Cómo está rindiendo mi equipo?"
            ═══════════════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 items-stretch animate-widget-enter widget-delay-6">
                {user?.recursos_saas?.ui_config?.dashboard_widgets?.top_servicios !== false && (
                    <div className="h-full rounded-xl border border-gray-100 bg-white p-4 sm:p-5 md:p-6 shadow-sm dark:border-dark-border dark:bg-dark-card dark:shadow-none">
                        <ServicePopularityChart />
                    </div>
                )}
                {isAdmin && isPro && (
                    <div className="h-full rounded-xl border border-gray-100 bg-white p-4 sm:p-5 md:p-6 shadow-sm dark:border-dark-border dark:bg-dark-card dark:shadow-none">
                        <StaffWeeklyRanking />
                    </div>
                )}
            </div>
        </div>
    );
};

// ===========================================
// Main Dashboard Component
// ===========================================

const Dashboard: React.FC = () => {
    const [showAcademy, setShowAcademy] = React.useState(false);
    const { isOnboardingActive, isLoaded, completeOnboarding } = useOnboarding();

    if (showAcademy) {
        return <KnowledgeCenter onBack={() => setShowAcademy(false)} />;
    }

    return (
        <>
            {isLoaded && isOnboardingActive && <OnboardingTour onComplete={completeOnboarding} />}
            <DashboardContent onOpenAcademy={() => setShowAcademy(true)} />
        </>
    );
};

export default Dashboard;

