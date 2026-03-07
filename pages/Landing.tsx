
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, CheckCircle2, Bot, Zap, Leaf, Sun, Moon, Star, Quote,
  MessageCircle, Calendar, Camera, Bell, Heart, BarChart3, Gift, Megaphone,
  ChevronDown, ChevronUp, Shield, Phone, Clock, Users, Sparkles, X, Menu, Play
} from 'lucide-react';
import { APP_NAME } from '../constants';
import { useTheme } from '../context/ThemeContext';
import { MorphingBlob, FloatingReactionBubbles, ParallaxTiltWrapper, NilahFlowDiagram, AnimatedCounter } from '../components/UI/AnimatedSVGs';

// Hook for scroll-based animations
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
  const visibleSections = useIntersectionObserver();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const getAnimationClass = (sectionId: string, baseAnimation: string = 'animate-fade-in-up') => {
    return visibleSections.has(sectionId) ? baseAnimation : 'opacity-0';
  };

  return (
    <div className="h-[100dvh] overflow-y-auto overflow-x-hidden bg-gradient-to-b from-white via-violet-50/20 to-white text-gray-900 font-sans dark:from-[#0A0A0A] dark:via-[#0F0F0F] dark:to-[#0A0A0A] dark:text-white">

      {/* === NAVBAR === */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
        ? 'border-b border-gray-100 bg-white/80 backdrop-blur-lg shadow-sm dark:border-white/10 dark:bg-[#0A0A0A]/80'
        : 'bg-transparent'
        }`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <div className="relative">
              <Leaf className="h-6 w-6 text-violet-500 transition-transform group-hover:rotate-12 md:h-7 md:w-7" />
              <div className="absolute inset-0 h-6 w-6 rounded-full bg-violet-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity md:h-7 md:w-7" />
            </div>
            <span className="text-lg font-extrabold tracking-tight md:text-xl">{APP_NAME}</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-8 md:flex">
            <button onClick={() => scrollToSection('beneficios')} className="text-sm font-medium text-gray-600 hover:text-violet-500 transition-colors dark:text-gray-300 dark:hover:text-violet-400">Beneficios</button>
            <button onClick={() => scrollToSection('como-funciona')} className="text-sm font-medium text-gray-600 hover:text-violet-500 transition-colors dark:text-gray-300 dark:hover:text-violet-400">Cómo Funciona</button>
            <button onClick={() => scrollToSection('nosotros')} className="text-sm font-medium text-gray-600 hover:text-violet-500 transition-colors dark:text-gray-300 dark:hover:text-violet-400">Nosotros</button>
            <button onClick={() => scrollToSection('precios')} className="text-sm font-medium text-gray-600 hover:text-violet-500 transition-colors dark:text-gray-300 dark:hover:text-violet-400">Precios</button>
            <button onClick={() => scrollToSection('faq')} className="text-sm font-medium text-gray-600 hover:text-violet-500 transition-colors dark:text-gray-300 dark:hover:text-violet-400">FAQ</button>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={toggleTheme}
              className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-violet-500 transition-all dark:hover:bg-white/10 dark:hover:text-violet-400 md:p-2.5"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link to="/nilah/login" className="hidden text-sm font-medium text-gray-600 hover:text-violet-500 md:block dark:text-gray-300 transition-colors">Iniciar Sesión</Link>
            <button
              onClick={() => scrollToSection('precios')}
              className="btn-cta-primary rounded-full bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-105 md:px-6 md:py-2.5"
            >
              Prueba Gratis
            </button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors md:hidden">
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-lg dark:bg-[#0A0A0A]/95 dark:border-white/10 transition-all duration-300 overflow-hidden ${mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}>
          <div className="p-4 space-y-1">
            <button onClick={() => scrollToSection('beneficios')} className="block w-full text-left py-3 px-4 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors">Beneficios</button>
            <button onClick={() => scrollToSection('como-funciona')} className="block w-full text-left py-3 px-4 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors">Cómo Funciona</button>
            <button onClick={() => scrollToSection('nosotros')} className="block w-full text-left py-3 px-4 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors">Nosotros</button>
            <button onClick={() => scrollToSection('precios')} className="block w-full text-left py-3 px-4 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors">Precios</button>
            <button onClick={() => scrollToSection('faq')} className="block w-full text-left py-3 px-4 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors">FAQ</button>
            <Link to="/nilah/login" className="block py-3 px-4 text-violet-500 font-medium">Iniciar Sesión</Link>
          </div>
        </div>
      </nav>

      {/* === HERO SECTION === */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-12 text-center overflow-hidden">
        {/* Animated morphing gradient blobs */}
        <MorphingBlob className="top-1/4 -left-32" colors="from-violet-500/30 via-purple-500/20 to-pink-500/15" size="h-[500px] w-[500px]" />
        <MorphingBlob className="bottom-1/4 -right-32" colors="from-pink-500/25 via-violet-500/15 to-blue-500/10" size="h-[400px] w-[400px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-blue-500/10 blur-[100px]" />

        <div className="relative z-10 max-w-4xl space-y-8 animate-fade-in-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 backdrop-blur-sm px-4 py-2 text-xs font-medium text-violet-600 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-400 shadow-lg animate-fade-in">
            <Sparkles size={14} className="animate-pulse" />
            La revolución en atención al cliente para salones de belleza
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-extrabold leading-[1.1] md:text-6xl lg:text-7xl animate-fade-in-up delay-100">
            Tu recepcionista de WhatsApp que{' '}
            <span className="bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-pulse-slow">nunca duerme</span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto max-w-2xl text-lg md:text-xl text-gray-600 dark:text-gray-300 animate-fade-in-up delay-200">
            Nilah IA atiende a tus clientas por WhatsApp 24/7, agenda citas, cotiza diseños de uñas con solo una foto y recupera clientes que dejaron de venir.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-4 text-sm animate-fade-in-up delay-300">
            {[
              { icon: CheckCircle2, text: 'Responde WhatsApp 24/7' },
              { icon: CheckCircle2, text: 'Cotiza nail art con IA' },
              { icon: CheckCircle2, text: 'Reduce no-shows 70%' },
            ].map((item, i) => (
              <span key={i} className="flex items-center gap-2 bg-white/60 dark:bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-gray-100 dark:border-white/10">
                <item.icon size={16} className="text-emerald-500" />
                <span className="text-gray-700 dark:text-gray-300">{item.text}</span>
              </span>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center gap-4 pt-4 sm:flex-row sm:justify-center animate-fade-in-up delay-400">
            <button
              onClick={() => scrollToSection('precios')}
              className="btn-cta-primary w-full sm:w-auto rounded-full bg-gradient-to-r from-violet-500 to-violet-600 px-10 py-4 text-base font-bold text-white hover:from-violet-600 hover:to-violet-700 shadow-2xl shadow-violet-500/30 hover:shadow-violet-500/50 flex items-center justify-center gap-2 transition-all hover:scale-105 animate-glow-pulse"
            >
              🚀 Quiero Probar Nilah IA Gratis
            </button>
            <button
              onClick={() => scrollToSection('demo')}
              className="group w-full sm:w-auto rounded-full border-2 border-gray-200 dark:border-white/20 px-8 py-4 text-base font-medium hover:border-violet-300 dark:hover:border-violet-500/50 hover:bg-violet-50 dark:hover:bg-violet-500/5 flex items-center justify-center gap-2 transition-all"
            >
              <Play size={18} className="text-violet-500" />
              Ver Demo
            </button>
          </div>

          {/* Social Proof */}
          <div className="flex items-center justify-center gap-3 text-sm animate-fade-in-up delay-500">
            <div className="flex -space-x-1">
              {[1, 2, 3, 4, 5].map(i => <Star key={i} size={16} className="text-yellow-400 fill-yellow-400 drop-shadow-sm" />)}
            </div>
            <span className="text-gray-600 dark:text-gray-400">4.9/5 • <span className="font-semibold text-gray-900 dark:text-white">+50 salones</span> ya usan Nilah IA</span>
          </div>
        </div>

        {/* WhatsApp Mockup with Parallax + Floating Bubbles */}
        <div className="relative mt-16 w-full max-w-sm mx-auto animate-fade-in-up delay-600">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-pink-500 rounded-3xl blur-2xl opacity-20 animate-float" />
          {/* Floating reaction bubbles */}
          <FloatingReactionBubbles />
          <ParallaxTiltWrapper>
            <div className="relative rounded-3xl bg-gray-100 dark:bg-[#1A1A1A] p-3 shadow-2xl border border-gray-200 dark:border-white/10">
              <div className="rounded-2xl bg-white dark:bg-[#0F0F0F] overflow-hidden shadow-inner">
                {/* WhatsApp Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-3 flex items-center gap-3">
                  <div className="relative h-10 w-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <Bot size={18} className="text-white" />
                    {/* Pulse ring */}
                    <span className="absolute inset-0 rounded-full bg-emerald-300/40 animate-pulse-ring" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">Nilah IA</p>
                    <p className="text-white/70 text-xs flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                      En línea
                    </p>
                  </div>
                </div>
                {/* Messages */}
                <div className="p-4 space-y-3 bg-[#ECE5DD] dark:bg-[#0B141A] min-h-[220px]">
                  <div className="bg-white dark:bg-[#1F2C34] rounded-lg rounded-tl-none p-3 max-w-[85%] shadow-sm transform hover:scale-[1.02] transition-transform">
                    <p className="text-sm text-gray-800 dark:text-gray-200">Hola! 💅 Quiero agendar una cita para uñas acrílicas</p>
                    <p className="text-[10px] text-gray-400 text-right mt-1">10:30</p>
                  </div>
                  <div className="bg-emerald-100 dark:bg-emerald-900/30 rounded-lg rounded-tr-none p-3 max-w-[85%] ml-auto shadow-sm transform hover:scale-[1.02] transition-transform">
                    <p className="text-sm text-gray-800 dark:text-gray-200">¡Hola! 😊 Claro, tenemos disponible mañana a las 3PM o pasado a las 11AM. ¿Cuál prefieres?</p>
                    <p className="text-[10px] text-gray-400 text-right mt-1 flex items-center justify-end gap-1">
                      10:30
                      <CheckCircle2 size={10} className="text-blue-400" />
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ParallaxTiltWrapper>
        </div>
      </section>

      {/* === PROBLEMA SECTION === */}
      <section id="problema" data-animate className="py-24 bg-gradient-to-b from-gray-50 to-white dark:from-[#0F0F0F] dark:to-[#0A0A0A]">
        <div className={`mx-auto max-w-4xl px-4 text-center ${getAnimationClass('problema')}`}>
          <span className="inline-block mb-4 text-4xl">😰</span>
          <h2 className="text-3xl font-bold mb-4 md:text-4xl lg:text-5xl">¿Te suena familiar?</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-12 max-w-xl mx-auto">Los problemas que enfrentan las dueñas de salón todos los días...</p>

          <div className="mt-10 grid gap-4 md:grid-cols-2 text-left">
            {[
              { emoji: '😤', text: 'Estás atendiendo una clienta y tu teléfono no para de sonar', delay: '100' },
              { emoji: '💸', text: 'Pierdes citas porque no contestaste a tiempo', delay: '200' },
              { emoji: '🤯', text: 'Cobras mal los diseños complicados porque calculas "al ojo"', delay: '300' },
              { emoji: '😴', text: 'Clientas escriben a las 11pm y las pierdes porque no contestas', delay: '400' },
              { emoji: '📉', text: 'Tienes clientas que dejaron de venir y no sabes por qué', delay: '500' },
              { emoji: '📅', text: 'Huecos vacíos en tu agenda que no sabes cómo llenar', delay: '600' },
            ].map((item, i) => (
              <div
                key={i}
                className={`group flex items-start gap-4 rounded-2xl bg-white dark:bg-[#141414] p-5 shadow-sm hover:shadow-lg border border-gray-100 dark:border-white/5 transition-all duration-300 hover:-translate-y-1 hover:border-violet-200 dark:hover:border-violet-500/30`}
              >
                <span className="text-3xl group-hover:scale-110 transition-transform">{item.emoji}</span>
                <p className="text-gray-600 dark:text-gray-300 text-base">{item.text}</p>
              </div>
            ))}
          </div>

          <p className="mt-12 text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-lg">
            Sabemos lo difícil que es manejar todo sola. <span className="text-violet-500 font-medium">Tu talento es crear belleza</span>, no ser recepcionista 24/7.
          </p>
        </div>
      </section>

      {/* === SOLUCIÓN SECTION === */}
      <section id="beneficios" data-animate className="py-24 bg-white dark:bg-[#0A0A0A]">
        <div className={`mx-auto max-w-6xl px-4 ${getAnimationClass('beneficios')}`}>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-4 rounded-full bg-violet-100 dark:bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-600 dark:text-violet-400">
              <Bot size={16} />
              Conoce la solución
            </div>
            <h2 className="text-3xl font-bold md:text-4xl lg:text-5xl">
              Conoce a <span className="bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-transparent">Nilah IA</span>
            </h2>
            <p className="mt-4 text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-lg">
              Una asistente con inteligencia artificial diseñada exclusivamente para salones de belleza que trabaja por ti las 24 horas.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: MessageCircle, title: 'Atiende WhatsApp', desc: 'Responde mensajes, audios e imágenes como si fueras tú', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10', hoverColor: 'group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20' },
              { icon: Calendar, title: 'Agenda Citas', desc: 'Revisa tu calendario en tiempo real y reserva sin errores', color: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10', hoverColor: 'group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20' },
              { icon: Camera, title: 'Cotiza con Fotos', desc: 'Analiza diseños de uñas y calcula precios automáticamente', color: 'text-pink-500 bg-pink-50 dark:bg-pink-500/10', hoverColor: 'group-hover:bg-pink-100 dark:group-hover:bg-pink-500/20' },
              { icon: Bell, title: 'Envía Recordatorios', desc: 'Confirmaciones 24h antes para reducir no-shows', color: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10', hoverColor: 'group-hover:bg-amber-100 dark:group-hover:bg-amber-500/20' },
              { icon: Heart, title: 'Rescata Clientas', desc: 'Detecta quién dejó de venir y las recupera por ti', color: 'text-red-500 bg-red-50 dark:bg-red-500/10', hoverColor: 'group-hover:bg-red-100 dark:group-hover:bg-red-500/20' },
              { icon: BarChart3, title: 'Dashboard Inteligente', desc: 'Visualiza todo tu negocio en un solo lugar', color: 'text-violet-500 bg-violet-50 dark:bg-violet-500/10', hoverColor: 'group-hover:bg-violet-100 dark:group-hover:bg-violet-500/20' },
            ].map((item, i) => (
              <div
                key={i}
                className="group tap-feedback rounded-2xl border border-gray-100 dark:border-white/5 bg-white dark:bg-[#141414] p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 hover:border-violet-200 dark:hover:border-violet-500/30"
              >
                <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${item.color} ${item.hoverColor} mb-5 transition-colors`}>
                  <item.icon size={26} />
                </div>
                <h3 className="font-bold text-lg mb-2 group-hover:text-violet-500 transition-colors">{item.title}</h3>
                <p className="text-gray-500 dark:text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === DEMO SECTION === */}
      <section id="demo" data-animate className="py-24 bg-gradient-to-b from-gray-50 to-white dark:from-[#0F0F0F] dark:to-[#0A0A0A]">
        <div className={`mx-auto max-w-4xl px-4 text-center ${getAnimationClass('demo')}`}>
          <h2 className="text-3xl font-bold mb-4 md:text-4xl lg:text-5xl">Mira a Nilah IA en acción</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-12 text-lg">En menos de 2 minutos, descubre cómo Nilah transforma la atención de tu salón</p>

          <div className="aspect-video rounded-3xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 p-1 shadow-2xl shadow-violet-500/20">
            <div className="w-full h-full rounded-[20px] bg-white dark:bg-[#1A1A1A] flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-50 to-pink-50 dark:from-violet-500/5 dark:to-pink-500/5" />
              <div className="relative text-center p-8">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-violet-100 to-pink-100 dark:from-violet-500/20 dark:to-pink-500/20 flex items-center justify-center mx-auto mb-6 group cursor-pointer hover:scale-110 transition-transform shadow-lg">
                  <Play size={36} className="text-violet-500 ml-1" />
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-lg font-medium mb-2">Video demo próximamente</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">Mientras tanto, prueba el dashboard real →</p>
                <Link to="/nilah/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-violet-500 text-white font-medium hover:bg-violet-600 transition-colors shadow-lg shadow-violet-500/25">
                  Ver Dashboard Demo <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === COTIZADOR VISUAL === */}
      <section id="cotizador" data-animate className="py-24 bg-white dark:bg-[#0A0A0A] overflow-hidden">
        <div className={`mx-auto max-w-6xl px-4 ${getAnimationClass('cotizador')}`}>
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2 space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-100 to-violet-100 dark:from-pink-500/10 dark:to-violet-500/10 px-4 py-2 text-sm font-bold text-pink-600 dark:text-pink-400">
                ✨ EXCLUSIVO DE NILAH IA
              </span>
              <h2 className="text-3xl font-bold md:text-4xl lg:text-5xl leading-tight">
                El único chatbot que cotiza nail art <span className="text-pink-500">con solo una foto</span>
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                Tu clienta envía una foto de Pinterest o Instagram. Nilah la analiza con inteligencia artificial y calcula el precio exacto en segundos.
              </p>
              <ul className="space-y-4">
                {[
                  'Nunca más cobres de menos un diseño complicado',
                  'La clienta sabe el precio antes de venir',
                  'Tú ahorras tiempo explicando precios',
                  'Se acabó el "ay, pensé que era más barato"'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-600 dark:text-gray-300 text-base">
                    <CheckCircle2 size={20} className="text-emerald-500 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <div className="bg-gradient-to-r from-violet-50 to-pink-50 dark:from-violet-500/5 dark:to-pink-500/5 border border-violet-100 dark:border-violet-500/20 p-4 rounded-2xl">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  💡 <span className="font-medium">Los salones pierden en promedio S/ 500-1,000 al mes</span> cobrando mal los diseños complejos
                </p>
              </div>
            </div>

            <div className="lg:w-1/2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/30 to-violet-500/30 rounded-3xl blur-3xl" />
                <div className="relative rounded-3xl bg-gradient-to-br from-pink-500 to-violet-500 p-1 shadow-2xl">
                  <div className="rounded-[20px] bg-white dark:bg-[#1A1A1A] p-8">
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-pink-100 to-violet-100 dark:from-pink-500/20 dark:to-violet-500/20 mb-3">
                        <Camera size={32} className="text-pink-500" />
                      </div>
                      <p className="font-bold text-lg">📸 Diseño analizado:</p>
                    </div>
                    <div className="space-y-3 text-base text-gray-600 dark:text-gray-300 mb-6 bg-gray-50 dark:bg-white/5 p-4 rounded-xl">
                      <p>• Complejidad: <span className="font-bold text-pink-500">Avanzado</span></p>
                      <p>• Largo: <span className="font-bold">XL</span></p>
                      <p>• Técnica: <span className="font-bold">Acrílico + Gel</span></p>
                    </div>
                    <div className="border-t-2 border-dashed border-gray-200 dark:border-white/10 pt-6 space-y-3">
                      <div className="flex justify-between text-base"><span className="text-gray-500">Base acrílico:</span><span className="font-medium">S/ 80</span></div>
                      <div className="flex justify-between text-base"><span className="text-gray-500">Arte avanzado:</span><span className="font-medium">S/ 40</span></div>
                      <div className="flex justify-between text-base"><span className="text-gray-500">Largo XL:</span><span className="font-medium">S/ 20</span></div>
                      <div className="flex justify-between font-bold text-xl pt-4 border-t border-gray-200 dark:border-white/10">
                        <span>TOTAL:</span>
                        <span className="bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-transparent">S/ 140</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === CÓMO FUNCIONA === */}
      <section id="como-funciona" data-animate className="py-24 bg-gradient-to-b from-gray-50 to-white dark:from-[#0F0F0F] dark:to-[#0A0A0A]">
        <div className={`mx-auto max-w-5xl px-4 text-center ${getAnimationClass('como-funciona')}`}>
          <h2 className="text-3xl font-bold mb-4 md:text-4xl lg:text-5xl">Empieza en 3 simples pasos</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-16 text-lg">Sin complicaciones técnicas. Nosotros configuramos todo por ti.</p>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              { num: '1', icon: '📝', title: 'Cuéntanos de tu salón', desc: 'Completas un breve formulario con tus servicios, precios y horarios. Toma 10 minutos.', color: 'from-violet-500 to-violet-600' },
              { num: '2', icon: '⚙️', title: 'Configuramos Nilah', desc: 'Nuestro equipo conecta Nilah a tu WhatsApp y personaliza las respuestas.', color: 'from-purple-500 to-purple-600' },
              { num: '3', icon: '🚀', title: '¡Nilah empieza!', desc: 'En 24-48 horas, Nilah está atendiendo a tus clientas mientras tú creas belleza.', color: 'from-pink-500 to-pink-600' },
            ].map((step, i) => (
              <div key={i} className="relative group">
                <div className="tap-feedback rounded-3xl bg-white dark:bg-[#141414] p-8 border border-gray-100 dark:border-white/5 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 min-h-[280px] flex flex-col">
                  <span className={`absolute -top-5 left-1/2 -translate-x-1/2 h-10 w-10 rounded-full bg-gradient-to-br ${step.color} text-white font-bold flex items-center justify-center shadow-lg`}>
                    {step.num}
                  </span>
                  <span className="text-4xl mb-5 block mt-2">{step.icon}</span>
                  <h3 className="font-bold text-xl mb-3">{step.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 flex-grow">{step.desc}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 text-gray-300 dark:text-gray-700">
                    <ArrowRight size={24} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Nilah Flow Diagram — animated SVG */}
          <div className="mt-16 py-8">
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-6 uppercase tracking-widest">Así fluyen los datos</p>
            <NilahFlowDiagram />
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-6 text-base">
            <span className="tap-feedback flex items-center gap-2 bg-white dark:bg-[#141414] px-5 py-3 rounded-full shadow-sm border border-gray-100 dark:border-white/5">
              <CheckCircle2 size={18} className="text-emerald-500" /> Capacitación incluida
            </span>
            <span className="tap-feedback flex items-center gap-2 bg-white dark:bg-[#141414] px-5 py-3 rounded-full shadow-sm border border-gray-100 dark:border-white/5">
              <CheckCircle2 size={18} className="text-emerald-500" /> Soporte por WhatsApp
            </span>
          </div>
        </div>
      </section>

      {/* === TESTIMONIOS === */}
      <section id="testimonios" data-animate className="py-24 bg-white dark:bg-[#0A0A0A]">
        <div className={`mx-auto max-w-6xl px-4 ${getAnimationClass('testimonios')}`}>
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 mb-4 rounded-full bg-yellow-100 dark:bg-yellow-500/10 px-4 py-2 text-sm font-bold text-yellow-700 dark:text-yellow-400">
              ⭐ RESULTADOS REALES
            </span>
            <h2 className="text-3xl font-bold md:text-4xl lg:text-5xl">Ellas ya transformaron su salón</h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              { quote: 'Antes me la pasaba contestando WhatsApp mientras atendía. Ahora Nilah hace eso y yo me enfoco en mis clientas. ¡Mis ingresos subieron 30%!', name: 'María López', salon: 'Beauty Studio María', location: 'Lima, Perú', metric: '+30% ingresos' },
              { quote: 'El cotizador de uñas es INCREÍBLE. Mis clientas mandan fotos de diseños locos y Nilah les da el precio exacto.', name: 'Carla Rodríguez', salon: 'Nails & Co.', location: 'Lima, Perú', metric: '0 errores de precio' },
              { quote: 'Recuperé clientas que no venían hace meses. Nilah les escribió automáticamente y 7 volvieron en la primera semana.', name: 'Andrea Vega', salon: 'Glamour Spa', location: 'Lima, Perú', metric: '7 clientas rescatadas' },
            ].map((t, i) => (
              <div key={i} className="relative tap-feedback rounded-3xl bg-gradient-to-b from-gray-50 to-white dark:from-[#141414] dark:to-[#0F0F0F] p-8 border border-gray-100 dark:border-white/5 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group">
                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-violet-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  {t.metric}
                </div>
                <Quote className="absolute right-6 top-6 h-10 w-10 text-gray-100 dark:text-white/5 group-hover:text-violet-100 dark:group-hover:text-violet-500/10 transition-colors" />
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map(j => <Star key={j} size={16} className="text-yellow-400 fill-yellow-400" />)}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-8 text-base leading-relaxed">"{t.quote}"</p>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center text-white font-bold">
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-bold">{t.name}</p>
                    <p className="text-sm text-gray-500">{t.salon} • {t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 flex flex-wrap justify-center gap-8 text-center">
            <AnimatedCounter value="+50" label="Salones confían en Nilah" />
            <AnimatedCounter value="+10k" label="Citas agendadas" />
            <AnimatedCounter value="+100k" label="Mensajes respondidos" />
          </div>
        </div>
      </section>

      {/* === SOBRE NOSOTROS === */}
      <section id="nosotros" data-animate className="py-24 bg-white dark:bg-[#0A0A0A] overflow-hidden">
        <div className={`mx-auto max-w-6xl px-4 ${getAnimationClass('nosotros')}`}>

          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-4 rounded-full bg-violet-100 dark:bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-600 dark:text-violet-400">
              <Heart size={16} />
              Nuestra Historia
            </div>
            <h2 className="text-3xl font-bold md:text-4xl lg:text-5xl mb-4">
              Creamos tecnología para que <span className="bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-transparent">vuelvas a amar tu negocio</span>
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-lg">
              Automatización con propósito para el sector Wellness
            </p>
          </div>

          {/* The Pain - Empathy Section */}
          <div className="mb-20">
            <div className="max-w-3xl mx-auto text-center">
              <div className="bg-gradient-to-r from-violet-50 to-pink-50 dark:from-violet-500/5 dark:to-pink-500/5 border border-violet-100 dark:border-violet-500/20 rounded-3xl p-8 md:p-12">
                <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 leading-relaxed">
                  <span className="font-bold text-violet-600 dark:text-violet-400">Sabemos que pasas entre 2 y 3 horas diarias</span> en tareas administrativas.
                  Vimos cómo dueños talentosos se convertían en esclavos de su recepción y perdían
                  <span className="font-bold"> hasta el 50% de sus clientes</span> por falta de seguimiento.
                </p>
                <p className="mt-6 text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                  Decidimos cambiar eso. 💜
                </p>
              </div>
            </div>
          </div>

          {/* Brand Differentiation Diagram */}
          <div className="mb-20">
            <div className="grid md:grid-cols-3 gap-6 items-center">
              {/* Problem */}
              <div className="relative group">
                <div className="rounded-3xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 p-8 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                  <div className="text-4xl mb-4">😰</div>
                  <h3 className="font-bold text-lg mb-2 text-red-600 dark:text-red-400">El Problema</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Salones ahogados en WhatsApp, citas perdidas y clientas olvidadas</p>
                </div>
              </div>

              {/* Arrow */}
              <div className="hidden md:flex items-center justify-center">
                <div className="relative">
                  <div className="flex items-center gap-4">
                    <ArrowRight size={32} className="text-violet-500" />
                    <div className="text-center">
                      <div className="h-20 w-20 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center mx-auto shadow-lg shadow-violet-500/30">
                        <Leaf size={32} className="text-white" />
                      </div>
                      <p className="font-bold text-sm mt-2">Korat Flow</p>
                      <p className="text-xs text-gray-500">El Cerebro</p>
                    </div>
                    <ArrowRight size={32} className="text-violet-500" />
                  </div>
                </div>
              </div>

              {/* Solution */}
              <div className="relative group">
                <div className="rounded-3xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 p-8 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                  <div className="text-4xl mb-4">🚀</div>
                  <h3 className="font-bold text-lg mb-2 text-emerald-600 dark:text-emerald-400">La Solución</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Nilah IA: Tu recepcionista 24/7 que nunca falla</p>
                </div>
              </div>
            </div>

            {/* Mobile Arrow */}
            <div className="md:hidden flex justify-center my-6">
              <div className="text-center">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center mx-auto shadow-lg shadow-violet-500/30">
                  <Leaf size={24} className="text-white" />
                </div>
                <p className="font-bold text-sm mt-2">Korat Flow</p>
                <p className="text-xs text-gray-500">El Cerebro</p>
              </div>
            </div>
          </div>

          {/* Our Approach */}
          <div className="mb-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl md:text-3xl font-bold mb-6">
                  En <span className="text-violet-500">Korat Flow</span>, somos una agencia especializada en automatización e IA
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-lg mb-6 leading-relaxed">
                  No solo vendemos software; <span className="font-semibold">diseñamos ecosistemas digitales</span> como Nilah IA,
                  la primera recepcionista que <span className="text-violet-500 font-medium">ve, escucha y razona</span>,
                  diseñada específicamente para entender la complejidad de un salón de belleza.
                </p>
                <div className="space-y-4">
                  {[
                    { icon: Bot, text: 'IA Conversacional avanzada (comprende contexto y emociones)' },
                    { icon: Camera, text: 'Visión Artificial (analiza fotos de diseños)' },
                    { icon: Zap, text: 'Automatización de procesos (n8n, APIs, integraciones)' },
                    { icon: BarChart3, text: 'Inteligencia de Negocio (dashboard y métricas)' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                      <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center">
                        <item.icon size={20} className="text-violet-500" />
                      </div>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Founder Card */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-pink-500/20 rounded-3xl blur-2xl" />
                <div className="relative bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/10 rounded-3xl p-8 shadow-xl">
                  <div className="flex flex-col items-center text-center">
                    {/* Founder Photo */}
                    <div className="relative mb-4">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 blur-md opacity-50" />
                      <img
                        src="/assets/images/martin-founder.jpg"
                        alt="Martin - Fundador de Korat Flow"
                        className="relative h-28 w-28 md:h-32 md:w-32 rounded-full object-cover object-top border-4 border-white dark:border-[#1A1A1A] shadow-xl"
                      />
                    </div>
                    <h4 className="font-bold text-xl">Martin Pestana</h4>
                    <p className="text-violet-500 text-sm font-medium mb-4">Fundador, Korat Flow</p>

                    <Quote className="h-8 w-8 text-violet-200 dark:text-violet-500/30 mb-4" />

                    <p className="text-gray-600 dark:text-gray-400 italic leading-relaxed">
                      "Nos obsesiona combinar la tecnología avanzada con la calidez que tu negocio necesita.
                      Cada salón tiene su personalidad, y Nilah IA aprende a respetarla."
                    </p>

                    <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/10 w-full">
                      <div className="flex justify-center gap-8">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-violet-500">5+</p>
                          <p className="text-xs text-gray-500">Años en IA</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-violet-500">50+</p>
                          <p className="text-xs text-gray-500">Proyectos</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-violet-500">100%</p>
                          <p className="text-xs text-gray-500">Pasión</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Value Props */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '🎯', title: 'Especialización', desc: 'Nos enfocamos 100% en el sector belleza y wellness. Entendemos tu negocio.' },
              { icon: '🤝', title: 'Soporte Humano', desc: 'Detrás de la IA hay un equipo real que te acompaña en cada paso.' },
              { icon: '🔧', title: 'Personalización', desc: 'Nilah se adapta a tu estilo, tus precios y la personalidad de tu salón.' },
            ].map((item, i) => (
              <div key={i} className="rounded-2xl bg-gray-50 dark:bg-[#141414] border border-gray-100 dark:border-white/5 p-6 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <span className="text-3xl mb-3 block">{item.icon}</span>
                <h4 className="font-bold text-lg mb-2">{item.title}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* === PRECIOS === */}
      <section id="precios" data-animate className="py-24 bg-gradient-to-b from-gray-50 to-white dark:from-[#0F0F0F] dark:to-[#0A0A0A]">
        <div className={`mx-auto max-w-5xl px-4 ${getAnimationClass('precios')}`}>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold md:text-4xl lg:text-5xl">Elige tu plan perfecto</h2>
            <p className="mt-4 text-gray-500 dark:text-gray-400 text-lg">Inversión que se paga sola el primer mes</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2 max-w-4xl mx-auto">
            {/* STARTER */}
            <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141414] p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🌱</span>
                <h3 className="text-2xl font-bold">Starter</h3>
              </div>
              <p className="text-gray-500 mb-6">Para salones que empiezan a automatizar</p>
              <div className="mb-8">
                <span className="text-5xl font-extrabold">S/ 297</span>
                <span className="text-gray-500 text-lg">/mes</span>
              </div>
              <ul className="space-y-4 text-base mb-8">
                {['Chatbot WhatsApp 24/7', 'Agenda de citas en línea', 'Recordatorios automáticos', 'CRM básico de clientes', 'Dashboard con métricas', '500 conversaciones/mes'].map((f, i) => (
                  <li key={i} className="flex gap-3 text-gray-600 dark:text-gray-300">
                    <CheckCircle2 size={20} className="text-emerald-500 shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => scrollToSection('cta-final')}
                className="w-full rounded-xl border-2 border-gray-200 dark:border-white/20 py-4 font-bold text-gray-700 dark:text-gray-300 hover:border-violet-300 hover:text-violet-600 dark:hover:border-violet-500/50 dark:hover:text-violet-400 transition-all"
              >
                Empezar con Starter
              </button>
            </div>

            {/* PRO */}
            <div className="relative rounded-3xl border-2 border-violet-500 bg-white dark:bg-[#1A1A1A] p-8 shadow-2xl shadow-violet-500/10 hover:shadow-violet-500/20 transition-all duration-300 hover:-translate-y-2">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 px-5 py-1.5 text-xs font-bold text-white shadow-lg">
                MÁS POPULAR
              </div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">💎</span>
                <h3 className="text-2xl font-bold">Pro</h3>
              </div>
              <p className="text-gray-500 mb-6">El sistema completo para crecer</p>
              <div className="mb-2">
                <span className="text-5xl font-extrabold">S/ 597</span>
                <span className="text-gray-500 text-lg">/mes</span>
              </div>
              <p className="text-sm text-violet-500 font-medium mb-6">Todo de Starter, más:</p>
              <ul className="space-y-4 text-base mb-8">
                {[
                  '⭐ Cotizador Visual de Nail Art',
                  '⭐ Rescate automático de clientas',
                  '⭐ Sistema de puntos y fidelización',
                  '⭐ Marketing con IA',
                  '⭐ Dashboard inteligente',
                  '⭐ Multi-staff (3 usuarios)',
                  '⭐ 2,000 conversaciones/mes',
                  '⭐ Soporte prioritario'
                ].map((f, i) => (
                  <li key={i} className="flex gap-3 text-gray-600 dark:text-gray-300">
                    <CheckCircle2 size={20} className="text-violet-500 shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => scrollToSection('cta-final')}
                className="btn-cta-primary w-full rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 py-4 font-bold text-white hover:from-violet-600 hover:to-violet-700 shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40"
              >
                🚀 Empezar con Pro
              </button>
              <p className="text-xs text-center text-gray-400 mt-4">El 80% de nuestros clientes eligen Pro</p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <div className="inline-block rounded-2xl bg-gradient-to-r from-violet-50 to-pink-50 dark:from-violet-500/10 dark:to-pink-500/10 border border-violet-100 dark:border-violet-500/20 p-6 text-left">
              <p className="font-bold text-violet-600 dark:text-violet-400 mb-3 text-lg">💡 Ponlo en perspectiva:</p>
              <div className="space-y-2 text-gray-600 dark:text-gray-300">
                <p>Recepcionista medio tiempo: <span className="font-semibold">S/ 1,200/mes</span></p>
                <p>Nilah Pro: <span className="font-semibold">S/ 597/mes</span> → <span className="font-bold text-emerald-500">Ahorro: S/ 600+</span></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === GARANTÍA === */}
      <section id="garantia" data-animate className="py-20 bg-white dark:bg-[#0A0A0A]">
        <div className={`mx-auto max-w-3xl px-4 text-center ${getAnimationClass('garantia')}`}>
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-500/20 dark:to-emerald-500/10 mb-6">
            <Shield size={40} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Garantía de Satisfacción de 30 Días</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg max-w-xl mx-auto">
            Prueba Nilah IA durante 30 días completos. Si no ves resultados, te devolvemos el 100% de tu dinero. Sin preguntas.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            {['Devolución completa', 'Sin preguntas', 'Reembolso en 48h'].map((item, i) => (
              <span key={i} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2 rounded-full">
                <CheckCircle2 size={18} className="text-emerald-500" /> {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* === FAQ === */}
      <section id="faq" data-animate className="py-24 bg-gradient-to-b from-gray-50 to-white dark:from-[#0F0F0F] dark:to-[#0A0A0A]">
        <div className={`mx-auto max-w-3xl px-4 ${getAnimationClass('faq')}`}>
          <h2 className="text-3xl font-bold text-center mb-12 md:text-4xl lg:text-5xl">Preguntas Frecuentes</h2>
          <div className="space-y-4">
            {[
              { q: '¿Necesito saber de tecnología para usar Nilah?', a: 'Para nada. Nosotros configuramos todo por ti. Solo necesitas saber usar WhatsApp. El dashboard es súper intuitivo.' },
              { q: '¿Qué pasa si una clienta hace una pregunta rara?', a: 'Nilah está entrenada para tu tipo de negocio. Si recibe algo que no puede manejar, te avisa inmediatamente y te pasa la conversación.' },
              { q: '¿Mis clientas sabrán que es un robot?', a: 'Nilah conversa de forma muy natural. La mayoría de clientas no lo notan. Y si preguntan, Nilah responde con honestidad.' },
              { q: '¿Funciona con mi número de WhatsApp actual?', a: 'Sí. Conectamos Nilah a tu número de WhatsApp Business existente. Tus clientas siguen escribiendo al mismo número.' },
              { q: '¿Cuánto toma la configuración?', a: 'Entre 24 y 48 horas después de que nos envíes tu información. No tienes que hacer nada técnico.' },
              { q: '¿Qué pasa si quiero cancelar?', a: 'Puedes cancelar cuando quieras, sin penalidades. Tienes garantía de 30 días con devolución completa.' },
            ].map((item, i) => (
              <div key={i} className="rounded-2xl bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/5 overflow-hidden hover:shadow-lg transition-shadow">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left font-medium text-base hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <span className="pr-4">{item.q}</span>
                  <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center transition-all ${openFaq === i ? 'bg-violet-500 text-white rotate-180' : 'bg-gray-100 dark:bg-white/10 text-gray-400'}`}>
                    <ChevronDown size={18} />
                  </div>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="px-5 pb-5 text-gray-500 dark:text-gray-400">{item.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === CTA FINAL === */}
      <section id="cta-final" className="py-24 bg-gradient-to-br from-violet-600 via-purple-600 to-pink-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="mx-auto max-w-3xl px-4 text-center text-white relative">
          <h2 className="text-3xl font-bold mb-4 md:text-4xl lg:text-5xl">¿Lista para que tu salón funcione en automático?</h2>
          <p className="text-white/80 mb-10 text-lg">Únete a las 50+ dueñas de salón que ya duermen tranquilas sabiendo que Nilah atiende a sus clientas.</p>
          <div className="flex flex-wrap justify-center gap-4 mb-10 text-sm">
            {['Configuración en 24-48h', 'Garantía de 30 días', 'Soporte humano real'].map((item, i) => (
              <span key={i} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <CheckCircle2 size={16} /> {item}
              </span>
            ))}
          </div>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="https://wa.me/51999999999?text=Hola!%20Quiero%20probar%20Nilah%20IA"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto rounded-full bg-white px-10 py-4 font-bold text-violet-600 hover:bg-gray-100 shadow-2xl flex items-center justify-center gap-2 transition-all hover:scale-105"
            >
              🚀 Quiero Empezar Ahora
            </a>
            <a
              href="https://wa.me/51999999999?text=Quiero%20agendar%20una%20demo"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto rounded-full border-2 border-white/40 hover:border-white px-10 py-4 font-medium hover:bg-white/10 flex items-center justify-center gap-2 transition-all"
            >
              <Phone size={18} /> Agendar Demo
            </a>
          </div>
        </div>
      </section>

      {/* === FOOTER === */}
      <footer className="bg-white dark:bg-[#050505] border-t border-gray-100 dark:border-white/5 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-12 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Leaf className="text-violet-500" size={28} />
                <span className="text-2xl font-bold">Korat Flow</span>
              </div>
              <p className="text-gray-500 max-w-xs mb-6">Automatización inteligente para salones de belleza en Latinoamérica.</p>
              <div className="flex gap-3">
                {['facebook', 'instagram', 'tiktok'].map((social) => (
                  <a key={social} href="#" className="h-10 w-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 hover:bg-violet-100 hover:text-violet-500 dark:hover:bg-violet-500/10 transition-colors">
                    <span className="sr-only">{social}</span>
                    <MessageCircle size={18} />
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider mb-4">Producto</h4>
              <ul className="space-y-3 text-gray-500">
                <li><button onClick={() => scrollToSection('beneficios')} className="hover:text-violet-500 transition-colors">Beneficios</button></li>
                <li><button onClick={() => scrollToSection('precios')} className="hover:text-violet-500 transition-colors">Precios</button></li>
                <li><button onClick={() => scrollToSection('faq')} className="hover:text-violet-500 transition-colors">FAQ</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider mb-4">Legal</h4>
              <ul className="space-y-3 text-gray-500">
                <li><a href="#" className="hover:text-violet-500 transition-colors">Términos de Servicio</a></li>
                <li><a href="#" className="hover:text-violet-500 transition-colors">Política de Privacidad</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-gray-100 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400">© {new Date().getFullYear()} Korat Flow. Todos los derechos reservados.</p>
            <p className="text-sm text-gray-400">Hecho con 💜 en Perú para Latinoamérica</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
