import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, BookOpen } from 'lucide-react';
import { KBCategory } from '../../services/kbData';

interface AcademyCategoryCardProps {
    category: KBCategory;
    onClick: () => void;
    completedCount: number;
    delay?: number;
}

export const AcademyCategoryCard: React.FC<AcademyCategoryCardProps> = ({ 
    category, 
    onClick, 
    completedCount, 
    delay = 0 
}) => {
    const totalArticles = category.articles.length;
    const progress = totalArticles > 0 ? (completedCount / totalArticles) * 100 : 0;
    const Icon = category.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="group relative cursor-pointer"
        >
            {/* Ambient Glow */}
            <div className="absolute inset-x-0 -bottom-4 h-20 bg-brand/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 shadow-sm hover:shadow-2xl hover:shadow-brand/10 transition-all border-b-4 hover:border-b-brand">
                <div className="flex items-start justify-between mb-6">
                    <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 group-hover:bg-brand group-hover:text-white transition-all duration-300 shadow-inner">
                        <Icon className="w-6 h-6" />
                    </div>
                    <div className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[9px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest border border-zinc-200 dark:border-zinc-700">
                        {category.level === 'App Mastery' ? 'App Mastery' : 'Business IQ'}
                    </div>
                </div>

                <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2 leading-tight group-hover:text-brand transition-colors">
                    {category.title}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed line-clamp-2 font-medium">
                    {category.description}
                </p>

                <div className="space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-tighter">
                        <span className="text-zinc-400">{completedCount} de {totalArticles} completados</span>
                        <span className="text-brand">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden p-0.5 border border-zinc-200 dark:border-zinc-800">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="h-full bg-brand rounded-full shadow-[0_0_8px_rgba(var(--color-brand-rgb),0.3)]"
                        />
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-zinc-300" />
                        <span className="text-xs font-bold text-zinc-400">{totalArticles} artículos</span>
                    </div>
                    <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 group-hover:bg-brand group-hover:text-white transition-all">
                        <ChevronRight className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
