
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
import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../context/DashboardDataContext';
import { useDailyBriefing } from '../hooks/useDailyBriefing';
import { Lock, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

// ===========================================
// Dashboard Header Component
// ===========================================

const DashboardHeader: React.FC = () => {
    const { isAdmin, user } = useAuth();
    const { isLoading, lastUpdate, data, refresh, error } = useDashboardData();
    const { resetForToday } = useDailyBriefing();

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

                {/* Ver Briefing Button */}
                <button
                    onClick={() => resetForToday()}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 rounded-lg border border-indigo-200 dark:border-indigo-800 hover:border-indigo-300 transition-colors"
                    title="Ver resumen diario de Nilah"
                >
                    <Sparkles className="w-4 h-4" />
                    <span className="hidden sm:inline">Briefing</span>
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

const DashboardContent: React.FC = () => {
    const { isAdmin, isPro, user } = useAuth();
    const { shouldShow, dismissBriefing } = useDailyBriefing();

    return (
        <div className="space-y-6 pb-10 animate-page-enter">
            {/* Daily Briefing Modal */}
            <DailyBriefingModal
                isOpen={shouldShow}
                onClose={dismissBriefing}
            />

            {/* Header */}
            <DashboardHeader />

            {/* ═══════════════════════════════════════════════════════════════
                FILA 1: KPIs GENERALES
                "¿Cómo está mi negocio hoy?"
            ═══════════════════════════════════════════════════════════════ */}
            <div className="animate-widget-enter widget-delay-1">
                <DashboardStats />
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                FILA 2: PRONÓSTICO + OPERATIVA DEL DÍA
                Izq: "¿Voy a cumplir mi meta?" | Der: "¿Qué tengo que hacer HOY?"
            ═══════════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-5 items-stretch animate-widget-enter widget-delay-2">
                {/* Oracle Card - Pronóstico IA (3/5 del ancho) */}
                {isAdmin && isPro && (
                    <div className="lg:col-span-3 h-full">
                        <OracleCard />
                    </div>
                )}
                {/* Operativa del Día (2/5 del ancho) */}
                <div className={`h-full rounded-xl border border-gray-100 bg-white p-4 sm:p-5 md:p-6 shadow-sm dark:border-dark-border dark:bg-dark-card dark:shadow-none ${isAdmin && isPro ? 'lg:col-span-2' : 'lg:col-span-5'}`}>
                    <OperativaWidget />
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                FILA 3: ACCIÓN URGENTE - DINERO EN JUEGO
                Izq: "¿A quién puedo perder?" | Der: "¿Quién está listo para volver?"
            ═══════════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 items-stretch animate-widget-enter widget-delay-3">
                {/* Widget: Clientes en Riesgo (Condicional por UI Config) */}
                {isAdmin && user?.recursos_saas?.ui_config?.dashboard_widgets?.citas_canceladas !== false && (
                    <div className="h-full rounded-xl border border-gray-100 bg-white p-4 sm:p-5 md:p-6 shadow-sm dark:border-dark-border dark:bg-dark-card dark:shadow-none">
                        <AtRiskClientsWidget />
                    </div>
                )}
                {/* Widget: Recordatorios de Mantenimiento/Retoque */}
                <div className="h-full">
                    <MaintenanceRemindersWidget />
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                FILA 4: INTELIGENCIA FINANCIERA
                "¿Cuál es la tendencia de mis ingresos?"
            ═══════════════════════════════════════════════════════════════ */}
            {isAdmin && user?.recursos_saas?.ui_config?.dashboard_widgets?.ingresos_chart !== false && (
                <div className="rounded-xl border border-gray-100 bg-white p-4 sm:p-5 md:p-6 shadow-sm dark:border-dark-border dark:bg-dark-card dark:shadow-none animate-widget-enter widget-delay-4">
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
                FILA 6: INTELIGENCIA DE EQUIPO (PRO) Y SERVICIOS POPULARES
                "¿Cómo está rindiendo mi equipo?" y "Top Servicios"
            ═══════════════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 items-stretch animate-widget-enter widget-delay-6">
                {isAdmin && isPro && (
                    <div className="h-full rounded-xl border border-gray-100 bg-white p-4 sm:p-5 md:p-6 shadow-sm dark:border-dark-border dark:bg-dark-card dark:shadow-none">
                        <StaffWeeklyRanking />
                    </div>
                )}
                {user?.recursos_saas?.ui_config?.dashboard_widgets?.top_servicios !== false && (
                    <div className="h-full rounded-xl border border-gray-100 bg-white p-4 sm:p-5 md:p-6 shadow-sm dark:border-dark-border dark:bg-dark-card dark:shadow-none">
                        <ServicePopularityChart />
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
    return <DashboardContent />;
};

export default Dashboard;

