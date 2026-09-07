import React, { useState, useEffect } from 'react';
import { 
    Sparkles, Eye, Scissors, HeartPulse, Check, Plus, Edit3, 
    Save, Loader2, AlertCircle, Clock, ShieldCheck, Zap
} from 'lucide-react';
import { evaluateBeautyInsights } from './beautyAdvisor';

export interface FichaTecnicaData {
    activeSpecialties?: ('lash' | 'nails' | 'brows')[];
    lash?: {
        efecto?: string;
        tecnica?: string;
        curvatura?: string;
        grosor?: string;
        mapeo?: string;
        adhesivo?: string;
        sensibilidad?: string;
        zonas_mapeo?: number[];
        morfologia_ojo?: string;
        salud_pestana?: string;
        color_fibra?: string;
    };
    nails?: {
        sistema?: string;
        largo?: string;
        forma?: string;
        tipo_una?: string;
        lampara?: string;
        tono_favorito?: string;
        color_hex?: string;
        tipo_cuticula?: string;
    };
    brows?: {
        servicio?: string;
        tono_pigmento?: string;
        grosor_vello?: string;
        tiempo_laminado?: string;
        tiempo_tinte?: string;
    };
    observaciones?: string;
    ultima_actualizacion?: string;
}

interface FichaTecnicaEditorProps {
    initialData?: FichaTecnicaData | null;
    onSave: (data: FichaTecnicaData) => Promise<void>;
    readOnly?: boolean;
}

// ── SVG ICONS FOR VISUAL NAIL SHAPES ──
const NailShapeIcon: React.FC<{ shape: string; className?: string }> = ({ shape, className = "w-6 h-8" }) => {
    switch (shape) {
        case 'Almendrada (Almond)':
            return (
                <svg viewBox="0 0 24 32" fill="none" className={className} stroke="currentColor" strokeWidth="2">
                    <path d="M5 28V16C5 9 8 4 12 4C16 4 19 9 19 16V28" strokeLinecap="round" />
                    <line x1="7" y1="28" x2="17" y2="28" strokeLinecap="round" />
                </svg>
            );
        case 'Cuadrada (Square)':
            return (
                <svg viewBox="0 0 24 32" fill="none" className={className} stroke="currentColor" strokeWidth="2">
                    <path d="M5 28V6H19V28" strokeLinecap="round" strokeLinejoin="miter" />
                    <line x1="5" y1="6" x2="19" y2="6" strokeLinecap="round" />
                </svg>
            );
        case 'Coffin / Ballerina':
            return (
                <svg viewBox="0 0 24 32" fill="none" className={className} stroke="currentColor" strokeWidth="2">
                    <path d="M5 28V18L8 6H16L19 18V28" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="8" y1="6" x2="16" y2="6" strokeLinecap="round" />
                </svg>
            );
        case 'Stiletto':
            return (
                <svg viewBox="0 0 24 32" fill="none" className={className} stroke="currentColor" strokeWidth="2">
                    <path d="M5 28V16L12 4L19 16V28" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            );
        case 'Ovalada':
            return (
                <svg viewBox="0 0 24 32" fill="none" className={className} stroke="currentColor" strokeWidth="2">
                    <path d="M5 28V14C5 7 8 5 12 5C16 5 19 7 19 14V28" strokeLinecap="round" />
                </svg>
            );
        case 'Squoval':
            return (
                <svg viewBox="0 0 24 32" fill="none" className={className} stroke="currentColor" strokeWidth="2">
                    <path d="M5 28V9C5 7 7 6 9 6H15C17 6 19 7 19 9V28" strokeLinecap="round" />
                </svg>
            );
        case 'Redonda':
        default:
            return (
                <svg viewBox="0 0 24 32" fill="none" className={className} stroke="currentColor" strokeWidth="2">
                    <path d="M6 28V14C6 8 8 7 12 7C16 7 18 8 18 14V28" strokeLinecap="round" />
                </svg>
            );
    }
};

// ── SVG ICONS FOR LASH CURVATURES ──
const LashCurveIcon: React.FC<{ curve: string; className?: string }> = ({ curve, className = "w-6 h-6" }) => {
    switch (curve) {
        case 'C':
            return (
                <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M4 20C9 20 18 17 18 6" />
                </svg>
            );
        case 'CC':
            return (
                <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M4 20C8 20 19 15 16 4" />
                </svg>
            );
        case 'D':
            return (
                <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M4 20C7 20 20 14 13 4" />
                </svg>
            );
        case 'DD':
            return (
                <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M4 20C6 20 21 12 11 4" />
                </svg>
            );
        case 'L':
            return (
                <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M4 20H12L18 6" />
                </svg>
            );
        case 'M':
            return (
                <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M4 20C9 20 12 19 16 6" />
                </svg>
            );
        default:
            return (
                <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M4 20C10 20 17 16 17 6" />
                </svg>
            );
    }
};

