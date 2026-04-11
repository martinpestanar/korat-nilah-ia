import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, CheckCircle2, Bot, Zap, Leaf, Sun, Moon, Star, Quote,
  MessageCircle, Calendar, Camera, Bell, Heart, BarChart3, Gift, Megaphone,
  ChevronDown, Shield, Phone, Clock, Users, Sparkles, X, Menu, Play, Info,
  FileText, Settings, Rocket, Package
} from 'lucide-react';
import { APP_NAME } from '../constants';
import { useTheme } from '../context/ThemeContext';
import { MorphingBlob, FloatingReactionBubbles, ParallaxTiltWrapper, NilahFlowDiagram, AnimatedCounter, NilahWhatsAppConvo, NilahWhatsAppPostVisita, NilahWhatsAppRetoque, NilahWhatsAppFestiva, ROISlotMachine, AgendaFillAnimation, DormantGridAwakening, MagneticCard, GradientText, NilahInboxMockup } from '../components/UI/AnimatedSVGs';
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
  const [planPrices, setPlanPrices] = useState({ basico: 89, pro: 159, copilot: 239, setup: 99 });
  const [isPricingLoading, setIsPricingLoading] = useState(true);
  // Launch prices (primeros 20) vs Regular prices
  const launchPrices = { basico: 89, pro: 159, copilot: 239, setup: 99 };
  const regularPrices = { basico: 119, pro: 199, copilot: 279, setup: 149 };
  // Fixed PEN values (commercial prices, not calculated)
  const pricesPEN = { basico: 339, pro: 599, copilot: 899, setup: 375, basicoRegular: 449, proRegular: 749, copilotRegular: 1049, setupRegular: 564 };
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
          .select('id, precio')
          .in('id', [
            'plan_base_basico',
            'plan_base_pro',
            'plan_base_copilot',
            'plan_setup_inicial'
          ]);

        if (error) throw error;
        const priceById = Object.fromEntries((data || []).map((item: any) => [item.id, Number(item.precio)]));
        setPlanPrices({
          basico: priceById.plan_base_basico ?? 89,
          pro: priceById.plan_base_pro ?? 159,
          copilot: priceById.plan_base_copilot ?? 239,
          setup: priceById.plan_setup_inicial ?? 99
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

  return (
    <div className="force-hardcoded-violet h-[100dvh] overflow-y-auto overflow-x-hidden bg-gradient-to-b from-white via-violet-50/20 to-white text-gray-900 font-sans dark:from-[#0A0A0A] dark:via-[#0E0E0E] dark:to-[#0A0A0A] dark:text-white">

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
              <span className="relative bg-white dark:bg-[#0A0A0A] rounded-full px-5 py-2 text-sm font-bold transition-all group-hover:bg-opacity-0">
                <span className="bg-gradient-to-r from-violet-600 to-pink-500 group-hover:from-white group-hover:to-white bg-clip-text text-transparent group-hover:text-white transition-all">
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
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/50 bg-emerald-50/80 backdrop-blur-sm px-4 py-2 text-xs md:text-sm font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 shadow-sm animate-fade-in">
            <MessageCircle size={14} className="animate-pulse" />
            El sistema que despierta a tus clientas dormidas · Para salones en LATAM
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
            Nilah IA convierte tus contactos de <span className="font-bold bg-gradient-to-br from-[#25D366] to-[#128C7E] bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(37,211,102,0.3)]">WhatsApp</span> en citas reales: 
            campañas semanales por grupos de clientas, mensajes de rescate con humor y complicidad, y recordatorios que tus clientas esperan recibir — <span className="underline decoration-violet-500/50 decoration-2 underline-offset-4">todo sin spam, con la voz de tu marca.</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <a
              href="https://wa.me/51999999999?text=Hola!%20Quiero%20ver%20c%C3%B3mo%20funciona%20Nilah%20IA"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto rounded-full bg-gray-900 dark:bg-white px-8 py-4 text-base font-bold text-white dark:text-gray-900 shadow-xl shadow-gray-900/10 dark:shadow-white/10 flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95"
            >
              <MessageCircle size={20} /> Quiero ver cómo funciona →
            </a>
            <button
              onClick={() => scrollToSection('precios')}
              className="w-full sm:w-auto rounded-full bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 px-8 py-4 text-base font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              Ver planes ↓
            </button>
          </div>

          {/* Metrics Inline */}
          <div className="pt-8 mt-8 md:pt-12 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4 max-w-3xl mx-auto border-t border-gray-100 dark:border-white/5">
            <div className="text-center group">
              <p className="text-3xl font-black text-gray-900 dark:text-white group-hover:text-violet-500 transition-colors">1,000+</p>
              <p className="text-xs text-gray-500 mt-1 font-medium leading-tight">Contactos de WhatsApp<br/>que ya te conocen</p>
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
              Tienes cientos de clientas en tu WhatsApp. Y un mes flojo.
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
                desc: <><span className="text-pink-500 font-bold">Publicas en redes.</span> Esperas que te vean. Esperas que recuerden. Esperas que escriban. <b className="text-gray-900 dark:text-gray-100">Tus clientas ya están en tu WhatsApp.</b> El canal más directo que existe. Sin algoritmo en el medio.</>
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
              Es el sistema que convierte tu lista de WhatsApp en el canal de ventas más rentable de tu salón.
            </p>
            <p className="mt-6 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Tres módulos conectados. Cada uno resuelve una parte distinta del mismo problema: <span className="font-medium text-gray-900 dark:text-white">tus clientas existen, tienen dinero y están listas para volver.</span> Solo necesitan el mensaje correcto.
            </p>
          </div>

          <div className="space-y-6">
            {/* BLOQUE 1 - NILAH MARKETING (EL MÁS IMPORTANTE) */}
            <div className="relative rounded-[2rem] bg-gray-900 dark:bg-[#111] p-[1px] shadow-xl group">
              <div className="relative bg-white dark:bg-[#141414] rounded-[2rem] p-8 md:p-12 overflow-hidden border border-gray-100 dark:border-white/5">
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl" />
                
                <div className="md:flex gap-12 items-center relative z-10">
                  <div className="md:w-1/2 mb-8 md:mb-0">
                    <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 dark:bg-violet-500/20 px-4 py-2 text-sm font-bold text-violet-700 dark:text-violet-300 mb-6">
                      <Megaphone size={18} /> NILAH MARKETING
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold mb-4">
                      4 campañas al mes.<br/>
                      <span className="text-violet-600 dark:text-violet-400">Cada una con un mensaje que genera respuesta.</span>
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                      Eliges a qué grupo de clientas enviarle la campaña — ya calculado con los datos de tu negocio. Nilah IA ya creó el mensaje: el tono exacto, con el humor y la complicidad de una amiga.
                    </p>
                    <ul className="space-y-3 mb-8">
                      {[
                        '4 campañas mensuales listas para enviar',
                        'Mensajes que suenan a tu marca, no a robot',
                        '3 versiones de mensaje por campaña',
                        'Flyers generados con IA para redes y estados',
                        'No molesta dos veces seguidas: sabe cuándo parar'
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm md:text-base font-medium text-gray-700 dark:text-gray-200">
                          <CheckCircle2 size={20} className="text-violet-500 shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="md:w-1/2">
                    <div className="bg-gray-50 dark:bg-[#1A1A1A] border border-gray-100 dark:border-white/10 rounded-2xl p-6 shadow-inner">
                      <p className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">Ejemplos de Audiencias Automáticas</p>
                      <div className="space-y-3">
                        {[
                          { icon: '💅', text: 'Clientas de pestañas sin cita hace 45 días', count: 23 },
                          { icon: '👑', text: 'VIPs que no han venido este mes', count: 11 },
                          { icon: '✨', text: 'Clientas nuevas sin segunda visita', count: 34 },
                          { icon: '🌞', text: 'Clientas de temporada alta que regresan', count: 19 }
                        ].map((aud, i) => (
                          <div key={i} className="flex items-center justify-between bg-white dark:bg-[#222] p-3 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{aud.icon}</span>
                              <span className="text-sm font-medium">{aud.text}</span>
                            </div>
                            <span className="bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 text-xs font-bold px-2 py-1 rounded-full">
                              {aud.count} pers.
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
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

                {/* LIVE WhatsApp mockup */}
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

                {/* LIVE WhatsApp mockup */}
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

                {/* LIVE WhatsApp mockup */}
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

      {/* === SECCIÓN 4 - EL CHATBOT PHILOSOPHY === */}
      <section id="modos" data-animate className="py-24 bg-gradient-to-b from-gray-50 to-white dark:from-[#0E0E0E] dark:to-[#0A0A0A]">
        <div className={`mx-auto max-w-5xl px-4 ${getAnimationClass('modos')}`}>
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 rounded-full bg-violet-100 dark:bg-violet-500/10 px-4 py-2 text-xs font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wider mb-4">
              <Bot size={14} /> El chatbot que trabaja, tú decides
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold leading-tight text-gray-900 dark:text-white max-w-3xl mx-auto">
              Hace todo el trabajo pesado.
              <br/><span className="text-violet-500">Tú mantienes el toque humano.</span>
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              En todos los planes, Nilah recopila, analiza y te avisa. Tú decides cuándo intervenir — sin tocar nada técnico.
            </p>
          </div>

          {/* HERO CARD - La filosofía On-Demand */}
          <div className="relative rounded-3xl bg-white dark:bg-[#141414] border-2 border-violet-100 dark:border-violet-500/20 shadow-xl p-8 md:p-10 mb-8 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl" />
            <div className="md:flex gap-12 items-center relative z-10">
              <div className="md:w-1/2 mb-8 md:mb-0">
                <div className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 px-3 py-1.5 rounded-full text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-5 whitespace-nowrap">
                  ✓ En todos los planes · desde el día 1
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  Modo Asistente: Nilah trabaja,<br/>
                  <span className="text-violet-600 dark:text-violet-400">tú apruebas. Siempre en control.</span>
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  No es una limitación. Es una filosofía. Nilah recopila, analiza y te manda el resumen a tu WhatsApp. <span className="font-semibold text-gray-800 dark:text-gray-100">Tú decides. El bot ya hizo el trabajo.</span>
                </p>
                <div className="space-y-3">
                  {[
                    { icon: '📋', text: 'Recopila servicio, horario y preferencias' },
                    { icon: '🧠', text: 'Clasifica a la clienta y calcula su score' },
                    { icon: '📲', text: 'Te manda el resumen a tu WhatsApp' },
                    { icon: '🔕', text: 'El bot se apaga solo — tú gestionas' },
                    { icon: '🔄', text: 'Se reactiva al agendar, o a las 12pm / 10pm' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200">
                      <span className="text-base w-6 text-center shrink-0">{item.icon}</span>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="md:w-1/2">
                {/* WhatsApp Notification Mockup */}
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

          {/* Segunda tarjeta: Modo Automático como upgrade opcional */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-[#141414] rounded-2xl p-6 border border-gray-100 dark:border-white/5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center justify-center">
                  <Users size={18} className="text-gray-500" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">¿Prefieres el trato personal total?</p>
                  <p className="text-xs text-gray-500">El Modo Asistente es para ti.</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Si tu salón se diferencia por el trato personal, la clienta VIP que siempre habla contigo — no pierdas eso. Nilah hace el trabajo de recopilación y tú cierras con tu toque de siempre.
              </p>
            </div>
            <div className="bg-white dark:bg-[#141414] rounded-2xl p-6 border border-violet-100 dark:border-violet-500/20 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-violet-500/10 rounded-full blur-xl" />
              <div className="flex items-center gap-3 mb-4 relative">
                <div className="h-9 w-9 rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/30 flex items-center justify-center">
                  <Zap size={18} className="text-violet-500" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">¿Quieres que Nilah haga todo sola?</p>
                  <p className="text-xs text-violet-500">Modo Automático disponible en Plan Pro.</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed relative z-10">
                Actívalo cuando quieras. Nilah agenda, modifica y cancela sola. Aplica tus políticas de cobro y filtra clientas sin confrontaciones. Sin costo adicional — es una configuración.
              </p>
            </div>
          </div>
          
          <div className="text-center mt-8">
            <p className="inline-block bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 text-sm px-5 py-2.5 rounded-full border border-gray-200 dark:border-white/10 shadow-sm">
              <strong className="text-gray-900 dark:text-white">Cambias de modo cuando quieras.</strong> Sin llamadas. Sin costo extra.
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
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 relative z-10">
            <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-gray-100 dark:border-white/10 hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-white dark:bg-white/10 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm flex items-center justify-center text-xl mb-4">
                📋
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                Bandeja Principal <span className="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 text-[10px] px-2 py-0.5 rounded-full tracking-wider uppercase">Pro</span>
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                Ve de un vistazo quién está hablando con el bot, qué chats necesitan tu atención y quiénes confirmaron su cita para mañana.
              </p>
            </div>
            
            <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-gray-100 dark:border-white/10 hover:shadow-xl transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl" />
              <div className="w-12 h-12 bg-white dark:bg-white/10 rounded-xl border border-indigo-200 dark:border-indigo-500/30 shadow-sm flex items-center justify-center text-xl mb-4">
                📂
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex flex-wrap items-center gap-2">
                Carpetas Inteligentes <span className="bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400 text-[10px] px-2 py-0.5 rounded-full tracking-wider uppercase">Elite</span>
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm relative z-10">
                Organiza los chats por VIP, Necesitan Atención o Presupuestos. Ve directo a lo más urgente sin perderte en cientos de mensajes.
              </p>
            </div>
            
            <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-gray-100 dark:border-white/10 hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-white dark:bg-white/10 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm flex items-center justify-center text-xl mb-4">
                💎
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                Perfil Completo <span className="bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400 text-[10px] px-2 py-0.5 rounded-full tracking-wider uppercase">Elite</span>
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm relative z-10">
                Mientras chateas, ves al instante cuánto ha gastado en tu salón en total, si es clienta VIP y si está contenta o en riesgo de no volver.
              </p>
            </div>

            <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-gray-100 dark:border-white/10 hover:shadow-xl transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-xl" />
              <div className="w-12 h-12 bg-white dark:bg-white/10 rounded-xl border border-rose-200 dark:border-rose-500/30 shadow-sm flex items-center justify-center text-xl mb-4">
                🤫
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex flex-wrap items-center gap-2">
                Notas Internas <span className="bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400 text-[10px] px-2 py-0.5 rounded-full tracking-wider uppercase">Elite</span>
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm relative z-10">
                Deja mensajes ocultos "Whisper" entre tú y tu staff directo en el chat. La clienta no las ve, pero tu equipo coordina perfecto.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* === SECCIÓN 5 - DIFERENCIADORES === */}
      <section id="diferenciadores" data-animate className="py-24 bg-white dark:bg-[#0A0A0A]">
        <div className={`mx-auto max-w-6xl px-4 ${getAnimationClass('diferenciadores')}`}>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold leading-tight text-gray-900 dark:text-white max-w-3xl mx-auto">
              Hay chatbots por todos lados. <br className="hidden md:block"/>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-pink-500">Ninguno hace esto.</span>
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Por qué Nilah IA no tiene competencia real en LATAM.</p>
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
                title: 'Mensajes que generan respuesta, no silencio.',
                desc: 'Ningún activador suena a "recordatorio de sistema". Cada mensaje está calibrado con humor, complicidad y el tono exacto de tu marca.'
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
                      Visuales en 1 toque
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
                      Eliges un servicio (ej: Balayage), el sistema escoge la mejor foto de tu galería, recorta el fondo si es necesario, le aplica tu branding y te entrega 3 opciones de flyers listos para subir a Instagram o enviar por WhatsApp.
                    </p>
                    <ul className="space-y-3 mt-4">
                      <li className="flex items-center gap-2 text-sm font-medium"><CheckCircle2 className="text-fuchsia-500" size={16}/> Flyers hermosos en 5 segundos</li>
                      <li className="flex items-center gap-2 text-sm font-medium"><CheckCircle2 className="text-fuchsia-500" size={16}/> Respeta tu paleta de colores</li>
                      <li className="flex items-center gap-2 text-sm font-medium"><CheckCircle2 className="text-fuchsia-500" size={16}/> Copy (texto) incluido automáticamente</li>
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
                      Galería Inteligente
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
                      Nilah organiza tus fotos solita. Las subes y las etiqueta como "Rubios", "Uñas", "Pestañas". Cuando necesites promocionar "Mechas", Nilah ya sabe exactamente qué fotos de tu archivo son las que mejor venden ese servicio.
                    </p>
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
                  
                  {/* Mockup Mock Image */}
                  <div className={`aspect-[4/5] rounded-xl flex items-center justify-center bg-gradient-to-br transition-colors duration-500 ${
                    activeCreativeTab === 'magic' ? 'from-fuchsia-500/20 to-pink-500/5' :
                    activeCreativeTab === 'retouch' ? 'from-cyan-500/20 to-blue-500/5' :
                    activeCreativeTab === 'free' ? 'from-violet-500/20 to-fuchsia-500/5' :
                    'from-pink-500/20 to-rose-500/5'
                  }`}>
                    {activeCreativeTab === 'magic' && <Sparkles size={48} className="text-fuchsia-400 opacity-50" />}
                    {activeCreativeTab === 'retouch' && <Camera size={48} className="text-cyan-400 opacity-50" />}
                    {activeCreativeTab === 'free' && <Leaf size={48} className="text-violet-400 opacity-50" />}
                    {activeCreativeTab === 'gallery' && <Heart size={48} className="text-pink-400 opacity-50" />}
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
              <Package size={14} /> ✓ Disponible desde el Plan Glow
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
                      📲 Recibe alertas de stock bajo directo en tu WhatsApp
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
            Operativo en menos de una semana.
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-16">Sin conocimientos técnicos. Sin tocar código.</p>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              { num: '1', icon: <FileText className="text-violet-500" size={32} />, title: 'Setup completo (nosotros lo hacemos todo)', desc: 'Nos das la información de tu salón: servicios, precios, horarios, staff y política de cobro. Nosotros configuramos e integramos todo. Tiempo estimado: 3-5 días.', color: 'from-violet-500 to-violet-600' },
              { num: '2', icon: <Settings className="text-purple-500" size={32} />, title: 'Prueba supervisada (7 días contigo)', desc: 'El sistema corre en paralelo. Ves cada conversación, agenda y campaña. Ajustamos contigo. Si algo no funciona como prometimos: te devolvemos el costo del setup.', color: 'from-purple-500 to-purple-600' },
              { num: '3', icon: <Rocket className="text-pink-500" size={32} />, title: 'Piloto automático encendido', desc: 'Nilah atiende, agenda, recuerda y recupera clientas sola. Tú te enfocas en atender. Y te preguntas cuánto dinero dejaste sobre la mesa los meses anteriores.', color: 'from-pink-500 to-pink-600' },
            ].map((step, i) => (
              <div key={i} className="relative group">
                <div className="bg-white dark:bg-[#141414] rounded-3xl p-8 border border-gray-100 dark:border-white/5 hover:border-violet-200 dark:hover:border-violet-500/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 min-h-[300px] flex flex-col items-center text-center">
                  <span className={`absolute -top-5 left-1/2 -translate-x-1/2 h-10 w-10 rounded-full bg-gradient-to-br ${step.color} text-white font-bold flex items-center justify-center shadow-lg ring-4 ring-white dark:ring-[#141414]`}>
                    {step.num}
                  </span>
                  <span className="text-4xl mb-5 block mt-4 bg-gray-50 dark:bg-white/5 w-16 h-16 rounded-2xl flex items-center justify-center">{step.icon}</span>
                  <h3 className="font-bold text-lg mb-3 title-gradient leading-tight">{step.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 text-violet-300 dark:text-violet-500/50 z-10">
                    <ArrowRight size={24} />
                  </div>
                )}
              </div>
            ))}
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

          {/* Pricing Grid: Glow & Glow Pro */}
          <div className="grid md:grid-cols-2 gap-8 mb-8 max-w-4xl mx-auto">
            
            {/* PLAN GLOW (Starter) */}
            <div className="bg-white dark:bg-[#111] rounded-[2rem] p-8 md:p-10 border border-gray-100 dark:border-white/5 hover:border-violet-200 dark:hover:border-violet-500/30 transition-all flex flex-col h-full hover:shadow-2xl hover:-translate-y-1">
              <h3 className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">Glow</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Organización y control manual</p>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-6">El sistema recopila la información de tus clientas, pero tú decides cuándo y qué enviar.</p>
              
              {/* Price Display */}
              <div className="mb-8">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-4xl font-extrabold text-gray-900 dark:text-white">${launchPrices.basico}</span>
                  <span className="text-gray-500 font-medium">USD/mes</span>
                  <span className="text-sm text-gray-400 line-through ml-1">${regularPrices.basico}</span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">S/ {pricesPEN.basico}<span className="text-xs font-normal text-gray-400">/mes</span></p>
                  <span className="text-xs text-gray-400 line-through">S/ {pricesPEN.basicoRegular}</span>
                </div>
              </div>

              <div className="mb-8 flex-grow">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">INCLUYE:</p>
                <ul className="space-y-3.5">
                  {[
                    'Bandeja de mensajes centralizada',
                    'Chatbot Asistente (recopila la info, tú decides qué hacer)',
                    'Agenda y gestión de citas',
                    'Historial completo de cada clienta',
                    'Recordatorios automáticos de cita (24h y 3h antes)'
                  ].map((f, i) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <CheckCircle2 size={18} className="text-gray-400 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <a href="https://wa.me/51999999999?text=Hola!%20Quiero%20empezar%20con%20Glow" target="_blank" rel="noopener noreferrer" className="w-full py-4 rounded-xl font-bold bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 text-center hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                Elegir Glow
              </a>
            </div>

            {/* PLAN GLOW PRO */}
            <div className="bg-white dark:bg-[#111] rounded-[2rem] p-8 md:p-10 border-2 border-violet-500 shadow-2xl shadow-violet-500/20 relative flex flex-col h-full transform md:-translate-y-4">
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-pink-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                ⭐ SISTEMA COMPLETO AUTÓNOMO
              </div>
              <h3 className="text-2xl font-bold mb-1 text-violet-600 dark:text-violet-400">Glow Pro</h3>
              <p className="text-xs font-bold text-violet-400/70 uppercase tracking-wider mb-2">Máquina de generar citas</p>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-6">El sistema envía los activadores, recupera clientas y cierra las ventas automáticamente.</p>
              
              {/* Price Display */}
              <div className="mb-8 relative z-10">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-5xl font-extrabold text-gray-900 dark:text-white">${launchPrices.pro}</span>
                  <span className="text-gray-500 font-medium">USD/mes</span>
                  <span className="text-sm text-gray-400 line-through ml-1">${regularPrices.pro}</span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-violet-600 dark:text-violet-400">S/ {pricesPEN.pro}<span className="text-xs font-normal text-violet-400">/mes</span></p>
                  <span className="text-xs text-gray-400 line-through">S/ {pricesPEN.proRegular}</span>
                </div>
              </div>

              <div className="mb-8 flex-grow relative z-10">
                <p className="text-xs font-bold uppercase tracking-wider text-violet-500 mb-4">TODO LO DE GLOW, Y ADEMÁS:</p>
                <ul className="space-y-3">
                  {[
                    { text: 'Sistema de rescate automático (35/60/90 días sin visita)', highlight: true },
                    { text: 'Chatbot en Modo Automático: agenda, modifica y cancela solo', highlight: false },
                    { text: '4 campañas de WhatsApp por mes listas para enviar', highlight: false },
                    { text: 'Recordatorios automáticos cuando toca el retoque', highlight: false },
                    { text: 'Generador de flyers con IA para tus redes y estados', highlight: false },
                    { text: 'Acciones rápidas con 1 toque: rescate, campaña, agenda', highlight: false },
                  ].map((f, i) => (
                    <li key={i} className={`flex gap-3 text-sm leading-snug ${f.highlight ? 'font-bold text-violet-700 dark:text-violet-300' : 'font-medium text-gray-700 dark:text-gray-200'}`}>
                      <CheckCircle2 size={18} className={`shrink-0 ${f.highlight ? 'text-violet-500' : 'text-violet-400'}`} />
                      <span>{f.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <a href="https://wa.me/51999999999?text=Hola!%20Quiero%20Glow%20Pro" target="_blank" rel="noopener noreferrer" className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-violet-600 to-pink-500 text-white shadow-lg shadow-violet-500/25 text-center hover:shadow-violet-500/40 hover:scale-[1.02] transition-all relative z-10">
                Elegir Glow Pro
              </a>
            </div>
          </div>

          {/* PLAN GLOW ELITE (Full Width Dark Block) */}
          <div className="max-w-4xl mx-auto rounded-[2.5rem] bg-[#07060f] p-1 border border-white/10 shadow-2xl overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-transparent to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            <div className="bg-[#0A0A0A] rounded-[2.3rem] p-8 md:p-12 relative z-10 overflow-hidden">
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />
              
              <div className="md:flex gap-10 items-center">
                <div className="md:w-1/2 mb-8 md:mb-0">
                  <div className="inline-flex items-center gap-2 mb-4 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse border border-cyan-200" />
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">Para salones que quieren crecer en serio</span>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-extrabold mb-2 text-white">Glow <span className="text-cyan-400">Elite</span></h3>
                  <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                    Para los salones que no pueden permitirse perder el control. Delega toda la retención, automatiza el seguimiento y opera con un CRM experto que protege a tus clientas de mayor valor antes de que la competencia te las quite.
                  </p>
                  
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-4xl font-extrabold text-white">${launchPrices.copilot}</span>
                      <span className="text-gray-500 font-medium">USD/mes</span>
                      <span className="text-sm text-gray-500 line-through ml-1">${regularPrices.copilot}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-cyan-400">S/ {pricesPEN.copilot}<span className="text-gray-500">/mes</span></p>
                      <span className="text-xs text-gray-600 line-through">S/ {pricesPEN.copilotRegular}</span>
                    </div>
                  </div>
                  
                  <a href="https://wa.me/51999999999?text=Hola!%20Me%20interesa%20Glow%20Elite" target="_blank" rel="noopener noreferrer" className="inline-block w-full md:w-auto px-8 py-4 rounded-xl font-bold bg-white text-gray-900 text-center hover:bg-gray-200 hover:scale-[1.02] transition-transform">
                    Aplicar a Glow Elite →
                  </a>
                </div>
                
                <div className="md:w-1/2 border-t md:border-t-0 md:border-l border-white/10 pt-8 md:pt-0 md:pl-10">
                  <p className="text-xs font-bold uppercase tracking-wider text-cyan-500 mb-5">BENEFICIOS EXCLUSIVOS:</p>
                  <ul className="space-y-4">
                    <li className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                        <MessageCircle size={14} className="text-cyan-400" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm mb-0.5">Inbox 2.0 Premium</p>
                        <p className="text-gray-400 text-xs">Carpetas Inteligentes, Perfil 360° Activo y Notas Internas "Whisper".</p>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                        <Sparkles size={14} className="text-cyan-400" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm mb-0.5">Nilah Lumina — Tu asesora diaria</p>
                        <p className="text-gray-400 text-xs">Briefing matutino, alerta cuando una clienta VIP está en riesgo y comparación de mes a mes para saber si estás creciendo.</p>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                        <Leaf size={14} className="text-cyan-400" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm mb-0.5">Estudio Libre IA Premium</p>
                        <p className="text-gray-400 text-xs">Generación de gráficas ilimitadas sin depender de plantillas.</p>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                        <Users size={14} className="text-cyan-400" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm mb-0.5">Soporte Prioritario 1 a 1</p>
                        <p className="text-gray-400 text-xs">Conexión directa por WhatsApp con nuestro equipo fundador.</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* ROI Calculator Nota */}
          <div className="max-w-3xl mx-auto mb-10 text-center bg-violet-50 dark:bg-violet-500/10 rounded-2xl p-6 border border-violet-100 dark:border-violet-500/20">
            <h4 className="font-bold text-lg mb-2 text-violet-700 dark:text-violet-300 flex items-center justify-center gap-2">
              <BarChart3 size={20}/> ¿Cuánto puede dejarte en el primer mes?
            </h4>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
              Si tu salón tiene 200 contactos en WhatsApp y una campaña de Nilah reactiva al 10% de ellos, 
              son <span className="font-bold text-gray-900 dark:text-white">20 citas nuevas ese mes.</span><br/>
              A $15 USD promedio por cita: <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md">$300 USD recuperados.</span><br/>
              El Plan Pro cuesta <span className="font-bold text-violet-600 dark:text-violet-400">${launchPrices.pro} USD</span>. <strong className="text-gray-900 dark:text-white">El primer mes ya está pagado y te queda ganancia encima.</strong>
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
                  <span className="text-3xl font-bold text-white">${launchPrices.setup}</span>
                  <span className="text-gray-400 text-sm">USD</span>
                  <span className="text-gray-500 text-sm line-through">${regularPrices.setup}</span>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm font-semibold text-violet-300">S/ {pricesPEN.setup}</span>
                  <span className="text-xs text-gray-500 line-through">S/ {pricesPEN.setupRegular}</span>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  El setup no es un trámite técnico. Es la diferencia entre un sistema que funciona desde el día 1 y uno que nunca arranca.
                </p>
              </div>
              <div className="md:w-2/3">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4 bg-white/5 inline-block px-3 py-1 rounded-lg">QUÉ HACEMOS NOSOTROS:</p>
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex gap-2"><CheckCircle2 size={16} className="text-emerald-400 shrink-0" /> Personalización con tu nombre y estilo</div>
                  <div className="flex gap-2"><CheckCircle2 size={16} className="text-emerald-400 shrink-0" /> Conexión con tu WhatsApp Business</div>
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
                q: '¿Me van a bloquear el número de WhatsApp por enviar estos mensajes?', 
                a: 'NO. Nilah no hace "spam masivo" a ciegas. El sistema respeta los límites de WhatsApp, usa pausas entre envíos y su inteligencia (cooldowns) evita molestar a la misma clienta dos veces. Protegemos tu línea como si fuera nuestro negocio.' 
              },
              { 
                q: '¿Mis clientas van a notar que es un sistema automático?', 
                a: 'No. Nilah está configurada con el tono y la personalidad de tu marca. Los activadores están escritos para sonar como una amiga con complicidad, no como un robot frío. Te sorprenderá la cantidad de respuestas positivas.' 
              },
              { 
                q: '¿Qué pasa si una clienta quiere hablar con una persona humana?', 
                a: 'Nilah detecta automáticamente cuando la conversación es compleja y se pausa sola, avisándote para que respondas tú. Cuando terminas, oprimes "Reactivar Nilah" en el panel y listo. Sin fricciones.' 
              },
              { 
                q: '¿Funciona para salones pequeños donde solo soy yo atendiendo?', 
                a: 'SÍ. Para ti es el Plan Básico (On-Demand). De hecho, es ahí donde más impacto genera porque libera las 2-3 horas que pierdes contestando WhatsApp para que puedas atender más citas o descansar.' 
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
            En este momento hay clientas en tu lista de WhatsApp que no han vuelto en meses.
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
            <a
              href="https://wa.me/51999999999?text=Hola!%20Quiero%20la%20demo%20de%20Nilah%20IA"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto rounded-full bg-white px-10 py-5 text-lg font-bold text-gray-900 shadow-2xl flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95 hover:shadow-white/20"
            >
              <MessageCircle size={24} /> Quiero una demo ahora →
            </a>
            <button
              onClick={() => scrollToSection('precios')}
              className="w-full sm:w-auto rounded-full border-2 border-white/20 hover:border-white/50 px-10 py-5 text-lg font-semibold hover:bg-white/5 transition-all"
            >
              Ver planes de nuevo ↓
            </button>
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
    </div>
  );
};

export default LandingPage;
