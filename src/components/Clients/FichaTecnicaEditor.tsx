import React, { useState, useEffect } from 'react';
import { 
    Sparkles, Eye, Scissors, HeartPulse, Check, Plus, Edit3, 
    Save, Loader2, AlertCircle, Info, Calendar, RefreshCw
} from 'lucide-react';

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
    };
    nails?: {
        sistema?: string;
        largo?: string;
        forma?: string;
        tipo_una?: string;
        lampara?: string;
        tono_favorito?: string;
    };
    brows?: {
        servicio?: string;
        tono_pigmento?: string;
    };
    observaciones?: string;
    ultima_actualizacion?: string;
}

interface FichaTecnicaEditorProps {
    initialData?: FichaTecnicaData | null;
    onSave: (data: FichaTecnicaData) => Promise<void>;
    readOnly?: boolean;
}

// Preset options for quick 1-tap mobile selection
const LASH_PRESETS = {
    efectos: ['Cat Eye', 'Ojo de Muñeca (Doll)', 'Wispy / Kim K', 'Ardilla', 'Natural', 'Open Eye', 'Efecto Húmedo (Wet)'],
    tecnicas: ['Clásicas (1x1)', 'Volumen Ruso (2D-6D)', 'Mega Volumen', 'Híbridas', 'Lifting / Laminado'],
    curvaturas: ['C', 'CC', 'D', 'DD', 'L', 'M'],
    grosores: ['0.03', '0.05', '0.07', '0.10', '0.12', '0.15', '0.20'],
    mapeos: ['7-11mm', '8-12mm', '9-13mm', '10-14mm', '11-15mm'],
    adhesivos: ['Secado Rápido (0.5s)', 'Secado Medio (1s)', 'Hipoalergénico', 'Transparente'],
    sensibilidades: ['Ninguna', 'Ojos Llorosos', 'Lentes de Contacto', 'Sensible al Cianoacrilato', 'Párpado Graso']
};

const NAIL_PRESETS = {
    sistemas: ['Soft Gel', 'Acrílico / Esculpidas', 'Polygel', 'Nivelación / Rubber', 'Semipermanente', 'Kapping Gel', 'Baño de Acrílico'],
    largos: ['#1 (Muy Corto/Natural)', '#2 (Corto-Medio)', '#3 (Medio)', '#4 (Largo)', '#5+ (Extra Largo/XXL)'],
    formas: ['Almendrada (Almond)', 'Cuadrada (Square)', 'Coffin / Ballerina', 'Stiletto', 'Ovalada', 'Squoval', 'Redonda'],
    tiposUna: ['Saludable', 'Frágil / Quebradiza', 'Grasa / Oleosa', 'Onicofagia (Mordida)', 'Estriada'],
    lamparas: ['Normal', 'Sensible al Calor (Quemazón)', 'Piel Reactiva'],
    tonosSugeridos: ['Nude 04', 'OPI Bubble Bath', 'Vía Láctea', 'Blanco Lechoso', 'Francés Clásico', 'Glitter Rose']
};

const BROW_PRESETS = {
    servicios: ['Laminado de Cejas', 'Henna', 'Tinte Híbrido', 'Microblading / Shading', 'Perfilado + Tinte'],
    tonos: ['Castaño Claro', 'Castaño Medio', 'Castaño Oscuro', 'Negro Cálido', 'Grafito']
};

