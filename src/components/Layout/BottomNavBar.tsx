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
  MessageSquare, Send, ShoppingBag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useCopilot } from '../../context/CopilotContext';

// ────────────────────────────────────────────────────────────────────────────
// Data
// ────────────────────────────────────────────────────────────────────────────

const MAS_ITEMS_COPILOT = [
  { path: '/nilah/app/store', label: '🛒 Tienda & Packs', icon: ShoppingBag, color: '#ec4899', bg: '#fdf2f8', desc: 'Marketplace & Upgrades' },
  { path: '/nilah/app/clients', label: 'CRM', icon: DatabaseZap, color: '#3b82f6', bg: '#eff6ff', desc: 'Gestión de clientes' },
  { path: '/nilah/app/finances', label: 'Finanzas', icon: Wallet, color: '#14b8a6', bg: '#ccfbf1', desc: 'Ingresos y gastos' },
  { path: '/nilah/app/marketing', label: 'Marketing', icon: Megaphone, color: '#7c3aed', bg: '#ede9fe', desc: 'Campañas IA' },
  { path: '/nilah/app/broadcasts', label: 'Envíos', icon: Send, color: '#f43f5e', bg: '#fff1f2', desc: 'WhatsApp masivo' },
  { path: '/nilah/app/creative', label: 'Creative', icon: Sparkles, color: '#ec4899', bg: '#fdf2f8', desc: 'Diseño IA' },
  { path: '/nilah/app/settings', label: 'Ajustes', icon: Settings, color: '#6b7280', bg: '#f3f4f6', desc: 'Perfil y config' },
];

