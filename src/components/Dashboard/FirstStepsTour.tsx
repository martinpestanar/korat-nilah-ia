import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scissors,
  Users,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  X,
  ArrowRight,
  Minimize2,
  Maximize2,
  Trophy
} from 'lucide-react';

interface FirstStepsTourProps {
  servicesCount: number;
  clientsCount: number;
  appointmentsCount: number;
  onDismiss: () => void;
}

export const FirstStepsTour: React.FC<FirstStepsTourProps> = ({
  servicesCount,
  clientsCount,
  appointmentsCount,
  onDismiss,
}) => {
  const navigate = useNavigate();
  const [isMinimized, setIsMinimized] = useState(false);

  const hasServices = servicesCount > 0;
  const hasClients = clientsCount > 0;
  const hasAppts = appointmentsCount > 0;

  // Cálculo de progreso
  const completedCount = (hasServices ? 1 : 0) + (hasClients ? 1 : 0) + (hasAppts ? 1 : 0);
  const progressPercent = Math.round((completedCount / 3) * 100);
  const allCompleted = completedCount === 3;

  // Determinar paso activo sugerido
  const currentStep = !hasServices ? 1 : !hasClients ? 2 : !hasAppts ? 3 : 4;

  const steps = [
    {
      id: 1,
      title: 'Define tus Servicios y Precios',
      subtitle: hasServices
        ? `${servicesCount} ${servicesCount === 1 ? 'servicio configurado' : 'servicios configurados'}`
        : 'Indispensable para que tu agenda sepa qué cobrar y cuánto dura cada cita.',
      icon: Scissors,
      route: '/nilah/app/settings?tab=services&from=tour',
      actionLabel: 'Cargar Servicios',
      isCompleted: hasServices,
      badgeText: 'Paso 1',
    },
    {
      id: 2,
      title: 'Registra tu Primera Clienta',
      subtitle: hasClients
        ? `${clientsCount} ${clientsCount === 1 ? 'clienta registrada' : 'clientas registradas'}`
        : 'Crea su ficha con nombre y WhatsApp para enviarle recordatorios automáticos.',
      icon: Users,
      route: '/nilah/app/clients?from=tour',
      actionLabel: 'Agregar Clienta',
      isCompleted: hasClients,
      badgeText: 'Paso 2',
    },
    {
      id: 3,
      title: 'Agenda tu Primera Cita',
      subtitle: hasAppts
        ? `${appointmentsCount} ${appointmentsCount === 1 ? 'cita en agenda' : 'citas en agenda'}`
        : 'Selecciona una hora en tu calendario, elige el servicio y confirma la cita.',
      icon: Calendar,
      route: '/nilah/app/calendar?from=tour',
      actionLabel: 'Abrir Agenda',
      isCompleted: hasAppts,
      badgeText: 'Paso 3',
    },
  ];

  // Si está minimizado, mostrar píldora compacta mobile-first
  if (isMinimized) {
    return (
      <div className="w-full bg-[var(--bg-surface)] rounded-2xl p-3 sm:p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-[var(--border-subtle)] text-[var(--text-primary)] flex items-center justify-between gap-3 animate-fade-in transition-all">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2.5 text-left flex-1 min-w-0 active:scale-98 transition-transform cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-500/15 border border-violet-200/70 dark:border-violet-500/30 flex items-center justify-center shrink-0">
            <Sparkles size={16} className="text-[var(--color-brand)]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold truncate text-[var(--text-primary)]">Guía de Inicio Rápido</span>
              <span className="text-[10px] bg-violet-50 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 px-1.5 py-0.5 rounded-full font-semibold tabular-nums">
                {completedCount}/3
              </span>
            </div>
            <div className="w-28 sm:w-36 h-1.5 bg-[var(--bg-subtle)] rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </button>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setIsMinimized(false)}
            className="p-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 text-[var(--text-primary)] transition-all text-xs font-medium flex items-center gap-1 cursor-pointer"
            title="Expandir guía"
            aria-label="Expandir guía"
          >
            <Maximize2 size={14} />
            <span className="hidden sm:inline">Continuar</span>
          </button>
          <button
            onClick={onDismiss}
            className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
            title="Cerrar guía"
            aria-label="Cerrar guía"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  // Si ya completó los 3 pasos, mostrar tarjeta de éxito/celebración
  if (allCompleted) {
    return (
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-5 sm:p-6 text-white shadow-xl shadow-emerald-500/15 border border-white/25 animate-fade-in">
        <button
          onClick={onDismiss}
          className="absolute top-3.5 right-3.5 p-2 rounded-full bg-black/20 hover:bg-black/30 text-white/80 transition-colors"
          title="Ocultar felicitación"
        >
          <X size={16} />
        </button>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner">
            <Trophy size={28} className="text-amber-300" />
          </div>
          <div className="flex-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider mb-1.5">
              🎉 ¡Salón 100% Operativo!
            </span>
            <h3 className="text-lg font-black text-white leading-snug">
              ¡Felicidades! Ya configuraste tu salón con éxito
            </h3>
            <p className="text-xs text-emerald-100 font-medium mt-1 leading-relaxed max-w-lg">
              Tienes tus servicios, clientas y agenda listos. Ahora puedes seguir agendando citas diarias.
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white text-emerald-900 font-extrabold text-xs shadow-lg hover:bg-emerald-50 active:scale-95 transition-all text-center"
          >
            Entendido, cerrar guía
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[var(--bg-surface)] p-4 sm:p-6 text-[var(--text-primary)] shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-[var(--border-subtle)] animate-fade-in">
      {/* Botones Superiores: Minimizar y Cerrar */}
      <div className="absolute top-3.5 right-3.5 flex items-center gap-1 z-10">
        <button
          onClick={() => setIsMinimized(true)}
          className="p-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all active:scale-95 cursor-pointer"
          title="Minimizar guía"
          aria-label="Minimizar guía"
        >
          <Minimize2 size={15} />
        </button>
        <button
          onClick={onDismiss}
          className="p-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all active:scale-95 cursor-pointer"
          title="Ocultar guía temporalmente"
          aria-label="Ocultar guía"
        >
          <X size={15} />
        </button>
      </div>

      {/* Header del Tour */}
      <div className="pr-20">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-50 dark:bg-violet-500/15 border border-violet-200/80 dark:border-violet-500/30 text-[11px] font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300">
            <Sparkles size={11} />
            Guía de Activación
          </span>
          <span className="text-xs text-[var(--text-muted)] font-medium tabular-nums">
            {completedCount} de 3 completados ({progressPercent}%)
          </span>
        </div>

        <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] tracking-[-0.02em]">
          Tu Salón en Marcha: 3 Pasos Indispensables
        </h3>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-normal mt-1 leading-relaxed max-w-xl">
          Para que tu agenda funcione como un reloj suizo, sigue este orden natural:
        </p>

        {/* Barra de Progreso */}
        <div className="mt-3 w-full bg-[var(--bg-subtle)] h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${Math.max(progressPercent, 5)}%` }}
          />
        </div>
      </div>

      {/* Lista de los 3 Pasos (Mobile-First Tap Targets) */}
      <div className="mt-4 sm:mt-5 space-y-2.5">
        {steps.map((step) => {
          const Icon = step.icon;
          const isTarget = currentStep === step.id;

          return (
            <div
              key={step.id}
              className={`group relative rounded-xl transition-all p-3.5 sm:p-4 border ${
                step.isCompleted
                  ? 'bg-[var(--bg-subtle)]/50 border-[var(--border-subtle)] opacity-90'
                  : isTarget
                  ? 'bg-violet-50/70 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/30 shadow-2xs'
                  : 'bg-[var(--bg-subtle)]/40 border-[var(--border-subtle)]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Lado Izquierdo: Icono + Textos */}
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      step.isCompleted
                        ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                        : isTarget
                        ? 'bg-[var(--color-brand)] text-white shadow-xs'
                        : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-subtle)]'
                    }`}
                  >
                    {step.isCompleted ? (
                      <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Icon size={18} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300">
                        {step.badgeText}
                      </span>
                      {isTarget && !step.isCompleted && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 text-[10px] font-semibold">
                          Haz esto primero
                        </span>
                      )}
                      {step.isCompleted && (
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          ✓ Completado
                        </span>
                      )}
                    </div>

                    <h4
                      className={`text-sm font-semibold tracking-tight mt-0.5 ${
                        step.isCompleted ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-primary)]'
                      }`}
                    >
                      {step.title}
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)] font-normal leading-relaxed mt-0.5">
                      {step.subtitle}
                    </p>
                  </div>
                </div>

                {/* Lado Derecho: Botón de Acción Táctil (Mobile-First CTA) */}
                <div className="pt-1 sm:pt-0 shrink-0">
                  <button
                    onClick={() => navigate(step.route)}
                    className={`w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer ${
                      step.isCompleted
                        ? 'bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                        : isTarget
                        ? 'bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500 hover:from-violet-700 hover:via-purple-700 hover:to-pink-600 text-white shadow-sm'
                        : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)]'
                    }`}
                  >
                    <span>{step.isCompleted ? 'Revisar' : step.actionLabel}</span>
                    <ArrowRight size={14} className="shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
