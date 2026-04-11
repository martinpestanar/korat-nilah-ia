import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, ArrowLeft, X, Filter, Zap, Target, BookOpen, GraduationCap, TrendingUp, Trophy } from 'lucide-react';
import { kbData, KBCategory, KBArticle } from '../../services/kbData';
import { AcademyCategoryCard } from './AcademyCategoryCard';

interface AcademyHomeProps {
    onBack: () => void;
    onSelectArticle: (article: KBArticle) => void;
    completedNodes: string[];
}

export const AcademyHome: React.FC<AcademyHomeProps> = ({ onBack, onSelectArticle, completedNodes }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activePillar, setActivePillar] = useState<'all' | 'App Mastery' | 'Business IQ'>('all');

    // Stats calculation
    const totalArticles = useMemo(() => kbData.reduce((acc, cat) => acc + cat.articles.length, 0), []);
    const completedTotal = completedNodes.length;
    const globalProgress = (completedTotal / totalArticles) * 100;

    // Filter logic
    const filteredCategories = useMemo(() => {
        let result = kbData;
        
        if (activePillar !== 'all') {
            result = result.filter(c => c.level === activePillar);
        }

        if (searchTerm.trim()) {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.map(cat => {
                const articles = cat.articles.filter(a => 
                    a.title.toLowerCase().includes(lowerSearch) || 
                    a.excerpt.toLowerCase().includes(lowerSearch)
                );
                return { ...cat, articles };
            }).filter(cat => cat.articles.length > 0);
        }

        return result;
    }, [searchTerm, activePillar]);

    const getCompletedCountForCat = (catId: string) => {
        const cat = kbData.find(c => c.id === catId);
        if (!cat) return 0;
        return cat.articles.filter(a => completedNodes.includes(a.id)).length;
    };

    return (
        <div className="space-y-8 pb-32">
            
            {/* ─── SEARCH & FILTERS ─── */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 px-0">
                <div className="relative w-full lg:w-[450px] group">
                    <div className="absolute inset-x-0 -bottom-2 h-10 bg-brand/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                    <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[1.25rem] flex items-center p-1 shadow-sm focus-within:border-brand/50 transition-all">
                        <Search className="w-5 h-5 text-zinc-400 ml-4 shrink-0 transition-colors group-focus-within:text-brand" />
                        <input
                            type="text"
                            placeholder="¿Qué quieres aprender hoy?..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-transparent border-none focus:ring-0 text-sm py-3 px-3 text-zinc-900 dark:text-white placeholder:text-zinc-500 outline-none"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors mr-1">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                        <div className="hidden sm:flex items-center gap-1 pr-3 border-l border-zinc-100 dark:border-zinc-800 ml-1 pl-3">
                            <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded font-bold border border-zinc-200 dark:border-zinc-700">⌘</span>
                            <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded font-bold border border-zinc-200 dark:border-zinc-700">K</span>
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-auto flex items-center p-1 bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800 rounded-2xl overflow-x-auto whitespace-nowrap hide-scrollbar">
                    {(['all', 'App Mastery', 'Business IQ'] as const).map(p => (
                        <button
                            key={p}
                            onClick={() => setActivePillar(p)}
                            className={`flex-1 lg:flex-none px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                activePillar === p 
                                ? 'bg-white dark:bg-zinc-800 text-brand shadow-sm ring-1 ring-black/5 dark:ring-white/5' 
                                : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
                            }`}
                        >
                            {p === 'all' ? 'Ver Todo' : p}
                        </button>
                    ))}
                </div>
            </div>

            {/* ─── QUICK STATS CARDS ─── */}
            {!searchTerm && activePillar === 'all' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-brand p-6 rounded-[2rem] text-white shadow-xl shadow-brand/10 relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                            <GraduationCap className="w-24 h-24" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 bg-white/20 rounded-xl">
                                    <GraduationCap className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-tighter bg-white/20 px-2 py-0.5 rounded-full">Progreso Global</span>
                            </div>
                            <div className="text-4xl font-black mb-1">{Math.round(globalProgress)}%</div>
                            <p className="text-white/80 text-xs mb-4 font-medium">Has completado {completedTotal} de {totalArticles} lecciones.</p>
                            <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden border border-white/10">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${globalProgress}%` }}
                                    className="h-full bg-white shadow-[0_0_10px_white]"
                                />
                            </div>
                        </div>
                    </motion.div>

                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-[2rem] flex flex-col justify-between group hover:border-brand/30 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 group-hover:bg-amber-500 group-hover:text-white transition-all">
                                <Trophy className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Business IQ</div>
                                <div className="text-lg font-black text-zinc-900 dark:text-white leading-tight">Masterclasses</div>
                            </div>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-4 leading-relaxed font-medium">Fórmate en métricas clave para llevar tu salón hacia la automatización total.</p>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-[2rem] flex flex-col justify-between group hover:border-brand/30 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-2xl bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                <Zap className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">App Mastery</div>
                                <div className="text-lg font-black text-zinc-900 dark:text-white leading-tight">Docs Técnicos</div>
                            </div>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-4 leading-relaxed font-medium">Guías paso a paso para configurar recordatorios, marketing y más módulos.</p>
                    </div>
                </div>
            )}

            {/* ─── CATEGORY GRID ─── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 pb-20">
                <AnimatePresence mode="popLayout">
                    {filteredCategories.map((cat, idx) => (
                        <AcademyCategoryCard
                            key={cat.id}
                            category={cat}
                            completedCount={getCompletedCountForCat(cat.id)}
                            delay={idx * 0.05}
                            onClick={() => {
                                if (cat.articles.length > 0) {
                                    const firstUncompleted = cat.articles.find(a => !completedNodes.includes(a.id)) || cat.articles[0];
                                    onSelectArticle(firstUncompleted);
                                }
                            }}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {filteredCategories.length === 0 && (
                <div className="py-20 text-center">
                    <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Search className="w-8 h-8 text-zinc-400" />
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Sin coincidencias</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Prueba con términos como 'Inbox', 'Marketing' o 'Finanzas'.</p>
                </div>
            )}
        </div>
    );

};
