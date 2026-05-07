import React, { useMemo } from 'react';
import { Bot, TrendingUp, CalendarCheck, ShieldCheck } from 'lucide-react';
import { useDashboardData } from '../../context/DashboardDataContext';
import { useCurrency } from '../../hooks/useCurrency';

const NilahImpactWidget: React.FC = () => {
    const { data } = useDashboardData();
    const { formatValue } = useCurrency();

    const { clients = [] } = data || {};

    const metrics = useMemo(() => {
        let rescued = 0;
        let totalRevenueSaved = 0;
        let activeFollowUps = 0;

        clients.forEach(client => {
            if (client.rescate_exitoso) {
                rescued += 1;
                // Asumimos conservadoramente 1 ticket promedio por rescate para el cálculo de revenue guardado
                const ticket = (client.total_visitas > 0 ? (client.ltv || 0) / client.total_visitas : 0);
                totalRevenueSaved += ticket;
            }

            // Calculamos clientes con bot prendido (follow up activo) y con días ausentes moderados
            const diasAusente = client.dias_ausente || 0;
            if (!client.bot_pausado && diasAusente > 0 && diasAusente <= 45 && client.estado !== 'Inactivo') {
                activeFollowUps += 1;
            }
        });

        return {
            rescued,
            totalRevenueSaved,
            activeFollowUps
        };
    }, [clients]);

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/10 dark:to-purple-900/10 p-5 rounded-2xl relative overflow-hidden group">
            {/* Elementos decorativos (doodles) de fondo */}
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none transition-transform group-hover:scale-110 duration-700">
                <Bot size={120} />
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
                        <Bot className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-gray-900 dark:text-white leading-tight">Trabajo de Nilah</h3>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Piloto Automático</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Logro principal */}
                    <div className="flex flex-col bg-white/60 dark:bg-dark-bg/60 rounded-xl p-3 border border-indigo-100 dark:border-indigo-900/30 backdrop-blur-sm">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold flex items-center gap-1.5 break-all">
                            <ShieldCheck size={12} className="text-green-500" />
                            Clientas Recuperadas
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl font-black text-gray-900 dark:text-white">
                                {metrics.rescued}
                            </span>
                            <span className="text-xs text-gray-400 font-medium">histórico</span>
                        </div>
                    </div>

                    {/* Ganancias generadas */}
                    <div className="flex flex-col bg-white/60 dark:bg-dark-bg/60 rounded-xl p-3 border border-indigo-100 dark:border-indigo-900/30 backdrop-blur-sm">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold flex items-center gap-1.5 break-all">
                            <TrendingUp size={12} className="text-emerald-500" />
                            Ganancia Retenida Estimada
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                {formatValue(metrics.totalRevenueSaved)}
                            </span>
                        </div>
                        <p className="text-[9px] text-gray-400 mt-0.5">Dinero salvado de fugas de clientes.</p>
                    </div>

                    {/* Mensajes activos */}
                    <div className="flex flex-col bg-white/60 dark:bg-dark-bg/60 rounded-xl p-3 border border-indigo-100 dark:border-indigo-900/30 backdrop-blur-sm">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold flex items-center gap-1.5 break-all">
                            <CalendarCheck size={12} className="text-indigo-500" />
                            Seguimientos Activos
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                                {metrics.activeFollowUps}
                            </span>
                            <span className="text-[10px] text-gray-500 font-medium leading-tight">clientas vigiladas por Nilah<br />este mes</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NilahImpactWidget;
