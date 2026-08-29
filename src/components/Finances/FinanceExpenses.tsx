import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, 
    Droplet, // Agua
    Zap, // Luz
    Home, // Alquiler
    Box, // Insumos
    Megaphone, // Publicidad
    Coffee, // Otros
    Repeat,
    Trash2,
    CheckCircle2
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useCurrency } from '../../hooks/useCurrency';

// Categorías predefinidas comunes de salones
const EXPENSE_CATEGORIES = [
    { id: 'alquiler', label: 'Alquiler', icon: Home, color: 'text-blue-500', bg: 'bg-blue-100', border: 'border-blue-200' },
    { id: 'luz', label: 'Luz', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-100', border: 'border-amber-200' },
    { id: 'agua', label: 'Agua', icon: Droplet, color: 'text-cyan-500', bg: 'bg-cyan-100', border: 'border-cyan-200' },
    { id: 'insumos', label: 'Insumos', icon: Box, color: 'text-violet-500', bg: 'bg-violet-100', border: 'border-violet-200' },
    { id: 'marketing', label: 'Publicidad', icon: Megaphone, color: 'text-pink-500', bg: 'bg-pink-100', border: 'border-pink-200' },
    { id: 'otros', label: 'Otros', icon: Coffee, color: 'text-gray-500', bg: 'bg-gray-100', border: 'border-gray-200' },
];

export default function FinanceExpenses() {
    const { formatMoney } = useCurrency();
    const [expenses, setExpenses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // UI States for Quick Add Modal
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<any | null>(null);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [isRecurring, setIsRecurring] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);

    const businessId = localStorage.getItem('korat_business_id');

    useEffect(() => {
        if (businessId) {
            fetchExpenses();
        }
    }, [businessId]);

    const fetchExpenses = async () => {
        try {
            const { data, error } = await supabase
                .from('finances_expenses')
                .select('*')
                .eq('business_id', businessId)
                .order('expense_date', { ascending: false });

            if (error) {
                console.error("No se pudo cargar los gastos, verifica que creaste la tabla finances_expenses en Supabase", error);
            } else {
                setExpenses(data || []);
            }
        } catch (e) {
            console.error('Error fetching expenses', e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveExpense = async () => {
        if (!selectedCategory || !amount || parseFloat(amount) <= 0) return;
        
        setIsSaving(true);
        try {
            const { data, error } = await supabase
                .from('finances_expenses')
                .insert([{
                    business_id: businessId,
                    amount: parseFloat(amount),
                    category: selectedCategory.id,
                    description: description || selectedCategory.label,
                    expense_date: new Date().toISOString(),
                    is_recurring: isRecurring
                }])
                .select();

            if (error) throw error;

            if (data) {
                setExpenses(prev => [data[0], ...prev]);
            }
            
            // Show success briefly
            setShowSuccessMessage(true);
            setTimeout(() => {
                setShowSuccessMessage(false);
                closeModal();
            }, 1000);

        } catch (error) {
            console.error("Error saving expense:", error);
            alert("No se pudo guardar el gasto. Asegúrate de haber ejecutado el script SQL en Supabase.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("¿Seguro que deseas eliminar este gasto?")) return;
        
        try {
            const { error } = await supabase
                .from('finances_expenses')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            setExpenses(prev => prev.filter(e => e.id !== id));
        } catch (error) {
            console.error("Error deleting expense:", error);
        }
    };

    const openCategoryModal = (category: any) => {
        setSelectedCategory(category);
        setAmount('');
        setDescription('');
        setIsRecurring(false);
        setIsAddModalOpen(true);
    };

    const closeModal = () => {
        setIsAddModalOpen(false);
        setTimeout(() => setSelectedCategory(null), 200);
    };

    return (
        <div className="p-4 sm:p-6 max-w-3xl mx-auto pb-28">
            {/* Quick Add Section */}
            <div className="mb-6">
                <h2 className="text-base font-bold text-gray-900 dark:text-white mb-0.5">Registro Rápido</h2>
                <p className="text-xs text-gray-400 mb-4">Toca una categoría para registrar un gasto al instante.</p>
                

                <div className="grid grid-cols-3 gap-2.5">
                    {EXPENSE_CATEGORIES.map(cat => {
                        const Icon = cat.icon;
                        return (
                            <motion.button
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.94 }}
                                key={cat.id}
                                onClick={() => openCategoryModal(cat)}
                                className="flex flex-col items-center justify-center p-4 rounded-2xl border transition-all bg-white dark:bg-[#111118] border-gray-100 dark:border-white/[0.07] hover:shadow-md dark:hover:border-white/[0.13] group"
                            >
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-2.5 ${cat.bg} dark:bg-opacity-20 group-hover:scale-110 transition-transform`}>
                                    <Icon size={22} className={cat.color} />
                                </div>
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{cat.label}</span>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Expenses List */}
            <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 uppercase tracking-wider text-gray-400">Historial Reciente</h3>
                
                {isLoading ? (
                    <div className="space-y-2.5">
                        {[1,2,3].map(i => (
                            <div key={i} className="animate-pulse rounded-2xl bg-gray-200 dark:bg-white/10 h-20" />
                        ))}
                    </div>
                ) : expenses.length === 0 ? (
                    <div className="py-12 text-center bg-white dark:bg-[#111118] rounded-2xl border border-gray-100 dark:border-white/[0.07]">
                        <div className="w-14 h-14 bg-gray-100 dark:bg-white/[0.06] rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <Box className="text-gray-400" size={22} />
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 font-semibold text-sm">Sin gastos registrados</p>
                        <p className="text-xs text-gray-400 mt-1">Toca una categoría arriba para agregar uno.</p>
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {expenses.map((expense) => {
                            const cat = EXPENSE_CATEGORIES.find(c => c.id === expense.category) || EXPENSE_CATEGORIES[5];
                            const Icon = cat.icon;
                            return (
                                <div key={expense.id} className="flex items-center justify-between p-4 bg-white dark:bg-[#111118] rounded-2xl border border-gray-100 dark:border-white/[0.07] shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${cat.bg} dark:bg-opacity-20 flex-shrink-0`}>
                                            <Icon size={18} className={cat.color} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm text-gray-900 dark:text-white leading-tight">{expense.description}</p>
                                            <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                                                <span>{new Date(expense.expense_date).toLocaleDateString('es-PE', { day:'2-digit', month:'short' })}</span>
                                                {expense.is_recurring && (
                                                    <span className="flex items-center gap-1 text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-md font-medium">
                                                        <Repeat size={9} /> Mensual
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-base font-bold text-gray-900 dark:text-white">
                                            {formatMoney(parseFloat(expense.amount))}
                                        </span>
                                        <button
                                            onClick={() => handleDelete(expense.id)}
                                            className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Quick Add Modal */}
            <AnimatePresence>
                {isAddModalOpen && selectedCategory && (
                    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 pb-20 sm:pb-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={closeModal}
                        />

                        <motion.div
                            initial={{ opacity: 0, y: 100 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 100 }}
                            className="relative w-full max-w-sm bg-white dark:bg-dark-card rounded-3xl p-6 shadow-2xl"
                        >
                            <div className="flex flex-col items-center text-center mb-6">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${selectedCategory.bg} dark:bg-opacity-20`}>
                                    <selectedCategory.icon size={32} className={selectedCategory.color} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Gasto de {selectedCategory.label}
                                </h3>
                            </div>

                            {showSuccessMessage ? (
                                <motion.div 
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="flex flex-col items-center justify-center py-8"
                                >
                                    <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                                        <CheckCircle2 size={32} />
                                    </div>
                                    <p className="font-bold text-emerald-600">¡Gasto guardado!</p>
                                </motion.div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Monto ({formatMoney(0).replace(/[0.,\s]/g, '')})</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">{formatMoney(0).replace(/[0.,\s]/g, '')}</span>
                                            <input 
                                                type="number" 
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                placeholder="0.00"
                                                className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-2xl py-4 pl-12 pr-4 text-2xl font-bold text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Descripción (Opcional)</label>
                                        <input 
                                            type="text" 
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder={`Ej. Recibo de ${selectedCategory.label} mayo`}
                                            className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl py-3 px-4 text-sm outline-none focus:border-emerald-500 transition-all text-gray-900 dark:text-white"
                                        />
                                    </div>

                                    <button 
                                        onClick={() => setIsRecurring(!isRecurring)}
                                        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-colors text-sm font-bold ${
                                            isRecurring 
                                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' 
                                            : 'border-gray-100 dark:border-dark-border text-gray-500 hover:bg-gray-50'
                                        }`}
                                    >
                                        <Repeat size={16} />
                                        {isRecurring ? 'Es recurrente (mensual)' : 'Marcar como recurrente'}
                                    </button>

                                    <div className="flex gap-3 pt-2">
                                        <button 
                                            onClick={closeModal}
                                            className="flex-1 py-4 rounded-2xl bg-gray-100 dark:bg-dark-bg text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-200 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button 
                                            onClick={handleSaveExpense}
                                            disabled={isSaving || !amount || parseFloat(amount) <= 0}
                                            className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-lg shadow-emerald-500/30 disabled:opacity-50 hover:opacity-95 transition-all"
                                        >
                                            {isSaving ? 'Guardando...' : 'Guardar'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
