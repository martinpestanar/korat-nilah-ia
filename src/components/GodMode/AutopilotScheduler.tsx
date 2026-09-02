import React, { useState } from 'react';
import {
  Calendar, Clock, Save, RefreshCw, ChevronDown, ChevronUp,
  Check, Plus, X, Power,
} from 'lucide-react';
import {
  updateFlujSchedule,
  resolveSchedules,
  type AutopilotConfig,
  type FlujoSchedule,
  type FlujoScheduleKey,
} from '../../services/autopilot';

// ─── Constantes ───────────────────────────────────────────────

const DIAS_SEMANA = [
  { label: 'Do', value: 0 },
  { label: 'Lu', value: 1 },
  { label: 'Ma', value: 2 },
  { label: 'Mi', value: 3 },
  { label: 'Ju', value: 4 },
  { label: 'Vi', value: 5 },
  { label: 'Sá', value: 6 },
];

const HORAS_RAPIDAS = [
  { label: 'Mañana', horas: ['07:00','08:00','09:00','10:00','11:00'] },
  { label: 'Tarde',  horas: ['12:00','13:00','14:00','15:00','16:00','17:00'] },
  { label: 'Noche',  horas: ['18:00','19:00','20:00','21:00','22:00','23:00'] },
];

const FLUJOS: {
  key: FlujoScheduleKey;
  label: string;
  emoji: string;
  description: string;
  colorClass: string;
}[] = [
  {
    key: 'retencion',
    label: 'Retención',
    emoji: '🎯',
    description: 'Clientes inactivos · Reactivar con oferta',
    colorClass: 'emerald',
  },
  {
    key: 'recordatorios',
    label: 'Recordatorios',
    emoji: '⏰',
    description: 'Citas 24h y 3h antes · Crítico',
    colorClass: 'violet',
  },
  {
    key: 'retoque',
    label: 'Retoque',
    emoji: '✂️',
    description: 'Post-servicio · Próxima cita',
    colorClass: 'amber',
  },
  {
    key: 'fidelizacion',
    label: 'Fidelización',
    emoji: '🎖️',
    description: 'Puntos · Feedback post-cita',
    colorClass: 'emerald',
  },
];

// ─── Color helpers ────────────────────────────────────────────

const COLOR = {
  emerald: { ring: 'ring-emerald-500/40', bg: 'bg-emerald-600', text: 'text-emerald-800', subtle: 'bg-emerald-50 border-emerald-200' },
  violet:  { ring: 'ring-violet-500/40',  bg: 'bg-violet-600',  text: 'text-violet-800',  subtle: 'bg-violet-50 border-violet-200'   },
  amber:   { ring: 'ring-amber-500/40',   bg: 'bg-amber-600',   text: 'text-amber-800',   subtle: 'bg-amber-50 border-amber-200'     },
  cyan:    { ring: 'ring-teal-500/40',    bg: 'bg-teal-600',    text: 'text-teal-800',    subtle: 'bg-teal-50 border-teal-200'       },
} as const;

// ─── Sub-componente: editor de un flujo ───────────────────────

interface FlujEditorProps {
  flujoKey: FlujoScheduleKey;
  schedule: FlujoSchedule;
  onChange: (s: FlujoSchedule) => void;
  colorClass: keyof typeof COLOR;
  label: string;
  emoji: string;
  description: string;
  saving: boolean;
  saved: boolean;
  onSave: () => void;
}

