
import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, Calendar, Clock, CheckCircle2, ArrowRight, MessageCircle, Sparkles, Play, Phone } from 'lucide-react';

const WHATSAPP_NUMBER = '51926285289';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hola! Quiero agendar una demo de Nilah IA para mi salón')}`;

const NilahDemo: React.FC = () => {
    return (
        <div className="h-[100dvh] overflow-y-auto overflow-x-hidden bg-gradient-to-b from-white via-violet-50/20 to-white dark:from-[#0A0A0A] dark:via-[#0F0F0F] dark:to-[#0A0A0A] font-sans">
            {/* Hero */}
            <section className="pt-32 pb-16 px-4 text-center">
                <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
                    <Link to="/" className="inline-flex items-center gap-2 text-sm text-violet-500 hover:text-violet-600 mb-4 transition-colors">
                        ← Volver a Korat Flow
                    </Link>
                    <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 backdrop-blur-sm px-4 py-2 text-sm font-medium text-violet-600 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-400 shadow-lg">
                        <Play size={14} />
                        Demo Personalizada
                    </div>
                    <h1 className="text-4xl font-extrabold md:text-5xl lg:text-6xl">
                        Descubre lo que Nilah IA{' '}
                        <span className="bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-transparent">puede hacer por tu salón</span>
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
                        En 15 minutos te mostramos cómo Nilah IA automatiza la atención de tu salón. Sin compromiso, totalmente gratis.
                    </p>
                </div>
            </section>

            {/* Demo Info */}
            <section className="py-16 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="grid gap-8 md:grid-cols-2">
                        {/* What to expect */}
                        <div className="rounded-3xl bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/5 p-8 shadow-lg">
                            <h2 className="text-2xl font-bold mb-6">¿Qué incluye el demo?</h2>
                            <div className="space-y-5">
                                {[
                                    { icon: Bot, text: 'Demo en vivo del chatbot de WhatsApp atendiendo una conversación real' },
                                    { icon: Calendar, text: 'Cómo Nilah agenda citas sin errores en tu calendario' },
                                    { icon: Sparkles, text: 'El cotizador visual de nail art en acción' },
                                    { icon: MessageCircle, text: 'Cómo el sistema rescata clientas que dejaron de venir' },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-start gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center shrink-0">
                                            <item.icon size={20} className="text-violet-500" />
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-300 pt-2">{item.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* CTA Card */}
                        <div className="rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 p-8 text-white shadow-2xl shadow-violet-500/20 flex flex-col justify-between">
                            <div className="space-y-6">
                                <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                    <Calendar size={28} className="text-white" />
                                </div>
                                <h2 className="text-2xl font-bold">Agenda tu Demo</h2>
                                <p className="text-white/80 text-lg">
                                    Escríbenos por WhatsApp y coordinamos una sesión personalizada en menos de 24 horas.
                                </p>
                                <div className="space-y-3">
                                    {[
                                        { icon: Clock, text: 'Duración: 15 minutos' },
                                        { icon: CheckCircle2, text: 'Sin compromiso' },
                                        { icon: Phone, text: '+51 926 285 289' },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-3 text-white/90">
                                            <item.icon size={16} />
                                            <span>{item.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <a
                                href={WHATSAPP_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-8 block w-full text-center rounded-xl bg-white py-4 font-bold text-violet-600 hover:bg-gray-100 shadow-lg transition-all hover:scale-[1.02]"
                            >
                                💬 Agendar Demo por WhatsApp
                            </a>
                        </div>
                    </div>

                    {/* Expectation chips */}
                    <div className="mt-12 flex flex-wrap justify-center gap-4">
                        {['Demo personalizado', 'Sin tarjeta de crédito', 'Configuramos todo por ti', 'Garantía 30 días'].map((item, i) => (
                            <span key={i} className="flex items-center gap-2 bg-white dark:bg-[#141414] px-5 py-3 rounded-full shadow-sm border border-gray-100 dark:border-white/5 text-sm">
                                <CheckCircle2 size={16} className="text-emerald-500" />
                                {item}
                            </span>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default NilahDemo;
