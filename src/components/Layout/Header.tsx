/**
 * Header v3 — Mobile-First App Shell
 *
 * Mobile (< sm):
 *   [Avatar/Salón]   [Módulo actual — centrado]   [🔔]
 *   Avatar → abre ProfileSheet (bottom drawer premium)
 *   NO hamburguesa: la navegación vive en el BottomNavBar
 *
 * Desktop (≥ sm):
 *   Sin cambios — sidebar siempre visible (sm:translate-x-0)
 */

import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bell, Check, Bot, AlertTriangle, Info, Sparkles,
  CheckCheck, Sun, Moon, Settings, LogOut, ChevronRight,
  X, Shield,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { AvatarDisplay } from '../UI/AvatarDisplay';
import { AvatarSelector } from '../UI/AvatarSelector';
import { getAvatarById } from '../../constants/avatars';
import { NAVIGATION_ITEMS } from '../../constants';

interface HeaderProps {
  /** Solo usado en desktop para abrir el Sidebar — en mobile ya no hay hamburguesa */
  onMenuClick: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Notif helpers
// ─────────────────────────────────────────────────────────────────────────────

const getNotifIcon = (type: string) => {
  switch (type) {
    case 'ai':      return <Bot size={15} className="text-purple-500" />;
    case 'success': return <Check size={15} className="text-emerald-500" />;
    case 'warning': return <AlertTriangle size={15} className="text-amber-500" />;
    default:        return <Info size={15} className="text-blue-500" />;
  }
};

const getNotifIconBg = (type: string) => {
  switch (type) {
    case 'ai':      return 'bg-purple-100 dark:bg-purple-900/30';
    case 'success': return 'bg-emerald-100 dark:bg-emerald-900/30';
    case 'warning': return 'bg-amber-100 dark:bg-amber-900/30';
    default:        return 'bg-blue-100 dark:bg-blue-900/30';
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ProfileSheet — bottom drawer mobile (perfil + ajustes + logout)
// ─────────────────────────────────────────────────────────────────────────────

interface ProfileSheetProps {
  onClose: () => void;
}

const ProfileSheet: React.FC<ProfileSheetProps> = ({ onClose }) => {
  const { user, logout, isPro, isCopilot, isAdmin, avatarId, updateAvatarId } = useAuth();
  const { theme, mode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);

  const userName    = user?.name || 'Usuario';
  const nombreSalon = (user?.nombreNegocio && user.nombreNegocio !== 'Nilah IA' && user.nombreNegocio !== userName)
    ? user.nombreNegocio
    : `${userName} Studio`;
  const userPlan    = isCopilot ? 'Elite' : isPro ? 'Pro' : 'Glow';
  const currentAvatar = avatarId ? getAvatarById(avatarId) : null;

  const getInitials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const getThemeLabel = () => {
    if (mode === 'auto') return 'Automático';
    return theme === 'dark' ? 'Oscuro' : 'Claro';
  };

  const getThemeIcon = () => {
    if (mode === 'auto') return <Sparkles size={18} className="text-primary" />;
    return theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />;
  };

  const planColors: Record<string, { bg: string; text: string; border: string }> = {
    Elite: { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-300 dark:border-violet-700' },
    Pro:   { bg: 'bg-blue-100 dark:bg-blue-900/30',     text: 'text-blue-700 dark:text-blue-300',     border: 'border-blue-300 dark:border-blue-700'   },
    Glow:  { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-700' },
  };
  const planStyle = planColors[userPlan];

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  const handleNavigateSettings = () => {
    onClose();
    navigate('/nilah/app/settings');
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        key="profile-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[70] sm:hidden"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        key="profile-sheet"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 340 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.5 }}
        onDragEnd={(_, { offset, velocity }) => {
          if (offset.y > 80 || velocity.y > 600) onClose();
        }}
        className="fixed left-0 right-0 bottom-0 z-[75] sm:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="relative bg-white dark:bg-[#111114] rounded-t-[32px] shadow-[0_-20px_60px_rgba(0,0,0,0.35)] overflow-hidden">

          {/* Grab handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1.5 rounded-full bg-gray-300 dark:bg-white/20" />
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-white/50 active:scale-90 transition-transform"
            aria-label="Cerrar"
          >
            <X size={16} strokeWidth={2.5} />
          </button>

          {/* ── Perfil ── */}
          <div className="px-5 pt-2 pb-5">
            <div className="flex items-center gap-4">
              {/* Avatar clickable */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowAvatarSelector(true)}
                className="relative shrink-0 group outline-none"
                title="Cambiar avatar"
              >
                <AvatarDisplay
                  avatarId={avatarId}
                  size="md"
                  userName={userName}
                  animated={false}
                  showHalo
                />
                {/* Edit badge */}
                <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-white dark:bg-[#1C1C1E] border-2 border-gray-200 dark:border-white/10 flex items-center justify-center text-[9px]">
                  ✏️
                </span>
              </motion.button>

              <div className="flex-1 min-w-0">
                <p className="text-[17px] font-black text-gray-900 dark:text-white truncate leading-tight">
                  {userName}
                </p>
                <p className="text-[13px] text-gray-500 dark:text-white/50 truncate mt-0.5">
                  {nombreSalon}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${planStyle.bg} ${planStyle.text} ${planStyle.border}`}>
                    {userPlan === 'Elite' && '✦ '}
                    Plan {userPlan}
                  </span>
                  {currentAvatar && (
                    <span className="text-[11px] font-semibold" style={{ color: currentAvatar.accent }}>
                      {currentAvatar.emoji} {currentAvatar.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Divider ── */}
          <div className="h-px mx-5 bg-gray-100 dark:bg-white/[0.06]" />

          {/* ── Opciones ── */}
          <div className="px-4 py-3 space-y-1">

            {/* Tema */}
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/[0.04] active:bg-gray-100 dark:active:bg-white/[0.07] transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/8 flex items-center justify-center text-gray-600 dark:text-gray-300 shrink-0">
                {getThemeIcon()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-gray-900 dark:text-white">Tema</p>
                <p className="text-[12px] text-gray-500 dark:text-white/40">{getThemeLabel()}</p>
              </div>
              <ChevronRight size={16} className="text-gray-400 dark:text-white/30 shrink-0" />
            </button>

            {/* Ajustes del salón */}
            <button
              onClick={handleNavigateSettings}
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/[0.04] active:bg-gray-100 dark:active:bg-white/[0.07] transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/8 flex items-center justify-center text-gray-600 dark:text-gray-300 shrink-0">
                <Settings size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-gray-900 dark:text-white">Mi Salón</p>
                <p className="text-[12px] text-gray-500 dark:text-white/40">Perfil y configuración</p>
              </div>
              <ChevronRight size={16} className="text-gray-400 dark:text-white/30 shrink-0" />
            </button>

            {/* Admin badge si aplica */}
            {isAdmin && (
              <div className="flex items-center gap-4 px-4 py-2">
                <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center shrink-0">
                  <Shield size={16} className="text-violet-600 dark:text-violet-400" />
                </div>
                <p className="text-[13px] font-medium text-violet-600 dark:text-violet-400">Cuenta Administradora</p>
              </div>
            )}
          </div>

          {/* ── Cerrar sesión ── */}
          <div className="px-4 pb-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10 text-red-500 dark:text-red-400 text-[14px] font-semibold active:opacity-80 transition-opacity"
            >
              <LogOut size={16} />
              Cerrar Sesión
            </button>
          </div>

        </div>
      </motion.div>

      {/* Avatar selector modal */}
      <AnimatePresence>
        {showAvatarSelector && (
          <AvatarSelector
            currentAvatarId={avatarId}
            onSelect={async (id) => { await updateAvatarId(id); setShowAvatarSelector(false); }}
            onClose={() => setShowAvatarSelector(false)}
            isModal
          />
        )}
      </AnimatePresence>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// NotifPanel — compartido móvil/desktop
// ─────────────────────────────────────────────────────────────────────────────

const NotifPanel: React.FC<{ maxH?: string; onMarkAll: () => void; notifications: any[]; onMarkRead: (id: string) => void; unreadCount: number }> = ({
  maxH = 'max-h-80', onMarkAll, notifications, onMarkRead, unreadCount,
}) => (
  <div className="overflow-hidden rounded-2xl card shadow-2xl dark:shadow-black/50 animate-slide-up">
    <div
      className="flex items-center justify-between px-4 py-3"
      style={{ background: 'var(--color-bg-surface)', borderBottom: '1px solid var(--color-border-subtle)' }}
    >
      <div className="flex items-center gap-2">
        <Bell size={15} className="text-primary" />
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Notificaciones</h3>
        {unreadCount > 0 && (
          <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </div>
      {unreadCount > 0 && (
        <button
          onClick={onMarkAll}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-primary hover:bg-primary/10 transition-colors"
        >
          <CheckCheck size={12} />
          Marcar todas
        </button>
      )}
    </div>

    <div className={`${maxH} overflow-y-auto divide-y divide-gray-100 dark:divide-white/5`}>
      {notifications.length > 0 ? (
        notifications.map((notif) => (
          <div
            key={notif.id}
            onClick={() => onMarkRead(notif.id)}
            className={`group cursor-pointer px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors relative ${
              !notif.read ? 'bg-violet-50/40 dark:bg-violet-900/10' : ''
            }`}
          >
            {!notif.read && (
              <span className="absolute left-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-primary" />
            )}
            <div className="flex gap-3">
              <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${getNotifIconBg(notif.type)}`}>
                {getNotifIcon(notif.type)}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm leading-snug ${!notif.read ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-600 dark:text-gray-300'}`}>
                  {notif.title}
                </p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                  {notif.message}
                </p>
                <p className="mt-1 text-[10px] font-medium text-gray-400 dark:text-gray-500">{notif.time}</p>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <span className="text-3xl">🔔</span>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Sin notificaciones aún</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Tus alertas inteligentes aparecerán aquí</p>
        </div>
      )}
    </div>

    <div
      className="flex items-center gap-1.5 px-4 py-2"
      style={{ background: 'var(--color-bg-surface)', borderTop: '1px solid var(--color-border-subtle)' }}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <span className="text-[10px] text-gray-400 dark:text-gray-500">Actualización en tiempo real</span>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Header principal
// ─────────────────────────────────────────────────────────────────────────────

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { theme, mode, toggleTheme } = useTheme();
  const { user, logout, avatarId, isPro, isCopilot, isAdmin } = useAuth();
  const { notifications, markNotificationAsRead } = useData();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isInboxChatOpen, setIsInboxChatOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Escuchar cuando un chat en mobile está abierto para ocultar el header global
  useEffect(() => {
    const handleInboxToggle = (e: any) => {
      setIsInboxChatOpen(!!e.detail);
    };
    window.addEventListener('inbox-nav-toggle', handleInboxToggle);
    return () => {
      window.removeEventListener('inbox-nav-toggle', handleInboxToggle);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  const userName    = user?.name || 'Usuario';
  const nombreSalon = (user?.nombreNegocio && user.nombreNegocio !== 'Nilah IA' && user.nombreNegocio !== userName)
    ? user.nombreNegocio
    : `${userName} Studio`;

  // Título contextual dinámico según ruta
  const currentNav = NAVIGATION_ITEMS.find(item =>
    item.path === '/nilah/app'
      ? location.pathname === '/nilah/app'
      : location.pathname.startsWith(item.path)
  );
  const sectionTitle = currentNav?.label || 'Nilah IA';

  const getInitials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const getThemeIcon = () => {
    if (mode === 'auto') return <Sparkles size={18} className="text-primary" />;
    return theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />;
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    await Promise.all(unread.map(n => markNotificationAsRead(n.id)));
  };

  // Cerrar panel de notificaciones al clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Bloquear scroll del body cuando ProfileSheet está abierto
  useEffect(() => {
    if (showProfile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showProfile]);

  return (
    <>
      <header
        className={`relative z-30 shrink-0 items-end header-surface transition-colors duration-300 pt-safe ${
          isInboxChatOpen ? 'hidden sm:flex' : 'flex'
        }`}
        style={{
          backdropFilter: 'blur(16px) saturate(160%)',
          WebkitBackdropFilter: 'blur(16px) saturate(160%)',
          minHeight: 'calc(3.5rem + var(--safe-top))',
        }}
      >
        {/* ══════════════════════════════════════════════════════════
            MOBILE — "App Shell Nativa"
            Layout: [Avatar salón]  [Título centrado]  [🔔]
            ══════════════════════════════════════════════════════════ */}
        <div className="flex w-full items-center px-3 py-1.5 sm:hidden">

          {/* ── Izquierda: Avatar del salón → abre ProfileSheet ── */}
          <button
            onClick={() => setShowProfile(true)}
            aria-label="Ver perfil"
            className="flex items-center gap-2.5 min-w-0 flex-shrink-0 active:scale-95 transition-transform"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {/* Avatar pequeño */}
            <div className="relative shrink-0">
              <AvatarDisplay
                avatarId={avatarId}
                size="sm"
                userName={userName}
                animated={false}
                showHalo
              />
              {/* Indicador de plan */}
              {(isPro || isCopilot) && (
                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full gradient-brand flex items-center justify-center">
                  <Sparkles size={8} className="text-white" />
                </span>
              )}
            </div>
            {/* Nombre del salón */}
            <div className="flex flex-col items-start text-left min-w-0">
              <span className="text-[13px] font-black text-gray-900 dark:text-white truncate leading-tight max-w-[90px] text-left">
                {nombreSalon}
              </span>
              <span className="text-[10px] font-medium text-gray-400 dark:text-white/40 leading-tight text-left">
                Ver perfil
              </span>
            </div>
          </button>

          {/* ── Centro: Título del módulo actual ── */}
          <div className="flex-1 flex justify-center px-2">
            <h1 className="text-[15px] font-black tracking-tight text-gray-900 dark:text-white truncate text-center leading-tight">
              {sectionTitle}
            </h1>
          </div>

          {/* ── Derecha: Campana ── */}
          <div className="flex items-center gap-1 shrink-0" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(v => !v)}
              aria-label="Notificaciones"
              className="relative flex h-11 w-11 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10 active:scale-95 transition-transform"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute right-2.5 top-2.5 flex h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#111114]">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            DESKTOP — sin cambios
            ══════════════════════════════════════════════════════════ */}
        <div className="hidden w-full items-center justify-between px-6 sm:flex">
          <div />

          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="group relative rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-card transition-colors"
              title={mode === 'auto' ? 'Auto (según hora)' : mode === 'dark' ? 'Modo oscuro' : 'Modo claro'}
            >
              {getThemeIcon()}
              {mode === 'auto' && (
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-white dark:ring-dark-bg" />
              )}
            </button>

            {/* Notificaciones Desktop */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(v => !v)}
                className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-card transition-colors"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-dark-bg">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80">
                  <NotifPanel
                    maxH="max-h-96"
                    onMarkAll={markAllRead}
                    notifications={notifications}
                    onMarkRead={markNotificationAsRead}
                    unreadCount={unreadCount}
                  />
                </div>
              )}
            </div>

            {/* Avatar + nombre Desktop */}
            <div className="flex items-center gap-3 border-l border-gray-200 pl-4 dark:border-dark-border">
              {avatarId ? (
                <div className="scale-90 origin-right">
                  <AvatarDisplay avatarId={avatarId} size="sm" showHalo={true} />
                </div>
              ) : user?.avatar ? (
                <img src={user.avatar} alt={userName} className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-pink-500/10 text-primary text-xs font-black">
                  {getInitials(userName)}
                </div>
              )}
              <div className="hidden text-sm sm:block">
                <div className="font-medium dark:text-white">{userName}</div>
                <div
                  className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:text-red-400 transition-colors"
                  onClick={logout}
                >
                  Cerrar sesión
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel notificaciones MÓVIL */}
        {showNotifications && (
          <div className="absolute right-2 top-14 z-50 w-[calc(100vw-1rem)] max-w-sm sm:hidden">
            <NotifPanel
              maxH="max-h-72"
              onMarkAll={markAllRead}
              notifications={notifications}
              onMarkRead={markNotificationAsRead}
              unreadCount={unreadCount}
            />
          </div>
        )}
      </header>

      {/* ── ProfileSheet (mobile only) ── */}
      <AnimatePresence>
        {showProfile && (
          <ProfileSheet onClose={() => setShowProfile(false)} />
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
