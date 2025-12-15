
import React from 'react';
import DashboardStats from '../components/Dashboard/DashboardStats';
import FinancialFlowChart from '../components/Dashboard/FinancialFlowChart';
import StatusChart from '../components/Dashboard/StatusChart';
import OracleCard from '../components/Dashboard/OracleCard';
import ProfitHeatmap from '../components/Dashboard/ProfitHeatmap';
import ServicePopularityChart from '../components/Dashboard/ServicePopularityChart';
import WeeklyVolumeChart from '../components/Dashboard/WeeklyVolumeChart';
import RetentionChart from '../components/Dashboard/RetentionChart';
import RevenueChart from '../components/Dashboard/RevenueChart';
import ReputationCard from '../components/Dashboard/ReputationCard';
import { useAuth } from '../context/AuthContext';
import { Lock } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { isAdmin, user, isPro } = useAuth();

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
           <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard {isAdmin ? 'General' : 'Operativo'}</h1>
           <p className="text-sm text-gray-500 dark:text-gray-400">
              Bienvenido a Korat Flow, <span className="font-semibold text-primary">{user?.name}</span>.
           </p>
        </div>
      </div>

      {/* 1. KPIs Generales (Siempre visibles, CRM Puro) */}
      <DashboardStats />
      
      {/* 2. AI Forecasting (PRO ONLY) */}
      {isAdmin && isPro && <OracleCard />}

      {/* --- DASHBOARD LAYOUT --- */}
      
      {/* ROW 1: FINANZAS Y VOLUMEN */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-card dark:shadow-none">
              {/* STARTER ve RevenueChart (Historico Simple), PRO ve FinancialFlowChart (Proyecciones IA) */}
              {isPro ? <FinancialFlowChart /> : <RevenueChart />}
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-card dark:shadow-none">
              <WeeklyVolumeChart />
          </div>
      </div>

      {/* ROW 2: OPERATIVA Y RETENCIÓN */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-card dark:shadow-none">
              <StatusChart />
          </div>
          
          {/* REPUTATION MODULE (Pro Only) - Swaps with ServicePopularity if Pro */}
          {isPro ? (
              <div className="rounded-xl border border-gray-100 bg-white shadow-sm dark:border-dark-border dark:bg-dark-card dark:shadow-none">
                  <ReputationCard />
              </div>
          ) : (
              <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-card dark:shadow-none">
                  <ServicePopularityChart />
              </div>
          )}

          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-card dark:shadow-none">
              <RetentionChart />
          </div>
      </div>

      {/* ROW 3: OPTIMIZACIÓN IA (PRO ONLY FEATURE TEASER FOR STARTER) */}
      {isAdmin && (
        <div className="relative rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-card dark:shadow-none overflow-hidden">
            {isPro ? (
                <ProfitHeatmap />
            ) : (
                /* Locked State for Starter - Teaser */
                <div className="relative h-64 flex flex-col items-center justify-center text-center">
                    <div className="absolute inset-0 blur-sm opacity-50 pointer-events-none select-none" aria-hidden="true">
                        {/* Mock background to show what they are missing */}
                        <div className="grid grid-cols-7 gap-1 h-full w-full opacity-20">
                            {Array.from({length: 28}).map((_, i) => (
                                <div key={i} className={`rounded ${i % 3 === 0 ? 'bg-green-200' : 'bg-gray-100'}`}></div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="z-10 bg-white/90 dark:bg-black/80 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl backdrop-blur-sm max-w-md">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                            <Lock size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Optimizador de Horarios (IA)</h3>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Detecta automáticamente tus "Horas Muertas" y crea promociones flash para llenarlas. Disponible en el plan Pro.
                        </p>
                        <button className="text-sm font-bold text-primary hover:underline">
                            Ver características Pro
                        </button>
                    </div>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