const MAS_ITEMS_PRO = [
  { path: '/nilah/app/store', label: '🛒 Tienda & Packs', icon: ShoppingBag, color: '#ec4899', bg: '#fdf2f8', desc: 'Marketplace & Upgrades' },
  { path: '/nilah/app/finances', label: 'Finanzas', icon: Wallet, color: '#14b8a6', bg: '#ccfbf1', desc: 'Ingresos y gastos' },
  { path: '/nilah/app/marketing', label: 'Marketing', icon: Megaphone, color: '#7c3aed', bg: '#ede9fe', desc: 'Campañas semanales' },
  { path: '/nilah/app/broadcasts', label: 'Envíos', icon: Send, color: '#f43f5e', bg: '#fff1f2', desc: 'WhatsApp masivo' },
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

/** Nav item con pill background al activarse y touch target optimizado */
const PillNavItem: React.FC<{
  path: string; label: string; icon: IconType; active: boolean; flex1?: boolean;
}> = ({ path, label, icon: Icon, active, flex1 = true }) => {
  const colors = getRouteColor(path);

  return (
    <NavLink
      to={path}
      className={`${flex1 ? 'flex-1' : ''} flex flex-col items-center justify-center pt-1 pb-0.5 active:scale-95 transition-transform select-none`}
    >
      <div className="relative flex items-center justify-center" style={{ height: 28, minWidth: 42 }}>
        <motion.div
          initial={false}
          animate={active ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
          className="absolute inset-0 rounded-xl"
          style={{ background: active ? colors.pill : 'transparent' }}
        />
        <motion.div
          animate={active ? { y: -1, scale: 1.08 } : { y: 0, scale: 1 }}
          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
          className="relative z-10"
        >
          <Icon
            size={20}
            strokeWidth={active ? 2.5 : 1.8}
            style={{ color: active ? colors.icon : undefined }}
            className={active ? '' : 'text-gray-400 dark:text-gray-500'}
          />
        </motion.div>
      </div>
      <span
        className={`text-[10px] tracking-wide transition-colors leading-tight mt-0.5 ${active ? 'font-extrabold' : 'font-semibold text-gray-500 dark:text-gray-400'}`}
        style={{ color: active ? colors.text : undefined }}
      >
        {label}
      </span>
    </NavLink>
  );
};

/** Botón "Más" con chevron animado y touch target optimizado */
const MasBtn: React.FC<{ open: boolean; anyActive: boolean; onToggle: () => void }> = ({
  open, anyActive, onToggle,
}) => {
  const hi = open || anyActive;
  const brandColor = getBrandColor();
  const pillColor = `color-mix(in srgb, ${brandColor} 18%, transparent)`;
  return (
    <button
      onClick={onToggle}
      aria-label="Abrir centro de control"
      className="flex-1 flex flex-col items-center justify-center pt-1 pb-0.5 active:scale-95 transition-transform select-none"
    >
      <div className="relative flex items-center justify-center" style={{ height: 28, minWidth: 42 }}>
        <motion.div
          initial={false}
          animate={hi ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
          className="absolute inset-0 rounded-xl"
          style={{ background: hi ? pillColor : 'transparent' }}
        />
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 260 }}
          className="relative z-10"
        >
          {open
            ? <ChevronUp size={20} strokeWidth={2.5} style={{ color: brandColor }} />
            : <MoreHorizontal
              size={20}
              strokeWidth={anyActive ? 2.5 : 1.8}
              style={{ color: anyActive ? brandColor : undefined }}
              className={anyActive ? '' : 'text-gray-400 dark:text-gray-500'}
            />
          }
        </motion.div>
      </div>
      <span
        className={`text-[10px] tracking-wide transition-colors leading-tight mt-0.5 ${hi ? 'font-extrabold' : 'font-semibold text-gray-500 dark:text-gray-400'}`}
        style={{ color: hi ? brandColor : undefined }}
      >
        Más
      </span>
    </button>
  );
};

/** Drawer "Más" compartido — Estilo iOS Control Center Premium */
const MasDrawer: React.FC<{
  items: typeof MAS_ITEMS_COPILOT;
  currentPath: string;
  onNavigate: (path: string) => void;
  onClose: () => void;
}> = ({ items, currentPath, onNavigate, onClose }) => {
  const mainItems = items.filter(i => i.path !== '/nilah/app/settings');
  const settingsItem = items.find(i => i.path === '/nilah/app/settings');
  const isSettingsActive = settingsItem ? currentPath.startsWith(settingsItem.path) : false;

  return (
    <motion.div
      key="drawer"
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="fixed left-3.5 right-3.5 z-[65] sm:hidden"
      style={{ bottom: 'calc(62px + env(safe-area-inset-bottom, 0px))' }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.5 }}
      onDragEnd={(e, { offset, velocity }) => {
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
            <span className="text-[11px] font-black text-gray-400 dark:text-white/35 uppercase tracking-[0.18em]">Centro de Control</span>
            <button 
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
            return (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
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
                {/* Badge Activo elegante */}
                {active && (
                  <div 
                    className="absolute top-3 right-3 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-tight"
                    style={{ 
                      backgroundColor: `${item.color}18`,
                      color: item.color,
                      border: `1px solid ${item.color}35`
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>Activo</span>
                  </div>
                )}
                
                {/* Icon Container */}
                <div
                  className="w-10 h-10 rounded-[14px] flex items-center justify-center flex-shrink-0 transition-transform"
                  style={{ 
                    background: active ? item.color : `${item.color}14`,
                    boxShadow: active ? `0 4px 12px ${item.color}40` : 'none',
                    border: active ? 'none' : `1px solid ${item.color}25`
                  }}
                >
                  <Icon size={20} strokeWidth={2.2} style={{ color: active ? '#ffffff' : item.color }} />
                </div>
                
                {/* Text Content */}
                <div className="w-full pr-1">
                  <p className="text-[13.5px] font-bold text-gray-900 dark:text-white leading-tight">{item.label}</p>
                  <p className="text-[10px] text-gray-500 dark:text-white/45 mt-0.5 font-medium leading-tight line-clamp-1">{item.desc}</p>
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
              onClick={() => onNavigate(settingsItem.path)}
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
                  <p className="text-[13.5px] font-bold text-gray-900 dark:text-white leading-tight">{settingsItem.label}</p>
                  <p className="text-[10.5px] text-gray-500 dark:text-white/45 font-medium leading-tight mt-0.5">{settingsItem.desc}</p>
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

/**
 * useKeyboardVisible — detecta si el teclado virtual está abierto en iOS/Android.
 *
 * ESTRATEGIA:
 * - Usa window.visualViewport.height para detectar cuando el teclado encoge el viewport.
 * - Cuando el keyboard está visible, el nav se oculta con visibility:hidden
 *   (NO con display:none — así no hay reflow y no hay jump al reaparecer).
 * - Al cerrar el teclado, el nav reaparece instantáneamente.
 *
 * POR QUÉ ESTO RESUELVE EL PROBLEMA:
 * - `env(safe-area-inset-bottom)` fluctúa cuando el teclado aparece/desaparece.
 * - `position: fixed; bottom:0` en iOS se repositiona durante la animación del teclado.
 * - Al OCULTAR el nav mientras el teclado está activo, eliminamos el problema de raíz:
 *   no hay nav visible → no hay salto visual → usuario no lo nota.
 * - Cuando el teclado desaparece, el nav vuelve con el viewport ya estabilizado.
 */
function useKeyboardVisible(): boolean {
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const handleResize = () => {
      const windowH = window.innerHeight || document.documentElement.clientHeight;
      // Detección por ratio o por delta de píxeles (> 120px de reducción es un teclado virtual)
      const isKeyboardOpen = vv.height < windowH * 0.82 || (windowH - vv.height) > 120;
      
      setKeyboardVisible(isKeyboardOpen);

      // Si el teclado se acaba de cerrar, asegurar que no quedó ningún offset de scroll en el window
      if (!isKeyboardOpen) {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }
    };

    vv.addEventListener('resize', handleResize);
    return () => vv.removeEventListener('resize', handleResize);
  }, []);

  return keyboardVisible;
}

/**
 * NavBar — contenedor base del nav móvil (glass premium)
 *
 * El safe-area se maneja en CSS puro (clase .navbar-surface-bottom),
 * NO en inline style de React. Razón: CSS env() en hojas de estilo se
 * aplica en batch durante el layout pass, no en cada render de React.
 *
 * El teclado se maneja ocultando el nav (visibility:hidden) mientras
 * el keyboard está visible — sin reflow, sin saltos.
 */
const NavBar: React.FC<{ children: React.ReactNode; badge?: React.ReactNode; innerClassName?: string }> = ({
  children,
  badge,
  innerClassName = 'flex items-center justify-around h-[50px] px-1',
}) => {
  const keyboardVisible = useKeyboardVisible();

  return (
    <nav
      className="navbar-surface navbar-surface-bottom fixed bottom-0 left-0 right-0 z-50 sm:hidden"
      style={{
        // visibility:hidden oculta sin remover del DOM → sin reflow → sin salto
        // pointer-events:none evita interacciones accidentales cuando está oculto
        visibility: keyboardVisible ? 'hidden' : 'visible',
        pointerEvents: keyboardVisible ? 'none' : 'auto',
        backdropFilter: 'blur(28px) saturate(200%)',
        WebkitBackdropFilter: 'blur(28px) saturate(200%)',
        willChange: 'auto',
      }}
    >
      {badge}
      {/* Fila de iconos — altura siempre fija y compacta */}
      <div className={innerClassName}>
        {children}
      </div>
    </nav>
  );
};


// ────────────────────────────────────────────────────────────────────────────
// Layout A — COPILOT plan
// Inicio | Agenda | 🤖 (FAB) | Inbox | Más
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
            className="flex items-center justify-center rounded-2xl text-white gradient-brand shadow-lg"
            style={{
              width: 44,
              height: 44,
              marginBottom: 8,
              boxShadow: 'var(--shadow-brand)',
            }}
            title="Nilah Copilot"
          >
            <Bot size={22} strokeWidth={2} />
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
// Inicio | Agenda | Inbox | CRM | Más
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
          <div className="flex justify-center pt-0.5">
            <span
              className="px-2 py-0.2 rounded-full text-[8px] font-extrabold tracking-widest uppercase gradient-brand"
              style={{ color: '#fff', letterSpacing: '0.12em' }}
            >
              PRO
            </span>
          </div>
        }
        innerClassName="flex items-center justify-around h-[50px] px-1"
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
// Inicio | Agenda | Inbox | CRM | Más
// ────────────────────────────────────────────────────────────────────────────

const MAS_ITEMS_BASICO = [
  { path: '/nilah/app/store', label: '🛒 Tienda & Packs', icon: ShoppingBag, color: '#ec4899', bg: '#fdf2f8', desc: 'Módulos & Upgrades a la carta' },
  { path: '/nilah/app/settings', label: 'Ajustes', icon: Settings, color: '#6b7280', bg: '#f3f4f6', desc: 'Perfil del salón y config' },
];

const NavBasico: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);

  const isActive = (p: string, exact?: boolean) =>
    exact ? location.pathname === p : location.pathname.startsWith(p);

  const moreActive = MAS_ITEMS_BASICO.some((i) => isActive(i.path));
  const goTo = (p: string) => { setShowMore(false); navigate(p); };

  return (
    <>
      <AnimatePresence>
        {showMore && <Backdrop key="backdrop" onClick={() => setShowMore(false)} />}
        {showMore && <MasDrawer key="drawer" items={MAS_ITEMS_BASICO} currentPath={location.pathname} onNavigate={goTo} onClose={() => setShowMore(false)} />}
      </AnimatePresence>

      <NavBar innerClassName="flex items-center justify-around h-[50px] px-1">
        <PillNavItem path="/nilah/app" label="Inicio" icon={LayoutDashboard} active={isActive('/nilah/app', true)} />
        <PillNavItem path="/nilah/app/calendar" label="Agenda" icon={Calendar} active={isActive('/nilah/app/calendar')} />
        <PillNavItem path="/nilah/app/clients" label="CRM" icon={DatabaseZap} active={isActive('/nilah/app/clients')} />
        <PillNavItem path="/nilah/app/finances" label="Finanzas" icon={Wallet} active={isActive('/nilah/app/finances')} />
        <MasBtn open={showMore} anyActive={moreActive} onToggle={() => setShowMore((v) => !v)} />
      </NavBar>
    </>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// Main export — selecciona layout según plan y escucha eventos de Inbox chat
// ────────────────────────────────────────────────────────────────────────────

export const BottomNavBar: React.FC = () => {
  const { isCopilot, isPro } = useAuth();
  const location = useLocation();
  const [isInboxChatOpen, setIsInboxChatOpen] = useState(false);

  // Escuchar cuando el usuario entra/sale de un chat individual en Inbox (mobile)
  useEffect(() => {
    const handleInboxToggle = (e: any) => {
      setIsInboxChatOpen(!!e.detail);
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
  }, [location.pathname]);

  // Si estamos chateando en pantalla completa en Inbox móvil, ocultamos la barra inferior
  if (isInboxChatOpen) return null;

  if (isCopilot) return <NavCopilot />;
  if (isPro) return <NavPro />;
  return <NavBasico />;
};

export default BottomNavBar;
