import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, UserCheck, Calculator, Plus, Trash2, Calendar, RefreshCw, TrendingUp, AlertCircle, ExternalLink, Settings2, UserPlus, FileText, CheckCircle2, ChevronDown, ChevronRight, Check } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useCurrency } from '../../hooks/useCurrency';

const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
};

const toDateInput = (d: Date) => d.toISOString().split('T')[0];

// Props component
interface FinancePayrollProps {
    dateRange?: { start: string, end: string }; // Made optional as it's not used in the original code's useEffect
}

export const FinancePayroll: React.FC<FinancePayrollProps> = ({ dateRange }) => {
    const { formatMoney } = useCurrency();
    const [staffList, setStaffList] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newPayment, setNewPayment] = useState({
        staff_name: '',
        staff_id: '',
        payment_type: 'base',
        base_amount: '',
        commission_rate: '',
        commission_sales: '',
        amount: '',
        period_start: '',
        period_end: '',
        adjustment: '',
        payment_method: '',
        reference_code: '',
        notes: '',
        payment_date: new Date().toISOString().split('T')[0]
    });

    const businessId = localStorage.getItem('korat_business_id');

    useEffect(() => {
        if (businessId) {
            fetchData();
        }
    }, [businessId]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            
            // 1. Fetch Staff
            const { data: staffData } = await supabase
                .from('staff')
                .select('*')
                .eq('business_id', businessId)
                .order('nombre', { ascending: true });
            
            if (staffData) setStaffList(staffData);

            // 2. Fetch Payroll history
            const { data: payrollData } = await supabase
                .from('finances_payroll')
                .select('*')
                .eq('business_id', businessId)
                .order('payment_date', { ascending: false })
                .limit(20);
                
            if (payrollData) setPayments(payrollData);

        } catch (error) {
            console.error('Error fetching payroll data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSavePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const isBase = newPayment.payment_type === 'base';
            const isCommission = newPayment.payment_type === 'commission';
            const isMixed = newPayment.payment_type === 'mixed';
            const baseAmount = parseFloat(newPayment.base_amount) || 0;
            const commissionRate = parseFloat(newPayment.commission_rate) || 0;
            const commissionSales = parseFloat(newPayment.commission_sales) || 0;
            const commissionAmount = Math.max(0, commissionSales * commissionRate / 100);
            const adjustment = parseFloat(newPayment.adjustment) || 0;
            const totalAmount = (isBase ? baseAmount : isCommission ? commissionAmount : baseAmount + commissionAmount) + adjustment;

            if (!newPayment.staff_name) throw new Error('Debe seleccionar un miembro del staff.');
            if (!newPayment.period_start || !newPayment.period_end) throw new Error('Debe seleccionar el periodo a liquidar.');
            if (isBase && baseAmount <= 0) throw new Error('Debe ingresar el sueldo base.');
            if (isCommission && (commissionSales <= 0 || commissionRate <= 0)) throw new Error('Debe ingresar ventas y porcentaje de comisión.');
            if (isMixed && (baseAmount <= 0 || commissionSales <= 0 || commissionRate <= 0)) throw new Error('Debe completar sueldo base, ventas y porcentaje.');

            // Find staff name if ID was selected (our select uses names for simplicity here, but let's assume it's direct name)
            const payload = {
                business_id: businessId,
                staff_name: newPayment.staff_name,
                staff_id: newPayment.staff_id ? parseInt(newPayment.staff_id, 10) : null,
                amount: totalAmount,
                payment_type: newPayment.payment_type,
                payment_date: newPayment.payment_date,
                period_start: newPayment.period_start || null,
                period_end: newPayment.period_end || null,
                base_amount: isBase || isMixed ? baseAmount : null,
                commission_rate: isCommission || isMixed ? commissionRate : null,
                commission_sales: isCommission || isMixed ? commissionSales : null,
                commission_amount: isCommission || isMixed ? commissionAmount : null,
                payment_method: newPayment.payment_method || null,
                reference_code: newPayment.reference_code || null,
                notes: newPayment.notes || null
            };

            const { error } = await supabase.from('finances_payroll').insert(payload);
            if (error) {
                const msg = (error as any)?.message || '';
                const isMissingColumn = /column .* does not exist/i.test(msg);
                if (isMissingColumn) {
                    const legacyPayload = {
                        business_id: businessId,
                        staff_name: newPayment.staff_name,
                        staff_id: newPayment.staff_id ? parseInt(newPayment.staff_id, 10) : null,
                        amount: totalAmount,
                        payment_type: newPayment.payment_type,
                        payment_date: newPayment.payment_date,
                        period_start: newPayment.period_start || null,
                        period_end: newPayment.period_end || null,
                        payment_method: newPayment.payment_method || null,
                        reference_code: newPayment.reference_code || null,
                        notes: newPayment.notes || null
                    };
                    const retry = await supabase.from('finances_payroll').insert(legacyPayload);
                    if (retry.error) throw retry.error;
                } else {
                    throw error;
                }
            }

            setIsModalOpen(false);
            setNewPayment({
                staff_name: '',
                staff_id: '',
                payment_type: 'base',
                base_amount: '',
                commission_rate: '',
                commission_sales: '',
                amount: '',
                period_start: '',
                period_end: '',
                adjustment: '',
                payment_method: '',
                reference_code: '',
                notes: '',
                payment_date: new Date().toISOString().split('T')[0]
            });
            fetchData();
        } catch (error) {
            console.error('Error saving payment:', error);
            alert("Hubo un error al guardar el pago.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Seguro que deseas eliminar este registro de pago?')) return;
        try {
            await supabase.from('finances_payroll').delete().eq('id', id);
            setPayments(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            console.error('Error deleting payment:', error);
        }
    };

    const getPaymentTypeLabel = (type: string) => {
        switch(type) {
            case 'base': return 'Sueldo Fijo';
            case 'commission': return 'Comisiones';
            case 'mixed': return 'Mixto';
            default: return type;
        }
    };

    const applyPeriodPreset = (preset: 'week' | 'biweek' | 'month') => {
        const now = new Date();
        let start = new Date(now);
        let end = new Date(now);

        if (preset === 'week') {
            const day = now.getDay();
            const diffToMonday = (day === 0 ? -6 : 1) - day;
            start.setDate(now.getDate() + diffToMonday);
            end = new Date(start);
            end.setDate(start.getDate() + 6);
        } else if (preset === 'biweek') {
            const day = now.getDate();
            if (day <= 15) {
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth(), 15);
            } else {
                start = new Date(now.getFullYear(), now.getMonth(), 16);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            }
        } else if (preset === 'month') {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }

        setNewPayment(prev => ({
            ...prev,
            period_start: toDateInput(start),
            period_end: toDateInput(end)
        }));
    };

    const calculateCommissionSales = async () => {
        if (!businessId || !newPayment.period_start || !newPayment.period_end) return;
        const staffId = parseInt(newPayment.staff_id || '0', 10) || null;
        const { data, error } = await supabase
            .from('Citas')
            .select('precio, estado, staff_id')
            .eq('business_id', businessId)
            .gte('fecha', `${newPayment.period_start}T00:00:00`)
            .lte('fecha', `${newPayment.period_end}T23:59:59`);

        if (error) return;
        const total = (data || [])
            .filter((c: any) => (staffId ? c.staff_id === staffId : true))
            .filter((c: any) => String(c.estado || '').toLowerCase().includes('complet'))
            .reduce((sum: number, c: any) => sum + (parseFloat(String(c.precio || 0)) || 0), 0);
        setNewPayment(prev => ({ ...prev, commission_sales: total ? total.toFixed(2) : '' }));
    };

    const isBase = newPayment.payment_type === 'base';
    const isCommission = newPayment.payment_type === 'commission';
    const isMixed = newPayment.payment_type === 'mixed';
    const baseAmount = parseFloat(newPayment.base_amount) || 0;
    const commissionRate = parseFloat(newPayment.commission_rate) || 0;
    const commissionSales = parseFloat(newPayment.commission_sales) || 0;
    const commissionAmount = Math.max(0, commissionSales * commissionRate / 100);
    const adjustment = parseFloat(newPayment.adjustment) || 0;
    const totalAmount = (isBase ? baseAmount : isCommission ? commissionAmount : baseAmount + commissionAmount) + adjustment;

    useEffect(() => {
        const hasBase = newPayment.base_amount !== '';
        const hasCommission = newPayment.commission_rate !== '' && newPayment.commission_sales !== '';
        let nextAmount = '';
        if (isBase && hasBase) nextAmount = (baseAmount + adjustment).toFixed(2);
        if (isCommission && hasCommission) nextAmount = (commissionAmount + adjustment).toFixed(2);
        if (isMixed && hasBase && hasCommission) nextAmount = totalAmount.toFixed(2);

        setNewPayment(prev => (prev.amount === nextAmount ? prev : { ...prev, amount: nextAmount }));
    }, [
        isBase,
        isCommission,
        isMixed,
        baseAmount,
        commissionAmount,
        totalAmount,
        adjustment,
        newPayment.base_amount,
        newPayment.commission_rate,
        newPayment.commission_sales
    ]);

    if (isLoading) {
        return <div className="p-12 text-center text-gray-500">Cargando datos de nómina...</div>;
    }

    return (
        <div className="p-6 max-w-5xl mx-auto pb-24 space-y-6">
            
            {/* Header & Add Button */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <UserCheck className="text-indigo-500" /> Control de Nómina
                    </h2>
                    <p className="text-sm text-gray-500">Registra y gestiona los pagos a tu equipo (fijos o comisiones).</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-all active:scale-95"
                >
                    <Plus size={18} /> Nuevo Pago
                </button>
            </div>

            {/* Empty State or List */}
            {payments.length === 0 ? (
                <div className="bg-white dark:bg-dark-card rounded-3xl p-12 border border-gray-100 dark:border-dark-border shadow-sm text-center">
                    <Calculator size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Aún no hay pagos registrados</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">Comienza a registrar los sueldos y comisiones de tu equipo para llevar un control exacto de tus finanzas.</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-dark-card rounded-3xl overflow-hidden border border-gray-100 dark:border-dark-border shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                            <thead className="text-xs text-gray-700 bg-gray-50 dark:bg-dark-bg dark:text-gray-300 uppercase">
                                <tr>
                                    <th className="px-6 py-4">Personal</th>
                                    <th className="px-6 py-4">Fecha</th>
                                    <th className="px-6 py-4">Tipo</th>
                                    <th className="px-6 py-4 text-right">Monto</th>
                                    <th className="px-6 py-4 text-center">Ación</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((payment, idx) => (
                                    <motion.tr 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={payment.id} 
                                        className="border-b border-gray-50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5"
                                    >
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            {payment.staff_name}
                                        </td>
                                        <td className="px-6 py-4">
                                            {formatDate(payment.payment_date)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 rounded-full text-xs font-semibold">
                                                {getPaymentTypeLabel(payment.payment_type)}
                                            </span>
                                            {(payment.payment_type === 'commission' || payment.payment_type === 'mixed') && (payment.commission_rate || payment.commission_sales) && (
                                                <div className="text-xs text-gray-400 mt-1">
                                                    {payment.payment_type === 'mixed' && payment.base_amount ? `Base ${formatMoney(Number(payment.base_amount || 0))} · ` : ''}
                                                    {payment.commission_rate ? `${payment.commission_rate}%` : ''}{payment.commission_sales ? ` de ${formatMoney(Number(payment.commission_sales || 0))}` : ''}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white text-base">
                                            {formatMoney(payment.amount)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => handleDelete(payment.id)}
                                                className="text-gray-400 hover:text-red-500 transition-colors p-2"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal for New Payment */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-white dark:bg-dark-card rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-dark-border max-h-[90vh] overflow-y-auto"
                        >
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white justify-between flex items-center mb-6">
                                Registrar Pago
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 bg-gray-100 p-2 rounded-full">✕</button>
                            </h3>

                            <form onSubmit={handleSavePayment} className="space-y-4">
                                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-50 text-indigo-600">1</span>
                                    Staff y periodo
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Miembro del Staff</label>
                                    <select 
                                        required
                                        value={newPayment.staff_id}
                                        onChange={(e) => setNewPayment({...newPayment, staff_name: e.target.options[e.target.selectedIndex]?.dataset?.name || '', staff_id: e.target.value})}
                                        className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border text-gray-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    >
                                        <option value="">Selecciona al personal</option>
                                        {staffList.map(s => (
                                            <option key={s.id} value={s.id} data-name={s.nombre}>{s.nombre}</option>
                                        ))}
                                        <option value="0" data-name="Personal Eventual">Personal Eventual (Otro)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Periodo a Liquidar</label>
                                    <div className="grid grid-cols-3 gap-2 mb-3">
                                        <button type="button" onClick={() => applyPeriodPreset('week')} className="px-3 py-2 rounded-lg border text-xs font-semibold text-gray-600 hover:bg-gray-50">Semana</button>
                                        <button type="button" onClick={() => applyPeriodPreset('biweek')} className="px-3 py-2 rounded-lg border text-xs font-semibold text-gray-600 hover:bg-gray-50">Quincena</button>
                                        <button type="button" onClick={() => applyPeriodPreset('month')} className="px-3 py-2 rounded-lg border text-xs font-semibold text-gray-600 hover:bg-gray-50">Mes</button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
                                            <input 
                                                type="date"
                                                value={newPayment.period_start}
                                                onChange={(e) => setNewPayment({...newPayment, period_start: e.target.value})}
                                                className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border text-gray-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
                                            <input 
                                                type="date"
                                                value={newPayment.period_end}
                                                onChange={(e) => setNewPayment({...newPayment, period_end: e.target.value})}
                                                className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border text-gray-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2">
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-50 text-indigo-600">2</span>
                                    Tipo de pago
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Pago</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id: 'base', label: 'Fijo' },
                                            { id: 'commission', label: 'Comisión' },
                                            { id: 'mixed', label: 'Mixto' }
                                        ].map((t) => (
                                            <button
                                                key={t.id}
                                                type="button"
                                                onClick={() => setNewPayment(prev => ({
                                                    ...prev,
                                                    payment_type: t.id,
                                                    base_amount: t.id === 'commission' ? '' : prev.base_amount,
                                                    commission_rate: t.id === 'base' ? '' : prev.commission_rate,
                                                    commission_sales: t.id === 'base' ? '' : prev.commission_sales
                                                }))}
                                                className={`p-2 border rounded-lg text-sm font-medium transition-all ${newPayment.payment_type === t.id ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-transparent text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                                            >
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2">
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-50 text-indigo-600">3</span>
                                    Detalle y resumen
                                </div>

                                {isBase && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sueldo Base ({formatMoney(0).replace(/[0.,\s]/g, '')})</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">{formatMoney(0).replace(/[0.,\s]/g, '')}</span>
                                            <input 
                                                type="number" 
                                                step="0.01"
                                                required
                                                value={newPayment.base_amount}
                                                onChange={(e) => setNewPayment({...newPayment, base_amount: e.target.value})}
                                                className="w-full pl-10 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border text-gray-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-bold text-lg"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                )}

                                {(isCommission || isMixed) && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ventas Comisionables ({formatMoney(0).replace(/[0.,\s]/g, '')})</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">{formatMoney(0).replace(/[0.,\s]/g, '')}</span>
                                                <input 
                                                    type="number" 
                                                    step="0.01"
                                                    required
                                                    value={newPayment.commission_sales}
                                                    onChange={(e) => setNewPayment({...newPayment, commission_sales: e.target.value})}
                                                    className="w-full pl-10 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border text-gray-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={calculateCommissionSales}
                                                className="mt-2 w-full text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg py-2"
                                            >
                                                Calcular ventas del periodo
                                            </button>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Porcentaje (%)</label>
                                            <input 
                                                type="number" 
                                                step="0.01"
                                                required
                                                value={newPayment.commission_rate}
                                                onChange={(e) => setNewPayment({...newPayment, commission_rate: e.target.value})}
                                                className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border text-gray-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                )}

                                {isMixed && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sueldo Base (S/)</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">S/</span>
                                            <input 
                                                type="number" 
                                                step="0.01"
                                                required
                                                value={newPayment.base_amount}
                                                onChange={(e) => setNewPayment({...newPayment, base_amount: e.target.value})}
                                                className="w-full pl-10 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border text-gray-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-bold text-lg"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                )}

                                {(isCommission || isMixed) && (
                                    <div className="bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl p-4 space-y-2">
                                        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                                            <span>Comisión Calculada</span>
                                            <span className="font-semibold text-gray-900 dark:text-white">{commissionAmount > 0 ? formatMoney(commissionAmount) : '—'}</span>
                                        </div>
                                        {isMixed && (
                                            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                                                <span>Sueldo Base</span>
                                                <span className="font-semibold text-gray-900 dark:text-white">{baseAmount > 0 ? formatMoney(baseAmount) : '—'}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between text-base text-gray-900 dark:text-white">
                                            <span className="font-semibold">Total a Pagar</span>
                                            <span className="font-black">{totalAmount > 0 ? formatMoney(totalAmount) : '—'}</span>
                                        </div>
                                    </div>
                                )}

                                {isBase && (
                                    <div className="bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl p-4 flex items-center justify-between text-base text-gray-900 dark:text-white">
                                        <span className="font-semibold">Total a Pagar</span>
                                        <span className="font-black">{baseAmount > 0 ? formatMoney(baseAmount) : '—'}</span>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Método de Pago</label>
                                        <select
                                            value={newPayment.payment_method}
                                            onChange={(e) => setNewPayment({ ...newPayment, payment_method: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border text-gray-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        >
                                            <option value="">Selecciona</option>
                                            <option value="efectivo">Efectivo</option>
                                            <option value="transferencia">Transferencia</option>
                                            <option value="yape">Yape/Plin</option>
                                            <option value="tarjeta">Tarjeta</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Referencia</label>
                                        <input
                                            type="text"
                                            value={newPayment.reference_code}
                                            onChange={(e) => setNewPayment({ ...newPayment, reference_code: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border text-gray-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="N° operación"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ajuste (+/-)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">S/</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={newPayment.adjustment}
                                            onChange={(e) => setNewPayment({ ...newPayment, adjustment: e.target.value })}
                                            className="w-full pl-10 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border text-gray-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">Úsalo para bonos o descuentos.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notas</label>
                                    <textarea
                                        rows={3}
                                        value={newPayment.notes}
                                        onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border text-gray-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="Detalle adicional del pago"
                                    />
                                </div>

                                <div className="sticky bottom-0 bg-white/95 dark:bg-dark-card/95 backdrop-blur border border-gray-100 dark:border-dark-border rounded-2xl p-4">
                                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                                        <span>Subtotal</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">
                                            {isBase ? formatMoney(baseAmount) : formatMoney((isCommission ? commissionAmount : baseAmount + commissionAmount) || 0)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 mt-1">
                                        <span>Ajuste</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">{adjustment ? formatMoney(adjustment) : formatMoney(0)}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                                        <span className="font-semibold text-gray-700 dark:text-gray-300">Total a Pagar</span>
                                        <span className="font-black">{totalAmount > 0 ? formatMoney(totalAmount) : '—'}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de Pago</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Calendar size={16} /></span>
                                        <input 
                                            type="date"
                                            required
                                            value={newPayment.payment_date}
                                            onChange={(e) => setNewPayment({...newPayment, payment_date: e.target.value})}
                                            className="w-full pl-10 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border text-gray-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={isSaving}
                                    className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all mt-4 disabled:opacity-50"
                                >
                                    {isSaving ? 'Guardando...' : 'Guardar Pago'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}
