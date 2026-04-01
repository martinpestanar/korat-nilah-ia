import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Users, Scissors, BarChart3, ChevronRight, Sparkles, RefreshCw, Clock } from 'lucide-react';
import { useDashboardData } from '../context/DashboardDataContext';
import FinancialHealthTab from '../components/Growth/FinancialHealthTab';
import RetentionTab from '../components/Growth/RetentionTab';
import OperationalTab from '../components/Growth/OperationalTab';
import CampaignsTab from '../components/Growth/CampaignsTab';
import PilotoAutomaticoTab from '../components/Growth/PilotoAutomaticoTab';
import { format, subMonths, startOfMonth, startOfYear, endOfMonth, endOfYear } from 'date-fns';

const TABS = [
    { id: 'financial', label: 'Finanzas', icon: TrendingUp, color: 'emerald', description: 'Ingresos, ticket y proyecciones' },
    { id: 'campaigns', label: 'Rescates y ROI', icon: Sparkles, color: 'violet', description: 'Retorno de campañas IA' },
    { id: 'piloto', label: 'Piloto Auto', icon: Clock, color: 'blue', description: 'Asistente 24/7 en segundo plano' },
    { id: 'retention', label: 'Clientes', icon: Users, color: 'blue', description: 'Retención y captación' },
    { id: 'operational', label: 'Operacional', icon: Scissors, color: 'purple', description: 'Ocupación y staff' },
];

