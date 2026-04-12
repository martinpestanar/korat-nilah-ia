import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bot, Shield, BarChart3, MessageCircle, Lightbulb } from 'lucide-react';
import { MorphingBlob, NilahWhatsAppActivoDormido } from '../components/UI/AnimatedSVGs';

/* ─── Constantes ──────────────────────────────────────────── */
const WHATSAPP_NUMBER = '51926285289';
const WA_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hola, quiero saber más sobre cómo pueden ayudar a mi negocio')}`;

/* ─── Hook de reveal al hacer scroll ─────────────────────── */
function useReveal() {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
            { threshold: 0.12 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return { ref, visible };
}

/* ─── Sección animada helper ──────────────────────────────── */
const Reveal: React.FC<{ children: React.ReactNode; className?: string; delay?: number }> = ({
    children, className = '', delay = 0
}) => {
    const { ref, visible } = useReveal();
    return (
        <div
            ref={ref}
            className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
};





/* ─── Componente principal ────────────────────────────────── */
const KoratHome: React.FC = () => {
    useEffect(() => {
        document.title = 'Korat Flow | Automatizamos tu negocio';
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="bg-white dark:bg-[#060E06] text-gray-900 dark:text-white overflow-x-hidden min-h-screen transition-colors duration-300">

            {/* ════════════════════════════════
                HERO — Centered & Clean
            ════════════════════════════════ */}
            <section className="relative flex flex-col items-center justify-center text-center px-5 pt-32 pb-12 overflow-hidden bg-white dark:bg-[#060E06]">
                
                {/* Glows abstractos en el fondo */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    {/* Left glow */}
                    <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/3 w-[800px] h-[800px] opacity-40 dark:opacity-20 bg-gradient-to-br from-teal-100/60 to-emerald-50/50 dark:from-teal-900/30 dark:to-emerald-900/30 blur-[100px] rounded-full" />
                    {/* Right glow */}
                    <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/3 w-[700px] h-[700px] opacity-40 dark:opacity-20 bg-gradient-to-bl from-emerald-100/60 to-teal-50/50 dark:from-emerald-900/30 dark:to-teal-900/30 blur-[100px] rounded-full" />
                    {/* Top center soft glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] opacity-30 dark:opacity-10 bg-emerald-100/40 dark:bg-emerald-800/30 blur-[120px] rounded-full" />
                </div>

                <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
                    {/* badge */}
                    <Reveal>
                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 dark:border-emerald-500/20 bg-white/60 backdrop-blur-md dark:bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-8 shadow-sm">
                            <Bot size={14} className="text-emerald-500" />
                            Agencia de IA para negocios de servicios
                        </div>
                    </Reveal>

                    {/* headline */}
                    <Reveal delay={100}>
                        <h1 className="text-[2.75rem] sm:text-[4.5rem] leading-[1.05] font-extrabold text-[#0B1221] dark:text-white tracking-tight mb-6">
                            Tu mejor canal de ventas <br />
                            <span className="bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                                ya lo tienes
                            </span> en el bolsillo.
                        </h1>
                    </Reveal>

                    <Reveal delay={200}>
                        <p className="text-[1.1rem] sm:text-[1.3rem] text-[#475569] dark:text-gray-400 leading-relaxed max-w-2xl mx-auto">
                            Esos contactos de WhatsApp que no te escriben <strong className="font-semibold text-[#0B1221] dark:text-gray-200">no te olvidaron.</strong> Solo nadie los movió primero.
                        </p>
                    </Reveal>
                </div>
            </section>

            {/* ════════════════════════════════
                DOS CAMINOS — el bifurcador
            ════════════════════════════════ */}
            <section className="relative z-10 px-5 pb-16 max-w-2xl mx-auto">
                <p className="text-xs font-semibold tracking-widest text-gray-400 dark:text-gray-500 uppercase mb-4 text-center animate-fade-in-up" style={{ animationDelay: '140ms' }}>
                    ¿Cuál describe tu negocio?
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                    {/* Card 1 · Salón */}
                    <Link
                        to="/nilah"
                        className="group relative flex flex-col justify-between rounded-[20px] bg-violet-50 dark:bg-violet-600/15 border border-violet-100 dark:border-violet-500/20 p-5 min-h-[168px] overflow-hidden transition-all duration-200 active:scale-[0.97] hover:border-violet-400/40 hover:shadow-[0_0_40px_rgba(139,92,246,0.12)]"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative">
                            <span className="text-3xl leading-none">💇‍♀️</span>
                            <h3 className="mt-3 text-[1.05rem] font-bold text-gray-900 dark:text-white leading-snug">
                                Tengo un salón de belleza
                            </h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Nail salon, Lashistas, Estéticas, etc.
                            </p>
                        </div>
                        <div className="relative flex items-center gap-1.5 mt-4 text-violet-600 dark:text-violet-400 text-sm font-semibold group-hover:gap-2.5 transition-all">
                            <span>Ver Nilah IA</span>
                            <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                        </div>
                    </Link>

                    {/* Card 2 · Otro negocio */}
                    <Link
                        to="/custom"
                        className="group relative flex flex-col justify-between rounded-[20px] bg-emerald-50 dark:bg-emerald-600/15 border border-emerald-100 dark:border-emerald-500/20 p-5 min-h-[168px] overflow-hidden transition-all duration-200 active:scale-[0.97] hover:border-emerald-400/40 hover:shadow-[0_0_40px_rgba(16,185,129,0.12)]"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative">
                            <span className="text-3xl leading-none">🚀</span>
                            <h3 className="mt-3 text-[1.05rem] font-bold text-gray-900 dark:text-white leading-snug">
                                Tengo otro tipo de negocio
                            </h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Clínica, gym, barbería, vet…
                            </p>
                        </div>
                        <div className="relative flex items-center gap-1.5 mt-4 text-emerald-600 dark:text-emerald-400 text-sm font-semibold group-hover:gap-2.5 transition-all">
                            <span>Quiero algo personalizado</span>
                            <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                        </div>
                    </Link>
                </div>
            </section>

            {/* ════════════════════════════════
                QUIÉNES SOMOS
            ════════════════════════════════ */}
            <section className="border-y border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-[#0A140A] px-5 py-16">
                <div className="max-w-2xl mx-auto">
                    <Reveal>
                        <p className="text-xs font-semibold tracking-widest text-emerald-600 dark:text-emerald-500 uppercase mb-4">Nuestra historia</p>
                        <h2 className="text-[1.65rem] font-extrabold leading-[1.2] mb-6 text-gray-900 dark:text-white">
                            No nacimos en una oficina estudiando tecnología.<br />
                            <span className="text-emerald-600 dark:text-emerald-400">Nacimos adentro de un negocio real.</span>
                        </h2>
                        <div className="space-y-5 text-[1rem] text-gray-600 dark:text-gray-400 leading-relaxed">
                            <p>
                                Korat Flow nació de una experiencia muy cercana.
                            </p>
                            <p>
                                Estuvimos dentro de un salón de belleza — viendo de adentro cómo funciona, cómo se siente, 
                                y sobre todo, <strong className="text-gray-900 dark:text-white">cómo duele cuando los clientes dejan de venir sin decir nada.</strong>
                            </p>
                            <p>
                                No desde afuera. No desde un libro. <br />
                                Desde adentro, gestionando citas, respondiendo WhatsApp, preguntándonos por qué esa clienta que amaba el servicio simplemente no volvió.
                            </p>
                            <p className="text-[1.1rem] font-bold text-gray-900 dark:text-white">
                                La respuesta siempre fue la misma: nadie le escribió primero.
                            </p>
                            <p className="text-emerald-600 dark:text-emerald-400 font-semibold italic">
                                Eso lo cambió todo. Por eso construimos Korat Flow.
                            </p>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* ════════════════════════════════
                NILAH IA — tarjeta producto
            ════════════════════════════════ */}
            <section className="px-5 py-16 bg-white dark:bg-[#060E06]">
                <div className="max-w-2xl mx-auto">
                    <Reveal>
                        <p className="text-xs font-semibold tracking-widest text-gray-400 dark:text-gray-500 uppercase mb-4">Lo que hacemos</p>
                        <h2 className="text-[1.55rem] font-extrabold leading-tight mb-8">
                            Soluciones que ya están{' '}
                            <span className="text-violet-600 dark:text-violet-400">funcionando.</span>
                        </h2>
                    </Reveal>

                    {/* Nilah card */}
                    <Reveal delay={80}>
                        <div className="relative rounded-[24px] border border-violet-100 dark:border-violet-500/25 bg-white dark:bg-gradient-to-br dark:from-[#110D1F] dark:to-[#0A0A16] overflow-hidden p-6 mb-4 shadow-xl shadow-violet-500/5 dark:shadow-[0_0_60px_rgba(139,92,246,0.08)]">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-violet-500/5 dark:from-violet-500/10 to-transparent rounded-bl-full pointer-events-none" />

                            <div className="flex items-center gap-3 mb-5">
                                <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/20">
                                    <Bot size={22} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-extrabold">💇‍♀️ Nilah IA</h3>
                                    <p className="text-xs text-violet-600 dark:text-violet-400 font-medium">Para salones de belleza</p>
                                </div>
                            </div>

                            <p className="text-[0.95rem] text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                                El sistema que despierta a tus clientas dormidas, reduce las citas fantasma y Nilah escribe por ti, en el momento exacto, antes de que ella lo olvide.
                            </p>
                            <p className="text-sm font-bold text-violet-600 dark:text-violet-400 mb-5">
                                Más de 1,000 contactos de WhatsApp trabajando para ti cada mes.
                            </p>

                            {/* pills */}
                            <div className="flex flex-wrap gap-2 mb-6">
                                {[
                                    { icon: MessageCircle, text: 'Activa clientas dormidas' },
                                    { icon: Shield, text: 'Filtra no-shows' },
                                    { icon: BarChart3, text: 'Campañas por audiencia' },
                                ].map((f, i) => (
                                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-50 dark:bg-violet-500/10 text-xs font-medium text-violet-700 dark:text-violet-300 border border-violet-100 dark:border-violet-500/20">
                                        <f.icon size={11} />
                                        {f.text}
                                    </span>
                                ))}
                            </div>

                            {/* Mockup visual */}
                            <div className="rounded-2xl overflow-hidden bg-gray-50 dark:bg-black/20 flex items-center justify-center mb-6 -mx-2">
                                <NilahWhatsAppActivoDormido className="w-full max-w-xs" />
                            </div>

                            <Link
                                to="/nilah"
                                className="flex items-center justify-center gap-2 w-full rounded-full bg-gradient-to-r from-violet-500 to-violet-600 py-3.5 text-[0.95rem] font-bold text-white shadow-lg shadow-violet-500/20 active:scale-[0.98] transition-all"
                            >
                                Conocer Nilah IA <ArrowRight size={16} />
                            </Link>
                        </div>
                    </Reveal>

                    {/* Korat Custom card */}
                    <Reveal delay={140}>
                        <div className="relative rounded-[24px] border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/30 dark:bg-gradient-to-br dark:from-[#081408] dark:to-[#060E06] overflow-hidden p-6 shadow-lg shadow-emerald-500/5 dark:shadow-[0_0_60px_rgba(16,185,129,0.05)]">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-500/5 dark:from-emerald-500/8 to-transparent rounded-bl-full pointer-events-none" />
                            <h3 className="text-lg font-extrabold mb-1">🛠️ Korat Custom</h3>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-4">Para tu negocio</p>
                            <p className="text-[0.95rem] text-gray-600 dark:text-gray-400 leading-relaxed mb-5">
                                ¿No eres salón pero tienes el mismo problema? Lo construimos desde cero para tu negocio.
                            </p>
                            <Link
                                to="/custom"
                                className="flex items-center justify-center gap-2 w-full rounded-full border border-emerald-500/30 dark:border-emerald-500/40 text-emerald-600 dark:text-emerald-400 py-3.5 text-[0.95rem] font-bold active:scale-[0.98] transition-all hover:bg-emerald-500/5"
                            >
                                Hablemos <ArrowRight size={16} />
                            </Link>
                        </div>
                    </Reveal>

                    <Reveal delay={180}>
                        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-600 font-medium">
                            <Lightbulb size={13} className="text-amber-500/70 dark:text-amber-500/60" />
                            Más productos en desarrollo · <span className="opacity-60">Próximamente</span>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* ════════════════════════════════
                EL ENEMIGO ES EL SILENCIO
            ════════════════════════════════ */}
            <section className="border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-[#0A140A] px-5 py-16">
                <div className="max-w-2xl mx-auto">
                    <Reveal>
                        <h2 className="text-[1.55rem] font-extrabold leading-tight mb-6">
                            El sistema que ya quisiera tener{' '}
                            <span className="text-emerald-600 dark:text-emerald-400">cuando era dueño de salón.</span>
                        </h2>
                        <div className="space-y-4 text-[0.96rem] text-gray-600 dark:text-gray-400 leading-relaxed">
                            <p>Cuando tienes un negocio de servicios, el mayor enemigo no es la competencia. <strong className="text-gray-900 dark:text-white font-bold">Es el silencio.</strong></p>
                            <p>El cliente que no volvió. La cita que no confirmó. El WhatsApp lleno de contactos que nunca se convirtieron en reservas.</p>
                            <p className="text-emerald-600 dark:text-emerald-400 font-semibold">Korat Flow existe para que eso no vuelva a pasar.</p>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* ════════════════════════════════
                CTA FINAL
            ════════════════════════════════ */}
            <section className="bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-900/40 dark:to-[#060E06] px-5 py-16">
                <div className="max-w-2xl mx-auto">
                    <Reveal>
                        <h2 className="text-[1.55rem] font-extrabold leading-tight mb-4 text-center">
                            ¿Listo para dejar de perder clientes en silencio?
                        </h2>
                        <p className="text-center text-[0.9rem] text-gray-500 dark:text-gray-400 mb-8">
                            Elige el camino que más se acerca a tu negocio.
                        </p>
                        <div className="flex flex-col gap-3">
                            <Link
                                to="/nilah"
                                className="flex items-center justify-center gap-2 w-full rounded-full bg-gray-900 dark:bg-white py-4 text-[0.95rem] font-bold text-white dark:text-[#0A0A0A] active:scale-[0.98] transition-all shadow-xl shadow-gray-900/10 dark:shadow-white/5"
                            >
                                Ver Nilah IA — para salones
                            </Link>
                            <Link
                                to="/custom"
                                className="flex items-center justify-center gap-2 w-full rounded-full border border-gray-200 dark:border-white/20 py-4 text-[0.95rem] font-medium text-gray-600 dark:text-white active:bg-gray-50 dark:active:bg-white/5 transition-all text-center"
                            >
                                Quiero algo personalizado
                            </Link>
                        </div>
                    </Reveal>
                </div>
            </section>

        </div>
    );
};

export default KoratHome;
