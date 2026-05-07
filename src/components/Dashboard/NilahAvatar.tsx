/**
 * NilahAvatar v6 — Premium SVG Vector Character
 *
 * Reescrito desde cero como diseño vectorial "Duolingo-style"
 * 3D/Volumétrico simulado con gradientes radiales.
 * Creado directamente como código para garantizar escalabilidad,
 * transparencia total (sin fondos negros) y animaciones de DOM fluidas.
 *
 * Animaciones implementadas con CSS @keyframes y transform-origin fijos (px)
 * garantizando que ninguna pieza se desalinee en ningún navegador.
 */

import React from 'react';

export type NilahMood = 'idle' | 'greeting' | 'talking' | 'celebrating' | 'thinking';

interface NilahAvatarProps {
  mood?: NilahMood;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_MAP = { sm: 64, md: 96, lg: 130, xl: 180 };

const NilahAvatar: React.FC<NilahAvatarProps> = ({
  mood = 'idle',
  size = 'md',
  className = '',
}) => {
  const px = SIZE_MAP[size];

  // Lógica del SVG paths basada en el mood
  const mouthPaths = {
    idle: 'M 90 115 Q 100 120 110 115',
    talking: 'M 88 115 Q 100 128 112 115 Q 100 123 88 115', // boca abierta
    greeting: 'M 85 115 Q 100 135 115 115 Q 100 125 85 115', // sonrisa amplia
    celebrating: 'M 85 112 Q 100 140 115 112 Q 100 130 85 112', // super feliz
    thinking: 'M 92 115 Q 100 118 108 115',
  };

  const getMouthFill = () => {
    if (['talking', 'greeting', 'celebrating'].includes(mood)) return '#F472B6';
    return 'none';
  };

  return (
    <>
      <style>{`
        /* ── Gravedad y rebote base ──────────────── */
        .nilah-wrapper {
          position: relative;
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          user-select: none;
        }

        /* ── Cuerpo principal flotando ────────────── */
        .nilah-body-idle, .nilah-body-greeting {
          animation: float 3s ease-in-out infinite;
        }
        .nilah-body-talking {
          animation: nod 1.5s ease-in-out infinite;
        }
        .nilah-body-celebrating {
          animation: bounce 1s cubic-bezier(0.28, 0.84, 0.42, 1) infinite;
        }
        .nilah-body-thinking {
          transform-origin: 100px 160px;
          animation: tilt 3s ease-in-out infinite;
        }

        /* ── Parpadeo universal y seguro ──────────── */
        .nilah-eyes {
          transform-origin: 100px 90px;
          animation: blink 4s infinite;
        }

        /* ── Brazos ─────────────────────────────── */
        .nilah-arm-l { transform-origin: 50px 120px; }
        .nilah-arm-r { transform-origin: 150px 120px; }
        
        /* Saludo (Waving) */
        .nilah-waving {
          animation: wave 1s ease-in-out infinite transform-origin: 40px 110px;
        }
        
        /* Celebración brazos arriba */
        .nilah-arms-up-l { transform: rotate(-45deg); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .nilah-arms-up-r { transform: rotate(45deg); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }

        /* ── Sombra de suelo ────────────────────── */
        .nilah-shadow-idle, .nilah-shadow-talking, .nilah-shadow-greeting {
          animation: shadow-float 3s ease-in-out infinite;
        }
        .nilah-shadow-celebrating {
          animation: shadow-bounce 1s cubic-bezier(0.28, 0.84, 0.42, 1) infinite;
        }

        /* ── Sparkles y burbujas ────────────────── */
        .nilah-sparkle { animation: sparkle-rise 1.5s ease-out infinite; opacity: 0; }
        .nilah-thought { animation: thought-grow 2s ease-in-out infinite; opacity: 0; }

        /* === KEYFRAMES === */
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
        @keyframes nod {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50%      { transform: translateY(-3px) rotate(2deg); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0) scaleY(1) scaleX(1); }
          15%      { transform: translateY(6px) scaleY(0.9) scaleX(1.05); }
          50%      { transform: translateY(-16px) scaleY(1.05) scaleX(0.95); }
          75%      { transform: translateY(-2px) scaleY(0.98) scaleX(1.02); }
        }
        @keyframes tilt {
          0%, 100% { transform: rotate(0deg); }
          30%      { transform: translateY(-4px) rotate(-4deg); }
          70%      { transform: translateY(-2px) rotate(-2deg); }
        }
        @keyframes blink {
          0%, 95%, 100% { transform: scaleY(1); }
          97.5%         { transform: scaleY(0.05); }
        }
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          25%      { transform: rotate(35deg); }
          75%      { transform: rotate(-15deg); }
        }
        @keyframes shadow-float {
          0%, 100% { transform: scaleX(1); opacity: 0.15; }
          50%      { transform: scaleX(0.8); opacity: 0.08; }
        }
        @keyframes shadow-bounce {
          0%, 100% { transform: scaleX(1); opacity: 0.15; }
          15%      { transform: scaleX(1.1); opacity: 0.2; }
          50%      { transform: scaleX(0.5); opacity: 0.05; }
        }
        @keyframes sparkle-rise {
          0%   { transform: translateY(0) scale(0); opacity: 0; }
          30%  { opacity: 1; }
          100% { transform: translateY(-20px) scale(0.6); opacity: 0; }
        }
        @keyframes thought-grow {
          0%, 100% { transform: scale(0.6); opacity: 0.3; }
          50%      { transform: scale(1); opacity: 0.8; }
        }
      `}</style>

      <div className={`nilah-wrapper ${className}`} style={{ width: px, height: px }}>

        {/* === SOMBRA DE SUELO === */}
        <div
          className={`absolute bottom-0 left-1/2 -ml-[25px] w-[50px] h-[6px] rounded-full bg-indigo-900 filter blur-[2px] nilah-shadow-${mood}`}
        />

        {/* === PERSONAJE SVG === */}
        <div className={`w-full h-full nilah-body-${mood}`}>
          <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
            <defs>
              {/* Material 3D Morado (Cuerpo) */}
              <radialGradient id="gradBody" cx="35%" cy="30%" r="65%">
                <stop offset="0%" stopColor="#A78BFA" />     {/* Highlight */}
                <stop offset="60%" stopColor="#7C3AED" />    {/* Base */}
                <stop offset="100%" stopColor="#4C1D95" />   {/* Sombra */}
              </radialGradient>

              {/* Material 3D Lila Claro (Barriga) */}
              <radialGradient id="gradBelly" cx="50%" cy="35%" r="60%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="40%" stopColor="#DDD6FE" />
                <stop offset="100%" stopColor="#A78BFA" />
              </radialGradient>

              {/* Rubor */}
              <radialGradient id="gradBlush" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#F472B6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#F472B6" stopOpacity="0" />
              </radialGradient>

              {/* Sombra ambient occlusion sutil */}
              <filter id="ao-shadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#312E81" floodOpacity="0.3" />
              </filter>
            </defs>

            {/* Grupo central del personaje */}
            <g filter="url(#ao-shadow)">

              {/* BRAZO IZQUIERDO (Waving si saluda) */}
              <g className={`nilah-arm-l ${mood === 'greeting' ? 'nilah-waving' : mood === 'celebrating' ? 'nilah-arms-up-l' : ''} transition-transform duration-300`}>
                <path d="M 50 120 C 20 120 15 150 25 165 C 35 180 55 170 50 140 Z" fill="url(#gradBody)" />
              </g>

              {/* BRAZO DERECHO */}
              <g className={`nilah-arm-r ${mood === 'celebrating' ? 'nilah-arms-up-r' : ''} transition-transform duration-300`}>
                <path d="M 150 120 C 180 120 185 150 175 165 C 165 180 145 170 150 140 Z" fill="url(#gradBody)" />
              </g>

              {/* CUERPO PRINCIPAL (Híbrido Buho-Gato) */}
              {/* Orejas integradas en la forma del cuerpo */}
              <path
                d="M 100 35 
                   C 60 35 30 50 30 110 
                   C 30 170 60 185 100 185 
                   C 140 185 170 170 170 110 
                   C 170 50 140 35 100 35 Z"
                fill="url(#gradBody)"
              />

              {/* OREJITAS FINAS (Gato) */}
              <path d="M 45 60 L 35 25 L 75 45 Z" fill="url(#gradBody)" strokeLinejoin="round" stroke="#A78BFA" strokeWidth="2" />
              <path d="M 45 55 L 40 32 L 65 45 Z" fill="#DDD6FE" opacity="0.6" />

              <path d="M 155 60 L 165 25 L 125 45 Z" fill="url(#gradBody)" strokeLinejoin="round" stroke="#A78BFA" strokeWidth="2" />
              <path d="M 155 55 L 160 32 L 135 45 Z" fill="#DDD6FE" opacity="0.6" />

              {/* BARRIGA / CARA */}
              <ellipse cx="100" cy="115" rx="55" ry="50" fill="url(#gradBelly)" />

              {/* LAZO COQUETO (Bow) */}
              <g transform="translate(90, 20)">
                <path d="M 10 5 Q 0 0 10 15 Q 15 10 10 5 Z" fill="#F472B6" />
                <path d="M 10 5 Q 20 0 10 15 Q 5 10 10 5 Z" fill="#F472B6" />
                <circle cx="10" cy="9" r="3" fill="#EC4899" />
              </g>

              {/* === OJOS INTEGADOS (Parpadeo 100% seguro) === */}
              {/* La animación 'blink' encoge en Y todo el grupo desde el centro (100, 90) */}
              <g className="nilah-eyes">
                {/* Ojo Izquierdo */}
                <g>
                  <circle cx="68" cy="85" r="22" fill="#FFFFFF" />
                  <circle cx="68" cy="85" r="14" fill="#0F172A" /> {/* Pupila */}
                  <circle cx="73" cy="78" r="4.5" fill="#FFFFFF" /> {/* Brillo primario */}
                  <circle cx="62" cy="91" r="2" fill="#FFFFFF" opacity="0.6" /> {/* Brillo secundario */}
                </g>

                {/* Ojo Derecho */}
                <g>
                  <circle cx="132" cy="85" r="22" fill="#FFFFFF" />
                  <circle cx="132" cy="85" r="14" fill="#0F172A" />
                  <circle cx="137" cy="78" r="4.5" fill="#FFFFFF" />
                  <circle cx="126" cy="91" r="2" fill="#FFFFFF" opacity="0.6" />
                </g>
              </g>

              {/* MEJILLAS (Rubor coqueto) */}
              <ellipse cx="48" cy="100" rx="12" ry="7" fill="url(#gradBlush)" />
              <ellipse cx="152" cy="100" rx="12" ry="7" fill="url(#gradBlush)" />

              {/* NARIZ (Corazón chiquito) */}
              <path d="M 100 105 A 3 3 0 0 0 95 100 A 3 3 0 0 0 100 110 A 3 3 0 0 0 105 100 A 3 3 0 0 0 100 105 Z" fill="#F472B6" />

              {/* BOCA (Animada suavemente a través del atributo d mediante React) */}
              <path
                d={mouthPaths[mood]}
                fill={getMouthFill()}
                stroke="#4C1D95"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
              />
            </g>
          </svg>
        </div>

        {/* === ELEMENTOS EXTRAS FUERA DEL SVG === */}
        {mood === 'celebrating' && (
          <>
            {[
              { e: '✨', c: '-left-4 top-4', d: '0s' },
              { e: '💖', c: 'left-1/2 -top-6', d: '0.2s' },
              { e: '⭐', c: '-right-2 top-8', d: '0.4s' },
              { e: '💫', c: 'left-6 top-1/2', d: '0.6s' }
            ].map((s, i) => (
              <span key={i} className={`absolute text-sm nilah-sparkle pointer-events-none ${s.c}`} style={{ animationDelay: s.d }}>
                {s.e}
              </span>
            ))}
          </>
        )}

        {mood === 'thinking' && (
          <div className="absolute right-[-10px] top-[10%]">
            <div className="w-2 h-2 rounded-full bg-violet-400 nilah-thought ml-4 mb-1" style={{ animationDelay: '0s' }} />
            <div className="w-3 h-3 rounded-full bg-violet-500 nilah-thought ml-6 mb-1" style={{ animationDelay: '0.3s' }} />
            <div className="w-5 h-5 rounded-full bg-indigo-500 nilah-thought ml-8" style={{ animationDelay: '0.6s' }} />
          </div>
        )}
      </div>
    </>
  );
};

export default NilahAvatar;
