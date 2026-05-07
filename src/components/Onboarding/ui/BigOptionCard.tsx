import React from 'react';

interface BigOptionCardProps {
  emoji: string;
  title: string;
  description: string;
  pros: string[];
  selected: boolean;
  onClick: () => void;
}

const BigOptionCard: React.FC<BigOptionCardProps> = ({
  emoji, title, description, pros, selected, onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`ob-big-card ${selected ? 'ob-big-card--selected' : 'ob-big-card--idle'}`}
  >
    <div className="ob-big-card-emoji">{emoji}</div>
    <h4 className="ob-big-card-title">{title}</h4>
    <p className="ob-big-card-desc">{description}</p>
    <ul className="ob-big-card-pros">
      {pros.map((p) => (
        <li key={p}>✓ {p}</li>
      ))}
    </ul>
    {selected && <div className="ob-big-card-badge">Seleccionado</div>}
  </button>
);

export default BigOptionCard;
