
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowRight, Bot, Zap, BarChart3, Eye, Sparkles, Globe,
    MessageCircle, Camera, Shield, CheckCircle2, ChevronRight,
    Leaf, Code2, Cpu, Database, Layers, Lightbulb
} from 'lucide-react';

const WHATSAPP_NUMBER = '51926285289';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hola! Me interesa conocer más sobre los servicios de Korat Flow')}`;

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

const KoratHome: React.FC = () => {
    const visibleSections = useIntersectionObserver();

    const getAnimationClass = (sectionId: string, baseAnimation: string = 'animate-fade-in-up') => {
        return visibleSections.has(sectionId) ? baseAnimation : 'opacity-0';
    };

    return (
        <>
            {/* === HERO SECTION === */}
            <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-12 text-center overflow-hidden">
                {/* Gradient orbs — green tones */}
                <div className="absolute top-1/4 -left-32 h-[500px] w-[500px] rounded-full bg-emerald-500/20 blur-[150px] animate-float" />
                <div className="absolute bottom-1/4 -right-32 h-[400px] w-[400px] rounded-full bg-teal-500/15 blur-[120px] animate-float delay-700" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-lime-500/10 blur-[100px]" />

                <div className="relative z-10 max-w-4xl space-y-8 animate-fade-in-up">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 backdrop-blur-sm px-4 py-2 text-xs font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 shadow-lg animate-fade-in">
                        <Cpu size={14} className="animate-pulse" />
                        Laboratorio de Automatización con Inteligencia Artificial
                    </div>

                    {/* Headline */}
                    <h1 className="text-4xl font-extrabold leading-[1.1] md:text-6xl lg:text-7xl animate-fade-in-up delay-100">
                        Creamos{' '}
                        <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 bg-clip-text text-transparent">automatizaciones inteligentes</span>
                        {' '}para negocios de servicios
                    </h1>

                    {/* Subheadline */}
                    <p className="mx-auto max-w-2xl text-lg md:text-xl text-gray-600 dark:text-gray-300 animate-fade-in-up delay-200">
                        En Korat Flow diseñamos ecosistemas digitales que combinan IA conversacional, visión artificial y automatización para transformar la forma en que operas tu negocio.
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col items-center gap-4 pt-4 sm:flex-row sm:justify-center animate-fade-in-up delay-300">
                        <Link
                            to="/nilah"
                            className="btn-cta-primary w-full sm:w-auto rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-10 py-4 text-base font-bold text-white hover:from-emerald-600 hover:to-emerald-700 shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 flex items-center justify-center gap-2 transition-all hover:scale-105"
                        >
                            <Sparkles size={18} />
                            Conoce Nilah IA
                        </Link>
                        <a
                            href={WHATSAPP_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group w-full sm:w-auto rounded-full border-2 border-gray-200 dark:border-white/20 px-8 py-4 text-base font-medium hover:border-emerald-300 dark:hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/5 flex items-center justify-center gap-2 transition-all"
                        >
                            <MessageCircle size={18} className="text-emerald-500" />
                            Contáctanos
                        </a>
                    </div>

                    {/* Trust line */}
                    <p className="text-sm text-gray-400 dark:text-gray-500 animate-fade-in-up delay-400">
                        🇵🇪 Hecho en Perú · Especialistas en el sector belleza y wellness
                    </p>
                </div>
            </section>

            {/* === QUÉ HACEMOS === */}
            <section id="que-hacemos" data-animate className="py-24 bg-white dark:bg-[#0A140A]">
                <div className={`mx-auto max-w-6xl px-4 ${getAnimationClass('que-hacemos')}`}>
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 mb-4 rounded-full bg-emerald-100 dark:bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                            <Layers size={16} />
                            Nuestras Capacidades
                        </div>
                        <h2 className="text-3xl font-bold md:text-4xl lg:text-5xl">
                            Tecnología que{' '}
                            <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">entiende tu negocio</span>
                        </h2>
                        <p className="mt-4 text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-lg">
                            Combinamos las herramientas más avanzadas de IA para crear soluciones que realmente funcionan.
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {[
                            { icon: Bot, title: 'IA Conversacional', desc: 'Chatbots que entienden contexto, emociones y matices del lenguaje natural', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' },
                            { icon: Eye, title: 'Visión Artificial', desc: 'Análisis de imágenes para cotización automática y reconocimiento visual', color: 'text-teal-500 bg-teal-50 dark:bg-teal-500/10' },
                            { icon: Zap, title: 'Automatización', desc: 'Flujos inteligentes con n8n, APIs y webhooks que trabajan 24/7', color: 'text-green-500 bg-green-50 dark:bg-green-500/10' },
                            { icon: BarChart3, title: 'Business Intelligence', desc: 'Dashboards con métricas en tiempo real y predicciones con IA', color: 'text-lime-600 bg-lime-50 dark:bg-lime-500/10' },
                        ].map((item, i) => (
                            <div
                                key={i}
                                className="group rounded-2xl border border-gray-100 dark:border-white/5 bg-white dark:bg-[#0F1A0F] p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 hover:border-emerald-200 dark:hover:border-emerald-500/30"
                            >
                                <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${item.color} mb-5 transition-colors`}>
                                    <item.icon size={26} />
                                </div>
                                <h3 className="font-bold text-lg mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{item.title}</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* === NUESTROS PRODUCTOS — NILAH IA SPOTLIGHT === */}
            <section id="productos" data-animate className="py-24 bg-gradient-to-b from-[#F0FFF0] to-white dark:from-[#081408] dark:to-[#0A140A]">
                <div className={`mx-auto max-w-6xl px-4 ${getAnimationClass('productos')}`}>
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 mb-4 rounded-full bg-violet-100 dark:bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-600 dark:text-violet-400">
                            <Sparkles size={16} />
                            Nuestros Productos
                        </div>
                        <h2 className="text-3xl font-bold md:text-4xl lg:text-5xl">
                            Soluciones listas para{' '}
                            <span className="bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-transparent">transformar tu negocio</span>
                        </h2>
                    </div>

                    {/* NILAH IA CARD — Hero Product */}
                    <div className="relative max-w-4xl mx-auto">
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-pink-500/20 rounded-3xl blur-3xl" />
                        <div className="relative rounded-3xl border-2 border-violet-500/30 bg-white dark:bg-[#0F0F1A] p-8 md:p-12 shadow-2xl shadow-violet-500/10 overflow-hidden hover:shadow-violet-500/20 transition-all duration-500 group">
                            {/* Gradient decorations */}
                            <div className="absolute top-0 right-0 h-48 w-48 bg-gradient-to-bl from-violet-500/10 to-transparent rounded-bl-full" />
                            <div className="absolute bottom-0 left-0 h-32 w-32 bg-gradient-to-tr from-pink-500/10 to-transparent rounded-tr-full" />

                            <div className="relative flex flex-col lg:flex-row items-center gap-10">
                                {/* Text Content */}
                                <div className="lg:w-3/5 space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                                            <Bot size={28} className="text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl md:text-3xl font-extrabold">Nilah IA</h3>
                                            <p className="text-sm text-violet-500 font-medium">Producto Estrella 🌟</p>
                                        </div>
                                    </div>

                                    <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                                        La recepcionista virtual de WhatsApp que <span className="font-semibold text-violet-600 dark:text-violet-400">nunca duerme</span>.
                                        Diseñada exclusivamente para salones de belleza — atiende clientas, agenda citas, cotiza diseños con IA y rescata clientes inactivos.
                                    </p>

                                    {/* Feature pills */}
                                    <div className="flex flex-wrap gap-3">
                                        {[
                                            { icon: MessageCircle, text: 'WhatsApp 24/7' },
                                            { icon: Camera, text: 'Cotizador Visual' },
                                            { icon: BarChart3, text: 'Dashboard Inteligente' },
                                            { icon: Shield, text: 'Rescate de Clientes' },
                                        ].map((f, i) => (
                                            <span key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-50 dark:bg-violet-500/10 text-sm font-medium text-violet-700 dark:text-violet-300 border border-violet-100 dark:border-violet-500/20">
                                                <f.icon size={14} />
                                                {f.text}
                                            </span>
                                        ))}
                                    </div>

                                    {/* CTAs */}
                                    <div className="flex flex-col sm:flex-row gap-4 pt-2">
                                        <Link
                                            to="/nilah"
                                            className="btn-cta-primary inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-violet-600 px-8 py-3.5 text-base font-bold text-white hover:from-violet-600 hover:to-violet-700 shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 transition-all hover:scale-105"
                                        >
                                            Descubre Nilah IA <ArrowRight size={18} />
                                        </Link>
                                        <Link
                                            to="/nilah/login"
                                            className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-violet-200 dark:border-violet-500/30 px-8 py-3.5 text-base font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/5 transition-all"
                                        >
                                            Iniciar Sesión
                                        </Link>
                                    </div>
                                </div>

                                {/* Visual — WhatsApp mockup */}
                                <div className="lg:w-2/5">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-pink-500 rounded-3xl blur-2xl opacity-20 animate-float" />
                                        <div className="relative rounded-2xl bg-gray-100 dark:bg-[#1A1A2A] p-2.5 shadow-xl border border-gray-200 dark:border-white/10">
                                            <div className="rounded-xl bg-white dark:bg-[#0F0F1A] overflow-hidden shadow-inner">
                                                <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-3 py-2.5 flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                                        <Bot size={14} className="text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-semibold text-sm">Nilah IA</p>
                                                        <p className="text-white/70 text-[10px] flex items-center gap-1">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                                                            En línea
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="p-3 space-y-2 bg-[#ECE5DD] dark:bg-[#0B141A] min-h-[140px]">
                                                    <div className="bg-white dark:bg-[#1F2C34] rounded-lg rounded-tl-none p-2.5 max-w-[85%] shadow-sm">
                                                        <p className="text-xs text-gray-800 dark:text-gray-200">Hola! 💅 Quiero agendar</p>
                                                        <p className="text-[9px] text-gray-400 text-right mt-0.5">10:30</p>
                                                    </div>
                                                    <div className="bg-emerald-100 dark:bg-emerald-900/30 rounded-lg rounded-tr-none p-2.5 max-w-[85%] ml-auto shadow-sm">
                                                        <p className="text-xs text-gray-800 dark:text-gray-200">¡Hola! 😊 Tenemos mañana 3PM o jueves 11AM. ¿Cuál prefieres?</p>
                                                        <p className="text-[9px] text-gray-400 text-right mt-0.5 flex items-center justify-end gap-1">
                                                            10:30
                                                            <CheckCircle2 size={8} className="text-blue-400" />
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Coming Soon — Future products teaser */}
                    <div className="mt-12 text-center">
                        <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 dark:bg-white/5 px-6 py-3 text-sm text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/10">
                            <Lightbulb size={16} className="text-amber-500" />
                            Más productos en desarrollo · <span className="font-medium">Próximamente</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* === POR QUÉ KORAT FLOW === */}
            <section id="por-que" data-animate className="py-24 bg-white dark:bg-[#0A140A]">
                <div className={`mx-auto max-w-6xl px-4 ${getAnimationClass('por-que')}`}>
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold md:text-4xl lg:text-5xl mb-4">
                            ¿Por qué <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">Korat Flow</span>?
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-lg">
                            No somos una agencia genérica. Somos un laboratorio de IA enfocado en resultados medibles.
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        {[
                            {
                                icon: '🎯',
                                title: 'Especialización Vertical',
                                desc: 'Nos enfocamos en negocios de servicios — belleza, wellness, salud. Entendemos tu operación de adentro hacia afuera.',
                            },
                            {
                                icon: '🔧',
                                title: 'Soluciones a Medida',
                                desc: 'Cada automatización se adapta a tu marca, tu estilo de atención y la personalidad de tu negocio.',
                            },
                            {
                                icon: '🤝',
                                title: 'Acompañamiento Real',
                                desc: 'Detrás de la tecnología hay un equipo humano que te acompaña. No te dejamos solo con software.',
                            },
                        ].map((item, i) => (
                            <div key={i} className="rounded-2xl bg-gradient-to-b from-white to-gray-50 dark:from-[#0F1A0F] dark:to-[#0A140A] border border-gray-100 dark:border-white/5 p-8 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group">
                                <span className="text-4xl mb-5 block group-hover:scale-110 transition-transform">{item.icon}</span>
                                <h3 className="font-bold text-xl mb-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{item.title}</h3>
                                <p className="text-gray-500 dark:text-gray-400">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* === TECH STACK BANNER === */}
            <section className="py-16 bg-gradient-to-r from-[#0A1F0A] to-[#0F2F0F] dark:from-[#050D05] dark:to-[#0A1A0A] border-y border-emerald-900/30">
                <div className="mx-auto max-w-4xl px-4 text-center">
                    <p className="text-emerald-400/60 text-sm font-medium uppercase tracking-widest mb-6">Stack Tecnológico</p>
                    <div className="flex flex-wrap justify-center gap-6 text-emerald-100/40">
                        {['Google Gemini', 'n8n', 'Supabase', 'WhatsApp API', 'React', 'Vite'].map((tech, i) => (
                            <span key={i} className="px-5 py-2.5 rounded-full border border-emerald-800/30 bg-emerald-900/20 text-sm font-medium hover:text-emerald-300 hover:border-emerald-700/50 transition-colors cursor-default">
                                {tech}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* === CTA FINAL === */}
            <section className="py-24 bg-gradient-to-br from-emerald-600 via-teal-600 to-green-600 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
                <div className="mx-auto max-w-3xl px-4 text-center text-white relative">
                    <h2 className="text-3xl font-bold mb-4 md:text-4xl lg:text-5xl">¿Listo para automatizar tu negocio?</h2>
                    <p className="text-white/80 mb-10 text-lg">
                        Cuéntanos sobre tu negocio y diseñamos una solución a tu medida. Sin compromisos, sin complicaciones.
                    </p>
                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                        <a
                            href={WHATSAPP_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto rounded-full bg-white px-10 py-4 font-bold text-emerald-700 hover:bg-gray-100 shadow-2xl flex items-center justify-center gap-2 transition-all hover:scale-105"
                        >
                            💬 Hablemos por WhatsApp
                        </a>
                        <Link
                            to="/nilah"
                            className="w-full sm:w-auto rounded-full border-2 border-white/40 hover:border-white px-10 py-4 font-medium hover:bg-white/10 flex items-center justify-center gap-2 transition-all"
                        >
                            Conoce Nilah IA <ChevronRight size={18} />
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
};

export default KoratHome;
