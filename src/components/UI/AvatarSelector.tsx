import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Sparkles } from 'lucide-react';
import { AVATAR_OPTIONS, AvatarOption, getAvatarById } from '../../constants/avatars';

interface AvatarSelectorProps {
  currentAvatarId?: string | null;
  onSelect: (avatarId: string) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  currentAvatarId,
  onSelect,
  onClose,
  isModal = false,
}) => {
  const [hovered, setHovered] = useState<string | null>(null);
  const current = currentAvatarId ? getAvatarById(currentAvatarId) : null;

  const getSpriteStyle = (av: AvatarOption) => ({
    backgroundImage: `url(/avatars/batch${av.batch}.png)`,
    backgroundSize: '200% 200%',
    backgroundPosition: `${av.col === 0 ? '0%' : '100%'} ${av.row === 0 ? '0%' : '100%'}`,
    backgroundRepeat: 'no-repeat' as const,
  });

  const grid = (
    <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 p-1">
      {AVATAR_OPTIONS.map((av) => {
        const isSelected = av.id === currentAvatarId;
        const isHovered = av.id === hovered;
        return (
          <motion.button
            key={av.id}
            whileHover={{ scale: 1.12, y: -4 }}
            whileTap={{ scale: 0.92 }}
            animate={isSelected ? { scale: [1, 1.1, 1], transition: { duration: 0.4 } } : {}}
            style={{ zIndex: isHovered ? 50 : 1 }}
            onClick={() => onSelect(av.id)}
            onMouseEnter={() => setHovered(av.id)}
            onMouseLeave={() => setHovered(null)}
            className="relative group flex flex-col items-center gap-1.5 outline-none focus:outline-none"
          >
            {/* Avatar bubble */}
            <div
              className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 transition-all duration-200"
              style={{
                borderColor: isSelected ? av.accent : 'transparent',
                boxShadow: isSelected
                  ? `0 0 0 3px ${av.accent}30, 0 8px 20px ${av.accent}25`
                  : isHovered ? `0 0 0 2px ${av.accent}50` : 'none',
              }}
            >
              <div className="w-full h-full" style={getSpriteStyle(av)} />
              {/* Selected checkmark */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]"
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: av.accent }}>
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  </div>
                </motion.div>
              )}
            </div>
            {/* Tooltip name */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.85 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.85 }}
                  className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap z-[60] pointer-events-none"
                >
                  <div className="relative">
                    <span className="text-[10px] font-bold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-3 py-1.5 rounded-xl shadow-2xl border border-white/10">
                      {av.emoji} {av.name}
                    </span>
                    {/* Tooltip arrow */}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-900 dark:bg-zinc-100 rotate-45" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );

  if (!isModal) return grid;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 280 }}
          className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-t-[2.5rem] sm:rounded-[2rem] shadow-2xl border border-zinc-200 dark:border-zinc-800"
          onClick={e => e.stopPropagation()}
        >
          {/* Handle bar (mobile) */}
          <div className="sm:hidden flex justify-center pt-3 pb-1">
            <div className="w-12 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" style={{ color: 'var(--color-brand)' }} />
                <h2 className="text-lg font-black text-zinc-900 dark:text-white">Tu Avatar de Nilah ✨</h2>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">Escoge tu alter-ego de belleza profesional</p>
            </div>
            {onClose && (
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Currently selected info */}
          {current && (
            <div className="mx-6 mt-4 px-4 py-3 rounded-2xl border flex items-center gap-3"
              style={{ backgroundColor: `${current.accent}10`, borderColor: `${current.accent}30` }}>
              <span className="text-2xl">{current.emoji}</span>
              <div>
                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{current.name}</p>
                <p className="text-xs" style={{ color: current.accent }}>{current.role}</p>
              </div>
            </div>
          )}

          {/* Grid */}
          <div className="px-6 pt-10 pb-8">
            {grid}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
