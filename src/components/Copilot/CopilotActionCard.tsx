import React from 'react';
import { AlertTriangle, Megaphone, Target, MessageCircleMore, ShieldAlert } from 'lucide-react';
import { CopilotActionCardData } from '../../types/copilot';

interface CopilotActionCardProps {
  data: CopilotActionCardData;
  onAction: (actionCard: CopilotActionCardData) => void;
}

const iconByType = {
  marketing: <Megaphone size={16} />,
  alert: <AlertTriangle size={16} />,
  goal: <Target size={16} />,
  retention: <ShieldAlert size={16} />,
  engagement: <MessageCircleMore size={16} />,
};

const toneByType = {
  marketing: 'from-fuchsia-500/10 to-indigo-500/5 border-fuchsia-300/30 dark:from-fuchsia-500/30 dark:to-indigo-500/20 dark:border-fuchsia-300/30',
  alert: 'from-rose-500/10 to-orange-500/5 border-rose-300/30 dark:from-rose-500/30 dark:to-orange-500/20 dark:border-rose-300/30',
  goal: 'from-emerald-500/10 to-cyan-500/5 border-emerald-300/30 dark:from-emerald-500/30 dark:to-cyan-500/20 dark:border-emerald-300/30',
  retention: 'from-blue-500/10 to-indigo-500/5 border-blue-300/30 dark:from-blue-500/30 dark:to-indigo-500/20 dark:border-blue-300/30',
  engagement: 'from-violet-500/10 to-sky-500/5 border-violet-300/30 dark:from-violet-500/30 dark:to-sky-500/20 dark:border-violet-300/30',
};

const CopilotActionCard: React.FC<CopilotActionCardProps> = ({ data, onAction }) => {
  return (
    <div className={`mt-2 rounded-2xl border bg-gradient-to-br p-3 shadow-sm ${toneByType[data.type]}`}>
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-white/80">
        {iconByType[data.type]}
        Acción sugerida
      </div>
      <h4 className="text-sm font-bold text-gray-900 dark:text-white">{data.title}</h4>
      <p className="mt-1 text-xs text-gray-600 dark:text-gray-200 leading-relaxed">{data.description}</p>
      <button
        onClick={() => onAction(data)}
        className="mt-3 flex w-full items-center justify-center rounded-xl border border-gray-300/50 dark:border-white/25 bg-white/50 dark:bg-white/10 px-3 py-2 text-xs font-bold text-gray-800 dark:text-white transition hover:bg-gray-100 dark:hover:bg-white/20 hover:shadow-sm"
      >
        {data.actionLabel}
      </button>
    </div>
  );
};

export default CopilotActionCard;
