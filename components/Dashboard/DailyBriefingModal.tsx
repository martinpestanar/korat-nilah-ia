import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Target, TrendingDown, TrendingUp, Zap, Loader2, CheckCircle2 } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency';
import { executeAction } from '../../services/copilot';
import { useNavigate } from 'react-router-dom';

interface WarRoomData {
  ownerName: string;
  weekLabel: string;
  revenue: {
    current: number;
    target: number;
  };
  retentionDeltaPct: number;
  occupancyPct: number;
  weeklyMove: {
    title: string;
    description: string;
    actionLabel: string;
    actionType: 'SEND_SMS_CAMPAIGN' | 'EXECUTE_RESCUE_PLAN' | 'SEND_REMINDER';
    payload?: Record<string, any>;
  };
}

interface DailyBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  streakDays?: number;
  data?: WarRoomData;
}

const MOCK_WAR_ROOM_DATA: WarRoomData = {
  ownerName: 'Maria',
  weekLabel: 'Semana 10 (Marzo)',
  revenue: {
    current: 4000,
    target: 5000,
  },
  retentionDeltaPct: -5,
  occupancyPct: 68,
  weeklyMove: {
    title: 'Recuperar clientas de tintes',
    description: 'Segmento inactivo detectado en CRM. Una campaña puntual puede cubrir la brecha de ingresos de esta semana.',
    actionLabel: 'Ver Audiencias Inteligentes',
    actionType: 'SEND_SMS_CAMPAIGN',
    payload: {
      segmento: 'clientes_tintes_inactivos',
      mensaje: 'Volviste a estar en promo VIP: 20% OFF en coloración esta semana.',
      speedMode: 'safe',
      canal: 'whatsapp',
    },
  },
};

const GOAL_OPTIONS = [18, 22, 26, 30];

const DailyBriefingModal: React.FC<DailyBriefingModalProps> = ({
  isOpen,
  onClose,
  streakDays = 1,
  data = MOCK_WAR_ROOM_DATA,
}) => {
  const { formatValue } = useCurrency();
  const [slide, setSlide] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState<number | null>(null);
  const [executing, setExecuting] = useState(false);
  const [executionState, setExecutionState] = useState<'idle' | 'success' | 'error'>('idle');
  const navigate = useNavigate();

  const totalSlides = 4;

  useEffect(() => {
    if (isOpen) {
      setSlide(0);
      setSelectedGoal(null);
      setExecuting(false);
      setExecutionState('idle');
    }
  }, [isOpen]);

  const progressPct = Math.min(100, Math.round((data.revenue.current / data.revenue.target) * 100));

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }, []);

  const closeAndPersist = () => {
    localStorage.setItem('nilah_morning_date', new Date().toDateString());
    if (selectedGoal) localStorage.setItem('nilah_weekly_goal_citas', String(selectedGoal));
    onClose();
  };

  const executeWeeklyMove = async () => {
    closeAndPersist();
    navigate('/nilah/app/clients');
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/70 backdrop-blur-md sm:items-center sm:p-6">
      <div className="w-full max-w-xl overflow-hidden rounded-t-3xl border border-white/10 bg-[#0B0B12] text-white shadow-2xl sm:rounded-3xl">
        <div className="relative border-b border-white/10 bg-gradient-to-br from-violet-600/90 via-fuchsia-600/80 to-indigo-700/90 px-5 pb-5 pt-6">
          <button
            onClick={closeAndPersist}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/15 hover:bg-white/25"
          >
            <X size={16} />
          </button>
          <p className="text-xs uppercase tracking-wide text-white/70">Resumen Ejecutivo</p>
          <h2 className="mt-1 text-2xl font-black">{greeting}, {data.ownerName}</h2>
          <p className="text-sm text-white/80">{data.weekLabel} · Racha activa: {streakDays} día(s)</p>

          <div className="mt-4 flex gap-1.5">
            {Array.from({ length: totalSlides }).map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all ${idx === slide ? 'w-8 bg-white' : 'w-4 bg-white/30'}`}
              />
            ))}
          </div>
        </div>

        <div className="min-h-[360px] px-5 py-5">
          {slide === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Resultados vs Meta</h3>
              <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-4">
                <p className="text-xs text-emerald-200">Ingresos de la semana</p>
                <p className="mt-1 text-3xl font-black">{formatValue(data.revenue.current)}</p>
                <p className="text-sm text-emerald-100">Meta: {formatValue(data.revenue.target)}</p>
                <div className="mt-3 h-2 rounded-full bg-white/15">
                  <div className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300" style={{ width: `${progressPct}%` }} />
                </div>
                <p className="mt-2 text-xs text-emerald-100">Avance: {progressPct}%</p>
              </div>
            </div>
          )}

          {slide === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Análisis de la Semana</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-gray-300">Retención</p>
                  <p className="mt-1 flex items-center gap-2 text-2xl font-black">
                    {data.retentionDeltaPct >= 0 ? <TrendingUp className="text-emerald-300" size={18} /> : <TrendingDown className="text-rose-300" size={18} />}
                    {data.retentionDeltaPct}%
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-gray-300">Ocupación</p>
                  <p className="mt-1 text-2xl font-black">{data.occupancyPct}%</p>
                </div>
              </div>
              <p className="text-sm text-gray-200">La principal palanca de mejora esta semana es recuperar clientas inactivas y elevar ocupación en horas valle.</p>
            </div>
          )}

          {slide === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold">La Jugada de la Semana</h3>
              <div className="rounded-2xl border border-violet-300/20 bg-violet-500/10 p-4">
                <p className="text-xs uppercase tracking-wide text-violet-200">Táctica recomendada</p>
                <p className="mt-1 text-xl font-black">{data.weeklyMove.title}</p>
                <p className="mt-2 text-sm text-violet-100">{data.weeklyMove.description}</p>
              </div>

              <button
                onClick={executeWeeklyMove}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                <Zap size={16} />
                {data.weeklyMove.actionLabel}
              </button>
            </div>
          )}

          {slide === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Define tu Meta de Citas</h3>
              <p className="text-sm text-gray-200">Selecciona una meta semanal para que Nilah ajuste recomendaciones y prioridad de acciones.</p>

              <div className="grid grid-cols-2 gap-3">
                {GOAL_OPTIONS.map((goal) => (
                  <button
                    key={goal}
                    onClick={() => setSelectedGoal(goal)}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      selectedGoal === goal
                        ? 'border-cyan-300 bg-cyan-400/20 text-cyan-100'
                        : 'border-white/10 bg-white/5 text-gray-100'
                    }`}
                  >
                    <p className="text-xs uppercase tracking-wide opacity-80">Meta semanal</p>
                    <p className="mt-1 flex items-center gap-2 text-2xl font-black"><Target size={18} /> {goal}</p>
                    <p className="text-xs opacity-80">citas completadas</p>
                  </button>
                ))}
              </div>

              <button
                onClick={closeAndPersist}
                disabled={selectedGoal === null}
                className="w-full rounded-xl bg-white px-4 py-3 text-sm font-bold text-black disabled:opacity-40"
              >
                Guardar meta y cerrar Resumen
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/10 px-5 py-4">
          <button
            onClick={() => setSlide((prev) => Math.max(0, prev - 1))}
            disabled={slide === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
          >
            <ChevronLeft size={14} /> Anterior
          </button>
          <button
            onClick={() => setSlide((prev) => Math.min(totalSlides - 1, prev + 1))}
            disabled={slide === totalSlides - 1}
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
          >
            Siguiente <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default DailyBriefingModal;
