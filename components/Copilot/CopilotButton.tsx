import React from 'react';
import { Bot } from 'lucide-react';
import { useCopilot } from '../../context/CopilotContext';

const CopilotButton: React.FC = () => {
  const { openCopilot } = useCopilot();

  return (
    <button
      onClick={() => openCopilot()}
      className="fixed bottom-8 right-8 z-40 hidden h-14 items-center gap-2 rounded-full border border-violet-300/30 bg-gradient-to-r from-violet-500 to-indigo-500 px-5 text-sm font-bold text-white shadow-xl shadow-violet-600/30 transition hover:scale-[1.02] sm:flex"
      title="Abrir Nilah Copilot"
    >
      <Bot size={18} />
      Nilah Copilot
    </button>
  );
};

export default CopilotButton;
