import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, DollarSign, ArrowUpRight, ArrowDownRight, Wallet, Activity } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useCurrency } from '../../hooks/useCurrency';

export default function FinanceDashboard() {
    const { formatMoney } = useCurrency();
    const [isLoading, setIsLoading] = useState(true);
    const [metrics, setMetrics] = useState({
        totalIncome: 0,
        totalExpenses: 0,
        netProfit: 0,
        profitMargin: 0
    });

    const businessId = localStorage.getItem('korat_business_id');

    useEffect(() => {
        if (businessId) {
            calculateMetrics();
        }
    }, [businessId]);

    const calculateMetrics = async () => {
        try {
            setIsLoading(true);
            
            // Get current month start/end dates
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

            // 1. Fetch Expenses for current month
            const { data: expensesData } = await supabase
                .from('finances_expenses')
                .select('amount')
                .eq('business_id', businessId)
                .gte('expense_date', startOfMonth)
                .lte('expense_date', endOfMonth);

            const totalExpenses = (expensesData || []).reduce((sum, item) => sum + Number(item.amount), 0);

            // 2. Fetch Income for current month (approximated from citas Completadas in this MVP)
            const { data: citasData } = await supabase
                .from('citas')
                .select('precio')
                .eq('business_id', businessId)
                .eq('estado', 'Completada')
                .gte('fecha', startOfMonth)
                .lte('fecha', endOfMonth);

            const totalIncome = (citasData || []).reduce((sum, item) => sum + Number(item.precio || 0), 0);
            
            // Actual Income calculated from Appointments
            const finalIncome = totalIncome;
            const netProfit = finalIncome - totalExpenses;
            const profitMargin = finalIncome > 0 ? (netProfit / finalIncome) * 100 : 0;

            setMetrics({
                totalIncome: finalIncome,
                totalExpenses,
                netProfit,
                profitMargin
            });

        } catch (error) {
            console.error('Error calculating metrics:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div className="p-12 flex justify-center text-gray-500">Calculando salud financiera...</div>;
    }

    const { totalIncome, totalExpenses, netProfit, profitMargin } = metrics;
    
    // Determine the status "Traffic Light"
    let statusColor = 'text-green-500';
    let statusBg = 'bg-green-100';
    let StatusIcon = TrendingUp;
    let statusText = 'Excelentes Ganancias';

    if (netProfit < 0) {
        statusColor = 'text-red-500';
        statusBg = 'bg-red-100';
        StatusIcon = TrendingDown;
        statusText = 'Pérdida Crítica';
    } else if (profitMargin < 10) {
        statusColor = 'text-amber-500';
        statusBg = 'bg-amber-100';
        StatusIcon = Minus;
        statusText = 'En Punto de Equilibrio / Alerta';
    }

    return (
        <div className="p-6 max-w-5xl mx-auto pb-24 space-y-6">
            
            {/* Health Semaphore */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full bg-white dark:bg-dark-card rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-dark-border flex flex-col md:flex-row items-center gap-6 justify-between"
            >
                <div>
                    <h2 className="text-gray-500 font-semibold mb-1 uppercase tracking-wider text-sm flex items-center gap-2">
                        <Activity size={16} /> Estado del Mes Actual
                    </h2>
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center ${statusBg} dark:bg-opacity-10`}>
                            <StatusIcon size={28} className={statusColor} />
                        </div>
                        <div>
                            <h3 className={`text-2xl font-black ${statusColor}`}>{statusText}</h3>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Margen Neto: {profitMargin.toFixed(1)}%
                            </p>
                        </div>
                    </div>
                </div>

                <div className="text-right flex flex-col items-end">
                    <span className="text-gray-500 text-sm font-medium mb-1">Ganancia / Pérdida Neta</span>
                    <span className={`text-4xl font-black tracking-tight ${netProfit >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-500'}`}>
                        {formatMoney(netProfit)}
                    </span>
                </div>
            </motion.div>

            {/* Income vs Expense Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white dark:bg-dark-card rounded-3xl p-6 border border-gray-100 dark:border-dark-border shadow-sm flex items-center gap-4"
                >
                    <div className="w-12 h-12 rounded-xl bg-emerald-100/50 dark:bg-emerald-500/10 flex items-center justify-center">
                        <ArrowUpRight size={24} className="text-emerald-500" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium tracking-wide">INGRESO BRUTO (CITAS)</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatMoney(totalIncome)}</p>
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white dark:bg-dark-card rounded-3xl p-6 border border-gray-100 dark:border-dark-border shadow-sm flex items-center gap-4"
                >
                    <div className="w-12 h-12 rounded-xl bg-rose-100/50 dark:bg-rose-500/10 flex items-center justify-center">
                        <ArrowDownRight size={24} className="text-rose-500" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium tracking-wide">EGRESOS TOTALES</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatMoney(totalExpenses)}</p>
                    </div>
                </motion.div>
            </div>

            {/* Copilot Insights Box */}
            <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.2 }}
                 className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 p-1"
            >
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
                <div className="relative bg-white/10 dark:bg-black/20 backdrop-blur-md rounded-[22px] p-6 lg:p-8 text-white">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 shadow-inner">
                            <span className="text-2xl">✨</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold mb-1">Nilah Copilot Insight</h3>
                            <p className="text-indigo-100 text-sm md:text-base mb-4 leading-relaxed">
                                {netProfit > 2000 
                                    ? `¡Magnífico trabajo este mes! Tu negocio tiene un margen de ${profitMargin.toFixed(1)}%. Este excedente de ${formatMoney(netProfit)} podrías reinvertirlo en una campaña de Facebook Ads para captar clientes nuevas.`
                                    : netProfit > 0 
                                    ? `Tu salón está en verde, generando ${formatMoney(netProfit)} de ganancia neta. Observo que tus Gastos de Insumos están en el límite saludable. Puedes revisar las compras a proveedores menores.`
                                    : `ALERTA CRÍTICA: Estás perdiendo dinero este mes por ${formatMoney(Math.abs(netProfit))}. Recomiendo encarecidamente recortar gastos en la pestaña de Control de Gastos y lanzar una campaña Flash para recuperar flujo de caja.` 
                                }
                            </p>
                            <button className="px-4 py-2 bg-white text-indigo-600 font-bold rounded-lg shadow font-sm hover:scale-105 transition-transform">
                                Hablar con Nilah
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>

        </div>
    );
}
