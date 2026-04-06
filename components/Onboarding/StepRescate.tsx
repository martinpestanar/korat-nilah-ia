import React, { useState, useEffect } from 'react';
import { Bot, ChevronRight, Gift, Percent, DollarSign, Activity, MessageSquare } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { updateTokenProgress } from '../../services/onboarding';

interface StepRescateProps {
  businessId: string;
  tokenId: string;
  moneda?: string;
  onComplete: () => void;
  onBack: () => void;
}

const PREMIOS_IDEAS = {
  nivel0: [ // Solo texto emocional
    "Mensaje de seguimiento emocional (sin premio físico)",
    "Preguntar si todo está bien con su servicio anterior",
    "Recordatorio amigable de mantenimiento sugerido"
  ],
  nivel1: [ // Bajo costo, buen gancho
    "Mascarilla facial hidratante de cortesía",
    "Tratamiento hidratante capilar básico (ampolla)",
    "Bebida premium de bienvenida y snack",
    "Exfoliación de manos y crema especial",
    "Diagnóstico capilar/facial con cámara HD gratis"
  ],
  nivel2: [ // Porcentajes
    "10% de descuento en todos los servicios",
    "15% de DSCTO en tu servicio favorito",
    "20% de descuento si vienes con un acompañante",
    "25% off en cualquier servicio nuevo que pruebes"
  ],
  nivel3: [ // Efectivo o regalos mayores
    "Cupón de 15 dólares/soles para tu próxima visita",
    "Corte de puntas o depilación de cejas totalmente gratis",
    "Servicio de pedicure de cortesía al hacerse color o mechas",
    "Cupón de 50 soles para canjear en cualquier tratamiento"
  ]
};

type DiaObjetivo = 35 | 60 | 90;

interface CampanaConfig {
  dia_objetivo: DiaObjetivo;
  agresividad: number;
  premio: string;
  activo: boolean;
}

const DEFAULT_CONFIGS: CampanaConfig[] = [
  { dia_objetivo: 35, agresividad: 0, premio: PREMIOS_IDEAS.nivel0[0], activo: true },
  { dia_objetivo: 60, agresividad: 2, premio: PREMIOS_IDEAS.nivel2[1], activo: true },
  { dia_objetivo: 90, agresividad: 3, premio: PREMIOS_IDEAS.nivel3[0], activo: true }
];

