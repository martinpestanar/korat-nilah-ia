import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Wallet, Package, DollarSign, FileText, Lock } from 'lucide-react';
import FinanceExpenses from '../components/Finances/FinanceExpenses';
import FinanceDashboard from '../components/Finances/FinanceDashboard';
import { FinancePayroll } from '../components/Finances/FinancePayroll';
import FinanceTaxes from '../components/Finances/FinanceTaxes';
import FinanceInventory from '../components/Finances/FinanceInventory';
import { useAuth } from '../context/AuthContext';

const TABS = [
  { id: 'dashboard',  label: 'Resumen',    icon: TrendingUp, featureKey: 'resumen' },
  { id: 'gastos',     label: 'Egresos',    icon: Wallet,      featureKey: 'egresos' },
  { id: 'inventario', label: 'Inventario', icon: Package,     featureKey: 'inventario' },
  { id: 'nomina',     label: 'Nómina',     icon: DollarSign,  featureKey: 'nomina' },
  { id: 'impuestos',  label: 'SUNAT',      icon: FileText,    featureKey: 'sunat' },
];

export default function Finances() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasSaaSFeature } = useAuth();
  const activeTab = searchParams.get('tab') || 'dashboard';

  const setActiveTab = (tabId: string, hasAccess: boolean) => {
    if (!hasAccess) return; // candado: no navegar
    setSearchParams({ tab: tabId });
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="px-4 sm:px-6 pt-8 pb-4 lg:pt-4">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-lg"
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 8px 20px rgba(16,185,129,0.35)' }}
          >
            <Wallet size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white leading-none">
              Finanzas
            </h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Salud financiera de tu negocio
            </p>
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ── pill style ───────────────── */}
      <div className="px-4 sm:px-6 mb-1">
        <div className="flex gap-1 p-1 rounded-2xl bg-gray-100/80 dark:bg-white/[0.06] overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            const hasAccess = hasSaaSFeature('finanzas', tab.featureKey);
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id, hasAccess)}
                title={!hasAccess ? '🔒 Disponible en Plan Pro' : undefined}
                className={`relative flex-1 flex items-center justify-center gap-1.5 py-2 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
                  !hasAccess
                    ? 'opacity-45 cursor-not-allowed text-gray-400 dark:text-gray-600'
                    : 'cursor-pointer'
                }`}
                style={{ minWidth: 64, color: active && hasAccess ? '#fff' : undefined }}
              >
                {active && hasAccess && (
                  <motion.div
                    layoutId="finance_tab_pill"
                    className="absolute inset-0 rounded-xl"
                    style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 14px rgba(16,185,129,0.35)' }}
                    transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {hasAccess
                    ? <Icon size={14} strokeWidth={active ? 2.5 : 2} />
                    : <Lock size={13} strokeWidth={2.5} />
                  }
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content ────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="h-full"
          >
            {activeTab === 'dashboard'  && <FinanceDashboard />}
            {activeTab === 'gastos'     && <FinanceExpenses />}
            {activeTab === 'inventario' && hasSaaSFeature('finanzas', 'inventario') && <FinanceInventory />}
            {activeTab === 'nomina'     && hasSaaSFeature('finanzas', 'nomina') && <FinancePayroll />}
            {activeTab === 'impuestos'  && hasSaaSFeature('finanzas', 'sunat') && <FinanceTaxes />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
