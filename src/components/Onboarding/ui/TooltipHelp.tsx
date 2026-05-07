import React, { useState } from 'react';

interface TooltipHelpProps {
  text: string;
}

const TooltipHelp: React.FC<TooltipHelpProps> = ({ text }) => {
  const [open, setOpen] = useState(false);

  return (
    <span className="ob-tooltip-wrapper">
      <button
        type="button"
        className="ob-tooltip-trigger"
        onClick={() => setOpen(!open)}
        aria-label="Más información"
      >
        ?
      </button>
      {open && (
        <div className="ob-tooltip-box">
          <p>{text}</p>
          <button
            type="button"
            className="ob-tooltip-dismiss"
            onClick={() => setOpen(false)}
          >
            Entendido ✓
          </button>
        </div>
      )}
    </span>
  );
};

export default TooltipHelp;
