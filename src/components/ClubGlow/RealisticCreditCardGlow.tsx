/**
 * RealisticCreditCardGlow.tsx
 * Tarjeta de Crédito VIP Realista para Club Glow by Nilah.
 * - Aspect Ratio Bancario (1.586 : 1)
 * - Giro 3D Tilt con mouse y touch (soporte táctil móvil con `onTouchMove`)
 * - Sellos como MEDALLONES CIRCULARES DE JOYERÍA 3D:
 *   - Oro puro para sellos normales
 *   - Hito 4: Medallón Oro Rosa (Rose Gold)
 *   - Hito 8: Medallón Platino Luxe
 *   - Hito 12: Medallón Corona de Oro Emperatriz
 *   - Slots vacíos: Ranuras circulares troqueladas bajo relieve (Debossed)
 * - Cuadrícula optimizada: 6 columnas x 2 filas (proporción natural para tarjeta)
 * - Chip EMV de oro pulido + Antena Contactless
 * - Holograma interactivo iridiscente reactivo al tacto/cursor
 */

import React, { useRef, useState } from 'react';
import { Wifi, Sparkles, Gift, Crown } from 'lucide-react';

interface RealisticCreditCardProps {
  salonName: string;
  clientName: string;
  stampsCount: number;
  totalRoadmap?: number;
  hitos?: { hito: number; nombre: string }[];
  cardNumber?: string;
  validThru?: string;
}

