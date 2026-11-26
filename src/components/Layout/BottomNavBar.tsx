/**
 * BottomNavBar — Cápsula flotante estilo Facebook móvil (UI-only)
 */

import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  DatabaseZap,
  Crown,
  MoreHorizontal,
  ChevronUp,
  X,
  Wallet,
  Megaphone,
  Zap,
  Settings,
  MessageSquare,
  BookOpen,
  Star,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { triggerHaptic } from '../../utils/haptics';
import { prefetchRoute } from '../../utils/prefetch';
import { useTranslation } from 'react-i18next';

// ────────────────────────────────────────────────────────────────────────────
// Data & Role Filtering
// ────────────────────────────────────────────────────────────────────────────

interface MasItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string; style?: React.CSSProperties }>;
  color: string;
  bg: string;
  desc: string;
}

const MAS_ITEMS_PRO: MasItem[] = [
  { path: '/nilah/app/club-glow', label: 'Club Glow ✨', icon: Crown, color: '#f59e0b', bg: '#fef3c7', desc: 'Sellos & Premios VIP' },
  { path: '/nilah/app/marketing', label: 'Marketing', icon: Megaphone, color: '#7c3aed', bg: '#ede9fe', desc: 'Campañas IA & Envíos' },
  { path: '/nilah/app/automatizaciones', label: 'Automatizaciones', icon: Zap, color: '#f59e0b', bg: '#fef3c7', desc: 'Flujos y recordatorios' },
  { path: '/nilah/app/carta', label: 'Vitrina Digital', icon: BookOpen, color: '#f43f5e', bg: '#fff1f2', desc: 'Lookbook & Menú ✨' },
  { path: '/nilah/app/resenas', label: 'Reseñas & QR', icon: Star, color: '#f59e0b', bg: '#fef3c7', desc: 'Google Reviews 5⭐' },
  { path: '/nilah/app/finances', label: 'Finanzas', icon: Wallet, color: '#14b8a6', bg: '#ccfbf1', desc: 'Ingresos y gastos' },
  { path: '/nilah/app/settings', label: 'Mi Salón / Ajustes', icon: Settings, color: '#6b7280', bg: '#f3f4f6', desc: 'Perfil del salón y config' },
];

const MAS_ITEMS_BASICO: MasItem[] = [
  { path: '/nilah/app/club-glow', label: 'Club Glow ✨', icon: Crown, color: '#f59e0b', bg: '#fef3c7', desc: 'Sellos & Premios VIP' },
  { path: '/nilah/app/settings', label: 'Ajustes', icon: Settings, color: '#6b7280', bg: '#f3f4f6', desc: 'Perfil del salón y config' },
];

const ADMIN_ONLY_PATHS = new Set([
  '/nilah/app/marketing',
  '/nilah/app/automatizaciones',
  '/nilah/app/carta',
  '/nilah/app/resenas',
  '/nilah/app/finances',
  '/nilah/app/settings',
]);

const filterByRole = <T extends { path: string }>(list: T[], isAdmin: boolean) =>
  isAdmin ? list : list.filter((i) => !ADMIN_ONLY_PATHS.has(i.path));

const ITEM_TRANSLATIONS: Record<string, { label: string; desc: string }> = {
  '/nilah/app/club-glow': { label: 'nav.loyalty', desc: 'Sellos & Premios VIP' },
  '/nilah/app/marketing': { label: 'nav.marketing', desc: 'Campañas IA & Envíos' },
  '/nilah/app/automatizaciones': { label: 'nav.automations', desc: 'Flujos y recordatorios' },
  '/nilah/app/carta': { label: 'nav.digital_menu', desc: 'Lookbook & Menú ✨' },
  '/nilah/app/resenas': { label: 'nav.reviews', desc: 'Google Reviews 5⭐' },
  '/nilah/app/finances': { label: 'nav.finances', desc: 'Ingresos y gastos' },
  '/nilah/app/settings': { label: 'nav.settings', desc: 'nav.salon_profile_config' },
};

// ────────────────────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────────────────────

type IconType = MasItem['icon'];

