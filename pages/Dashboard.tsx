
import React from 'react';
import DashboardStats from '../components/Dashboard/DashboardStats';
import FinancialFlowChart from '../components/Dashboard/FinancialFlowChart';
import OracleCard from '../components/Dashboard/OracleCard';
import ProfitHeatmap from '../components/Dashboard/ProfitHeatmap';
import RevenueChart from '../components/Dashboard/RevenueChart';
import NilahImpactWidget from '../components/Dashboard/NilahImpactWidget';
import OperativaWidget from '../components/Dashboard/OperativaWidget';
import MaintenanceRemindersWidget from '../components/Dashboard/MaintenanceRemindersWidget';
import StaffWeeklyRanking from '../components/Dashboard/StaffWeeklyRanking';
import ServicePopularityChart from '../components/Dashboard/ServicePopularityChart';
import DailyBriefingModal from '../components/Dashboard/DailyBriefingModal';
import NilahEveningSummary from '../components/Dashboard/NilahEveningSummary';
import KnowledgeCenter from '../components/KnowledgeBase/KnowledgeCenter';
import InsightSparkle from '../components/Copilot/InsightSparkle';
import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../context/DashboardDataContext';
import { useDailyBriefing } from '../hooks/useDailyBriefing';
import { useCopilot } from '../context/CopilotContext';
import { useDashboardMode, DashboardMode } from '../hooks/useDashboardMode';
import { Lock, RefreshCw, AlertCircle, Sparkles, Moon, Layers } from 'lucide-react';

// ===========================================
// Dashboard Header Component
// ===========================================

