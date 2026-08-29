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

// Reusable mobile-first Chip Selector with inline custom input
const ChipField: React.FC<{
    label: string;
    presets: string[];
    value?: string;
    onChange: (val: string) => void;
    icon?: React.ReactNode;
}> = ({ label, presets, value = '', onChange, icon }) => {
    const isCustom = value && !presets.includes(value);
    const [isEditingCustom, setIsEditingCustom] = useState(isCustom);
    const [customVal, setCustomVal] = useState(isCustom ? value : '');

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    {icon}
                    {label}
                </span>
                {value && (
                    <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 truncate max-w-[150px]">
                        {value}
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
                                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 ring-2 ring-indigo-600 dark:ring-indigo-400'
                                    : 'bg-white dark:bg-zinc-800/90 text-gray-700 dark:text-gray-300 border border-gray-200/80 dark:border-zinc-700/80 hover:bg-gray-50 dark:hover:bg-zinc-700/50'
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
                                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700'
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
                        className="flex-1 text-xs rounded-xl border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-zinc-900 px-3 py-2 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
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
                        className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold active:scale-95 shadow-sm"
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
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                            : 'bg-gray-50 dark:bg-zinc-900/80 text-gray-600 dark:text-gray-300 border-gray-200/80 dark:border-zinc-800'
                    }`}
                >
                    <Eye className="h-4 w-4" />
                    <span>👁️ Lashistas</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTabSpecialty('nails')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl text-xs font-bold transition-all border ${
                        activeTabSpecialty === 'nails'
                            ? 'bg-pink-600 text-white border-pink-600 shadow-md shadow-pink-600/20'
                            : 'bg-gray-50 dark:bg-zinc-900/80 text-gray-600 dark:text-gray-300 border-gray-200/80 dark:border-zinc-800'
                    }`}
                >
                    <Scissors className="h-4 w-4" />
                    <span>💅 Manicuristas</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTabSpecialty('brows')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl text-xs font-bold transition-all border ${
                        activeTabSpecialty === 'brows'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20'
                            : 'bg-gray-50 dark:bg-zinc-900/80 text-gray-600 dark:text-gray-300 border-gray-200/80 dark:border-zinc-800'
                    }`}
                >
                    <HeartPulse className="h-4 w-4" />
                    <span>🪞 Cejas</span>
                </button>
            </div>

            {/* ── 1. LASHISTAS PANEL ── */}
            {activeTabSpecialty === 'lash' && (
                <div className="bg-gray-50/80 dark:bg-zinc-900/60 rounded-2xl p-4 border border-gray-200/60 dark:border-zinc-800/80 space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-200/60 dark:border-zinc-800 pb-2">
                        <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                            👁️ Parámetros de Pestañas
                        </span>
                        <span className="text-[10px] text-gray-400">Extensiones & Lifting</span>
                    </div>

                    <ChipField
                        label="Efecto / Diseño de Mirada"
                        presets={LASH_PRESETS.efectos}
                        value={data.lash?.efecto}
                        onChange={(v) => updateLashField('efecto', v)}
                    />

                    <ChipField
                        label="Técnica Aplicada"
                        presets={LASH_PRESETS.tecnicas}
                        value={data.lash?.tecnica}
                        onChange={(v) => updateLashField('tecnica', v)}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <ChipField
                            label="Curvatura Principal"
                            presets={LASH_PRESETS.curvaturas}
                            value={data.lash?.curvatura}
                            onChange={(v) => updateLashField('curvatura', v)}
                        />

                        <ChipField
                            label="Grosor de Fibra"
                            presets={LASH_PRESETS.grosores}
                            value={data.lash?.grosor}
                            onChange={(v) => updateLashField('grosor', v)}
                        />
                    </div>

                    <ChipField
                        label="Mapeo / Rango de Longitudes (Lagrimal a Comisura)"
                        presets={LASH_PRESETS.mapeos}
                        value={data.lash?.mapeo}
                        onChange={(v) => updateLashField('mapeo', v)}
                    />

                    <ChipField
                        label="Adhesivo / Pegamento Empleado"
                        presets={LASH_PRESETS.adhesivos}
                        value={data.lash?.adhesivo}
                        onChange={(v) => updateLashField('adhesivo', v)}
                    />

                    <ChipField
                        label="Sensibilidad / Alergias Oculares"
                        presets={LASH_PRESETS.sensibilidades}
                        value={data.lash?.sensibilidad}
                        onChange={(v) => updateLashField('sensibilidad', v)}
                    />
                </div>
            )}

            {/* ── 2. MANICURISTAS PANEL ── */}
            {activeTabSpecialty === 'nails' && (
                <div className="bg-gray-50/80 dark:bg-zinc-900/60 rounded-2xl p-4 border border-gray-200/60 dark:border-zinc-800/80 space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-200/60 dark:border-zinc-800 pb-2">
                        <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                            💅 Parámetros de Uñas & Manicura
                        </span>
                        <span className="text-[10px] text-gray-400">Sistemas & Esculpido</span>
                    </div>

                    <ChipField
                        label="Sistema / Técnica de Uñas"
                        presets={NAIL_PRESETS.sistemas}
                        value={data.nails?.sistema}
                        onChange={(v) => updateNailField('sistema', v)}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <ChipField
                            label="Largo Habitual"
                            presets={NAIL_PRESETS.largos}
                            value={data.nails?.largo}
                            onChange={(v) => updateNailField('largo', v)}
                        />

                        <ChipField
                            label="Forma / Estilo de Punta"
                            presets={NAIL_PRESETS.formas}
                            value={data.nails?.forma}
                            onChange={(v) => updateNailField('forma', v)}
                        />
                    </div>

                    <ChipField
                        label="Condición de Uña Natural"
                        presets={NAIL_PRESETS.tiposUna}
                        value={data.nails?.tipo_una}
                        onChange={(v) => updateNailField('tipo_una', v)}
                    />

                    <ChipField
                        label="Sensibilidad en Lámpara UV/LED"
                        presets={NAIL_PRESETS.lamparas}
                        value={data.nails?.lampara}
                        onChange={(v) => updateNailField('lampara', v)}
                    />

                    {/* Tono / Esmalte Favorito */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block">
                            Tono / Base Favorita
                        </label>
                        <input
                            type="text"
                            value={data.nails?.tono_favorito || ''}
                            onChange={(e) => updateNailField('tono_favorito', e.target.value)}
                            placeholder="Ej: OPI Bubble Bath, Nude 04, Vía Láctea..."
                            className="w-full text-xs rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2.5 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-pink-500"
                        />
                        <div className="flex flex-wrap gap-1 pt-1">
                            {NAIL_PRESETS.tonosSugeridos.map(tono => (
                                <button
                                    type="button"
                                    key={tono}
                                    onClick={() => updateNailField('tono_favorito', tono)}
                                    className="text-[10px] font-medium py-1 px-2 rounded-lg bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 hover:bg-pink-100 transition-colors"
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
                <div className="bg-gray-50/80 dark:bg-zinc-900/60 rounded-2xl p-4 border border-gray-200/60 dark:border-zinc-800/80 space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-200/60 dark:border-zinc-800 pb-2">
                        <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                            🪞 Parámetros de Cejas
                        </span>
                        <span className="text-[10px] text-gray-400">Laminado & Micropigmentación</span>
                    </div>

                    <ChipField
                        label="Servicio / Tratamiento"
                        presets={BROW_PRESETS.servicios}
                        value={data.brows?.servicio}
                        onChange={(v) => updateBrowsField('servicio', v)}
                    />

                    <ChipField
                        label="Tono de Pigmento / Henna"
                        presets={BROW_PRESETS.tonos}
                        value={data.brows?.tono_pigmento}
                        onChange={(v) => updateBrowsField('tono_pigmento', v)}
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
