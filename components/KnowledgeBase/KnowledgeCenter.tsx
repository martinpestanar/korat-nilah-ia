import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, BookOpen, Lightbulb, PlayCircle, ArrowLeft, X } from 'lucide-react';
import { kbData, KBArticle, KBCategory } from '../../services/kbData';
import ArticleViewer from './ArticleViewer';

interface Props {
    onBack: () => void;
}

const KnowledgeCenter: React.FC<Props> = ({ onBack }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(null);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    // Filter logic
    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return kbData;

        const lowerSearch = searchTerm.toLowerCase();
        return kbData.map(category => {
            const filteredArticles = category.articles.filter(article =>
                article.title.toLowerCase().includes(lowerSearch) ||
                article.excerpt.toLowerCase().includes(lowerSearch)
            );
            return { ...category, articles: filteredArticles };
        }).filter(category => category.articles.length > 0);
    }, [searchTerm]);

    const categoriesToShow = activeCategory
        ? filteredData.filter(c => c.id === activeCategory)
        : filteredData;

    const getArticleIcon = (type: KBArticle['type']) => {
        switch (type) {
            case 'masterclass': return <Lightbulb className="w-4 h-4" />;
            case 'video': return <PlayCircle className="w-4 h-4" />;
            case 'doc': default: return <BookOpen className="w-4 h-4" />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg pb-20 font-sans">

            {/* ─── HEADER / HERO ─── */}
            <div className="relative bg-white dark:bg-dark-card border-b border-gray-200 dark:border-dark-border overvlow-hidden">
                {/* Abstract Background Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors mb-8"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver al Dashboard
                    </button>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div className="max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-100 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 text-xs font-bold uppercase tracking-widest mb-4 border border-violet-200 dark:border-violet-500/20">
                                <Sparkles className="w-3.5 h-3.5" />
                                Centro de Ayuda Nilah
                            </div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white leading-tight tracking-tight mb-4">
                                ¿En qué te podemos ayudar hoy?
                            </h1>
                            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-xl leading-relaxed">
                                Encuentra guías técnicas paso a paso y descubre estrategias de inteligencia de negocios para llevar tu salón al siguiente nivel.
                            </p>
                        </div>

                        {/* Premium Search Bar */}
                        <div className="w-full md:w-96 relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-pink-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                            <div className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm flex items-center p-2 transition-all group-focus-within:border-violet-500/50 group-focus-within:ring-4 group-focus-within:ring-violet-500/10">
                                <Search className="w-5 h-5 text-gray-400 ml-3 shrink-0" />
                                <input
                                    type="text"
                                    placeholder="Buscar 'Recordatorios', 'Ticket Promedio'..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-transparent border-none focus:ring-0 text-sm sm:text-base text-gray-900 dark:text-white placeholder:text-gray-400 py-3 px-3 outline-none"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 shrink-0"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── CATEGORY FILTERS ─── */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex items-center gap-2 overflow-x-auto pb-4 custom-scrollbar hide-scroll-arrow">
                    <button
                        onClick={() => setActiveCategory(null)}
                        className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 ${activeCategory === null
                            ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-md'
                            : 'bg-white dark:bg-dark-card text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg'
                            }`}
                    >
                        Todos los artículos
                    </button>

                    {kbData.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id === activeCategory ? null : cat.id)}
                            className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shrink-0 ${activeCategory === cat.id
                                ? `${cat.color.bg.replace('/10', '/20')} ${cat.color.text} border ${cat.color.border}`
                                : 'bg-white dark:bg-dark-card text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg'
                                }`}
                        >
                            <cat.icon className="w-4 h-4" />
                            {cat.title}
                        </button>
                    ))}
                </div>
            </div>

            {/* ─── BENTO GRID ─── */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                {filteredData.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-dark-card rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No encontramos resultados</h3>
                        <p className="text-gray-500 dark:text-gray-400">Intenta buscar con otros términos o revisa las categorías de arriba.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 items-start">
                        <AnimatePresence mode="popLayout">
                            {categoriesToShow.map((cat, index) => (
                                <motion.div
                                    key={cat.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    className="bg-white dark:bg-dark-card rounded-3xl border border-gray-200 dark:border-dark-border shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden"
                                >
                                    {/* Category Header */}
                                    <div className={`p-6 border-b ${cat.color.border.replace('/20', '/30')} ${cat.color.bg.replace('/10', '/5')}`}>
                                        <div className="flex items-start gap-4">
                                            <div className={`w-12 h-12 rounded-2xl ${cat.color.bg} ${cat.color.border} border flex items-center justify-center shrink-0`}>
                                                <cat.icon className={`w-6 h-6 ${cat.color.text}`} />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{cat.title}</h2>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{cat.description}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Article List */}
                                    <div className="p-2">
                                        {cat.articles.map(article => {
                                            const isMasterclass = article.type === 'masterclass';
                                            return (
                                                <button
                                                    key={article.id}
                                                    onClick={() => setSelectedArticle(article)}
                                                    className="w-full text-left p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors group flex gap-4 items-start"
                                                >
                                                    <div className={`p-2 rounded-xl shrink-0 transition-colors ${isMasterclass
                                                        ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 group-hover:bg-amber-200 dark:group-hover:bg-amber-500/20'
                                                        : 'bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-zinc-700'
                                                        }`}
                                                    >
                                                        {getArticleIcon(article.type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className={`font-semibold text-sm mb-1 truncate transition-colors ${isMasterclass
                                                            ? 'text-amber-700 dark:text-amber-400 group-hover:text-amber-800 dark:group-hover:text-amber-300'
                                                            : 'text-gray-900 dark:text-gray-100 group-hover:text-violet-600 dark:group-hover:text-violet-400'
                                                            }`}>
                                                            {article.title}
                                                        </h3>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                                            {article.excerpt}
                                                        </p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* MODAL */}
            <ArticleViewer
                article={selectedArticle}
                onClose={() => setSelectedArticle(null)}
            />
        </div>
    );
};

export default KnowledgeCenter;
