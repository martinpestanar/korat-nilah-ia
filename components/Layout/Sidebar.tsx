
import React from 'react';
import { NavLink } from 'react-router-dom';
import { X, Leaf, Sparkles, LogOut, User } from 'lucide-react';
import { APP_NAME, NAVIGATION_ITEMS } from '../../constants';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, isPro, isAdmin, logout } = useAuth();
  const userRole = user?.role || 'Staff';
  const userPlan = user?.plan || 'Starter';
  const userName = user?.name || 'Usuario';

  // Nombre del salón - viene de la tabla usuarios via login
  const nombreSalon = user?.nombreNegocio || APP_NAME;

  // Plan hierarchy for comparison
  const planHierarchy: Record<string, number> = { 'Starter': 1, 'Pro': 2 };
  const userPlanLevel = planHierarchy[userPlan] || 1;

  // Filter items based on role AND plan
  const filteredNav = NAVIGATION_ITEMS.filter(item => {
    // 1. Check Role Access
    if (item.allowedRoles && !item.allowedRoles.includes(userRole)) {
      return false;
    }
    // 2. Check Plan Access (using requiredPlan from constants)
    if (item.requiredPlan) {
      const requiredPlanLevel = planHierarchy[item.requiredPlan] || 2;
      if (userPlanLevel < requiredPlanLevel) {
        return false;
      }
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

      {/* Sidebar Component - Color dinámico según tema */}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-64 border-r transition-all duration-300
          bg-[#2D2520] border-[#3D352E] dark:bg-[#0F0F0F] dark:border-[#1F1F1F]
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} sm:translate-x-0`}
      >
        <div className="flex h-full flex-col overflow-y-auto px-3 py-4">
          <div className="mb-6 px-2">
            {/* Logo y Nombre del Salón */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Leaf size={24} />
                </div>
                <div className="min-w-0">
                  <span className="block text-lg font-bold tracking-tight text-white truncate" title={nombreSalon}>
                    {nombreSalon}
                  </span>
                  <span className="block text-[10px] text-gray-500 dark:text-gray-600">
                    Powered by <span className="text-primary/70">Korat Flow</span>
                  </span>
                </div>
              </div>
              {/* Close button for mobile */}
              <button
                onClick={onClose}
                className="block shrink-0 rounded-lg p-1 text-gray-400 hover:bg-[#3D352E] dark:hover:bg-[#1A1A1A] sm:hidden"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* PERFIL DE USUARIO */}
          <div className="mb-6 mx-2 rounded-xl bg-[#3D352E]/50 dark:bg-[#1A1A1A] p-3">
            <div className="flex items-center gap-3">
              {/* Avatar con iniciales */}
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={userName}
                  className="h-10 w-10 rounded-full object-cover border-2 border-primary/30"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold text-sm border-2 border-primary/30">
                  {getInitials(userName)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate" title={userName}>
                  {userName}
                </p>
                <div className="flex gap-1.5 mt-1">
                  <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${userRole === 'Admin'
                    ? 'bg-purple-900/40 text-purple-300'
                    : 'bg-gray-800 text-gray-300'
                    }`}>
                    {userRole}
                  </span>
                  <span className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${userPlan === 'Starter'
                    ? 'border-gray-700 text-gray-400'
                    : 'border-primary/30 text-primary bg-primary/5'
                    }`}>
                    {userPlan}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <ul className="space-y-2 font-medium">
            {filteredNav.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `group flex items-center rounded-lg p-2 transition-colors ${isActive
                      ? 'bg-primary text-black font-bold'
                      : 'text-[#B5A99A] dark:text-gray-400 hover:bg-[#3D352E] dark:hover:bg-[#1A1A1A] hover:text-white'
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
