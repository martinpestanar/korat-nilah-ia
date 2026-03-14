/**
 * BottomNavBar — 3 Layouts según Plan
 *
 * ┌──────────────────────────────────────────────┐
 * │  COPILOT  │ Inicio │ Agenda │ 🤖 │ CRM │ Más │  ← FAB central elevado
 * │  PRO      │ Inicio │ Agenda │ CRM │ Fid │ Más │  ← 5 ítems + pill activo
 * │  BÁSICO   │ Inicio │ Agenda │ CRM │ Fid │     │  ← 4 ítems clean, sin más
 * └──────────────────────────────────────────────┘
 *
 * Indicador activo: pill/cápsula detrás del icono (sin barra arriba)
 * Animaciones: framer-motion spring
 */

import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, DatabaseZap, Crown,
  Bot, MoreHorizontal, ChevronUp,
  Megaphone, Zap, TrendingUp, Settings,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useCopilot } from '../../context/CopilotContext';

// ────────────────────────────────────────────────────────────────────────────
// Data
// ────────────────────────────────────────────────────────────────────────────

const MAS_ITEMS_COPILOT = [
  { path: '/nilah/app/loyalty', label: 'Fidelización', icon: Crown, color: '#f59e0b', bg: '#fef3c7', desc: 'Puntos y rewards' },
  { path: '/nilah/app/marketing', label: 'Marketing', icon: Megaphone, color: '#7c3aed', bg: '#ede9fe', desc: 'Campañas IA' },
  { path: '/nilah/app/engagement', label: 'Engagement', icon: Zap, color: '#f97316', bg: '#ffedd5', desc: 'Recordatorios auto' },
  { path: '/nilah/app/growth', label: 'Crecimiento', icon: TrendingUp, color: '#10b981', bg: '#d1fae5', desc: 'Analytics & IA' },
  { path: '/nilah/app/settings', label: 'Ajustes', icon: Settings, color: '#6b7280', bg: '#f3f4f6', desc: 'Perfil y config' },
];

const MAS_ITEMS_PRO = [
  { path: '/nilah/app/marketing', label: 'Marketing', icon: Megaphone, color: '#7c3aed', bg: '#ede9fe', desc: 'Campañas semanales' },
  { path: '/nilah/app/engagement', label: 'Engagement', icon: Zap, color: '#f97316', bg: '#ffedd5', desc: 'Recordatorios auto' },
  { path: '/nilah/app/growth', label: 'Crecimiento', icon: TrendingUp, color: '#10b981', bg: '#d1fae5', desc: 'Analytics & IA' },
  { path: '/nilah/app/settings', label: 'Ajustes', icon: Settings, color: '#6b7280', bg: '#f3f4f6', desc: 'Perfil y config' },
];

// ────────────────────────────────────────────────────────────────────────────
// Shared sub-components
// ────────────────────────────────────────────────────────────────────────────

type IconType = React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;

/** Nav item con pill background al activarse */
const PillNavItem: React.FC<{
  path: string; label: string; icon: IconType; active: boolean; flex1?: boolean;
}> = ({ path, label, icon: Icon, active, flex1 = true }) => (
  <NavLink
    to={path}
    className={`${flex1 ? 'flex-1' : ''} flex flex-col items-center justify-center gap-0 py-1`}
  >
    <div className="relative flex items-center justify-center" style={{ height: 32, minWidth: 44 }}>
      <motion.div
        initial={false}
        animate={active ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
        transition={{ type: 'spring', damping: 22, stiffness: 300 }}
        className="absolute inset-0 bg-violet-100 dark:bg-violet-900/40 rounded-2xl"
      />
      <motion.div
        animate={active ? { y: 0, scale: 1.08 } : { y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 22, stiffness: 300 }}
        className="relative z-10"
      >
        <Icon
          size={21}
          strokeWidth={active ? 2.5 : 1.8}
          className={active ? 'text-violet-600 dark:text-violet-400' : 'text-gray-400 dark:text-gray-500'}
        />
      </motion.div>
    </div>
    <motion.span
      animate={{ color: active ? '#7c3aed' : '#9ca3af' }}
      className="text-[9.5px] font-bold tracking-wide uppercase"
    >
      {label}
    </motion.span>
  </NavLink>
);

/** Botón "Más" con chevron animado */
const MasBtn: React.FC<{ open: boolean; anyActive: boolean; onToggle: () => void }> = ({
  open, anyActive, onToggle,
}) => {
  const hi = open || anyActive;
  return (
    <button
      onClick={onToggle}
      className="flex-1 flex flex-col items-center justify-center gap-0 py-1"
    >
      <div className="relative flex items-center justify-center" style={{ height: 32, minWidth: 44 }}>
        <motion.div
          initial={false}
          animate={hi ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
          className="absolute inset-0 bg-violet-100 dark:bg-violet-900/40 rounded-2xl"
        />
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 260 }}
          className="relative z-10"
        >
          {open
            ? <ChevronUp size={21} strokeWidth={2.5} className="text-violet-600" />
            : <MoreHorizontal size={21} strokeWidth={anyActive ? 2.5 : 1.8}
              className={anyActive ? 'text-violet-600' : 'text-gray-400 dark:text-gray-500'} />
          }
        </motion.div>
      </div>
      <motion.span
        animate={{ color: hi ? '#7c3aed' : '#9ca3af' }}
        className="text-[9.5px] font-bold tracking-wide uppercase"
      >
        Más
      </motion.span>
    </button>
  );
};

