import React from 'react';
import { motion } from 'framer-motion';
import { Leaf } from 'lucide-react';

interface KoratLogoProps {
  /** Size in px */
  size?: number;
  /** CSS color string. Falls back to currentColor so it inherits text color. */
  color?: string;
  /** Show hover wiggle animation */
  animated?: boolean;
  className?: string;
}

/**
 * Korat Flow leaf logo as an inline SVG component.
 * Adapts its color to the current context via `color` prop or CSS `currentColor`.
 */
export const KoratLogo: React.FC<KoratLogoProps> = ({
  size = 24,
  color = 'currentColor',
  animated = false,
  className = '',
}) => {
  const svg = (
    <div className={`relative group inline-flex ${className}`}>
      <Leaf 
        size={size} 
        color={color} 
        strokeWidth={2.5}
        className={animated ? "" : "transition-transform group-hover:rotate-12"}
      />
      <div 
        className="absolute inset-0 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" 
        style={{ backgroundColor: color === 'currentColor' ? 'var(--color-brand)' : color, opacity: 0.2 }}
      />
    </div>
  );

  if (!animated) return svg;

  return (
    <motion.div
      whileHover={{ rotate: [0, -8, 8, -4, 0], scale: 1.1 }}
      transition={{ duration: 0.5, type: 'spring' }}
      style={{ display: 'inline-flex' }}
    >
      {svg}
    </motion.div>
  );
};

export default KoratLogo;
