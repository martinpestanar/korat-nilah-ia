import React from 'react';
import {
   Bot, CalendarCheck2, ShieldAlert, Sparkles, TrendingUp, Users, Lock,
   ArrowRight, MessageCircle, BarChart3
} from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency';
import { useAuth } from '../../context/AuthContext';
import {
   PLAN_FEATURES, PLAN_DISPLAY_NAMES, PLAN_NEXT,
   normalizeToPlanBase, PlanFeatureSet
} from '../../constants/planFeatures';

// ─── Types ──────────────────────────────────────────────────────────────────

interface NilahImpactCenterProps {
   metrics: {
      broadcast: { totalCampañas: number; ingresos: number; mensajesEnviados: number };
      rescate:   { clientesSalvados: number; ingresosRetenidos: number };
      guardian:  { recordatoriosEnviados: number; tasaAsistencia: number };
      chatbot:   { citasCerradas: number; ingresosAutonomos: number };
   };
}

// ─── Upgrade Overlay ─────────────────────────────────────────────────────────

interface UpgradeOverlayProps {
   requiredPlan: string;
   featureTitle: string;
   featureBenefit: string;
}

const UpgradeOverlay: React.FC<UpgradeOverlayProps> = ({ requiredPlan, featureTitle, featureBenefit }) => {
   const waUrl = `https://wa.me/51999999999?text=${encodeURIComponent(
      `Hola! Quiero actualizar al plan ${requiredPlan} para activar ${featureTitle}`
   )}`;

   return (
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-5 text-center
                      bg-white/70 dark:bg-dark-card/70 backdrop-blur-[3px] rounded-2xl">
         <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 
                         dark:from-violet-900/50 dark:to-indigo-900/50
                         flex items-center justify-center mb-3 shadow-lg shadow-violet-500/10">
            <Lock className="text-violet-600 dark:text-violet-400" size={22} />
         </div>
         <p className="text-xs font-bold uppercase tracking-wider text-violet-500 mb-1">
            Requiere {requiredPlan}
         </p>
         <p className="font-bold text-gray-900 dark:text-white text-base leading-snug mb-1">
            {featureTitle}
         </p>
         <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[200px] leading-relaxed mb-4">
            {featureBenefit}
         </p>
         <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white
                       bg-gradient-to-r from-violet-600 to-indigo-600
                       shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40
                       hover:scale-105 transition-all"
         >
            <MessageCircle size={14} />
            Activar {requiredPlan}
            <ArrowRight size={12} />
         </a>
      </div>
   );
};

// ─── Locked Pillar Wrapper ────────────────────────────────────────────────────

interface PillarProps {
   isLocked: boolean;
   requiredPlan?: string;
   featureTitle?: string;
   featureBenefit?: string;
   children: React.ReactNode;
}

