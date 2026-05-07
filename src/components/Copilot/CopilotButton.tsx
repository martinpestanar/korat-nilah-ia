import React from 'react';
import { Bot } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCopilot } from '../../context/CopilotContext';

const CopilotButton: React.FC = () => {
  const { openCopilot } = useCopilot();

  return (
    <motion.button
      drag
      dragMomentum={false}
      onClick={() => openCopilot()}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="fixed bottom-8 right-8 z-[100] hidden h-14 items-center gap-2 rounded-full border border-violet-300/30 bg-gradient-to-r from-violet-500 to-indigo-500 px-5 text-sm font-bold text-white shadow-xl shadow-violet-600/30 sm:flex cursor-grab active:cursor-grabbing"
      title="Abrir Nilah Copilot (Arrastra para mover)"
    >
      <Bot size={18} />
      Nilah Copilot
    </motion.button>
  );
};

export default CopilotButton;