interface DashboardHeaderProps {
    onShowMorning: () => void;
    onShowEvening: () => void;
    onOpenAcademy: () => void;
    mode: DashboardMode;
    onToggleMode: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onShowMorning, onShowEvening, onOpenAcademy, mode, onToggleMode }) => {
    const { isAdmin, user } = useAuth();
    const { isLoading, lastUpdate, data, refresh, error } = useDashboardData();

    return (
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {isAdmin ? '📊 Dashboard' : '📋 Operativo'}
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                    Bienvenida, <span className="font-semibold text-primary">{user?.name}</span> — todo bajo control.
                </p>
            </div>

            {/* Action buttons — horizontal scroll on mobile */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5">
                {error && (
                    <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        <AlertCircle className="w-3 h-3" />
                        Error
                    </span>
                )}

                {lastUpdate && (
                    <span className="shrink-0 hidden sm:block text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                        {lastUpdate.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                )}

                {/* Morning Briefing */}
                <button
                    onClick={onShowMorning}
                    className="shrink-0 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 p-2 sm:px-2.5 sm:py-1.5 text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 rounded-lg border border-violet-200 dark:border-violet-800 transition-colors"
                    title="Briefing matutino"
                >
                    <Sparkles className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    <span className="hidden sm:inline text-xs">Mañana</span>
                </button>

                {/* Evening Summary */}
                <button
                    onClick={onShowEvening}
                    className="shrink-0 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 p-2 sm:px-2.5 sm:py-1.5 text-sm font-medium text-pink-600 hover:text-pink-700 dark:text-pink-400 rounded-lg border border-pink-200 dark:border-pink-800 transition-colors"
                    title="Cierre de caja"
                >
                    <Moon className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    <span className="hidden sm:inline text-xs">Noche</span>
                </button>

                {/* Academy */}
                <button
                    id="tour-academy"
                    onClick={onOpenAcademy}
                    className="shrink-0 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 p-2 sm:px-2.5 sm:py-1.5 text-sm font-bold text-white bg-gradient-to-r from-violet-500 to-indigo-600 rounded-lg shadow-sm hover:from-violet-600 hover:to-indigo-700 transition-all"
                    title="Nilah Academy"
                >
                    <span className="text-[16px] sm:text-sm leading-none">🎓</span>
                    <span className="hidden sm:inline text-xs">Academy</span>
                </button>



                {/* Modo Simple / Avanzado — estilo Binance */}
                <button
                    onClick={onToggleMode}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border transition-all duration-300 ${
                        mode === 'simple'
                            ? 'bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-500/20'
                            : 'bg-transparent text-gray-500 border-gray-200 dark:border-gray-700 dark:text-gray-400 hover:border-violet-300 hover:text-violet-600 dark:hover:border-violet-600 dark:hover:text-violet-400'
                    }`}
                    title={mode === 'simple' ? 'Cambiar a Modo Avanzado' : 'Cambiar a Modo Simple'}
                >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{mode === 'simple' ? 'Simple' : 'Avanzado'}</span>
                </button>

                {/* Refresh */}
                <button
                    onClick={() => refresh(true)}
                    disabled={isLoading}
                    className="shrink-0 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 p-2 sm:px-2.5 sm:py-1.5 text-sm font-medium text-gray-600 hover:text-primary dark:text-gray-400 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary/30 transition-colors disabled:opacity-50"
                    title="Actualizar datos"
                >
                    <RefreshCw className={`w-4 h-4 sm:w-3.5 sm:h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline text-xs">Actualizar</span>
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
    const { mode, toggleMode, isSimple, isAdvanced } = useDashboardMode(user?.email);

    return (
        <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-10 animate-page-enter w-full min-w-0 px-3 py-4 sm:px-0 sm:py-0">
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
            <DashboardHeader
                onShowMorning={showMorning}
                onShowEvening={showEvening}
                onOpenAcademy={onOpenAcademy}
                mode={mode}
                onToggleMode={toggleMode}
            />

            {/* ───────────────────────────────────────────────────────────────
             Banner informativo Modo Simple
             ─────────────────────────────────────────────────────────────── */}
            {isSimple && (
                <div className="flex items-center gap-2 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 px-4 py-2.5 text-sm text-violet-700 dark:text-violet-300 animate-in fade-in duration-300">
                    <Layers className="w-4 h-4 shrink-0" />
                    <span>Modo Simple activo — solo lo esencial del día. <button onClick={toggleMode} className="underline font-semibold hover:text-violet-900 dark:hover:text-violet-100">Ver todo</button></span>
                </div>
            )}

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
                FILA 3 (AVANZADO): ACCIÓN URGENTE - DINERO EN JUEGO
             ═══════════════════════════════════════════════════════════════ */}
            {isAdvanced && (
                <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 items-stretch animate-widget-enter widget-delay-3">
                    {/* Widget: Impacto de Nilah (Piloto Automático) */}
                    {isAdmin && user?.recursos_saas?.ui_config?.dashboard_widgets?.citas_canceladas !== false && (
                        <div id="tour-risk" className="relative h-full rounded-xl border border-gray-100 bg-white p-4 sm:p-5 md:p-6 shadow-sm dark:border-dark-border dark:bg-dark-card dark:shadow-none">
                            <InsightSparkle
                                id="spark-impact"
                                tooltipText="Ver detalle del trabajo de Nilah"
                                className="absolute right-3 top-3"
                                onClick={() => openCopilot({
                                    sourceContext: 'dashboard_impact',
                                    seedPrompt: 'Aquí puedes ver un resumen del trabajo que he realizado recuperando clientas automáticamente.',
                                })}
                            />
                            <NilahImpactWidget />
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
            )}

            {/* ═══════════════════════════════════════════════════════════════
                FILA 4 (AVANZADO): INTELIGENCIA FINANCIERA
             ═══════════════════════════════════════════════════════════════ */}
            {isAdvanced && isAdmin && user?.recursos_saas?.ui_config?.dashboard_widgets?.ingresos_chart !== false && (
                <div id="tour-revenue" className="rounded-xl border border-gray-100 bg-white p-4 sm:p-5 md:p-6 shadow-sm dark:border-dark-border dark:bg-dark-card dark:shadow-none animate-widget-enter widget-delay-4">
                    {isPro ? <FinancialFlowChart /> : <RevenueChart />}
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                FILA 6 (AVANZADO): SERVICIOS POPULARES + INTELIGENCIA DE EQUIPO
             ═══════════════════════════════════════════════════════════════ */}
            {isAdvanced && (
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
            )}
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

    return (
        <>
            <DashboardContent onOpenAcademy={() => setShowAcademy(true)} />
        </>
    );
};

export default Dashboard;

