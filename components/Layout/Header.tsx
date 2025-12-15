
import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Bell, Menu, Check, Bot, AlertTriangle, Info } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { notifications, markNotificationAsRead } = useData();
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch(type) {
        case 'ai': return <Bot size={16} className="text-purple-500" />;
        case 'success': return <Check size={16} className="text-green-500" />;
        case 'warning': return <AlertTriangle size={16} className="text-yellow-500" />;
        default: return <Info size={16} className="text-blue-500" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 dark:bg-dark-bg dark:border-dark-border">
      {/* Mobile menu trigger */}
      <div className="block sm:hidden">
        <button 
          onClick={onMenuClick}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-card"
        >
          <span className="sr-only">Open sidebar</span>
          <Menu className="h-6 w-6" />
        </button>
      </div>

      <div className="ml-auto flex items-center gap-4">
        <button 
          onClick={toggleTheme}
          className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-card"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* NOTIFICATION BELL */}
        <div className="relative" ref={notifRef}>
            <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-card"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-dark-bg"></span>
                )}
            </button>

            {/* DROPDOWN */}
            {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-dark-border dark:bg-dark-card animate-in fade-in zoom-in-95 duration-200">
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
                                        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                            notif.type === 'ai' ? 'bg-purple-100 dark:bg-purple-900/30' : 
                                            notif.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30' : 
                                            'bg-green-100 dark:bg-green-900/30'
                                        }`}>
                                            {getIcon(notif.type)}
                                        </div>
                                        <div>
                                            <p className={`text-sm ${!notif.read ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                                                {notif.title}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                                                {notif.message}
                                            </p>
                                            <p className="mt-1 text-[10px] text-gray-400">{notif.time}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center text-sm text-gray-500">
                                No hay notificaciones.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>

        <div className="flex items-center gap-3 border-l border-gray-200 pl-4 dark:border-dark-border">
          <img 
            src={user?.avatar || "https://picsum.photos/200"} 
            alt="User" 
            className="h-8 w-8 rounded-full object-cover"
          />
          <div className="hidden text-sm sm:block">
            <div className="font-medium dark:text-white">{user?.name || 'Guest'}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:text-red-400" onClick={logout}>Sign out</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
