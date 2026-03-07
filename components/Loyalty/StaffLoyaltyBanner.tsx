/**
 * StaffLoyaltyBanner Component
 * 
 * Banner animado que indica que el modo Staff está activo.
 * Usa gradiente violeta con efecto de resplandor pulse.
 */

import React from 'react';
import { Users, Sparkles } from 'lucide-react';

const StaffLoyaltyBanner: React.FC = () => {
    return (
        <div className="relative overflow-hidden rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-600/10 via-purple-600/10 to-fuchsia-600/10 dark:from-violet-600/20 dark:via-purple-600/20 dark:to-fuchsia-600/20 p-4">
            {/* Animated glow background */}
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-purple-500/10 to-violet-500/5 animate-pulse" />

            {/* Floating sparkles decorations */}
            <div className="absolute top-2 right-6 opacity-20 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '3s' }}>
                <Sparkles className="h-5 w-5 text-violet-400" />
            </div>
            <div className="absolute bottom-2 right-20 opacity-15 animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '4s' }}>
                <Sparkles className="h-4 w-4 text-purple-400" />
            </div>

            <div className="relative flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25">
                    <Users size={20} />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-violet-700 dark:text-violet-300">
                            📊 Modo Staff Activo
                        </h3>
                        <span className="inline-flex items-center rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/20">
                            Por Categoría
                        </span>
                    </div>
                    <p className="text-sm text-violet-600/70 dark:text-violet-400/70">
                        Los puntos se acumulan por categoría de servicio de cada trabajador
                    </p>
                </div>
            </div>
        </div>
    );
};

export default StaffLoyaltyBanner;