const colorMap: Record<string, { bg: string; text: string; activeBg: string; activeText: string; glow: string }> = {
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', activeBg: 'bg-emerald-500', activeText: 'text-white', glow: 'shadow-emerald-500/30' },
    blue: { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', activeBg: 'bg-blue-500', activeText: 'text-white', glow: 'shadow-blue-500/30' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', activeBg: 'bg-purple-500', activeText: 'text-white', glow: 'shadow-purple-500/30' },
    rose: { bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', activeBg: 'bg-rose-500', activeText: 'text-white', glow: 'shadow-rose-500/30' },
    violet: { bg: 'bg-violet-50 dark:bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400', activeBg: 'bg-violet-500', activeText: 'text-white', glow: 'shadow-violet-500/30' },
};

const Growth: React.FC = () => {
    const [activeTab, setActiveTab] = useState('financial');
    const [showDateFilter, setShowDateFilter] = useState(false);
    const [dateFilter, setDateFilter] = useState<{ start: string; end: string; label: string }>({ start: '', end: '', label: 'Histórico Completo' });
    const { isLoading, refresh } = useDashboardData();

    const activeTabData = TABS.find(t => t.id === activeTab);
    React.useEffect(() => {
        if (!TABS.find(t => t.id === activeTab)) {
            setActiveTab('financial');
        }
    }, [activeTab]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="space-y-6 pb-10 px-4 py-5 sm:p-0"
        >
            {/* === HEADER === */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-4">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30"
                    >
                        <BarChart3 className="h-7 w-7 text-white" />
                    </motion.div>
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15 }}
                            className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white"
                        >
                            Crecimiento del Negocio
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-sm text-gray-500 dark:text-gray-400"
                        >
                            Inteligencia de negocio · Visión histórica y tendencias
                        </motion.p>
                    </div>
                </div>
                <div className="flex items-center gap-3 relative">
                    {/* Date Filter Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowDateFilter(!showDateFilter)}
                            className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all dark:border-dark-border dark:text-gray-300 dark:hover:bg-dark-bg"
                        >
                            <span className="truncate max-w-[150px]">{dateFilter.label}</span>
                            <ChevronRight className={`h-4 w-4 transition-transform ${showDateFilter ? 'rotate-90' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {showDateFilter && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowDateFilter(false)} />
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 top-full mt-2 w-72 z-50 rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border shadow-xl p-2"
                                    >
                                        <div className="flex flex-col gap-1">
                                            {[
                                                { label: 'Histórico Completo', start: '', end: '' },
                                                { label: 'Últimos 30 días', start: format(subMonths(new Date(), 1), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') },
                                                { label: 'Este Mes', start: format(startOfMonth(new Date()), 'yyyy-MM-dd'), end: format(endOfMonth(new Date()), 'yyyy-MM-dd') },
                                                { label: 'Mes Anterior', start: format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'), end: format(endOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd') },
                                                { label: 'Este Año', start: format(startOfYear(new Date()), 'yyyy-MM-dd'), end: format(endOfYear(new Date()), 'yyyy-MM-dd') },
                                            ].map((preset) => (
                                                <button
                                                    key={preset.label}
                                                    onClick={() => { setDateFilter(preset); setShowDateFilter(false); }}
                                                    className={`text-left px-4 py-2.5 text-sm rounded-xl transition-colors ${dateFilter.label === preset.label ? 'bg-violet-50 text-violet-700 font-bold dark:bg-violet-500/20 dark:text-violet-300' : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-dark-bg'}`}
                                                >
                                                    {preset.label}
                                                </button>
                                            ))}
                                            <div className="h-px bg-gray-100 dark:bg-dark-border my-1" />
                                            <div className="p-2 space-y-2">
                                                <p className="text-xs font-bold text-gray-500 uppercase px-2">Rango manual</p>
                                                <input
                                                    type="date"
                                                    value={dateFilter.start}
                                                    onChange={e => setDateFilter({ ...dateFilter, start: e.target.value, label: 'Rango personalizado' })}
                                                    className="w-full rounded-xl border-gray-200 bg-gray-50 text-sm px-3 py-2 dark:bg-dark-bg dark:border-dark-border dark:text-white"
                                                />
                                                <input
                                                    type="date"
                                                    value={dateFilter.end}
                                                    onChange={e => setDateFilter({ ...dateFilter, end: e.target.value, label: 'Rango personalizado' })}
                                                    className="w-full rounded-xl border-gray-200 bg-gray-50 text-sm px-3 py-2 dark:bg-dark-bg dark:border-dark-border dark:text-white"
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        onClick={() => refresh(true)}
                        disabled={isLoading}
                        className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all dark:border-dark-border dark:text-gray-300 dark:hover:bg-dark-bg"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Actualizar</span>
                    </button>
                    <div className="hidden sm:flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-200/50 dark:border-violet-500/20 px-4 py-2">
                        <Sparkles className="h-4 w-4 text-violet-500" />
                        <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">Analytics Pro</span>
                    </div>
                </div>
            </div>

            {/* === TAB NAVIGATION — Desktop === */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="hidden sm:grid sm:grid-cols-5 gap-3"
            >
                {TABS.map((tab, i) => {
                    const isActive = activeTab === tab.id;
                    const colors = colorMap[tab.color];
                    return (
                        <motion.button
                            key={tab.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + i * 0.07 }}
                            onClick={() => setActiveTab(tab.id)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`relative flex flex-col items-start gap-2 rounded-2xl p-5 text-left transition-all duration-300 border ${isActive
                                ? `bg-white dark:bg-dark-card border-gray-200 dark:border-dark-border shadow-xl ${colors.glow}`
                                : 'bg-white/60 dark:bg-dark-card/60 border-gray-100 dark:border-dark-border/60 hover:bg-white dark:hover:bg-dark-card hover:shadow-md'
                                }`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabIndicator"
                                    className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl ${colors.activeBg}`}
                                    transition={{ type: 'spring', stiffness: 300 }}
                                />
                            )}
                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${isActive ? `${colors.activeBg} shadow-lg ${colors.glow}` : colors.bg
                                }`}>
                                <tab.icon className={`h-5 w-5 ${isActive ? 'text-white' : colors.text}`} />
                            </div>
                            <div>
                                <p className={`font-bold text-sm ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                    {tab.label}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{tab.description}</p>
                            </div>
                        </motion.button>
                    );
                })}
            </motion.div>

            {/* === TAB NAVIGATION — Mobile horizontal scroll === */}
            <div className="sm:hidden -mx-4 px-4 overflow-x-auto pb-2">
                <div className="flex gap-2 w-max">
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab.id;
                        const colors = colorMap[tab.color];
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${isActive
                                    ? `${colors.activeBg} text-white shadow-lg ${colors.glow}`
                                    : 'bg-gray-100 dark:bg-dark-card text-gray-600 dark:text-gray-400'
                                    }`}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* === TAB CONTENT === */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                    {activeTab === 'financial' && <FinancialHealthTab dateFilter={dateFilter} />}
                    {activeTab === 'campaigns' && <CampaignsTab dateFilter={dateFilter} />}
                    {activeTab === 'piloto' && <PilotoAutomaticoTab />}
                    {activeTab === 'retention' && <RetentionTab dateFilter={dateFilter} />}
                    {activeTab === 'operational' && <OperationalTab dateFilter={dateFilter} />}
                </motion.div>
            </AnimatePresence>
        </motion.div>
    );
};

export default Growth;
