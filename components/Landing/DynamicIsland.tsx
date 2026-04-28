import React, { useState, useEffect } from 'react';
import { Target, Crown, Bot, MessageSquare, Gem, ArrowUp, Zap, AlertCircle, Star, Camera, Package, Play, Heart, HelpCircle } from 'lucide-react';

const SECTIONS = [
  { id: 'problema', icon: AlertCircle, label: 'Problema', color: 'text-red-500' },
  { id: 'marketing', icon: Target, label: 'Marketing', color: 'text-violet-500' },
  { id: 'fidelidad', icon: Crown, label: 'Fidelidad', color: 'text-amber-500' },
  { id: 'modos', icon: Bot, label: 'Asistente', color: 'text-emerald-500' },
  { id: 'inbox', icon: MessageSquare, label: 'Inbox', color: 'text-blue-500' },
  { id: 'diferenciadores', icon: Star, label: 'Ventajas', color: 'text-yellow-500' },
  { id: 'creative', icon: Camera, label: 'Visuales', color: 'text-pink-500' },
  { id: 'inventario', icon: Package, label: 'Inventario', color: 'text-teal-500' },
  { id: 'como-funciona', icon: Play, label: 'Proceso', color: 'text-orange-500' },
  { id: 'precios', icon: Gem, label: 'Precios', color: 'text-fuchsia-500' },
  { id: 'social-proof', icon: Heart, label: 'Prueba', color: 'text-rose-500' },
  { id: 'faq', icon: HelpCircle, label: 'FAQ', color: 'text-indigo-500' },
];

export const DynamicIsland: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
      setScrollProgress(progress);

      const current = SECTIONS.find(section => {
        const el = document.getElementById(section.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          return rect.top <= window.innerHeight * 0.4 && rect.bottom >= window.innerHeight * 0.4;
        }
        return false;
      });

      if (current) {
        setActiveSection(current.id);
      } else if (window.scrollY < window.innerHeight) {
        setActiveSection('');
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousedown', handleClickOutside);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const scrollTo = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setIsExpanded(false);
    }
  };

  const activeData = SECTIONS.find(s => s.id === activeSection);
  const ActiveIcon = activeData ? activeData.icon : Zap;

  return (
    <div className="fixed bottom-6 left-0 right-0 flex justify-center z-[100] pointer-events-none">
      <div 
        ref={containerRef}
        onClick={() => setIsExpanded(!isExpanded)}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        className={`pointer-events-auto relative flex items-center bg-gray-900/90 dark:bg-black/80 backdrop-blur-2xl border border-white/10 p-1 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] group ${
          isExpanded 
            ? 'rounded-[1.5rem] gap-1 md:gap-2 w-[92vw] md:w-auto px-4' 
            : 'rounded-full w-14 gap-0 justify-center hover:w-16'
        }`}
        style={{ height: '58px' }}
      >
        {/* Expanded Mode: Section Icons */}
        <div 
          className={`flex items-center overflow-x-auto transition-all duration-500 ${isExpanded ? 'opacity-100 max-w-full' : 'opacity-0 scale-90 pointer-events-none max-w-0'}`}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            
            return (
              <button
                key={section.id}
                onClick={(e) => scrollTo(section.id, e)}
                className={`relative flex flex-col items-center justify-center h-12 transition-all duration-300 flex-1 min-w-[60px] md:min-w-[70px] ${
                  isActive ? 'scale-110' : 'hover:bg-white/5 rounded-2xl active:scale-90'
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-white/10 rounded-2xl border border-white/10 shadow-inner blur-[2px]" />
                )}
                <Icon size={isExpanded ? 20 : 18} className={`mb-1 ${isActive ? section.color : 'text-gray-400 dark:text-gray-300'} transition-colors`} />
                <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest ${isActive ? section.color : 'text-gray-400 dark:text-gray-200'}`}>
                  {section.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Collapsed Mode: Status & Progress */}
        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
            isExpanded ? 'opacity-0 scale-50 pointer-events-none' : 'opacity-100 scale-100'
          }`}>
          <div className="relative w-11 h-11 flex items-center justify-center">
            {/* Scroll Progress Ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="22" cy="22" r="19"
                className="stroke-white/5"
                strokeWidth="1.5" fill="none"
              />
              <circle
                cx="22" cy="22" r="19"
                className={`stroke-current ${activeData ? activeData.color : 'text-violet-500'} transition-all duration-300`}
                strokeWidth="2.5" fill="none"
                strokeDasharray="119.3"
                strokeDashoffset={119.3 - (119.3 * scrollProgress) / 100}
                strokeLinecap="round"
              />
            </svg>
            
            {/* Active Icon */}
            <ActiveIcon size={20} className={`${activeData ? activeData.color : 'text-violet-500'} transition-colors transform group-hover:scale-110 duration-300`} />
          </div>
        </div>
      </div>
    </div>
  );
};