// ── ILUSTRACIONES BEAUTY DE MORFOLOGÍA OCULAR ──
const EyeMorphologyIllustration: React.FC<{ type: string; isSelected?: boolean }> = ({ type, isSelected = false }) => {
    const strokeMain = isSelected ? '#FFFFFF' : '#6366F1'; // White or Indigo
    const strokeSecondary = isSelected ? 'rgba(255, 255, 255, 0.6)' : 'rgba(99, 102, 241, 0.4)';
    const irisFill = isSelected ? '#FFFFFF' : '#4F46E5';

    switch (type) {
        case 'Almendrado':
            return (
                <svg viewBox="0 0 68 38" fill="none" className="w-16 h-9 transition-transform" strokeLinecap="round" strokeLinejoin="round">
                    {/* Ceja suave */}
                    <path d="M12 9 C 24 5 44 5 56 10" stroke={strokeSecondary} strokeWidth="1.6" />
                    {/* Pliegue de párpado */}
                    <path d="M16 16 C 26 12 42 12 52 17" stroke={strokeSecondary} strokeWidth="1.2" strokeDasharray="1 1" />
                    {/* Línea superior con delineado almendrado clásico */}
                    <path d="M10 24 C 20 14 46 14 58 20" stroke={strokeMain} strokeWidth="2.4" />
                    {/* Línea inferior suave */}
                    <path d="M12 25 C 24 31 46 30 56 21" stroke={strokeMain} strokeWidth="1.4" />
                    {/* Iris y destello */}
                    <ellipse cx="33" cy="22" rx="6" ry="5.5" fill={irisFill} />
                    <circle cx="35" cy="20" r="1.5" fill="#FFFFFF" />
                    {/* Pestañas exteriores sutiles */}
                    <path d="M52 18 Q 57 15 60 13" stroke={strokeMain} strokeWidth="1.8" />
                </svg>
            );
        case 'Encapotado':
            return (
                <svg viewBox="0 0 68 38" fill="none" className="w-16 h-9 transition-transform" strokeLinecap="round" strokeLinejoin="round">
                    {/* Ceja */}
                    <path d="M12 8 C 24 5 44 5 56 9" stroke={strokeSecondary} strokeWidth="1.6" />
                    {/* Pliegue del párpado cayendo sobre el ojo (Hood fold) */}
                    <path d="M12 18 C 24 13 46 14 56 21" stroke={strokeMain} strokeWidth="2" />
                    {/* Línea de pestañas parcialmente cubierta */}
                    <path d="M14 25 C 24 20 44 20 54 23" stroke={strokeMain} strokeWidth="2.2" />
                    <path d="M15 26 C 24 31 44 31 52 24" stroke={strokeMain} strokeWidth="1.4" />
                    {/* Iris cubierto por el párpado */}
                    <ellipse cx="33" cy="24" rx="5.5" ry="4" fill={irisFill} />
                    <circle cx="35" cy="22" r="1.3" fill="#FFFFFF" />
                    {/* Efecto L-Curl saliendo del encapotado */}
                    <path d="M48 22 Q 54 18 58 14" stroke={strokeMain} strokeWidth="2" />
                </svg>
            );
        case 'Redondo':
            return (
                <svg viewBox="0 0 68 38" fill="none" className="w-16 h-9 transition-transform" strokeLinecap="round" strokeLinejoin="round">
                    {/* Ceja alta */}
                    <path d="M12 7 C 26 3 42 3 56 8" stroke={strokeSecondary} strokeWidth="1.6" />
                    {/* Pliegue alto abierto */}
                    <path d="M16 13 C 28 8 40 8 52 14" stroke={strokeSecondary} strokeWidth="1.2" strokeDasharray="1 1" />
                    {/* Curva ocular amplia y abierta */}
                    <path d="M12 23 C 20 12 48 12 56 23" stroke={strokeMain} strokeWidth="2.4" />
                    <path d="M12 24 C 20 34 48 34 56 24" stroke={strokeMain} strokeWidth="1.5" />
                    {/* Iris grande visible completo */}
                    <circle cx="34" cy="23" r="6.5" fill={irisFill} />
                    <circle cx="36" cy="20" r="2" fill="#FFFFFF" />
                    {/* Pestañas flutter */}
                    <path d="M48 16 Q 52 12 55 9" stroke={strokeMain} strokeWidth="1.8" />
                </svg>
            );
        case 'Hundido':
            return (
                <svg viewBox="0 0 68 38" fill="none" className="w-16 h-9 transition-transform" strokeLinecap="round" strokeLinejoin="round">
                    {/* Arco superciliar pronunciado */}
                    <path d="M10 8 C 24 5 44 6 58 10" stroke={strokeMain} strokeWidth="1.8" />
                    {/* Sombra de cuenca profunda */}
                    <path d="M14 13 C 26 9 42 9 54 15" stroke={strokeSecondary} strokeWidth="1.6" strokeDasharray="2 2" />
                    {/* Ojo en plano posterior */}
                    <path d="M14 24 C 24 17 44 17 54 22" stroke={strokeMain} strokeWidth="2.2" />
                    <path d="M15 25 C 24 30 44 30 52 23" stroke={strokeMain} strokeWidth="1.4" />
                    <ellipse cx="33" cy="23" rx="5.5" ry="5" fill={irisFill} />
                    <circle cx="35" cy="21" r="1.4" fill="#FFFFFF" />
                </svg>
            );
        case 'Rasgado':
        default:
            return (
                <svg viewBox="0 0 68 38" fill="none" className="w-16 h-9 transition-transform" strokeLinecap="round" strokeLinejoin="round">
                    {/* Ceja estilizada foxy */}
                    <path d="M12 10 C 26 7 44 6 58 7" stroke={strokeSecondary} strokeWidth="1.6" />
                    {/* Sin pliegue móvil o muy sutil (Monolid) */}
                    <path d="M20 16 C 32 14 46 13 56 13" stroke={strokeSecondary} strokeWidth="1.2" strokeDasharray="1 1" />
                    {/* Línea con elevación foxy hacia la sien */}
                    <path d="M10 25 C 24 20 44 18 60 13" stroke={strokeMain} strokeWidth="2.6" />
                    <path d="M12 26 C 24 29 44 26 56 16" stroke={strokeMain} strokeWidth="1.4" />
                    <ellipse cx="33" cy="22" rx="5.2" ry="4.5" fill={irisFill} />
                    <circle cx="35" cy="20" r="1.4" fill="#FFFFFF" />
                    {/* Ala foxy */}
                    <path d="M54 15 Q 59 12 63 9" stroke={strokeMain} strokeWidth="2" />
                </svg>
            );
    }
};

// ── COLOR SWATCH PRESETS ──
const COLOR_SWATCHES = [
    { name: 'OPI Bubble Bath', hex: '#F7D4CE' },
    { name: 'Vía Láctea', hex: '#F3F4F6' },
    { name: 'Nude 04 Latte', hex: '#D9B39B' },
    { name: 'Francés Clásico', hex: '#FBCFE8' },
    { name: 'Vino Tinto / Cherry', hex: '#6B1124' },
    { name: 'Rojo Pasión', hex: '#C8102E' },
    { name: 'Glitter Rose Gold', hex: '#FDE047' },
    { name: 'Negro Intenso', hex: '#18181B' },
    { name: 'Lavanda Pastel', hex: '#DDD6FE' },
    { name: 'Choco Glaze', hex: '#78350F' }
];

// ── LASH MAP PRESETS (5 ZONAS) ──
const LASH_MAP_PRESETS = [
    { name: 'Natural', zones: [8, 9, 10, 10, 9] },
    { name: 'Cat Eye', zones: [8, 9, 11, 13, 11] },
    { name: 'Muñeca (Doll)', zones: [8, 10, 12, 12, 10] },
    { name: 'Ardilla (Squirrel)', zones: [8, 9, 12, 13, 11] },
    { name: 'Wispy / Kim K', zones: [9, 11, 13, 12, 10] },
];

