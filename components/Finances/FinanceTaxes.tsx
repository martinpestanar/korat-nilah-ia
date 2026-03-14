import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, AlertTriangle, CheckCircle, Download, Save } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useCurrency } from '../../hooks/useCurrency';

export default function FinanceTaxes() {
    const { formatMoney } = useCurrency();
    const [country, setCountry] = useState('PE');
    const [regime, setRegime] = useState('RUS');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // For smart alerts
    const [monthlyIncome, setMonthlyIncome] = useState(0);

    const businessId = localStorage.getItem('korat_business_id');

    useEffect(() => {
        if (businessId) {
            fetchData();
        }
    }, [businessId]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            
            // 1. Fetch Settings
            const { data: settingsData } = await supabase
                .from('finances_settings')
                .select('*')
                .eq('business_id', businessId)
                .single();
                
            if (settingsData) {
                setCountry(settingsData.tax_country || 'PE');
                setRegime(settingsData.tax_regime || 'RUS');
            }

            // 2. Fetch current month income for progressive alerts
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

            const { data: citasData } = await supabase
                .from('citas')
                .select('precio')
                .eq('business_id', businessId)
                .eq('estado', 'Completada')
                .gte('fecha', startOfMonth)
                .lte('fecha', endOfMonth);

            const totalIncome = (citasData || []).reduce((sum, item) => sum + Number(item.precio || 0), 0);
            setMonthlyIncome(totalIncome);

        } catch (error) {
            console.error('Error fetching taxes data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        setIsSaving(true);
        try {
            const payload = {
                business_id: businessId,
                tax_country: country,
                tax_regime: regime,
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('finances_settings')
                .upsert(payload, { onConflict: 'business_id' });

            if (error) throw error;
            alert('Configuración tributaria guardada correctamente.');
        } catch (error) {
            console.error('Error saving tax settings:', error);
            alert('Hubo un error al guardar la configuración.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="p-12 flex justify-center text-gray-500">Cargando configuración tributaria...</div>;
    }

    return (
        <div className="p-6 max-w-5xl mx-auto pb-24 space-y-6">
            
            {/* Country Settings */}
            <div className="bg-white dark:bg-dark-card rounded-3xl p-6 md:p-8 border border-gray-100 dark:border-dark-border shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <Globe className="text-indigo-500" size={24} />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Perfil Tributario</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">País de Operación</label>
                        <select 
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl py-3 px-4 outline-none focus:border-indigo-500 text-gray-900 dark:text-white"
                        >
                            <option value="PE">Perú 🇵🇪</option>
                            <option value="MX">México 🇲🇽</option>
                            <option value="CO">Colombia 🇨🇴</option>
                            <option value="CL">Chile 🇨🇱</option>
                            <option value="OTHER">Otro País</option>
                        </select>
                    </div>
                    
                    {country === 'PE' && (
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">Régimen SUNAT</label>
                            <select 
                                value={regime}
                                onChange={(e) => setRegime(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl py-3 px-4 outline-none focus:border-indigo-500 text-gray-900 dark:text-white"
                            >
                                <option value="RUS">Nuevo RUS (Cat 1: S/5,000 o Cat 2: S/8,000)</option>
                                <option value="RER">Régimen Especial (RER)</option>
                                <option value="MYPE">Régimen MYPE Tributario</option>
                                <option value="GENERAL">Régimen General</option>
                            </select>
                        </div>
                    )}
                </div>

                <div className="flex justify-end">
                    <button 
                        onClick={handleSaveSettings}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                    >
                        <Save size={18} /> {isSaving ? 'Guardando...' : 'Guardar Perfil'}
                    </button>
                </div>
            </div>

            {/* Smart Alerts (Peru Specific Demo) */}
            {country === 'PE' && regime === 'RUS' && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-3xl p-6 border flex gap-4 ${
                        monthlyIncome > 8000 
                            ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-500/20'
                            : monthlyIncome > 6500 
                                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-500/20'
                                : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-500/20'
                    }`}
                >
                    <AlertTriangle 
                        className={`flex-shrink-0 ${
                            monthlyIncome > 8000 ? 'text-rose-500' : monthlyIncome > 6500 ? 'text-amber-500' : 'text-green-500'
                        }`} 
                        size={24} 
                    />
                    <div>
                        <h3 className={`font-bold mb-1 ${
                            monthlyIncome > 8000 ? 'text-rose-900 dark:text-rose-400' : monthlyIncome > 6500 ? 'text-amber-900 dark:text-amber-400' : 'text-green-900 dark:text-green-400'
                        }`}>
                            Monitor de Límite RUS
                        </h3>
                        <p className={`text-sm italic mb-2 ${
                            monthlyIncome > 8000 ? 'text-rose-700 dark:text-rose-200' : monthlyIncome > 6500 ? 'text-amber-700 dark:text-amber-200' : 'text-green-700 dark:text-green-200'
                        }`}>
                            Ingresos del mes: {formatMoney(monthlyIncome)}. Límite Máximo: S/8,000.
                        </p>
                        <p className={`text-sm ${
                            monthlyIncome > 8000 ? 'text-rose-700 dark:text-rose-200' : monthlyIncome > 6500 ? 'text-amber-700 dark:text-amber-200' : 'text-green-700 dark:text-green-200'
                        }`}>
                            {monthlyIncome > 8000 
                                ? '¡ALERTA CRÍTICA! Has superado el límite de S/8,000. SUNAT te detectará automáticamente y te cambiará de régimen si emites más boletas. Contacta a un contador ya mismo.'
                                : monthlyIncome > 6500
                                ? 'Estás muy cerca del límite de la Categoría 2. Copilot te recomienda pausar ventas grandes con boleta para no pasar los S/8,000 o contactar a un contador para cambiar a MYPE Tributario mesolizadamente.'
                                : 'Tus ingresos están dentro del rango seguro para el Nuevo RUS. Cuentas con margen para seguir operando tranquilamente este mes.'
                            }
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Export for Accountant */}
            <div className="bg-white dark:bg-dark-card rounded-3xl p-6 md:p-8 border border-gray-100 dark:border-dark-border shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 rounded-full flex items-center justify-center">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">Todo en regla</h3>
                        <p className="text-sm text-gray-500">Tus movimientos de este mes (citas, gastos, nómina) están consolidados.</p>
                    </div>
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 text-white font-bold rounded-xl transition-colors">
                    <Download size={18} />
                    Exportar Reporte Mensual
                </button>
            </div>

        </div>
    );
}