const FloatingNavItem: React.FC<{
  path: string;
  label: string;
  icon: IconType;
  active: boolean;
  badgeCount?: number;
}> = ({ path, label, icon: Icon, active, badgeCount = 0 }) => {
  return (
    <NavLink
      to={path}
      aria-label={label}
      title={label}
      onClick={() => triggerHaptic('selection')}
      onMouseEnter={() => prefetchRoute(path)}
      onTouchStart={() => prefetchRoute(path)}
      className={`flex-1 h-11 flex items-center justify-center rounded-full transition-all active:scale-95 select-none ${
        active
          ? 'bg-[var(--color-brand)]/14 text-[var(--color-brand)]'
          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
      }`}
    >
      <div className="relative flex items-center justify-center">
        <Icon size={21} strokeWidth={active ? 2.2 : 1.85} />
        {badgeCount > 0 && (
          <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none shadow-sm">
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </div>
    </NavLink>
  );
};

const MasBtn: React.FC<{
  open: boolean;
  anyActive: boolean;
  label: string;
  onToggle: () => void;
}> = ({ open, anyActive, label, onToggle }) => {
  const active = open || anyActive;
  return (
    <button
      type="button"
      onClick={() => {
        triggerHaptic('light');
        onToggle();
      }}
      aria-label={label}
      title={label}
      className={`flex-1 h-11 flex items-center justify-center rounded-full transition-all active:scale-95 select-none ${
        active
          ? 'bg-[var(--color-brand)]/14 text-[var(--color-brand)]'
          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
      }`}
    >
      {open ? (
        <ChevronUp size={21} strokeWidth={2.2} />
      ) : (
        <MoreHorizontal size={21} strokeWidth={active ? 2.2 : 1.85} />
      )}
    </button>
  );
};

/** BottomSheet "Más" */
const MasDrawer: React.FC<{
  items: MasItem[];
  currentPath: string;
  onNavigate: (path: string) => void;
  onClose: () => void;
}> = ({ items, currentPath, onNavigate, onClose }) => {
  const { t } = useTranslation();
  const mainItems = items.filter((i) => i.path !== '/nilah/app/settings');
  const settingsItem = items.find((i) => i.path === '/nilah/app/settings');
  const isSettingsActive = settingsItem ? currentPath.startsWith(settingsItem.path) : false;

  return (
    <motion.div
      key="drawer"
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="fixed left-3.5 right-3.5 z-[65] sm:hidden"
      style={{ bottom: 'calc(76px + env(safe-area-inset-bottom, 0px))' }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.5 }}
      onDragEnd={(_, { offset, velocity }) => {
        if (offset.y > 60 || velocity.y > 500) {
          onClose();
        }
      }}
    >
      <div className="relative overflow-hidden bg-white/95 dark:bg-[#161618]/95 backdrop-blur-2xl rounded-[28px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-gray-200/70 dark:border-white/[0.08]">
        {/* Grab Handle & Header */}
        <div className="flex flex-col items-center pt-3 pb-1.5 cursor-grab active:cursor-grabbing group">
          <div className="w-10 h-1 bg-gray-300/80 dark:bg-white/20 rounded-full transition-colors group-active:bg-gray-400 dark:group-active:bg-white/40" />
          <div className="flex items-center justify-between w-full px-5 mt-2">
            <span className="text-[11px] font-black text-gray-400 dark:text-white/35 uppercase tracking-[0.18em]">
              {t('nav.control_center', 'Centro de Control')}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar centro de control"
              className="w-7 h-7 rounded-full bg-gray-100/90 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-white/60 active:scale-90 transition-transform"
            >
              <X size={14} strokeWidth={2.6} />
            </button>
          </div>
        </div>

        {/* Grid de Módulos */}
        <div className="grid grid-cols-2 gap-2.5 p-3.5 pt-2">
          {mainItems.map((item) => {
            const Icon = item.icon;
            const active = currentPath.startsWith(item.path);
            const tr = ITEM_TRANSLATIONS[item.path];
            const itemLabel = tr?.label ? t(tr.label, item.label) : item.label;
            const itemDesc = tr?.desc?.startsWith('nav.') ? t(tr.desc, item.desc) : item.desc;
            return (
              <button
                type="button"
                key={item.path}
                onClick={() => onNavigate(item.path)}
                onMouseEnter={() => prefetchRoute(item.path)}
                onTouchStart={() => prefetchRoute(item.path)}
                className={`relative flex flex-col items-start gap-2 p-3.5 rounded-[20px] text-left transition-all duration-150 active:scale-[0.97] border ${
                  active
                    ? 'shadow-sm ring-1'
                    : 'bg-gray-50/70 dark:bg-white/[0.03] border-gray-200/60 dark:border-white/[0.05] hover:bg-gray-100/70 dark:hover:bg-white/[0.06]'
                }`}
                style={{
                  backgroundColor: active ? `${item.color}10` : undefined,
                  borderColor: active ? `${item.color}45` : undefined,
                  boxShadow: active ? `0 4px 16px -2px ${item.color}25` : undefined,
                  // @ts-ignore
                  '--tw-ring-color': active ? `${item.color}30` : 'transparent',
                }}
              >
                {active && (
                  <div
                    className="absolute top-3 right-3 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-tight"
                    style={{
                      backgroundColor: `${item.color}18`,
                      color: item.color,
                      border: `1px solid ${item.color}35`,
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{t('common.active', 'Activo')}</span>
                  </div>
                )}

                <div
                  className="w-10 h-10 rounded-[14px] flex items-center justify-center flex-shrink-0 transition-transform"
                  style={{
                    background: active ? item.color : `${item.color}14`,
                    boxShadow: active ? `0 4px 12px ${item.color}40` : 'none',
                    border: active ? 'none' : `1px solid ${item.color}25`,
                  }}
                >
                  <Icon size={20} strokeWidth={2.2} style={{ color: active ? '#ffffff' : item.color }} />
                </div>

                <div className="w-full pr-1">
                  <p className="text-[13.5px] font-bold text-gray-900 dark:text-white leading-tight">{itemLabel}</p>
                  <p className="text-[10px] text-gray-500 dark:text-white/45 mt-0.5 font-medium leading-tight line-clamp-1">{itemDesc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer: Ajustes & Perfil */}
        {settingsItem && (
          <div className="px-3.5 pb-3.5 pt-0.5">
            <div className="h-px w-full bg-gray-200/60 dark:bg-white/[0.06] mb-2.5" />
            <button
              type="button"
              onClick={() => onNavigate(settingsItem.path)}
              onMouseEnter={() => prefetchRoute(settingsItem.path)}
              onTouchStart={() => prefetchRoute(settingsItem.path)}
              className={`w-full flex items-center justify-between p-3.5 rounded-[18px] transition-all duration-150 active:scale-[0.98] border ${
                isSettingsActive
                  ? 'bg-gray-100/90 dark:bg-white/10 border-gray-300 dark:border-white/20 shadow-sm'
                  : 'bg-gray-50/70 dark:bg-white/[0.03] border-gray-200/60 dark:border-white/[0.05] hover:bg-gray-100/70 dark:hover:bg-white/[0.06]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white dark:bg-white/10 shadow-xs border border-gray-200/70 dark:border-white/5">
                  <settingsItem.icon size={17} strokeWidth={2.2} className="text-gray-700 dark:text-gray-200" />
                </div>
                <div className="text-left">
                  <p className="text-[13.5px] font-bold text-gray-900 dark:text-white leading-tight">{t('nav.settings', 'Ajustes')}</p>
                  <p className="text-[10.5px] text-gray-500 dark:text-white/45 font-medium leading-tight mt-0.5">{t('nav.salon_profile_config', 'Perfil del salón y config')}</p>
                </div>
              </div>
              <ChevronUp size={15} className="text-gray-400 rotate-90 mr-1" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const Backdrop: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <motion.div
    key="backdrop"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.18 }}
    className="fixed inset-0 z-[60] sm:hidden"
    style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
    onClick={onClick}
  />
);

// ────────────────────────────────────────────────────────────────────────────
// Main export — cápsula flotante unificada por plan
// ────────────────────────────────────────────────────────────────────────────

export const BottomNavBar: React.FC = () => {
  const { t } = useTranslation();
  const { isCopilot, isPro, hasSaaSModule, isAdmin } = useAuth();
  const { notifications } = useData();
  const location = useLocation();
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);
  const [isInboxChatOpen, setIsInboxChatOpen] = useState(false);

  // Escuchar cuando el usuario entra/sale de un chat individual en Inbox (mobile)
  useEffect(() => {
    const handleInboxToggle = (e: CustomEvent<boolean> | Event) => {
      const detail = (e as CustomEvent<boolean>).detail;
      setIsInboxChatOpen(!!detail);
    };
    window.addEventListener('inbox-nav-toggle', handleInboxToggle);
    return () => {
      window.removeEventListener('inbox-nav-toggle', handleInboxToggle);
    };
  }, []);

  // Resetear al cambiar de ruta fuera de inbox
  useEffect(() => {
    if (!location.pathname.includes('/inbox')) {
      setIsInboxChatOpen(false);
    }
    setShowMore(false);
  }, [location.pathname]);

  // Si estamos chateando en pantalla completa en Inbox móvil, ocultamos la barra inferior
  if (isInboxChatOpen) return null;

  const isProOrCopilot = isCopilot || isPro;
  const unreadCount = notifications.filter((n) => !n.read).length;

  const masItems = isProOrCopilot
    ? filterByRole(MAS_ITEMS_PRO, isAdmin)
        .filter((i) => i.path !== '/nilah/app/club-glow' || hasSaaSModule('club_glow'))
        .filter((i) => i.path !== '/nilah/app/resenas' || hasSaaSModule('resenas'))
        .filter((i) => i.path !== '/nilah/app/finances' || hasSaaSModule('finanzas'))
    : filterByRole(MAS_ITEMS_BASICO, isAdmin)
        .filter((i) => i.path !== '/nilah/app/club-glow' || hasSaaSModule('club_glow'));

  const isActive = (p: string, exact?: boolean) =>
    exact ? location.pathname === p : location.pathname.startsWith(p);

  const moreActive = masItems.some((i) => isActive(i.path));
  const goTo = (p: string) => {
    setShowMore(false);
    navigate(p);
  };

  return (
    <>
      <AnimatePresence>
        {showMore && <Backdrop key="backdrop" onClick={() => setShowMore(false)} />}
        {showMore && (
          <MasDrawer
            key="drawer"
            items={masItems}
            currentPath={location.pathname}
            onNavigate={goTo}
            onClose={() => setShowMore(false)}
          />
        )}
      </AnimatePresence>

      <nav
        aria-label={t('nav.mobile_navigation', 'Navegación móvil')}
        className="sm:hidden fixed z-50 left-3 right-3 bottom-[calc(10px+env(safe-area-inset-bottom,0px))] rounded-full bg-white/92 dark:bg-[#16151B]/92 backdrop-blur-xl border border-black/8 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.12)] px-2 py-1.5"
      >
        <div className="flex items-center gap-1">
          <FloatingNavItem
            path="/nilah/app"
            label={t('nav.dashboard', 'Dashboard')}
            icon={LayoutDashboard}
            active={isActive('/nilah/app', true)}
          />
          <FloatingNavItem
            path="/nilah/app/calendar"
            label={t('nav.calendar', 'Agenda')}
            icon={Calendar}
            active={isActive('/nilah/app/calendar')}
          />
          {isProOrCopilot && (
            <FloatingNavItem
              path="/nilah/app/inbox"
              label={t('nav.inbox', 'Inbox')}
              icon={MessageSquare}
              active={isActive('/nilah/app/inbox')}
              badgeCount={unreadCount}
            />
          )}
          <FloatingNavItem
            path="/nilah/app/clients"
            label={t('nav.clients', 'Clientas')}
            icon={DatabaseZap}
            active={isActive('/nilah/app/clients')}
          />
          <MasBtn
            open={showMore}
            anyActive={moreActive}
            label={t('nav.more', 'Más')}
            onToggle={() => setShowMore((v) => !v)}
          />
        </div>
      </nav>
    </>
  );
};

export default BottomNavBar;
