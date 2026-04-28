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
    colorClass: 'cyan',
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
  cyan:    { ring: 'ring-cyan-500/40',    bg: 'bg-cyan-500',    text: 'text-cyan-400',    subtle: 'bg-cyan-500/10'    },
  violet:  { ring: 'ring-violet-500/40',  bg: 'bg-violet-500',  text: 'text-violet-400',  subtle: 'bg-violet-500/10'  },
  amber:   { ring: 'ring-amber-500/40',   bg: 'bg-amber-500',   text: 'text-amber-400',   subtle: 'bg-amber-500/10'   },
  emerald: { ring: 'ring-emerald-500/40', bg: 'bg-emerald-500', text: 'text-emerald-400', subtle: 'bg-emerald-500/10' },
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
  flujoKey, schedule, onChange, colorClass, label, emoji, description,
  saving, saved, onSave,
}) => {
  const [open, setOpen] = useState(false);
  const [horaInput, setHoraInput] = useState('');
  const c = COLOR[colorClass];

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
    <div className={`rounded-xl border transition-all duration-200 overflow-hidden
      ${open ? `border-zinc-600 ${c.ring} ring-1` : 'border-zinc-800 hover:border-zinc-700'}`}>
      {/* Header */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left group"
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-xl w-7 text-center">{emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-white">{label}</p>
            {/* Badge activo/inactivo */}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium
              ${schedule.activo
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-zinc-700 text-zinc-500'}`}>
              {schedule.activo ? 'Activo' : 'Pausado'}
            </span>
          </div>
          <p className="text-xs text-zinc-500 truncate">{description}</p>
          {!open && (
            <p className={`text-xs mt-0.5 ${c.text} truncate`}>
              {diasLabel} · {schedule.horas.length} hora{schedule.horas.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {/* Toggle activo */}
        <button
          onClick={e => { e.stopPropagation(); onChange({ ...schedule, activo: !schedule.activo }); }}
          className={`p-1.5 rounded-lg transition-colors ${schedule.activo
            ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
            : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'}`}
          title={schedule.activo ? 'Pausar flujo' : 'Activar flujo'}
        >
          <Power className="w-3.5 h-3.5" />
        </button>
        {open ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
      </button>

      {/* Editor expandido */}
      {open && (
        <div className="px-4 pb-4 border-t border-zinc-800 pt-4 space-y-5">

          {/* Selector de días */}
          <div>
            <p className="text-xs font-semibold text-zinc-400 mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Días de ejecución
            </p>
            <div className="flex gap-1.5">
              {DIAS_SEMANA.map(d => {
                const active = schedule.dias.includes(d.value);
                return (
                  <button
                    key={d.value}
                    onClick={() => toggleDia(d.value)}
                    className={`flex-1 h-9 rounded-lg text-xs font-bold transition-all ${
                      active
                        ? `${c.bg} text-white shadow-lg`
                        : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => onChange({ ...schedule, dias: [1,2,3,4,5] })}
                className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Lun–Vie
              </button>
              <span className="text-zinc-700">·</span>
              <button
                onClick={() => onChange({ ...schedule, dias: [1,2,3,4,5,6] })}
                className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Lun–Sáb
              </button>
              <span className="text-zinc-700">·</span>
              <button
                onClick={() => onChange({ ...schedule, dias: [0,1,2,3,4,5,6] })}
                className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Todos
              </button>
            </div>
          </div>

          {/* Selector de horas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Horas de ejecución
                <span className="text-zinc-600">({schedule.horas.length} seleccionadas)</span>
              </p>
              {schedule.horas.length > 0 && (
                <button onClick={clearHoras} className="text-[11px] text-zinc-600 hover:text-red-400 transition-colors">
                  Limpiar
                </button>
              )}
            </div>

            {/* Atajos por franja */}
            <div className="flex gap-1.5 mb-2">
              {HORAS_RAPIDAS.map(r => (
                <button
                  key={r.label}
                  onClick={() => addRangoRapido(r.horas)}
                  className="flex-1 py-1.5 rounded-lg text-[11px] text-zinc-400 bg-zinc-800 hover:bg-zinc-700 hover:text-zinc-200 transition-colors font-medium"
                >
                  + {r.label}
                </button>
              ))}
            </div>

            {/* Chips de horas seleccionadas */}
            {schedule.horas.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2 p-2 bg-zinc-900 rounded-lg border border-zinc-800 min-h-[36px]">
                {schedule.horas.map(h => (
                  <span
                    key={h}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono font-medium
                      ${c.subtle} ${c.text} border border-transparent`}
                  >
                    {h}
                    <button onClick={() => removeHora(h)} className="hover:text-white transition-colors ml-0.5">
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
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-200
                  focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
                placeholder="Añadir hora..."
              />
              <button
                onClick={() => addHora(horaInput)}
                disabled={!horaInput}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1
                  ${horaInput
                    ? `${c.subtle} ${c.text} hover:opacity-80`
                    : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}`}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Botón guardar */}
          <button
            onClick={onSave}
            disabled={saving}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold
              transition-all ${saved
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                : `${c.subtle} ${c.text} border border-zinc-700 hover:opacity-80`
              } disabled:opacity-50`}
          >
            {saving
              ? <RefreshCw className="w-4 h-4 animate-spin" />
              : saved
                ? <Check className="w-4 h-4" />
                : <Save className="w-4 h-4" />
            }
            {saved ? '¡Horario guardado!' : 'Guardar horario'}
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
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-zinc-800 flex items-center gap-2">
        <Calendar className="w-4 h-4 text-cyan-400" />
        <p className="text-sm font-semibold text-white">Schedule Manager</p>
        <span className="ml-auto text-[10px] text-zinc-500">
          Zona: America/Lima · Cron cada hora
        </span>
      </div>

      {/* Flujos */}
      <div className="p-3 space-y-2">
        {FLUJOS.map(f => (
          <FlujEditor
            key={f.key}
            flujoKey={f.key}
            label={f.label}
            emoji={f.emoji}
            description={f.description}
            colorClass={f.colorClass as keyof typeof COLOR}
            schedule={schedules[f.key]}
            onChange={s => setSchedules(prev => ({ ...prev, [f.key]: s }))}
            saving={savingKey === f.key}
            saved={savedKey === f.key}
            onSave={() => save(f.key)}
          />
        ))}
      </div>

      {/* Footer info */}
      <div className="px-5 py-3 border-t border-zinc-800">
        <p className="text-[11px] text-zinc-600">
          💡 Los flujos corren cada hora. Si la hora actual coincide con tu configuración, se procesan los clientes.
          El sub-flujo de cooldown protege a cada cliente individualmente.
        </p>
      </div>
    </div>
  );
};

export default AutopilotScheduler;