const FlujEditor: React.FC<FlujEditorProps> = ({
  schedule, onChange, colorClass, label, emoji, description,
  saving, saved, onSave,
}) => {
  const [open, setOpen] = useState(false);
  const [horaInput, setHoraInput] = useState('');
  const c = COLOR[colorClass] || COLOR.emerald;

  const toggleDia = (d: number) => {
    const dias = schedule.dias.includes(d)
      ? schedule.dias.filter(x => x !== d)
      : [...schedule.dias, d].sort((a, b) => a - b);
    onChange({ ...schedule, dias });
  };

  const addHora = (h: string) => {
    if (!h || schedule.horas.includes(h)) return;
    const horas = [...schedule.horas, h].sort();
    onChange({ ...schedule, horas });
    setHoraInput('');
  };

  const removeHora = (h: string) => {
    onChange({ ...schedule, horas: schedule.horas.filter(x => x !== h) });
  };

  const addRangoRapido = (rangoHoras: string[]) => {
    const nuevas = rangoHoras.filter(h => !schedule.horas.includes(h));
    const horas = [...schedule.horas, ...nuevas].sort();
    onChange({ ...schedule, horas });
  };

  const clearHoras = () => onChange({ ...schedule, horas: [] });

  const diasLabel = schedule.dias.length === 7
    ? 'Todos los días'
    : schedule.dias.length === 0
      ? 'Sin días'
      : schedule.dias.map(d => DIAS_SEMANA[d].label).join(', ');

  return (
    <div className={`rounded-2xl border transition-all duration-200 overflow-hidden bg-white shadow-2xs
      ${open ? `border-emerald-300 ring-1 ring-emerald-400/30` : 'border-slate-200 hover:border-slate-300'}`}>
      {/* Header */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left group cursor-pointer"
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-xl w-8 text-center">{emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xs font-black text-slate-900">{label}</p>
            <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold border ${c.subtle} ${c.text}`}>
              {schedule.horas.length} {schedule.horas.length === 1 ? 'ejecución' : 'ejecuciones'}/día
            </span>
          </div>
          <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">{description}</p>
        </div>
        <div className="text-right flex-shrink-0 mr-2">
          <p className="text-[11px] font-bold text-slate-700">{diasLabel}</p>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
            {schedule.horas.slice(0, 3).join(', ')}{schedule.horas.length > 3 ? ` +${schedule.horas.length - 3}` : ''}
          </p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {/* Body expandido */}
      {open && (
        <div className="p-4 pt-3 border-t border-slate-100 bg-slate-50/50 space-y-4">
          {/* Días de la semana */}
          <div>
            <p className="text-xs font-bold text-slate-800 mb-2">Días de ejecución:</p>
            <div className="flex gap-1.5 flex-wrap">
              {DIAS_SEMANA.map(d => {
                const activo = schedule.dias.includes(d.value);
                return (
                  <button
                    key={d.value}
                    onClick={() => toggleDia(d.value)}
                    className={`w-9 h-9 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      activo
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Horas */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-bold text-slate-800">Horas configuradas ({schedule.horas.length}):</p>
              {schedule.horas.length > 0 && (
                <button onClick={clearHoras} className="text-[11px] text-rose-600 hover:underline font-bold">
                  Limpiar todas
                </button>
              )}
            </div>

            {/* Rangos rápidos */}
            <div className="flex gap-1.5 mb-2.5">
              {HORAS_RAPIDAS.map(r => (
                <button
                  key={r.label}
                  onClick={() => addRangoRapido(r.horas)}
                  className="flex-1 py-1 rounded-xl text-[11px] text-slate-700 bg-white border border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 transition-colors font-bold shadow-2xs cursor-pointer"
                >
                  + {r.label}
                </button>
              ))}
            </div>

            {/* Chips de horas seleccionadas */}
            {schedule.horas.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2.5 p-2 bg-white rounded-xl border border-slate-200 min-h-[36px]">
                {schedule.horas.map(h => (
                  <span
                    key={h}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-mono font-bold border ${c.subtle} ${c.text}`}
                  >
                    {h}
                    <button onClick={() => removeHora(h)} className="hover:text-slate-900 transition-colors ml-0.5">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Input para añadir hora manual */}
            <div className="flex gap-2">
              <input
                type="time"
                value={horaInput}
                onChange={e => setHoraInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addHora(horaInput)}
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 shadow-2xs"
                placeholder="Añadir hora..."
              />
              <button
                onClick={() => addHora(horaInput)}
                disabled={!horaInput}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                  horaInput
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir</span>
              </button>
            </div>
          </div>

          {/* Botón guardar */}
          <button
            onClick={onSave}
            disabled={saving}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer ${
              saved
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
            } disabled:opacity-50`}
          >
            {saving
              ? <RefreshCw className="w-4 h-4 animate-spin" />
              : saved
                ? <Check className="w-4 h-4" />
                : <Save className="w-4 h-4" />
            }
            <span>{saved ? '¡Horario guardado!' : 'Guardar horario'}</span>
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Componente principal ─────────────────────────────────────

interface Props {
  config: AutopilotConfig;
  onSaved: () => void;
}

const AutopilotScheduler: React.FC<Props> = ({ config, onSaved }) => {
  const [schedules, setSchedules] = useState<
    Record<FlujoScheduleKey, FlujoSchedule>
  >(() => resolveSchedules(config));

  const [savingKey, setSavingKey] = useState<FlujoScheduleKey | null>(null);
  const [savedKey,  setSavedKey]  = useState<FlujoScheduleKey | null>(null);

  const save = async (key: FlujoScheduleKey) => {
    setSavingKey(key);
    try {
      await updateFlujSchedule(key, schedules[key], config);
      setSavedKey(key);
      onSaved();
      setTimeout(() => setSavedKey(null), 2500);
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm font-sans text-slate-900">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2">
        <Calendar className="w-4 h-4 text-emerald-600" />
        <p className="text-xs font-black text-slate-900 uppercase tracking-wider">Schedule Manager</p>
        <span className="ml-auto text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
          Zona: America/Lima · Cron activo
        </span>
      </div>

      {/* Flujos */}
      <div className="p-4 space-y-3">
        {FLUJOS.map(f => (
          <FlujEditor
            key={f.key}
            flujoKey={f.key}
            schedule={schedules[f.key]}
            onChange={s => setSchedules(prev => ({ ...prev, [f.key]: s }))}
            colorClass={f.colorClass as any}
            label={f.label}
            emoji={f.emoji}
            description={f.description}
            saving={savingKey === f.key}
            saved={savedKey === f.key}
            onSave={() => save(f.key)}
          />
        ))}
      </div>
    </div>
  );
};

export default AutopilotScheduler;
