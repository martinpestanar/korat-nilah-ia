import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, MessageCircle, CalendarPlus, DollarSign, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import WidgetHelper from '../UI/WidgetHelper';

interface CampaignStats {
    campana_origen: string;
    total_enviados: number;
    total_respondieron: number;
    total_agendaron: number;
    dinero_rescatado: number;
}

const CAMPAIGN_NAMES: Record<string, string> = {
    'retencion_35': 'Retención 35 Días',
    'retencion_60': 'Retención 60 Días',
    'retencion_90': 'Retención 90 Días',
    'recordatorio_24h': 'Pre-Visita 24h',
    'recordatorio_3h': 'Anti No-Show 3h',
    'mantenimiento_servicio': 'Mantenimiento Sugerido',
    'whatsapp_marketing': 'Campaña Marketing Masivo'
};

const CampaignsTab: React.FC<{ dateFilter?: { start: string; end: string; label: string } }> = ({ dateFilter }) => {
    const { user } = useAuth();
    const [stats, setStats] = useState<CampaignStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            if (!user?.business_id) return;
            setIsLoading(true);

            try {
                const params: any = { p_business_id: user.business_id };
                if (dateFilter?.start) params.p_start_date = `${dateFilter.start}T00:00:00Z`;
                if (dateFilter?.end) params.p_end_date = `${dateFilter.end}T23:59:59Z`;

                const { data, error } = await supabase.rpc('get_campaign_roi_metrics', params);

                if (error) throw error;

                setStats(data || []);
            } catch (error) {
                console.error("Error fetching campaign ROI:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMetrics();
    }, [user?.business_id, dateFilter]);

    // Totales Globales
    const totalEnviados = stats.reduce((acc, curr) => acc + Number(curr.total_enviados || 0), 0);
    const totalRespondieron = stats.reduce((acc, curr) => acc + Number(curr.total_respondieron || 0), 0);
    const totalAgendaron = stats.reduce((acc, curr) => acc + Number(curr.total_agendaron || 0), 0);
    const totalDinero = stats.reduce((acc, curr) => acc + Number(curr.dinero_rescatado || 0), 0);

    const conversionTotal = totalEnviados > 0 ? ((totalAgendaron / totalEnviados) * 100).toFixed(1) : '0.0';
    const responseRate = totalEnviados > 0 ? ((totalRespondieron / totalEnviados) * 100).toFixed(1) : '0.0';

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                        <ShieldCheck className="text-violet-500" /> Dashboard de ROI y Rescates
                    </h2>
                    <p className="text-sm text-gray-500">Mide el retorno de inversión exacto de tus mensajes automatizados en n8n.</p>
                </div>
            </div>

            {/* KPI Totales - Estilo Premium Nilah */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 p-5 shadow-lg shadow-violet-500/20 text-white relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-xl group-hover:bg-white/20 transition-all" />
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-violet-100 text-sm font-medium mb-1">LTV / Dinero Rescatado</p>
                            <h3 className="text-3xl font-black">S/ {totalDinero.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
                        </div>
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm"><DollarSign size={20} className="text-white" /></div>
                    </div>
                    <div className="mt-4 text-xs text-violet-200">Facturación recupeada en automático</div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-5 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1 flex items-center gap-1">Mensajes Impactados <WidgetHelper title="Mensajes Impactados" what="Total de mensajes IA enviados en el rango de fechas" why="Conoce tu volumen de comunicación" /></p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{totalEnviados}</h3>
                        </div>
                        <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-xl"><Megaphone size={20} className="text-blue-600 dark:text-blue-400" /></div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-5 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1 flex items-center gap-1">Tasa de Respuesta <WidgetHelper title="Tasa de Respuesta" what="Porcentaje de clientes que responde al recibir una campaña" why="Una tasa baja indica que el mensaje no llama la atención" /></p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{responseRate}%</h3>
                        </div>
                        <div className="p-2 bg-purple-50 dark:bg-purple-500/10 rounded-xl"><MessageCircle size={20} className="text-purple-600 dark:text-purple-400" /></div>
                    </div>
                    <div className="mt-4 text-xs text-gray-400">{totalRespondieron} conversaciones iniciadas</div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-5 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1 flex items-center gap-1">Citas Generadas <WidgetHelper title="Conversión a Citas" what="Porcentaje de clientes prmo/rescate que agendan tras 7 días" why="La métrica final que mueve tu aguja financiera" /></p>
                            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{conversionTotal}%</h3>
                        </div>
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl"><CalendarPlus size={20} className="text-emerald-600 dark:text-emerald-400" /></div>
                    </div>
                    <div className="mt-4 text-xs font-medium text-emerald-600 dark:text-emerald-400">{totalAgendaron} agendamientos nuevos</div>
                </motion.div>
            </div>

            {/* Desglose por Tipo de Campaña (El Embudo) */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-dark-border bg-gray-50/50 dark:bg-dark-bg/50">
                    <h3 className="font-bold text-gray-900 dark:text-white">Rendimiento por Embudos Automáticos</h3>
                    <p className="text-xs text-gray-500 mt-1">Cómo se comportó cada flujo de n8n</p>
                </div>
                
                {stats.length === 0 ? (
                    <div className="p-10 flex flex-col items-center justify-center text-center">
                        <div className="h-16 w-16 bg-violet-50 text-violet-300 rounded-full flex items-center justify-center mb-4"><Megaphone size={32}/></div>
                        <h4 className="font-bold text-gray-700">Aún no hay mensajes rastreados</h4>
                        <p className="text-sm text-gray-500 max-w-sm mt-2">Cuando tus flujos de n8n empiecen a enviar mensajes de rescate y pasen el `campana_origen`, las métricas aparecerán aquí.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-gray-50 dark:bg-dark-bg/50 text-gray-500 font-medium">
                                <tr>
                                    <th className="px-6 py-3">Flujo / Campaña</th>
                                    <th className="px-6 py-3 text-center">Mensajes Enviados</th>
                                    <th className="px-6 py-3 text-center">Respondieron</th>
                                    <th className="px-6 py-3 text-center">Agendamientos (7d)</th>
                                    <th className="px-6 py-3 text-right">LTV Recuperado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
                                {stats.map((row, idx) => {
                                    const convRate = row.total_enviados > 0 ? ((row.total_agendaron / row.total_enviados) * 100).toFixed(1) : '0';
                                    return (
                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors">
                                        <td className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-200">
                                            {CAMPAIGN_NAMES[row.campana_origen] || row.campana_origen}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-1 px-3 rounded-full font-bold">{row.total_enviados}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <span className="text-gray-900 dark:text-gray-200 font-bold">{row.total_respondieron}</span>
                                                <span className="text-xs text-gray-400">({row.total_enviados > 0 ? ((row.total_respondieron/row.total_enviados)*100).toFixed(0) : 0}%)</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{row.total_agendaron}</span>
                                                <span className={`text-xs px-1.5 py-0.5 rounded ${Number(convRate) > 10 ? 'bg-emerald-100 text-emerald-700' : 'text-gray-400'}`}>{convRate}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-violet-600 dark:text-violet-400">
                                            S/ {Number(row.dinero_rescatado || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>

            {/* Tips del Copiloto */}
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/30 dark:bg-blue-900/10">
                <div className="flex gap-3">
                    <div className="mt-0.5"><AlertCircle className="h-5 w-5 text-blue-500" /></div>
                    <div>
                        <h4 className="text-sm font-bold text-blue-900 dark:text-blue-400">¿Cómo funciona este Dashboard?</h4>
                        <p className="mt-1 text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                            Nilah rastrea cada mensaje enviado por los webhooks de n8n. Si un flujo envía `campana_origen: "retencion_35"`, lo contamos como impacto. Si el cliente responde dentro de 48h, cuenta como Interacción. Si el cliente tiene una nueva Cita creada en su historial hasta 7 días después, Nilah calcula el precio de esa cita y lo suma a tu LTV Rescatado Automáticamente.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default CampaignsTab;
