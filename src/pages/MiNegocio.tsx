import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, MessageCircle, Activity, Calendar, LineChart, Bot, Coins, Sparkles, Utensils } from 'lucide-react';

/* ─── Constantes ─────────────────────────────────────────── */
const WA_URL = `https://wa.me/51926285289?text=${encodeURIComponent('Hola, me gustaría agendar un diagnóstico gratuito de 30 min para mi negocio')}`;

/* ─── Hook reveal ─────────────────────────────────────────── */
function useReveal() {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
            { threshold: 0.1 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return { ref, visible };
}

/* ─── Reveal helper ───────────────────────────────────────── */
const Reveal: React.FC<{ children: React.ReactNode; className?: string; delay?: number }> = ({
    children, className = '', delay = 0,
}) => {
    const { ref, visible } = useReveal();
    return (
        <div
            ref={ref}
            className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'} ${className}`}
            style={{ transitionDelay: `${delay}ms`, willChange: 'transform, opacity' }}
        >
            {children}
        </div>
    );
};

/* ─── Componente ──────────────────────────────────────────── */
const MiNegocio: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        document.title = 'Korat Flow | Tu negocio en Piloto Automático 🚀';
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="bg-white dark:bg-[#060E06] text-gray-900 dark:text-white overflow-x-hidden min-h-[100dvh] transition-colors duration-300">

            {/* ════════════════════════
                HERO — Centered & Clean
            ════════════════════════ */}
            <section className="relative flex flex-col items-center justify-center text-center px-5 pt-32 pb-12 overflow-hidden bg-white dark:bg-[#060E06]">
                
                {/* Glows — reduced for mobile GPU */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
                    <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] opacity-30 dark:opacity-15 bg-gradient-to-br from-teal-200/50 to-emerald-100/40 dark:from-teal-900/20 dark:to-emerald-900/20 blur-[80px] rounded-full" />
                    <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] opacity-30 dark:opacity-15 bg-gradient-to-bl from-emerald-200/50 to-teal-100/40 dark:from-emerald-900/20 dark:to-teal-900/20 blur-[80px] rounded-full" />
                </div>

                <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
                    {/* badge */}
                    <Reveal>
                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 dark:border-emerald-500/20 bg-white/60 backdrop-blur-md dark:bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-8 shadow-sm">
                            <Coins size={14} className="text-emerald-500" />
                            Recuperamos el dinero que tu negocio pierde en silencio cada mes.
                        </div>
                    </Reveal>

                    {/* headline */}
                    <Reveal delay={100}>
                        <h1 className="text-[2.75rem] sm:text-[4.5rem] leading-[1.05] font-extrabold text-[#0B1221] dark:text-white tracking-tight mb-6">
                            ¿Tus clientes llegan, les encanta lo que haces... <br />
                            <span className="bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                                y después desaparecen?
                            </span>
                        </h1>
                    </Reveal>

                    {/* sub */}
                    <Reveal delay={200}>
                        <div className="text-[1.1rem] sm:text-[1.25rem] text-[#475569] dark:text-gray-400 leading-relaxed max-w-2xl mb-10 mx-auto space-y-4">
                            <p>No es que te olvidaron. <br className="hidden sm:block" /> Es que nadie los invitó a volver.</p>
                            <p>Y cada día que pasa sin ese sistema, <strong className="font-bold text-[#0B1221] dark:text-white">hay dinero real que se queda dormido</strong> en tu lista de WhatsApp.</p>
                        </div>
                    </Reveal>

                    {/* actions */}
                    <Reveal delay={300} className="w-full sm:w-auto">
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
                            <a 
                                href={WA_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 w-full sm:w-auto rounded-full bg-[#00A878] hover:bg-[#008f66] text-white px-8 py-3.5 font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                            >
                                <MessageCircle size={18} />
                                Quiero que me ayudes con eso
                            </a>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* ════════════════════════
                PARA TI SI…
            ════════════════════════ */}
            <section className="border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-[#0A140A] px-5 py-14">
                <div className="max-w-lg mx-auto">
                    <Reveal>
                        <h2 className="text-[1.4rem] font-extrabold mb-7 text-emerald-600 dark:text-emerald-400">Esto es para ti si...</h2>
                        <ul className="space-y-5">
                            {[
                                'Tienes una lista de WhatsApp llena de contactos que no te generan ni un peso al mes.',
                                'Hay meses buenos y meses malos y no sabes exactamente por qué cambia.',
                                'Pasas horas respondiendo mensajes, agendando citas y recordándole a la gente sus citas.',
                                'Sabes que podrías atender más clientes, pero el día no te alcanza.',
                                'Quieres crecer, pero no quieres contratar más gente para lograrlo.',
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <span className="mt-0.5 h-5 w-5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 dark:border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                                        <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">✓</span>
                                    </span>
                                    <span className="text-[0.95rem] text-gray-600 dark:text-gray-300 leading-relaxed">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </Reveal>
                </div>
            </section>

            {/* ════════════════════════
                PARA NEGOCIOS COMO EL TUYO + BANNER DE OTRO NEGOCIO (POS)
            ════════════════════════ */}
            <section className="border-t border-gray-100 dark:border-white/5 px-5 py-14">
                <div className="max-w-lg mx-auto">
                    <Reveal>
                        <h2 className="text-[1.4rem] font-extrabold mb-2 text-gray-900 dark:text-white">Para negocios como el tuyo</h2>
                        <p className="text-[0.9rem] text-gray-500 dark:text-gray-500 mb-6">Si tu negocio vive de citas, clientes que regresan y WhatsApp — tenemos algo para ti.</p>
                        <div className="flex flex-wrap gap-2">
                            {[
                                'Spas · Estéticas', 'Barberías', 'Clínicas', 'Consultorios',
                                'Yoga · Pilates', 'Nutrición', 'Veterinarias', 'Odontología',
                            ].map((item, i) => (
                                <span key={i} className="rounded-full border border-emerald-500/20 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                    {item}
                                </span>
                            ))}
                        </div>
                    </Reveal>

                    {/* CARD DESTACADA: OTROS NEGOCIOS / POS EXPRESS */}
                    <Reveal delay={150}>
                        <div className="mt-8 p-5 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/30 dark:via-amber-950/10 dark:to-transparent flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
                            <div className="flex items-center gap-3.5 text-left w-full sm:w-auto">
                                <span className="text-3xl shrink-0 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500">🍕</span>
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                                        Restaurantes, Cafés & Comercios
                                    </span>
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mt-1">¿Vienes de gastronomía o retail?</h4>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">Prueba nuestro sistema POS Express gratuito para comandas, carta QR, stock y caja rápida.</p>
                                </div>
                            </div>
                            <Link
                                to="/pos/login"
                                className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all active:scale-95 text-center"
                            >
                                <span>⚡ Empieza gratis si vienes de otro negocio</span>
                                <ArrowRight size={14} />
                            </Link>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* ════════════════════════
                QUÉ CONSTRUIMOS
            ════════════════════════ */}
            <section className="border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-[#0A140A] px-5 py-16">
                <div className="max-w-lg mx-auto">
                    <Reveal>
                        <h2 className="text-[1.5rem] font-extrabold mb-2 text-gray-900 dark:text-white">¿Qué construimos juntos?</h2>
                        <p className="text-[1rem] text-gray-500 dark:text-gray-400 mb-10 leading-relaxed">
                            Nada genérico. Nada de plantillas.<br />
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">El sistema exacto que tu negocio necesita.</span>
                        </p>
                    </Reveal>
                    
                    <div className="space-y-4">
                        {[
                            {
                                icon: MessageCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10',
                                title: '📲 Tu WhatsApp convertido en tu mejor vendedor',
                                desc: 'Un asistente que responde, agenda, recuerda y reactiva clientes — con tu nombre, tu tono y tus reglas. No suena a robot. Suena a ti.',
                            },
                            {
                                icon: Activity, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-500/10',
                                title: '😴 El sistema que despierta clientes dormidos',
                                desc: 'Sabe exactamente quién dejó de venir y les escribe en el momento exacto, con el mensaje exacto. Sin spam. Sin presión. Sin que tú lo pidas.',
                            },
                            {
                                icon: Calendar, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10',
                                title: '📅 Menos citas fantasma. Más confirmaciones.',
                                desc: 'Nilah sabe cuándo escribirle. Tú solo ves la cita confirmada.',
                            },
                            {
                                icon: LineChart, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-500/10',
                                title: '📊 Por fin sabes qué está pasando en tu negocio',
                                desc: 'Cuánto estás recuperando, quiénes son tus clientes más valiosos y cómo viene el mes antes de que llegue. No más adivinar. Solo números reales.',
                            },
                        ].map((item, i) => (
                            <Reveal key={i} delay={i * 60}>
                                <div className="rounded-[22px] border border-gray-100 dark:border-white/5 bg-white dark:bg-white/[0.03] p-6 flex gap-4 shadow-sm dark:shadow-none hover:border-emerald-500/20 transition-all">
                                    <div className={`flex-shrink-0 h-10 w-10 rounded-2xl ${item.bg} flex items-center justify-center`}>
                                        <item.icon size={18} className={item.color} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[1rem] text-gray-900 dark:text-white mb-1.5">{item.title}</h3>
                                        <p className="text-[0.9rem] text-gray-600 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ════════════════════════
                CÓMO TRABAJAMOS
            ════════════════════════ */}
            <section className="border-t border-gray-100 dark:border-white/5 px-5 py-14">
                <div className="max-w-lg mx-auto">
                    <Reveal>
                        <h2 className="text-[1.4rem] font-extrabold mb-8 text-emerald-600 dark:text-emerald-400">Cómo trabajamos</h2>
                    </Reveal>
                    <div className="relative space-y-0">
                        {/* línea vertical */}
                        <div className="absolute left-[19px] top-3 bottom-3 w-px bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-500/30 dark:via-teal-500/20 dark:to-transparent pointer-events-none" />

                        {[
                            {
                                n: '1', title: 'Diagnóstico gratuito — 30 minutos',
                                desc: 'Hablamos de tu negocio. Te decimos exactamente cuánto dinero estás dejando ir cada mes y si podemos ayudarte.',
                                note: 'Sin compromiso. Sin venta agresiva.',
                            },
                            {
                                n: '2', title: 'Tu sistema diseñado en 48 horas',
                                desc: 'Una propuesta hecha para ti. Precio claro. Fecha de entrega clara.',
                                note: 'Sin sorpresas.',
                            },
                            {
                                n: '3', title: 'Lo lanzamos juntos',
                                desc: 'Lo construimos, lo probamos contigo, y lo dejamos corriendo. Tú lo apruebas antes de salir en vivo.',
                                note: '',
                            },
                        ].map((step, i) => (
                            <Reveal key={i} delay={i * 80} className="flex gap-4 pb-8">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-emerald-50 dark:bg-[#0A1A0A] border border-emerald-500/20 dark:border-emerald-500/30 flex items-center justify-center z-10 shadow-sm dark:shadow-none">
                                    <span className="text-emerald-600 dark:text-emerald-400 text-sm font-black">{step.n}</span>
                                </div>
                                <div className="pt-1.5">
                                    <h3 className="font-bold text-[0.96rem] text-gray-900 dark:text-white mb-1.5">{step.title}</h3>
                                    <p className="text-[0.87rem] text-gray-600 dark:text-gray-400 leading-relaxed">{step.desc}</p>
                                    {step.note && <p className="mt-1.5 text-[0.85rem] text-emerald-600 dark:text-emerald-400 font-medium">{step.note}</p>}
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ════════════════════════
                FOUNDER NOTE
            ════════════════════════ */}
            <section className="border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-[#0A140A] px-5 py-16">
                <div className="max-w-lg mx-auto">
                    <Reveal>
                        <div className="rounded-[24px] border border-gray-200 dark:border-white/8 bg-white dark:bg-white/[0.02] p-8 shadow-sm dark:shadow-none">
                            <h2 className="text-[1.3rem] font-extrabold text-gray-900 dark:text-white mb-6">Una última cosa antes de irte.</h2>
                            
                            <div className="text-[1rem] text-gray-700 dark:text-gray-300 leading-relaxed space-y-5 mb-8">
                                <p>No nacimos en una oficina estudiando tecnología. <br />
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm uppercase tracking-wide">Nacimos adentro de un negocio real.</span></p>
                                
                                <p>Estuvimos ahí. Viendo los martes flojos. Viendo las clientas que amaban el servicio y simplemente no volvieron. Vi el WhatsApp lleno de nombres que nadie movía. Y la pregunta siempre fue la misma:</p>
                                
                                <p className="text-[1.15rem] font-bold text-gray-900 dark:text-white italic">"¿Por qué nadie les escribió primero?"</p>
                                
                                <p><strong className="text-emerald-600 dark:text-emerald-400">Korat Flow</strong> nació de esa pregunta. No de una oficina. No de un curso. De adentro.</p>
                                
                                <p>Si tu negocio vive eso hoy, hablemos. El primer paso no te cuesta nada.</p>
                            </div>
                            
                            <p className="text-sm font-bold text-gray-900 dark:text-white">— Martín, Korat Flow</p>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* ════════════════════════
                CTA FINAL
            ════════════════════════ */}
            <section className="border-t border-gray-100 dark:border-white/5 px-5 py-14">
                <div className="max-w-lg mx-auto text-center flex flex-col items-center">
                    <Reveal>
                        <h2 className="text-[1.55rem] font-extrabold mb-2">¿Empezamos?</h2>
                        <p className="text-[0.9rem] text-gray-600 dark:text-gray-400 mb-8">
                            El diagnóstico es gratis y dura 30 minutos.<br />
                            Si no podemos ayudarte, te lo decimos directo.
                        </p>
                        <a
                            href={WA_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full rounded-full bg-emerald-500 py-4 text-[0.96rem] font-bold text-white shadow-[0_0_40px_rgba(16,185,129,0.2)] active:bg-emerald-600 active:scale-[0.98] transition-all"
                        >
                            <MessageCircle size={18} />
                            Agendar mi diagnóstico gratuito
                        </a>

                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5 w-full flex justify-center">
                            <Link
                                to="/pos/login"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-amber-500 transition-colors"
                            >
                                <span>¿Tienes un restaurante, cafetería o tienda? Prueba Korat POS Express gratis</span>
                                <ArrowRight size={13} />
                            </Link>
                        </div>
                    </Reveal>
                </div>
            </section>

        </div>
    );
};

export default MiNegocio;
