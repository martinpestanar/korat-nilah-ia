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
  Bot, MoreHorizontal, ChevronUp, X,
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

// Colores por ruta para el pill activo — los rutas 'brand' leen la variable CSS dinámica
const getBrandColor = () => {
  if (typeof window !== 'undefined') {
    return getComputedStyle(document.documentElement)
      .getPropertyValue('--color-violet-600').trim() || '#7c3aed';
  }
  return '#7c3aed';
};

const ROUTE_COLORS: Record<string, { pill: string; icon: string; text: string }> = {
  '/nilah/app/calendar': { pill: 'rgba(124,58,237,0.18)', icon: 'brand', text: 'brand' },
  '/nilah/app/inbox':   { pill: 'rgba(34,197,94,0.18)',  icon: '#22c55e', text: '#22c55e' },
  '/nilah/app/clients': { pill: 'rgba(59,130,246,0.18)', icon: '#3b82f6', text: '#3b82f6' },
  '/nilah/app/settings':{ pill: 'rgba(107,114,128,0.18)',icon: '#6b7280', text: '#6b7280' },
};

const getRouteColor = (path: string) => {
  const raw = ROUTE_COLORS[path] || { pill: 'rgba(124,58,237,0.18)', icon: 'brand', text: 'brand' };
  const brandColor = getBrandColor();
  return {
    pill: raw.pill,
    icon: raw.icon === 'brand' ? brandColor : raw.icon,
    text: raw.text === 'brand' ? brandColor : raw.text,
  };
};

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
  const brandColor = getBrandColor();
  const pillColor = `color-mix(in srgb, ${brandColor} 18%, transparent)`;
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
          style={{ background: hi ? pillColor : 'transparent' }}
        />
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 260 }}
          className="relative z-10"
        >
          {open
            ? <ChevronUp size={22} strokeWidth={2.5} style={{ color: brandColor }} />
            : <MoreHorizontal
              size={22}
              strokeWidth={anyActive ? 2.5 : 1.8}
              style={{ color: anyActive ? brandColor : undefined }}
              className={anyActive ? '' : 'text-gray-400 dark:text-gray-500'}
            />
          }
        </motion.div>
      </div>
      <span
        className={`text-[10px] tracking-wide transition-colors ${hi ? 'font-extrabold' : 'font-semibold text-gray-500 dark:text-gray-400'}`}
        style={{ color: hi ? brandColor : undefined }}
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
  onClose: () => void;
}> = ({ items, currentPath, onNavigate, onClose }) => {
  const mainItems = items.filter(i => i.path !== '/nilah/app/settings');
  const settingsItem = items.find(i => i.path === '/nilah/app/settings');

  return (
    <motion.div
      key="drawer"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      className="fixed left-4 right-4 z-[65] sm:hidden"
      style={{ bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.6 }}
      onDragEnd={(e, { offset, velocity }) => {
        if (offset.y > 60 || velocity.y > 500) {
          onClose();
        }
      }}
    >
      <div className="relative overflow-hidden bg-white/80 dark:bg-[#1C1C1E]/90 backdrop-blur-3xl rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/20 dark:border-white/10">
        {/* Grab Handle & Header */}
        <div className="flex flex-col items-center pt-4 pb-2 cursor-grab active:cursor-grabbing group">
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-white/20 rounded-full transition-colors group-active:bg-gray-400 dark:group-active:bg-white/40" />
          <div className="flex items-center justify-between w-full px-6 mt-3">
            <span className="text-[11px] font-black text-gray-400 dark:text-white/30 uppercase tracking-[0.2em]">Centro de Control</span>
            <button 
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-white/60 active:scale-90 transition-transform"
            >
              <X size={14} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* Grid de Módulos */}
        <div className="grid grid-cols-2 gap-3 p-4 pt-2">
          {mainItems.map((item, i) => {
            const Icon = item.icon;
            const active = currentPath.startsWith(item.path);
            return (
              <motion.button
                key={item.path}
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: i * 0.04, type: 'spring', damping: 20, stiffness: 300 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate(item.path)}
                className={`group relative flex flex-col items-start gap-2 p-4 rounded-[24px] text-left transition-all ${
                  active 
                    ? 'bg-white dark:bg-white/10 shadow-lg' 
                    : 'bg-gray-50/50 dark:bg-white/[0.03] active:bg-gray-100 dark:active:bg-white/[0.06]'
                }`}
                style={{
                  border: `1.5px solid ${active ? item.color + '40' : 'transparent'}`,
                }}
              >
                {active && (
                  <motion.div 
                    layoutId="activeGlow"
                    className="absolute inset-0 rounded-[24px] opacity-20 blur-xl z-0"
                    style={{ background: item.color }}
                  />
                )}
                
                <div
                  className="relative z-10 w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-active:scale-90"
                  style={{ 
                    background: active ? item.color : item.color + '15',
                    boxShadow: active ? `0 8px 16px ${item.color}44` : 'none'
                  }}
                >
                  <Icon size={22} strokeWidth={2.2} style={{ color: active ? '#fff' : item.color }} />
                </div>
                
                <div className="relative z-10">
                  <p className="text-[14px] font-bold text-gray-900 dark:text-white leading-tight">{item.label}</p>
                  <p className="text-[10px] text-gray-500 dark:text-white/40 mt-0.5 font-medium">{item.desc}</p>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Footer: Ajustes & Perfil */}
        {settingsItem && (
          <div className="px-4 pb-5">
            <div className="h-px w-full bg-gray-200/50 dark:bg-white/5 mb-4" />
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigate(settingsItem.path)}
              className="w-full flex items-center justify-between p-4 rounded-[22px] bg-gray-50/50 dark:bg-white/[0.03] active:bg-gray-100 dark:active:bg-white/[0.06] transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-white/10 shadow-sm border border-gray-100 dark:border-white/5">
                  <settingsItem.icon size={18} strokeWidth={2.2} className="text-gray-600 dark:text-gray-300" />
                </div>
                <div className="text-left">
                  <p className="text-[14px] font-bold text-gray-900 dark:text-white leading-tight">{settingsItem.label}</p>
                  <p className="text-[11px] text-gray-500 dark:text-white/40 font-medium leading-tight mt-0.5">{settingsItem.desc}</p>
                </div>
              </div>
              <ChevronUp size={16} className="text-gray-400 rotate-90" />
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

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
      className={`navbar-surface fixed bottom-0 left-0 right-0 z-50 sm:hidden transition-transform duration-300 ease-in-out ${hidden ? 'translate-y-[150%]' : 'translate-y-0'}`}
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom), 0px)',
        backdropFilter: 'blur(28px) saturate(200%)',
        WebkitBackdropFilter: 'blur(28px) saturate(200%)',
        willChange: 'transform',
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
        {showMore && <Backdrop key="backdrop" onClick={() => setShowMore(false)} />}
        {showMore && <MasDrawer key="drawer" items={MAS_ITEMS_COPILOT} currentPath={location.pathname} onNavigate={goTo} onClose={() => setShowMore(false)} />}
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
            className="flex items-center justify-center rounded-2xl text-white gradient-brand"
            style={{
              width: 52, height: 52, marginBottom: 20,
              boxShadow: 'var(--shadow-brand)',
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
        {showMore && <Backdrop key="backdrop" onClick={() => setShowMore(false)} />}
        {showMore && <MasDrawer key="drawer" items={MAS_ITEMS_PRO} currentPath={location.pathname} onNavigate={goTo} onClose={() => setShowMore(false)} />}
      </AnimatePresence>

      <NavBar
        badge={
          <div className="flex justify-center pt-1">
            <span
              className="px-2 py-0.5 rounded-full text-[8px] font-extrabold tracking-widest uppercase gradient-brand"
              style={{ color: '#fff', letterSpacing: '0.12em' }}
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