export const RealisticCreditCardGlow: React.FC<RealisticCreditCardProps> = ({
  salonName,
  clientName,
  stampsCount,
  totalRoadmap = 12,
  hitos = [
    { hito: 4, nombre: 'Mimo Sorpresa' },
    { hito: 8, nombre: 'Detalle Premium' },
    { hito: 12, nombre: 'Premio Glow 👑' }
  ],
  cardNumber = '•••• 9842 •••• 2026',
  validThru = '12/28'
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50, opacity: 0 });

  const calculateTilt = (clientX: number, clientY: number) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rX = Math.max(-14, Math.min(14, ((y - centerY) / centerY) * -12));
    const rY = Math.max(-14, Math.min(14, ((x - centerX) / centerX) * 12));

    setRotateX(rX);
    setRotateY(rY);
    setGlarePosition({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.85
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    calculateTilt(e.clientX, e.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      calculateTilt(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const resetTilt = () => {
    setRotateX(0);
    setRotateY(0);
    setGlarePosition(prev => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      className="w-full flex items-center justify-center p-1 sm:p-2 select-none"
      style={{ perspective: 1200 }}
    >
      {/* Marco de Oro Biselado 3D */}
      <div className="realistic-credit-card-frame w-full max-w-[400px] sm:max-w-[450px]">
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={resetTilt}
          onTouchMove={handleTouchMove}
          onTouchEnd={resetTilt}
          className="realistic-credit-card w-full p-3 sm:p-5 text-white cursor-pointer active:scale-[0.99] touch-none"
          style={{
            transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          }}
        >
          {/* Rayo de luz dinámico que cruza la tarjeta continuamente */}
          <div className="card-light-sweep" />

          {/* Holograma iridiscente interactivo (reacciona al mouse y touch) */}
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-20"
            style={{
              opacity: glarePosition.opacity,
              background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255, 240, 180, 0.55) 0%, rgba(217, 70, 239, 0.32) 16%, rgba(56, 189, 248, 0.20) 28%, transparent 38%)`
            }}
          />

          {/* ── HEADER DE LA TARJETA: SALÓN + CORONA VIP ── */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1 text-[8px] sm:text-[9px] font-extrabold tracking-widest uppercase text-[#f5d77f]">
                <Sparkles size={10} className="text-[#f5d77f] animate-spin-slow" />
                {salonName.toUpperCase()}
              </div>
              <div className="text-base sm:text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                <span className="gold-gradient-text drop-shadow-[0_2px_8px_rgba(212,175,55,0.4)]">CLUB GLOW</span>
                <span className="text-[8px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-white/10 text-amber-200 border border-amber-400/30 shadow-inner">
                  VIP BLACK
                </span>
              </div>
            </div>

            {/* Medallón de la Corona Real */}
            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-full stamp-coin-crown flex items-center justify-center text-sm sm:text-base font-black text-amber-950 shrink-0 shadow-xl cursor-pointer hover:scale-105 transition-transform">
              👑
            </div>
          </div>

          {/* ── SECCIÓN CENTRAL: CHIP EMV + PLACA PERSONALIZADA DE LA CLIENTA ── */}
          <div className="relative z-10 my-1.5 sm:my-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="emv-chip scale-75 sm:scale-100 origin-left shrink-0 shadow-md" />
              <Wifi className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300/80 rotate-90" />
            </div>

            {/* Placa Metálica VIP donde resalta con orgullo el nombre de la clienta */}
            <div className="client-gold-plate px-2.5 sm:px-3 py-1 flex items-center gap-1.5 flex-1 max-w-[200px] sm:max-w-[240px]">
              <Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#f5d77f] shrink-0 drop-shadow" />
              <div className="truncate">
                <div className="text-[6px] sm:text-[7px] uppercase font-bold text-amber-300/80 tracking-widest leading-none">
                  TITULAR VIP
                </div>
                <div className="text-[10px] sm:text-sm font-black text-white font-mono tracking-wider truncate drop-shadow-sm leading-tight mt-0.5">
                  {clientName.toUpperCase()}
                </div>
              </div>
            </div>
          </div>

          {/* ── BANDEJA BAJO RELIEVE CON SLOTS Y MEDALLONES ESCULPIDOS ── */}
          <div className="relative z-10 stamps-recessed-tray grid grid-cols-6 gap-1.5 sm:gap-2.5 mt-2 mb-1 sm:mt-3 sm:mb-1 p-2 sm:p-3">
            {Array.from({ length: totalRoadmap }).map((_, i) => {
              const stampNum = i + 1;
              const isEarned = stampNum <= stampsCount;

              const isMilestone4 = stampNum === 4;
              const isMilestone8 = stampNum === 8;
              const isMilestone12 = stampNum === 12;
              const isMilestone = isMilestone4 || isMilestone8 || isMilestone12;

              let coinClass = 'stamp-gold-star-coin stamp-active-gold-glow';
              if (isMilestone4) coinClass = 'stamp-coin-circle stamp-coin-rosegold ring-1 ring-white/60';
              if (isMilestone8) coinClass = 'stamp-coin-circle stamp-coin-emerald ring-1 ring-emerald-200/70';
              if (isMilestone12) coinClass = 'stamp-coin-circle stamp-coin-amethyst ring-1 ring-amber-300/80';

              return (
                <div
                  key={i}
                  className={
                    isEarned
                      ? coinClass
                      : isMilestone
                      ? 'stamp-slot-milestone'
                      : 'stamp-slot-engraved'
                  }
                >
                  {isEarned ? (
                    <div className="flex flex-col items-center justify-center relative z-10 w-full h-full p-0.5">
                      {isMilestone4 ? (
                        <div className="flex flex-col items-center justify-center">
                          {/* Icono 3D de Premio Sorpresa (Caja de Regalo 3D con Cinta) */}
                          <img
                            src="https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Wrapped%20gift/3D/wrapped_gift_3d.png"
                            alt="Premio Sorpresa 3D"
                            className="w-4 h-4 sm:w-5 sm:h-5 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] hover:scale-110 transition-transform"
                            loading="lazy"
                          />
                          <span className="text-[6.5px] sm:text-[7.5px] font-black text-white tracking-tighter leading-none mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                            #4
                          </span>
                        </div>
                      ) : isMilestone8 ? (
                        <div className="flex flex-col items-center justify-center">
                          {/* Icono 3D de Diamante / Gema Preciosa */}
                          <img
                            src="https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Gem%20stone/3D/gem_stone_3d.png"
                            alt="Gema 3D"
                            className="w-4 h-4 sm:w-5 sm:h-5 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] hover:scale-110 transition-transform"
                            loading="lazy"
                          />
                          <span className="text-[6.5px] sm:text-[7.5px] font-black text-emerald-100 tracking-tighter leading-none mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                            #8
                          </span>
                        </div>
                      ) : isMilestone12 ? (
                        <div className="flex flex-col items-center justify-center">
                          {/* Icono 3D Corona Real de Oro */}
                          <img
                            src="https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Crown/3D/crown_3d.png"
                            alt="Corona 3D"
                            className="w-4 h-4 sm:w-5 sm:h-5 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)] hover:scale-110 transition-transform"
                            loading="lazy"
                          />
                          <span className="text-[6.5px] sm:text-[7.5px] font-black text-amber-200 tracking-tighter leading-none mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                            #12
                          </span>
                        </div>
                      ) : (
                        <>
                          <span className="text-amber-950 font-black text-xs sm:text-sm leading-none drop-shadow">
                            ✦
                          </span>
                          <span className="text-[7px] sm:text-[8px] font-black text-amber-950 tracking-tighter leading-none mt-0.5">
                            #{stampNum}
                          </span>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <span className={`font-bold text-[8.5px] sm:text-[9.5px] leading-none ${isMilestone ? 'text-[#f5d77f]' : 'text-gray-400 opacity-80'}`}>
                        #{stampNum}
                      </span>
                      {isMilestone && (
                        <div className="flex items-center justify-center mt-0.5">
                          <img
                            src={
                              isMilestone4
                                ? 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Wrapped%20gift/3D/wrapped_gift_3d.png'
                                : isMilestone8
                                ? 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Gem%20stone/3D/gem_stone_3d.png'
                                : 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Crown/3D/crown_3d.png'
                            }
                            alt="Premio 3D"
                            className="w-3 h-3 sm:w-3.5 sm:h-3.5 object-contain opacity-90 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]"
                            loading="lazy"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
