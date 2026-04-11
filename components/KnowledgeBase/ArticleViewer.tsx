import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, BookOpen, Lightbulb, PlayCircle, Sparkles, CheckCircle2 as BookCheck, ArrowRight } from 'lucide-react';
import { KBArticle } from '../../services/kbData';

interface Props {
    article: KBArticle | null;
    onClose: () => void;
    onComplete?: (articleId: string) => void;
    isCompleted?: boolean;
    onNext?: () => void;
    hasNext?: boolean;
}

const ArticleViewer: React.FC<Props> = ({ article, onClose, onComplete, isCompleted, onNext, hasNext }) => {
    if (!article) return null;

    const isMasterclass = article.type === 'masterclass';
    const isVideo = article.type === 'video';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 32, stiffness: 300 }}
                    className={`w-full max-w-2xl bg-white dark:bg-zinc-900 h-[94vh] sm:h-auto sm:max-h-[90vh] rounded-t-[2.5rem] sm:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border border-zinc-200 dark:border-zinc-800 ${isMasterclass ? 'ring-2 ring-brand/20' : ''}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Progress indicator at the top */}
                    <div className="absolute top-0 inset-x-0 h-1 z-20">
                      {isCompleted ? (
                        <div className="h-full w-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                      ) : (
                        <div className="h-full w-full bg-zinc-100 dark:bg-zinc-800" />
                      )}
                    </div>

                    {/* Mobile Drag Handle */}
                    <div className="sm:hidden flex justify-center pt-3 pb-1">
                        <div className="w-12 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                    </div>

                    {/* Header */}
                    <div className={`relative px-6 py-4 sm:py-6 flex items-center justify-between border-b ${isMasterclass ? 'bg-brand/5 border-brand/10' : 'border-zinc-100 dark:border-zinc-800'}`}>
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${isMasterclass ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'}`}>
                                {isMasterclass ? <Lightbulb className="w-5 h-5" /> : isVideo ? <PlayCircle className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-black uppercase tracking-widest ${isMasterclass ? 'text-brand' : 'text-zinc-400 dark:text-zinc-500'}`}>
                                      {isMasterclass ? 'Nilah Masterclass' : isVideo ? 'Video Tutorial' : 'Manual Técnico'}
                                  </span>
                                  {article.difficulty && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-bold border border-zinc-200 dark:border-zinc-700 uppercase">
                                      {article.difficulty}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                                    <div className="flex items-center gap-1.5 font-medium">
                                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                                      <span>{article.readTime}</span>
                                    </div>
                                    {isCompleted && (
                                      <div className="flex items-center gap-1.5 text-emerald-500 font-bold">
                                        <BookCheck className="w-3.5 h-3.5" />
                                        Leído
                                      </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className={`p-2.5 rounded-2xl transition-all ${isMasterclass ? 'hover:bg-brand/10 text-brand' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}`}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content Scroll Area */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar scroll-smooth">
                        <motion.h1 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white mb-4 leading-[1.1] tracking-tight"
                        >
                            {article.title}
                        </motion.h1>
                        
                        <p className="text-lg md:text-xl text-zinc-500 dark:text-zinc-400 mb-10 leading-relaxed font-semibold">
                            {article.excerpt}
                        </p>

                        {/* Video Mockup if needed */}
                        {isVideo && (
                          <div className="aspect-video w-full bg-zinc-100 dark:bg-zinc-800 rounded-3xl mb-10 overflow-hidden border border-zinc-200 dark:border-zinc-700 relative group cursor-pointer flex items-center justify-center">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                            <div className="h-16 w-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 transition-transform group-hover:scale-110">
                              <PlayCircle className="w-8 h-8 text-white fill-white/20" />
                            </div>
                            <span className="absolute bottom-4 left-4 text-white text-[10px] font-black tracking-widest uppercase opacity-60">Reproducir Tutorial</span>
                          </div>
                        )}

                        {/* Rich Content Area */}
                        <div
                            className="prose prose-sm sm:prose-base dark:prose-invert max-w-none
                prose-headings:font-black prose-headings:text-zinc-900 dark:prose-headings:text-white
                prose-h3:text-2xl prose-h3:mb-6 prose-h3:mt-10
                prose-p:text-zinc-600 dark:prose-p:text-zinc-300 prose-p:leading-[1.8] prose-p:mb-6
                prose-li:text-zinc-600 dark:prose-li:text-zinc-300 prose-li:mb-4
                prose-ul:list-none prose-ul:pl-0 prose-ul:mb-8
                prose-ul-li:before:content-['→'] prose-ul-li:before:text-brand prose-ul-li:before:mr-3 prose-ul-li:before:font-bold
                prose-strong:text-zinc-900 dark:prose-strong:text-white prose-strong:font-black
                prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-10"
                            dangerouslySetInnerHTML={{ __html: article.content }}
                        />

                        {/* Nilah's Pro Tip */}
                        {article.proTip && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.98 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                className="mt-12 p-8 rounded-[2.5rem] bg-brand text-white relative overflow-hidden group shadow-xl shadow-brand/20"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                  <Sparkles className="w-24 h-24" />
                                </div>
                                <div className="relative z-10 flex flex-col sm:flex-row gap-6 items-start">
                                    <div className="w-12 h-12 shrink-0 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                                        <Sparkles className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black text-white/70 mb-2 tracking-[0.2em] flex items-center gap-2 uppercase">
                                          NILAH PRO TIP
                                          <div className="h-px flex-1 bg-white/20 min-w-[20px]" />
                                        </h4>
                                        <p className="text-lg text-white leading-relaxed font-bold italic">
                                            "{article.proTip}"
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Footer Action */}
                    <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between gap-4">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 rounded-2xl text-zinc-500 dark:text-zinc-400 text-sm font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            Cerrar
                        </button>
                        
                        <div className="flex items-center gap-3">
                            {isCompleted && (
                                <div className="hidden sm:flex items-center gap-2 text-emerald-500 font-bold text-sm px-6 py-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                                    <BookCheck className="w-4 h-4" />
                                    Completado
                                </div>
                            )}

                            {!isCompleted && onComplete ? (
                                <button
                                    onClick={() => {
                                        onComplete(article.id);
                                        if (hasNext && onNext) {
                                            onNext();
                                        } else {
                                            onClose();
                                        }
                                    }}
                                    className="px-6 py-3 rounded-2xl bg-brand hover:brightness-110 text-white text-sm font-black shadow-lg shadow-brand/25 transition-all active:scale-95 flex items-center gap-2"
                                >
                                    <BookCheck className="w-4 h-4 shrink-0" />
                                    <span>Marcar como leído {hasNext && 'y Seguir'}</span>
                                </button>
                            ) : (
                                hasNext && onNext && (
                                    <button
                                        onClick={onNext}
                                        className="px-6 py-3 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 text-sm font-black transition-all active:scale-95 flex items-center gap-2"
                                    >
                                        <span>Siguiente Lección</span>
                                        <ArrowRight className="w-4 h-4 shrink-0" />
                                    </button>
                                )
                            )}
                        </div>
                    </div>

                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ArticleViewer;
