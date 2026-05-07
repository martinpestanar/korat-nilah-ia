/**
 * AudienceMarketplaceShowcase.tsx & LoyaltyEngineShowcase.tsx
 * ─────────────────────────────────────────────────────────────
 * Mobile-first, highly interactive landing page showcases.
 * Uses CSS animations only (no framer-motion dependency needed).
 * ─────────────────────────────────────────────────────────────
 */

// Inject keyframes once
if (typeof document !== 'undefined' && !document.getElementById('nilah-landing-anims')) {
  const style = document.createElement('style');
  style.id = 'nilah-landing-anims';
  style.textContent = `
    @keyframes slideUpFade {
      from { opacity: 0; transform: translateY(32px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  `;
  document.head.appendChild(style);
}

import React, { useState, useEffect, useRef } from 'react';
import {
  Crown, Star, Users, Scissors, Sparkles, Zap, Gift,
  TrendingUp, Heart, Calendar, Target, Award, ChevronRight, ArrowRight, X, BarChart3
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────

interface AudienceCard {
  id: string;
  layer: 'crm' | 'ia' | 'servicio';
  emoji: string;
  title: string;
  subtitle: string;
  count: number;
  color: string;
  gradient: string;
  border: string;
  badge: string;
  badgeColor: string;
  sampleMessage: string;
  roi: string;
}

// ─── Data ─────────────────────────────────────────────────────────

const AUDIENCES: AudienceCard[] = [
  // Layer 1: CRM
  {
    id: 'vip-risk',
    layer: 'crm',
    emoji: '👑',
    title: 'VIP en Riesgo',
    subtitle: 'No vinieron en 30+ días',
    count: 8,
    color: 'amber',
    gradient: 'from-amber-500/20 to-orange-500/10',
    border: 'border-amber-400/40',
    badge: 'CRM',
    badgeColor: 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-400/30',
    sampleMessage: 'Lupita, tu lugar de siempre te extraña 💛 ¿Cuándo nos encontramos?',
    roi: '+S/320 est.',
  },
  {
    id: 'new-no-return',
    layer: 'crm',
    emoji: '✨',
    title: 'Nuevas sin 2da Visita',
    subtitle: 'Clientas que vinieron 1 sola vez',
    count: 34,
    color: 'emerald',
    gradient: 'from-emerald-500/20 to-teal-500/10',
    border: 'border-emerald-400/40',
    badge: 'CRM',
    badgeColor: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-400/30',
    sampleMessage: '¿Qué tal te quedó la última vez? Tenemos algo para tu próxima visita 🎁',
    roi: '+S/510 est.',
  },
  {
    id: 'lost-90',
    layer: 'crm',
    emoji: '🛸',
    title: 'Rescate 90 Días',
    subtitle: 'Clientas que "se fugaron"',
    count: 19,
    color: 'rose',
    gradient: 'from-rose-500/20 to-pink-500/10',
    border: 'border-rose-400/40',
    badge: 'CRM',
    badgeColor: 'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-400/30',
    sampleMessage: 'Te extrañamos! Tenemos algo especial solo para volver ❤️',
    roi: '+S/285 est.',
  },
  // Layer 2: IA
  {
    id: 'slow-days',
    layer: 'ia',
    emoji: '📅',
    title: 'Slow Days Rescue',
    subtitle: 'IA detecta días flojos esta semana',
    count: 41,
    color: 'violet',
    gradient: 'from-violet-500/20 to-purple-500/10',
    border: 'border-violet-400/40',
    badge: 'IA',
    badgeColor: 'bg-violet-100 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-400/30',
    sampleMessage: 'Tenemos un slot libre el miércoles a las 3pm — justo para tu retoque 🌟',
    roi: '+S/180 est.',
  },
  {
    id: 'cross-sell',
    layer: 'ia',
    emoji: '🎯',
    title: 'Cross-sell Inteligente',
    subtitle: 'IA: clientas de un servicio listas para otro',
    count: 27,
    color: 'blue',
    gradient: 'from-blue-500/20 to-cyan-500/10',
    border: 'border-blue-400/40',
    badge: 'IA',
    badgeColor: 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-400/30',
    sampleMessage: 'Ya eres experta en tus uñas 💅 ¿Probamos algo especial para tus pestañas?',
    roi: '+S/405 est.',
  },
  {
    id: 'birthdays',
    layer: 'ia',
    emoji: '🎂',
    title: 'Cumpleañeras del Mes',
    subtitle: 'Sorpresa perfecta = cita asegurada',
    count: 12,
    color: 'pink',
    gradient: 'from-pink-500/20 to-fuchsia-500/10',
    border: 'border-pink-400/40',
    badge: 'IA',
    badgeColor: 'bg-pink-100 dark:bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-200 dark:border-pink-400/30',
    sampleMessage: '¡Feliz cumple, linda! 🎉 Tu regalo de nosotros: 15% OFF en cualquier servicio este mes.',
    roi: '+S/240 est.',
  },
  // Layer 3: Servicios
  {
    id: 'acrilicas',
    layer: 'servicio',
    emoji: '💅',
    title: 'Fan de Acrílicas',
    subtitle: 'Sin retoque en 21+ días',
    count: 23,
    color: 'fuchsia',
    gradient: 'from-fuchsia-500/20 to-pink-500/10',
    border: 'border-fuchsia-400/40',
    badge: 'Servicio',
    badgeColor: 'bg-fuchsia-100 dark:bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-400 border-fuchsia-200 dark:border-fuchsia-400/30',
    sampleMessage: '¡Tus acrílicas te llaman! Ya va siendo hora del retoque ✨',
    roi: '+S/345 est.',
  },
  {
    id: 'pestanas',
    layer: 'servicio',
    emoji: '👁️',
    title: 'Clientas de Pestañas',
    subtitle: 'Relleno pendiente hace 20+ días',
    count: 17,
    color: 'indigo',
    gradient: 'from-indigo-500/20 to-violet-500/10',
    border: 'border-indigo-400/40',
    badge: 'Servicio',
    badgeColor: 'bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-400/30',
    sampleMessage: 'Tus pestañas merecen atención 👁️ Tenemos tu spot esta semana.',
    roi: '+S/255 est.',
  },
  {
    id: 'polygel',
    layer: 'servicio',
    emoji: '🌸',
    title: 'Polygel & Semi',
    subtitle: 'Especialistas en duración',
    count: 31,
    color: 'rose',
    gradient: 'from-rose-500/15 to-fuchsia-500/10',
    border: 'border-rose-400/40',
    badge: 'Servicio',
    badgeColor: 'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-400/30',
    sampleMessage: 'Tu polygel necesita amor 🌸 ¡Aprovecha el miércoles con 10% off!',
    roi: '+S/465 est.',
  },
];

const LAYER_TABS = [
  { key: 'crm', label: 'CRM Vital', emoji: '💛', desc: 'Tus mejores aliadas' },
  { key: 'ia', label: 'IA Smart', emoji: '🧠', desc: 'Detectadas por la IA' },
  { key: 'servicio', label: 'Por Servicio', emoji: '✂️', desc: 'Por lo que hacen' },
] as const;



// ─── Audience Marketplace Showcase ─────────────────────────────

export const AudienceMarketplaceShowcase: React.FC = () => {
  const [activeLayer, setActiveLayer] = useState<'crm' | 'ia' | 'servicio'>('crm');
  const [visibleCards, setVisibleCards] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtered = AUDIENCES.filter(a => a.layer === activeLayer);

  // Animate cards in on tab switch
  useEffect(() => {
    setVisibleCards(new Set());
    const timer = setTimeout(() => {
      filtered.forEach((card, i) => {
        setTimeout(() => {
          setVisibleCards(prev => new Set(prev).add(card.id));
        }, i * 80);
      });
    }, 50);
    return () => clearTimeout(timer);
  }, [activeLayer]);

  const totalCount = filtered.reduce((s, c) => s + c.count, 0);

  return (
    <>
      {/* The section */}
      <div className="relative max-w-6xl mx-auto">
        {/* Component Header / Marketplace Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 text-left">
          <div>
          <div className="max-w-2xl">
            <h4 className="text-gray-900 dark:text-white font-black text-3xl md:text-5xl mb-4 flex items-center gap-4">
              <Target className="text-violet-500 w-8 h-8 md:w-10 md:h-10" /> Marketplace de Audiencias
            </h4>
            <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg leading-relaxed">
              No envíes el mismo mensaje de "Feliz Miércoles" a todas. Nilah segmenta tu base de datos en 
              <span className="text-gray-900 dark:text-white font-bold"> clusters inteligentes </span> 
              según el comportamiento real de compra.
              <span className="text-violet-600 dark:text-violet-400 font-bold block mt-2">Descubre el impacto potencial de cada segmento inteligente.</span>
            </p>
          </div>
          </div>
          <div className="flex items-center gap-4 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-6 py-3 rounded-2xl">
            <div className="text-center md:text-right">
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest leading-none mb-1">Impacto Potencial</p>
              <p className="text-xl md:text-2xl font-black text-emerald-600 dark:text-emerald-400 leading-none">+$1,540.00</p>
            </div>
            <div className="h-10 w-px bg-gray-300 dark:bg-white/10 mx-2 hidden md:block" />
            <div className="hidden md:block">
              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-black tracking-widest leading-none mb-1">Clientas</p>
              <p className="text-xl font-black text-gray-900 dark:text-white leading-none">{AUDIENCES.reduce((s, c) => s + c.count, 0)}</p>
            </div>
          </div>
        </div>

        {/* Layer Tabs - More "Native App" feel */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide px-0.5">
          {LAYER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveLayer(tab.key)}
              className={`flex-shrink-0 flex items-center flex-col sm:flex-row gap-2 px-6 py-3 md:py-4 rounded-[1.5rem] text-sm font-bold border transition-all duration-300 ${
                activeLayer === tab.key
                  ? 'bg-white dark:bg-white text-black border-white shadow-[0_0_20px_rgba(0,0,0,0.1)] dark:shadow-[0_0_20px_rgba(255,255,255,0.15)] scale-[1.02]'
                  : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10'
              }`}
            >
              <span className="text-xl">{tab.emoji}</span>
              <div className="text-left">
                <p className="leading-none">{tab.label}</p>
                <p className={`text-[9px] mt-1 font-medium ${activeLayer === tab.key ? 'text-black/60' : 'text-gray-500'}`}>{tab.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Cards Grid - Desktop 3 columns, Mobile 1 column */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 min-h-[400px]">
          {filtered.map((card) => (
            <div
              key={card.id}
              className={`group relative text-left rounded-[2.5rem] p-6 sm:p-8 border transition-all duration-700 ease-out flex flex-col h-full ${
                visibleCards.has(card.id) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              } bg-white dark:bg-[#0A0A0A]/80 backdrop-blur-xl border-gray-100 dark:border-white/5 hover:border-violet-500/30 dark:hover:border-white/20 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(139,92,246,0.15)] dark:hover:shadow-[0_20px_40px_-15px_rgba(255,255,255,0.05)]`}
              style={{ 
                maxWidth: '400px',
                margin: '0 auto',
                width: '100%'
              }}
            >
              {/* Magic Top Glow Border */}
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${card.gradient.replace('/20', '').replace('/15', '').replace('/10', '')} opacity-40 group-hover:opacity-100 transition-opacity duration-500`}></div>
              
              {/* Card Gradient Background Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-5 group-hover:opacity-20 transition-opacity duration-500`} />
              
              {/* Glow Blur Effect Inside */}
              <div className={`absolute -right-16 -top-16 w-32 h-32 rounded-full bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-40 blur-3xl transition-opacity duration-500`} />

              {/* Header: Icon & Badge */}
              <div className="flex justify-between items-start mb-6 relative z-20">
                <div className="relative flex items-center">
                  <div className={`p-4 rounded-[1.25rem] bg-gradient-to-br ${card.gradient} border border-white/50 dark:border-white/10 group-hover:scale-110 transition-transform duration-500 shadow-sm relative overflow-hidden z-20`}>
                    <div className="absolute inset-0 bg-white/40 dark:bg-black/20 mix-blend-overlay"></div>
                    <span className="text-4xl block relative z-10 transform group-hover:rotate-6 transition-transform duration-500" style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.1))' }}>
                      {card.emoji}
                    </span>
                  </div>
                </div>

                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border ${card.badgeColor} backdrop-blur-sm shadow-lg z-20`}>
                  {card.badge}
                </div>
              </div>

              {/* Title & Desc */}
              <div className="flex-1 relative z-10">
                <h4 className={`font-black text-xl md:text-2xl leading-tight mb-3 transition-colors bg-clip-text text-transparent bg-gradient-to-b from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 group-hover:from-violet-600 group-hover:to-fuchsia-600 dark:group-hover:from-white dark:group-hover:to-white`}>
                  {card.title}
                </h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base leading-relaxed line-clamp-2 md:line-clamp-none mb-6">
                  {card.subtitle}
                </p>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <BarChart3 size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-black">LTV Total</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">S/ 1,450.00</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats & Potential Value */}
              <div className="mt-auto relative z-10">
                <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-300 dark:via-white/20 to-transparent mb-6" />
                <div className="flex items-end justify-between">
                  <div className="flex flex-col">
                    <span className="text-3xl font-black text-gray-900 dark:text-white leading-none tabular-nums">{card.count}</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-black tracking-widest mt-2 px-1 border-l-2 border-violet-500/50">clientas</span>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1.5 flex items-center justify-end gap-1">
                      Potencial <Sparkles size={10} className="text-amber-500 dark:text-amber-400" />
                    </p>
                    <p className={`text-xl font-black bg-clip-text text-transparent bg-gradient-to-r ${card.gradient.replace('/20', '').replace('/15', '').replace('/10', '')} group-hover:scale-110 group-hover:-translate-y-1 transition-all origin-right`}>
                      {card.roi}
                    </p>
                  </div>
                </div>
              </div>


            </div>
          ))}
        </div>

        {/* Marketplace Disclaimer */}
        <div className="mt-12 flex flex-col items-center gap-4">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-400 text-sm">
            <Sparkles size={16} className="text-amber-500 dark:text-amber-400" />
            <span>Este Marketplace se genera automáticamente según los <b className="text-gray-900 dark:text-white">servicios reales</b> de tu salón.</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500 text-xs">
            <Star size={12} className="text-violet-500/50" />
            <span>Segmentos adaptados al catálogo de servicios de tu negocio</span>
          </div>
        </div>
      </div>

    </>
  );
};

// ─── Loyalty Engine Showcase ────────────────────────────────────

interface RatingEntry {
  name: string;
  service: string;
  stars: number;
  comment: string;
  time: string;
  avatar: string;
}

const RATINGS: RatingEntry[] = [
  { name: 'Andrea M.', service: 'Balayage', stars: 5, comment: '¡El mejor balayage que me han hecho! Volveré sí o sí 🥰', time: 'hace 2h', avatar: '👩🏻‍🦱' },
  { name: 'Camila R.', service: 'Acrílicas Diseño', stars: 5, comment: 'Quedé enamorada del diseño floral ✨ gracias', time: 'hace 4h', avatar: '👩🏽' },
  { name: 'Sofía V.', service: 'Pestañas Volumen', stars: 4, comment: 'Excelente atención, vuelvo la próxima semana!', time: 'ayer', avatar: '👩🏼‍🦰' },
  { name: 'Luciana P.', service: 'Polygel Natural', stars: 5, comment: 'Mi especialista es la mejor de Lima! 💜', time: 'ayer', avatar: '👩🏾' },
];

const PRIZES = [
  { emoji: '☕', name: 'Café Detox', points: 100, category: 'Cortesía' },
  { emoji: '💅', name: '50% OFF Manicura', points: 250, category: 'Descuentos' },
  { emoji: '🧴', name: 'Hidratación Profunda', points: 400, category: 'Tratamientos' },
  { emoji: '🎁', name: 'Servicio Gratis', points: 800, category: 'Premium' },
];

const STAFF_STARS = [
  { name: 'Valeria', role: 'Uñas', rating: 4.9, reviews: 47, avatar: '👩🏻', color: 'from-fuchsia-500 to-pink-500' },
  { name: 'Daniela', role: 'Cabello', rating: 4.8, reviews: 38, avatar: '👩🏽‍🦱', color: 'from-violet-500 to-indigo-500' },
  { name: 'Mariana', role: 'Pestañas', rating: 4.7, reviews: 29, avatar: '👩🏼', color: 'from-amber-500 to-orange-500' },
];

export const LoyaltyEngineShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'puntos' | 'ratings' | 'staff'>('puntos');
  const [currentRating, setCurrentRating] = useState(0);
  const [animPts, setAnimPts] = useState(0);
  const [showPointsAnim, setShowPointsAnim] = useState(false);

  // Animate points counter
  useEffect(() => {
    if (activeTab !== 'puntos') return;
    const timer = setTimeout(() => {
      setShowPointsAnim(true);
      let start = 0;
      const target = 320;
      const step = Math.ceil(target / 40);
      const interval = setInterval(() => {
        start += step;
        if (start >= target) { setAnimPts(target); clearInterval(interval); }
        else setAnimPts(start);
      }, 30);
      return () => clearInterval(interval);
    }, 300);
    return () => clearTimeout(timer);
  }, [activeTab]);

  // Auto-rotate ratings
  useEffect(() => {
    if (activeTab !== 'ratings') return;
    const interval = setInterval(() => {
      setCurrentRating(p => (p + 1) % RATINGS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [activeTab]);

  return (
    <div className="relative">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-4">
          <Heart size={12} />
          Motor de Fidelidad & Calidad
        </div>
        <h3 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
          Nilah no solo atrae clientas.{' '}
          <span className="bg-gradient-to-r from-amber-600 via-orange-500 to-yellow-600 dark:from-amber-400 dark:via-orange-400 dark:to-yellow-500 bg-clip-text text-transparent font-black">
            Las blinda de por vida.
          </span>
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          Puntos, premios y reputación: el combo letal para que tu clienta no piense en irse a la competencia. 
          <span className="text-amber-600 dark:text-amber-400 font-medium block mt-1 italic">"La gamificación de tu salón, en piloto automático."</span>
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide px-1">
        {[
          { key: 'puntos', label: 'Puntos & Premios', emoji: '⭐' },
          { key: 'ratings', label: 'Calificaciones', emoji: '💬' },
          { key: 'staff', label: 'Top Staff', emoji: '🏆' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold border transition-all duration-200 active:scale-95 ${
              activeTab === tab.key
                ? 'bg-amber-500 border-amber-400 text-white shadow-lg shadow-amber-500/30'
                : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span>{tab.emoji}</span>
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[380px]">
        {/* ── PUNTOS & PREMIOS ── */}
        {activeTab === 'puntos' && (
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Points progress card */}
            <div className="bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-amber-400/30 rounded-3xl p-5 relative overflow-hidden">
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center">
                    <Star size={18} className="text-amber-600 dark:text-amber-400" fill="currentColor" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-white/50 uppercase tracking-wider">Puntos de Camila</p>
                    <p className="text-[11px] text-amber-600 dark:text-amber-400">VIP · 14 visitas</p>
                  </div>
                </div>

                {/* Big number */}
                <div className="mb-4">
                  <p className="text-5xl font-black text-gray-900 dark:text-white tabular-nums">
                    {animPts.toLocaleString()}
                    <span className="text-2xl text-gray-400 dark:text-white/40 ml-1">pts</span>
                  </p>
                  <p className="text-sm text-gray-500 dark:text-white/50 mt-1">le faltan <span className="text-amber-600 dark:text-amber-400 font-bold">80 pts</span> para su premio 🎁</p>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-[11px] text-gray-400 dark:text-white/40 mb-1.5">
                    <span>0 pts</span>
                    <span>400 pts → Hidratación Profunda</span>
                  </div>
                  <div className="h-3 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-1000"
                      style={{ width: showPointsAnim ? '80%' : '0%' }}
                    />
                  </div>
                </div>

                {/* Last earn */}
                <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">✅</span>
                    <div>
                      <p className="text-xs text-gray-800 dark:text-white font-semibold">Acrílicas diseño</p>
                      <p className="text-[11px] text-gray-400 dark:text-white/40">hoy · visita #14</p>
                    </div>
                  </div>
                  <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm">+50 pts</span>
                </div>
              </div>
            </div>

            {/* Prizes grid */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-400 dark:text-white/50 uppercase tracking-wider px-1">🎁 Premio Canjeables</p>
              {PRIZES.map((prize, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-3.5 transition-all duration-200 hover:border-amber-400/30 hover:bg-amber-500/5 group ${
                    i === 2 ? 'ring-2 ring-amber-400/30 bg-amber-100/50 dark:bg-amber-500/10 border-amber-400/30' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{prize.emoji}</span>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{prize.name}</p>
                      <p className="text-[11px] text-gray-500 dark:text-white/40">{prize.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-black ${i === 2 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-white/60'}`}>{prize.points} pts</p>
                    {i === 2 && <p className="text-[10px] text-amber-600 dark:text-amber-400/70">¡Próximo!</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CALIFICACIONES ── */}
        {activeTab === 'ratings' && (
          <div className="space-y-4">
            {/* Summary bar */}
            <div className="bg-gradient-to-r from-emerald-500/15 to-teal-500/10 border border-emerald-400/30 rounded-2xl p-4 flex items-center gap-4">
              <div className="text-center">
                <p className="text-4xl font-black text-gray-900 dark:text-white">4.9</p>
                <div className="flex gap-0.5 justify-center mt-1">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={12} className="text-amber-400" fill="currentColor" />
                  ))}
                </div>
                <p className="text-[11px] text-gray-500 dark:text-white/40 mt-0.5">186 reseñas</p>
              </div>
              <div className="flex-1 space-y-1.5">
                {[5,4,3].map(star => (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-400 dark:text-white/40 w-3">{star}</span>
                    <Star size={10} className="text-amber-400" fill="currentColor" />
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full"
                        style={{ width: star === 5 ? '82%' : star === 4 ? '14%' : '4%' }}
                      />
                    </div>
                    <span className="text-[11px] text-gray-500 dark:text-white/40">{star === 5 ? '82%' : star === 4 ? '14%' : '4%'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Live feed — auto-rotates */}
            <div className="space-y-3">
              {RATINGS.map((r, i) => (
                <div
                  key={i}
                  className={`flex gap-3 bg-gray-50 dark:bg-white/5 border rounded-2xl p-4 transition-all duration-500 ${
                    i === currentRating
                      ? 'border-emerald-500/40 bg-emerald-50 text-gray-900 border-emerald-400 dark:bg-emerald-500/10 dark:text-white shadow-lg dark:shadow-emerald-500/10'
                      : 'border-gray-100 dark:border-white/10'
                  }`}
                >
                  <span className="text-2xl flex-shrink-0">{r.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{r.name}</span>
                        <span className="text-[11px] text-gray-400 dark:text-white/40 ml-2">· {r.service}</span>
                      </div>
                      <span className="text-[11px] text-gray-300 dark:text-white/30 flex-shrink-0">{r.time}</span>
                    </div>
                    <div className="flex gap-0.5 mb-1.5">
                      {[...Array(r.stars)].map((_, s) => (
                        <Star key={s} size={11} className="text-amber-400" fill="currentColor" />
                      ))}
                    </div>
                    <p className="text-[13px] text-gray-600 dark:text-white/70 leading-relaxed">{r.comment}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-400 dark:text-white/30">💬 Las calificaciones llegan directo por WhatsApp post-visita, sin apps extras</p>
            </div>
          </div>
        )}

        {/* ── TOP STAFF ── */}
        {activeTab === 'staff' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-white/50 text-center mb-2">Nilah genera el ranking automático según calificaciones reales de clientas</p>

            {STAFF_STARS.map((s, i) => (
              <div
                key={i}
                className="relative bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-5 overflow-hidden group hover:border-gray-200 dark:hover:border-white/20 transition-all"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${s.color} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity`} />
                <div className="flex items-center gap-4 relative">
                  {/* Rank badge */}
                  <div className={`flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white font-black text-sm shadow-lg`}>
                    #{i + 1}
                  </div>

                  {/* Avatar + info */}
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-3xl">{s.avatar}</span>
                    <div>
                      <p className="text-base font-bold text-gray-900 dark:text-white">{s.name}</p>
                      <p className="text-[12px] text-gray-500 dark:text-white/40">{s.role} · {s.reviews} reseñas</p>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="text-right">
                    <p className="text-2xl font-black text-gray-900 dark:text-white">{s.rating}</p>
                    <div className="flex gap-0.5 justify-end mt-0.5">
                      {[1,2,3,4,5].map(star => (
                        <Star key={star} size={10} className="text-amber-400" fill={star <= Math.floor(s.rating) ? 'currentColor' : 'none'} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Rating bar */}
                <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${s.color} rounded-full transition-all duration-1000`}
                    style={{ width: `${(s.rating / 5) * 100}%` }}
                  />
                </div>
              </div>
            ))}

            {/* Insight box */}
            <div className="bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 dark:from-violet-500/10 dark:to-fuchsia-500/10 border border-violet-400/20 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <Award size={18} className="text-violet-600 dark:text-violet-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">Nilah te dice quién necesita apoyo</p>
                  <p className="text-[12px] text-gray-500 dark:text-white/50 leading-relaxed">
                    Si el promedio de Mariana baja, te avisamos antes de que se note en los ingresos. Tú decides si capacitar, redistribuir o hablar directamente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
