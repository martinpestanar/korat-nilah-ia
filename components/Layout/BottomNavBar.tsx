import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, Crown, Settings, MoreHorizontal, Megaphone, MessageCircle, LogOut, DatabaseZap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BottomSheet } from '../UI/BottomSheet';

const NAV_ITEMS = [
    { path: '/nilah/app', label: 'Inicio', icon: LayoutDashboard, exact: true },
    { path: '/nilah/app/calendar', label: 'Agenda', icon: Calendar, exact: false },
    { path: '/nilah/app/clients', label: 'CRM', icon: DatabaseZap, exact: false },
    { path: '/nilah/app/loyalty', label: 'Fideliz.', icon: Crown, exact: false, saasModule: 'fidelizacion' as const },
];

export const BottomNavBar: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAdmin, hasSaaSModule, logout } = useAuth();
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

    // Filtrar items según permisos
    const visibleItems = NAV_ITEMS.filter(item => {
        if (item.saasModule && !hasSaaSModule(item.saasModule)) return false;
        return true;
    });

    const MORE_MENU_ITEMS = [
        { path: '/nilah/app/engagement', label: 'Engagement', icon: MessageCircle, desc: 'Recordatorios', allowed: hasSaaSModule('engagement_recordatorios') },
        { path: '/nilah/app/marketing', label: 'Marketing', icon: Megaphone, desc: 'Campañas IA', allowed: isAdmin && hasSaaSModule('marketing') },
        { path: '/nilah/app/settings', label: 'Configuración', icon: Settings, desc: 'Ajustes del sistema', allowed: isAdmin },
    ].filter(item => item.allowed);

    const isActive = (path: string, exact: boolean) => {
        if (exact) return location.pathname === path;
        return location.pathname.startsWith(path);
    };

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 sm:hidden"
            style={{
                // Safe area para iPhone con notch / Dynamic Island
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                borderTop: '1px solid rgba(228, 228, 236, 0.8)',
            }}
        >
            {/* Dark mode background viene del body class */}
            <div className="dark:bg-[#09090B]/90 dark:border-[#23232D]" style={{ borderTop: '1px solid transparent' }}>
                <div
                    className="grid h-16"
                    style={{ gridTemplateColumns: `repeat(${visibleItems.length + 1}, minmax(0, 1fr))` }}
                >
                    {visibleItems.map((item) => {
                        const active = isActive(item.path, item.exact);
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className="relative flex flex-col items-center justify-center gap-0.5 transition-all duration-200 active:scale-90"
                            >
                                {/* Píldora activa al fondo del ícono */}
                                {active && (
                                    <span className="absolute top-2 h-1 w-8 rounded-full bg-primary animate-slide-up" />
                                )}

                                <span className={`flex flex-col items-center gap-0.5 pt-0.5 transition-all duration-200 ${active ? 'text-primary scale-110' : 'text-gray-400 dark:text-gray-500'
                                    }`}>
                                    <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                                    <span className={`text-[9px] font-bold tracking-wide uppercase ${active ? 'text-primary' : 'text-gray-400 dark:text-gray-500'
                                        }`}>
                                        {item.label}
                                    </span>
                                </span>
                            </NavLink>
                        );
                    })}

                    {/* Botón MÁS (More) siempre al final */}
                    <button
                        onClick={() => setIsMoreMenuOpen(true)}
                        className="relative flex flex-col items-center justify-center gap-0.5 transition-all duration-200 active:scale-90"
                    >
                        <span className="flex flex-col items-center gap-0.5 pt-0.5 text-gray-400 dark:text-gray-500">
                            <MoreHorizontal size={22} strokeWidth={1.8} />
                            <span className="text-[9px] font-bold tracking-wide uppercase">
                                Más
                            </span>
                        </span>
                    </button>
                </div>
            </div>

            {/* Bottom Sheet - Menú Extra */}
            <BottomSheet
                isOpen={isMoreMenuOpen}
                onClose={() => setIsMoreMenuOpen(false)}
                title="Más opciones"
            >
                <div className="px-5 py-4">
                    <div className="grid grid-cols-1 gap-3">
                        {MORE_MENU_ITEMS.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname.startsWith(item.path);
                            return (
                                <button
                                    key={item.path}
                                    onClick={() => {
                                        navigate(item.path);
                                        setIsMoreMenuOpen(false);
                                    }}
                                    className={`flex items-center gap-4 rounded-xl p-4 transition-all ${isActive
                                        ? 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400'
                                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-dark-border/50 dark:text-gray-300 dark:hover:bg-dark-border'
                                        }`}
                                >
                                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isActive ? 'bg-violet-100 dark:bg-violet-500/20' : 'bg-white dark:bg-[#1A1A1A] shadow-sm'
                                        }`}>
                                        <Icon size={20} />
                                    </div>
                                    <div className="flex flex-col items-start text-left">
                                        <span className="text-sm font-bold">{item.label}</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</span>
                                    </div>
                                </button>
                            );
                        })}

                        {/* Logout Option */}
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-border">
                            <button
                                onClick={() => {
                                    setIsMoreMenuOpen(false);
                                    logout();
                                }}
                                className="flex w-full items-center gap-4 rounded-xl bg-rose-50 p-4 text-rose-600 transition-all hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
                            >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-[#1A1A1A]">
                                    <LogOut size={20} />
                                </div>
                                <div className="flex flex-col items-start text-left">
                                    <span className="text-sm font-bold">Cerrar Sesión</span>
                                    <span className="text-xs opacity-80">Salir de tu cuenta</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </BottomSheet>
        </nav>
    );
};

export default BottomNavBar;
