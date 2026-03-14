import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, BookOpen, Lightbulb, PlayCircle, Sparkles } from 'lucide-react';
import { KBArticle } from '../../services/kbData';

interface Props {
    article: KBArticle | null;
    onClose: () => void;
}

const ArticleViewer: React.FC<Props> = ({ article, onClose }) => {
    if (!article) return null;

    const isMasterclass = article.type === 'masterclass';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className={`w-full max-w-2xl bg-white dark:bg-dark-card h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 dark:border-dark-border ${isMasterclass ? 'ring-1 ring-amber-500/20' : ''}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className={`relative px-6 py-5 flex items-center justify-between border-b ${isMasterclass ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-100 dark:border-amber-900/30' : 'border-gray-100 dark:border-dark-border'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${isMasterclass ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' : 'bg-gray-100 dark:bg-dark-bg text-gray-500 dark:text-gray-400'}`}>
                                {isMasterclass ? <Lightbulb className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                            </div>
                            <div>
                                <span className={`text-[10px] font-black uppercase tracking-wider ${isMasterclass ? 'text-amber-600 dark:text-amber-500' : 'text-gray-400 dark:text-gray-500'}`}>
                                    {isMasterclass ? 'Nilah Masterclass' : 'Documentación'}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{article.readTime} lect.</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className={`p-2 rounded-full transition-colors ${isMasterclass ? 'hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-400' : 'hover:bg-gray-100 dark:hover:bg-dark-bg text-gray-400'}`}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content Scroll Area */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                            {article.title}
                        </h1>
                        <p className="text-lg text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                            {article.excerpt}
                        </p>

                        {/* Injected HTML Content (Simulating a rich text viewer) */}
                        <div
                            className="prose prose-sm sm:prose-base dark:prose-invert max-w-none
                prose-headings:font-bold prose-headings:text-gray-800 dark:prose-headings:text-gray-100
                prose-h3:text-lg prose-h3:mb-3 prose-h3:mt-8
                prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-4
                prose-li:text-gray-600 dark:prose-li:text-gray-300 prose-li:mb-2
                prose-ul:list-disc prose-ul:pl-5 prose-ul:mb-6
                prose-ol:list-decimal prose-ol:pl-5 prose-ol:mb-6"
                            dangerouslySetInnerHTML={{ __html: article.content }}
                        />

                        {/* Nilah's Pro Tip */}
                        {article.proTip && (
                            <div className="mt-10 p-5 rounded-2xl bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/10 dark:to-indigo-900/10 border border-violet-100 dark:border-violet-500/10 flex gap-4">
                                <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-500/20 relative">
                                    <Sparkles className="w-5 h-5 text-white" />
                                    <div className="absolute inset-0 rounded-full border border-white/20"></div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-violet-800 dark:text-violet-300 mb-1">Nilah Pro Tip</h4>
                                    <p className="text-sm text-violet-700/80 dark:text-violet-200/80 leading-relaxed italic">
                                        "{article.proTip}"
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Action (Optional) */}
                    <div className="p-4 border-t border-gray-100 dark:border-dark-border bg-gray-50/50 dark:bg-dark-bg/50 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-5 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                        >
                            Entendido
                        </button>
                    </div>

                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ArticleViewer;
