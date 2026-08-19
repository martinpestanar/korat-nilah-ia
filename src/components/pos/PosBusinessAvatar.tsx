import React from 'react';
import { RubroType } from '../../services/posService';

interface PosBusinessAvatarProps {
  logoUrl?: string;
  rubro: RubroType;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const RUBRO_ILLUSTRATED_CONFIG: Record<
  RubroType,
  { emoji: string; gradient: string; label: string; shadow: string }
> = {
  gastro: {
    emoji: '🍔',
    gradient: 'from-amber-500 via-rose-500 to-red-600',
    shadow: 'shadow-rose-500/30',
    label: 'Gastronomía Gourmet',
  },
  belleza: {
    emoji: '💇‍♀️',
    gradient: 'from-fuchsia-500 via-purple-600 to-indigo-600',
    shadow: 'shadow-fuchsia-500/30',
    label: 'Belleza & Spas',
  },
  mascotas: {
    emoji: '🐾',
    gradient: 'from-emerald-400 via-teal-500 to-cyan-600',
    shadow: 'shadow-emerald-500/30',
    label: 'Salud & Mascotas',
  },
  retail: {
    emoji: '🛠️',
    gradient: 'from-amber-400 via-orange-500 to-rose-500',
    shadow: 'shadow-orange-500/30',
    label: 'Retail & Servicios',
  },
};

const SIZE_CLASSES = {
  sm: 'w-8 h-8 rounded-xl text-base',
  md: 'w-10 h-10 rounded-2xl text-xl',
  lg: 'w-14 h-14 rounded-2xl text-2xl',
  xl: 'w-20 h-20 rounded-3xl text-4xl',
};

export const PosBusinessAvatar: React.FC<PosBusinessAvatarProps> = ({
  logoUrl,
  rubro,
  size = 'md',
  className = '',
}) => {
  const config = RUBRO_ILLUSTRATED_CONFIG[rubro] || RUBRO_ILLUSTRATED_CONFIG.gastro;
  const sizeStyle = SIZE_CLASSES[size];

  if (logoUrl && logoUrl.trim().length > 0) {
    return (
      <div className={`relative overflow-hidden shrink-0 shadow-md border border-slate-200/80 dark:border-white/10 ${sizeStyle} ${className}`}>
        <img
          src={logoUrl}
          alt="Logo de negocio"
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback en caso de link roto
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center font-black text-white shrink-0 bg-gradient-to-br ${config.gradient} shadow-lg ${config.shadow} ring-2 ring-white/20 ${sizeStyle} ${className}`}
      title={config.label}
    >
      <span className="drop-shadow-md select-none">{config.emoji}</span>
      {/* Brillo sutil 3D / Glassmorphism badge */}
      <span className="absolute inset-0 rounded-[inherit] bg-gradient-to-t from-black/20 via-transparent to-white/30 pointer-events-none" />
    </div>
  );
};