const EYE_MORPHOLOGIES = [
    { id: 'Almendrado', label: 'Almendrado', tip: 'Equilibrado • Todo diseño' },
    { id: 'Encapotado', label: 'Párpado Caído', tip: 'Encapotado • Curva L o D' },
    { id: 'Redondo', label: 'Ojo Redondo', tip: 'Abierto • Estilo Cat Eye' },
    { id: 'Hundido', label: 'Ojo Hundido', tip: 'Órbita profunda • Largo +' },
    { id: 'Rasgado', label: 'Rasgado / Foxy', tip: 'Monólido • Efecto Foxy' },
];

const LASH_HEALTH_PRESETS = [
    { id: 'Fuerte', label: 'Fuerte & Gruesa', badge: '🟢 Carga Alta', desc: 'Tolera volumen 5D+ o 0.15mm' },
    { id: 'Media', label: 'Media & Sana', badge: '🟡 Carga Media', desc: 'Tolera clásicas o híbridas 0.10' },
    { id: 'Delicada', label: 'Fina & Delicada', badge: '🔴 Carga Baja', desc: 'Solo extensiones ligeras 0.05-0.07' }
];

const LASH_PRESETS = {
    tecnicas: ['Clásicas (1x1)', 'Híbridas', 'Volumen Ruso (2D-6D)', 'Mega Volumen', 'Lifting / Laminado'],
    curvaturas: ['C', 'CC', 'D', 'DD', 'L', 'M'],
    grosores: ['0.03', '0.05', '0.07', '0.10', '0.12', '0.15'],
    coloresFibra: ['Negro Intenso', 'Mocha Brown (Café)', 'Bicolor / Ombré', 'Puntas Color'],
    adhesivos: ['Secado Rápido (0.5s)', 'Secado Medio (1s)', 'Transparente (Clear)', 'Hipoalergénico'],
    sensibilidades: ['Ninguna', 'Ojos Llorosos', 'Lentes de Contacto', 'Sensible al Cianoacrilato', 'Párpado Graso']
};

const NAIL_PRESETS = {
    sistemas: ['Soft Gel', 'Acrílico / Esculpidas', 'Polygel', 'Nivelación / Rubber', 'Semipermanente', 'Kapping Gel'],
    largos: ['#1 (Muy Corto)', '#2 (Corto)', '#3 (Medio)', '#4 (Largo)', '#5+ (XXL)'],
    formas: ['Almendrada (Almond)', 'Cuadrada (Square)', 'Coffin / Ballerina', 'Stiletto', 'Ovalada', 'Squoval', 'Redonda'],
    tiposUna: ['Saludable', 'Frágil / Quebradiza', 'Grasa / Oleosa', 'Onicofagia (Mordida)', 'Estriada'],
    cuticulas: ['Cutícula Fina (Delicada)', 'Cutícula Normal', 'Cutícula Gruesa / Hiperqueratosis'],
    lamparas: ['Normal', 'Sensible al Calor (Quemazón)', 'Piel Reactiva']
};

const BROW_PRESETS = {
    servicios: ['Laminado de Cejas', 'Henna', 'Tinte Híbrido', 'Microblading / Shading', 'Perfilado + Tinte'],
    tonos: ['Castaño Claro', 'Castaño Medio', 'Castaño Oscuro', 'Negro Cálido', 'Grafito'],
    vello: ['Fino / Ralo', 'Normal / Dócil', 'Rebelde / Rizado', 'Grueso Poblado'],
    tiemposLaminado: ['5 min', '7 min', '9 min', '12 min'],
    tiemposTinte: ['6 min', '8 min', '10 min', '15 min']
};

// Reusable mobile-first Chip Selector
const ChipField: React.FC<{
    label: string;
    presets: string[];
    value?: string;
    onChange: (val: string) => void;
    icon?: React.ReactNode;
    colorTheme?: 'indigo' | 'pink' | 'amber';
}> = ({ label, presets, value = '', onChange, icon, colorTheme = 'indigo' }) => {
    const isCustom = Boolean(value && !presets.includes(value));
    const [isEditingCustom, setIsEditingCustom] = useState(isCustom);
    const [customVal, setCustomVal] = useState(isCustom ? value : '');

    const selectedBg = colorTheme === 'pink'
        ? 'bg-pink-600 text-white shadow-md shadow-pink-500/25 ring-2 ring-pink-500'
        : colorTheme === 'amber'
        ? 'bg-amber-600 text-white shadow-md shadow-amber-500/25 ring-2 ring-amber-500'
        : 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 ring-2 ring-indigo-500';

    const activeTextColor = colorTheme === 'pink'
        ? 'text-pink-600 dark:text-pink-400'
        : colorTheme === 'amber'
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-indigo-600 dark:text-indigo-400';

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                    {icon}
                    {label}
                </span>
                {value && (
                    <span className={`text-[10px] font-bold ${activeTextColor} truncate max-w-[160px]`}>
                        ✓ {value}
                    </span>
                )}
            </div>

            <div className="flex flex-wrap gap-1.5">
                {presets.map((preset) => {
                    const isSelected = value === preset;
                    return (
                        <button
                            type="button"
                            key={preset}
                            onClick={() => {
                                setIsEditingCustom(false);
                                onChange(isSelected ? '' : preset);
                            }}
                            className={`text-xs font-semibold py-2 px-3 rounded-xl transition-all duration-150 active:scale-95 text-left ${
                                isSelected
                                    ? selectedBg
                                    : 'bg-white dark:bg-zinc-800/90 text-gray-700 dark:text-gray-200 border border-gray-200/90 dark:border-zinc-700/80 hover:bg-gray-50 dark:hover:bg-zinc-700/50'
                            }`}
                        >
                            {preset}
                        </button>
                    );
                })}

                {!isEditingCustom && (
                    <button
                        type="button"
                        onClick={() => setIsEditingCustom(true)}
                        className="text-xs font-medium py-2 px-2.5 rounded-xl border border-dashed text-gray-400 border-gray-300 dark:border-zinc-700 hover:text-gray-600 dark:hover:text-gray-200 transition-all active:scale-95 flex items-center gap-1"
                    >
                        <Plus className="h-3 w-3" />
                        {isCustom ? value : 'Otro...'}
                    </button>
                )}
            </div>

            {isEditingCustom && (
                <div className="flex items-center gap-1.5 pt-1 animate-fade-in">
                    <input
                        type="text"
                        value={customVal}
                        onChange={(e) => setCustomVal(e.target.value)}
                        placeholder={`Escribir ${label.toLowerCase()}...`}
                        className="flex-1 text-xs rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                        autoFocus
                    />
                    <button
                        type="button"
                        onClick={() => {
                            if (customVal.trim()) onChange(customVal.trim());
                            setIsEditingCustom(false);
                        }}
                        className="px-3.5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold active:scale-95 shadow-sm"
                    >
                        Aplicar
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsEditingCustom(false)}
                        className="px-2.5 py-2 text-xs text-gray-400 hover:text-gray-600"
                    >
                        ✕
                    </button>
                </div>
            )}
        </div>
    );
};

