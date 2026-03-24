/**
 * BottomNavBar v2 — Diseño iOS Premium
 *
 * Mejoras v2:
 * - Fondo glass más oscuro en dark mode
 * - Pill activo con gradiente de color (no solo violeta)
 * - Iconos más grandes y legibles
 * - Texto más visible
 * - FAB Copilot más prominente
 */

import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, DatabaseZap, Crown,
  Bot, MoreHorizontal, ChevronUp,
  Sparkles, Wallet, Megaphone, Zap, TrendingUp, Settings,
  MessageSquare,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useCopilot } from '../../context/CopilotContext';

// ────────────────────────────────────────────────────────────────────────────
// Data
// ────────────────────────────────────────────────────────────────────────────

const MAS_ITEMS_COPILOT = [
  { path: '/nilah/app/clients', label: 'CRM', icon: DatabaseZap, color: '#3b82f6', bg: '#eff6ff', desc: 'Gestión de clientes' },
  { path: '/nilah/app/finances', label: 'Finanzas', icon: Wallet, color: '#14b8a6', bg: '#ccfbf1', desc: 'Ingresos y gastos' },
  { path: '/nilah/app/growth', label: 'Crecimiento', icon: TrendingUp, color: '#10b981', bg: '#d1fae5', desc: 'Analytics & IA' },
  { path: '/nilah/app/marketing', label: 'Marketing', icon: Megaphone, color: '#7c3aed', bg: '#ede9fe', desc: 'Campañas IA' },
  { path: '/nilah/app/creative', label: 'Creative', icon: Sparkles, color: '#ec4899', bg: '#fdf2f8', desc: 'Diseño IA' },
  { path: '/nilah/app/settings', label: 'Ajustes', icon: Settings, color: '#6b7280', bg: '#f3f4f6', desc: 'Perfil y config' },
];

const MAS_ITEMS_PRO = [
  { path: '/nilah/app/finances', label: 'Finanzas', icon: Wallet, color: '#14b8a6', bg: '#ccfbf1', desc: 'Ingresos y gastos' },
  { path: '/nilah/app/growth', label: 'Crecimiento', icon: TrendingUp, color: '#10b981', bg: '#d1fae5', desc: 'Analytics & reportes' },
  { path: '/nilah/app/marketing', label: 'Marketing', icon: Megaphone, color: '#7c3aed', bg: '#ede9fe', desc: 'Campañas semanales' },
  { path: '/nilah/app/creative', label: 'Creative', icon: Sparkles, color: '#ec4899', bg: '#fdf2f8', desc: 'Diseño automático' },
  { path: '/nilah/app/settings', label: 'Ajustes', icon: Settings, color: '#6b7280', bg: '#f3f4f6', desc: 'Perfil y config' },
];

// Colores por ruta para el pill activo
const ROUTE_COLORS: Record<string, { pill: string; icon: string; text: string }> = {
  '/nilah/app/calendar': { pill: 'rgba(124,58,237,0.18)', icon: '#7c3aed', text: '#7c3aed' },
  '/nilah/app/inbox': { pill: 'rgba(34,197,94,0.18)', icon: '#22c55e', text: '#22c55e' },
  '/nilah/app/clients': { pill: 'rgba(59,130,246,0.18)', icon: '#3b82f6', text: '#3b82f6' },
  '/nilah/app/loyalty': { pill: 'rgba(245,158,11,0.18)', icon: '#f59e0b', text: '#d97706' },
  '/nilah/app/settings': { pill: 'rgba(107,114,128,0.18)', icon: '#6b7280', text: '#6b7280' },
};

const getRouteColor = (path: string) =>
  ROUTE_COLORS[path] || { pill: 'rgba(124,58,237,0.18)', icon: '#7c3aed', text: '#7c3aed' };

// ────────────────────────────────────────────────────────────────────────────
// Shared sub-components
// ────────────────────────────────────────────────────────────────────────────

type IconType = React.ComponentType<{ size?: number; strokeWidth?: number; className?: string; style?: React.CSSProperties }>;

