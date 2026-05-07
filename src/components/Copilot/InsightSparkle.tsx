import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface InsightSparkleProps {
  id: string;
  tooltipText: string;
  onClick: () => void;
  className?: string;
}

const InsightSparkle: React.FC<InsightSparkleProps> = ({ id, tooltipText, onClick, className = '' }) => {
  return (
    <motion.button
      id={id}
      onClick={onClick}
      title={tooltipText}
      aria-label={tooltipText}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full border border-amber-200 dark:border-white/20 bg-amber-50 dark:bg-white/10 text-amber-500 dark:text-amber-300 backdrop-blur-md transition hover:bg-amber-100 dark:hover:bg-white/20 shadow-sm ${className}`}
      animate={{ y: [0, -2, 0], opacity: [0.75, 1, 0.75] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      whileTap={{ scale: 0.95 }}
    >
      <Sparkles size={16} />
    </motion.button>
  );
};

export default InsightSparkle;
