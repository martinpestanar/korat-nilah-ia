import React from 'react';
import { 
  Building2, Tags, Users, Scissors, 
  PlusCircle, Sparkles, Gift, Bot, HeartHandshake, CheckCircle2, Lock 
} from 'lucide-react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
  maxStepUnlocked: number;
  onStepClick: (step: number) => void;
}

// Iconos correlativos a STEP_LABELS (excluyendo el 1 y el 11 si es posible, aunque TOTAL_STEPS=10)
const STEP_ICONS = [
  null,               // 1: Crear cuenta (usualmente inmutable, pero por índice es 0)
  Building2,          // 2: Tu negocio
  Tags,               // 3: Categorías
  Users,              // 4: Tu equipo
  Scissors,           // 5: Servicios
  PlusCircle,         // 6: Adicionales
  Sparkles,           // 7: Retoques
  Gift,               // 8: Fidelización
  Bot,                // 9: Tu bot ✨
  HeartHandshake,     // 10: Conocerte
];

const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps, stepLabels, maxStepUnlocked, onStepClick }) => {
  const percentage = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto px-4 mt-4">
      <div className="flex w-full justify-between items-center mb-6 px-2">
        <div className="flex items-center gap-3">
          <span className="text-xl font-medium text-gray-900 dark:text-white">
            {stepLabels[currentStep - 1]}
          </span>
          <span className="text-sm font-semibold bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 px-3 py-1 rounded-full">
            Paso {currentStep} de {totalSteps}
          </span>
        </div>
      </div>

      <div className="relative w-full flex justify-between items-center mb-4">
        {/* Track Line */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 dark:bg-zinc-800 -translate-y-1/2 rounded-full z-0" />
        <div 
          className="absolute top-1/2 left-0 h-1 bg-violet-500 -translate-y-1/2 rounded-full z-0 transition-all duration-500 ease-out" 
          style={{ width: `${percentage}%` }}
        />

        {/* Steps */}
        {Array.from({ length: totalSteps }).map((_, i) => {
          const stepNumber = i + 1;
          const isUnlocked = stepNumber <= maxStepUnlocked;
          const isActive = stepNumber === currentStep;
          const IconComp = STEP_ICONS[i] || CheckCircle2;

          return (
            <button
              key={i}
              onClick={() => isUnlocked && onStepClick(stepNumber)}
              disabled={!isUnlocked}
              className={`relative z-10 flex flex-col items-center justify-center group outline-none focus:outline-none ${!isUnlocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-110 transition-transform'}`}
              title={isUnlocked ? `Ir a: ${stepLabels[i]}` : 'Paso bloqueado'}
            >
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-colors duration-300 border-2
                  ${isActive 
                    ? 'bg-violet-600 border-violet-600 text-white' 
                    : isUnlocked 
                      ? 'bg-white dark:bg-zinc-900 border-violet-400 text-violet-600 dark:border-violet-500 dark:text-violet-400' 
                      : 'bg-gray-100 dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-gray-400 dark:text-zinc-500'
                  }
                `}
              >
                {isUnlocked ? (
                  <IconComp size={18} strokeWidth={isActive ? 2.5 : 2} />
                ) : (
                  <Lock size={16} />
                )}
              </div>
              
              {/* Tooltip on Hover */}
              <div className="absolute top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs py-1 px-2 rounded whitespace-nowrap pointer-events-none shadow-lg">
                {stepLabels[i]}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressBar;