/** Nav item con pill background al activarse */
const PillNavItem: React.FC<{
  path: string; label: string; icon: IconType; active: boolean; flex1?: boolean;
}> = ({ path, label, icon: Icon, active, flex1 = true }) => {
  const colors = getRouteColor(path);

  return (
    <NavLink
      to={path}
      className={`${flex1 ? 'flex-1' : ''} flex flex-col items-center justify-center gap-0.5 py-1.5`}
    >
      <div className="relative flex items-center justify-center" style={{ height: 34, minWidth: 48 }}>
        <motion.div
          initial={false}
          animate={active ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
          className="absolute inset-0 rounded-2xl"
          style={{ background: active ? colors.pill : 'transparent' }}
        />
        <motion.div
          animate={active ? { y: -1, scale: 1.1 } : { y: 0, scale: 1 }}
          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
          className="relative z-10"
        >
          <Icon
            size={22}
            strokeWidth={active ? 2.5 : 1.8}
            style={{ color: active ? colors.icon : undefined }}
            className={active ? '' : 'text-gray-400 dark:text-gray-500'}
          />
        </motion.div>
      </div>
      <span
        className={`text-[10px] tracking-wide transition-colors ${active ? 'font-extrabold' : 'font-semibold text-gray-500 dark:text-gray-400'}`}
        style={{ color: active ? colors.text : undefined }}
      >
        {label}
      </span>
    </NavLink>
  );
};

/** Botón "Más" con chevron animado */
const MasBtn: React.FC<{ open: boolean; anyActive: boolean; onToggle: () => void }> = ({
  open, anyActive, onToggle,
}) => {
  const hi = open || anyActive;
  return (
    <button
      onClick={onToggle}
      className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5"
    >
      <div className="relative flex items-center justify-center" style={{ height: 34, minWidth: 48 }}>
        <motion.div
          initial={false}
          animate={hi ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
          className="absolute inset-0 rounded-2xl"
          style={{ background: hi ? 'rgba(124,58,237,0.18)' : 'transparent' }}
        />
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 260 }}
          className="relative z-10"
        >
          {open
            ? <ChevronUp size={22} strokeWidth={2.5} style={{ color: '#7c3aed' }} />
            : <MoreHorizontal
              size={22}
              strokeWidth={anyActive ? 2.5 : 1.8}
              style={{ color: anyActive ? '#7c3aed' : undefined }}
              className={anyActive ? '' : 'text-gray-400 dark:text-gray-500'}
            />
          }
        </motion.div>
      </div>
      <span
        className={`text-[10px] tracking-wide transition-colors ${hi ? 'font-extrabold' : 'font-semibold text-gray-500 dark:text-gray-400'}`}
        style={{ color: hi ? '#7c3aed' : undefined }}
      >
        Más
      </span>
    </button>
  );
};