const Pillar: React.FC<PillarProps> = ({
   isLocked, requiredPlan = '', featureTitle = '', featureBenefit = '', children
}) => (
   <div className={`relative rounded-2xl border p-6 shadow-sm transition-all duration-300 overflow-hidden group
                    ${isLocked
      ? 'border-gray-200 dark:border-dark-border bg-gray-50/60 dark:bg-dark-bg/50'
      : 'border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card hover:shadow-lg'
   }`}>
      {isLocked && (
         <UpgradeOverlay
            requiredPlan={requiredPlan}
            featureTitle={featureTitle}
            featureBenefit={featureBenefit}
         />
      )}
      <div className={isLocked ? 'opacity-40 pointer-events-none select-none' : ''}>
         {children}
      </div>
   </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const NilahImpactCenter: React.FC<NilahImpactCenterProps> = ({ metrics }) => {
   const { formatValue } = useCurrency();
   const { recursosSaaS } = useAuth();

   const planBase = normalizeToPlanBase(recursosSaaS.plan_base);
   const features: PlanFeatureSet = PLAN_FEATURES[planBase];
   const nextPlan = PLAN_NEXT[planBase];
   const currentPlanName = PLAN_DISPLAY_NAMES[planBase];

   // Solo sumar pilares activos al impacto total
   const totalImpacto =
      (features.marketing ? metrics.broadcast.ingresos : 0) +
      (features.rescate   ? metrics.rescate.ingresosRetenidos : 0) +
      (features.retoques  ? metrics.chatbot.ingresosAutonomos : 0);

   return (
      <div className="space-y-6 animate-in fade-in duration-300">

         {/* ── Hero Banner ─────────────────────────────────────────────── */}
         <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 p-8 shadow-2xl">
            {/* Decorative bot watermark */}
            <div className="absolute top-0 right-0 p-12 opacity-[0.06] pointer-events-none select-none">
               <Bot size={200} />
            </div>

            {/* Plan badge */}
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full
                            bg-white/10 backdrop-blur-md text-xs font-bold text-indigo-200 border border-white/10">
               Plan: {currentPlanName}
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-white">
               <div>
                  <div className="flex items-center gap-3 mb-2">
                     <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                        <Sparkles className="text-purple-300" size={22} />
                     </div>
                     <h2 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent
                                    bg-gradient-to-r from-purple-200 to-indigo-200">
                        Retorno de Inteligencia (ROAI)
                     </h2>
                  </div>
                  <p className="text-indigo-200/80 max-w-md text-sm">
                     Valor económico total generado y protegido por tu sistema Nilah este mes,
                     operando en piloto automático.
                  </p>

                  {nextPlan && (
                     <a
                        href={`https://wa.me/51999999999?text=${encodeURIComponent(`Hola! Quiero conocer el plan ${nextPlan.displayName}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-2 text-xs font-bold
                                   text-violet-200 hover:text-white transition-colors
                                   border border-white/10 hover:border-white/30
                                   px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10"
                     >
                        <TrendingUp size={12} />
                        Desbloquear más con {nextPlan.displayName}
                        <ArrowRight size={11} />
                     </a>
                  )}
               </div>

               <div className="text-right shrink-0">
                  <p className="text-xs text-indigo-300 font-medium uppercase tracking-wider mb-1">
                     Impacto Total del Mes
                  </p>
                  <p className="text-5xl md:text-6xl font-black text-white tracking-tight">
                     {formatValue(totalImpacto)}
                  </p>
                  <p className="text-xs text-indigo-400 mt-1">calculado con datos reales</p>
               </div>
            </div>
         </div>

         {/* ── 4 Pilares ───────────────────────────────────────────────── */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* ── Pilar 1: Mantenimientos y Retoques ───────────────────── */}
            <Pillar
               isLocked={!features.retoques}
               requiredPlan={nextPlan?.displayName || 'Glow Pro'}
               featureTitle="Recordatorios de Retoque"
               featureBenefit="Nilah detecta automáticamente cuándo toca el mantenimiento de cada cliente y agenda sola."
            >
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10
                               group-hover:scale-150 transition-transform" />
               <div className="flex items-start justify-between mb-4 relative z-10">
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600
                                     flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                        <CalendarCheck2 size={22} />
                     </div>
                     <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-base">Mantenimientos y Retoques</h3>
                        <p className="text-xs text-gray-500">Agendamiento automático IA</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {formatValue(metrics.chatbot.ingresosAutonomos)}
                     </p>
                     <p className="text-xs text-gray-400">Ingreso Asegurado</p>
                  </div>
               </div>
               <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-3 border border-emerald-100 dark:border-emerald-800/30">
                  <p className="text-sm text-emerald-800 dark:text-emerald-300">
                     Nilah agendó{' '}
                     <strong>{metrics.chatbot.citasCerradas} citas</strong> de clientes
                     que debían realizarse sus mantenimientos y retoques.
                  </p>
               </div>
            </Pillar>

            {/* ── Pilar 2: Anti-Fugas y Rescate ────────────────────────── */}
            <Pillar
               isLocked={!features.rescate}
               requiredPlan={nextPlan?.displayName || 'Glow Pro'}
               featureTitle="Sistema Anti-Fugas (35/60/90 días)"
               featureBenefit="Si tus clientas tienen 200 contactos y rescatas al 10%, son 20 citas nuevas cada mes."
            >
               <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10
                               group-hover:scale-150 transition-transform" />
               <div className="flex items-start justify-between mb-4 relative z-10">
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500
                                     flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                        <Users size={22} />
                     </div>
                     <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-base">Anti-Fugas y Rescate</h3>
                        <p className="text-xs text-gray-500">3 impactos: 35, 60 y 90 días</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                        {formatValue(metrics.rescate.ingresosRetenidos)}
                     </p>
                     <p className="text-xs text-gray-400">Dinero Recuperado</p>
                  </div>
               </div>
               <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-3 border border-amber-100 dark:border-amber-800/30">
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                     Recuperaste{' '}
                     <strong>{metrics.rescate.clientesSalvados} clientes</strong>{' '}
                     gracias al sistema de 3 impactos automáticos de seguimiento.
                  </p>
               </div>
            </Pillar>

            {/* ── Pilar 3: Guardiana de Agenda — SIEMPRE ACTIVO ─────────── */}
            <Pillar isLocked={false}>
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10
                               group-hover:scale-150 transition-transform" />
               <div className="flex items-start justify-between mb-4 relative z-10">
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600
                                     flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                        <ShieldAlert size={22} />
                     </div>
                     <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-base">Guardiana de Agenda</h3>
                        <p className="text-xs text-gray-500">Prevención de No-Shows</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <div className="flex items-baseline justify-end gap-1">
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                           {metrics.guardian.tasaAsistencia}%
                        </p>
                        <TrendingUp size={14} className="text-blue-500" />
                     </div>
                     <p className="text-xs text-gray-400">Asistencia Efectiva</p>
                  </div>
               </div>
               <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-3 border border-blue-100 dark:border-blue-800/30">
                  <div className="flex items-center justify-between gap-2">
                     <p className="text-sm text-blue-800 dark:text-blue-300">
                        <strong>{metrics.guardian.recordatoriosEnviados}</strong> recordatorios enviados
                        con 24h y 3h de anticipación.
                     </p>
                     <span className="shrink-0 px-2 py-0.5 bg-blue-200 dark:bg-blue-800/50
                                      text-blue-800 dark:text-blue-200 text-xs font-bold rounded-md">
                        Activo ✓
                     </span>
                  </div>
               </div>
            </Pillar>

            {/* ── Pilar 4: Campañas Semanales ──────────────────────────── */}
            <Pillar
               isLocked={!features.marketing}
               requiredPlan={nextPlan?.displayName || 'Glow Pro'}
               featureTitle="Campañas Semanales WhatsApp"
               featureBenefit="4 campañas reactivas al mes. Genera citas directamente desde WhatsApp con IA."
            >
               <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10
                               group-hover:scale-150 transition-transform" />
               <div className="flex items-start justify-between mb-4 relative z-10">
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-indigo-500
                                     flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                        <BarChart3 size={22} />
                     </div>
                     <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-base">Campañas Semanales</h3>
                        <p className="text-xs text-gray-500">Marketing Inteligente por WhatsApp</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {formatValue(metrics.broadcast.ingresos)}
                     </p>
                     <p className="text-xs text-gray-400">Venta Directa</p>
                  </div>
               </div>
               <div className="bg-purple-50 dark:bg-purple-900/10 rounded-xl p-3 border border-purple-100 dark:border-purple-800/30">
                  <p className="text-sm text-purple-800 dark:text-purple-300">
                     <strong>{metrics.broadcast.totalCampañas} campañas</strong> ejecutadas con{' '}
                     {metrics.broadcast.mensajesEnviados} envíos directos a clientas.
                  </p>
               </div>
            </Pillar>

         </div>

         {/* ── Upgrade Banner (solo si no es copilot) ────────────────────── */}
         {nextPlan && (
            <div className="rounded-2xl border border-violet-100 dark:border-violet-800/30
                            bg-gradient-to-r from-violet-50 to-indigo-50
                            dark:from-violet-900/10 dark:to-indigo-900/10 p-6">
               <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600
                                  flex items-center justify-center text-white shadow-lg shadow-violet-500/20 shrink-0">
                     <Sparkles size={20} />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                     <p className="font-bold text-gray-900 dark:text-white">
                        Estás en plan <span className="text-violet-600 dark:text-violet-400">{currentPlanName}</span>
                     </p>
                     <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                        Actualiza a <strong>{nextPlan.displayName}</strong> para desbloquear Rescate Automático,
                        Campañas Semanales y más — todo en piloto automático.
                     </p>
                  </div>
                  <a
                     href={`https://wa.me/51999999999?text=${encodeURIComponent(`Hola! Quiero actualizar al plan ${nextPlan.displayName}`)}`}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white
                                bg-gradient-to-r from-violet-600 to-indigo-600
                                shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40
                                hover:scale-105 transition-all whitespace-nowrap"
                  >
                     <MessageCircle size={16} />
                     Quiero {nextPlan.displayName}
                  </a>
               </div>
            </div>
         )}

      </div>
   );
};

export default NilahImpactCenter;
