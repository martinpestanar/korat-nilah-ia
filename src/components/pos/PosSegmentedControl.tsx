import React from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, Calculator, Receipt, History } from 'lucide-react';

export type CajaSubTab = 'catalogo' | 'numpad' | 'ticket' | 'historial';

interface PosSegmentedControlProps {
  activeTab: CajaSubTab;
  onChangeTab: (tab: CajaSubTab) => void;
  ticketBadgeCount?: number;
}

const TABS: { id: CajaSubTab; label: string; icon: React.ReactNode }[] = [
  { id: 'catalogo', label: 'Catálogo', icon: <LayoutGrid className="w-4 h-4" /> },
  { id: 'numpad', label: 'Teclado', icon: <Calculator className="w-4 h-4" /> },
  { id: 'ticket', label: 'Ticket', icon: <Receipt className="w-4 h-4" /> },
  { id: 'historial', label: 'Historial', icon: <History className="w-4 h-4" /> },
];

export const PosSegmentedControl: React.FC<PosSegmentedControlProps> = ({
  activeTab,
  onChangeTab,
  ticketBadgeCount = 0,
}) => {
  return (
    <div className="w-full p-1 rounded-2xl bg-slate-100/90 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 backdrop-blur-md">
      <nav className="relative flex items-center justify-between w-full" aria-label="Subpestañas de Caja">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-colors duration-150 z-10 ${
                isActive
                  ? 'text-slate-900 dark:text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeSubTabPill"
                  className="absolute inset-0 rounded-xl bg-white dark:bg-white/15 shadow-sm dark:shadow-none border border-slate-200/50 dark:border-white/10 -z-10"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              {tab.icon}
              <span className="hidden xs:inline">{tab.label}</span>
              {tab.id === 'ticket' && ticketBadgeCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 text-[10px] font-extrabold rounded-full bg-emerald-500 text-white animate-pulse">
                  {ticketBadgeCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
