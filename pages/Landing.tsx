import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, CheckCircle2, Bot, Zap, Leaf, Sun, Moon, Star, Quote,
  MessageCircle, Calendar, Camera, Bell, Heart, BarChart3, Gift, Megaphone,
  ChevronDown, Shield, Phone, Clock, Users, Sparkles, X, Menu, Play, Info
} from 'lucide-react';
import { APP_NAME } from '../constants';
import { useTheme } from '../context/ThemeContext';
import { MorphingBlob, FloatingReactionBubbles, ParallaxTiltWrapper, NilahFlowDiagram, AnimatedCounter, NilahWhatsAppConvo, NilahWhatsAppPostVisita, NilahWhatsAppRetoque, NilahWhatsAppFestiva, ROISlotMachine, AgendaFillAnimation, DormantGridAwakening, MagneticCard, GradientText, NilahInboxMockup } from '../components/UI/AnimatedSVGs';
import { supabase } from '../services/supabase';

const useIntersectionObserver = () => {
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const sections = document.querySelectorAll('[data-animate]');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  return visibleSections;
};

const LandingPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [planPrices, setPlanPrices] = useState({ basico: 89, pro: 159, copilot: 239, setup: 99 });
  const [isPricingLoading, setIsPricingLoading] = useState(true);
  // Launch prices (primeros 20) vs Regular prices
  const launchPrices = { basico: 89, pro: 159, copilot: 239, setup: 99 };
  const regularPrices = { basico: 119, pro: 199, copilot: 279, setup: 149 };
  // Fixed PEN values (commercial prices, not calculated)
  const pricesPEN = { basico: 339, pro: 599, copilot: 899, setup: 375, basicoRegular: 449, proRegular: 749, copilotRegular: 1049, setupRegular: 564 };
  const visibleSections = useIntersectionObserver();

  // Animación de entrada
  const getAnimationClass = (sectionId: string, baseAnimation: string = 'animate-fade-in-up') => {
    return visibleSections.has(sectionId) ? baseAnimation : 'opacity-0';
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
    <div className="h-[100dvh] overflow-y-auto overflow-x-hidden bg-gradient-to-b from-white via-violet-50/20 to-white text-gray-900 font-sans dark:from-[#0A0A0A] dark:via-[#0E0E0E] dark:to-[#0A0A0A] dark:text-white">

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
            campañas semanales por audiencia, activadores de rescate con humor y complicidad, y recordatorios que tus clientas esperan recibir — <span className="underline decoration-violet-500/50 decoration-2 underline-offset-4">todo sin spam, con la voz de tu marca.</span>
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
                      Eliges audiencias desde un marketplace construido con los datos de tu negocio. Nilah IA ya creó el activador: el mensaje exacto, con el humor y la complicidad de una amiga.
                    </p>
                    <ul className="space-y-3 mb-8">
                      {[
                        '4 campañas mensuales prontas para enviar',
                        'Mensajes que suenan a tu marca, no a robot',
                        '3 variaciones por activador',
                        'Flyers generados con IA para redes y estados',
                        'Anti-spam: pausas inteligentes (cooldowns)'
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
                  Nilah sabe cuáles días festivos se acercan. Te ayuda a lanzar una campaña masiva pero personalizada, calculando tu retorno de inversión esperado (ROI).
                </p>

                {/* LIVE WhatsApp mockup */}
                <div className="mb-5 flex-grow">
                  <NilahWhatsAppFestiva />
                </div>

                <div className="bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20 rounded-xl p-4 text-sm mt-auto">
                  <ul className="space-y-2">
                    <li className="flex gap-2 text-violet-800 dark:text-violet-300">
                      <BarChart3 size={16} className="shrink-0 mt-0.5" />
                      <span><strong>ROI Predictivo:</strong> Envía a 200 clientas = $250 USD (aprox S/ 950) en reservas estimadas.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* BLOQUE 6+7 - COPILOT EXPANDED (col-span-full) */}
              <div className="col-span-full bg-gray-900 dark:bg-[#0D0D0D] text-white rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl relative">
                <div className="absolute top-0 left-0 w-full h-full">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10 md:flex gap-0">
                  {/* Left: Copy */}
                  <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                    <div className="inline-flex items-center gap-2 bg-violet-500/20 border border-violet-500/30 px-3 py-1.5 rounded-full text-xs font-bold text-violet-300 mb-6 w-fit">
                      🧠 Solo en Plan Copilot
                    </div>
                    <h3 className="text-2xl md:text-3xl font-extrabold mb-4 leading-tight">
                      Tu socia de negocios.<br/>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">Disponible 24/7 en tu app.</span>
                    </h3>
                    <p className="text-gray-300 text-base leading-relaxed mb-8">
                      Nilah Copilot vive dentro de tu panel. La preguntas por voz o por texto — y te responde con datos reales de tu negocio. No respuestas genéricas. Respuestas tuyas, de hoy.
                    </p>

                    <div className="space-y-4">
                      {[
                        { emoji: '💰', title: 'Sabe cuánto vas a ganar hoy', desc: 'Antes de abrir el salón ya sabe cuánto dinero está confirmado según las citas agendadas.' },
                        { emoji: '👑', title: 'Detecta a tus clientas VIP en riesgo', desc: 'Si tu mejor clienta lleva 45 días sin venir, Nilah te avisa y redacta el mensaje de recuperación.' },
                        { emoji: '📊', title: 'Compara este mes con el anterior', desc: 'Te dice si vas arriba o abajo y exactamente por qué — sin que tengas que revisar nada tú.' },
                        { emoji: '👥', title: 'Te dice quién de tu equipo rinde más', desc: 'Ve quién genera más ingresos este mes y quién necesita atención, con nombres y números.' },
                      ].map((item, i) => (
                        <div key={i} className="flex gap-4 group">
                          <span className="text-2xl shrink-0 mt-0.5 group-hover:scale-110 transition-transform">{item.emoji}</span>
                          <div>
                            <p className="font-bold text-white text-sm mb-0.5">{item.title}</p>
                            <p className="text-gray-400 text-xs leading-relaxed">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Chat mockup */}
                  <div className="md:w-1/2 p-6 md:p-8 flex items-center justify-center">
                    <div className="w-full max-w-sm">
                      {/* App-style chat UI */}
                      <div className="bg-[#0A0A0A] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                        {/* Header */}
                        <div className="bg-violet-600/20 border-b border-white/10 px-4 py-3 flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs">N</div>
                          <div>
                            <p className="text-white text-xs font-bold">Nilah Copilot</p>
                            <p className="text-violet-400 text-[10px]">Tu socia de negocios · en línea</p>
                          </div>
                          <div className="ml-auto h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        </div>
                        {/* Messages */}
                        <div className="p-4 space-y-3 bg-[#0A0A0A]">
                          {/* User message */}
                          <div className="flex justify-end">
                            <div className="bg-violet-600 text-white text-xs rounded-2xl rounded-br-sm px-3.5 py-2.5 max-w-[80%]">
                              ¿Cómo vamos este mes?
                            </div>
                          </div>
                          {/* Copilot response */}
                          <div className="flex gap-2">
                            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white font-bold text-[10px] shrink-0 mt-0.5">N</div>
                            <div className="bg-[#1A1A1A] border border-white/10 text-gray-200 text-xs rounded-2xl rounded-tl-sm px-3.5 py-3 max-w-[85%] space-y-2">
                              <p>Vamos <span className="text-emerald-400 font-bold">+8% sobre el mes pasado</span> 🎉</p>
                              <p>Tu ticket promedio subió <span className="text-white font-bold">S/ 12</span>. Bien.</p>
                              <p className="text-amber-300">⚠️ Tienes <span className="font-bold">4 clientas VIP</span> sin visita hace 45+ días.</p>
                              <p className="text-[#8696a0]">¿Les mando un mensaje de recuperación ahora?</p>
                            </div>
                          </div>
                          {/* Action buttons */}
                          <div className="flex gap-2 pl-8">
                            <button className="flex-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold py-2 px-3 rounded-xl">✓ Sí, envíalo</button>
                            <button className="flex-1 bg-white/5 border border-white/10 text-gray-400 text-[10px] font-medium py-2 px-3 rounded-xl">Ver detalles</button>
                          </div>
                          {/* Second user message */}
                          <div className="flex justify-end">
                            <div className="bg-violet-600 text-white text-xs rounded-2xl rounded-br-sm px-3.5 py-2.5 max-w-[80%]">
                              ¿Quién rinde mejor en el equipo?
                            </div>
                          </div>
                          {/* Second response */}
                          <div className="flex gap-2">
                            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white font-bold text-[10px] shrink-0 mt-0.5">N</div>
                            <div className="bg-[#1A1A1A] border border-white/10 text-gray-200 text-xs rounded-2xl rounded-tl-sm px-3.5 py-3 max-w-[85%] space-y-1.5">
                              <p className="font-bold text-white">Top este mes 🏆</p>
                              <p>1. <span className="text-white font-semibold">Marta</span> — <span className="text-emerald-400">S/ 2,800</span></p>
                              <p>2. <span className="text-white font-semibold">Valeria</span> — <span className="text-emerald-400">S/ 1,950</span></p>
                              <p className="text-amber-300 text-[10px]">Ana está S/ 600 por debajo. ¿Quieres que te sugiera cómo subirle el ticket?</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-center text-xs text-gray-500 mt-3">Así responde Copilot. Con tus datos. Hoy.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FLOW RECAP */}
            <div className="bg-gray-100 dark:bg-[#1A1A1A] rounded-2xl p-6 text-center border border-gray-200 dark:border-white/5 mt-8 max-w-4xl mx-auto">
              <p className="text-sm md:text-base font-semibold text-gray-700 dark:text-gray-300 md:flex md:items-center md:justify-center md:flex-wrap gap-2 leading-loose">
                <span>Chatbot llena la agenda</span> <ArrowRight size={14} className="hidden md:inline text-violet-500"/>
                <span>Korat analiza la clienta</span> <ArrowRight size={14} className="hidden md:inline text-violet-500"/>
                <span>Copilot decide qué hacer</span> <ArrowRight size={14} className="hidden md:inline text-violet-500"/>
                <span>Marketing la reactiva</span> <ArrowRight size={14} className="hidden md:inline text-violet-500"/>
                <span>Rescate la recupera</span>
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
              <Bot size={14} /> El Chatbot que no te quita el control
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold leading-tight text-gray-900 dark:text-white max-w-3xl mx-auto">
              Hace todo el trabajo pesado.
              <br/><span className="text-violet-500">Tú mantienes el toque humano.</span>
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              En todos los planes, Nilah opera en modo On-Demand por defecto: recopila, analiza y te avisa. Tú decides cuándo intervenir.
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
                  On-Demand: el modo<br/>
                  <span className="text-violet-600 dark:text-violet-400">predeterminado inteligente.</span>
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  No es una limitación. Es una filosofía. Nilah recopila, analiza y te entrega un resumen completo directo a tu WhatsApp. <span className="font-semibold text-gray-800 dark:text-gray-100">Tú decides. El bot ya hizo el trabajo.</span>
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
                  <p className="text-xs text-gray-500">On-Demand es tu modo ideal.</p>
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
                  <p className="font-bold text-gray-900 dark:text-white text-sm">¿Quieres escalar volumen?</p>
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
          <div className="grid md:grid-cols-3 gap-8 md:gap-12 relative z-10">
            <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-gray-100 dark:border-white/10 hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-white dark:bg-white/10 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm flex items-center justify-center text-xl mb-4">
                📋
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Tu salón en tiempo real</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                Ve de un vistazo quién está hablando con el bot, qué chats requieren tu intervención y quiénes ya confirmaron su cita para mañana, todo organizado como WhatsApp pero mejor.
              </p>
            </div>
            
            <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-gray-100 dark:border-white/10 hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-white dark:bg-white/10 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm flex items-center justify-center text-xl mb-4">
                ⏸️
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Intervención sin caos</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                Cuando una clienta hace una pregunta compleja, Nilah se pausa automáticamente y te avisa. Tú entras, contestas como humano, y con un clic el bot vuelve a tomar el control. Cero choques.
              </p>
            </div>

            <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-gray-100 dark:border-white/10 hover:shadow-xl transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-xl" />
              <div className="w-12 h-12 bg-white dark:bg-white/10 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm flex items-center justify-center text-xl mb-4">
                💎
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                Perfil 360° Activo <span className="bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 text-[10px] px-2 py-0.5 rounded-full tracking-wider uppercase">VIP</span>
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm relative z-10">
                La columna vital. Mientras chateas, ves al instante el <strong className="text-gray-900 dark:text-gray-200">Lifetime Value (LTV)</strong>, número de visitas, si tiene <strong className="text-rose-500">Alergias</strong> y tus propias notas internas antes de cometer un error.
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
                desc: 'El marketplace de audiencias usa tu historial real: frecuencia, gasto, riesgo de fuga. Envías a cada una lo que la trae de vuelta.'
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
                title: 'Anti-spam inteligente (Cooldowns).',
                desc: 'Si tiene cita mañana, el sistema bloquea la campaña promocional a esa clienta. No la bombardea. Prioriza como un humano.'
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

      {/* FINAL_DE_LA_PARTE_2 */}
      {/* CONTINUACIÓN DESDE LA PARTE 2 */}
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
              { num: '1', icon: '📝', title: 'Setup completo (nosotros lo hacemos todo)', desc: 'Nos das la información de tu salón: servicios, precios, horarios, staff y política de cobro. Nosotros configuramos e integramos todo. Tiempo estimado: 3-5 días.', color: 'from-violet-500 to-violet-600' },
              { num: '2', icon: '⚙️', title: 'Prueba supervisada (7 días contigo)', desc: 'El sistema corre en paralelo. Ves cada conversación, agenda y campaña. Ajustamos. Si algo no funciona: te devolvemos el setup.', color: 'from-purple-500 to-purple-600' },
              { num: '3', icon: '🚀', title: 'Automatización total', desc: 'Nilah atiende. Korat analiza. Marketing reactiva. Copilot te asesora. Te preguntas cuánto dinero dejaste sobre la mesa los meses anteriores.', color: 'from-pink-500 to-pink-600' },
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

          {/* Pricing Grid */}
          <div className="grid lg:grid-cols-3 gap-6 mb-16">
            
            {/* PLAN STARTER */}
            <div className="bg-transparent rounded-[2rem] p-8 border border-transparent hover:border-violet-200 dark:hover:border-violet-500/30 hover:bg-white dark:hover:bg-[#111] transition-all flex flex-col h-full hover:shadow-xl">
              <h3 className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">Plan Starter</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">El sistema informa, tú decides</p>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-5">Organización inteligente y comunicación automatizada sin soltar el control.</p>
              
              {/* Price Display */}
              <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-4xl font-extrabold text-gray-900 dark:text-white">${launchPrices.basico}</span>
                  <span className="text-gray-500 font-medium">USD/mes</span>
                  <span className="text-sm text-gray-400 line-through ml-1">${regularPrices.basico}</span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">S/ {pricesPEN.basico}<span className="text-xs font-normal text-gray-400">/mes</span></p>
                  <span className="text-xs text-gray-400 line-through">S/ {pricesPEN.basicoRegular}</span>
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-bold mt-1">↑ Sube a ${regularPrices.basico} USD al cliente 21</p>
              </div>

              <div className="mb-6 flex-grow">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">QUÉ INCLUYE:</p>
                <ul className="space-y-3">
                  {[
                    'Inbox Compartido Inteligente y Perfil 360',
                    'Chatbot On-Demand (base de todos los planes)',
                    'Agenda conectada con la webapp',
                    'CRM con historial completo de clientas',
                    'Score de fiabilidad automático',
                    'Confirmaciones 24h y 3h antes',
                    'Activador post-cita: feedback + puntos',
                    'Dashboard: ingresos, citas, ocupación'
                  ].map((f, i) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <CheckCircle2 size={18} className="text-gray-400 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <ul className="space-y-2.5 mt-4 opacity-50">
                  <li className="flex gap-3 text-sm text-gray-500"><X size={16} className="shrink-0 mt-0.5" /> Sistema de rescate 35/60/90 días</li>
                  <li className="flex gap-3 text-sm text-gray-500"><X size={16} className="shrink-0 mt-0.5" /> Nilah Marketing (Campañas)</li>
                  <li className="flex gap-3 text-sm text-gray-500"><X size={16} className="shrink-0 mt-0.5" /> Oracle IA / Nilah Copilot</li>
                </ul>
              </div>

              <a href="https://wa.me/51999999999?text=Hola!%20Quiero%20empezar%20con%20el%20Plan%20Starter" target="_blank" rel="noopener noreferrer" className="mt-auto w-full py-4 rounded-xl font-bold bg-white dark:bg-[#222] text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 text-center hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                Elegir Starter
              </a>
            </div>

            {/* PLAN PRO */}
            <div className="bg-white dark:bg-[#141414] rounded-[2rem] p-8 border-2 border-violet-500 shadow-2xl shadow-violet-500/20 relative flex flex-col h-full transform lg:-translate-y-4">
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl" />
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-pink-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                ⭐ EL MÁS ELEGIDO
              </div>
              <h3 className="text-2xl font-bold mb-1 text-violet-600 dark:text-violet-400">Plan Pro</h3>
              <p className="text-xs font-bold text-violet-400/70 uppercase tracking-wider mb-2">El sistema trabaja, tú supervisas</p>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-5">Tu lista de WhatsApp genera citas activamente. El sistema recupera clientas sin que recuerdes hacerlo.</p>
              
              {/* Price Display */}
              <div className="mb-6 relative">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-5xl font-extrabold text-gray-900 dark:text-white">${launchPrices.pro}</span>
                  <span className="text-gray-500 font-medium">USD/mes</span>
                  <span className="text-sm text-gray-400 line-through ml-1">${regularPrices.pro}</span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-violet-600 dark:text-violet-400">S/ {pricesPEN.pro}<span className="text-xs font-normal text-violet-400">/mes</span></p>
                  <span className="text-xs text-gray-400 line-through">S/ {pricesPEN.proRegular}</span>
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-bold mt-1">↑ Sube a ${regularPrices.pro} USD al cliente 21</p>
              </div>

              <div className="mb-6 flex-grow relative z-10">
                <p className="text-xs font-bold uppercase tracking-wider text-violet-500/70 mb-4">Todo lo del Starter, MÁS:</p>
                <ul className="space-y-3">
                  {[
                    { text: 'Sistema de rescate 35 / 60 / 90 días', highlight: true },
                    { text: 'Sistema de recordatorios de retoques de servicios', highlight: false },
                    { text: 'Chatbot Modo Automático (configurable)', highlight: false },
                    { text: 'Nilah Marketing: 4 campañas/mes automáticas', highlight: false },
                    { text: 'Marketplace de audiencias con datos reales', highlight: false },
                    { text: 'Nilah Creative: flyers para redes con IA', highlight: false },
                    { text: 'Oracle IA: proyección de ingresos', highlight: false },
                    { text: 'CRM con segmentación dinámica (VIP, en riesgo…)', highlight: false },
                    { text: 'Anti-spam inteligente (cooldowns)', highlight: false },
                  ].map((f, i) => (
                    <li key={i} className={`flex gap-3 text-sm font-medium leading-snug ${f.highlight ? 'text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-500/10 px-3 py-2 rounded-lg -mx-1' : 'text-gray-700 dark:text-gray-200'}`}>
                      <CheckCircle2 size={18} className={`shrink-0 mt-0.5 ${f.highlight ? 'text-violet-500' : 'text-violet-400'}`} />
                      <span>{f.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <a href="https://wa.me/51999999999?text=Hola!%20Quiero%20el%20Plan%20Pro" target="_blank" rel="noopener noreferrer" className="mt-auto w-full py-4 rounded-xl font-bold bg-gradient-to-r from-violet-600 to-pink-500 text-white shadow-lg shadow-violet-500/25 text-center hover:shadow-violet-500/40 hover:scale-[1.02] transition-all">
                Elegir Pro
              </a>
            </div>

            {/* PLAN COPILOT */}
            <div className="bg-transparent rounded-[2rem] p-8 border border-transparent hover:border-cyan-200 dark:hover:border-cyan-500/30 hover:bg-white dark:hover:bg-[#111] transition-all flex flex-col h-full hover:shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/0 group-hover:bg-cyan-500/10 rounded-full blur-2xl transition-colors" />
              <h3 className="text-2xl font-bold mb-1 text-cyan-700 dark:text-cyan-400">Plan Copilot 🧠</h3>
              <p className="text-xs font-bold text-cyan-500/70 uppercase tracking-wider mb-2">El sistema piensa, tú solo apruebas</p>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-5">Tu salón crece de forma predecible mes a mes con un sistema que te dice qué hacer y lo ejecuta bajo tu aprobación.</p>
              
              {/* Price Display */}
              <div className="mb-6 relative">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-4xl font-extrabold text-gray-900 dark:text-white">${launchPrices.copilot}</span>
                  <span className="text-gray-500 font-medium">USD/mes</span>
                  <span className="text-sm text-gray-400 line-through ml-1">${regularPrices.copilot}</span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-cyan-600 dark:text-cyan-400">S/ {pricesPEN.copilot}<span className="text-xs font-normal text-cyan-500">/mes</span></p>
                  <span className="text-xs text-gray-400 line-through">S/ {pricesPEN.copilotRegular}</span>
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-bold mt-1">↑ Sube a ${regularPrices.copilot} USD al cliente 21</p>
              </div>

              <div className="mb-6 flex-grow relative z-10">
                <p className="text-xs font-bold uppercase tracking-wider text-cyan-600/70 dark:text-cyan-400/70 mb-4">Todo lo del plan Pro, MÁS:</p>
                <div className="bg-white dark:bg-[#1A1A1A] rounded-xl p-4 border border-cyan-100 dark:border-cyan-500/20 mb-4 shadow-sm">
                  <p className="text-xs font-bold text-cyan-600 dark:text-cyan-400 mb-2 uppercase">Copilot en acción</p>
                  <p className="text-sm italic text-gray-600 dark:text-gray-300 leading-relaxed">"Vamos 8% arriba este mes. Tienes 4 clientas VIP hace 45 días sin venir — ¿les mando el mensaje de recuperación ahora?"</p>
                </div>
                <ul className="space-y-3">
                  {[
                    'Nilah Copilot vive en tu app, la preguntas por voz o texto',
                    'Sabe cuánto vas a facturar hoy antes de abrir el salón',
                    'Alerta de clientas VIP que llevan semanas sin volver',
                    'Te dice quién de tu equipo rinde más este mes',
                    'Estrategias y acciones ejecutables con 1 toque',
                    'Soporte prioritario con tiempo de respuesta garantizado'
                  ].map((f, i) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <CheckCircle2 size={18} className="text-cyan-500 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <a href="https://wa.me/51999999999?text=Hola!%20Me%20interesa%20el%20Plan%20Copilot" target="_blank" rel="noopener noreferrer" className="mt-auto w-full py-4 rounded-xl font-bold bg-white dark:bg-[#222] border-2 border-cyan-500 text-cyan-700 dark:text-cyan-400 text-center hover:bg-cyan-50 dark:hover:bg-cyan-500/10 transition-colors">
                Elegir Copilot
              </a>
            </div>
          </div>

          {/* ROI Calculator Nota */}
          <div className="max-w-3xl mx-auto mb-10 text-center bg-violet-50 dark:bg-violet-500/10 rounded-2xl p-6 border border-violet-100 dark:border-violet-500/20">
            <h4 className="font-bold text-lg mb-2 text-violet-700 dark:text-violet-300 flex items-center justify-center gap-2">
              <BarChart3 size={20}/> Cálculo de Rendimiento (ROI)
            </h4>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
              Si tu salón tiene 200 contactos en WhatsApp y una campaña de Nilah Marketing reactiva al 10% de ellos, 
              son <span className="font-bold text-gray-900 dark:text-white">20 citas nuevas ese mes.</span><br/>
              A $15 USD promedio por cita: <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md">$300 USD recuperados.</span><br/>
              El Plan Pro cuesta <span className="font-bold text-violet-600 dark:text-violet-400">${launchPrices.pro} USD</span>. <strong className="text-gray-900 dark:text-white">El primer mes ya está pagado y queda margen de ganancia.</strong>
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
                  <div className="flex gap-2"><CheckCircle2 size={16} className="text-emerald-400 shrink-0" /> Configuración con tu identidad</div>
                  <div className="flex gap-2"><CheckCircle2 size={16} className="text-emerald-400 shrink-0" /> Integración con WA Business</div>
                  <div className="flex gap-2"><CheckCircle2 size={16} className="text-emerald-400 shrink-0" /> Carga de servicios, precios, staff</div>
                  <div className="flex gap-2"><CheckCircle2 size={16} className="text-emerald-400 shrink-0" /> Conexión con políticas de cobro</div>
                  <div className="flex gap-2"><CheckCircle2 size={16} className="text-emerald-400 shrink-0" /> Activadores de rescate configurados</div>
                  <div className="flex gap-2"><CheckCircle2 size={16} className="text-emerald-400 shrink-0" /> Capacitación para tu equipo</div>
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
                a: 'Absolutamente nada. El Dashboard es tan fácil como usar Instagram. El Setup técnico de n8n, Supabase e integraciones lo hacemos nosotros al 100% en el primer paso.' 
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
