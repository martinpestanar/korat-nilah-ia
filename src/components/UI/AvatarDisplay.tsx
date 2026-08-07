import React from 'react';
import { motion } from 'framer-motion';
import { AvatarOption, getAvatarById, getRandomAvatar } from '../../constants/avatars';

interface AvatarDisplayProps {
  avatarId?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  userName?: string;
  animated?: boolean;
  showHalo?: boolean;
  className?: string;
}

const SIZE_MAP = {
  xs:  { outer: 'h-7 w-7',   inner: 64  },
  sm:  { outer: 'h-9 w-9',   inner: 80  },
  md:  { outer: 'h-12 w-12', inner: 100 },
  lg:  { outer: 'h-16 w-16', inner: 130 },
  xl:  { outer: 'h-24 w-24', inner: 192 },
};

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({
  avatarId,
  size = 'sm',
  userName = 'U',
  animated = true,
  showHalo = true,
  className = '',
}) => {
  const avatar = avatarId ? getAvatarById(avatarId) : null;
  const { outer, inner } = SIZE_MAP[size];

  // If no avatar, show a gradient initials placeholder
  if (!avatar) {
    const initials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    return (
      <div
        className={`${outer} ${className} rounded-full flex items-center justify-center text-white font-black shrink-0`}
        style={{ background: 'linear-gradient(135deg, var(--color-brand), hsl(280deg 70% 65%))' }}
      >
        <span style={{ fontSize: `${inner * 0.28}px` }}>{initials}</span>
      </div>
    );
  }

  // Sprite sheet: each image is 2x2 grid → slice with objectPosition
  const spriteUrl = `/avatars/batch${avatar.batch}.png`;
  // BGPosition: col*50% row*50%
  const bgPosX = avatar.col === 0 ? '0%' : '100%';
  const bgPosY = avatar.row === 0 ? '0%' : '100%';

  const innerEl = (
    <div
      className={`${outer} ${className} rounded-full overflow-hidden shrink-0 relative`}
      style={{
        outline: showHalo ? `3px solid ${avatar.accent}33` : undefined,
        outlineOffset: '2px',
        boxShadow: showHalo ? `0 0 16px 2px ${avatar.accent}30` : undefined,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundImage: `url(${spriteUrl})`,
          backgroundSize: '200% 200%',
          backgroundPosition: `${bgPosX} ${bgPosY}`,
          backgroundRepeat: 'no-repeat',
        }}
      />
    </div>
  );

  if (!animated) return innerEl;

  return (
    <motion.div
      whileHover={{ scale: 1.08, rotate: 5 }}
      transition={{ duration: 0.25, type: 'tween', ease: 'easeOut' }}
      className="shrink-0"
    >
      {innerEl}
    </motion.div>
  );

};
