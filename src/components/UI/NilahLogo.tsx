import React from 'react';

export type NilahLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type NilahLogoVariant = 'mark' | 'squircle' | 'full';

export interface NilahLogoProps {
  size?: NilahLogoSize;
  variant?: NilahLogoVariant;
  interactive?: boolean;
  className?: string;
  showTagline?: boolean;
}

const SIZE_MAP: Record<NilahLogoSize, { px: number; text: string; gap: string }> = {
  xs: { px: 22, text: 'text-sm', gap: 'gap-1.5' },
  sm: { px: 32, text: 'text-lg md:text-xl', gap: 'gap-2.5' },
  md: { px: 44, text: 'text-xl', gap: 'gap-2.5' },
  lg: { px: 56, text: 'text-2xl', gap: 'gap-3' },
  xl: { px: 72, text: 'text-3xl', gap: 'gap-3.5' },
};

export const NilahLogo: React.FC<NilahLogoProps> = ({
  size = 'sm',
  variant = 'mark',
  interactive = true,
  className = '',
}) => {
  const { px, text, gap } = SIZE_MAP[size];
  const gradId = React.useId();

  const renderMark = (markSize: number) => (
    <svg
      width={markSize}
      height={markSize}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={interactive ? 'transition-transform duration-300 ease-out group-hover:scale-105 group-active:scale-95' : ''}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="6" y1="6" x2="58" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#9333EA" />
          <stop offset="55%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#5B21B6" />
        </linearGradient>
      </defs>

      {/* Globo exterior estilo WhatsApp */}
      <path
        d="M32 5C17.088 5 5 16.82 5 31.4c0 5.38 1.648 10.387 4.47 14.565L6.2 56.8c-.26.86.54 1.64 1.39 1.36l11.24-3.7A27.28 27.28 0 0 0 32 57.8c14.912 0 27-11.82 27-26.4S46.912 5 32 5Z"
        fill={`url(#${gradId})`}
      />

      {/* Anillo interior blanco */}
      <path
        d="M32 11.2c-11.377 0-20.6 9.044-20.6 20.2 0 4.244 1.334 8.18 3.61 11.43l-1.92 6.37 6.53-2.15A20.77 20.77 0 0 0 32 51.6c11.377 0 20.6-9.044 20.6-20.2S43.377 11.2 32 11.2Z"
        stroke="white"
        strokeWidth="3.2"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Corona VIP centrada con micro-animación al hover */}
      <g className={interactive ? 'origin-center transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:-rotate-3' : ''}>
        {/* Puntas de la corona */}
        <path
          d="M21.5 36.2L19.4 25.6L26.7 30.8L32 22.8L37.3 30.8L44.6 25.6L42.5 36.2H21.5Z"
          fill="white"
          stroke="white"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        {/* Base de la corona */}
        <rect x="21.5" y="38.2" width="21" height="3.2" rx="1.6" fill="white" />
        {/* Tres perlas superiores */}
        <circle cx="19" cy="24.3" r="1.7" fill="white" />
        <circle cx="32" cy="21.2" r="2" fill="white" />
        <circle cx="45" cy="24.3" r="1.7" fill="white" />
      </g>
    </svg>
  );

  const iconNode =
    variant === 'squircle' ? (
      <div
        style={{ width: px, height: px }}
        className={[
          'relative rounded-[26%] bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700 p-[12%] flex items-center justify-center shadow-lg shadow-violet-500/25 ring-1 ring-white/25',
          interactive ? 'transition-all duration-300 ease-out group-hover:scale-105 group-hover:shadow-violet-500/40 group-active:scale-95' : '',
        ].join(' ')}
      >
        <div className="w-full h-full flex items-center justify-center">
          {renderMark(Math.round(px * 0.78))}
        </div>
      </div>
    ) : (
      <div className="relative inline-flex items-center justify-center shrink-0">
        {interactive && (
          <div
            style={{ width: px, height: px }}
            className="absolute inset-0 rounded-full bg-violet-500/25 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          />
        )}
        {renderMark(px)}
      </div>
    );

  if (variant === 'full') {
    return (
      <span className={`inline-flex items-center ${gap} group select-none ${className}`}>
        {iconNode}
        <span className={`${text} font-extrabold tracking-tight leading-none`}>
          <span className="text-[#1E103C] dark:text-white">Nilah</span>{' '}
          <span className="text-violet-600 dark:text-violet-400 font-bold">IA</span>
        </span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center justify-center group select-none ${className}`}>
      {iconNode}
    </span>
  );
};