/** Drawer "Más" compartido */
const MasDrawer: React.FC<{
  items: typeof MAS_ITEMS_COPILOT;
  currentPath: string;
  onNavigate: (path: string) => void;
}> = ({ items, currentPath, onNavigate }) => (
  <motion.div
    key="drawer"
    initial={{ y: 28, opacity: 0, scale: 0.97 }}
    animate={{ y: 0, opacity: 1, scale: 1 }}
    exit={{ y: 28, opacity: 0, scale: 0.97 }}
    transition={{ type: 'spring', damping: 26, stiffness: 280 }}
    className="fixed left-3 right-3 z-[65] sm:hidden"
    style={{ bottom: 'calc(68px + env(safe-area-inset-bottom, 0px) + 8px)' }}
  >
    <div
      className="rounded-2xl overflow-hidden shadow-2xl bg-white/95 dark:bg-[rgba(15,15,20,0.96)] border border-gray-200/50 dark:border-white/10 transition-colors"
      style={{
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
    >
      {/* Handle */}
      <div className="flex flex-col items-center pt-2.5 pb-1 gap-1">
        <div className="w-8 h-1 bg-gray-300 dark:bg-white/20 rounded-full" />
        <p className="text-[10px] font-bold text-gray-500 dark:text-white/40 uppercase tracking-widest">Módulos</p>
      </div>

      <div className="grid grid-cols-2 gap-2 px-3 pb-4 pt-1">
        {items.map((item, i) => {
          const Icon = item.icon;
          const active = currentPath.startsWith(item.path);
          return (
            <motion.button
              key={item.path}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, type: 'spring', damping: 24, stiffness: 280 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate(item.path)}
              className={`flex items-center gap-3 p-3 rounded-xl text-left border-transparent dark:border-white/[0.08] transition-colors ${active ? '' : 'bg-gray-50 hover:bg-gray-100 dark:bg-white/[0.06] dark:hover:bg-white/[0.08]'}`}
              style={{
                background: active ? item.color + '1A' : undefined,
                border: `1.5px solid ${active ? item.color + '40' : 'transparent'}`,
                boxShadow: active ? `0 2px 12px ${item.color}22` : 'none',
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: item.color + '1A' }}
              >
                <Icon size={19} strokeWidth={2.2} style={{ color: item.color }} />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-gray-900 dark:text-white leading-tight">{item.label}</p>
                <p className="text-[10px] text-gray-500 dark:text-white/40 mt-0.5 leading-tight truncate">{item.desc}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  </motion.div>
);

/** Fondo oscuro para el drawer */
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

/** Contenedor base del nav — glass premium */
const NavBar: React.FC<{ children: React.ReactNode; badge?: React.ReactNode; innerClassName?: string }> = ({ children, badge, innerClassName = "flex items-center h-16 px-1" }) => {
  const [hidden, setHidden] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Escuchar evento de la bandeja compartida (chat o profile)
    const handleInboxToggle = (e: CustomEvent<boolean>) => {
      setHidden(e.detail);
    };

    window.addEventListener('inbox-nav-toggle', handleInboxToggle as EventListener);

    const mainEl = document.querySelector('main');
    if (!mainEl) {
      setHidden(false);
      return;
    }

    let lastScrollY = mainEl.scrollTop;
    let ticking = false;

    const handleScroll = () => {
      // Si estamos en inbox con chat activo, no aplicamos logica de scroll
      if (document.querySelector('.inbox-chat-active')) return;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = mainEl.scrollTop;
          // Hide when scrolling down past 50px
          if (currentScrollY > lastScrollY && currentScrollY > 50) {
            setHidden(true);
          } 
          // Show when scrolling up
          else if (currentScrollY < lastScrollY - 5) {
            setHidden(false);
          }
          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    setHidden(false); // Reset on route change
    mainEl.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('inbox-nav-toggle', handleInboxToggle as EventListener);
      mainEl.removeEventListener('scroll', handleScroll);
    };
  }, [location.pathname]);

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-50 sm:hidden border-t border-gray-200/50 bg-white/90 shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.05)] dark:border-white/10 dark:bg-[rgba(10,10,16,0.88)] dark:shadow-[0_-8px_32px_rgba(0,0,0,0.3)] transition-transform duration-300 ease-in-out ${hidden ? 'translate-y-[150%]' : 'translate-y-0'}`}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        backdropFilter: 'blur(28px) saturate(200%)',
        WebkitBackdropFilter: 'blur(28px) saturate(200%)',
      }}
    >
      {badge}
      <div className={innerClassName}>
        {children}
      </div>
    </nav>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// Layout A — COPILOT plan
// Inicio | Agenda | 🤖 (FAB) | CRM | Más
// ────────────────────────────────────────────────────────────────────────────

const NavCopilot: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { openCopilot } = useCopilot();
  const [showMore, setShowMore] = useState(false);

  const isActive = (p: string, exact?: boolean) =>
    exact ? location.pathname === p : location.pathname.startsWith(p);

  const moreActive = MAS_ITEMS_COPILOT.some((i) => isActive(i.path));
  const goTo = (p: string) => { setShowMore(false); navigate(p); };

  return (
    <>
      <AnimatePresence>
        {showMore && (
          <>
            <Backdrop onClick={() => setShowMore(false)} />
            <MasDrawer items={MAS_ITEMS_COPILOT} currentPath={location.pathname} onNavigate={goTo} />
          </>
        )}
      </AnimatePresence>

      <NavBar>
        <PillNavItem path="/nilah/app" label="Inicio" icon={LayoutDashboard} active={isActive('/nilah/app', true)} />
        <PillNavItem path="/nilah/app/calendar" label="Agenda" icon={Calendar} active={isActive('/nilah/app/calendar')} />

        {/* Copilot FAB central */}
        <div className="flex-1 flex items-center justify-center">
          <motion.button
            whileTap={{ scale: 0.88 }}
            whileHover={{ scale: 1.06 }}
            onClick={() => openCopilot({ sourceContext: 'bottom_nav' })}
            className="flex items-center justify-center rounded-2xl text-white"
            style={{
              width: 52, height: 52, marginBottom: 20,
              background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
              boxShadow: '0 8px 24px rgba(124,58,237,0.55), 0 2px 8px rgba(79,70,229,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
            title="Nilah Copilot"
          >
            <Bot size={24} strokeWidth={2} />
          </motion.button>
        </div>

        <PillNavItem path="/nilah/app/inbox" label="Inbox" icon={MessageSquare} active={isActive('/nilah/app/inbox')} />
        <MasBtn open={showMore} anyActive={moreActive} onToggle={() => setShowMore((v) => !v)} />
      </NavBar>
    </>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// Layout B — PRO plan
// Inicio | Agenda | CRM | Fidelización | Más
// ────────────────────────────────────────────────────────────────────────────

const NavPro: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);

  const isActive = (p: string, exact?: boolean) =>
    exact ? location.pathname === p : location.pathname.startsWith(p);

  const moreActive = MAS_ITEMS_PRO.some((i) => isActive(i.path));
  const goTo = (p: string) => { setShowMore(false); navigate(p); };

  return (
    <>
      <AnimatePresence>
        {showMore && (
          <>
            <Backdrop onClick={() => setShowMore(false)} />
            <MasDrawer items={MAS_ITEMS_PRO} currentPath={location.pathname} onNavigate={goTo} />
          </>
        )}
      </AnimatePresence>

      <NavBar
        badge={
          <div className="flex justify-center pt-1">
            <span
              className="px-2 py-0.5 rounded-full text-[8px] font-extrabold tracking-widest uppercase"
              style={{ background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', color: '#fff', letterSpacing: '0.12em' }}
            >
              PRO
            </span>
          </div>
        }
        innerClassName="flex items-center h-[52px] px-1"
      >
        <PillNavItem path="/nilah/app" label="Inicio" icon={LayoutDashboard} active={isActive('/nilah/app', true)} />
        <PillNavItem path="/nilah/app/calendar" label="Agenda" icon={Calendar} active={isActive('/nilah/app/calendar')} />
        <PillNavItem path="/nilah/app/inbox" label="Inbox" icon={MessageSquare} active={isActive('/nilah/app/inbox')} />
        <PillNavItem path="/nilah/app/clients" label="CRM" icon={DatabaseZap} active={isActive('/nilah/app/clients')} />
        <MasBtn open={showMore} anyActive={moreActive} onToggle={() => setShowMore((v) => !v)} />
      </NavBar>
    </>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// Layout C — BÁSICO plan
// Inicio | Agenda | CRM | Configuración
// ────────────────────────────────────────────────────────────────────────────

const NavBasico: React.FC = () => {
  const location = useLocation();
  const isActive = (p: string, exact?: boolean) =>
    exact ? location.pathname === p : location.pathname.startsWith(p);

  return (
    <NavBar innerClassName="flex items-center h-16 px-4">
      <PillNavItem path="/nilah/app" label="Inicio" icon={LayoutDashboard} active={isActive('/nilah/app', true)} />
      <PillNavItem path="/nilah/app/calendar" label="Agenda" icon={Calendar} active={isActive('/nilah/app/calendar')} />
      <PillNavItem path="/nilah/app/inbox" label="Inbox" icon={MessageSquare} active={isActive('/nilah/app/inbox')} />
      <PillNavItem path="/nilah/app/clients" label="CRM" icon={DatabaseZap} active={isActive('/nilah/app/clients')} />
      <PillNavItem path="/nilah/app/settings" label="Ajustes" icon={Settings} active={isActive('/nilah/app/settings')} />
    </NavBar>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// Main export — selecciona layout según plan
// ────────────────────────────────────────────────────────────────────────────

export const BottomNavBar: React.FC = () => {
  const { isCopilot, isPro } = useAuth();

  if (isCopilot) return <NavCopilot />;
  if (isPro) return <NavPro />;
  return <NavBasico />;
};

export default BottomNavBar;
