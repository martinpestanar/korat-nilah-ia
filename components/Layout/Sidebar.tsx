
import React from 'react';
import { NavLink } from 'react-router-dom';
import { X, Leaf, Sparkles } from 'lucide-react';
import { APP_NAME, NAVIGATION_ITEMS } from '../../constants';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, isPro, isAdmin } = useAuth();
  const userRole = user?.role || 'Staff'; 
  const userPlan = user?.plan || 'Starter';

  // Filter items based on role AND plan
  const filteredNav = NAVIGATION_ITEMS.filter(item => {
    // 1. Check Role Access
    if (item.allowedRoles && !item.allowedRoles.includes(userRole)) {
        return false;
    }
    // 2. Check Plan Access (Marketing is for Pro only)
    if (item.path === '/app/marketing' && !isPro) {
        return false;
    }
    return true;
  });

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm sm:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Component */}
      <aside 
        className={`fixed left-0 top-0 z-50 h-screen w-64 border-r border-gray-200 bg-white transition-transform duration-300 dark:bg-dark-bg dark:border-dark-border ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } sm:translate-x-0`}
      >
        <div className="flex h-full flex-col overflow-y-auto px-3 py-4">
          <div className="mb-8 flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                 <Leaf size={24} />
              </div>
              <span className="self-center whitespace-nowrap text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                {APP_NAME}
              </span>
            </div>
            {/* Close button for mobile */}
            <button 
              onClick={onClose}
              className="block rounded-lg p-1 text-gray-500 hover:bg-gray-100 sm:hidden dark:text-gray-400 dark:hover:bg-dark-card"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-4 px-2 flex gap-2">
              <span className={`inline-block rounded px-2 py-1 text-xs font-bold uppercase tracking-wider ${
                  userRole === 'Admin' 
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' 
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
              }`}>
                  {userRole}
              </span>
              <span className={`inline-block rounded border px-2 py-1 text-xs font-bold uppercase tracking-wider ${
                  userPlan === 'Starter'
                  ? 'border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400'
                  : 'border-primary/30 text-primary bg-primary/5'
              }`}>
                  {userPlan}
              </span>
          </div>

          <ul className="space-y-2 font-medium">
            {filteredNav.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={onClose} 
                  className={({ isActive }) =>
                    `group flex items-center rounded-lg p-2 transition-colors ${
                      isActive
                        ? 'bg-primary text-black font-bold'
                        : 'text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-card dark:hover:text-white'
                    }`
                  }
                >
                  <item.icon className={`h-5 w-5 ${({ isActive }: any) => isActive ? 'text-black' : ''}`} />
                  <span className="ml-3">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
          
          {/* UPGRADE BANNER - ONLY FOR STARTER PLAN */}
          {userPlan === 'Starter' && isAdmin && (
            <div className="mt-auto rounded-xl bg-gradient-to-br from-gray-900 to-black p-4 text-white border border-gray-800 relative overflow-hidden group">
                <div className="absolute top-0 right-0 -mr-4 -mt-4 h-16 w-16 rounded-full bg-primary/20 blur-xl group-hover:bg-primary/30 transition-all"></div>
                
                <div className="relative z-10">
                    <div className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-200">
                        <Sparkles size={14} className="text-primary" /> Korat Pro
                    </div>
                    <p className="mb-3 text-xs text-gray-400 leading-relaxed">
                        Desbloquea la IA: Predicción de ingresos, marketing automático y rescate de clientes.
                    </p>
                    <button className="w-full rounded bg-primary py-2 text-xs font-bold text-black transition hover:opacity-90 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                        Actualizar Plan
                    </button>
                </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
