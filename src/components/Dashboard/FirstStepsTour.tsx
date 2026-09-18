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
      route: '/nilah/app/settings?tab=services',
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
      route: '/nilah/app/clients',
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
      route: '/nilah/app/calendar',
      actionLabel: 'Abrir Agenda',
      isCompleted: hasAppts,
      badgeText: 'Paso 3',
    },
  ];

  // Si está minimizado, mostrar píldora compacta mobile-first
  if (isMinimized) {
    return (
      <div className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-900/90 dark:to-indigo-900/90 rounded-2xl p-3 sm:p-3.5 shadow-lg shadow-violet-500/10 border border-violet-400/30 text-white flex items-center justify-between gap-3 animate-fade-in transition-all">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2.5 text-left flex-1 min-w-0 active:scale-98 transition-transform cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
            <Sparkles size={16} className="text-amber-300 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black truncate">Guía de Inicio Rápido</span>
              <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full font-bold">
                {completedCount}/3
              </span>
            </div>
            <div className="w-28 sm:w-36 h-1.5 bg-black/20 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </button>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setIsMinimized(false)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white/90 transition-all text-xs font-bold flex items-center gap-1"
            title="Expandir guía"
          >
            <Maximize2 size={14} />
            <span className="hidden sm:inline">Continuar</span>
          </button>
          <button
            onClick={onDismiss}
            className="p-2 rounded-xl bg-black/20 hover:bg-black/40 active:scale-95 text-white/70 hover:text-white transition-all"
            title="Cerrar guía"
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
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 dark:from-[#0d1117] dark:via-[#161b22] dark:to-[#0d1117] p-4 sm:p-6 text-white shadow-2xl shadow-indigo-950/30 border border-indigo-500/20 animate-fade-in">
      {/* Botones Superiores: Minimizar y Cerrar */}
      <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 z-10">
        <button
          onClick={() => setIsMinimized(true)}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all active:scale-95"
          title="Minimizar guía"
        >
          <Minimize2 size={15} />
        </button>
        <button
          onClick={onDismiss}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all active:scale-95"
          title="Ocultar guía temporalmente"
        >
          <X size={15} />
        </button>
      </div>

      {/* Header del Tour */}
      <div className="pr-16">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 text-[10px] font-black uppercase tracking-wider text-white shadow-xs">
            🚀 Guía de Activación
          </span>
          <span className="text-xs text-indigo-300 font-bold">
            {completedCount} de 3 completados ({progressPercent}%)
          </span>
        </div>

        <h3 className="text-base sm:text-xl font-black text-white tracking-tight">
          Tu Salón en Marcha: 3 Pasos Indispensables
        </h3>
        <p className="text-xs text-slate-300 font-medium mt-1 leading-relaxed max-w-xl">
          Para que tu agenda funcione como un reloj suizo, sigue este orden natural:
        </p>

        {/* Barra de Progreso */}
        <div className="mt-3 w-full bg-white/10 h-2 rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-gradient-to-r from-violet-400 via-indigo-400 to-emerald-400 rounded-full transition-all duration-700 ease-out"
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
              className={`group relative rounded-2xl transition-all p-3.5 sm:p-4 border ${
                step.isCompleted
                  ? 'bg-white/5 border-white/10 opacity-90'
                  : isTarget
                  ? 'bg-gradient-to-r from-violet-600/30 to-indigo-600/30 border-violet-400/50 shadow-lg shadow-violet-500/10'
                  : 'bg-white/5 border-white/5 opacity-75'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Lado Izquierdo: Icono + Textos */}
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      step.isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : isTarget
                        ? 'bg-violet-500 text-white shadow-md shadow-violet-500/30'
                        : 'bg-white/10 text-slate-400 border border-white/10'
                    }`}
                  >
                    {step.isCompleted ? (
                      <CheckCircle2 size={20} className="text-emerald-400" />
                    ) : (
                      <Icon size={18} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                        {step.badgeText}
                      </span>
                      {isTarget && !step.isCompleted && (
                        <span className="px-2 py-0.2 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[9px] font-extrabold animate-pulse">
                          👉 Haz esto primero
                        </span>
                      )}
                      {step.isCompleted && (
                        <span className="text-[10px] font-bold text-emerald-400">
                          ✓ Completado
                        </span>
                      )}
                    </div>

                    <h4
                      className={`text-sm font-bold tracking-tight mt-0.5 ${
                        step.isCompleted ? 'text-slate-200 line-through' : 'text-white'
                      }`}
                    >
                      {step.title}
                    </h4>
                    <p className="text-[11px] sm:text-xs text-slate-300 font-normal leading-relaxed mt-0.5">
                      {step.subtitle}
                    </p>
                  </div>
                </div>

                {/* Lado Derecho: Botón de Acción Táctil (Mobile-First CTA) */}
                <div className="pt-1 sm:pt-0 shrink-0">
                  <button
                    onClick={() => navigate(step.route)}
                    className={`w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer ${
                      step.isCompleted
                        ? 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10'
                        : isTarget
                        ? 'bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25'
                        : 'bg-white/10 hover:bg-white/20 text-white'
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
