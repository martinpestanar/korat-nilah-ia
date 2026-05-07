/**
 * StaffSelector.tsx — Selector de Categorías de Servicio
 *
 * Muestra las categorías (Manos, Cabello, Pestañas, etc.) como tarjetas
 * seleccionables. Cada tarjeta incluye el emoji de la categoría, el total
 * de puntos generados, los clientes activos y los staff que pertenecen a ella.
 */

import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Users, Star, User } from 'lucide-react';

// ── Tipos ──────────────────────────────────────────────────

export interface StaffMemberData {
    id: number;
    nombre: string;
    especialidad?: string | null;
}

export interface CategoryData {
    categoryName: string;           // "Manos", "Cabello", "Pestañas", etc.
    emoji: string;                  // 💅, 💇, 👁️
    totalPuntos: number;            // Suma de precios de citas completadas
    clientesActivos: number;        // Clientes únicos con citas completadas
    staffMembers: StaffMemberData[];// Staff en esta categoría
}

interface StaffSelectorProps {
    categories: CategoryData[];
    selectedCategory: string | null; // null = "Todos"
    onSelect: (categoryName: string | null) => void;
}

// ── Componente ─────────────────────────────────────────────

const StaffSelector: React.FC<StaffSelectorProps> = ({
    categories,
    selectedCategory,
    onSelect,
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

    const scrollBy = (dir: 'left' | 'right') => {
        scrollRef.current?.scrollBy({ left: dir === 'left' ? -240 : 240, behavior: 'smooth' });
    };

    // Totales para "Todos"
    const totalPuntos = categories.reduce((s, c) => s + c.totalPuntos, 0);
    const totalClientes = categories.reduce((s, c) => s + c.clientesActivos, 0);
    const totalStaff = categories.reduce((s, c) => s + c.staffMembers.length, 0);

    const isSelected = (name: string | null) =>
        selectedCategory === name;

    const handleCategoryClick = (name: string | null) => {
        onSelect(name);
        if (name !== null) {
            setExpandedCategory(prev => prev === name ? null : name);
        } else {
            setExpandedCategory(null);
        }
    };

    return (
        <div className="space-y-3">
            {/* Scroll Wrapper */}
            <div className="relative group">
                {/* Arrows */}
                <button
                    onClick={() => scrollBy('left')}
                    className="absolute -left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-gray-900/80 p-1.5 text-white opacity-0 shadow-lg backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-gray-900"
                >
                    <ChevronLeft size={16} />
                </button>
                <button
                    onClick={() => scrollBy('right')}
                    className="absolute -right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-gray-900/80 p-1.5 text-white opacity-0 shadow-lg backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-gray-900"
                >
                    <ChevronRight size={16} />
                </button>

                {/* Horizontal scroll area */}
                <div
                    ref={scrollRef}
                    className="flex gap-3 overflow-x-auto scroll-smooth scrollbar-hide pb-1 snap-x snap-mandatory"
                    style={{ scrollbarWidth: 'none' }}
                >
                    {/* "Todos" card */}
                    <button
                        onClick={() => handleCategoryClick(null)}
                        className={`flex-none snap-start rounded-xl border-2 px-5 py-3 text-left transition-all duration-200 min-w-[160px]
                            ${isSelected(null)
                                ? 'border-violet-500 bg-gradient-to-br from-violet-500/20 to-purple-600/20 shadow-lg shadow-violet-500/10'
                                : 'border-gray-200 bg-white hover:border-violet-300 hover:bg-violet-50/50 dark:border-gray-700 dark:bg-gray-800/60 dark:hover:border-violet-500/50'
                            }`}
                    >
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xl">📊</span>
                            <span className={`text-sm font-bold ${isSelected(null) ? 'text-violet-400' : 'text-gray-900 dark:text-white'}`}>
                                Todos
                            </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400">
                            <span>{totalPuntos.toLocaleString()} pts</span>
                            <span>·</span>
                            <span>{totalClientes} cli.</span>
                            <span>·</span>
                            <span>{totalStaff} staff</span>
                        </div>
                    </button>

                    {/* Category cards */}
                    {categories.map(cat => (
                        <button
                            key={cat.categoryName}
                            onClick={() => handleCategoryClick(cat.categoryName)}
                            className={`flex-none snap-start rounded-xl border-2 px-5 py-3 text-left transition-all duration-200 min-w-[180px]
                                ${isSelected(cat.categoryName)
                                    ? 'border-violet-500 bg-gradient-to-br from-violet-500/20 to-purple-600/20 shadow-lg shadow-violet-500/10'
                                    : 'border-gray-200 bg-white hover:border-violet-300 hover:bg-violet-50/50 dark:border-gray-700 dark:bg-gray-800/60 dark:hover:border-violet-500/50'
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-xl">{cat.emoji}</span>
                                <span className={`text-sm font-bold truncate ${isSelected(cat.categoryName) ? 'text-violet-400' : 'text-gray-900 dark:text-white'}`}>
                                    {cat.categoryName}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 mb-1.5">
                                <Star size={10} className="text-amber-400" />
                                <span>{cat.totalPuntos.toLocaleString()} pts</span>
                                <span>·</span>
                                <span>{cat.clientesActivos} cli.</span>
                            </div>
                            {/* Staff avatars mini */}
                            <div className="flex items-center gap-1 mt-1">
                                {cat.staffMembers.slice(0, 3).map((staff, i) => (
                                    <div
                                        key={staff.id}
                                        className="flex items-center justify-center w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-[9px] font-bold text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700"
                                        title={staff.nombre}
                                        style={{ zIndex: 3 - i, marginLeft: i > 0 ? -4 : 0 }}
                                    >
                                        {staff.nombre.charAt(0)}
                                    </div>
                                ))}
                                {cat.staffMembers.length > 3 && (
                                    <span className="text-[9px] text-gray-400 ml-0.5">
                                        +{cat.staffMembers.length - 3}
                                    </span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Expanded staff list for selected category */}
            {expandedCategory && (
                <div className="rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-500/5 to-purple-500/5 dark:from-violet-900/10 dark:to-purple-900/10 p-4 animate-fade-in">
                    <div className="flex items-center gap-2 mb-3">
                        <Users size={14} className="text-violet-500" />
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                            Staff en {expandedCategory}
                        </h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {categories
                            .find(c => c.categoryName === expandedCategory)
                            ?.staffMembers.map(staff => (
                                <div
                                    key={staff.id}
                                    className="flex items-center gap-2.5 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 px-3 py-2 transition-colors hover:border-violet-300 dark:hover:border-violet-600"
                                >
                                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/40 text-xs font-bold text-violet-700 dark:text-violet-300">
                                        {staff.nombre.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                                            {staff.nombre}
                                        </p>
                                        {staff.especialidad && (
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                                {staff.especialidad}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            <style>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .animate-fade-in {
                    animation: fadeInDown 0.3s ease-out;
                }
                @keyframes fadeInDown {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default StaffSelector;