const StepRescate: React.FC<StepRescateProps> = ({
  businessId,
  tokenId,
  moneda = 'S/.',
  onComplete,
  onBack
}) => {
  const [configs, setConfigs] = useState<CampanaConfig[]>(DEFAULT_CONFIGS);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DiaObjetivo>(35);
  const [customPremios, setCustomPremios] = useState<string[]>([]);

  useEffect(() => {
    // Intentar cargar la data si existe
    const loadData = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('campanas_rescate')
        .select('*')
        .eq('business_id', businessId);
      
      if (!error && data && data.length > 0) {
        const mapped = [35, 60, 90].map(dia => {
          const found = data.find(c => c.dia_objetivo === dia);
          return found as CampanaConfig || DEFAULT_CONFIGS.find(d => d.dia_objetivo === dia)!;
        });
        setConfigs(mapped);
        
        const allStatic = Object.values(PREMIOS_IDEAS).flat();
        const customs = data.map(c => c.premio).filter(p => !allStatic.includes(p) && p.trim() !== "");
        setCustomPremios(Array.from(new Set(customs)));
      }
      setLoading(false);
    };
    loadData();
  }, [businessId]);

  const updateConfig = (dia: DiaObjetivo, updates: Partial<CampanaConfig>) => {
    setConfigs(configs.map(c => c.dia_objetivo === dia ? { ...c, ...updates } : c));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Upsert campanas
      const payload = configs.map(c => ({
        business_id: businessId,
        dia_objetivo: c.dia_objetivo,
        agresividad: c.agresividad,
        premio: c.premio,
        activo: c.activo
      }));
      
      const { error } = await supabase.from('campanas_rescate').upsert(payload, { onConflict: 'business_id,dia_objetivo' });
      if (error) throw error;
      
      const allStatic = Object.values(PREMIOS_IDEAS).flat();
      const currentCustoms = configs.map(c => c.premio).filter(p => !allStatic.includes(p) && p.trim() !== "");
      setCustomPremios(prev => Array.from(new Set([...prev, ...currentCustoms])));
      
      await updateTokenProgress(tokenId, 9); // It will be step 9 in the logic
      onComplete();
    } catch (e) {
      console.error(e);
      alert('Hubo un error guardando las alertas de retención.');
    } finally {
      setSaving(false);
    }
  };

  const currentConfig = configs.find(c => c.dia_objetivo === activeTab)!;

  const renderAgresividadButton = (num: number, icon: any, label: string) => {
    return (
      <button
        onClick={() => updateConfig(activeTab, { agresividad: num, premio: (PREMIOS_IDEAS as any)[`nivel${num}`][0] })}
        className={`flex-1 flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border-2 transition-all ${
          currentConfig.agresividad === num 
          ? 'border-violet-600 bg-violet-50 text-violet-800 dark:bg-violet-900/30 dark:border-violet-500 dark:text-violet-300' 
          : 'border-gray-200 dark:border-white/10 hover:border-violet-300 text-gray-500'
        }`}
      >
        <div className={`p-2 rounded-full mb-2 ${currentConfig.agresividad === num ? 'bg-violet-200 dark:bg-violet-800' : 'bg-gray-100 dark:bg-zinc-800'}`}>
          {icon}
        </div>
        <span className="text-xs sm:text-sm font-bold text-center leading-tight">{label}</span>
      </button>
    );
  };

  return (
    <div className="ob-step animate-fade-in-up">
      <div className="ob-header">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400 rounded-2xl mb-4">
          <Activity size={28} />
        </div>
        <h2 className="ob-title">Sistema de Retención Inteligente</h2>
        <p className="ob-desc">
          Automáticamente detectaremos a los clientes que dejen de venir y les enviaremos un mensaje sugiriéndoles regresar con un pequeño (o gran) incentivo. Opcionalmente puedes desactivar alguna alerta.
        </p>
      </div>

      <div className="bg-white dark:bg-[#141414] rounded-2xl p-6 sm:p-8 border border-gray-100 dark:border-white/5 shadow-sm mt-6">
        
        {/* TABS */}
        <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl mb-6">
          {[35, 60, 90].map((dia) => (
            <button
              key={dia}
              onClick={() => setActiveTab(dia as DiaObjetivo)}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                activeTab === dia 
                ? 'bg-white dark:bg-zinc-700 text-violet-700 dark:text-violet-300 shadow-sm' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {dia} Días
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-10 text-center text-gray-500">Cargando configuración...</div>
        ) : (
          <div className="space-y-6 animate-fade-in-up">
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">Alerta de {activeTab} Días</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {activeTab === 35 && "Recordatorio en caso hayan olvidado agendar. Util antes de que miren otro salón."}
                  {activeTab === 60 && "Cliente en riesgo de abandono. Dale un beneficio de cortesía."}
                  {activeTab === 90 && "Cliente inactivo. Es el momento de la oferta más agresiva para recuperarlo."}
                </p>
              </div>
            </div>

            <div className="space-y-5 bg-gray-50 dark:bg-zinc-800/50 p-5 rounded-2xl border border-gray-100 dark:border-white/5">
                <div>
                  <label className="block text-sm font-semibold mb-3">¿Qué tan agresivo será el gancho?</label>
                  <div className="flex gap-2 sm:gap-4 flex-wrap">
                    {activeTab === 35 && renderAgresividadButton(0, <MessageSquare size={20} />, "Solo Mensaje")}
                    {renderAgresividadButton(1, <Gift size={20} />, "Cortesía o Bajo Costo")}
                    {renderAgresividadButton(2, <Percent size={20} />, "Descuento en %")}
                    {renderAgresividadButton(3, <DollarSign size={20} />, "Cupón en Efectivo")}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Selecciona o escribe el incentivo a ofrecer</label>
                  <select 
                    className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 mb-4 text-sm focus:ring-2 focus:ring-violet-500"
                    value={
                      ([...(PREMIOS_IDEAS as any)[`nivel${currentConfig.agresividad}`], ...customPremios].includes(currentConfig.premio)) 
                        ? currentConfig.premio : ""
                    }
                    onChange={(e) => {
                      if (e.target.value) updateConfig(activeTab, { premio: e.target.value });
                    }}
                  >
                    <option value="" disabled>Selecciona una opción predefinida o escribe abajo...</option>
                    <optgroup label="Sugerencias IA">
                      {(PREMIOS_IDEAS as any)[`nivel${currentConfig.agresividad}`].map((idea: string, idx: number) => (
                        <option key={idx} value={idea}>{idea}</option>
                      ))}
                    </optgroup>
                    {customPremios.length > 0 && (
                      <optgroup label="Tus Premios Personalizados">
                        {customPremios.map((p, idx) => (
                          <option key={'c'+idx} value={p}>{p}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  
                  <div className="relative">
                    <input
                      type="text"
                      value={currentConfig.premio}
                      onChange={(e) => updateConfig(activeTab, { premio: e.target.value })}
                      placeholder="O escribe tu propio premio personalizado..."
                      className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-violet-500 font-medium"
                    />
                    {currentConfig.premio && !([...(PREMIOS_IDEAS as any)[`nivel${currentConfig.agresividad}`], ...customPremios].includes(currentConfig.premio)) && (
                      <span className="absolute right-3 top-3.5 text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30 px-2 py-0.5 rounded">¡Nuevo! Será guardado a tu lista</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2 flex items-start gap-1.5 font-medium">
                    <Bot size={14} className="text-violet-500 mt-0.5 shrink-0" />
                    <span>La IA usará este texto p.e. <em>"Sofia, noté que no nos visitas hace {activeTab} días. Quisiera obsequiarte: {currentConfig.premio}"</em>.</span>
                  </p>
                </div>
              </div>
          </div>
        )}

      </div>

      <div className="ob-actions">
        <button type="button" onClick={onBack} disabled={saving} className="ob-btn-secondary">
          Atrás
        </button>
        <button type="button" onClick={handleSave} disabled={saving || loading} className="ob-btn-primary">
          {saving ? 'Guardando...' : 'Siguiente paso'} <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default StepRescate;
