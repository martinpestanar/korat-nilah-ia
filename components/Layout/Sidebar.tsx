
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { X, Sparkles, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NAVIGATION_ITEMS } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { KoratLogo } from '../UI/KoratLogo';
import { AvatarDisplay } from '../UI/AvatarDisplay';
import { AvatarSelector } from '../UI/AvatarSelector';
import { getAvatarById } from '../../constants/avatars';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, isPro, isCopilot, isAdmin, isStaff, logout, hasSaaSModule, avatarId, updateAvatarId } = useAuth();
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);

  // Sidebar uses the normalized roles from context
  const userRoleDisplay = isAdmin ? 'Admin' : isStaff ? 'Staff' : (user?.role || 'User');

  const userPlan = isCopilot ? 'Elite' : isPro ? 'Pro' : 'Glow';
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

  const handleAvatarSelect = async (newId: string) => {
    await updateAvatarId(newId);
    setShowAvatarSelector(false);
  };

  const currentAvatar = avatarId ? getAvatarById(avatarId) : null;

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm sm:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar — design system tokens */}
      <aside
        className={`panel-surface fixed left-0 top-0 z-50 h-screen w-64 transition-all duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} sm:translate-x-0`}
      >
        <div className="flex h-full flex-col overflow-y-auto px-3 py-4">

          {/* ── Logo del salón ── */}
          <div className="mb-5 px-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                {/* Korat leaf logo — color adapts to brand */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 border border-brand/20">
                  <KoratLogo size={22} color="var(--color-brand)" animated />
                </div>
                <div className="min-w-0">
                  <span className="block text-[15px] font-bold tracking-tight truncate" style={{ color: 'var(--color-text-primary)' }} title={nombreSalon}>
                    {nombreSalon}
                  </span>
                  <span className="block text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                    by <span className="font-semibold" style={{ color: 'var(--color-brand)' }}>Korat Flow</span>
                  </span>
                </div>
              </div>
              {/* Close button for mobile */}
              <button
                onClick={onClose}
                className="btn-ghost block shrink-0 h-8 w-8 rounded-lg sm:hidden"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* ── Perfil de usuario ── */}
          <div className="mb-5 mx-1">
            <div className="card-glass rounded-xl p-3">
              <div className="flex items-center gap-3">
                {/* Clickable animated avatar */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowAvatarSelector(true)}
                  className="relative shrink-0 group outline-none"
                  title="Cambiar avatar"
                >
                  <AvatarDisplay
                    avatarId={avatarId}
                    size="sm"
                    userName={userName}
                    animated={false}
                    showHalo
                  />
                  {/* Edit overlay on hover */}
                  <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="text-white text-[9px] font-black">✏️</span>
                  </div>
                </motion.button>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: 'var(--color-text-primary)' }} title={userName}>
                    {userName}
                  </p>
                  <div className="flex gap-1.5 mt-1 flex-wrap">
                    {userRoleDisplay === 'Admin' ? (
                      <span className="badge-glow">{user?.role || 'Admin'}</span>
                    ) : (
                      <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 dark:bg-white/8 dark:text-gray-400">
                        {user?.role || 'Staff'}
                      </span>
                    )}
                    {userPlan === 'Elite' && <span className="badge-elite">{userPlan}</span>}
                    {userPlan === 'Pro'   && <span className="badge-pro">{userPlan}</span>}
                    {userPlan === 'Glow'  && <span className="badge-glow">{userPlan}</span>}
                  </div>
                  {/* Avatar name tag */}
                  {currentAvatar && (
                    <p className="text-[9px] mt-0.5 font-semibold truncate" style={{ color: currentAvatar.accent }}>
                      {currentAvatar.emoji} {currentAvatar.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Navegación ── */}
          <ul className="space-y-0.5 font-medium flex-1">
            {filteredNav.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/nilah/app'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${isActive
                      ? 'gradient-brand text-white font-bold'
                      : 'font-medium hover:bg-light-200 dark:hover:bg-white/5'
                    }`
                  }
                  style={({ isActive }) => ({
                    color: isActive ? 'white' : 'var(--color-text-secondary)',
                    boxShadow: isActive ? 'var(--shadow-brand)' : 'none',
                  })}
                >
                  <item.icon className="h-4.5 w-4.5 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>

          {/* ── Upgrade banner (solo plan Glow) ── */}
          {userPlan === 'Glow' && isAdmin && (
            <div className="mt-4 mx-1 card-premium p-4 text-sm">
              <div className="mb-2 flex items-center gap-2 font-bold" style={{ color: 'var(--color-text-primary)' }}>
                <Sparkles size={14} style={{ color: 'var(--color-brand)' }} /> Desbloquea Nilah Pro
              </div>
              <p className="mb-3 text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                IA de rescate, campañas automáticas y predicción de ingresos.
              </p>
              <button className="btn-primary w-full text-xs py-2 rounded-lg">
                Actualizar Plan →
              </button>
            </div>
          )}

          {/* ── Cerrar sesión ── */}
          <div className={`${userPlan !== 'Glow' || !isAdmin ? 'mt-4' : 'mt-3'} mx-1`}>
            {/* Korat watermark */}
            <div className="flex items-center justify-center gap-1.5 mb-3 opacity-40">
              <KoratLogo size={12} color="var(--color-brand)" />
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-brand)' }}>
                Korat Flow
              </span>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 px-3 py-2.5 text-sm font-medium text-red-500 dark:text-red-400 transition-all hover:bg-red-100 dark:hover:bg-red-900/20"
            >
              <LogOut size={15} />
              Cerrar Sesión
            </button>
          </div>

        </div>
      </aside>

      {/* ── Avatar Selector Modal ── */}
      <AnimatePresence>
        {showAvatarSelector && (
          <AvatarSelector
            currentAvatarId={avatarId}
            onSelect={handleAvatarSelect}
            onClose={() => setShowAvatarSelector(false)}
            isModal
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
