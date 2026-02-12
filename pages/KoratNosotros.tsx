
import React from 'react';
import {
    Bot, Camera, Zap, BarChart3, Heart, Code2,
    ArrowRight, CheckCircle2, Sparkles, Globe,
    MessageCircle, Leaf, Quote
} from 'lucide-react';
import { Link } from 'react-router-dom';

const WHATSAPP_URL = `https://wa.me/51926285289?text=${encodeURIComponent('Hola! Me interesa conocer más sobre Korat Flow')}`;

const KoratNosotros: React.FC = () => {
    return (
        <>
            {/* === HERO === */}
            <section className="relative pt-32 pb-24 px-4 text-center overflow-hidden">
                <div className="absolute top-1/3 -left-32 h-[400px] w-[400px] rounded-full bg-emerald-500/15 blur-[120px]" />
                <div className="absolute bottom-1/3 -right-32 h-[300px] w-[300px] rounded-full bg-teal-500/10 blur-[100px]" />

                <div className="relative z-10 max-w-3xl mx-auto space-y-6 animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                        <Heart size={16} />
                        Nuestra Historia
                    </div>
                    <h1 className="text-4xl font-extrabold md:text-5xl lg:text-6xl">
                        Tecnología con{' '}
                        <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">propósito humano</span>
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        En Korat Flow creemos que la automatización inteligente debería empoderar a emprendedores, no reemplazarlos. Creamos herramientas que liberan tu tiempo para que te enfoques en lo que realmente importa.
                    </p>
                </div>
            </section>

            {/* === THE PROBLEM WE SAW === */}
            <section className="py-24 bg-white dark:bg-[#0A140A]">
                <div className="mx-auto max-w-4xl px-4">
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-500/5 dark:to-teal-500/5 border border-emerald-100 dark:border-emerald-500/20 rounded-3xl p-8 md:p-12 text-center animate-fade-in-up">
                        <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 leading-relaxed">
                            <span className="font-bold text-emerald-700 dark:text-emerald-400">Vimos cómo emprendedores talentosos pasaban entre 2 y 3 horas diarias</span> en tareas administrativas.
                            Cómo dueños de salones se convertían en esclavos de su recepción y perdían
                            <span className="font-bold"> hasta el 50% de sus clientes</span> por falta de seguimiento.
                        </p>
                        <p className="mt-6 text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                            Decidimos cambiar eso. 💚
                        </p>
                    </div>
                </div>
            </section>

            {/* === QUÉ ES KORAT FLOW === */}
            <section className="py-24 bg-gradient-to-b from-white to-gray-50 dark:from-[#0A140A] dark:to-[#081208]">
                <div className="mx-auto max-w-6xl px-4">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="space-y-6">
                            <h2 className="text-3xl font-bold md:text-4xl">
                                Somos un <span className="text-emerald-600 dark:text-emerald-400">laboratorio de automatización con IA</span>
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                                No somos una agencia genérica. Somos un equipo apasionado por crear
                                <span className="font-semibold"> ecosistemas digitales completos</span> que realmente
                                entienden la complejidad de un negocio de servicios.
                            </p>
                            <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                                Nuestro primer producto, <span className="text-violet-600 dark:text-violet-400 font-semibold">Nilah IA</span>, nació de escuchar a dueñas de salones de belleza.
                                Cada funcionalidad fue diseñada para resolver problemas reales, no para llenar una lista de features.
                            </p>
                            <div className="space-y-4 pt-4">
                                {[
                                    { icon: Bot, text: 'IA Conversacional — comprende contexto, emociones y matices' },
                                    { icon: Camera, text: 'Visión Artificial — analiza imágenes y calcula precios' },
                                    { icon: Zap, text: 'Automatización — n8n, APIs, webhooks que trabajan 24/7' },
                                    { icon: BarChart3, text: 'Business Intelligence — dashboards y predicciones' },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                                        <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                                            <item.icon size={20} className="text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <span>{item.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Founder Card */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-3xl blur-2xl" />
                            <div className="relative bg-white dark:bg-[#0F1A0F] border border-gray-100 dark:border-white/10 rounded-3xl p-8 shadow-xl">
                                <div className="flex flex-col items-center text-center">
                                    {/* Founder Photo */}
                                    <div className="relative mb-4">
                                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 blur-md opacity-50" />
                                        <img
                                            src="/assets/images/martin-founder.jpg"
                                            alt="Martin - Fundador de Korat Flow"
                                            className="relative h-28 w-28 md:h-32 md:w-32 rounded-full object-cover object-top border-4 border-white dark:border-[#0F1A0F] shadow-xl"
                                        />
                                    </div>
                                    <h4 className="font-bold text-xl">Martin Pestana</h4>
                                    <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-4">Fundador, Korat Flow</p>

                                    <Quote className="h-8 w-8 text-emerald-200 dark:text-emerald-500/30 mb-4" />

                                    <p className="text-gray-600 dark:text-gray-400 italic leading-relaxed">
                                        "Nos obsesiona combinar la tecnología avanzada con la calidez que tu negocio necesita.
                                        Cada salón tiene su personalidad, y nuestras soluciones aprenden a respetarla."
                                    </p>

                                    <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/10 w-full">
                                        <div className="flex justify-center gap-8">
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">5+</p>
                                                <p className="text-xs text-gray-500">Años en IA</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">50+</p>
                                                <p className="text-xs text-gray-500">Proyectos</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">100%</p>
                                                <p className="text-xs text-gray-500">Pasión</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* === NUESTROS VALORES === */}
            <section className="py-24 bg-white dark:bg-[#0A140A]">
                <div className="mx-auto max-w-5xl px-4">
                    <h2 className="text-3xl font-bold text-center mb-16 md:text-4xl">Nuestros Valores</h2>
                    <div className="grid gap-8 md:grid-cols-3">
                        {[
                            { icon: '🌱', title: 'Impacto Real', desc: 'Cada línea de código que escribimos debe generar un resultado medible para tu negocio.' },
                            { icon: '🔍', title: 'Transparencia', desc: 'Sin letra pequeña, sin compromisos ocultos. Sabes exactamente lo que estás pagando y lo que recibes.' },
                            { icon: '🤝', title: 'Humanidad', desc: 'La IA debe amplificar lo humano, no reemplazarlo. Nuestras soluciones potencian tu talento.' },
                        ].map((item, i) => (
                            <div key={i} className="rounded-2xl bg-gradient-to-b from-white to-gray-50 dark:from-[#0F1A0F] dark:to-[#0A140A] border border-gray-100 dark:border-white/5 p-8 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group">
                                <span className="text-4xl mb-5 block group-hover:scale-110 transition-transform">{item.icon}</span>
                                <h3 className="font-bold text-xl mb-3">{item.title}</h3>
                                <p className="text-gray-500 dark:text-gray-400">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* === CTA === */}
            <section className="py-20 bg-gradient-to-br from-emerald-600 via-teal-600 to-green-600 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
                <div className="mx-auto max-w-3xl px-4 text-center text-white relative">
                    <h2 className="text-3xl font-bold mb-4 md:text-4xl">¿Quieres saber más?</h2>
                    <p className="text-white/80 mb-8 text-lg">
                        Conversemos sobre cómo podemos ayudar a tu negocio.
                    </p>
                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                        <a
                            href={WHATSAPP_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto rounded-full bg-white px-10 py-4 font-bold text-emerald-700 hover:bg-gray-100 shadow-2xl flex items-center justify-center gap-2 transition-all hover:scale-105"
                        >
                            💬 Escríbenos por WhatsApp
                        </a>
                        <Link
                            to="/nilah"
                            className="w-full sm:w-auto rounded-full border-2 border-white/40 hover:border-white px-10 py-4 font-medium hover:bg-white/10 flex items-center justify-center gap-2 transition-all"
                        >
                            Conoce Nilah IA <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
};

export default KoratNosotros;
