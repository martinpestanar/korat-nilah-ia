
import React from 'react';
import { NavLink } from 'react-router-dom';
import { X, Bot, Sparkles, LogOut } from 'lucide-react';
import { NAVIGATION_ITEMS } from '../../constants';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, isPro, isCopilot, isAdmin, isStaff, logout, hasSaaSModule } = useAuth();

  // Sidebar uses the normalized roles from context
  const userRoleDisplay = isAdmin ? 'Admin' : isStaff ? 'Staff' : (user?.role || 'User');

  const userPlan = isCopilot ? 'Copilot' : isPro ? 'Pro' : 'Starter';
  const userName = user?.name || 'Usuario';

  // Nombre del salón - viene de la tabla usuarios via login
  const nombreSalon = user?.nombreNegocio || 'Nilah IA';

  // Filter items based on role AND SaaS modules
  const filteredNav = NAVIGATION_ITEMS.filter(item => {
    // Role matching: case-insensitive check
    if (item.allowedRoles && item.allowedRoles.length > 0) {
      const canSee = item.allowedRoles.some(role => {
        if (role === 'Admin') return isAdmin;
        if (role === 'Staff') return isStaff;
        return user?.role === role;
      });
      if (!canSee) return false;
    }
    
    // If item has a saasModule requirement, check the Feature Flag
    if (item.saasModule && !hasSaaSModule(item.saasModule)) {
      return false;
    }
    return true;
  });

  // Obtener iniciales del nombre para el avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm sm:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar — Deep Violet-Black */}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-64 border-r transition-all duration-300
          bg-[#13111C] border-[#2A2640] dark:bg-[#0D0B14] dark:border-[#1E1C2D]
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} sm:translate-x-0`}
      >
        <div className="flex h-full flex-col overflow-y-auto px-3 py-4">
          <div className="mb-6 px-2">
            {/* Logo y Nombre del Salón */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-pink-500/10 text-violet-400">
                  <Bot size={24} />
                </div>
                <div className="min-w-0">
                  <span className="block text-lg font-bold tracking-tight text-white truncate" title={nombreSalon}>
                    {nombreSalon}
                  </span>
                  <span className="block text-[10px] text-gray-500">
                    Powered by <span className="text-violet-400/70">Korat Flow</span>
                  </span>
                </div>
              </div>
              {/* Close button for mobile */}
              <button
                onClick={onClose}
                className="block shrink-0 rounded-lg p-1 text-gray-400 hover:bg-[#2A2640] dark:hover:bg-[#1E1C2D] sm:hidden"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* PERFIL DE USUARIO */}
          <div className="mb-6 mx-2 rounded-xl bg-[#1E1C2D]/60 dark:bg-[#17152A] p-3">
            <div className="flex items-center gap-3">
              {/* Avatar con iniciales */}
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={userName}
                  className="h-10 w-10 rounded-full object-cover border-2 border-violet-500/30"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-pink-500/10 text-violet-400 font-bold text-sm border-2 border-violet-500/30">
                  {getInitials(userName)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate" title={userName}>
                  {userName}
                </p>
                <div className="flex gap-1.5 mt-1">
                  <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${userRoleDisplay === 'Admin'
                    ? 'bg-violet-900/40 text-violet-300'
                    : 'bg-gray-800 text-gray-300'
                    }`}>
                    {user?.role || 'User'}
                  </span>
                  <span className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${userPlan === 'Starter'
                    ? 'border-gray-700 text-gray-400'
                    : 'border-violet-500/30 text-violet-400 bg-violet-500/5'
                    }`}>
                    {userPlan}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <ul className="space-y-1.5 font-medium">
            {filteredNav.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/nilah/app'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `group flex items-center rounded-xl px-3 py-2.5 transition-all duration-200 ${isActive
                      ? 'bg-gradient-to-r from-violet-500 to-violet-600 text-white font-bold shadow-lg shadow-violet-500/20'
                      : 'text-[#A8A1B5] hover:bg-[#1E1C2D] hover:text-white'
                    }`
                  }
                >
                  <item.icon className="h-5 w-5" />
                  <span className="ml-3">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>

          {/* UPGRADE BANNER - ONLY FOR STARTER PLAN */}
          {userPlan === 'Starter' && isAdmin && (
            <div className="mt-auto rounded-xl bg-gradient-to-br from-violet-950 to-[#13111C] p-4 text-white border border-violet-500/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 -mr-4 -mt-4 h-16 w-16 rounded-full bg-violet-500/15 blur-xl group-hover:bg-violet-500/25 transition-all"></div>

              <div className="relative z-10">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-200">
                  <Sparkles size={14} className="text-violet-400" /> Nilah Pro
                </div>
                <p className="mb-3 text-xs text-gray-400 leading-relaxed">
                  Desbloquea la IA: Predicción de ingresos, marketing automático y rescate de clientes.
                </p>
                <button className="w-full rounded-lg bg-gradient-to-r from-violet-500 to-violet-600 py-2 text-xs font-bold text-white transition hover:opacity-90 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                  Actualizar Plan
                </button>
              </div>
            </div>
          )}

          {/* BOTÓN DE CERRAR SESIÓN */}
          <div className={`${userPlan !== 'Starter' || !isAdmin ? 'mt-auto' : 'mt-4'} mx-2`}>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-red-900/30 bg-red-900/10 px-3 py-2.5 text-sm font-medium text-red-400 transition-all hover:bg-red-900/20 hover:border-red-800/50"
            >
              <LogOut size={16} />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
