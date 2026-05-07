import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Clock, ShieldCheck, Megaphone, Loader2, Sparkles, MessageSquareHeart } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';

// Helpers para el Toggle estilo iOS
const Toggle: React.FC<{ on: boolean; onChange: (v: boolean) => void; disabled?: boolean }> = ({ on, onChange, disabled }) => (
    <button
        onClick={() => !disabled && onChange(!on)}
        disabled={disabled}
        className={`w-12 h-6 rounded-full border transition-all flex-shrink-0 relative ${
            on ? 'bg-emerald-500 border-emerald-500' : 'bg-gray-200 border-gray-300 dark:bg-gray-700 dark:border-gray-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${on ? 'left-6' : 'left-0.5'}`} />
    </button>
);

const PilotoAutomaticoTab: React.FC = () => {
    const { user, recursosSaaS } = useAuth();
    const [config, setConfig] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Inicializamos con los recursosSaaS del contexto o la DB
    useEffect(() => {
        const fetchConfig = async () => {
            if (!user?.business_id) return;
            try {
                const { data, error } = await supabase
                    .from('negocios')
                    .select('recursos_saas')
                    .eq('id', user.business_id)
                    .single();

                if (error) throw error;
                // Parse the JSON safely
                let parsed = typeof data.recursos_saas === 'string' ? JSON.parse(data.recursos_saas) : (data.recursos_saas || {});
                setConfig(parsed);
            } catch (error) {
                console.error("Error fetching config:", error);
                // Fallback to what we have in context
                setConfig(recursosSaaS);
            } finally {
                setIsLoading(false);
            }
        };

        fetchConfig();
    }, [user?.business_id, recursosSaaS]);

    const handleToggle = async (key: 'rescate_activo' | 'recordatorios_activos' | 'mantenimiento_activo' | 'post_cita_activo') => {
        if (!user?.business_id || !config) return;
        setIsSaving(true);

        try {
            // Updated struct
            const newConfig = {
                ...config,
                automatizaciones: {
                    ...(config.automatizaciones || {}),
                    [key]: !(config.automatizaciones?.[key] ?? false)
                }
            };

            // Keep optimistic UI
            setConfig(newConfig);

            const { error } = await supabase
                .from('negocios')
                .update({ recursos_saas: newConfig })
                .eq('id', user.business_id);

            if (error) {
                console.error("Error al actualizar la DB, revirtiendo estado", error);
                // Revert if error
                setConfig(config);
            }

        } catch (error) {
            console.error("Error updating automatizacion:", error);
            setConfig(config);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
            </div>
        );
    }

    const automations = config?.automatizaciones || {};

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                        <Zap className="text-emerald-500" /> Piloto Automático
                    </h2>
                    <p className="text-sm text-gray-500 max-w-2xl">Enciende o apaga las automatizaciones que Nilah ejecuta en segundo plano. Si apagas un flujo, Nilah dejará de enviar esos mensajes hasta que lo vuelvas a encender.</p>
                </div>
                {isSaving && <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="w-4 h-4 animate-spin text-emerald-500" /> Guardando...</div>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Flow 1: Rescate */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border shadow-sm p-6 relative overflow-hidden"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-violet-50 dark:bg-violet-500/10 rounded-xl">
                                <ShieldCheck className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg">Rescatador Inquebrantable</h3>
                                <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 px-2 py-0.5 rounded-full inline-block mt-1">35, 60 y 90 Días</p>
                            </div>
                        </div>
                        
                        {(automations.permitir_rescate ?? true) ? (
                            <Toggle 
                                on={automations.rescate_activo ?? false} 
                                onChange={() => handleToggle('rescate_activo')} 
                                disabled={isSaving} 
                            />
                        ) : (
                            <div className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">🔒 Requiere Plan</div>
                        )}
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Detecta automáticamente cuando un cliente lleva mucho tiempo sin venir y le envía mensajes de retención estratégicos de manera escalonada.
                    </p>

                    <div className="bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-xl p-3 text-xs text-gray-500 flex justify-between items-center">
                        <span>Estado actual del motor:</span>
                        {automations.rescate_activo ? (
                            <span className="flex items-center gap-1 text-emerald-600 font-bold"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Activo</span>
                        ) : (
                            <span className="text-gray-400 font-bold">Pausado</span>
                        )}
                    </div>
                </motion.div>

                {/* Flow 2: Recordatorios */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border shadow-sm p-6 relative overflow-hidden"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
                                <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg">Recordatorios Anti No-Show</h3>
                                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full inline-block mt-1">24h y 3h previas</p>
                            </div>
                        </div>
                        
                        {(automations.permitir_recordatorios ?? true) ? (
                            <Toggle 
                                on={automations.recordatorios_activos ?? false} 
                                onChange={() => handleToggle('recordatorios_activos')} 
                                disabled={isSaving} 
                            />
                        ) : (
                            <div className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">🔒 Requiere Plan</div>
                        )}
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Confirma la asistencia un día antes y envía un re-recordatorio 3 horas antes para minimizar faltas y optimizar tu agenda.
                    </p>

                    <div className="bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-xl p-3 text-xs text-gray-500 flex justify-between items-center">
                        <span>Estado actual del motor:</span>
                        {automations.recordatorios_activos ? (
                            <span className="flex items-center gap-1 text-emerald-600 font-bold"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Activo</span>
                        ) : (
                            <span className="text-gray-400 font-bold">Pausado</span>
                        )}
                    </div>
                </motion.div>
                
                {/* Flow 3: Mantenimientos */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border shadow-sm p-6 relative overflow-hidden"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
                                <Sparkles className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg">Mantenimientos IA</h3>
                                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full inline-block mt-1">Cíclicos</p>
                            </div>
                        </div>
                        
                        {(automations.permitir_mantenimiento ?? false) ? (
                            <Toggle 
                                on={automations.mantenimiento_activo ?? false} 
                                onChange={() => handleToggle('mantenimiento_activo')} 
                                disabled={isSaving} 
                            />
                        ) : (
                            <div className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">🔒 Requiere Plan</div>
                        )}
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Identifica cuándo un cliente debería volver a realizarse un servicio recurrente (como retoques) y le envía una sugerencia amigable.
                    </p>

                    <div className="bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-xl p-3 text-xs text-gray-500 flex justify-between items-center">
                        <span>Estado actual del motor:</span>
                        {automations.mantenimiento_activo ? (
                            <span className="flex items-center gap-1 text-emerald-600 font-bold"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Activo</span>
                        ) : (
                            <span className="text-gray-400 font-bold">Pausado</span>
                        )}
                    </div>
                </motion.div>

                {/* Flow 4: Mensajes Post-Cita */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border shadow-sm p-6 relative overflow-hidden"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-pink-50 dark:bg-pink-500/10 rounded-xl">
                                <MessageSquareHeart className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg">Feedback Automático</h3>
                                <p className="text-xs font-semibold text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/30 px-2 py-0.5 rounded-full inline-block mt-1">Post-Visita</p>
                            </div>
                        </div>
                        
                        {(automations.permitir_post_cita ?? false) ? (
                            <Toggle 
                                on={automations.post_cita_activo ?? false} 
                                onChange={() => handleToggle('post_cita_activo')} 
                                disabled={isSaving} 
                            />
                        ) : (
                            <div className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">🔒 Requiere Plan</div>
                        )}
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Envía un mensaje de seguimiento después del servicio para pedir una calificación o conocer la experiencia del cliente.
                    </p>

                    <div className="bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-xl p-3 text-xs text-gray-500 flex justify-between items-center">
                        <span>Estado actual del motor:</span>
                        {automations.post_cita_activo ? (
                            <span className="flex items-center gap-1 text-emerald-600 font-bold"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Activo</span>
                        ) : (
                            <span className="text-gray-400 font-bold">Pausado</span>
                        )}
                    </div>
                </motion.div>
                
            </div>
            
        </div>
    );
};

export default PilotoAutomaticoTab;
