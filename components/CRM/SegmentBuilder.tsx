/**
 * SegmentBuilder.tsx
 * Constructor visual de segmentos — Mobile First.
 * Chips clickeables de servicios + operador AND/OR + filtros rápidos.
 * El contador de clientes se actualiza en tiempo real.
 */
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ServiceCategory, SegmentFilter, SegmentOperator } from '../../types/crm';
import { SegmentClientProfile } from '../../types/crm';
import { applySegment } from '../../utils/segmentation';
import { RawService } from '../../context/DashboardDataContext';
import { useCurrency } from '../../hooks/useCurrency';
import { Sliders, Users, ArrowRight, RotateCcw, CheckCircle2 } from 'lucide-react';

interface Props {
    profiles: Map<number, SegmentClientProfile>;
    categories: ServiceCategory[];
    services: RawService[];
    onCreateSegment: (
        name: string,
        categoryIds: string[],
        operator: SegmentOperator,
        filters: SegmentFilter
    ) => void;
}

const LIFECYCLE_OPTIONS = ['Activo', 'Enfriándose', 'En Riesgo', 'Perdido'];

const SegmentBuilder: React.FC<Props> = ({ profiles, categories, services, onCreateSegment }) => {
    const [selectedCats, setSelectedCats] = useState<string[]>([]);
    const [operator, setOperator] = useState<SegmentOperator>('OR');
    const [showFilters, setShowFilters] = useState(false);
    const [segmentName, setSegmentName] = useState('');
    const [saved, setSaved] = useState(false);
    const { formatValue } = useCurrency();

    // Filters
    const [ltvMin, setLtvMin] = useState('');
    const [diasMin, setDiasMin] = useState('');
    const [diasMax, setDiasMax] = useState('');
    const [visitasMin, setVisitasMin] = useState('');
    const [lifecycle, setLifecycle] = useState<string[]>([]);
    const [selectedServices, setSelectedServices] = useState<string[]>([]);

    // Dropdown state
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Services list from the actual `servicios` table
    const allAvailableServices = useMemo(() => {
        return services.map(s => s.nombre).sort();
    }, [services]);

    const filters: SegmentFilter = useMemo(() => ({
        ltvMin: ltvMin ? Number(ltvMin) : undefined,
        diasAusenteMin: diasMin ? Number(diasMin) : undefined,
        diasAusenteMax: diasMax ? Number(diasMax) : undefined,
        visitasMin: visitasMin ? Number(visitasMin) : undefined,
        lifecycle: lifecycle.length > 0 ? lifecycle : undefined,
        serviciosEspecificos: selectedServices.length > 0 ? selectedServices : undefined,
    }), [ltvMin, diasMin, diasMax, visitasMin, lifecycle, selectedServices]);

    const matchedProfiles = useMemo(() =>
        applySegment(profiles, selectedCats, operator, filters),
        [profiles, selectedCats, operator, filters]
    );

    const toggleCat = (id: string) => {
        setSelectedCats(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
        setSaved(false);
    };

    const toggleLifecycle = (lc: string) => {
        setLifecycle(prev => prev.includes(lc) ? prev.filter(l => l !== lc) : [...prev, lc]);
    };

    const toggleService = (svc: string) => {
        setSelectedServices(prev => prev.includes(svc) ? prev.filter(s => s !== svc) : [...prev, svc]);
    };

    const handleReset = () => {
        setSelectedCats([]);
        setOperator('OR');
        setLtvMin(''); setDiasMin(''); setDiasMax(''); setVisitasMin('');
        setLifecycle([]);
        setSelectedServices([]);
        setSaved(false);
    };

    const handleSave = () => {
        if (matchedProfiles.length === 0) return;
        const nameText = selectedCats.length > 0
            ? selectedCats.map(id => categories.find(c => c.id === id)?.label).join(' + ')
            : selectedServices.length > 0 ? selectedServices.slice(0, 2).join(', ') + (selectedServices.length > 2 ? '...' : '') : 'Avanzado';
        const name = segmentName.trim() || `Segmento ${nameText}`;
        onCreateSegment(name, selectedCats, operator, filters);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const ltvPromedio = matchedProfiles.length > 0
        ? matchedProfiles.reduce((s, p) => s + p.ltv, 0) / matchedProfiles.length
        : 0;

    return (
        <div className="rounded-2xl border border-gray-100 bg-white dark:border-dark-border dark:bg-dark-card overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-white">Constructor de Segmentos</h3>
                        <p className="text-[11px] text-white/80">Elige servicios y cruza filtros</p>
                    </div>
                    <button onClick={handleReset} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20">
                        <RotateCcw className="h-4 w-4 text-white" />
                    </button>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* Category chips */}
                <div>
                    <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                        1. Categorías Amplias (Opcional)
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {categories.length === 0 ? (
                            <p className="text-xs text-gray-400 italic">Cargando categorías de servicios...</p>
                        ) : categories.map(cat => {
                            const active = selectedCats.includes(cat.id);
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => toggleCat(cat.id)}
                                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition-all active:scale-95 ${active
                                        ? `bg-gradient-to-r ${cat.color} text-white border-transparent shadow-sm`
                                        : 'border-gray-200 text-gray-600 dark:border-dark-border dark:text-gray-400 bg-white dark:bg-dark-bg'
                                        }`}
                                >
                                    <span>{cat.emoji}</span>
                                    <span>{cat.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Specific Services (ComboBox) */}
                {allAvailableServices.length > 0 && (
                    <div className="relative">
                        <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                            2. Servicios Específicos (Opcional)
                        </p>

                        {/* Selector UI */}
                        <div className="relative" ref={dropdownRef}>
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Escribe para buscar o selecciona..."
                                className="w-full rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card px-3 py-2 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                onChange={(e) => {
                                    if (!isDropdownOpen) setIsDropdownOpen(true);
                                    // Búsqueda simple
                                    const val = e.target.value.toLowerCase();
                                    const listHtml = document.getElementById('services-dropdown');
                                    if (listHtml) {
                                        Array.from(listHtml.children).forEach((child: any) => {
                                            if (child.dataset.val?.toLowerCase().includes(val)) child.style.display = 'block';
                                            else child.style.display = 'none';
                                        });
                                    }
                                }}
                                onFocus={() => setIsDropdownOpen(true)}
                                onClick={() => setIsDropdownOpen(true)}
                            />

                            {/* Dropdown flotante */}
                            <div
                                id="services-dropdown"
                                className={`${isDropdownOpen ? 'block' : 'hidden'} absolute z-10 w-full mt-1 max-h-48 overflow-y-auto rounded-xl border border-gray-100 shadow-lg bg-white dark:bg-dark-card dark:border-dark-border`}
                            >
                                {allAvailableServices.map(svc => {
                                    const isActive = selectedServices.includes(svc);
                                    if (isActive) return null; // No mostrar los ya seleccionados
                                    return (
                                        <div
                                            key={svc}
                                            data-val={svc}
                                            onClick={() => {
                                                toggleService(svc);
                                                setIsDropdownOpen(false);
                                                if (inputRef.current) {
                                                    inputRef.current.value = '';
                                                    const listHtml = document.getElementById('services-dropdown');
                                                    if (listHtml) {
                                                        Array.from(listHtml.children).forEach((child: any) => {
                                                            child.style.display = 'block';
                                                        });
                                                    }
                                                }
                                            }}
                                            className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 cursor-pointer"
                                        >
                                            {svc}
                                        </div>
                                    );
                                })}
                                {allAvailableServices.length === 0 && (
                                    <div className="px-3 py-2 text-sm text-gray-400">No hay servicios disponibles</div>
                                )}
                            </div>
                        </div>

                        {/* Selected Chips */}
                        {selectedServices.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                {selectedServices.map(svc => (
                                    <div
                                        key={svc}
                                        className="inline-flex items-center gap-1 rounded-md bg-indigo-50 border border-indigo-200 dark:bg-indigo-900/40 dark:border-indigo-700 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 shadow-sm"
                                    >
                                        {svc}
                                        <button
                                            onClick={() => toggleService(svc)}
                                            className="ml-1 text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-200 focus:outline-none rounded-full hover:bg-indigo-100 p-0.5"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Operator toggle (only show when 2+ selected items between cats and specific) */}
                {(selectedCats.length + selectedServices.length) >= 2 && (
                    <div>
                        <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                            3. Tipo de combinación
                        </p>
                        <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-dark-border">
                            <button
                                onClick={() => setOperator('OR')}
                                className={`flex-1 py-2 text-xs font-semibold transition-colors ${operator === 'OR'
                                    ? 'bg-indigo-500 text-white'
                                    : 'text-gray-500 dark:text-gray-400 bg-white dark:bg-dark-bg'
                                    }`}
                            >
                                Cualquiera <span className="opacity-60">(O)</span>
                            </button>
                            <button
                                onClick={() => setOperator('AND')}
                                className={`flex-1 py-2 text-xs font-semibold transition-colors ${operator === 'AND'
                                    ? 'bg-indigo-500 text-white'
                                    : 'text-gray-500 dark:text-gray-400 bg-white dark:bg-dark-bg'
                                    }`}
                            >
                                Todos <span className="opacity-60">(Y)</span>
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1 text-center">
                            {operator === 'OR' ? 'Clientas con al menos uno de los servicios o categorías' : 'Clientas que se han hecho TODOS los servicios/categorías'}
                        </p>
                    </div>
                )}

                {/* Extra Filters toggle */}
                <button
                    onClick={() => setShowFilters(s => !s)}
                    className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400"
                >
                    <Sliders className="h-3.5 w-3.5" />
                    {showFilters ? 'Ocultar filtros de comportamiento' : 'Filtros de comportamiento'}
                </button>

                {showFilters && (
                    <div className="space-y-3 rounded-xl bg-gray-50 dark:bg-dark-bg p-3">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400">LTV mínimo ($)</label>
                                <input
                                    type="number"
                                    value={ltvMin}
                                    onChange={e => setLtvMin(e.target.value)}
                                    placeholder="0"
                                    className="mt-0.5 w-full rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card px-2.5 py-1.5 text-xs dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Visitas mínimas</label>
                                <input
                                    type="number"
                                    value={visitasMin}
                                    onChange={e => setVisitasMin(e.target.value)}
                                    placeholder="1"
                                    className="mt-0.5 w-full rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card px-2.5 py-1.5 text-xs dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Días sin venir (mín)</label>
                                <input
                                    type="number"
                                    value={diasMin}
                                    onChange={e => setDiasMin(e.target.value)}
                                    placeholder="0"
                                    className="mt-0.5 w-full rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card px-2.5 py-1.5 text-xs dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Días sin venir (máx)</label>
                                <input
                                    type="number"
                                    value={diasMax}
                                    onChange={e => setDiasMax(e.target.value)}
                                    placeholder="365"
                                    className="mt-0.5 w-full rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card px-2.5 py-1.5 text-xs dark:text-white"
                                />
                            </div>
                        </div>

                        {/* Lifecycle chips */}
                        <div>
                            <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Estado del cliente</label>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                                {LIFECYCLE_OPTIONS.map(lc => (
                                    <button
                                        key={lc}
                                        onClick={() => toggleLifecycle(lc)}
                                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold border transition-colors ${lifecycle.includes(lc)
                                            ? 'bg-indigo-500 text-white border-transparent'
                                            : 'border-gray-200 dark:border-dark-border text-gray-500 dark:text-gray-400 bg-white dark:bg-dark-bg'
                                            }`}
                                    >
                                        {lc}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Live counter */}
                <div className={`rounded-xl p-3 flex items-center gap-3 transition-colors ${matchedProfiles.length > 0
                    ? 'bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900'
                    : 'bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border'
                    }`}>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${matchedProfiles.length > 0 ? 'bg-indigo-100 dark:bg-indigo-900/40' : 'bg-gray-100 dark:bg-dark-card'
                        }`}>
                        <Users className={`h-5 w-5 ${matchedProfiles.length > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1">
                        <p className={`text-xl font-black leading-none ${matchedProfiles.length > 0 ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-400'}`}>
                            {matchedProfiles.length}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            {matchedProfiles.length === 0
                                ? 'Selecciona servicios arriba'
                                : `clientas · LTV prom. ${formatValue(ltvPromedio)}`}
                        </p>
                    </div>
                    {matchedProfiles.length > 0 && (
                        <span className="text-[10px] font-bold text-indigo-500 animate-pulse">EN VIVO</span>
                    )}
                </div>

                {/* Save segment */}
                {matchedProfiles.length > 0 && (
                    <div className="space-y-2">
                        <input
                            type="text"
                            value={segmentName}
                            onChange={e => setSegmentName(e.target.value)}
                            placeholder="Nombre del segmento (opcional)"
                            className="w-full rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card px-3 py-2 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                        <button
                            onClick={handleSave}
                            className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-all active:scale-95 ${saved
                                ? 'bg-green-500'
                                : 'bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20'
                                }`}
                        >
                            {saved ? (
                                <><CheckCircle2 className="h-4 w-4" /> Segmento guardado</>
                            ) : (
                                <><ArrowRight className="h-4 w-4" /> Guardar y ver segmento</>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SegmentBuilder;
