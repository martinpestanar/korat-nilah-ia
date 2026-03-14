import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, DollarSign, FileText, ChevronRight, PieChart } from 'lucide-react';
import FinanceExpenses from '../components/Finances/FinanceExpenses';
import FinanceDashboard from '../components/Finances/FinanceDashboard';
import FinancePayroll from '../components/Finances/FinancePayroll';
import FinanceTaxes from '../components/Finances/FinanceTaxes';





const FinanceTags = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'gastos', label: 'Egresos', icon: Wallet },
    { id: 'nomina', label: 'Nómina', icon: DollarSign },
    { id: 'impuestos', label: 'Impuestos & SUNAT', icon: FileText }
];

export default function Finances() {
    const [activeTab, setActiveTab] = useState('dashboard');

    return (
        <div className="w-full h-full flex flex-col pt-8 lg:pt-0">
            {/* Cabecera */}
            <div className="px-6 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white">
                        <Wallet size={20} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nilah Finanzas</h1>
                        <p className="text-sm text-gray-400">Control total de la salud de tu negocio</p>
                    </div>
                </div>
            </div>

            {/* Tabs de Navegación */}
            <div className="flex space-x-1 border-b border-gray-200 dark:border-dark-border px-6 overflow-x-auto scrollbar-hide">
                {FinanceTags.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold transition-all relative whitespace-nowrap ${isActive
                                ? 'text-emerald-500 dark:text-emerald-400'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                        >
                            <Icon size={16} />
                            {tab.label}
                            {isActive && (
                                <motion.div
                                    layoutId="finances_tab_indicator"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-t-full"
                                />
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Contenido Dinámico */}
            <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-dark-bg/50">
                {activeTab === 'dashboard' && <FinanceDashboard />}
                {activeTab === 'gastos' && <FinanceExpenses />}
                {activeTab === 'nomina' && <FinancePayroll />}
                {activeTab === 'impuestos' && <FinanceTaxes />}
            </div>
        </div>
    );
}