export const FichaTecnicaEditor: React.FC<FichaTecnicaEditorProps> = ({
    initialData,
    onSave,
    readOnly = false
}) => {
    const [data, setData] = useState<FichaTecnicaData>(() => initialData || {
        activeSpecialties: ['lash', 'nails'],
        lash: {},
        nails: {},
        brows: {},
        observaciones: ''
    });

    const [activeTabSpecialty, setActiveTabSpecialty] = useState<'lash' | 'nails' | 'brows'>('lash');
    
    // Progressive Disclosure Sub-tabs (Clean & Zero Overwhelm)
    const [lashSubTab, setLashSubTab] = useState<'diseno' | 'diagnostico'>('diseno');
    const [nailSubTab, setNailSubTab] = useState<'estilo' | 'salud'>('estilo');
    const [browsSubTab, setBrowsSubTab] = useState<'diseno' | 'tiempos'>('diseno');

    const [isSaving, setIsSaving] = useState(false);
    const [savedSuccess, setSavedSuccess] = useState(false);

    // Lash Map zones (5 zones: Lagrimal -> Centro -> Comisura)
    const [lashZones, setLashZones] = useState<number[]>(() => {
        if (data.lash?.zonas_mapeo && data.lash.zonas_mapeo.length === 5) {
            return data.lash.zonas_mapeo;
        }
        return [8, 9, 11, 12, 10]; // default natural/curved
    });
    const [selectedLashZone, setSelectedLashZone] = useState<number>(2); // Default to Z3 (Centro)
    const ZONE_LABELS = ['Lagrimal', 'C. Interno', 'Centro', 'C. Externo', 'Comisura'];

    useEffect(() => {
        if (initialData) {
            setData(initialData);
            if (initialData.lash?.zonas_mapeo && initialData.lash.zonas_mapeo.length === 5) {
                setLashZones(initialData.lash.zonas_mapeo);
            }
        }
    }, [initialData]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const payload: FichaTecnicaData = {
                ...data,
                lash: {
                    ...data.lash,
                    zonas_mapeo: lashZones,
                    mapeo: `${lashZones[0]}-${Math.max(...lashZones)}mm (${data.lash?.efecto || 'Custom'})`
                },
                ultima_actualizacion: new Date().toISOString()
            };
            await onSave(payload);
            setSavedSuccess(true);
            setTimeout(() => setSavedSuccess(false), 2500);
        } catch (e) {
            console.error('Error saving ficha tecnica:', e);
        } finally {
            setIsSaving(false);
        }
    };

    const updateLashField = (field: keyof NonNullable<FichaTecnicaData['lash']>, val: any) => {
        setData(prev => ({
            ...prev,
            lash: { ...prev.lash, [field]: val }
        }));
    };

    const updateNailField = (field: keyof NonNullable<FichaTecnicaData['nails']>, val: any) => {
        setData(prev => ({
            ...prev,
            nails: { ...prev.nails, [field]: val }
        }));
    };

    const updateBrowsField = (field: keyof NonNullable<FichaTecnicaData['brows']>, val: string) => {
        setData(prev => ({
            ...prev,
            brows: { ...prev.brows, [field]: val }
        }));
    };

    const applyLashMapPreset = (preset: typeof LASH_MAP_PRESETS[0]) => {
        setLashZones(preset.zones);
        updateLashField('efecto', preset.name);
    };

    const adjustZone = (index: number, delta: number) => {
        setLashZones(prev => {
            const next = [...prev];
            const newVal = Math.min(16, Math.max(6, next[index] + delta));
            next[index] = newVal;
            return next;
        });
    };

    return (
        <div className="space-y-4">
            {/* Header with Quick Save */}
            <div className="flex items-center justify-between bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-950/40 dark:via-purple-950/40 dark:to-pink-950/40 p-3 rounded-2xl border border-indigo-200/50 dark:border-indigo-900/40">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30 shrink-0">
                        <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-gray-900 dark:text-white">Ficha Técnica Especializada</h4>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                            {data.ultima_actualizacion 
                                ? `Actualizada: ${new Date(data.ultima_actualizacion).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}`
                                : 'Mapeo ocular, siluetas de uñas y tonos'}
                        </p>
                    </div>
                </div>

                {!readOnly && (
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm ${
                            savedSuccess
                                ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30'
                        } disabled:opacity-50`}
                    >
                        {isSaving ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : savedSuccess ? (
                            <>
                                <Check className="h-3.5 w-3.5" />
                                <span>¡Guardado!</span>
                            </>
                        ) : (
                            <>
                                <Save className="h-3.5 w-3.5" />
                                <span>Guardar</span>
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Specialty Switcher Pills */}
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => setActiveTabSpecialty('lash')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-xs font-bold transition-all border ${
                        activeTabSpecialty === 'lash'
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent shadow-md shadow-indigo-600/25'
                            : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-zinc-800 hover:bg-gray-50'
                    }`}
                >
                    <Eye className="h-4 w-4" />
                    <span>Pestañas</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTabSpecialty('nails')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-xs font-bold transition-all border ${
                        activeTabSpecialty === 'nails'
                            ? 'bg-gradient-to-r from-pink-600 to-rose-500 text-white border-transparent shadow-md shadow-pink-600/25'
                            : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-zinc-800 hover:bg-gray-50'
                    }`}
                >
                    <Scissors className="h-4 w-4" />
                    <span>Uñas</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTabSpecialty('brows')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-xs font-bold transition-all border ${
                        activeTabSpecialty === 'brows'
                            ? 'bg-gradient-to-r from-amber-600 to-orange-500 text-white border-transparent shadow-md shadow-amber-600/25'
                            : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-zinc-800 hover:bg-gray-50'
                    }`}
                >
                    <HeartPulse className="h-4 w-4" />
                    <span>Cejas</span>
                </button>
            </div>

            {/* ── Copiloto Inteligente de Cabina (Real-time AI Insights) ── */}
            {(() => {
                const liveData = { ...data, lash: { ...data.lash, zonas_mapeo: lashZones } };
                const currentInsights = evaluateBeautyInsights(liveData).filter(i => i.specialty === activeTabSpecialty || i.specialty === 'general');
                if (currentInsights.length === 0) return null;
                return (
                    <div className="space-y-2 animate-fade-in">
                        {currentInsights.map(insight => (
                            <div 
                                key={insight.id}
                                className={`p-3 rounded-2xl border flex items-start gap-2.5 text-xs shadow-sm transition-all ${
                                    insight.type === 'warning'
                                        ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-900/50 text-rose-900 dark:text-rose-200'
                                        : insight.type === 'tip'
                                        ? 'bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-200/80 dark:border-indigo-900/50 text-indigo-900 dark:text-indigo-200'
                                        : insight.type === 'success'
                                        ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200'
                                        : 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-900/50 text-amber-900 dark:text-amber-200'
                                }`}
                            >
                                <div className="p-1.5 rounded-xl bg-white/80 dark:bg-black/30 shrink-0 mt-0.5 shadow-2xs">
                                    {insight.type === 'warning' ? (
                                        <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                                    ) : (
                                        <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1 flex-wrap">
                                        <span className="font-black text-xs">
                                            {insight.title}
                                        </span>
                                        {insight.badgeText && (
                                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-white dark:bg-zinc-800 shadow-2xs">
                                                {insight.badgeText}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] leading-relaxed opacity-90 mt-1">
                                        {insight.message}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            })()}

            {/* ══════════════════════════════════════════
                1. PANEL DE LASHISTAS (PESTAÑAS)
            ══════════════════════════════════════════ */}
            {activeTabSpecialty === 'lash' && (
                <div className="space-y-3">
                    {/* Sub-pestañas: Diseño Rápido vs Salud & Diagnóstico */}
                    <div className="flex bg-indigo-100/60 dark:bg-zinc-800/80 p-1 rounded-2xl gap-1 text-xs font-bold">
                        <button
                            type="button"
                            onClick={() => setLashSubTab('diseno')}
                            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                                lashSubTab === 'diseno'
                                    ? 'bg-white dark:bg-zinc-900 text-indigo-700 dark:text-indigo-300 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                            }`}
                        >
                            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                            <span>Diseño & Medidas</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setLashSubTab('diagnostico')}
                            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all relative ${
                                lashSubTab === 'diagnostico'
                                    ? 'bg-white dark:bg-zinc-900 text-indigo-700 dark:text-indigo-300 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                            }`}
                        >
                            <HeartPulse className="h-3.5 w-3.5 text-indigo-500" />
                            <span>Salud & Diagnóstico</span>
                            {Boolean(data.lash?.morfologia_ojo || data.lash?.salud_pestana || (data.lash?.sensibilidad && data.lash.sensibilidad !== 'Ninguna')) && (
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 absolute top-2 right-2" />
                            )}
                        </button>
                    </div>

                    {/* ── SubTab 1: Diseño & Medidas (Rápido y Esencial) ── */}
                    {lashSubTab === 'diseno' && (
                        <div className="bg-indigo-50/40 dark:bg-indigo-950/20 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-900/40 space-y-4 animate-fade-in">
                            {/* Visual Interactive Eye Lash Mapping Diagram */}
                            <div className="bg-white dark:bg-zinc-900/90 p-3.5 rounded-2xl border border-indigo-100 dark:border-zinc-800 shadow-sm space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                                        <Eye className="h-4 w-4 text-indigo-500" />
                                        Mapeo Ocular Visual (Lash Map)
                                    </span>
                                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 px-2 py-0.5 rounded-md">
                                        {data.lash?.efecto || 'Diseño Personalizado'}
                                    </span>
                                </div>

                                {/* Presets de diseño rápido */}
                                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                                    {LASH_MAP_PRESETS.map((p) => {
                                        const isCur = data.lash?.efecto === p.name;
                                        return (
                                            <button
                                                type="button"
                                                key={p.name}
                                                onClick={() => applyLashMapPreset(p)}
                                                className={`text-[11px] font-bold py-1.5 px-3 rounded-xl whitespace-nowrap transition-all shrink-0 active:scale-95 ${
                                                    isCur
                                                        ? 'bg-indigo-600 text-white shadow-sm'
                                                        : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                                                }`}
                                            >
                                                {p.name}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Interactive Eye Zones Bar */}
                                <div className="pt-1 space-y-3">
                                    <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
                                        <span>Lagrimal</span>
                                        <span>Centro</span>
                                        <span>Comisura</span>
                                    </div>

                                    {/* 5 Tappable Zone Cards */}
                                    <div className="grid grid-cols-5 gap-1.5">
                                        {lashZones.map((len, idx) => {
                                            const isSelected = selectedLashZone === idx;
                                            return (
                                                <button
                                                    type="button"
                                                    key={idx}
                                                    onClick={() => setSelectedLashZone(idx)}
                                                    className={`flex flex-col items-center py-2.5 px-1 rounded-2xl border transition-all active:scale-95 text-center relative ${
                                                        isSelected
                                                            ? 'bg-indigo-600 text-white border-transparent shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-500 -translate-y-0.5'
                                                            : 'bg-indigo-50/70 dark:bg-zinc-800/80 text-gray-800 dark:text-gray-200 border-indigo-100 dark:border-zinc-700/60 hover:bg-indigo-100/60'
                                                    }`}
                                                >
                                                    <span className={`text-[9px] font-bold uppercase tracking-wider mb-0.5 ${isSelected ? 'text-indigo-200' : 'text-gray-400'}`}>
                                                        Z{idx + 1}
                                                    </span>
                                                    <span className="text-base font-black leading-none my-1">
                                                        {len}
                                                    </span>
                                                    <span className={`text-[9px] font-medium ${isSelected ? 'text-indigo-200' : 'text-gray-400'}`}>
                                                        mm
                                                    </span>
                                                    {isSelected && (
                                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-indigo-600 rotate-45" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Stepper + Direct Ruler for Selected Zone */}
                                    <div className="bg-indigo-50/90 dark:bg-zinc-800/90 p-3 rounded-2xl border border-indigo-100 dark:border-zinc-700/80 space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-black text-indigo-950 dark:text-indigo-200">
                                                    Ajustar Zona {selectedLashZone + 1}:
                                                </span>
                                                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                                    {ZONE_LABELS[selectedLashZone]}
                                                </span>
                                            </div>
                                            <span className="text-xs font-black text-indigo-700 dark:text-indigo-300">
                                                {lashZones[selectedLashZone]} mm
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => adjustZone(selectedLashZone, -1)}
                                                className="flex-1 h-11 flex items-center justify-center gap-1 bg-white dark:bg-zinc-700 text-indigo-700 dark:text-indigo-200 rounded-xl font-bold text-sm border border-indigo-100 dark:border-zinc-600 shadow-xs active:scale-95 transition-all"
                                            >
                                                <span className="text-base font-black">−</span> 1mm
                                            </button>
                                            <div className="w-16 h-11 flex flex-col items-center justify-center bg-white dark:bg-zinc-900 rounded-xl border border-indigo-200 dark:border-zinc-700 shrink-0">
                                                <span className="text-base font-black text-indigo-900 dark:text-white leading-none">
                                                    {lashZones[selectedLashZone]}
                                                </span>
                                                <span className="text-[9px] font-bold text-gray-400">mm</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => adjustZone(selectedLashZone, 1)}
                                                className="flex-1 h-11 flex items-center justify-center gap-1 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
                                            >
                                                <span className="text-base font-black">+</span> 1mm
                                            </button>
                                        </div>

                                        {/* Direct Number Picker */}
                                        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                                            {[7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((num) => {
                                                const isCur = lashZones[selectedLashZone] === num;
                                                return (
                                                    <button
                                                        type="button"
                                                        key={num}
                                                        onClick={() => {
                                                            setLashZones(prev => {
                                                                const next = [...prev];
                                                                next[selectedLashZone] = num;
                                                                return next;
                                                            });
                                                        }}
                                                        className={`min-w-[36px] h-9 px-2 rounded-xl text-xs font-black transition-all shrink-0 active:scale-90 flex items-center justify-center ${
                                                            isCur
                                                                ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-400'
                                                                : 'bg-white dark:bg-zinc-700 text-gray-700 dark:text-gray-300 border border-indigo-100 dark:border-zinc-600 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {num}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Curvatura con Siluetas Visuales */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                                        <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                                        Curvatura Principal
                                    </span>
                                    {data.lash?.curvatura && (
                                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                                            ✓ Curva {data.lash.curvatura}
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-6 gap-1.5">
                                    {LASH_PRESETS.curvaturas.map((c) => {
                                        const isSel = data.lash?.curvatura === c;
                                        return (
                                            <button
                                                type="button"
                                                key={c}
                                                onClick={() => updateLashField('curvatura', isSel ? '' : c)}
                                                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all border active:scale-95 ${
                                                    isSel
                                                        ? 'bg-indigo-600 text-white border-transparent shadow-md shadow-indigo-600/30 ring-2 ring-indigo-500'
                                                        : 'bg-white dark:bg-zinc-900 text-gray-700 dark:text-gray-200 border-gray-200/80 dark:border-zinc-800 hover:border-indigo-300'
                                                }`}
                                            >
                                                <LashCurveIcon curve={c} className="w-5 h-5 mb-1" />
                                                <span className="text-xs font-black">{c}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Técnica Aplicada & Grosor */}
                            <ChipField
                                label="Técnica de Pestañas"
                                presets={LASH_PRESETS.tecnicas}
                                value={data.lash?.tecnica}
                                onChange={(v) => updateLashField('tecnica', v)}
                                colorTheme="indigo"
                            />

                            <ChipField
                                label="Grosor de Fibra"
                                presets={LASH_PRESETS.grosores}
                                value={data.lash?.grosor}
                                onChange={(v) => updateLashField('grosor', v)}
                                colorTheme="indigo"
                            />
                        </div>
                    )}

                    {/* ── SubTab 2: Salud & Diagnóstico (Nivel Clínico/Avanzado) ── */}
                    {lashSubTab === 'diagnostico' && (
                        <div className="bg-indigo-50/40 dark:bg-indigo-950/20 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-900/40 space-y-4 animate-fade-in">
                            {/* Morfología Ocular Visual */}
                            <div className="space-y-2">
                                <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                                    <Eye className="h-3.5 w-3.5 text-indigo-500" />
                                    Morfología Ocular (Forma de Ojo)
                                </span>
                                <div className="grid grid-cols-2 gap-2.5">
                                    {EYE_MORPHOLOGIES.map((m) => {
                                        const isSel = data.lash?.morfologia_ojo === m.id;
                                        return (
                                            <button
                                                type="button"
                                                key={m.id}
                                                onClick={() => updateLashField('morfologia_ojo', isSel ? '' : m.id)}
                                                className={`flex flex-col items-center justify-between p-3 rounded-2xl border text-center transition-all active:scale-95 ${
                                                    isSel
                                                        ? 'bg-indigo-600 text-white border-transparent shadow-md shadow-indigo-600/30 ring-2 ring-indigo-500'
                                                        : 'bg-white dark:bg-zinc-900 text-gray-800 dark:text-gray-200 border-gray-200/90 dark:border-zinc-800 hover:border-indigo-300'
                                                }`}
                                            >
                                                <div className="w-full flex items-center justify-center py-1">
                                                    <EyeMorphologyIllustration type={m.id} isSelected={isSel} />
                                                </div>
                                                <div className="mt-1.5 w-full">
                                                    <p className={`text-xs font-black leading-tight ${isSel ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                                        {m.label}
                                                    </p>
                                                    <p className={`text-[10px] mt-0.5 font-medium leading-tight ${isSel ? 'text-indigo-100' : 'text-gray-400 dark:text-gray-400'}`}>
                                                        {m.tip}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Semáforo de Salud y Resistencia de Pestaña Natural */}
                            <div className="space-y-2">
                                <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                                    <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
                                    Salud & Resistencia de la Pestaña Natural
                                </span>
                                <div className="space-y-1.5">
                                    {LASH_HEALTH_PRESETS.map((h) => {
                                        const isSel = data.lash?.salud_pestana === h.id;
                                        return (
                                            <button
                                                type="button"
                                                key={h.id}
                                                onClick={() => updateLashField('salud_pestana', isSel ? '' : h.id)}
                                                className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all active:scale-98 text-left ${
                                                    isSel
                                                        ? 'bg-indigo-600 text-white border-transparent shadow-sm ring-2 ring-indigo-500'
                                                        : 'bg-white dark:bg-zinc-900 text-gray-800 dark:text-gray-200 border-gray-200/80 dark:border-zinc-800 hover:bg-gray-50'
                                                }`}
                                            >
                                                <div>
                                                    <p className="text-xs font-bold leading-tight">{h.label}</p>
                                                    <p className={`text-[10px] ${isSel ? 'text-indigo-100' : 'text-gray-400'}`}>{h.desc}</p>
                                                </div>
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${isSel ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300'}`}>
                                                    {h.badge}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Tono de Fibra & Adhesivo */}
                            <ChipField
                                label="Color / Tono de Fibras"
                                presets={LASH_PRESETS.coloresFibra}
                                value={data.lash?.color_fibra}
                                onChange={(v) => updateLashField('color_fibra', v)}
                                colorTheme="indigo"
                            />

                            <ChipField
                                label="Adhesivo / Pegamento Empleado"
                                presets={LASH_PRESETS.adhesivos}
                                value={data.lash?.adhesivo}
                                onChange={(v) => updateLashField('adhesivo', v)}
                                colorTheme="indigo"
                            />

                            <ChipField
                                label="Sensibilidad / Alergias Oculares"
                                presets={LASH_PRESETS.sensibilidades}
                                value={data.lash?.sensibilidad}
                                onChange={(v) => updateLashField('sensibilidad', v)}
                                colorTheme="indigo"
                            />
                        </div>
                    )}
                </div>
            )}

            {/* ══════════════════════════════════════════
                2. PANEL DE MANICURISTAS (UÑAS)
            ══════════════════════════════════════════ */}
            {activeTabSpecialty === 'nails' && (
                <div className="space-y-3">
                    {/* Sub-pestañas: Estilo & Color vs Salud & Preparación */}
                    <div className="flex bg-pink-100/60 dark:bg-zinc-800/80 p-1 rounded-2xl gap-1 text-xs font-bold">
                        <button
                            type="button"
                            onClick={() => setNailSubTab('estilo')}
                            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                                nailSubTab === 'estilo'
                                    ? 'bg-white dark:bg-zinc-900 text-pink-700 dark:text-pink-300 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                            }`}
                        >
                            <Sparkles className="h-3.5 w-3.5 text-pink-500" />
                            <span>Estilo & Color</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setNailSubTab('salud')}
                            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all relative ${
                                nailSubTab === 'salud'
                                    ? 'bg-white dark:bg-zinc-900 text-pink-700 dark:text-pink-300 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                            }`}
                        >
                            <HeartPulse className="h-3.5 w-3.5 text-pink-500" />
                            <span>Salud & Preparación</span>
                            {Boolean(data.nails?.tipo_una || data.nails?.tipo_cuticula || (data.nails?.lampara && data.nails.lampara !== 'Normal')) && (
                                <span className="w-1.5 h-1.5 rounded-full bg-pink-500 absolute top-2 right-2" />
                            )}
                        </button>
                    </div>

                    {/* ── SubTab 1: Estilo & Color ── */}
                    {nailSubTab === 'estilo' && (
                        <div className="bg-pink-50/40 dark:bg-pink-950/20 rounded-2xl p-4 border border-pink-100 dark:border-pink-900/40 space-y-4 animate-fade-in">
                            {/* Siluetas Visuales de Formas de Uña */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                                        <Scissors className="h-3.5 w-3.5 text-pink-500" />
                                        Forma de Punta (Silueta Gráfica)
                                    </span>
                                    {data.nails?.forma && (
                                        <span className="text-[10px] font-bold text-pink-600 dark:text-pink-400">
                                            ✓ {data.nails.forma}
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                    {NAIL_PRESETS.formas.map((forma) => {
                                        const isSel = data.nails?.forma === forma;
                                        const shortName = forma.split(' (')[0];
                                        return (
                                            <button
                                                type="button"
                                                key={forma}
                                                onClick={() => updateNailField('forma', isSel ? '' : forma)}
                                                className={`flex flex-col items-center justify-center p-2.5 rounded-2xl transition-all border active:scale-95 ${
                                                    isSel
                                                        ? 'bg-pink-600 text-white border-transparent shadow-md shadow-pink-600/30 ring-2 ring-pink-500'
                                                        : 'bg-white dark:bg-zinc-900 text-gray-700 dark:text-gray-200 border-gray-200/80 dark:border-zinc-800 hover:border-pink-300'
                                                }`}
                                            >
                                                <NailShapeIcon shape={forma} className="w-5 h-7 mb-1.5" />
                                                <span className="text-[11px] font-bold text-center leading-tight">
                                                    {shortName}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Muestrario de Tonos con Brillo Real */}
                            <div className="space-y-2.5 bg-white dark:bg-zinc-900/90 p-3.5 rounded-2xl border border-pink-100 dark:border-zinc-800 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                                        <Sparkles className="h-3.5 w-3.5 text-pink-500" />
                                        Tono / Esmalte Favorito
                                    </span>
                                    {data.nails?.tono_favorito && (
                                        <span className="text-[10px] font-bold text-pink-600 dark:text-pink-400 truncate max-w-[150px]">
                                            ✓ {data.nails.tono_favorito}
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-5 gap-2 pt-1">
                                    {COLOR_SWATCHES.map((swatch) => {
                                        const isSel = data.nails?.tono_favorito === swatch.name;
                                        return (
                                            <button
                                                type="button"
                                                key={swatch.name}
                                                onClick={() => {
                                                    updateNailField('tono_favorito', isSel ? '' : swatch.name);
                                                    updateNailField('color_hex', isSel ? '' : swatch.hex);
                                                }}
                                                className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all active:scale-95 text-center ${
                                                    isSel ? 'bg-pink-50 dark:bg-pink-950/40 ring-2 ring-pink-500' : 'hover:bg-gray-50 dark:hover:bg-zinc-800'
                                                }`}
                                                title={swatch.name}
                                            >
                                                <div 
                                                    className="w-8 h-8 rounded-full shadow-inner border border-black/10 relative flex items-center justify-center"
                                                    style={{ backgroundColor: swatch.hex }}
                                                >
                                                    <div className="absolute top-1 left-1.5 w-2 h-1 bg-white/60 rounded-full blur-[0.5px]" />
                                                    {isSel && (
                                                        <Check className={`h-4 w-4 ${swatch.hex === '#18181B' || swatch.hex === '#6B1124' || swatch.hex === '#C8102E' ? 'text-white' : 'text-gray-900'} drop-shadow-md`} />
                                                    )}
                                                </div>
                                                <span className="text-[9px] font-bold text-gray-600 dark:text-gray-300 truncate w-full leading-tight">
                                                    {swatch.name.split(' ')[0]}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <input
                                    type="text"
                                    value={data.nails?.tono_favorito || ''}
                                    onChange={(e) => updateNailField('tono_favorito', e.target.value)}
                                    placeholder="O escribe otro tono/código personalizado..."
                                    className="w-full text-xs rounded-xl border border-pink-200 dark:border-zinc-700 bg-pink-50/40 dark:bg-zinc-800/60 p-2 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-pink-500"
                                />
                            </div>

                            {/* Sistema & Largo */}
                            <ChipField
                                label="Sistema de Uñas"
                                presets={NAIL_PRESETS.sistemas}
                                value={data.nails?.sistema}
                                onChange={(v) => updateNailField('sistema', v)}
                                colorTheme="pink"
                            />

                            <ChipField
                                label="Largo Habitual"
                                presets={NAIL_PRESETS.largos}
                                value={data.nails?.largo}
                                onChange={(v) => updateNailField('largo', v)}
                                colorTheme="pink"
                            />
                        </div>
                    )}

                    {/* ── SubTab 2: Salud & Preparación ── */}
                    {nailSubTab === 'salud' && (
                        <div className="bg-pink-50/40 dark:bg-pink-950/20 rounded-2xl p-4 border border-pink-100 dark:border-pink-900/40 space-y-4 animate-fade-in">
                            <ChipField
                                label="Condición de Uña Natural"
                                presets={NAIL_PRESETS.tiposUna}
                                value={data.nails?.tipo_una}
                                onChange={(v) => updateNailField('tipo_una', v)}
                                colorTheme="pink"
                            />

                            <ChipField
                                label="Tipo de Cutícula"
                                presets={NAIL_PRESETS.cuticulas}
                                value={data.nails?.tipo_cuticula}
                                onChange={(v) => updateNailField('tipo_cuticula', v)}
                                colorTheme="pink"
                            />

                            <ChipField
                                label="Sensibilidad en Lámpara UV/LED"
                                presets={NAIL_PRESETS.lamparas}
                                value={data.nails?.lampara}
                                onChange={(v) => updateNailField('lampara', v)}
                                colorTheme="pink"
                            />
                        </div>
                    )}
                </div>
            )}

            {/* ══════════════════════════════════════════
                3. PANEL DE CEJAS (BROWS)
            ══════════════════════════════════════════ */}
            {activeTabSpecialty === 'brows' && (
                <div className="space-y-3">
                    {/* Sub-pestañas: Diseño & Tono vs Tiempos & Vello */}
                    <div className="flex bg-amber-100/60 dark:bg-zinc-800/80 p-1 rounded-2xl gap-1 text-xs font-bold">
                        <button
                            type="button"
                            onClick={() => setBrowsSubTab('diseno')}
                            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                                browsSubTab === 'diseno'
                                    ? 'bg-white dark:bg-zinc-900 text-amber-700 dark:text-amber-300 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                            }`}
                        >
                            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                            <span>Diseño & Tono</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setBrowsSubTab('tiempos')}
                            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all relative ${
                                browsSubTab === 'tiempos'
                                    ? 'bg-white dark:bg-zinc-900 text-amber-700 dark:text-amber-300 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                            }`}
                        >
                            <Clock className="h-3.5 w-3.5 text-amber-500" />
                            <span>Tiempos & Vello</span>
                            {Boolean(data.brows?.grosor_vello || data.brows?.tiempo_laminado || data.brows?.tiempo_tinte) && (
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 absolute top-2 right-2" />
                            )}
                        </button>
                    </div>

                    {/* ── SubTab 1: Diseño & Tono ── */}
                    {browsSubTab === 'diseno' && (
                        <div className="bg-amber-50/40 dark:bg-amber-950/20 rounded-2xl p-4 border border-amber-100 dark:border-amber-900/40 space-y-4 animate-fade-in">
                            <ChipField
                                label="Servicio de Cejas"
                                presets={BROW_PRESETS.servicios}
                                value={data.brows?.servicio}
                                onChange={(v) => updateBrowsField('servicio', v)}
                                colorTheme="amber"
                            />

                            <ChipField
                                label="Tono de Pigmento / Henna"
                                presets={BROW_PRESETS.tonos}
                                value={data.brows?.tono_pigmento}
                                onChange={(v) => updateBrowsField('tono_pigmento', v)}
                                colorTheme="amber"
                            />
                        </div>
                    )}

                    {/* ── SubTab 2: Tiempos & Vello ── */}
                    {browsSubTab === 'tiempos' && (
                        <div className="bg-amber-50/40 dark:bg-amber-950/20 rounded-2xl p-4 border border-amber-100 dark:border-amber-900/40 space-y-4 animate-fade-in">
                            <ChipField
                                label="Grosor / Condición de Vello"
                                presets={BROW_PRESETS.vello}
                                value={data.brows?.grosor_vello}
                                onChange={(v) => updateBrowsField('grosor_vello', v)}
                                colorTheme="amber"
                            />

                            <ChipField
                                label="Tiempo Exposición Laminado (Paso 1)"
                                presets={BROW_PRESETS.tiemposLaminado}
                                value={data.brows?.tiempo_laminado}
                                onChange={(v) => updateBrowsField('tiempo_laminado', v)}
                                colorTheme="amber"
                            />

                            <ChipField
                                label="Tiempo Exposición Tinte / Henna"
                                presets={BROW_PRESETS.tiemposTinte}
                                value={data.brows?.tiempo_tinte}
                                onChange={(v) => updateBrowsField('tiempo_tinte', v)}
                                colorTheme="amber"
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Observaciones Técnicas Generales */}
            <div className="bg-gray-50/80 dark:bg-zinc-900/60 rounded-2xl p-4 border border-gray-200/60 dark:border-zinc-800/80 space-y-2">
                <label className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <Edit3 className="h-4 w-4 text-indigo-500" />
                    Notas Técnicas & Observaciones de Preparación
                </label>
                <textarea
                    value={data.observaciones || ''}
                    onChange={(e) => setData(prev => ({ ...prev, observaciones: e.target.value }))}
                    rows={2}
                    placeholder="Ej: Ojo derecho lagrimal sensible, usar primer sin ácido para uñas, cutículas delgadas..."
                    className="w-full text-xs rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
            </div>

            {/* Bottom floating save button on mobile */}
            {!readOnly && (
                <div className="pt-2">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`w-full py-3.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-98 shadow-md ${
                            savedSuccess
                                ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30'
                        } disabled:opacity-50`}
                    >
                        {isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : savedSuccess ? (
                            <>
                                <Check className="h-4 w-4" />
                                <span>¡Ficha Técnica Guardada con Éxito!</span>
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                <span>Guardar Ficha Técnica</span>
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};