// Reusable mobile-first Chip Selector with vibrant beauty theme colors
const ChipField: React.FC<{
    label: string;
    presets: string[];
    value?: string;
    onChange: (val: string) => void;
    icon?: React.ReactNode;
    colorTheme?: 'indigo' | 'pink' | 'amber';
}> = ({ label, presets, value = '', onChange, icon, colorTheme = 'indigo' }) => {
    const isCustom = value && !presets.includes(value);
    const [isEditingCustom, setIsEditingCustom] = useState(isCustom);
    const [customVal, setCustomVal] = useState(isCustom ? value : '');

    const selectedBg = colorTheme === 'pink'
        ? 'bg-gradient-to-r from-pink-600 to-rose-500 text-white shadow-md shadow-pink-500/25 ring-2 ring-pink-500'
        : colorTheme === 'amber'
        ? 'bg-gradient-to-r from-amber-600 to-orange-500 text-white shadow-md shadow-amber-500/25 ring-2 ring-amber-500'
        : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25 ring-2 ring-indigo-500';

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
                            className={`text-xs font-semibold py-1.5 px-3 rounded-xl transition-all duration-150 active:scale-95 text-left ${
                                isSelected
                                    ? selectedBg
                                    : 'bg-white dark:bg-zinc-800/90 text-gray-700 dark:text-gray-200 border border-gray-200/90 dark:border-zinc-700/80 hover:bg-gray-50 dark:hover:bg-zinc-700/50 hover:border-gray-300'
                            }`}
                        >
                            {preset}
                        </button>
                    );
                })}

                {/* Custom value toggle button */}
                {!isEditingCustom && (
                    <button
                        type="button"
                        onClick={() => setIsEditingCustom(true)}
                        className={`text-xs font-medium py-1.5 px-2.5 rounded-xl border border-dashed transition-all active:scale-95 flex items-center gap-1 ${
                            isCustom
                                ? `${colorTheme === 'pink' ? 'bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border-pink-300' : colorTheme === 'amber' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300' : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-300'}`
                                : 'text-gray-400 border-gray-300 dark:border-zinc-700 hover:text-gray-600 dark:hover:text-gray-200'
                        }`}
                    >
                        <Plus className="h-3 w-3" />
                        {isCustom ? value : 'Otro...'}
                    </button>
                )}
            </div>

            {/* Inline Custom Input */}
            {isEditingCustom && (
                <div className="flex items-center gap-1.5 pt-1 animate-fade-in">
                    <input
                        type="text"
                        value={customVal}
                        onChange={(e) => setCustomVal(e.target.value)}
                        placeholder={`Escribir ${label.toLowerCase()} personalizado...`}
                        className="flex-1 text-xs rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary"
                        autoFocus
                    />
                    <button
                        type="button"
                        onClick={() => {
                            if (customVal.trim()) {
                                onChange(customVal.trim());
                            }
                            setIsEditingCustom(false);
                        }}
                        className="px-3.5 py-2 bg-primary text-white rounded-xl text-xs font-bold active:scale-95 shadow-sm"
                    >
                        Aplicar
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setIsEditingCustom(false);
                            if (isCustom) onChange('');
                        }}
                        className="px-2.5 py-2 text-xs font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
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
    const [isSaving, setIsSaving] = useState(false);
    const [savedSuccess, setSavedSuccess] = useState(false);

    useEffect(() => {
        if (initialData) {
            setData(initialData);
        }
    }, [initialData]);

    const activeSpecialties = data.activeSpecialties || ['lash', 'nails'];

    const toggleSpecialty = (spec: 'lash' | 'nails' | 'brows') => {
        const current = new Set(data.activeSpecialties || ['lash', 'nails']);
        if (current.has(spec)) {
            if (current.size > 1) current.delete(spec);
        } else {
            current.add(spec);
        }
        setData(prev => ({ ...prev, activeSpecialties: Array.from(current) as any }));
        setActiveTabSpecialty(spec);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const payload: FichaTecnicaData = {
                ...data,
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

    const updateLashField = (field: keyof NonNullable<FichaTecnicaData['lash']>, val: string) => {
        setData(prev => ({
            ...prev,
            lash: { ...prev.lash, [field]: val }
        }));
    };

    const updateNailField = (field: keyof NonNullable<FichaTecnicaData['nails']>, val: string) => {
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

    return (
        <div className="space-y-4">
            {/* Header info banner */}
            <div className="flex items-center justify-between bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-950/40 dark:via-purple-950/40 dark:to-pink-950/40 p-3 rounded-2xl border border-indigo-200/50 dark:border-indigo-900/40">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30 shrink-0">
                        <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-gray-900 dark:text-white">Ficha Técnica & Medidas</h4>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                            {data.ultima_actualizacion 
                                ? `Actualizada: ${new Date(data.ultima_actualizacion).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}`
                                : 'Registro de mapeo, curvas, largo y fórmulas'
                            }
                        </p>
                    </div>
                </div>

                {!readOnly && (
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm ${
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
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl text-xs font-bold transition-all border ${
                        activeTabSpecialty === 'lash'
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent shadow-md shadow-indigo-600/25'
                            : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-zinc-800 hover:bg-gray-50'
                    }`}
                >
                    <Eye className="h-4 w-4" />
                    <span>👁️ Pestañas</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTabSpecialty('nails')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl text-xs font-bold transition-all border ${
                        activeTabSpecialty === 'nails'
                            ? 'bg-gradient-to-r from-pink-600 to-rose-500 text-white border-transparent shadow-md shadow-pink-600/25'
                            : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-zinc-800 hover:bg-gray-50'
                    }`}
                >
                    <Scissors className="h-4 w-4" />
                    <span>💅 Uñas</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTabSpecialty('brows')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl text-xs font-bold transition-all border ${
                        activeTabSpecialty === 'brows'
                            ? 'bg-gradient-to-r from-amber-600 to-orange-500 text-white border-transparent shadow-md shadow-amber-600/25'
                            : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-zinc-800 hover:bg-gray-50'
                    }`}
                >
                    <HeartPulse className="h-4 w-4" />
                    <span>🪞 Cejas</span>
                </button>
            </div>

            {/* ── 1. LASHISTAS PANEL ── */}
            {activeTabSpecialty === 'lash' && (
                <div className="bg-indigo-50/40 dark:bg-indigo-950/20 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-900/40 space-y-4">
                    <div className="flex items-center justify-between border-b border-indigo-100 dark:border-indigo-900/50 pb-2.5">
                        <span className="text-xs font-black text-indigo-950 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
                            👁️ Parámetros de Pestañas
                        </span>
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100/70 dark:bg-indigo-900/50 px-2 py-0.5 rounded-md">Extensiones & Lifting</span>
                    </div>

                    <ChipField
                        label="Efecto / Diseño de Mirada"
                        presets={LASH_PRESETS.efectos}
                        value={data.lash?.efecto}
                        onChange={(v) => updateLashField('efecto', v)}
                        colorTheme="indigo"
                    />

                    <ChipField
                        label="Técnica Aplicada"
                        presets={LASH_PRESETS.tecnicas}
                        value={data.lash?.tecnica}
                        onChange={(v) => updateLashField('tecnica', v)}
                        colorTheme="indigo"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <ChipField
                            label="Curvatura Principal"
                            presets={LASH_PRESETS.curvaturas}
                            value={data.lash?.curvatura}
                            onChange={(v) => updateLashField('curvatura', v)}
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

                    <ChipField
                        label="Mapeo / Rango de Longitudes (Lagrimal a Comisura)"
                        presets={LASH_PRESETS.mapeos}
                        value={data.lash?.mapeo}
                        onChange={(v) => updateLashField('mapeo', v)}
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

            {/* ── 2. MANICURISTAS PANEL ── */}
            {activeTabSpecialty === 'nails' && (
                <div className="bg-pink-50/40 dark:bg-pink-950/20 rounded-2xl p-4 border border-pink-100 dark:border-pink-900/40 space-y-4">
                    <div className="flex items-center justify-between border-b border-pink-100 dark:border-pink-900/50 pb-2.5">
                        <span className="text-xs font-black text-pink-950 dark:text-pink-200 uppercase tracking-wider flex items-center gap-1.5">
                            💅 Parámetros de Uñas & Manicura
                        </span>
                        <span className="text-[10px] font-bold text-pink-600 dark:text-pink-400 bg-pink-100/70 dark:bg-pink-900/50 px-2 py-0.5 rounded-md">Sistemas & Esculpido</span>
                    </div>

                    <ChipField
                        label="Sistema / Técnica de Uñas"
                        presets={NAIL_PRESETS.sistemas}
                        value={data.nails?.sistema}
                        onChange={(v) => updateNailField('sistema', v)}
                        colorTheme="pink"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <ChipField
                            label="Largo Habitual"
                            presets={NAIL_PRESETS.largos}
                            value={data.nails?.largo}
                            onChange={(v) => updateNailField('largo', v)}
                            colorTheme="pink"
                        />

                        <ChipField
                            label="Forma / Estilo de Punta"
                            presets={NAIL_PRESETS.formas}
                            value={data.nails?.forma}
                            onChange={(v) => updateNailField('forma', v)}
                            colorTheme="pink"
                        />
                    </div>

                    <ChipField
                        label="Condición de Uña Natural"
                        presets={NAIL_PRESETS.tiposUna}
                        value={data.nails?.tipo_una}
                        onChange={(v) => updateNailField('tipo_una', v)}
                        colorTheme="pink"
                    />

                    <ChipField
                        label="Sensibilidad en Lámpara UV/LED"
                        presets={NAIL_PRESETS.lamparas}
                        value={data.nails?.lampara}
                        onChange={(v) => updateNailField('lampara', v)}
                        colorTheme="pink"
                    />

                    {/* Tono / Esmalte Favorito */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-800 dark:text-gray-200 block">
                            Tono / Base Favorita
                        </label>
                        <input
                            type="text"
                            value={data.nails?.tono_favorito || ''}
                            onChange={(e) => updateNailField('tono_favorito', e.target.value)}
                            placeholder="Ej: OPI Bubble Bath, Nude 04, Vía Láctea..."
                            className="w-full text-xs rounded-xl border border-pink-200 dark:border-pink-900/60 bg-white dark:bg-zinc-900 p-2.5 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-pink-500"
                        />
                        <div className="flex flex-wrap gap-1 pt-1">
                            {NAIL_PRESETS.tonosSugeridos.map(tono => (
                                <button
                                    type="button"
                                    key={tono}
                                    onClick={() => updateNailField('tono_favorito', tono)}
                                    className="text-[10px] font-bold py-1 px-2.5 rounded-lg bg-pink-100/80 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 hover:bg-pink-200 transition-colors"
                                >
                                    {tono}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── 3. CEJAS PANEL ── */}
            {activeTabSpecialty === 'brows' && (
                <div className="bg-amber-50/40 dark:bg-amber-950/20 rounded-2xl p-4 border border-amber-100 dark:border-amber-900/40 space-y-4">
                    <div className="flex items-center justify-between border-b border-amber-100 dark:border-amber-900/50 pb-2.5">
                        <span className="text-xs font-black text-amber-950 dark:text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                            🪞 Parámetros de Cejas & Mirada
                        </span>
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-900/50 px-2 py-0.5 rounded-md">Perfilado & Pigmentación</span>
                    </div>

                    <ChipField
                        label="Servicio / Técnica de Cejas"
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



            {/* Observaciones Generales & Fórmulas */}
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
                        className={`w-full py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-98 shadow-md ${
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
