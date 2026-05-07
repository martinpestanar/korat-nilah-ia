import React from 'react';
import { StaffEspecialidad, STAFF_ICONS, STAFF_COLORS } from '../../types';

interface StaffFilterTabsProps {
    selected: StaffEspecialidad | 'todos';
    onChange: (especialidad: StaffEspecialidad | 'todos') => void;
    counts?: Record<StaffEspecialidad | 'todos', number>;
    showCounts?: boolean;
    compact?: boolean;
}

const ESPECIALIDADES: (StaffEspecialidad | 'todos')[] = [
    'todos',
    'manos',
    'pies',
    'pestañas',
    'rostro',
    'cabello'
];

const LABELS: Record<StaffEspecialidad | 'todos', string> = {
    todos: 'Todos',
    manos: 'Manos',
    pies: 'Pies',
    pestañas: 'Pestañas',
    rostro: 'Rostro',
    cabello: 'Cabello',
    multi: 'Multi'
};

const ICONS: Record<StaffEspecialidad | 'todos', string> = {
    todos: '✦',
    ...STAFF_ICONS
};

// Colores de fondo suave para estado inactivo
const LIGHT_COLORS: Record<StaffEspecialidad | 'todos', string> = {
    todos: '#f3f4f6',
    manos: '#fce7f3',
    pies: '#fff7ed',
    pestañas: '#f5f3ff',
    rostro: '#ecfdf5',
    cabello: '#eff6ff',
    multi: '#f9fafb',
};

const LIGHT_TEXT: Record<StaffEspecialidad | 'todos', string> = {
    todos: '#6b7280',
    manos: '#be185d',
    pies: '#c2410c',
    pestañas: '#6d28d9',
    rostro: '#065f46',
    cabello: '#1d4ed8',
    multi: '#374151',
};

/**
 * StaffFilterTabs — Filtro de especialidades con scroll horizontal
 * Chips con color de categoría, touch targets 44px, scroll snap
 */
export const StaffFilterTabs: React.FC<StaffFilterTabsProps> = ({
    selected,
    onChange,
    counts = {},
    showCounts = false,
    compact = false
}) => {
    return (
        <div
            className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide snap-x snap-mandatory"
            style={{ WebkitOverflowScrolling: 'touch' }}
        >
            {ESPECIALIDADES.map((esp) => {
                const isSelected = selected === esp;
                const count = counts[esp] || 0;
                const activeColor = esp === 'todos' ? '#6b7280' : STAFF_COLORS[esp];
                const lightBg = LIGHT_COLORS[esp];
                const lightText = LIGHT_TEXT[esp];

                return (
                    <button
                        key={esp}
                        onClick={() => onChange(esp)}
                        className="flex-shrink-0 snap-start flex items-center gap-1.5 rounded-2xl px-3.5 font-semibold transition-all duration-200 active:scale-95"
                        style={{
                            minHeight: '44px',
                            fontSize: compact ? '12px' : '13px',
                            backgroundColor: isSelected ? activeColor : lightBg,
                            color: isSelected ? '#ffffff' : lightText,
                            boxShadow: isSelected
                                ? `0 4px 12px -2px ${activeColor}50`
                                : 'none',
                            transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                        }}
                    >
                        {!compact && (
                            <span style={{ fontSize: '15px', lineHeight: 1 }}>
                                {ICONS[esp]}
                            </span>
                        )}
                        <span className="font-bold">{LABELS[esp]}</span>
                        {showCounts && count > 0 && (
                            <span
                                className="rounded-full px-1.5 py-0.5 text-[10px] font-black leading-none"
                                style={{
                                    backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : activeColor + '20',
                                    color: isSelected ? '#fff' : activeColor,
                                }}
                            >
                                {count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
};

export default StaffFilterTabs;
