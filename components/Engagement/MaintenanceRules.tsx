import React from 'react';
import { Wrench, ToggleLeft, ToggleRight, Clock, MessageCircle } from 'lucide-react';
import { MaintenanceRule } from '../../services/engagementMockData';

interface MaintenanceRulesProps {
    rules: MaintenanceRule[];
}

const MaintenanceRules: React.FC<MaintenanceRulesProps> = ({ rules }) => {
    return (
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-card">
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-indigo-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                        Recordatorios de Mantenimiento
                    </h3>
                </div>
                <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400">
                    {rules.filter(r => r.isActive).length} activos
                </span>
            </div>

            <div className="space-y-3">
                {rules.map((rule) => (
                    <div
                        key={rule.id}
                        className={`rounded-lg border p-4 transition-all ${rule.isActive
                            ? 'border-gray-200 bg-gray-50 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:bg-gray-700'
                            : 'border-gray-100 bg-gray-100/50 opacity-60 dark:border-gray-700 dark:bg-gray-800/30'
                            }`}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-medium text-gray-900 dark:text-white">
                                        {rule.serviceName}
                                    </h4>
                                    {rule.isActive ? (
                                        <ToggleRight className="h-5 w-5 text-emerald-500" />
                                    ) : (
                                        <ToggleLeft className="h-5 w-5 text-gray-400" />
                                    )}
                                </div>

                                <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        <span>
                                            Recordar a los <strong className="text-gray-700 dark:text-gray-300">{rule.reminderDays} días</strong>
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-3 flex items-start gap-2 rounded-lg bg-white/80 p-2 dark:bg-gray-900/50">
                                    <MessageCircle className="mt-0.5 h-3 w-3 text-gray-400 flex-shrink-0" />
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {rule.messageTemplate.replace('{nombre}', 'Cliente')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 text-center">
                <button className="inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:border-primary hover:text-primary dark:border-gray-600 dark:text-gray-400 dark:hover:border-primary dark:hover:text-primary">
                    + Agregar regla de mantenimiento
                </button>
            </div>
        </div>
    );
};

export default MaintenanceRules;
