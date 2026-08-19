import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Sun, Moon, Users, Bell, ChevronDown, Wifi, MessageSquare } from 'lucide-react';
import { RubroType, RUBRO_CONFIG } from '../../services/posService';
import { PosBusinessAvatar } from './PosBusinessAvatar';

interface PosMobileHeaderProps {
  businessName: string;
  rubro: RubroType;
  logoUrl?: string;
  themeMode: 'dark' | 'light';
  isDemoMode?: boolean;
  onToggleTheme: () => void;
  onOpenCustomerModal: () => void;
  onOpenNotifications: () => void;
  onOpenRubroSelector: () => void;
  activeCustomerName?: string;
}

export const PosMobileHeader: React.FC<PosMobileHeaderProps> = ({
  businessName,
  rubro,
  logoUrl,
  themeMode,
  isDemoMode = false,
  onToggleTheme,
  onOpenCustomerModal,
  onOpenNotifications,
  onOpenRubroSelector,
  activeCustomerName,
}) => {
  const rConfig = RUBRO_CONFIG[rubro] || RUBRO_CONFIG.gastro;

  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-xl bg-white/85 dark:bg-[#06040f]/85 border-b border-slate-200/80 dark:border-white/10 transition-colors duration-200">
      <div className="max-w-md mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Lado Izquierdo: Marca & Rubro (Solo cambiable en Modo Demo) */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <PosBusinessAvatar logoUrl={logoUrl} rubro={rubro} size="sm" />

          {isDemoMode ? (
            <button
              onClick={onOpenRubroSelector}
              className="flex items-center gap-1 px-2 py-1 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all duration-150 text-left shrink-0 active:scale-95 cursor-pointer"
              title="Cambiar Rubro (Modo Demo)"
            >
              <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
                {rConfig.label}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-amber-500 ml-0.5" />
            </button>
          ) : (
            <div className="min-w-0 flex-1">
              <h1 className="text-sm font-extrabold text-slate-900 dark:text-white truncate leading-tight">
                {businessName || 'Korat POS'}
              </h1>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 leading-none">
                  {rConfig.label}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Lado Derecho: Acciones Rápidas */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Botón Cliente Activo */}
          <button
            onClick={onOpenCustomerModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 active:scale-95 ${
              activeCustomerName
                ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/30'
                : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/10'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="max-w-[70px] truncate">
              {activeCustomerName || '+ Cliente'}
            </span>
          </button>

          {/* Botón Soporte Directo WhatsApp VIP */}
          <a
            href={`https://wa.me/51926285289?text=${encodeURIComponent(
              `Hola Korat POS, soy el dueño de "${businessName || 'mi negocio'}". Necesito asistencia técnica y soporte en vivo.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-full flex items-center justify-center bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all duration-150 active:scale-95"
            title="Soporte Técnico VIP por WhatsApp 24/7"
          >
            <MessageSquare className="w-4 h-4 fill-current" />
          </a>

          {/* Toggle de Tema Dual (Dark / Light) */}
          <button
            onClick={onToggleTheme}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 transition-all duration-150 active:scale-95"
            title={`Cambiar a modo ${themeMode === 'dark' ? 'claro' : 'oscuro'}`}
          >
            {themeMode === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-violet-600" />
            )}
          </button>

          {/* Notificaciones */}
          <button
            onClick={onOpenNotifications}
            className="relative w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-all duration-150 active:scale-95"
            title="Notificaciones"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-[#06040f]" />
          </button>
        </div>
      </div>
    </header>
  );
};

