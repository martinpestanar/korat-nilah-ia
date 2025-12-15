
import React from 'react';
import { Sparkles, MessageCircle, Send, Users, TrendingUp, CheckCircle, Smartphone, ShieldAlert } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const MarketingPage: React.FC = () => {
  const { campaigns, activateCampaign } = useData();
  const { isAdmin } = useAuth();

  // --- ACCESS DENIED FOR STAFF ---
  if (!isAdmin) {
      return (
          <div className="flex h-[80vh] flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-full bg-rose-100 p-4 text-rose-500 dark:bg-rose-900/20">
                  <ShieldAlert size={48} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Acceso Denegado</h1>
              <p className="mt-2 max-w-md text-gray-500 dark:text-gray-400">
                  La gestión de campañas de marketing y la visualización de ROI están reservadas para el administrador del negocio.
              </p>
              <Link to="/app" className="mt-6 rounded-lg bg-gray-200 px-6 py-2 text-sm font-bold text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700">
                  Volver al Dashboard
              </Link>
          </div>
      );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
       {/* HERO SECTION */}
       <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 to-purple-900 p-8 text-white shadow-xl">
           <div className="absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/4 rounded-full bg-purple-500/30 blur-3xl"></div>
           <div className="relative z-10 max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-purple-200 backdrop-blur-md">
                 <Sparkles size={14} /> Nilah Marketing AI
              </div>
              <h1 className="mb-4 text-3xl font-bold leading-tight">Hola, tengo 3 estrategias listas para hoy.</h1>
              <p className="text-indigo-200">
                 He analizado tu agenda de esta semana y el comportamiento de tus clientes VIP. 
                 Si activas una de estas campañas ahora, estimo un retorno inmediato en reservas.
              </p>
           </div>
       </div>

       {/* CAMPAIGN CARDS */}
       <div>
          <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
             <MessageCircle className="text-primary" size={20} />
             Sugerencias de Campaña
          </h2>
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
             {campaigns.map((campaign) => (
                <div 
                  key={campaign.id} 
                  className={`relative flex flex-col justify-between rounded-xl border p-6 transition-all duration-300 hover:shadow-lg ${
                     campaign.status === 'Active' 
                     ? 'border-primary bg-primary/5 dark:bg-primary/5 shadow-[0_0_20px_rgba(52,211,153,0.1)]' 
                     : 'border-gray-100 bg-white dark:border-dark-border dark:bg-dark-card'
                  }`}
                >
                   {/* STATUS BADGE */}
                   {campaign.status === 'Active' && (
                       <div className="absolute -top-3 right-4 rounded-full bg-primary px-3 py-1 text-xs font-bold text-black shadow-md flex items-center gap-1">
                          <CheckCircle size={12} /> ACTIVADA
                       </div>
                   )}

                   <div>
                      <div className="mb-4 flex items-center justify-between">
                         <span className="rounded-lg bg-gray-100 p-2 text-gray-500 dark:bg-dark-bg dark:text-gray-400">
                            {campaign.channel === 'WhatsApp' ? <Smartphone size={20} /> : <MessageCircle size={20} />}
                         </span>
                         <span className="text-xs font-bold uppercase text-gray-400">{campaign.channel}</span>
                      </div>
                      
                      <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">{campaign.title}</h3>
                      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">{campaign.description}</p>
                      
                      {/* AI RATIONALE BOX */}
                      <div className="mb-4 rounded-lg bg-indigo-50 p-3 text-xs text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300">
                         <p className="flex gap-2">
                            <Sparkles size={14} className="shrink-0 mt-0.5" />
                            <span className="italic">"{campaign.aiRationale}"</span>
                         </p>
                      </div>

                      {/* STATS */}
                      <div className="mb-6 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 dark:border-dark-border">
                         <div>
                            <p className="text-[10px] uppercase text-gray-400">Público</p>
                            <p className="flex items-center gap-1 font-semibold dark:text-white">
                               <Users size={14} className="text-gray-400" /> {campaign.targetSegment}
                            </p>
                         </div>
                         <div>
                            <p className="text-[10px] uppercase text-gray-400">Retorno Estimado</p>
                            <p className="flex items-center gap-1 font-bold text-green-500">
                               <TrendingUp size={14} /> S/ {campaign.predictedRevenue}
                            </p>
                         </div>
                      </div>
                   </div>

                   <button 
                      onClick={() => activateCampaign(campaign.id)}
                      disabled={campaign.status === 'Active'}
                      className={`flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold transition-all ${
                         campaign.status === 'Active'
                         ? 'cursor-default bg-gray-100 text-gray-400 dark:bg-dark-bg dark:text-gray-600'
                         : 'bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200'
                      }`}
                   >
                      {campaign.status === 'Active' ? (
                          <>En Curso...</>
                      ) : (
                          <>
                             <Send size={16} /> Lanzar Campaña
                          </>
                      )}
                   </button>
                </div>
             ))}
          </div>
       </div>
    </div>
  );
};

export default MarketingPage;
