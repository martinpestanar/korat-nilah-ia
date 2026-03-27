import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Bell, Check, Bot, AlertTriangle, Info, Sparkles, Menu } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { theme, mode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { notifications, markNotificationAsRead } = useData();
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;
  const userName = user?.name || 'Usuario';
  const nombreSalon = user?.nombreNegocio || 'Nilah IA';

  const getInitials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

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
      case 'ai': return <Bot size={16} className="text-purple-500" />;
      case 'success': return <Check size={16} className="text-green-500" />;
      case 'warning': return <AlertTriangle size={16} className="text-yellow-500" />;
      default: return <Info size={16} className="text-blue-500" />;
    }
  };

  const getThemeIcon = () => {
    if (mode === 'auto') return <Sparkles size={18} className="text-primary" />;
    return theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />;
  };

  return (
    <header
      className="relative z-30 flex shrink-0 items-end border-b border-light-border bg-white/90 dark:bg-dark-bg/90 dark:border-dark-border transition-colors duration-300"
      style={{
        backdropFilter: 'blur(16px) saturate(160%)',
        WebkitBackdropFilter: 'blur(16px) saturate(160%)',
        // El header crece dinámicamente para acomodar el notch / Dynamic Island
        // paddingTop empuja el contenido abajo del notch; minHeight asegura al menos h-14
        paddingTop: 'env(safe-area-inset-top, 0px)',
        minHeight: 'calc(3.5rem + env(safe-area-inset-top, 0px))',
      }}
    >
      {/* ══════════════════════════════════════════
          MÓVIL  — Logo salón centrado + avatar derecha
          ══════════════════════════════════════════ */}
      <div className="flex w-full items-center justify-between px-4 sm:hidden">

        {/* Placeholder izquierda (para centrar el título) */}
        <div className="w-10" />

        {/* Nombre del salón centrado */}
        <span className="text-base font-black tracking-tight text-gray-900 dark:text-white truncate max-w-[180px]">
          {nombreSalon}
        </span>

        {/* Right side: Notificaciones + Avatar */}
        <div className="flex items-center gap-2" ref={notifRef}>
          {/* Theme toggle mobile */}
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

          {/* Campana */}
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
          {user?.avatar ? (
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
          DESKTOP  — Diseño original (hamburguesa + controles a la derecha)
          ══════════════════════════════════════════ */}
      <div className="hidden w-full items-center justify-between px-6 sm:flex">
        {/* Sin menú hamburguesa en desktop (el sidebar siempre visible) */}
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
              className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-card"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-dark-bg" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-dark-border dark:bg-dark-card animate-slide-up">
                <div className="flex items-center justify-between bg-gray-50 px-4 py-3 dark:bg-[#252525]">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Notificaciones</h3>
                  {unreadCount > 0 && <span className="text-xs font-medium text-primary">{unreadCount} nuevas</span>}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => markNotificationAsRead(notif.id)}
                        className={`cursor-pointer border-b border-gray-100 px-4 py-3 last:border-0 hover:bg-gray-50 dark:border-dark-border dark:hover:bg-[#252525] ${!notif.read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                      >
                        <div className="flex gap-3">
                          <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${notif.type === 'ai' ? 'bg-purple-100 dark:bg-purple-900/30' :
                              notif.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                                'bg-green-100 dark:bg-green-900/30'
                            }`}>
                            {getIcon(notif.type)}
                          </div>
                          <div>
                            <p className={`text-sm ${!notif.read ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                              {notif.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{notif.message}</p>
                            <p className="mt-1 text-[10px] text-gray-400">{notif.time}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-sm text-gray-500">No hay notificaciones.</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Avatar Desktop */}
          <div className="flex items-center gap-3 border-l border-gray-200 pl-4 dark:border-dark-border">
            {user?.avatar ? (
              <img src={user.avatar} alt={userName} className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-pink-500/10 text-primary text-xs font-black">
                {getInitials(userName)}
              </div>
            )}
            <div className="hidden text-sm sm:block">
              <div className="font-medium dark:text-white">{userName}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:text-red-400" onClick={logout}>Sign out</div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel de notificaciones MÓVIL (fuera del div desktop) */}
      {showNotifications && (
        <div className="absolute right-2 top-14 z-50 w-[calc(100vw-1rem)] max-w-sm overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-dark-border dark:bg-dark-card animate-slide-up sm:hidden">
          <div className="flex items-center justify-between bg-gray-50 px-4 py-3 dark:bg-[#252525]">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Notificaciones</h3>
            {unreadCount > 0 && <span className="text-xs font-medium text-primary">{unreadCount} nuevas</span>}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => { markNotificationAsRead(notif.id); setShowNotifications(false); }}
                  className={`cursor-pointer border-b border-gray-100 px-4 py-3 last:border-0 hover:bg-gray-50 dark:border-dark-border dark:hover:bg-[#252525] ${!notif.read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                >
                  <div className="flex gap-3">
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${notif.type === 'ai' ? 'bg-purple-100 dark:bg-purple-900/30' :
                        notif.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                          'bg-green-100 dark:bg-green-900/30'
                      }`}>
                      {getIcon(notif.type)}
                    </div>
                    <div>
                      <p className={`text-sm ${!notif.read ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-gray-500 line-clamp-2">{notif.message}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-gray-500">No hay notificaciones.</div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
