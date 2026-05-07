import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, CheckCircle2, Bot, Zap, Leaf, Sun, Moon, Star, Quote,
  MessageCircle, Calendar, Camera, Bell, Heart, BarChart3, Gift, Megaphone,
  ChevronDown, Shield, Phone, Clock, Users, Sparkles, X, Menu, Play, Info,
  FileText, Settings, Rocket, Package, Target, ShieldCheck, Wallet
} from 'lucide-react';
import { APP_NAME } from '../constants';
import { useTheme } from '../context/ThemeContext';
import { MorphingBlob, FloatingReactionBubbles, ParallaxTiltWrapper, NilahFlowDiagram, AnimatedCounter, NilahWhatsAppConvo, NilahWhatsAppPostVisita, NilahWhatsAppRetoque, NilahWhatsAppFestiva, ROISlotMachine, AgendaFillAnimation, DormantGridAwakening, MagneticCard, GradientText, NilahInboxMockup } from '../components/UI/AnimatedSVGs';
import { AudienceMarketplaceShowcase, LoyaltyEngineShowcase } from '../components/Landing/AudienceMarketplaceShowcase';
import { DynamicIsland } from '../components/Landing/DynamicIsland';
import { supabase } from '../services/supabase';

const useIntersectionObserver = () => {
  // Disabled as per user request to remove animations
  const [visibleSections] = useState<Set<string>>(new Set());
  return visibleSections;
};

const LandingPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeCreativeTab, setActiveCreativeTab] = useState<'magic' | 'retouch' | 'free' | 'gallery'>('magic');

  // Mapping for Nilah Creative images
  const creativeImages = {
    magic: ['/creative/lashes-flyer.jpg', '/creative/nails-flyer.jpg'],
    retouch: '/creative/retouch-demo.jpg',
    free: '/creative/free-style-flyer.jpg',
    gallery: [
      { id: 1, src: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=400&q=80', tags: ['Balayage', 'Tendencia'] },
      { id: 2, src: 'https://images.unsplash.com/photo-1632345033845-814ca8883652?auto=format&fit=crop&w=400&q=80', tags: ['Acrílicas'] },
      { id: 3, src: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=400&q=80', tags: ['Maquillaje'] },
      { id: 4, src: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=400&q=80', tags: ['Corte', 'Diseño'] },
      { id: 5, src: 'https://images.unsplash.com/photo-1559599101-f09722fb4948?auto=format&fit=crop&w=400&q=80', tags: ['Pestañas'] },
      { id: 6, src: 'https://images.unsplash.com/photo-1620331307312-74b880293d24?auto=format&fit=crop&w=400&q=80', tags: ['Tratamiento'] },
    ]
  };
  const [magicImageIndex, setMagicImageIndex] = useState(0);

  // Auto-carousel for magic tab
  useEffect(() => {
    if (activeCreativeTab !== 'magic') return;
    
    const interval = setInterval(() => {
      setMagicImageIndex((prev) => (prev + 1) % creativeImages.magic.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [activeCreativeTab, creativeImages.magic.length]);
  const [planPrices, setPlanPrices] = useState({
    basico: 89, basico_pen: 329, basico_reg: 149, basico_reg_pen: 549,
    pro: 119, pro_pen: 449, pro_reg: 199, pro_reg_pen: 749,
    copilot: 179, copilot_pen: 659, copilot_reg: 299, copilot_reg_pen: 1099,
    setup: 89, setup_pen: 335, setup_reg: 150, setup_reg_pen: 560
  });
  const [isPricingLoading, setIsPricingLoading] = useState(true);
  const [showMoreBenefits, setShowMoreBenefits] = useState<Record<string, boolean>>({ glow: false, pro: false, elite: false });

  const visibleSections = useIntersectionObserver();

  // Animación de entrada
  const getAnimationClass = (sectionId: string, baseAnimation: string = '') => {
    // Disabled animations globally
    return '';
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const loadPlanPrices = async () => {
      setIsPricingLoading(true);
      try {
        const { data, error } = await supabase
          .from('precios_suscripcion')
          .select('id, precio, precio_pen, precio_regular, precio_regular_pen')
          .in('id', [
            'glow',
            'glow_pro',
            'glow_elite',
            'plan_setup_inicial'
          ]);

        if (error) throw error;
        const prices = Object.fromEntries((data || []).map((item: any) => [item.id, item]));
        
        setPlanPrices({
          basico: Number(prices.glow?.precio ?? 89),
          basico_pen: Number(prices.glow?.precio_pen ?? 329),
          basico_reg: Number(prices.glow?.precio_regular ?? 149),
          basico_reg_pen: Number(prices.glow?.precio_regular_pen ?? 549),
          
          pro: Number(prices.glow_pro?.precio ?? 119),
          pro_pen: Number(prices.glow_pro?.precio_pen ?? 449),
          pro_reg: Number(prices.glow_pro?.precio_regular ?? 199),
          pro_reg_pen: Number(prices.glow_pro?.precio_regular_pen ?? 749),
          
          copilot: Number(prices.glow_elite?.precio ?? 179),
          copilot_pen: Number(prices.glow_elite?.precio_pen ?? 659),
          copilot_reg: Number(prices.glow_elite?.precio_regular ?? 299),
          copilot_reg_pen: Number(prices.glow_elite?.precio_regular_pen ?? 1099),
          
          setup: Number(prices.plan_setup_inicial?.precio ?? 89),
          setup_pen: Number(prices.plan_setup_inicial?.precio_pen ?? 335),
          setup_reg: Number(prices.plan_setup_inicial?.precio_regular ?? 150),
          setup_reg_pen: Number(prices.plan_setup_inicial?.precio_regular_pen ?? 560)
        });
      } catch (err) {
        console.warn('Could not load landing prices from Supabase:', err);
      } finally {
        setIsPricingLoading(false);
      }
    };

    loadPlanPrices();
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  // GLOW PRO ULTRA EDITION: CSS ANIMATIONS
  const ultraStyles = (
    <style>{`
      @keyframes neon-rotate {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .neon-border-glow {
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: conic-gradient(
          transparent,
          rgba(139, 92, 246, 0.4),
          rgba(236, 72, 153, 0.4),
          transparent 30%
        );
        animation: neon-rotate 5s linear infinite;
        z-index: 0;
      }
      .glass-widget {
        background: rgba(255, 255, 255, 0.03);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      .dark .glass-widget {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
      }
      .ultra-card-shadow {
        box-shadow: 0 0 40px rgba(139, 92, 246, 0.15);
      }
      .ultra-card-shadow-emerald {
        box-shadow: 0 0 40px rgba(16, 185, 129, 0.15);
      }
      .ultra-card-shadow-cyan {
        box-shadow: 0 0 40px rgba(6, 182, 212, 0.15);
      }
      .neon-border-glow-emerald {
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: conic-gradient(
          transparent,
          rgba(16, 185, 129, 0.4),
          rgba(6, 182, 212, 0.4),
          transparent 30%
        );
        animation: neon-rotate 5s linear infinite;
        z-index: 0;
      }
      .neon-border-glow-cyan {
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: conic-gradient(
          transparent,
          rgba(6, 182, 212, 0.4),
          rgba(59, 130, 246, 0.4),
          transparent 30%
        );
        animation: neon-rotate 5s linear infinite;
        z-index: 0;
      }
    `}</style>
  );

  return (
    <>
      {ultraStyles}
    <div className="force-hardcoded-violet relative min-h-screen bg-gradient-to-b from-white via-violet-50/20 to-white text-gray-900 font-sans dark:from-[#0A0A0A] dark:via-[#0E0E0E] dark:to-[#0A0A0A] dark:text-white">

      {/* === SECCIÓN 0 - NAV === */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
        ? 'border-b border-gray-100 bg-white/90 backdrop-blur-md shadow-sm dark:border-white/5 dark:bg-[#0A0A0A]/90'
        : 'bg-transparent'
        }`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <div className="relative">
              <Leaf className="h-6 w-6 text-violet-500 transition-transform group-hover:rotate-12 md:h-7 md:w-7" />
              <div className="absolute inset-0 h-6 w-6 rounded-full bg-violet-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity md:h-7 md:w-7" />
            </div>
            <span className="text-lg font-extrabold tracking-tight md:text-xl">Nilah IA</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-8 md:flex">
            <button onClick={() => scrollToSection('como-funciona')} className="text-sm font-medium text-gray-600 hover:text-violet-500 transition-colors dark:text-gray-300 dark:hover:text-violet-400">Cómo Funciona</button>
            <button onClick={() => scrollToSection('marketing')} className="text-sm font-bold text-violet-600 hover:text-violet-700 transition-colors dark:text-violet-400 dark:hover:text-violet-300 flex items-center gap-1">
              <Megaphone size={16}/> Nilah Marketing
            </button>
            <button onClick={() => scrollToSection('fidelidad')} className="text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors dark:text-amber-400 dark:hover:text-amber-300 flex items-center gap-1">
              <Star size={14}/> Fidelidad
            </button>
            <button onClick={() => scrollToSection('precios')} className="text-sm font-medium text-gray-600 hover:text-violet-500 transition-colors dark:text-gray-300 dark:hover:text-violet-400">Planes</button>
            <button onClick={() => scrollToSection('faq')} className="text-sm font-medium text-gray-600 hover:text-violet-500 transition-colors dark:text-gray-300 dark:hover:text-violet-400">FAQ</button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-violet-500 transition-all dark:hover:bg-white/10 dark:hover:text-violet-400"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {/* Auth CTA */}
            <Link 
              to="/nilah/login" 
              className="hidden md:flex items-center gap-2 rounded-full relative p-[1.5px] overflow-hidden group shadow-sm hover:shadow-violet-500/20 transition-all hover:scale-[1.02]"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 rounded-full group-hover:opacity-90 transition-opacity"></span>
              <span className="relative bg-white dark:bg-[#0A0A0A] rounded-full px-5 py-2 text-sm font-bold transition-all group-hover:bg-transparent">
                <span className="bg-gradient-to-r from-violet-600 to-pink-500 group-hover:text-white bg-clip-text text-transparent group-hover:bg-none transition-all">
                  Iniciar Sesión
                </span>
              </span>
            </Link>
            
            {/* CTA Fijo */}
            <a
              href="https://wa.me/51999999999?text=Hola!%20Quiero%20una%20demo%20de%20Nilah%20IA"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-2 rounded-full bg-gray-900 dark:bg-white px-5 py-2.5 text-sm font-bold text-white dark:text-gray-900 shadow-md hover:shadow-lg transition-transform hover:scale-[1.02]"
            >
              <MessageCircle size={18} />
              Quiero una demo →
            </a>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors md:hidden">
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <div className={`md:hidden absolute top-full left-0 right-0 bg-white dark:bg-[#0A0A0A] border-b border-gray-100 dark:border-white/5 shadow-2xl transition-[opacity,transform] duration-300 ease-out origin-top ${mobileMenuOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-4 pointer-events-none'
          }`}>
          <div className="p-4 space-y-2">
            <button onClick={() => scrollToSection('como-funciona')} className="block w-full text-left py-3.5 px-4 rounded-xl font-semibold text-gray-800 dark:text-gray-200 hover:bg-violet-50 dark:hover:bg-white/5">Cómo Funciona</button>
            <button onClick={() => scrollToSection('marketing')} className="block w-full text-left py-3.5 px-4 rounded-xl font-bold text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 flex items-center gap-2"><Megaphone size={18}/> Nilah Marketing</button>
            <button onClick={() => scrollToSection('fidelidad')} className="block w-full text-left py-3.5 px-4 rounded-xl font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 flex items-center gap-2"><Star size={18}/> Fidelidad & Calidad</button>
            <button onClick={() => scrollToSection('precios')} className="block w-full text-left py-3.5 px-4 rounded-xl font-semibold text-gray-800 dark:text-gray-200 hover:bg-violet-50 dark:hover:bg-white/5">Planes</button>
            <button onClick={() => scrollToSection('faq')} className="block w-full text-left py-3.5 px-4 rounded-xl font-semibold text-gray-800 dark:text-gray-200 hover:bg-violet-50 dark:hover:bg-white/5">FAQ</button>
            
            <div className="pt-4 pb-2 space-y-3">
               <Link 
                to="/nilah/login" 
                className="flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl font-bold bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/30 text-violet-700 dark:text-violet-300 hover:bg-violet-500/20 transition-colors"
               >
                 Iniciar Sesión
               </Link>
               <a
                href="https://wa.me/51999999999?text=Hola!%20Quiero%20una%20demo%20de%20Nilah%20IA"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl font-bold bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md"
              >
                <MessageCircle size={20} />
                Quiero una demo →
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* === SECCIÓN 1 - HERO === */}
      <section className="relative min-h-[75vh] md:min-h-[90vh] flex flex-col items-center justify-center px-4 pt-24 md:pt-32 pb-6 md:pb-16 text-center overflow-hidden">
        <MorphingBlob className="top-1/4 -left-32 opacity-20" colors="from-gray-300 via-violet-100 to-transparent dark:from-white/5 dark:via-violet-500/5" size="h-[500px] w-[500px]" />
        <MorphingBlob className="bottom-1/4 -right-32 opacity-20" colors="from-transparent via-violet-100 to-gray-200 dark:from-transparent dark:via-violet-500/5" size="h-[400px] w-[400px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-violet-500/5 blur-[100px]" />

        <div className="relative z-10 max-w-4xl space-y-8 animate-fade-in-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200/50 bg-violet-50/80 backdrop-blur-sm px-4 py-2 text-xs md:text-sm font-medium text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-400 shadow-sm animate-fade-in">
            <Sparkles size={14} className="animate-pulse" />
            La asistente de belleza para tu salón · Diseñada para Latinoamérica
          </div>

          {/* Headline */}
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl md:text-5xl lg:text-6xl text-gray-900 dark:text-white">
            Cada clienta que no volvió <br className="hidden md:block"/>
            en 35, 60 o 90 días <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-pink-500">no te olvidó.</span>
          </h2>
          <h2 className="text-2xl md:text-4xl font-bold text-gray-500 dark:text-gray-400 mt-2">
            Solo nadie le escribió.
          </h2>

          {/* Subheadline */}
          <p className="mx-auto max-w-2xl text-base md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
            Nilah IA convierte tus contactos de <span className="whatsapp-highlight">WhatsApp</span> en <span className="text-violet-600 dark:text-violet-400 font-bold">citas reales</span>: <span className="font-bold text-gray-900 dark:text-white">campañas semanales</span> por grupos de clientas, <span className="font-bold text-gray-900 dark:text-white">mensajes de rescate</span> con humor y complicidad, y <span className="font-bold text-gray-900 dark:text-white">recordatorios</span> que tus clientas esperan recibir — <span className="text-emerald-600 dark:text-emerald-400 font-bold">todo sin spam</span>, con la voz de tu marca.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-6">
            <Link
              to="/auth?plan=free"
              className="w-full sm:w-auto rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-violet-500/30 flex items-center justify-center gap-2 transition-all hover:scale-105 hover:shadow-violet-500/50 active:scale-95"
            >
              <Sparkles size={18} /> Empezar gratis →
            </Link>
            <a
              href="https://wa.me/51999999999?text=Hola!%20Quiero%20ver%20c%C3%B3mo%20funciona%20Nilah%20IA"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto rounded-full bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 px-8 py-4 text-base font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center justify-center gap-2 transition-colors"
            >
              <MessageCircle size={18} /> Quiero una demo →
            </a>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 flex items-center justify-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-500" />
            Sin tarjeta de crédito · Hasta 100 clientas gratis · Sin compromisos
          </p>

          {/* Metrics Inline */}
          <div className="pt-8 mt-8 md:pt-12 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4 max-w-3xl mx-auto border-t border-gray-100 dark:border-white/5">
            <div className="text-center group">
              <p className="text-3xl font-black text-gray-900 dark:text-white group-hover:text-violet-500 transition-colors">1,000+</p>
              <p className="text-xs text-gray-500 mt-1 font-medium leading-tight">Contactos de <span className="whatsapp-highlight">WhatsApp</span><br/>que ya te conocen</p>
            </div>
            <div className="text-center group">
              <p className="text-3xl font-black text-gray-900 dark:text-white group-hover:text-pink-500 transition-colors">4</p>
              <p className="text-xs text-gray-500 mt-1 font-medium leading-tight">Campañas automáticas<br/>al mes listas en 1 clic</p>
            </div>
            <div className="text-center group">
              <p className="text-3xl font-black text-gray-900 dark:text-white group-hover:text-emerald-500 transition-colors">35/60/90</p>
              <p className="text-xs text-gray-500 mt-1 font-medium leading-tight">Días: sistema de<br/>rescate activado</p>
            </div>
            <div className="text-center group flex flex-col items-center">
              <p className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-1"><span className="text-red-500 font-bold">0</span></p>
              <p className="text-xs text-gray-500 mt-1 font-medium leading-tight">Mensajes genéricos<br/>enviados (cero spam)</p>
            </div>
          </div>
        </div>
      </section>

      {/* === DOPAMINE BREAK 1 — Dormant Grid (between hero and problem) === */}
      <div className="bg-gray-50 dark:bg-[#0E0E0E] pt-10 pb-2">
        <div className="max-w-3xl mx-auto px-4 text-center mb-4">
          <p className="text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600">
            Miles de clientas dormidas en tu lista esperando este mensaje →
          </p>
        </div>
        <DormantGridAwakening />
      </div>

      {/* === SECCIÓN 2 - EL PROBLEMA === */}
      <section id="problema" data-animate className="py-24 bg-gray-50 dark:bg-[#0E0E0E]">
        <div className={`mx-auto max-w-5xl px-4 ${getAnimationClass('problema')}`}>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-4 rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141414] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              El problema que nadie nombra
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold leading-tight text-gray-900 dark:text-white max-w-3xl mx-auto">
              Tienes cientos de clientas en tu <span className="whatsapp-highlight">WhatsApp</span>. Y un mes flojo.
            </h2>
            <h3 className="text-2xl md:text-3xl font-medium text-gray-500 dark:text-gray-400 mt-4">
              Esas dos cosas no deberían coexistir.
            </h3>
            <p className="mt-8 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Cuando el mes va lento, la primera reacción es hacer un video, publicar en redes, conseguir clientes nuevos. Pero conseguir un cliente nuevo cuesta <span className="font-bold text-rose-500 dark:text-rose-400">5 veces más</span> que reactivar uno que ya te conoce.
              <br/><br/>
              <b>Y ya los tienes. En tu teléfono. Ahora mismo.</b> Solo que nadie los está moviendo.
            </p>
          </div>

          {/* 4 Dolores Específicos */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              { 
                emoji: '📲', 
                title: 'Publicas y esperas.', 
                desc: <><span className="text-pink-500 font-bold">Publicas en redes.</span> Esperas que te vean. Esperas que recuerden. Esperas que escriban. <b className="text-gray-900 dark:text-gray-100">Tus clientas ya están en tu <span className="whatsapp-highlight">WhatsApp</span>.</b> El canal más directo que existe. Sin algoritmo en el medio.</>
              },
              { 
                emoji: '💸', 
                title: 'No sabes a quién hablarle.', 
                desc: <>El mes va lento y no sabes a quién llamar. No hay un sistema que te diga: <span className="text-violet-500 font-bold bg-violet-50 dark:bg-violet-500/10 px-1 rounded">"estas 40 clientas no vienen hace 60 días — escríbeles hoy."</span> Existe la información. No existe quien la use.</>
              },
              { 
                emoji: '😬', 
                title: 'Miedo a sonar desesperada.', 
                desc: <>Quieres escribirles pero no sabes cómo sonar. No quieres ser pesada. No quieres un <span className="font-mono text-xs bg-gray-100 dark:bg-white/10 px-1 py-0.5 rounded text-gray-500 dark:text-gray-400">"hola, ¿cuándo vienes?"</span> que suene a cobro de deuda.</>
              },
              { 
                emoji: '🔕', 
                title: 'Recordatorios ignorados.', 
                desc: <><span className="italic text-gray-500">"Tu cita es mañana a las 3pm"</span> — leído, sin respuesta. No es el canal. Es el mensaje. Un <b className="text-emerald-500">activador bien escrito</b> genera respuesta. Un recordatorio aburrido genera silencio.</>
              }
            ].map((item, i) => (
              <MagneticCard key={i} className="group flex flex-col bg-white dark:bg-[#141414] p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-white/5 hover:border-violet-200 dark:hover:border-violet-500/30 transition-all hover:shadow-xl hover:-translate-y-1" glowColor="rgba(139, 92, 246, 0.15)">
                <span className="text-4xl mb-4 bg-gray-50 dark:bg-white/5 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">{item.emoji}</span>
                <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed">
                  <strong className="text-gray-900 dark:text-white block mb-2">{item.title}</strong>
                  {item.desc}
                </p>
              </MagneticCard>
            ))}
          </div>

          {/* CAJA DE IMPACTO */}
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="relative rounded-3xl bg-white dark:bg-[#111] overflow-hidden shadow-2xl shadow-rose-500/10 border border-rose-100 dark:border-rose-900/30 group">
              <div className="absolute top-0 left-0 w-2 h-full bg-rose-500" />
              <div className="p-8 md:p-10">
                <h4 className="font-bold text-gray-900 dark:text-white text-xl mb-6">
                  💸 Lo que pierde el salón promedio cada mes por no mover a sus contactos:
                </h4>
                
                <div className="space-y-4 mb-8 font-mono text-sm md:text-base">
                  <div className="text-xs font-sans text-gray-500 mb-4 bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/10">
                    <span className="font-bold">✨ Baseline Mínimo Realista:</span> Calculado con un salón pequeño y un ticket promedio bajo ($15 USD / S/ 50).
                  </div>

                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-white/5 pb-3 gap-1 sm:gap-0">
                    <span>Clientas inactivas sin rescate (15/mes)</span>
                    <div className="sm:text-right flex justify-between sm:block">
                      <span className="text-gray-400 sm:hidden">Pérdida:</span>
                      <span className="text-rose-500 font-bold block">-$200 USD <span className="text-xs font-normal text-rose-400">/ S/ 750</span></span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-white/5 pb-3 gap-1 sm:gap-0">
                    <span>No-shows (Citas fantasma) (8/mes)</span>
                    <div className="sm:text-right flex justify-between sm:block">
                      <span className="text-gray-400 sm:hidden">Pérdida:</span>
                      <span className="text-rose-500 font-bold block">-$105 USD <span className="text-xs font-normal text-rose-400">/ S/ 400</span></span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-white/5 pb-3 gap-1 sm:gap-0">
                    <span>Mantenimientos sin seguimiento (7/mes)</span>
                    <div className="sm:text-right flex justify-between sm:block">
                      <span className="text-gray-400 sm:hidden">Pérdida:</span>
                      <span className="text-rose-500 font-bold block">-$90 USD <span className="text-xs font-normal text-rose-400">/ S/ 350</span></span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-white/5 pb-3 gap-1 sm:gap-0">
                    <span>Clientas fugadas a la competencia (4/mes)</span>
                    <div className="sm:text-right flex justify-between sm:block">
                      <span className="text-gray-400 sm:hidden">Pérdida:</span>
                      <span className="text-rose-500 font-bold block">-$55 USD <span className="text-xs font-normal text-rose-400">/ S/ 200</span></span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-rose-50 dark:bg-rose-500/10 p-4 rounded-xl mt-6 gap-2 sm:gap-0 border border-rose-100 dark:border-rose-900/30">
                    <span className="font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider text-sm">Pérdida Mensual (Mínima)</span>
                    <div className="sm:text-right flex items-baseline justify-between sm:block">
                      <ROISlotMachine targetAmount={450} color="red" prefix="-$" suffix=" USD" className="items-end text-xl sm:text-2xl" />
                      <span className="text-xs font-semibold text-rose-700/60 dark:text-rose-400/60 block mt-0.5">S/ 1,700 / mes · -$5,400 USD al año</span>
                    </div>
                  </div>
                </div>

                <div className="text-center bg-gray-50 dark:bg-white/5 rounded-2xl p-6 border border-gray-100 dark:border-white/5">
                  <p className="text-lg text-gray-700 dark:text-gray-200 font-medium">
                    El dinero para recuperar ese mes lento ya está en tu lista de contactos.
                    <br/><span className="font-bold text-violet-600 dark:text-violet-400">Solo necesita que alguien lo despierte.</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* SE REQUIERE EL RESTO DE LA PANTALLA AQUI LUEGO - NO ELIMINAR ESTE COMENTARIO */}
      {/* FINAL_DE_LA_PARTE_1 */}

      {/* CONTINUACIÓN DESDE LA PARTE 1 */}
      {/* === SECCIÓN 3 - LA SOLUCIÓN === */}
      <section id="marketing" data-animate className="py-24 bg-white dark:bg-[#0A0A0A]">
        <div className={`mx-auto max-w-5xl px-4 ${getAnimationClass('marketing')}`}>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-4 rounded-full border border-violet-200 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
              La Solución
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold leading-tight text-gray-900 dark:text-white max-w-3xl mx-auto mb-6">
              Nilah IA no es un chatbot de respuestas automáticas.
            </h2>
            <p className="text-xl md:text-2xl font-semibold text-violet-600 dark:text-violet-400">
              Es el sistema que convierte tu lista de <span className="whatsapp-highlight">WhatsApp</span> en el canal de ventas más rentable de tu salón.
            </p>
            <p className="mt-6 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Tres módulos conectados. Cada uno resuelve una parte distinta del mismo problema: <span className="font-medium text-gray-900 dark:text-white">tus clientas existen, tienen dinero y están listas para volver.</span> Solo necesitan el mensaje correcto.
            </p>
          </div>

          <div className="space-y-6">
            {/* BLOQUE 1 - NILAH MARKETING & MARKETPLACE */}
            <div className="relative rounded-[3rem] bg-white dark:bg-[#07060f] overflow-hidden border border-gray-100 dark:border-white/5 shadow-2xl">
              {/* Premium Background Gradients */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 via-transparent to-fuchsia-600/5 dark:from-violet-600/10 dark:via-transparent dark:to-fuchsia-600/10 pointer-events-none" />
              <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-500/10 dark:bg-violet-500/20 rounded-full blur-[120px] pointer-events-none" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-500/10 dark:bg-fuchsia-500/20 rounded-full blur-[120px] pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.03),transparent_70%)] pointer-events-none" />

              <div className="p-8 md:p-16 relative z-10">
                {/* Header Section - Centered for better desktop flow */}
                <div className="max-w-3xl mx-auto text-center mb-16">
                  <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 dark:bg-violet-500/20 px-4 py-2 text-sm font-bold text-violet-700 dark:text-violet-300 mb-6 uppercase tracking-widest">
                    <Target size={18} /> Marketing IA: 4 Campañas Mensuales
                  </div>
                  <h3 className="text-3xl md:text-5xl font-black mb-6 leading-[1.1]">
                    Tu negocio necesita estar presente.<br/>
                    <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent">Nilah lanza 1 campaña semanal por ti.</span>
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-lg md:text-xl leading-relaxed">
                    Olvídate de pensar qué publicar o a quién escribirle este mes. Nilah IA analiza y segmenta tu base de datos para crear y enviar <span className="text-violet-600 dark:text-violet-400 font-bold">4 campañas mensuales (una por semana)</span> adaptadas a audiencias específicas. Desde rescatar clientas perdidas hasta cross-selling de servicios. Todo generado con copys irresistibles.
                  </p>
                </div>

                {/* Showcase Area - Now Full Width */}
                <div className="relative">
                  {/* Glassy wrap for the showcase */}
                  <div className="bg-white/40 dark:bg-white/5 backdrop-blur-md rounded-[2.5rem] p-4 md:p-10 border border-white/40 dark:border-white/10 shadow-xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 pointer-events-none" />
                    <div className="relative z-10">
                      <AudienceMarketplaceShowcase />
                    </div>
                  </div>
                </div>

                {/* Bottom Feature List - Horizontal on desktop */}
                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { title: 'IA Generativa Pro', icon: <Sparkles className="text-violet-500" />, desc: 'Nilah crea todos los copys de venta generados por IA, con 3 versiones por campaña y el tono exacto de tu marca.' },
                    { title: '1 Campaña Semanal', icon: <Target className="text-fuchsia-500" />, desc: 'Un ritmo perfecto. Lanza mensajes estratégicos cada semana para multiplicar las reservas sin abrumar.' },
                    { title: 'Cero Spam', icon: <ShieldCheck className="text-emerald-500" />, desc: 'La IA elige y segmenta a quién le escribes. Politica inteligente de "No Spam" garantizada.' }
                  ].map((feat, i) => (
                    <div key={i} className="flex gap-4 items-start p-4 rounded-2xl hover:bg-white dark:hover:bg-white/5 transition-colors">
                      <div className="h-10 w-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center shrink-0">
                        {feat.icon}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white mb-1">{feat.title}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{feat.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* LOWER BLOCKS GRID */}
            <div className="grid md:grid-cols-2 gap-6">
              
              {/* BLOQUE 2 - RECORDATORIOS INTELIGENTES (RETOQUE) */}
              <div className="bg-white dark:bg-[#141414] rounded-[2rem] p-8 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl hover:border-violet-200 dark:hover:border-violet-500/30 transition-all flex flex-col h-full">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white border border-gray-100 dark:border-white/5 mb-6">
                  <Bell size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">Recordatorios Inteligentes</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-5 text-sm">
                  El sistema detecta cuándo un servicio necesita retoque y escribe en el momento exacto, antes de que ella lo note y antes de que vaya a otro lado.
                </p>

                {/* LIVE <span className="whatsapp-highlight">WhatsApp</span> mockup */}
                <div className="mb-5 flex-grow">
                  <NilahWhatsAppRetoque />
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-4 text-sm mt-auto">
                  <ul className="space-y-2">
                    <li className="flex gap-2 text-emerald-800 dark:text-emerald-300">
                      <Zap size={16} className="shrink-0 mt-0.5" />
                      <span><strong>Día 15-20:</strong> Tono cómplice y técnico.</span>
                    </li>
                    <li className="flex gap-2 text-emerald-800 dark:text-emerald-300">
                      <Zap size={16} className="shrink-0 mt-0.5" />
                      <span><strong>Objetivo:</strong> Mantenimiento natural sin promoción.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* BLOQUE 3 - ACTIVADORES DE RETENCIÓN */}
              <div className="bg-white dark:bg-[#141414] rounded-[2rem] p-8 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl hover:border-violet-200 dark:hover:border-violet-500/30 transition-all flex flex-col h-full">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white border border-gray-100 dark:border-white/5 mb-6">
                  <Heart size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">Activadores de Retención</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-5 text-sm">
                  ¿No volvió al retoque? Nilah activa tres mensajes estratégicos con intervalos calculados para rescatar la relación.
                </p>

                {/* LIVE <span className="whatsapp-highlight">WhatsApp</span> mockup */}
                <div className="mb-5 flex-grow">
                  <NilahWhatsAppConvo />
                </div>

                <div className="relative pl-6 border-l-2 border-gray-100 dark:border-white/10 space-y-4 mt-auto pb-2">
                  <div className="relative text-sm">
                    <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-violet-500 ring-4 ring-white dark:ring-[#141414]" />
                    <span className="font-bold block">Día 35: Curiosidad</span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs block leading-tight mt-0.5">Aún te recuerda. Empujón con humor. Sin ofertar nada.</span>
                  </div>
                  <div className="relative text-sm">
                    <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-pink-500 ring-4 ring-white dark:ring-[#141414]" />
                    <span className="font-bold block">Día 60: Regalito</span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs block leading-tight mt-0.5">Rompió el ciclo. Un detalle sorpresa activa su "reciprocidad".</span>
                  </div>
                  <div className="relative text-sm">
                    <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-rose-500 ring-4 ring-white dark:ring-[#141414]" />
                    <span className="font-bold block">Día 90: Rescate VIP</span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs block leading-tight mt-0.5">Último intento. Beneficio exclusivo como favor personal.</span>
                  </div>
                </div>
              </div>

              {/* BLOQUE 4 - SEGUIMIENTO DE CITAS Y POST-VISITA */}
              <div className="bg-white dark:bg-[#141414] rounded-[2rem] p-8 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl hover:border-violet-200 dark:hover:border-violet-500/30 transition-all flex flex-col h-full">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white border border-gray-100 dark:border-white/5 mb-6">
                  <Calendar size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">Seguimiento de Citas</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
                  "La confirmación de mañana que tu clienta realmente va a leer — y responder."
                </p>
                <ul className="space-y-4 flex-grow">
                  <li className="flex gap-3 text-sm">
                    <CheckCircle2 size={18} className="text-violet-500 shrink-0 mt-0.5" />
                    <span><strong className="text-gray-900 dark:text-white">24h antes:</strong> Activador con complicidad, no un aviso robótico.</span>
                  </li>
                  <li className="flex gap-3 text-sm">
                    <CheckCircle2 size={18} className="text-violet-500 shrink-0 mt-0.5" />
                    <span><strong className="text-gray-900 dark:text-white">3h antes:</strong> Recordatorio ligero para cerrar no-shows.</span>
                  </li>
                  <li className="flex flex-col gap-3 text-sm bg-violet-50 dark:bg-violet-500/10 p-5 rounded-2xl mt-4 border border-violet-100 dark:border-violet-500/20 shadow-inner">
                    <div className="flex gap-3">
                      <Gift size={18} className="text-violet-500 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-gray-900 dark:text-white block mb-1">Post-Visita Inmediata</strong>
                        Agradecimiento cálido, pedido de calificación (1-5 ⭐) y saldo actualizado de puntos en un solo envío.
                      </span>
                    </div>
                    <NilahWhatsAppPostVisita className="mt-2 w-full max-w-full" />
                  </li>
                </ul>
              </div>

              {/* BLOQUE 5 - CAMPAÑAS FESTIVAS (MARKETING) */}
              <div className="bg-white dark:bg-[#141414] rounded-[2rem] p-8 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl hover:border-violet-200 dark:hover:border-violet-500/30 transition-all flex flex-col h-full">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white border border-gray-100 dark:border-white/5 mb-6">
                  <Sparkles size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">Campañas Festivas Exitosas</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-5 text-sm">
                  Nilah sabe cuáles días festivos se acercan. Te ayuda a lanzar una campaña masiva pero personalizada, estimando cuánto dinero puedes recuperar con cada envío.
                </p>

                {/* LIVE <span className="whatsapp-highlight">WhatsApp</span> mockup */}
                <div className="mb-5 flex-grow">
                  <NilahWhatsAppFestiva />
                </div>

                <div className="bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20 rounded-xl p-4 text-sm mt-auto">
                  <ul className="space-y-2">
                    <li className="flex gap-2 text-violet-800 dark:text-violet-300">
                      <BarChart3 size={16} className="shrink-0 mt-0.5" />
                      <span><strong>Lo que puedes ganar:</strong> Envías a 200 clientas = $250 USD (aprox S/ 950) en citas estimadas.</span>
                    </li>
                  </ul>
                </div>
              </div>


              {/* BLOQUE NILAH LUMINA — Premium Director Estratégico */}
              <div className="col-span-full relative overflow-hidden rounded-[2rem] border border-white/5 bg-[#07060f] shadow-2xl text-white">
                {/* Ambient lights */}
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute -top-32 right-0 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-cyan-500/10 via-violet-600/10 to-transparent blur-3xl" />
                  <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-fuchsia-500/5 blur-3xl" />
                </div>

                <div className="relative z-10 md:flex">
                  {/* Left column — Copy */}
                  <div className="flex flex-col justify-center p-8 md:w-1/2 md:p-12">
                    <div className="mb-6 w-fit rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-bold text-cyan-300">
                      🧠 Nilah Lumina — Solo en Glow Elite
                    </div>
                    <h3 className="mb-2 text-2xl font-extrabold leading-tight md:text-3xl">
                      No es un chatbot más.<br/>
                      <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                        Es tu directora de operaciones.
                      </span>
                    </h3>
                    <p className="mb-8 text-base leading-relaxed text-gray-400">
                      Las dueñas de salón que ganan más no trabajan más horas — toman mejores decisiones. Lumina vive en tu panel, conoce tus números en tiempo real y te dice exactamente qué hacer hoy.
                    </p>

                    <div className="space-y-5">
                      {[
                        { emoji: '☀️', title: 'Antes de abrir: tu briefing del día', desc: 'Ingresos confirmados, clientas VIP en riesgo, meta vs. realidad. Lumina te lo da en 30 segundos antes de tu primera cita.' },
                        { emoji: '📉', title: 'Detecta exactamente por qué bajaste', desc: 'Sin revisar nada. Lumina compara meses, identifica el patrón y ya tiene el plan para revertirlo.' },
                        { emoji: '⚡', title: 'Action Cards: acción lista con un toque', desc: 'Lanzar rescate VIP · Ajustar disponibilidad · Enviar campaña flash — sin entrar a configuraciones.' },
                        { emoji: '👥', title: 'Sabe quién de tu equipo genera más', desc: 'Nombres y números reales. Te dice dónde poner el foco esta semana para maximizar la facturación.' },
                      ].map((item, i) => (
                        <div key={i} className="flex gap-4">
                          <span className="mt-0.5 shrink-0 text-2xl">{item.emoji}</span>
                          <div>
                            <p className="mb-0.5 text-sm font-bold text-white">{item.title}</p>
                            <p className="text-xs leading-relaxed text-gray-400">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right column — Chat mockup */}
                  <div className="flex items-center justify-center p-6 md:w-1/2 md:p-8">
                    <div className="w-full max-w-sm">
                      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0A] shadow-2xl">
                        {/* Chat header */}
                        <div className="flex items-center gap-3 border-b border-white/10 bg-gradient-to-r from-violet-600/20 to-cyan-600/10 px-4 py-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 text-xs font-bold text-white">L</div>
                          <div>
                            <p className="text-xs font-bold text-white">Nilah Lumina</p>
                            <p className="text-[10px] text-cyan-400">Directora Estratégica · en línea</p>
                          </div>
                          <div className="ml-auto h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                        </div>
                        {/* Messages */}
                        <div className="space-y-3 bg-[#0A0A0A] p-4">
                          {/* Lumina pro-active morning brief */}
                          <div className="flex gap-2">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 text-[10px] font-bold text-white mt-0.5">L</div>
                            <div className="max-w-[88%] space-y-2 rounded-2xl rounded-tl-sm border border-white/10 bg-[#1A1A1A] px-3.5 py-3 text-xs text-gray-200">
                              <p className="font-bold text-white">☀️ Buenos días. Antes de abrir:</p>
                              <p>Ingresos esperados: <span className="font-bold text-emerald-400">S/ 420</span> · Meta: S/ 380. <span className="text-emerald-400">⚡ Vas bien.</span></p>
                              <p className="font-bold text-amber-300">⚠️ 4 clientas VIP sin visita 45+ días</p>
                              <p className="text-[#8696a0]">¿Quieres que prepare el rescate ahora?</p>
                            </div>
                          </div>
                          {/* Action cards */}
                          <div className="flex gap-2 pl-8">
                            <button className="flex-1 rounded-xl border border-emerald-500/40 bg-emerald-500/20 py-2 px-3 text-[10px] font-bold text-emerald-400">✓ Sí, envíalo</button>
                            <button className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2 px-3 text-[10px] font-medium text-gray-400">Ver quiénes</button>
                          </div>
                          {/* User query */}
                          <div className="flex justify-end">
                            <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-violet-600 px-3.5 py-2.5 text-xs text-white">
                              ¿Por qué bajé en febrero?
                            </div>
                          </div>
                          {/* Lumina analysis */}
                          <div className="flex gap-2">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 text-[10px] font-bold text-white mt-0.5">L</div>
                            <div className="max-w-[88%] space-y-1.5 rounded-2xl rounded-tl-sm border border-white/10 bg-[#1A1A1A] px-3.5 py-3 text-xs text-gray-200">
                              <p>Febrero tuvo <span className="font-bold text-red-400">−6 citas</span> vs enero.</p>
                              <p>Causa principal: <span className="font-bold text-white">3 clientas VIP sin retoque.</span></p>
                              <p className="text-emerald-400 text-[10px]">Ya preparé los 3 mensajes. ¿Los envío?</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="mt-3 text-center text-xs text-gray-500">Así responde Lumina. Con tus datos. Hoy.</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* FLOW RECAP */}
            <div className="bg-gray-100 dark:bg-[#1A1A1A] rounded-2xl p-6 text-center border border-gray-200 dark:border-white/5 mt-8 max-w-4xl mx-auto">
              <p className="text-sm md:text-base font-semibold text-gray-700 dark:text-gray-300 md:flex md:items-center md:justify-center md:flex-wrap gap-2 leading-loose">
                <span>Nilah llena tu agenda</span> <ArrowRight size={14} className="hidden md:inline text-violet-500"/>
                <span>Analiza a la clienta</span> <ArrowRight size={14} className="hidden md:inline text-violet-500"/>
                <span>Te avisa qué hacer</span> <ArrowRight size={14} className="hidden md:inline text-violet-500"/>
                <span>Manda la campaña</span> <ArrowRight size={14} className="hidden md:inline text-violet-500"/>
                <span>Recupera a las que se fueron</span>
              </p>
              <p className="mt-4 text-sm font-bold text-violet-600 dark:text-violet-400">
                Un ciclo cerrado. Sin huecos. Sin clientas perdidas innecesariamente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* === NUEVA SECCIÓN: FIDELIDAD & CALIDAD 360° === */}
      {/* ============================================================ */}
      <section id="fidelidad" className="py-20 md:py-28 bg-white dark:bg-[#0A0A0A] relative overflow-hidden transition-colors duration-500">
        {/* Background Decorations - Light Mode */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-50/20 via-transparent to-emerald-50/20 dark:hidden pointer-events-none" />
        
        {/* Background Decorations - Dark Mode */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A] via-[#0D0A14] to-[#0A0A0A] hidden dark:block pointer-events-none" />

        {/* Ambient blobs */}
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-amber-500/[0.03] dark:bg-amber-500/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-emerald-500/[0.03] dark:bg-emerald-500/5 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3 pointer-events-none" />

        <div className="relative mx-auto max-w-5xl px-4">
          <LoyaltyEngineShowcase />

          {/* CTA strip */}
          <div className="mt-12 text-center">
            <a
              href="https://wa.me/51999999999?text=Hola!%20Quiero%20ver%20el%20sistema%20de%20puntos%20de%20Nilah%20IA"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-amber-500 hover:bg-amber-400 px-8 py-4 text-base font-bold text-white shadow-xl shadow-amber-500/30 transition-all hover:scale-105 active:scale-95"
            >
              <Gift size={18} /> Quiero fidelizar a mis clientas →
            </a>
            <p className="mt-3 text-xs text-gray-500">Las clientas que canjean premios gastan un <span className="text-emerald-400 font-bold">40% más</span> que las que no.</p>
          </div>
        </div>
      </section>

      {/* === SECCIÓN 4 - EL CHATBOT PHILOSOPHY === */}
      <section id="modos" data-animate className="py-24 bg-gradient-to-b from-gray-50 to-white dark:from-[#0E0E0E] dark:to-[#0A0A0A]">
        <div className={`mx-auto max-w-5xl px-4 ${getAnimationClass('modos')}`}>
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 rounded-full bg-violet-100 dark:bg-violet-500/10 px-4 py-2 text-xs font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wider mb-4">
              <Bot size={14} /> El asistente que prepara, tú cierras
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold leading-tight text-gray-900 dark:text-white max-w-3xl mx-auto">
              Nilah trabaja en silencio.
              <br/><span className="text-violet-500">Tu equipo construye la relación.</span>
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Nilah informa, detecta intención y te avisa. Tu equipo retoma cuando importa — sin tocar nada técnico.
            </p>
          </div>

          {/* HERO CARD - La filosofía On-Demand */}
          <div className="relative rounded-3xl bg-white dark:bg-[#141414] border-2 border-violet-100 dark:border-violet-500/20 shadow-xl p-8 md:p-10 mb-8 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl" />
            <div className="md:flex gap-12 items-center relative z-10">
              <div className="md:w-1/2 mb-8 md:mb-0">

                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  Modo On Demand: Nilah informa,<br/>
                  <span className="text-violet-600 dark:text-violet-400">tú cierras la cita. Siempre en control.</span>
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  No es una limitación. Es una filosofía. Nilah prepara el terreno y te manda el resumen a tu <span className="whatsapp-highlight">WhatsApp</span>. <span className="font-semibold text-gray-800 dark:text-gray-100">Tu equipo retoma y construye el vínculo.</span>
                </p>
                <div className="space-y-3">
                  {[
                    { icon: '📋', text: 'Recopila servicio, horario y preferencias' },
                    { icon: '🧠', text: 'Clasifica a la clienta y calcula su score' },
                    { icon: '📲', text: 'Te informa cuando es tu momento de entrar' },
                    { icon: '🤝', text: 'El bot se pausa — tú cierras.' },
                    { icon: '🔄', text: 'Se reactiva sola al registrar la cita.' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200">
                      <span className="text-base w-6 text-center shrink-0">{item.icon}</span>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="md:w-1/2">
                {/* <span className="whatsapp-highlight">WhatsApp</span> Notification Mockup */}
                <div className="bg-[#111b21] rounded-2xl overflow-hidden shadow-2xl border border-white/5">
                  {/* WA Header */}
                  <div className="bg-[#202c33] px-4 py-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-violet-500 flex items-center justify-center text-white font-bold text-sm shrink-0">N</div>
                    <div>
                      <p className="text-white text-sm font-semibold leading-none">Nilah IA</p>
                      <p className="text-[#8696a0] text-xs mt-0.5">en línea</p>
                    </div>
                  </div>
                  {/* Chat area */}
                  <div className="p-4 space-y-2 bg-[#0b141a]" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)', backgroundSize: '24px 24px'}}>
                    <p className="text-[#8696a0] text-xs text-center py-1">Hoy · 2:47 PM</p>
                    {/* Bot message bubble */}
                    <div className="max-w-[90%] bg-[#202c33] rounded-2xl rounded-tl-sm p-3.5 shadow-sm">
                      <p className="text-[#25d366] text-xs font-bold mb-2 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#25d366] inline-block animate-pulse"></span>
                        🔔 NUEVA SOLICITUD DE CITA
                      </p>
                      <div className="space-y-1.5 text-[#e9edef] text-xs">
                        <div className="flex justify-between">
                          <span className="text-[#8696a0]">Clienta</span>
                          <span className="font-semibold">Andrea López</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#8696a0]">Servicio</span>
                          <span className="font-semibold">Acrílicas con extensión</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#8696a0]">Fecha y hora</span>
                          <span className="font-semibold">Mañana · 3:00 PM</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#8696a0]">Notas</span>
                          <span className="font-semibold">Quiere diseño floral</span>
                        </div>
                        <div className="h-px bg-white/10 my-2" />
                        <div className="flex justify-between items-center">
                          <span className="text-[#8696a0]">Categoría</span>
                          <span className="bg-violet-500/20 text-violet-300 border border-violet-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">💅 Casual · 3 visitas</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[#8696a0]">Score fiabilidad</span>
                          <span className="font-bold text-amber-400">6.4 / 10</span>
                        </div>
                        <div className="mt-2 bg-amber-500/10 border border-amber-500/30 rounded-xl p-2 text-amber-300 text-[10px] font-bold text-center">
                          ⚠️ Score bajo — Pedir depósito recomendado
                        </div>
                      </div>
                      <p className="text-[#8696a0] text-[10px] text-right mt-2">2:47 PM ✓✓</p>
                    </div>
                    {/* Status note */}
                    <div className="bg-[#1a2f22]/80 border border-[#25d366]/20 rounded-xl p-2.5 text-[10px] text-[#25d366] text-center font-medium">
                      🔕 Bot pausado · Se reactiva al agendar la cita o a las 12:00 PM
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>


          
          <div className="text-center mt-8">
            <p className="inline-block bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 text-sm px-5 py-2.5 rounded-full border border-gray-200 dark:border-white/10 shadow-sm">
              <strong className="text-gray-900 dark:text-white">Mantén el control absoluto.</strong> Tú decides cuándo entrar en la conversación.
            </p>
          </div>
        </div>
      </section>

      {/* === SECCIÓN 4.5 - NILAH INBOX === */}
      <section id="inbox" data-animate className="py-24 bg-gradient-to-br from-violet-50 via-fuchsia-50 to-white dark:from-[#110B1A] dark:via-[#160A10] dark:to-[#0A0A0A] relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl opacity-50" />
        
        <div className={`relative mx-auto max-w-6xl px-4 ${getAnimationClass('inbox', 'animate-fade-in-up')}`}>
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center gap-2 mb-4 rounded-full border border-violet-200 dark:border-violet-500/30 bg-white/50 dark:bg-violet-500/10 backdrop-blur-sm px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-violet-700 dark:text-violet-400 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
              </span>
              El Centro de Control
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold leading-tight text-gray-900 dark:text-white mb-6">
              Antes de responder un solo mensaje,
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-500">ya sabes exactamente quién es esa clienta y cuánto vale.</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Nilah Inbox 2.0. Un panel de 3 columnas diseñado específicamente para salones y barberías. No solo chateas, operas tu negocio.
            </p>
          </div>

          {/* The visual Mockup */}
          <div className="mb-20">
            <NilahInboxMockup />
          </div>

          {/* Features columns */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 relative z-10">
            
            {/* Feature 1: Bandeja Inteligente & Carpetas */}
            <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-gray-100 dark:border-white/10 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all" />
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-500/20 dark:to-blue-500/20 rounded-xl border border-cyan-200 dark:border-cyan-500/30 shadow-sm flex items-center justify-center text-xl mb-4 relative z-10">
                📂
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex flex-wrap items-center gap-2">
                Carpetas Inteligentes <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full tracking-wider uppercase font-bold shadow-sm">Elite</span>
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm relative z-10 mb-4">
                Organiza chats por etiquetas de colores. Separa Clientas VIP, Casos de Atención Inmediata o Seguimientos, filtrando el ruido para enfocarte en lo que genera ingresos.
              </p>
              <div className="flex flex-wrap gap-2 relative z-10">
                <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 px-2 py-1 rounded-md font-bold shadow-sm border border-amber-200 dark:border-amber-700/50">⏱️ Atención</span>
                <span className="text-[10px] bg-gradient-to-r from-pink-500 to-rose-500 text-white px-2 py-1 rounded-md font-bold shadow-sm">VIP</span>
                <span className="text-[10px] bg-gradient-to-r from-indigo-500 to-blue-500 text-white px-2 py-1 rounded-md font-bold shadow-sm">💳 Cotización</span>
              </div>
            </div>
            
            {/* Feature 2: Perfil Completo y LTV */}
            <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-gray-100 dark:border-white/10 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl group-hover:bg-violet-500/20 transition-all" />
              <div className="w-12 h-12 bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-500/20 dark:to-fuchsia-500/20 rounded-xl border border-violet-200 dark:border-violet-500/30 shadow-sm flex items-center justify-center text-xl mb-4 relative z-10">
                💎
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                Perfil Deep AI <span className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-[10px] px-2 py-0.5 rounded-full tracking-wider uppercase font-bold shadow-sm">Elite</span>
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm relative z-10 mb-4">
                Mientras chateas, Nilah te muestra el LTV (Gasto Histórico), Score de Fiabilidad y Nivel de Riesgo de la clienta al instante. Sabes a quién tienes enfrente.
              </p>
              <div className="flex flex-col gap-2 relative z-10">
                <div className="flex justify-between items-center bg-gray-50/50 dark:bg-black/20 px-3 py-2 rounded-lg border border-gray-100 dark:border-white/5 shadow-inner">
                  <span className="text-[11px] text-gray-600 dark:text-gray-400 font-medium">Score de Fiabilidad</span>
                  <span className="text-[11px] font-black text-emerald-500 bg-emerald-100/50 dark:bg-emerald-500/10 px-2 py-0.5 rounded">95/100</span>
                </div>
                <div className="flex justify-between items-center bg-gray-50/50 dark:bg-black/20 px-3 py-2 rounded-lg border border-gray-100 dark:border-white/5 shadow-inner">
                   <span className="text-[11px] text-gray-600 dark:text-gray-400 font-medium">Nivel de Riesgo</span>
                   <span className="text-[11px] font-black text-red-500 bg-red-100/50 dark:bg-red-500/10 px-2 py-0.5 rounded">Alto Riesgo ⚠</span>
                </div>
              </div>
            </div>

            {/* Feature 3: Notas Ocultas y Colaboración */}
            <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-gray-100 dark:border-white/10 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all" />
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-500/20 dark:to-amber-500/20 rounded-xl border border-yellow-200 dark:border-yellow-500/30 shadow-sm flex items-center justify-center text-xl mb-4 relative z-10">
                🤫
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex flex-wrap items-center gap-2">
                Notas "Whisper" <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full tracking-wider uppercase font-bold shadow-sm">Elite</span>
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm relative z-10 mb-4">
                Deja notas internas amarillas intercaladas en la conversación. Tu equipo coordina seguimientos y alertas directo en el chat sin que la clienta lo vea.
              </p>
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-700/40 p-3 rounded-xl relative z-10 shadow-sm">
                 <p className="text-[10px] font-extrabold text-yellow-600 dark:text-yellow-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                   <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path></svg>
                   Nota Interna
                 </p>
                 <p className="text-xs text-yellow-800 dark:text-yellow-300 font-medium">Cuidado, canceló 3 veces. Pedir depósito 100%.</p>
              </div>
            </div>

            {/* Feature 4: Control de Depósitos y Nilah Estado */}
            <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md p-6 lg:p-8 rounded-[2rem] border border-gray-100 dark:border-white/10 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group md:col-span-2 lg:col-span-3">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-all" />
              <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                <div className="flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-500/20 dark:to-teal-500/20 rounded-xl border border-emerald-200 dark:border-emerald-500/30 shadow-sm flex items-center justify-center text-xl mb-4">
                    🛡️
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 flex flex-wrap items-center gap-2">
                    Control Absoluto: Botones de Acción <span className="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 text-[10px] px-2 py-0.5 rounded-full tracking-wider uppercase font-bold border border-emerald-200 dark:border-emerald-500/30 shadow-sm">PRO</span>
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm md:text-base">
                    Verifica depósitos de citas pendientes con un solo clic sin salir del chat. Activa o pausa la Inteligencia Artificial al instante si decides tomar el control humano de la conversación. <strong className="font-semibold text-gray-900 dark:text-gray-200">Nilah hace el trabajo pesado y tú apruebas.</strong>
                  </p>
                </div>
                
                <div className="w-full md:w-[350px] bg-[#111B21] rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-gray-800 transform rotate-1 group-hover:rotate-0 transition-transform duration-300">
                  {/* Status Bar Mockup */}
                  <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2">
                       <span className="relative flex h-2.5 w-2.5">
                         <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00A884] opacity-75"></span>
                         <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00A884]"></span>
                       </span>
                       <span className="text-[13px] text-[#E9EDEF] font-bold tracking-wide">Asistente IA Activo</span>
                    </div>
                    <button className="bg-amber-900/40 text-amber-300 text-[11px] px-3 py-1.5 rounded-full font-bold border border-amber-500/30 flex items-center gap-1.5 hover:bg-amber-900/60 transition-colors">
                       <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 9v6m4-6v6L9 2m6 0"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg> Pausar IA
                    </button>
                  </div>
                  
                  {/* Banner de Depósito Mockup */}
                  <div className="bg-gradient-to-r from-amber-900/60 to-yellow-900/40 border border-amber-500/30 rounded-xl p-3.5 flex justify-between items-center shadow-lg">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                        <span className="text-amber-400 text-sm">⚠</span>
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-amber-300">Depósito Pendiente</p>
                        <p className="text-[11px] text-amber-400/80 mt-0.5">Esperando: <span className="font-bold text-amber-200">S/ 50.00</span></p>
                      </div>
                    </div>
                    <button className="bg-amber-400 text-amber-900 text-[11px] font-black px-3 py-2 rounded-lg shadow-sm hover:scale-105 active:scale-95 transition-all">
                      Confirmar
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* === SECCIÓN 5 - DIFERENCIADORES === */}
      <section id="diferenciadores" data-animate className="py-24 bg-white dark:bg-[#0A0A0A]">
        <div className={`mx-auto max-w-6xl px-4 ${getAnimationClass('diferenciadores')}`}>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold leading-tight text-gray-900 dark:text-white max-w-3xl mx-auto">
              No es un sistema de respuestas. <br className="hidden md:block"/>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-pink-500">Es una asesora que creció con tu salón.</span>
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Por qué las dueñas de salón en Latinoamérica no vuelven a trabajar sin Nilah.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: MessageCircle,
                color: 'emerald',
                iconBg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20',
                iconColor: 'text-emerald-600 dark:text-emerald-400',
                glowBg: 'group-hover:bg-emerald-500/10',
                titleAccent: 'text-emerald-600 dark:text-emerald-400',
                title: 'Nilah abre la puerta. Tu equipo la atraviesa.',
                desc: 'Cada mensaje está calibrado para generar respuesta, no para reemplazar la conversación. Tu equipo retoma cuando importa.'
              },
              {
                icon: Heart,
                color: 'rose',
                iconBg: 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20',
                iconColor: 'text-rose-600 dark:text-rose-400',
                glowBg: 'group-hover:bg-rose-500/10',
                titleAccent: 'text-rose-600 dark:text-rose-400',
                title: 'Nunca reemplaza el toque humano.',
                desc: 'Nilah sabe cuándo hacerse a un lado y avisarte. Ese momento es donde tu equipo brilla.'
              },
              {
                icon: Shield,
                color: 'rose',
                iconBg: 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20',
                iconColor: 'text-rose-600 dark:text-rose-400',
                glowBg: 'group-hover:bg-rose-500/10',
                titleAccent: 'text-rose-600 dark:text-rose-400',
                title: 'Tu política de depósitos, sin excepciones.',
                desc: '¿Cobras depósito a todas? Hecho. ¿Solo a clientes con cancelaciones previas? También. Nilah aplica la regla, tú no negocias.'
              },
              {
                icon: BarChart3,
                color: 'violet',
                iconBg: 'bg-violet-50 dark:bg-violet-500/10 border-violet-100 dark:border-violet-500/20',
                iconColor: 'text-violet-600 dark:text-violet-400',
                glowBg: 'group-hover:bg-violet-500/10',
                titleAccent: 'text-violet-600 dark:text-violet-400',
                title: 'Campañas basadas en datos reales.',
                desc: 'Nilah calcula grupos de clientas con tu historial real: cuándo vinieron, cuánto gastaron, si están en riesgo de no volver. Envías a cada una lo que la trae de vuelta.'
              },
              {
                icon: Camera,
                color: 'pink',
                iconBg: 'bg-pink-50 dark:bg-pink-500/10 border-pink-100 dark:border-pink-500/20',
                iconColor: 'text-pink-600 dark:text-pink-400',
                glowBg: 'group-hover:bg-pink-500/10',
                titleAccent: 'text-pink-600 dark:text-pink-400',
                title: 'Cotiza fotos sin malentendidos.',
                desc: 'La clienta manda foto. Nilah la analiza y cotiza según tus precios. Cero sorpresas de "yo creí que era más barato" en el salón.'
              },
              {
                icon: Zap,
                color: 'blue',
                iconBg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20',
                iconColor: 'text-blue-600 dark:text-blue-400',
                glowBg: 'group-hover:bg-blue-500/10',
                titleAccent: 'text-blue-600 dark:text-blue-400',
                title: 'Nunca molesta a quien no debe.',
                desc: 'Si una clienta tiene cita mañana, el sistema no le manda ninguna campaña ese día. No la bombardea. Sabe cuándo parar, como lo haría una persona.'
              },
              {
                icon: Sparkles,
                color: 'fuchsia',
                iconBg: 'bg-fuchsia-50 dark:bg-fuchsia-500/10 border-fuchsia-100 dark:border-fuchsia-500/20',
                iconColor: 'text-fuchsia-600 dark:text-fuchsia-400',
                glowBg: 'group-hover:bg-fuchsia-500/10',
                titleAccent: 'text-fuchsia-600 dark:text-fuchsia-400',
                title: 'Nilah Creative: Flyers listos.',
                desc: 'Después de cada campaña, te generamos las imágenes listas para tus Stories de IG y estados de WA. Sin Canva. En 1 clic.'
              }
            ].map((diff, i) => (
              <div key={i} className="group flex flex-col bg-white dark:bg-[#141414] p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 hover:border-violet-200 dark:hover:border-violet-500/30 transition-all hover:shadow-xl hover:-translate-y-1 relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl ${diff.glowBg} transition-colors`} />
                <div className={`mb-4 ${diff.iconBg} border w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}>
                  <diff.icon size={22} className={diff.iconColor} />
                </div>
                <h4 className={`text-lg font-bold mb-2 ${diff.titleAccent} leading-snug`}>{diff.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 relative z-10 leading-relaxed">{diff.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === SECCIÓN 5.5 - NILAH CREATIVE (STATIC) === */}
      <section id="creative" className="py-24 bg-white dark:bg-[#050505] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-[500px] bg-gradient-to-b from-fuchsia-500/5 to-transparent pointer-events-none" />
        
        <div className={`mx-auto max-w-6xl px-4 relative z-10 ${getAnimationClass('creative')}`}>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-4 rounded-full border border-fuchsia-200 dark:border-fuchsia-500/30 bg-fuchsia-50 dark:bg-fuchsia-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-fuchsia-600 dark:text-fuchsia-400">
              <Camera size={14} /> Nilah Creative
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4 max-w-3xl mx-auto text-gray-900 dark:text-white relative z-10">
              Diseño profesional para tus redes.<br/>
              <span className="text-fuchsia-500">Sin salir de tu panel.</span>
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              Olvídate de Canva o de depender de un diseñador para cada historia. Nilah Creative genera el arte visual para tus campañas usando las fotos de tu galería y la inteligencia de tus promociones.
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-[#0A0A0A] rounded-[2rem] border border-gray-100 dark:border-white/5 p-8 md:p-12 shadow-2xl relative">
            {/* Interactive Tabs Menu */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
              {[
                { id: 'magic', icon: Sparkles, label: 'Visuales de Campaña' },
                { id: 'retouch', icon: Camera, label: 'Retoque Studio' },
                { id: 'free', icon: Leaf, label: 'Estudio Libre' },
                { id: 'gallery', icon: Heart, label: 'Galería VIP' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCreativeTab(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                    activeCreativeTab === tab.id 
                      ? 'bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/20'
                      : 'bg-white dark:bg-[#111] text-gray-500 border border-gray-200 dark:border-white/10 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-500/10 hover:text-fuchsia-600'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Static Content Area - No complex animations */}
            <div className="grid md:grid-cols-2 gap-12 items-center min-h-[300px]">
              
              {/* Active Tab Descriptions */}
              <div className="space-y-6">
                {activeCreativeTab === 'magic' && (
                  <>
                    <div className="inline-block bg-fuchsia-100 dark:bg-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-300 font-bold px-3 py-1 text-xs rounded-full">
                      Incluido en Plan Pro
                    </div>
                    <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-500 to-pink-500">
                      Visuales Estratégicos en 1 Clic
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
                      Olvídate de diseñar. Solo elige una de tus <strong>Campañas Semanales de <span className="whatsapp-highlight">WhatsApp</span></strong> sugeridas por Nilah. El sistema es híbrido: puede usar tus mejores fotos reales o, si no tienes ninguna a la mano, <strong>la IA genera el arte completo desde cero</strong>, adaptado perfectamente a tu audiencia y estrategia semanal.
                    </p>
                    <ul className="space-y-3 mt-4">
                      <li className="flex items-center gap-2 text-sm font-medium"><CheckCircle2 className="text-fuchsia-500" size={16}/> Sincronizado con tus campañas de <span className="whatsapp-highlight">WhatsApp</span></li>
                      <li className="flex items-center gap-2 text-sm font-medium"><CheckCircle2 className="text-fuchsia-500" size={16}/> Segmentación de flyer por cada audiencia</li>
                      <li className="flex items-center gap-2 text-sm font-medium"><CheckCircle2 className="text-fuchsia-500" size={16}/> Diseño inteligente basado en tus mejores trabajos</li>
                    </ul>
                  </>
                )}

                {activeCreativeTab === 'retouch' && (
                  <>
                    <div className="inline-block bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 font-bold px-3 py-1 text-xs rounded-full">
                      Incluido en Plan Pro
                    </div>
                    <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-blue-500">
                      Retoque Studio AI
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
                      Sube la foto del resultado de tu clienta ("el antes y después"). La IA elimina botes de spray del fondo, ajusta la iluminación general del salón e iguala los tonos para un feed de Instagram perfecto y homogeneo.
                    </p>
                    <ul className="space-y-3 mt-4">
                      <li className="flex items-center gap-2 text-sm font-medium"><CheckCircle2 className="text-cyan-500" size={16}/> Eliminación de fondos distractores</li>
                      <li className="flex items-center gap-2 text-sm font-medium"><CheckCircle2 className="text-cyan-500" size={16}/> Corrección de luz automática</li>
                    </ul>
                  </>
                )}

                {activeCreativeTab === 'free' && (
                  <>
                    <div className="inline-block bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-300 font-bold px-3 py-1 text-xs rounded-full">
                      Solo en Glow Elite
                    </div>
                    <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-fuchsia-500">
                      Estudio Libre Premium
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
                      Escribe lo que imaginas. "Un flyer elegante fondo negro anunciando 20% en keratina por el día de las madres". Nilah te genera la gráfica desde cero en 15 segundos sin usar plantillas recicladas de Canva. Único para tu salón.
                    </p>
                    <ul className="space-y-3 mt-4">
                      <li className="flex items-center gap-2 text-sm font-medium"><CheckCircle2 className="text-violet-500" size={16}/> Gráficas 100% originales</li>
                      <li className="flex items-center gap-2 text-sm font-medium"><CheckCircle2 className="text-violet-500" size={16}/> Entiende descripciones por texto corto</li>
                    </ul>
                  </>
                )}

                {activeCreativeTab === 'gallery' && (
                  <>
                    <div className="inline-block bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-300 font-bold px-3 py-1 text-xs rounded-full">
                      Incluido en Todos los Planes
                    </div>
                    <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-rose-500">
                      Bóveda VIP Autónoma
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed mb-4">
                      Mucho más que una carpeta desorganizada. Nilah agrupa tus mejores artes visuales, listos para tu próxima promoción de manera súper fluida y orgánica.
                    </p>
                    <ul className="space-y-4">
                      <li className="flex gap-3 text-sm">
                        <CheckCircle2 className="text-pink-500 shrink-0 mt-0.5" size={18}/> 
                        <div><span className="font-bold text-gray-900 dark:text-white">Masonry Layout (Pinterest):</span> Visualización artística que no recorta de forma cuadrada tus fotos, se adapta al vuelo y brilla en pantallas grandes.</div>
                      </li>
                      <li className="flex gap-3 text-sm">
                        <CheckCircle2 className="text-pink-500 shrink-0 mt-0.5" size={18}/> 
                        <div><span className="font-bold text-gray-900 dark:text-white">Auto-Etiquetado IA:</span> Nilah interpreta la esencia de las creatividades y les asigna estilos u emociones de forma invisible, ej: "Glamour", "Manicura Viva".</div>
                      </li>
                      <li className="flex gap-3 text-sm">
                        <CheckCircle2 className="text-pink-500 shrink-0 mt-0.5" size={18}/> 
                        <div><span className="font-bold text-gray-900 dark:text-white">Conexión Al Estudio (1 Clic):</span> Cada imagen recuerda cómo se armó. Da un clic en "Retocar" para mandar la imagen al editor mágico y aplicarle nuevas rebajas.</div>
                      </li>
                    </ul>
                  </>
                )}
              </div>

              {/* Static Showcase Graphic */}
              <div className="flex justify-center">
                <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#111] border border-gray-100 dark:border-white/10 p-4 shadow-xl">
                  {/* Mockup Top */}
                  <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-white/5 pb-3">
                    <span className="text-xs font-bold text-gray-400 uppercase">Vista Previa Visual</span>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-red-400"></div>
                      <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    </div>
                  </div>
                  
                  {/* Mockup Mock Image Display */}
                  <div className={`aspect-[9/16] rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 transition-all duration-700 relative group/img ${
                    activeCreativeTab === 'magic' ? 'shadow-[0_0_30px_rgba(236,72,153,0.15)]' :
                    activeCreativeTab === 'retouch' ? 'shadow-[0_0_30px_rgba(6,182,212,0.15)]' :
                    activeCreativeTab === 'free' ? 'shadow-[0_0_30px_rgba(139,92,246,0.15)]' :
                    'shadow-[0_0_30px_rgba(244,63,94,0.15)]'
                  }`}>
                    {/* Image handling with support for array (carousel) */}
                    {activeCreativeTab === 'magic' ? (
                      creativeImages.magic.map((src, idx) => (
                        <img 
                          key={src}
                          src={src} 
                          alt={`Nilah Creative - Magic ${idx}`}
                          className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-1000 ${
                            magicImageIndex === idx ? 'opacity-100' : 'opacity-0'
                          }`}
                        />
                      ))
                    ) : activeCreativeTab === 'gallery' ? (
                      <div className="absolute inset-0 w-full h-full overflow-y-auto p-3 scrollbar-hide bg-gray-100 dark:bg-[#111]">
                        <div className="columns-2 gap-3 space-y-3">
                          {creativeImages.gallery.map((item) => (
                            <div key={item.id} className="relative group/masonry rounded-xl overflow-hidden break-inside-avoid bg-white dark:bg-[#111]">
                              <img 
                                src={item.src} 
                                alt={item.tags[0]} 
                                className="w-full h-auto object-cover transition-transform duration-500 group-hover/masonry:scale-105"
                                onError={(e) => {
                                  // Ocultar imagen rota y mostrar un placeholder estilizado
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  const parent = (e.target as HTMLImageElement).parentElement;
                                  if (parent) {
                                    parent.classList.add('p-4', 'min-h-[100px]', 'flex', 'items-center', 'justify-center', 'border', 'border-gray-100', 'dark:border-white/10');
                                    const text = document.createElement('div');
                                    text.className = 'text-[10px] font-bold text-pink-500 uppercase text-center';
                                    text.innerText = item.tags[0];
                                    parent.prepend(text);
                                  }
                                }}
                              />
                              {/* Hover Overlay with AI Tags */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover/masonry:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2 cursor-pointer">
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {item.tags.map(tag => (
                                    <span key={tag} className="text-[9px] font-medium bg-pink-500 text-white px-2 py-0.5 rounded-full shadow-sm">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                                <button className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-md rounded py-1.5 text-white text-[10px] font-bold transition-colors uppercase tracking-wider">
                                  Usar en Promo
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <img 
                        src={creativeImages[activeCreativeTab as keyof typeof creativeImages] as string} 
                        alt={`Nilah Creative - ${activeCreativeTab}`}
                        className="w-full h-full object-contain transition-transform duration-700 group-hover/img:scale-105"
                      />
                    )}
                    
                    {/* Overlay Info (Optional/Subtle) */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-end p-4">
                      <p className="text-white text-[10px] font-bold uppercase tracking-widest bg-black/40 backdrop-blur-md px-2 py-1 rounded">Visual de muestra</p>
                    </div>
                  </div>
                  
                  {/* Mockup Footer */}
                  <div className="mt-4 flex gap-2">
                    <div className="h-8 flex-1 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/5 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-gray-400">Descargar JPG</span>
                    </div>
                    <div className="h-8 w-8 bg-fuchsia-500 rounded-lg flex items-center justify-center shadow-lg shadow-fuchsia-500/30">
                      <ArrowRight size={14} className="text-white" />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>
      {/* === SECCIÓN 5.7 - CONTROL DE INVENTARIO === */}
      <section id="inventario" className="py-24 bg-gradient-to-b from-emerald-50/30 to-white dark:from-[#061410] dark:to-[#0A0A0A] relative overflow-hidden">
        {/* Ambient decorations */}
        <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-6xl px-4 relative z-10">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-4 rounded-full border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              <Package size={14} /> ✓ Disponible desde el Plan Glow PRO
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold leading-tight text-gray-900 dark:text-white max-w-3xl mx-auto mb-4">
              Sabe exactamente qué tienes<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">y qué te está faltando.</span>
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Tu inventario de productos, materiales y herramientas — siempre al día, sin planillas ni papelitos sueltos.
              <span className="block mt-2 font-semibold text-gray-700 dark:text-gray-300">Nunca más pierdas una cita por quedarte sin un producto.</span>
            </p>
          </div>

          {/* Main content — 2-col layout */}
          <div className="md:flex gap-12 items-start">

            {/* Left — 4 benefit cards */}
            <div className="md:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 md:mb-0">
              {[
                {
                  emoji: '📦',
                  color: 'emerald',
                  borderColor: 'border-emerald-100 dark:border-emerald-500/20',
                  bgColor: 'bg-emerald-50 dark:bg-emerald-500/10',
                  title: 'Sabe cuánto tienes',
                  desc: 'Ve tu stock en tiempo real: cuántos frascos, cuántas brochas, cuánto queda de cada cosa. Sin sorpresas el día que más lo necesitas.'
                },
                {
                  emoji: '⚠️',
                  color: 'amber',
                  borderColor: 'border-amber-100 dark:border-amber-500/20',
                  bgColor: 'bg-amber-50 dark:bg-amber-500/10',
                  title: 'Te avisa antes de quedarte sin nada',
                  desc: 'Configuras tu mínimo y el sistema te alerta cuando estás a punto de agotar. Jamás pierdes una cita por falta de materiales.'
                },
                {
                  emoji: '🏪',
                  color: 'violet',
                  borderColor: 'border-violet-100 dark:border-violet-500/20',
                  bgColor: 'bg-violet-50 dark:bg-violet-500/10',
                  title: 'Organizado por proveedor',
                  desc: 'Registra de qué tienda compraste cada producto. Si necesitas reponer, ya sabes exactamente a quién llamar.'
                },
                {
                  emoji: '🏷️',
                  color: 'pink',
                  borderColor: 'border-pink-100 dark:border-pink-500/20',
                  bgColor: 'bg-pink-50 dark:bg-pink-500/10',
                  title: 'Por categoría, marca y uso',
                  desc: 'Uñas, cabello, pestañas, herramientas — todo separado, organizado y fácil de encontrar cuando más lo necesitas.'
                }
              ].map((card, i) => (
                <div
                  key={i}
                  className={`group flex flex-col gap-3 bg-white dark:bg-[#141414] rounded-2xl p-5 border ${card.borderColor} shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
                >
                  <div className={`w-11 h-11 rounded-xl ${card.bgColor} border ${card.borderColor} flex items-center justify-center text-xl group-hover:scale-110 transition-transform`}>
                    {card.emoji}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{card.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{card.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right — Visual mock of inventory interface */}
            <div className="md:w-1/2">
              <div className="bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/8 rounded-[2rem] shadow-2xl shadow-emerald-500/5 overflow-hidden">
                {/* Mock header */}
                <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-b border-emerald-100 dark:border-white/5 px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white text-sm">📦</div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">Mi Inventario</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">28 productos · 3 alertas activas</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse" />
                    <span className="text-xs text-red-400 font-bold">3 por reponer</span>
                  </div>
                </div>

                {/* Category tabs */}
                <div className="flex gap-2 px-5 py-3 border-b border-gray-100 dark:border-white/5 overflow-x-auto">
                  {['💅 Uñas', '👁 Pestañas', '💇 Cabello', '🔧 Herramientas'].map((cat, i) => (
                    <span key={i} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${i === 0 ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400'}`}>
                      {cat}
                    </span>
                  ))}
                </div>

                {/* Product list */}
                <div className="p-4 space-y-2">
                  {[
                    { name: 'Gel UV Rosa Nude', brand: 'Masglo', stock: 3, min: 2, unit: 'frascos', status: 'ok' },
                    { name: 'Brochas para acrílico', brand: 'Nail Art Pro', stock: 1, min: 3, unit: 'unidades', status: 'alert' },
                    { name: 'Glitter holográfico', brand: 'Kiara Sky', stock: 5, min: 2, unit: 'potes', status: 'ok' },
                    { name: 'Removedor acetona', brand: 'Generic', stock: 0, min: 2, unit: 'litros', status: 'empty' },
                    { name: 'Top coat brillante', brand: 'OPI', stock: 4, min: 1, unit: 'frascos', status: 'ok' },
                  ].map((prod, i) => (
                    <div key={i} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                      prod.status === 'empty'
                        ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20'
                        : prod.status === 'alert'
                        ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
                        : 'bg-gray-50 dark:bg-white/3 border-gray-100 dark:border-white/5'
                    }`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 font-bold ${
                          prod.status === 'empty' ? 'bg-red-100 dark:bg-red-500/20 text-red-500' :
                          prod.status === 'alert' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-500' :
                          'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-500'
                        }`}>
                          {prod.status === 'empty' ? '0' : prod.stock}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">{prod.name}</p>
                          <p className="text-[10px] text-gray-400 truncate">{prod.brand} · mín. {prod.min} {prod.unit}</p>
                        </div>
                      </div>
                      <span className={`ml-2 flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        prod.status === 'empty' ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400' :
                        prod.status === 'alert' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                        'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {prod.status === 'empty' ? '🚨 Agotado' : prod.status === 'alert' ? '⚠️ Bajo' : '✓ OK'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer CTA */}
                <div className="px-4 pb-4">
                  <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-3 text-center">
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
                      📲 Recibe alertas de stock bajo directo en tu <span className="whatsapp-highlight">WhatsApp</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Guarantee badge below mock */}
              <div className="mt-4 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
                <span>Sin instalaciones. Lo tienes desde el día 1 en tu panel.</span>
              </div>
            </div>
          </div>

          {/* Bottom feature strip */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { icon: '🔍', text: 'Búsqueda rápida por nombre o marca' },
              { icon: '📊', text: 'Valor total del inventario calculado' },
              { icon: '🏭', text: 'Registro de proveedores y tiendas' },
              { icon: '✏️', text: 'Crea y edita productos en segundos' },
            ].map((feat, i) => (
              <div key={i} className="flex items-center gap-3 bg-white dark:bg-[#141414] rounded-2xl border border-gray-100 dark:border-white/5 p-4 shadow-sm">
                <span className="text-xl flex-shrink-0">{feat.icon}</span>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium leading-tight">{feat.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === SECCIÓN 6 - CÓMO FUNCIONA === */}
      <section id="como-funciona" data-animate className="py-24 bg-gradient-to-b from-gray-50 to-white dark:from-[#0E0E0E] dark:to-[#0A0A0A]">
        <div className={`mx-auto max-w-5xl px-4 text-center ${getAnimationClass('como-funciona')}`}>
          <div className="inline-flex items-center gap-2 mb-4 rounded-full border border-violet-200 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
            El Proceso
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4 max-w-3xl mx-auto">
            Dos caminos. Elige el tuyo.
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-14">Sin conocimientos técnicos. Sin instalar nada en tu computadora.</p>

          <div className="grid md:grid-cols-2 gap-6 mb-12">

            {/* PATH FREE */}
            <div className="relative rounded-3xl bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/5 p-8 text-left shadow-sm hover:shadow-lg transition-shadow">
              <div className="absolute top-4 right-4 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                Gratis · Autoservicio
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/20">
                <Sparkles size={26} className="text-white" />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-2">Plan Free — Como bajar una app</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
                Sin esperas. Sin que nosotros toquemos nada. Tú lo configuras sola en minutos, igual que cuando creas un perfil de Instagram.
              </p>
              <div className="space-y-3">
                {[
                  { icon: '1️⃣', text: 'Te registras con tu correo. En segundos tienes acceso a tu panel.' },
                  { icon: '2️⃣', text: 'Agregas tus servicios, precios y tu información del salón.' },
                  { icon: '3️⃣', text: 'Empiezas a cargar tus clientas y organizar tu agenda. ¡Listo!' },
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                    <span className="text-lg leading-none mt-0.5">{s.icon}</span>
                    <span>{s.text}</span>
                  </div>
                ))}
              </div>
              <Link
                to="/auth?plan=free"
                className="mt-6 w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <Sparkles size={16} /> Empezar gratis ahora →
              </Link>
            </div>

            {/* PATH PRO */}
            <div className="relative rounded-3xl bg-gradient-to-br from-violet-600 to-fuchsia-700 p-8 text-left shadow-xl overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute top-4 right-4 bg-white/20 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-sm">
                Glow Pro & Elite
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-5 shadow-lg">
                <Zap size={26} className="text-white" />
              </div>
              <h3 className="text-xl font-extrabold text-white mb-2">Plan Pro — Nosotros lo hacemos todo</h3>
              <p className="text-sm text-white/80 leading-relaxed mb-6 relative z-10">
                Pagas el setup una vez y nuestro equipo configura absolutamente todo: el bot, tu WhatsApp Business, tus servicios, tu equipo y tus automatizaciones.
              </p>
              <div className="space-y-3 relative z-10">
                {[
                  { num: '1', text: 'Setup en 3–5 días. Nosotros configuramos e integramos todo.' },
                  { num: '2', text: 'Prueba supervisada 7 días. Ajustamos contigo en vivo.' },
                  { num: '3', text: 'Nilah trabaja: informa, avisa y tú cierras la cita.' },
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-white/90">
                    <span className="h-5 w-5 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-[11px] font-black shrink-0 mt-0.5">{s.num}</span>
                    <span>{s.text}</span>
                  </div>
                ))}
              </div>
              <a
                href="https://wa.me/51999999999?text=Hola!%20Quiero%20el%20plan%20Pro%20de%20Nilah"
                target="_blank" rel="noopener noreferrer"
                className="mt-6 w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-white text-violet-700 font-bold text-sm shadow-lg hover:scale-[1.02] active:scale-95 transition-all relative z-10"
              >
                <MessageCircle size={16} /> Hablar con el equipo →
              </a>
              <p className="text-center text-white/50 text-[11px] mt-3 relative z-10">Garantía 7 días · Si no funciona, te devolvemos el setup.</p>
            </div>

          </div>
        </div>
      </section>


      {/* === SECCIÓN 7 - PRECIOS === */}
      <section id="precios" data-animate className="py-24 bg-white dark:bg-[#0A0A0A]">
        <div className={`mx-auto max-w-6xl px-4 ${getAnimationClass('precios')}`}>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-4 rounded-full border border-pink-200 dark:border-pink-500/30 bg-pink-50 dark:bg-pink-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400">
              Inversión
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">Un sistema. Tres niveles.</h2>
            <p className="text-lg text-gray-500 dark:text-gray-400">Precios en USD · Equivalencia en Soles para Perú.</p>
            {/* Urgency banner */}
            <div className="mt-5 inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 px-5 py-2.5 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <p className="text-sm font-bold text-amber-700 dark:text-amber-400">Precio de lanzamiento activo — primeros 20 salones. Sube cuando se complete el cupo.</p>
            </div>
          </div>
          
          {/* GANCHO FREE - antes de las tarjetas */}
          <div className="mb-10 rounded-3xl bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-500/10 dark:to-fuchsia-500/10 border border-violet-200 dark:border-violet-500/30 p-6 md:p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-violet-300/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 bg-white dark:bg-violet-500/20 text-violet-600 dark:text-violet-300 text-xs font-bold px-3 py-1.5 rounded-full border border-violet-200 dark:border-violet-500/30 mb-4">
                ✨ Sin tarjeta · Sin compromisos
              </span>
              <h3 className="text-xl md:text-2xl font-extrabold text-gray-900 dark:text-white mb-2">
                ¿Quieres probarlo antes de pagar?
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base max-w-lg mx-auto mb-5 leading-relaxed">
                Organiza tu agenda y tus clientas completamente gratis. Cuando veas cuánto dinero tienes dormido en tu lista de contactos, vas a entender sola por qué existe el plan Pro.
              </p>
              <Link
                to="/auth?plan=free"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold px-8 py-3.5 rounded-full shadow-lg shadow-violet-500/30 hover:scale-105 hover:shadow-violet-500/50 active:scale-95 transition-all text-sm md:text-base"
              >
                <Sparkles size={18} /> Empezar gratis ahora →
              </Link>
              <p className="mt-3 text-xs text-gray-400">
                Hasta 100 clientas gratis. Sin automatizaciones de marketing (eso es el plan Pro).
              </p>
            </div>
          </div>

          {/* Pricing Grid: Nilah Free, Glow Pro, & Glow Elite */}
          <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6 mb-12 max-w-[85rem] px-4 mx-auto">
            
            {/* PLAN FREE */}
            <div className="h-full relative">
              <ParallaxTiltWrapper className="h-full">
                <div className="neon-border-container relative bg-white dark:bg-[#040f0a] rounded-[2rem] p-0.5 shadow-xl ultra-card-shadow-emerald h-full overflow-hidden group hover:shadow-emerald-500/30 transition-shadow">
                  <div className="neon-border-glow-emerald" />
                
                  <div className="relative z-10 bg-white dark:bg-[#040f0a] rounded-[1.95rem] p-6 lg:p-8 flex flex-col h-full">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col h-full">
                      <div className="flex justify-between items-start mb-5">
                        <div>
                          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Nilah Free</h3>
                          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Para empezar · Hasta 100 clientas</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                          <Calendar size={20} className="text-white" />
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <div className="flex items-baseline gap-1.5 mb-1">
                          <span className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tighter">S/ 0</span>
                          <span className="text-gray-500 font-semibold text-xs">/mes para siempre</span>
                        </div>
                        <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold">Sin tarjeta de crédito</p>
                      </div>

                      <div className="space-y-2.5 mb-6">
                        {[
                          {
                            icon: <Calendar size={17} className="text-white" />,
                            bg: 'bg-emerald-600 shadow-emerald-500/20',
                            border: 'border-emerald-500/20',
                            title: 'Agenda básica',
                            desc: 'Vista lista y mensual de tus citas. Tú agendas, tú controlas.'
                          },
                          {
                            icon: <Users size={17} className="text-white" />,
                            bg: 'bg-cyan-500 shadow-cyan-500/20',
                            border: 'border-cyan-500/20',
                            title: 'Tus clientas + ficha técnica',
                            desc: 'Ver tu lista de clientas y su historial de servicios y notas.'
                          },
                          {
                            icon: <BarChart3 size={17} className="text-white" />,
                            bg: 'bg-violet-500 shadow-violet-500/20',
                            border: 'border-violet-500/20',
                            title: 'Dashboard operativo',
                            desc: 'Métricas del día y los servicios que más piden tus clientas.'
                          },
                          {
                            icon: <Wallet size={17} className="text-white" />,
                            bg: 'bg-pink-500 shadow-pink-500/20',
                            border: 'border-pink-500/20',
                            title: 'Finanzas básicas',
                            desc: 'Resumen de ingresos y control de tus gastos del salón.'
                          },
                          {
                            icon: <Settings size={17} className="text-white" />,
                            bg: 'bg-amber-500 shadow-amber-500/20',
                            border: 'border-amber-500/20',
                            title: 'Configuración inicial',
                            desc: 'Tu información general y tu catálogo de servicios con precios.'
                          },
                        ].map((feat, i) => (
                          <div key={i} className={`flex items-center gap-3 p-3 rounded-xl glass-widget border ${feat.border} shadow-sm`}>
                            <div className={`w-8 h-8 rounded-lg ${feat.bg} shadow-lg flex items-center justify-center shrink-0`}>
                              {feat.icon}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{feat.title}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug mt-0.5">{feat.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mb-4 p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-dashed border-gray-200 dark:border-white/10">
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center leading-relaxed">
                          🤖 La Asesora IA (Nilah) y automatizaciones están disponibles en el plan <span className="font-bold text-violet-500">Glow Pro</span>
                        </p>
                      </div>


                      <div className="mt-auto">
                        <Link 
                          to="/auth?plan=free"
                          className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-bold text-base hover:bg-emerald-50 hover:border-emerald-200 dark:hover:bg-emerald-500/10 dark:hover:border-emerald-500/30 hover:scale-[1.02] active:scale-95 transition-all relative z-10"
                        >
                          Elegir Free
                          <ArrowRight size={20} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </ParallaxTiltWrapper>
            </div>

            {/* PLAN GLOW PRO */}
            <div className="h-full relative">
              {/* MÁS VENDIDO BADGE (Fuera del overflow y 3D context para visibilidad total) */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap z-50 tracking-widest animate-pulse border border-white/20">
                MÁS VENDIDO — EL ESTÁNDAR PRO
              </div>

              <ParallaxTiltWrapper className="h-full">
                <div className="neon-border-container relative bg-white dark:bg-[#06040f] rounded-[2rem] p-0.5 shadow-2xl ultra-card-shadow h-full overflow-hidden group">
                  {/* ANIMATED NEON BORDER */}
                  <div className="neon-border-glow" />
                
                <div className="relative z-10 bg-white dark:bg-[#06040f] rounded-[1.95rem] p-6 lg:p-8 flex flex-col h-full">
                  {/* GLOSS EFFECT OVERLAY */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="relative z-10 flex flex-col h-full">
                    {/* PLAN HEADER */}
                    <div className="flex justify-between items-start mb-5">
                      <div>
                        <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Glow Pro</h3>
                        <p className="text-[10px] font-bold text-violet-500 uppercase tracking-widest mt-1">Ecosistema Completo</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                        <Rocket size={20} className="text-white" />
                      </div>
                    </div>
                    
                    {/* Price Display */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-1.5 mb-1">
                        <span className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tighter">${planPrices.pro}</span>
                        <span className="text-gray-500 font-semibold text-xs">USD/mes</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-base font-bold text-violet-600 dark:text-violet-400">S/ {planPrices.pro_pen}<span className="text-xs font-normal">/mes</span></p>
                        <span className="text-xs text-gray-400 line-through font-medium">S/ {planPrices.pro_reg_pen}</span>
                      </div>
                    </div>

                    {/* CORE FEATURES: ULTRA WIDGETS */}
                    <div className="space-y-3 mb-6">
                      {/* #1: EL CORAZÓN */}
                      <div className="flex gap-4 p-3.5 rounded-2xl glass-widget border border-violet-500/20 shadow-sm hover:scale-[1.01] transition-all group">
                        <div className="w-10 h-10 rounded-lg bg-violet-600 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform">
                          <Zap size={20} className="text-white" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-gray-900 dark:text-white leading-tight">Protocolo de Rescate IA</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug mt-1">Recupera clientas inactivas a los 35/60/90 días.</p>
                        </div>
                      </div>

                      {/* #2: VENTAS */}
                      <div className="flex gap-4 p-3.5 rounded-2xl glass-widget border border-amber-500/20 shadow-sm hover:scale-[1.01] transition-all group">
                        <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
                          <Megaphone size={20} className="text-white" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-gray-900 dark:text-white leading-tight">Marketing de Difusión Pro</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug mt-1">Campañas masivas a <span className="whatsapp-highlight">WhatsApp</span> en segundos.</p>
                        </div>
                      </div>

                      {/* #3: DISEÑO */}
                      <div className="flex gap-4 p-3.5 rounded-2xl glass-widget border border-fuchsia-500/20 shadow-sm hover:scale-[1.01] transition-all group">
                        <div className="w-10 h-10 rounded-lg bg-fuchsia-600 flex items-center justify-center shrink-0 shadow-lg shadow-fuchsia-500/20 group-hover:scale-105 transition-transform">
                          <Camera size={20} className="text-white" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-gray-900 dark:text-white leading-tight">Social Media Studio IA</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug mt-1">Flyers impactantes creados por Nilah para tus redes.</p>
                        </div>
                      </div>

                      {/* #4: NUEVO - RETOQUE */}
                      <div className="flex gap-4 p-3.5 rounded-2xl glass-widget border border-emerald-500/20 shadow-sm hover:scale-[1.01] transition-all group">
                        <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                          <Clock size={20} className="text-white" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-gray-900 dark:text-white leading-tight">Auto-Retoque Inteligente</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug mt-1">Nilah avisa cuándo toca volver según el servicio.</p>
                        </div>
                      </div>
                    </div>

                    {/* STRATEGIC CTA BUTTON */}
                    <Link 
                      to="/auth?plan=pro"
                      className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-base shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-[1.02] active:scale-95 transition-all mb-6 relative z-10"
                    >
                      Agendar mi Demo Glow Pro
                      <ArrowRight size={20} />
                    </Link>

                    {/* CATEGORIZED FULL ECOSYSTEM */}
                    <div className="mt-auto">
                      <button 
                        onClick={() => setShowMoreBenefits(prev => ({ ...prev, pro: !prev.pro }))}
                        className="flex items-center justify-between w-full text-violet-600 dark:text-violet-400 font-bold text-[13px] py-3.5 border-t border-gray-100 dark:border-white/5 group"
                      >
                        <span className="uppercase tracking-widest">Explorar el Ecosistema Pro</span>
                        <ChevronDown size={18} className={`transition-transform duration-500 ${showMoreBenefits.pro ? 'rotate-180' : ''}`} />
                      </button>

                      <div className={`overflow-hidden transition-all duration-700 ease-in-out ${showMoreBenefits.pro ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                        <div className="space-y-6 pb-6">
                          {/* CATEGORY 1 */}
                          <div>
                            <p className="text-[11px] font-bold text-amber-600 uppercase tracking-[0.2em] mb-2.5 flex items-center gap-2">
                              <Target size={14} /> Crecimiento y Escala
                            </p>
                            <div className="grid grid-cols-1 gap-2">
                               { [<>4 Campañas <span className="whatsapp-highlight">WhatsApp</span> / mes</>, 'Asistente de Redacción IA', 'Segmentación de Públicos Pro', 'Medición de Ganancia Real'].map((f, i) => (
                                <div key={i} className="flex items-start gap-3 text-sm font-medium text-gray-700 dark:text-gray-300 leading-snug">
                                  <CheckCircle2 size={15} className="text-amber-500 shrink-0 mt-0.5" />
                                  <span>{f}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* CATEGORY 2 */}
                          <div>
                            <p className="text-[11px] font-bold text-violet-600 uppercase tracking-[0.2em] mb-2.5 flex items-center gap-2">
                              <Settings size={14} /> Operativa Inteligente
                            </p>
                            <div className="grid grid-cols-1 gap-2">
                              {['Tablero de Métricas en Vivo', 'Tu Agenda Priorizada IA', 'Cierre de Caja Automático', 'Manual y Control de Stock'].map((f, i) => (
                                <div key={i} className="flex items-start gap-3 text-sm font-medium text-gray-700 dark:text-gray-300 leading-snug">
                                  <CheckCircle2 size={15} className="text-violet-500 shrink-0 mt-0.5" />
                                  <span>{f}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* CATEGORY 3 */}
                          <div>
                            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-[0.2em] mb-2.5 flex items-center gap-2">
                              <Heart size={14} /> Fidelidad Premium
                            </p>
                            <div className="grid grid-cols-1 gap-2">
                              {['Encuestas de Satisfacción', 'Puntajes de Fidelidad', 'Editor de Fotos Studio', 'Ranking de Personal'].map((f, i) => (
                                <div key={i} className="flex items-start gap-3 text-sm font-medium text-gray-700 dark:text-gray-300 leading-snug">
                                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                                  <span>{f}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              </ParallaxTiltWrapper>
            </div>

            {/* PLAN GLOW ELITE */}
            <div className="h-full relative">
              <ParallaxTiltWrapper className="h-full">
                <div className="neon-border-container relative bg-white dark:bg-[#040b0f] rounded-[2rem] p-0.5 shadow-2xl ultra-card-shadow-cyan h-full overflow-hidden group hover:shadow-cyan-500/30 transition-shadow">
                  <div className="neon-border-glow-cyan" />
                
                <div className="relative z-10 bg-white dark:bg-[#040b0f] rounded-[1.95rem] p-6 xl:p-8 flex flex-col h-full">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-5">
                      <div>
                        <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Glow Elite</h3>
                        <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest mt-1">Operativa sin manual</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                        <Sparkles size={20} className="text-white" />
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <div className="flex items-baseline gap-1.5 mb-1">
                        <span className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tighter">${planPrices.copilot}</span>
                        <span className="text-gray-500 font-semibold text-xs">USD/mes</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-base font-bold text-cyan-600 dark:text-cyan-400">S/ {planPrices.copilot_pen}<span className="text-xs font-normal">/mes</span></p>
                        <span className="text-xs text-gray-400 line-through font-medium">S/ {planPrices.copilot_reg_pen}</span>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex gap-4 p-3.5 rounded-2xl glass-widget border border-cyan-500/20 shadow-sm hover:scale-[1.01] transition-all group">
                        <div className="w-10 h-10 rounded-lg bg-cyan-600 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                          <Bot size={20} className="text-white" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-gray-900 dark:text-white leading-tight">Nilah Lumina</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug mt-1">Briefing y alertas VIP.</p>
                        </div>
                      </div>

                      <div className="flex gap-4 p-3.5 rounded-2xl glass-widget border border-blue-500/20 shadow-sm hover:scale-[1.01] transition-all group">
                        <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                          <MessageCircle size={20} className="text-white" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-gray-900 dark:text-white leading-tight">Inbox 2.0 Premium</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug mt-1">Carpetas, Perfil 360°, Whisper.</p>
                        </div>
                      </div>

                      <div className="flex gap-4 p-3.5 rounded-2xl glass-widget border border-teal-500/20 shadow-sm hover:scale-[1.01] transition-all group">
                        <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center shrink-0 shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
                          <Settings size={20} className="text-white" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-gray-900 dark:text-white leading-tight">Nómina Automática</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug mt-1">Comisiones y reportes reales.</p>
                        </div>
                      </div>

                      <div className="flex gap-4 p-3.5 rounded-2xl glass-widget border border-fuchsia-500/20 shadow-sm hover:scale-[1.01] transition-all group">
                        <div className="w-10 h-10 rounded-lg bg-cyan-600 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                          <Camera size={20} className="text-white" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-gray-900 dark:text-white leading-tight">Estudio Libre Premium</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug mt-1">Visuales IA sin plantillas.</p>
                        </div>
                      </div>
                    </div>

                    <Link 
                      to="/auth?plan=elite"
                      className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-base shadow-xl shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.02] active:scale-95 transition-all mb-6 relative z-10"
                    >
                      Aplicar a Glow Elite
                      <ArrowRight size={20} />
                    </Link>

                    <div className="mt-auto">
                      <button 
                        onClick={() => setShowMoreBenefits(prev => ({ ...prev, elite: !prev.elite }))}
                        className="flex items-center justify-between w-full text-cyan-600 dark:text-cyan-400 font-bold text-[13px] py-3.5 border-t border-gray-100 dark:border-white/5 group"
                      >
                        <span className="uppercase tracking-widest">Ver todo lo incluido</span>
                        <ChevronDown size={18} className={`transition-transform duration-500 ${showMoreBenefits.elite ? 'rotate-180' : ''}`} />
                      </button>

                      <div className={`overflow-hidden transition-all duration-700 ease-in-out ${showMoreBenefits.elite ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                        <div className="space-y-6 pb-6">
                          <div>
                            <div className="grid grid-cols-1 gap-2">
                              {[
                                'LTV Impact Analysis: fidelidad sube el ticket', 
                                'Alerta temprana: clienta VIP en riesgo', 
                                'NPS con segmentación de promotoras', 
                                'Alerta de tasa de canje estancada', 
                                'Bóveda VIP Autónoma (galería asistida)', 
                                'Soporte Prioritario 1 a 1'
                              ].map((f, i) => (
                                <div key={i} className="flex items-start gap-3 text-sm font-medium text-gray-700 dark:text-gray-300 leading-snug">
                                  <CheckCircle2 size={16} className="text-cyan-500 shrink-0 mt-0.5" />
                                  <span>{f}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              </ParallaxTiltWrapper>
            </div>
            
          </div>

          {/* ROI Calculator Nota */}
          <div className="max-w-3xl mx-auto mb-10 text-center bg-violet-50 dark:bg-violet-500/10 rounded-2xl p-6 border border-violet-100 dark:border-violet-500/20">
            <h4 className="font-bold text-lg mb-2 text-violet-700 dark:text-violet-300 flex items-center justify-center gap-2">
              <BarChart3 size={20}/> ¿Cuánto puede dejarte en el primer mes?
            </h4>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
              Si tu salón tiene 200 contactos en <span className="whatsapp-highlight">WhatsApp</span> y solo una de las automatizaciones de Nilah reactiva al 10% de ellos, 
              son <span className="font-bold text-gray-900 dark:text-white">20 citas nuevas ese mes.</span><br/>
              A $15 USD promedio por cita: <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md">mínimo $300 USD <span className="text-[10px] opacity-70 ml-1">(S/ 1,140)</span> recuperados.</span><br/>
              <span className="text-xs opacity-80 mt-1 block italic">Y esto es solo con una campaña — el impacto total con todo el sistema es muy superior.</span><br/>
              El Plan Pro cuesta <span className="font-bold text-violet-600 dark:text-violet-400">${planPrices.pro} USD</span>. <strong className="text-gray-900 dark:text-white">El primer mes ya está pagado y te queda ganancia encima.</strong>
            </p>
          </div>

          {/* CAJA SEPARADA: SETUP */}
          <div className="max-w-3xl mx-auto relative rounded-3xl bg-gray-900 text-white p-8 md:p-12 shadow-2xl overflow-hidden group">
             <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
            
            <div className="md:flex gap-8 relative z-10">
              <div className="md:w-1/3 mb-6 md:mb-0">
                <div className="inline-flex items-center justify-center h-16 w-16 bg-white/10 rounded-2xl mb-4 text-violet-400 backdrop-blur-sm">
                  <Zap size={32} />
                </div>
                <h4 className="text-2xl font-bold mb-2">Setup Inicial</h4>
                <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">Pago único · No mensual</p>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-bold text-white">${planPrices.setup}</span>
                  <span className="text-gray-400 text-sm">USD</span>
                  <span className="text-gray-500 text-sm line-through">${planPrices.setup_reg}</span>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm font-semibold text-violet-300">S/ {planPrices.setup_pen}</span>
                  <span className="text-xs text-gray-500 line-through">S/ {planPrices.setup_reg_pen}</span>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  El setup no es un trámite técnico. Es la diferencia entre un sistema que funciona desde el día 1 y uno que nunca arranca.
                </p>
              </div>
              <div className="md:w-2/3">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4 bg-white/5 inline-block px-3 py-1 rounded-lg">QUÉ HACEMOS NOSOTROS:</p>
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex gap-2"><CheckCircle2 size={16} className="text-emerald-400 shrink-0" /> Personalización con tu nombre y estilo</div>
                  <div className="flex gap-2"><CheckCircle2 size={16} className="text-emerald-400 shrink-0" /> Conexión con tu <span className="whatsapp-highlight">WhatsApp</span> Business</div>
                  <div className="flex gap-2"><CheckCircle2 size={16} className="text-emerald-400 shrink-0" /> Carga de servicios, precios y equipo</div>
                  <div className="flex gap-2"><CheckCircle2 size={16} className="text-emerald-400 shrink-0" /> Configuramos si cobras o no depósito, y en qué casos</div>
                  <div className="flex gap-2"><CheckCircle2 size={16} className="text-emerald-400 shrink-0" /> Mensajes de rescate listos para tu salón</div>
                  <div className="flex gap-2"><CheckCircle2 size={16} className="text-emerald-400 shrink-0" /> Capacitación en vivo para tu equipo</div>
                </div>
                
                {/* Garantía Destacada */}
                <div className="mt-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex gap-3 text-emerald-500 items-start">
                  <Shield size={24} className="shrink-0" />
                  <div>
                    <strong className="block text-emerald-400 mb-1">Garantía 100% libre de riesgo:</strong>
                    <p className="text-sm text-emerald-100/70">Si al día 7 el sistema no funciona como prometimos, te devolvemos el setup completo. Sin preguntas.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === SECCIÓN 8 - SOCIAL PROOF (Escasez Real) === */}
      <section id="social-proof" data-animate className="py-20 bg-violet-600 dark:bg-[#111] overflow-hidden relative">
         <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] absolute opacity-50" />
        <div className={`relative mx-auto max-w-4xl px-4 text-center ${getAnimationClass('social-proof')}`}>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-8 max-w-2xl mx-auto">
            Los primeros salones que probaron el sistema no volvieron atrás.
          </h2>
          
          <div className="bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-8 md:p-10 text-left md:text-center text-white/90">
            <span className="bg-rose-500 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-6 inline-block">Nota Honesta</span>
            <p className="text-lg md:text-xl font-medium mb-4 leading-relaxed">
              Nilah IA está en etapa de lanzamiento exclusivo. Estamos incorporando a los <strong className="text-white">primeros 20 salones</strong> con acompañamiento directo del equipo fundador.
            </p>
            <p className="text-white/70 mb-8">
              El precio de lanzamiento está activo ahora. Cuando lleguemos a 20 clientes, la suscripción sube.
            </p>
            <div className="flex justify-center">
              <a href="https://wa.me/51999999999?text=Hola!%20Quiero%20ser%20de%20los%20primeros%2020%20con%20Nilah%20IA" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-white text-violet-600 dark:bg-violet-500 dark:text-white dark:border-violet-400 font-bold px-8 py-4 rounded-full shadow-2xl hover:scale-105 transition-transform">
                <MessageCircle size={20} /> Quiero ser de los primeros 20 →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* === SECCIÓN 9 - FAQ === */}
      <section id="faq" data-animate className="py-24 bg-gray-50 dark:bg-[#0E0E0E]">
        <div className={`mx-auto max-w-3xl px-4 ${getAnimationClass('faq')}`}>
          <h2 className="text-3xl font-bold text-center mb-12 md:text-4xl lg:text-5xl text-gray-900 dark:text-white">
            Preguntas que probablemente ya tienes
          </h2>
          <div className="space-y-4">
            {[
              { 
                q: <>¿Me van a bloquear el número de <span className="whatsapp-highlight">WhatsApp</span> por enviar estos mensajes?</>, 
                a: <>NO. Nilah no hace "spam masivo" a ciegas. El sistema respeta los límites de <span className="whatsapp-highlight">WhatsApp</span>, usa pausas entre envíos y su inteligencia (cooldowns) evita molestar a la misma clienta dos veces. Protegemos tu línea como si fuera nuestro negocio.</> 
              },
              { 
                q: '¿Mis clientas van a notar que es un sistema automático?', 
                a: 'En el modo On Demand recomendado, Nilah informa y tú cierras la cita — tus clientas sienten que siempre hay una persona al otro lado. Así lo diseñamos a propósito.' 
              },
              { 
                q: '¿Mi equipo sigue atendiendo?', 
                a: 'Siempre. En el modo On Demand, Nilah prepara el terreno y tu equipo retoma cuando importa. El vínculo con tus clientas se mantiene intacto.' 
              },
              {
                q: '¿Cuándo conviene activar el modo automático?',
                a: 'Cuando tu salón lleve al menos 2-3 meses con Nilah, tus clientas ya interactúan con naturalidad y tu volumen lo justifica. Lo evaluamos juntos — nunca lo activamos sin que estés lista.'
              },
              { 
                q: '¿Funciona para salones pequeños donde solo soy yo atendiendo?', 
                a: <>SÍ. Para ti es el Plan Básico (On-Demand). De hecho, es ahí donde más impacto genera porque libera las 2-3 horas que pierdes contestando <span className="whatsapp-highlight">WhatsApp</span> para que puedas atender más citas o descansar.</> 
              },
              { 
                q: '¿Necesito saber algo técnico para usar esto?', 
                a: 'Absolutamente nada. El panel es tan fácil de usar como Instagram. Todo lo técnico — conexiones, configuraciones, integraciones — lo hacemos nosotros al 100% durante el Setup inicial. Tú no tocas nada.' 
              },
              { 
                q: '¿Puedo cancelar cuando quiera?', 
                a: 'Sí. Sin contratos de permanencia. Pero siendo honestos, nadie cancela después de ver el sistema rescatar dinero perdido el primer mes.' 
              },
              { 
                q: '¿El setup es obligatorio?', 
                a: 'Sí, y con razón. Sin una configuración profesional técnica y de tu catálogo, el sistema no hace magia. Tiene garantía de 7 días 100% libre de riesgo: si no te gusta, te devolvemos el costo del setup.' 
              }
            ].map((item, i) => (
              <div key={i} className="rounded-2xl bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/5 overflow-hidden hover:border-violet-200 dark:hover:border-violet-500/30 transition-all shadow-sm">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left font-bold text-gray-800 dark:text-gray-100 text-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                >
                  <span className="pr-4">{item.q}</span>
                  <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300 ${openFaq === i ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 rotate-180' : 'bg-gray-100 dark:bg-white/10 text-gray-400'}`}>
                    <ChevronDown size={18} />
                  </div>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="px-6 pb-6 pt-2 text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-50 dark:border-white/5 mt-2">
                    {item.a}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === SECCIÓN 10 - CTA FINAL === */}
      <section id="cta-final" className="py-24 bg-gradient-to-br from-gray-900 to-black relative overflow-hidden text-center text-white">
        <MorphingBlob className="top-0 right-0" colors="from-violet-500/20 via-pink-500/10 to-transparent" size="h-[600px] w-[600px]" />
        
        <div className="mx-auto max-w-4xl px-4 relative z-10">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight">
            En este momento hay clientas en tu lista de <span className="whatsapp-highlight">WhatsApp</span> que no han vuelto en meses.
          </h2>
          <p className="text-xl md:text-2xl font-medium text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
            Mañana pueden seguir ahí dormidas. <span className="text-white block mt-2">O puede que Nilah les escriba algo tan bueno que agenden hoy.</span>
          </p>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 max-w-lg mx-auto mb-10 backdrop-blur-sm">
            <p className="text-sm font-medium mb-2 opacity-80 uppercase tracking-widest">Resumen de oferta</p>
            <ul className="text-left space-y-2 mb-4">
              <li className="flex items-center justify-center gap-2"><CheckCircle2 size={16} className="text-emerald-500"/> El sistema está listo.</li>
              <li className="flex items-center justify-center gap-2"><CheckCircle2 size={16} className="text-emerald-500"/> Setup tarda 3-5 días.</li>
              <li className="flex items-center justify-center gap-2"><CheckCircle2 size={16} className="text-emerald-500"/> Primeros 20 salones: <span className="text-violet-400 font-bold ml-1">Precio de lanzamiento.</span></li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/auth?plan=free"
              className="w-full sm:w-auto rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-10 py-5 text-lg font-bold text-white shadow-xl shadow-violet-500/30 flex items-center justify-center gap-2 transition-all hover:scale-105 hover:shadow-violet-500/50 active:scale-95"
            >
              <Sparkles size={24} /> Empezar gratis ahora →
            </Link>
            <a
              href="https://wa.me/51999999999?text=Hola!%20Quiero%20una%20demo%20de%20Nilah"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto rounded-full bg-white/10 border-2 border-white/20 hover:border-white/50 px-10 py-5 text-lg font-semibold hover:bg-white/20 transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle size={20} /> Hablar con asesor
            </a>
          </div>

          <div className="mt-12 flex items-center justify-center gap-3 text-sm text-gray-400">
            <Shield size={20} className="text-emerald-500"/>
            Garantía de 7 días en el setup. Si no funciona, te devolvemos todo.
          </div>
        </div>
      </section>

      {/* === FOOTER === */}
      <footer className="bg-white dark:bg-[#050505] border-t border-gray-100 dark:border-white/5 py-12">
        <div className="mx-auto max-w-6xl px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Leaf className="text-violet-500" size={24} />
            <span className="text-xl font-bold dark:text-white">Korat Flow</span>
          </div>
          
          <div className="flex gap-6 text-sm font-medium text-gray-500 dark:text-gray-400">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-violet-500 transition-colors">Instagram</a>
            <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="hover:text-violet-500 transition-colors">TikTok</a>
            <Link to="/nilah/login" className="hover:text-violet-500 transition-colors">Login Clientes</Link>
          </div>

          <p className="text-sm text-gray-400 text-center md:text-right">
            © {new Date().getFullYear()} Nilah IA by Korat Flow.<br/>Hecho con 💜 en Perú para Latinoamérica.
          </p>
        </div>
      </footer>

      {/* Dynamic Navigation Island */}
      <DynamicIsland />
    </div>
    </>
  );
};

export default LandingPage;
