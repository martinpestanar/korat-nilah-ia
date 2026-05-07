import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, GraduationCap } from 'lucide-react';
import { KBArticle, kbData } from '../../services/kbData';
import ArticleViewer from './ArticleViewer';
import { AcademyHome } from '../Academy/AcademyHome';

interface Props {
    onBack: () => void;
}

const KnowledgeCenter: React.FC<Props> = ({ onBack }) => {
    const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(null);
    const [completedNodes, setCompletedNodes] = useState<string[]>([]);

    // Load progress from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('nilah_academy_progress');
        if (saved) {
            try {
                setCompletedNodes(JSON.parse(saved));
            } catch (e) {
                console.error('Error loading academy progress', e);
            }
        }
    }, []);

    // Save progress to localStorage when it changes
    const handleComplete = (articleId: string) => {
        if (!completedNodes.includes(articleId)) {
            const newValue = [...completedNodes, articleId];
            setCompletedNodes(newValue);
            localStorage.setItem('nilah_academy_progress', JSON.stringify(newValue));
        }
    };

    const getNextArticle = () => {
        if (!selectedArticle) return null;
        for (const cat of kbData) {
            const idx = cat.articles.findIndex(a => a.id === selectedArticle.id);
            if (idx !== -1) {
                if (idx + 1 < cat.articles.length) {
                    return cat.articles[idx + 1];
                }
                return null;
            }
        }
        return null;
    };

    const nextArticle = getNextArticle();

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black pb-20 font-sans selection:bg-brand/30">

            {/* ─── STICKY HEADER ─── */}
            <div className="sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 transition-colors">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-6">
                        <button
                            onClick={onBack}
                            className="group p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-zinc-100 dark:bg-zinc-900 hover:bg-brand hover:text-white transition-all active:scale-90"
                        >
                            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div className="h-6 sm:h-8 w-px bg-zinc-200 dark:bg-zinc-800" />
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <GraduationCap className="w-3.5 h-3.5 text-brand" />
                                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">Inteligencia Korat</span>
                            </div>
                            <h2 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white leading-none">Nilah Academy</h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="hidden xs:block text-right mr-1 sm:mr-2">
                        <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">Estado</div>
                        <div className="text-[10px] sm:text-xs font-black text-brand uppercase">En ascenso</div>
                      </div>
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-brand" />
                      </div>
                    </div>
                </div>
            </div>

            {/* ─── MAIN CONTENT ─── */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 sm:mb-12"
                >
                  <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-zinc-900 dark:text-white tracking-tighter mb-4 leading-[0.95]">
                    Tu camino hacia el <span className="text-brand italic">éxito total.</span>
                  </h1>
                  <p className="text-zinc-500 dark:text-zinc-400 text-base sm:text-lg max-w-2xl font-medium leading-relaxed">
                    Aprende a automatizar tu salón con Nilah y masteriza las métricas financieras que te harán crecer sin límites.
                  </p>
                </motion.div>

                <AcademyHome 
                  onBack={onBack}
                  onSelectArticle={setSelectedArticle}
                  completedNodes={completedNodes}
                />
            </div>

            {/* ARTICLE VIEWER MODAL */}
            <ArticleViewer
                article={selectedArticle}
                onClose={() => setSelectedArticle(null)}
                onComplete={handleComplete}
                isCompleted={selectedArticle ? completedNodes.includes(selectedArticle.id) : false}
                hasNext={!!nextArticle}
                onNext={nextArticle ? () => setSelectedArticle(nextArticle) : undefined}
            />

            {/* ─── BACKGROUND GLOWS ─── */}
            <div className="fixed top-0 left-0 w-[50vw] h-[50vh] bg-brand/5 blur-[120px] -z-10 pointer-events-none" />
            <div className="fixed bottom-0 right-0 w-[50vw] h-[50vh] bg-blue-500/5 blur-[120px] -z-10 pointer-events-none" />
        </div>
    );

};

export default KnowledgeCenter;

