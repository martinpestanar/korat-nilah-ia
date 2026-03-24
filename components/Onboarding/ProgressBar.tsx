import React from 'react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps, stepLabels }) => {
  const percentage = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="ob-progress-wrapper">
      <div className="ob-progress-header">
        <span className="ob-progress-step-label">
          {stepLabels[currentStep - 1]}
        </span>
        <span className="ob-progress-counter">
          {currentStep} / {totalSteps}
        </span>
      </div>
      <div className="ob-progress-track">
        <div
          className="ob-progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="ob-progress-dots">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`ob-progress-dot ${
              i + 1 < currentStep
                ? 'ob-progress-dot--done'
                : i + 1 === currentStep
                ? 'ob-progress-dot--active'
                : 'ob-progress-dot--pending'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default ProgressBar;
