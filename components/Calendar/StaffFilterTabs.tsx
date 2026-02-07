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
    todos: '🏠',
    ...STAFF_ICONS
};

/**
 * StaffFilterTabs - Filtro de especialidades para el calendario
 * Muestra tabs para filtrar citas por categoría de servicio/staff
 */
export const StaffFilterTabs: React.FC<StaffFilterTabsProps> = ({
    selected,
    onChange,
    counts = {},
    showCounts = false,
    compact = false
}) => {
    return (
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {ESPECIALIDADES.map((esp) => {
                const isSelected = selected === esp;
                const count = counts[esp] || 0;
                const color = esp === 'todos' ? '#6b7280' : STAFF_COLORS[esp];

                return (
                    <button
                        key={esp}
                        onClick={() => onChange(esp)}
                        className={`
              flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs sm:text-sm font-medium
              transition-all duration-200 border-2
              ${isSelected
                                ? 'text-white shadow-md scale-105'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 dark:bg-dark-card dark:text-gray-300 dark:border-dark-border dark:hover:border-gray-600'
                            }
            `}
                        style={isSelected ? {
                            backgroundColor: color,
                            borderColor: color
                        } : undefined}
                    >
                        {!compact && <span className="text-base">{ICONS[esp]}</span>}
                        <span>{LABELS[esp]}</span>
                        {showCounts && count > 0 && (
                            <span className={`
                rounded-full px-1.5 py-0.5 text-[10px] font-bold
                ${isSelected ? 'bg-white/25' : 'bg-gray-100 dark:bg-gray-700'}
              `}>
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
