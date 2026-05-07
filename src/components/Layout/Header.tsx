import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Bell, Check, Bot, AlertTriangle, Info, Sparkles, CheckCheck, RefreshCw } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { AvatarDisplay } from '../UI/AvatarDisplay';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { theme, mode, toggleTheme } = useTheme();
  const { user, logout, avatarId } = useAuth();
  const { notifications, markNotificationAsRead } = useData();
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;
  const userName    = user?.name || 'Usuario';
  const nombreSalon = user?.nombreNegocio || 'Nilah IA';

  const getInitials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'ai':      return <Bot size={15} className="text-purple-500" />;
      case 'success': return <Check size={15} className="text-emerald-500" />;
      case 'warning': return <AlertTriangle size={15} className="text-amber-500" />;
      default:        return <Info size={15} className="text-blue-500" />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'ai':      return 'bg-purple-100 dark:bg-purple-900/30';
      case 'success': return 'bg-emerald-100 dark:bg-emerald-900/30';
      case 'warning': return 'bg-amber-100 dark:bg-amber-900/30';
      default:        return 'bg-blue-100 dark:bg-blue-900/30';
    }
  };

  const getThemeIcon = () => {
    if (mode === 'auto') return <Sparkles size={18} className="text-primary" />;
    return theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />;
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    await Promise.all(unread.map(n => markNotificationAsRead(n.id)));
  };

  // ── Panel de notificaciones (compartido móvil/desktop) ──────────────────
  const NotifPanel = ({ maxH = 'max-h-80' }: { maxH?: string }) => (
    <div className="overflow-hidden rounded-2xl card shadow-2xl dark:shadow-black/50 animate-slide-up">
      {/* Header del panel */}
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
            onClick={markAllRead}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            <CheckCheck size={12} />
            Marcar todas
          </button>
        )}
      </div>

      {/* Lista */}
      <div className={`${maxH} overflow-y-auto divide-y divide-gray-100 dark:divide-white/5`}>
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => markNotificationAsRead(notif.id)}
              className={`group cursor-pointer px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors relative ${
                !notif.read ? 'bg-violet-50/40 dark:bg-violet-900/10' : ''
              }`}
            >
              {/* Indicador de no leído */}
              {!notif.read && (
                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-primary" />
              )}
              <div className="flex gap-3">
                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${getIconBg(notif.type)}`}>
                  {getIcon(notif.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm leading-snug ${
                    !notif.read
                      ? 'font-semibold text-gray-900 dark:text-white'
                      : 'font-medium text-gray-600 dark:text-gray-300'
                  }`}>
                    {notif.title}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                    {notif.message}
                  </p>
                  <p className="mt-1 text-[10px] font-medium text-gray-400 dark:text-gray-500">
                    {notif.time}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <span className="text-3xl">🔔</span>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Sin notificaciones aún</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Tus alertas inteligentes aparecerán aquí
            </p>
          </div>
        )}
      </div>

      {/* Footer con indicador de tiempo real */}
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

  return (
    <header
      className="relative z-30 flex shrink-0 items-end header-surface transition-colors duration-300"
      style={{
        backdropFilter: 'blur(16px) saturate(160%)',
        WebkitBackdropFilter: 'blur(16px) saturate(160%)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        minHeight: 'calc(3.5rem + env(safe-area-inset-top, 0px))',
      }}
    >
      {/* ══════════════════════════════════════════
          MÓVIL
          ══════════════════════════════════════════ */}
      <div className="flex w-full items-center justify-between px-4 sm:hidden">

        {/* Botón de menú izquierda */}
        <button
          onClick={onMenuClick}
          className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-card active:scale-90 transition-all"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Nombre del salón */}
        <span className="text-base font-black tracking-tight text-gray-900 dark:text-white truncate max-w-[180px]">
          {nombreSalon}
        </span>

        {/* Controles derecha */}
        <div className="flex items-center gap-2" ref={notifRef}>
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="group relative flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-card active:scale-90 transition-all"
            title={mode === 'auto' ? 'Auto (según hora)' : mode === 'dark' ? 'Modo oscuro' : 'Modo claro'}
          >
            {getThemeIcon()}
            {mode === 'auto' && (
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-white dark:ring-dark-bg" />
            )}
          </button>

          {/* Campana móvil */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-card active:scale-90 transition-all"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-dark-bg">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              </span>
            )}
          </button>

          {/* Avatar */}
          {avatarId ? (
            <div className="cursor-pointer" onClick={logout}>
              <AvatarDisplay avatarId={avatarId} size="sm" showHalo={true} />
            </div>
          ) : user?.avatar ? (
            <img
              src={user.avatar}
              alt={userName}
              className="h-8 w-8 rounded-full object-cover border-2 border-primary/20"
              onClick={logout}
            />
          ) : (
            <button
              onClick={logout}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-pink-500/10 text-primary text-xs font-black border-2 border-primary/20 active:scale-90 transition-all"
            >
              {getInitials(userName)}
            </button>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          DESKTOP
          ══════════════════════════════════════════ */}
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
              onClick={() => setShowNotifications(!showNotifications)}
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
                <NotifPanel maxH="max-h-96" />
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

      {/* Panel de notificaciones MÓVIL (fuera del flujo desktop) */}
      {showNotifications && (
        <div className="absolute right-2 top-14 z-50 w-[calc(100vw-1rem)] max-w-sm sm:hidden">
          <NotifPanel maxH="max-h-72" />
        </div>
      )}
    </header>
  );
};

export default Header;
