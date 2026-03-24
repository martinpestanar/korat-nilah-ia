import React from 'react';

interface SelectionChipProps {
  label: string;
  emoji?: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const SelectionChip: React.FC<SelectionChipProps> = ({
  label, emoji, selected, onClick, disabled,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`ob-chip ${selected ? 'ob-chip--selected' : 'ob-chip--idle'} ${disabled ? 'ob-chip--disabled' : ''}`}
  >
    {emoji && <span className="ob-chip-emoji">{emoji}</span>}
    <span>{label}</span>
    {selected && <span className="ob-chip-check">✓</span>}
  </button>
);

export default SelectionChip;