/** Drawer "Más" compartido (recibe items de cualquier plan) */
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
    className="fixed left-3 right-3 z-50 sm:hidden"
    style={{ bottom: 'calc(64px + env(safe-area-inset-bottom, 0px) + 10px)' }}
  >
    <div
      className="rounded-2xl overflow-hidden shadow-2xl"
      style={{
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(0,0,0,0.07)',
      }}
    >
      {/* Handle */}
      <div className="flex flex-col items-center pt-2.5 pb-1 gap-1">
        <div className="w-8 h-1 bg-gray-200 rounded-full" />
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Módulos</p>
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
              className="flex items-center gap-3 p-3 rounded-xl text-left"
              style={{
                background: active ? item.bg : '#f9fafb',
                border: `1.5px solid ${active ? item.color + '55' : '#e5e7eb'}`,
                boxShadow: active ? `0 2px 12px ${item.color}22` : 'none',
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: item.bg }}
              >
                <Icon size={19} strokeWidth={2.2} style={{ color: item.color }} />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-gray-900 leading-tight">{item.label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-tight truncate">{item.desc}</p>
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
    className="fixed inset-0 z-40 sm:hidden"
    style={{ background: 'rgba(0,0,0,0.32)', backdropFilter: 'blur(3px)' }}
    onClick={onClick}
  />
);

/** Contenedor base del nav (glass bottom bar) */
const NavBar: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <nav
    className="fixed bottom-0 left-0 right-0 z-50 sm:hidden"
    style={{
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(24px) saturate(200%)',
      WebkitBackdropFilter: 'blur(24px) saturate(200%)',
      borderTop: '1px solid rgba(0,0,0,0.07)',
      boxShadow: '0 -4px 24px rgba(0,0,0,0.05)',
    }}
  >
    <div className="dark:bg-[#09090f]/92">
      <div className="flex items-center h-16 px-1">
        {children}
      </div>
    </div>
  </nav>
);

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

        {/* Copilot FAB */}
        <div className="flex-1 flex items-center justify-center">
          <motion.button
            whileTap={{ scale: 0.88 }}
            whileHover={{ scale: 1.06 }}
            onClick={() => openCopilot({ sourceContext: 'bottom_nav' })}
            className="flex items-center justify-center rounded-2xl text-white"
            style={{
              width: 52, height: 52, marginBottom: 22,
              background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
              boxShadow: '0 8px 24px rgba(124,58,237,0.45), 0 2px 8px rgba(79,70,229,0.3)',
            }}
            title="Nilah Copilot"
          >
            <Bot size={24} strokeWidth={2} />
          </motion.button>
        </div>

        <PillNavItem path="/nilah/app/clients" label="CRM" icon={DatabaseZap} active={isActive('/nilah/app/clients')} />
        <MasBtn open={showMore} anyActive={moreActive} onToggle={() => setShowMore((v) => !v)} />
      </NavBar>
    </>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// Layout B — PRO plan
// Inicio | Agenda | CRM | Fidelización | Más
// Diseño: 5 ítems con pill activo, sin FAB
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

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 sm:hidden"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(24px) saturate(200%)',
          WebkitBackdropFilter: 'blur(24px) saturate(200%)',
          borderTop: '1px solid rgba(0,0,0,0.07)',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.05)',
        }}
      >
        {/* Plan badge subtle */}
        <div className="flex justify-center pt-1">
          <span
            className="px-2 py-0.5 rounded-full text-[8px] font-extrabold tracking-widest uppercase"
            style={{ background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', color: '#fff', letterSpacing: '0.12em' }}
          >
            PRO
          </span>
        </div>

        <div className="dark:bg-[#09090f]/92">
          <div className="flex items-center h-[52px] px-1">
            <PillNavItem path="/nilah/app" label="Inicio" icon={LayoutDashboard} active={isActive('/nilah/app', true)} />
            <PillNavItem path="/nilah/app/calendar" label="Agenda" icon={Calendar} active={isActive('/nilah/app/calendar')} />
            <PillNavItem path="/nilah/app/clients" label="CRM" icon={DatabaseZap} active={isActive('/nilah/app/clients')} />
            <PillNavItem path="/nilah/app/loyalty" label="Fideliz." icon={Crown} active={isActive('/nilah/app/loyalty')} />
            <MasBtn open={showMore} anyActive={moreActive} onToggle={() => setShowMore((v) => !v)} />
          </div>
        </div>
      </nav>
    </>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// Layout C — BÁSICO plan
// Inicio | Agenda | CRM | Configuración
// Diseño: 4 ítems con pill activo, minimalista y limpio
// ────────────────────────────────────────────────────────────────────────────

const NavBasico: React.FC = () => {
  const location = useLocation();
  const isActive = (p: string, exact?: boolean) =>
    exact ? location.pathname === p : location.pathname.startsWith(p);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 sm:hidden"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderTop: '1px solid rgba(0,0,0,0.07)',
        boxShadow: '0 -2px 16px rgba(0,0,0,0.04)',
      }}
    >
      <div className="dark:bg-[#09090f]/95">
        <div className="flex items-center h-16 px-4">
          <PillNavItem path="/nilah/app" label="Inicio" icon={LayoutDashboard} active={isActive('/nilah/app', true)} />
          <PillNavItem path="/nilah/app/calendar" label="Agenda" icon={Calendar} active={isActive('/nilah/app/calendar')} />
          <PillNavItem path="/nilah/app/clients" label="CRM" icon={DatabaseZap} active={isActive('/nilah/app/clients')} />
          <PillNavItem path="/nilah/app/settings" label="Ajustes" icon={Settings} active={isActive('/nilah/app/settings')} />
        </div>
      </div>
    </nav>
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
