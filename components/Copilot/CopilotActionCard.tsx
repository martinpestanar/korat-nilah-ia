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
  marketing: 'from-fuchsia-500/30 to-indigo-500/20 border-fuchsia-300/30',
  alert: 'from-rose-500/30 to-orange-500/20 border-rose-300/30',
  goal: 'from-emerald-500/30 to-cyan-500/20 border-emerald-300/30',
  retention: 'from-blue-500/30 to-indigo-500/20 border-blue-300/30',
  engagement: 'from-violet-500/30 to-sky-500/20 border-violet-300/30',
};

const CopilotActionCard: React.FC<CopilotActionCardProps> = ({ data, onAction }) => {
  return (
    <div className={`mt-2 rounded-2xl border bg-gradient-to-br p-3 ${toneByType[data.type]}`}>
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/80">
        {iconByType[data.type]}
        Accion sugerida
      </div>
      <h4 className="text-sm font-bold text-white">{data.title}</h4>
      <p className="mt-1 text-xs text-gray-200">{data.description}</p>
      <button
        onClick={() => onAction(data)}
        className="mt-3 inline-flex items-center rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/20"
      >
        {data.actionLabel}
      </button>
    </div>
  );
};

export default CopilotActionCard;
