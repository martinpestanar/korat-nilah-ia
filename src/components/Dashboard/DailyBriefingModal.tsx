import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Target, TrendingDown, TrendingUp, Zap, CheckCircle2 } from 'lucide-react';
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
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/60 dark:bg-black/80 sm:items-center sm:p-6 animate-fade-in">
      <div className="w-full max-w-xl overflow-hidden rounded-t-3xl sm:rounded-3xl border border-gray-100 dark:border-white/10 bg-white dark:bg-[#0B0B12] text-gray-900 dark:text-white shadow-2xl animate-slide-up sm:animate-scale-in will-change-transform" style={{ transform: 'translateZ(0)' }}>
        <div className="relative border-b border-violet-100 dark:border-white/10 bg-gradient-to-br from-violet-600/90 via-fuchsia-600/80 to-indigo-700/90 px-5 pb-5 pt-6 text-white overflow-hidden">
          <button
            onClick={closeAndPersist}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors z-10"
          >
            <X size={16} />
          </button>
          <p className="text-xs uppercase tracking-wide font-semibold text-white/80 drop-shadow-sm">Resumen Ejecutivo</p>
          <h2 className="mt-1 text-2xl font-black drop-shadow-sm">{greeting}, {data.ownerName}</h2>
          <p className="text-sm font-medium text-white/90 drop-shadow-sm">{data.weekLabel} · Racha activa: {streakDays} día(s)</p>

          <div className="mt-5 flex gap-1.5 relative z-10">
            {Array.from({ length: totalSlides }).map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${idx === slide ? 'w-8 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]' : idx < slide ? 'w-4 bg-white/60' : 'w-4 bg-white/20'}`}
              />
            ))}
          </div>
        </div>

        <div className="min-h-[360px] px-5 py-6 overflow-y-auto" style={{ maxHeight: '60vh' }}>
          {slide === 0 && (
            <div className="space-y-4 animate-from-right">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Resultados vs Meta</h3>
              <div className="rounded-2xl border border-emerald-100 dark:border-emerald-300/20 bg-emerald-50 dark:bg-emerald-500/10 p-6 shadow-sm relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-200 mb-1 relative z-10">Ingresos de la semana</p>
                <p className="mt-1 text-4xl font-black text-emerald-700 dark:text-emerald-400 relative z-10">{formatValue(data.revenue.current)}</p>
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-100 mt-2 relative z-10">Meta: <span className="font-bold">{formatValue(data.revenue.target)}</span></p>
                
                <div className="mt-4 h-2.5 rounded-full bg-emerald-200 dark:bg-white/15 overflow-hidden shadow-inner relative z-10">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 dark:from-emerald-400 dark:to-cyan-300 transition-all duration-1000 ease-out" style={{ width: `${progressPct}%` }} />
                </div>
                <p className="mt-3 text-sm font-bold text-emerald-700 dark:text-emerald-200 relative z-10">Avance: {progressPct}%</p>
              </div>
            </div>
          )}

          {slide === 1 && (
            <div className="space-y-5 animate-from-right">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Análisis de la Semana</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-5 shadow-sm transition-transform hover:-translate-y-1">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-300">Retención</p>
                  <p className="mt-2 flex items-center gap-2 text-3xl font-black text-gray-900 dark:text-white">
                    {data.retentionDeltaPct >= 0 ? <TrendingUp className="text-emerald-500 dark:text-emerald-300" size={24} /> : <TrendingDown className="text-rose-500 dark:text-rose-300" size={24} />}
                    <span className={data.retentionDeltaPct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>{data.retentionDeltaPct}%</span>
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-5 shadow-sm transition-transform hover:-translate-y-1">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-300">Ocupación</p>
                  <p className="mt-2 text-3xl font-black text-violet-600 dark:text-violet-400">{data.occupancyPct}%</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20">
                <p className="text-sm font-medium text-violet-800 dark:text-violet-200 leading-relaxed">La principal palanca de mejora esta semana es recuperar clientas inactivas y elevar ocupación en horas valle.</p>
              </div>
            </div>
          )}

          {slide === 2 && (
            <div className="space-y-5 animate-from-right">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="bg-violet-100 dark:bg-violet-500/20 p-1.5 rounded-lg text-violet-600 dark:text-violet-400"><Zap size={18}/></span>
                La Jugada de la Semana
              </h3>
              <div className="rounded-2xl border border-violet-200 dark:border-violet-300/20 bg-violet-50 dark:bg-violet-500/10 p-6 shadow-sm relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-violet-500/10 dark:bg-violet-500/20 rounded-full blur-2xl pointer-events-none" />
                <p className="text-xs font-bold uppercase tracking-wide text-violet-600 dark:text-violet-300 mb-2 relative z-10">Táctica recomendada</p>
                <p className="mt-1 text-2xl font-black text-gray-900 dark:text-white leading-tight relative z-10">{data.weeklyMove.title}</p>
                <p className="mt-3 text-[15px] font-medium text-gray-700 dark:text-violet-100 leading-relaxed relative z-10">{data.weeklyMove.description}</p>
              </div>

              <button
                onClick={executeWeeklyMove}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 px-4 py-4 text-[15px] font-bold text-white transition-transform hover:scale-[1.02] shadow-[0_4px_14px_0_rgba(139,92,246,0.39)]"
              >
                <Zap size={18} className="fill-current" />
                {data.weeklyMove.actionLabel}
              </button>
            </div>
          )}

          {slide === 3 && (
            <div className="space-y-5 animate-from-right">
              <div className="mb-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
                    <span className="bg-emerald-100 dark:bg-emerald-500/20 p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400"><Target size={18}/></span>
                    Define tu Meta de Citas
                </h3>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Selecciona una meta semanal para que Nilah ajuste recomendaciones y prioridad de acciones.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {GOAL_OPTIONS.map((goal) => (
                  <button
                    key={goal}
                    onClick={() => setSelectedGoal(goal)}
                    className={`rounded-2xl border px-4 py-5 text-left transition-all duration-200 ${
                      selectedGoal === goal
                        ? 'border-violet-500 bg-violet-50 outline outline-2 outline-violet-500/20 dark:border-cyan-400 dark:bg-cyan-400/20 dark:outline-cyan-400/20'
                        : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-violet-300 dark:hover:border-white/20 shadow-sm'
                    }`}
                  >
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${selectedGoal === goal ? 'text-violet-600 dark:text-cyan-200' : 'text-gray-500 dark:text-gray-400'}`}>Meta semanal</p>
                    <p className={`mt-2 flex items-center gap-2 text-3xl font-black ${selectedGoal === goal ? 'text-violet-700 dark:text-cyan-100' : 'text-gray-900 dark:text-white'}`}><Target size={20} className={selectedGoal === goal ? 'text-violet-500 dark:text-cyan-300' : 'text-gray-400 dark:text-white/30'} /> {goal}</p>
                    <p className={`mt-1 text-xs font-semibold ${selectedGoal === goal ? 'text-violet-600 dark:text-cyan-200' : 'text-gray-500 dark:text-gray-400'}`}>citas completadas</p>
                  </button>
                ))}
              </div>

              <button
                onClick={closeAndPersist}
                disabled={selectedGoal === null}
                className="w-full mt-4 rounded-xl bg-gray-900 border border-transparent dark:bg-white dark:text-black px-4 py-4 text-[15px] font-bold text-white transition-all disabled:opacity-50 disabled:bg-gray-200 disabled:text-gray-400 dark:disabled:bg-white/10 dark:disabled:text-white/30 hover:bg-gray-800 dark:hover:bg-gray-200 shadow-md"
              >
                Guardar meta y cerrar Resumen
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 dark:border-white/10 px-5 py-4 bg-gray-50 dark:bg-black/20">
          <button
            onClick={() => setSlide((prev) => Math.max(0, prev - 1))}
            disabled={slide === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-white/20 bg-white dark:bg-transparent px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-white disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors shadow-sm"
          >
            <ChevronLeft size={16} /> Anterior
          </button>
          
          {slide < totalSlides - 1 && (
              <button
                onClick={() => setSlide((prev) => Math.min(totalSlides - 1, prev + 1))}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-white/20 bg-white dark:bg-transparent px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-white disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors shadow-sm"
            >
                Siguiente <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default DailyBriefingModal;
