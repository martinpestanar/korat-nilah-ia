
import React from 'react';
import { Link } from 'react-router-dom';
import {
    MessageCircle, MapPin, Mail, Clock, ArrowRight,
    Phone, Sparkles, Bot
} from 'lucide-react';

const WHATSAPP_NUMBER = '51926285289';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hola! Me interesa conocer más sobre los servicios de Korat Flow')}`;
const WHATSAPP_NILAH_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hola! Quiero una demo de Nilah IA para mi salón')}`;

const KoratContacto: React.FC = () => {
    return (
        <>
            {/* === HERO === */}
            <section className="relative pt-32 pb-24 px-4 text-center overflow-hidden">
                <div className="absolute top-1/3 -left-32 h-[400px] w-[400px] rounded-full bg-emerald-500/15 blur-[120px]" />
                <div className="absolute bottom-1/3 -right-32 h-[300px] w-[300px] rounded-full bg-teal-500/10 blur-[100px]" />

                <div className="relative z-10 max-w-3xl mx-auto space-y-6 animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                        <MessageCircle size={16} />
                        Contáctanos
                    </div>
                    <h1 className="text-4xl font-extrabold md:text-5xl lg:text-6xl">
                        Hablemos sobre{' '}
                        <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">tu proyecto</span>
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        ¿Tienes un negocio de servicios y quieres automatizarlo? Cuéntanos por WhatsApp y evaluamos juntos la mejor solución.
                    </p>
                </div>
            </section>

            {/* === CONTACT OPTIONS === */}
            <section className="py-24 bg-white dark:bg-[#0A140A]">
                <div className="mx-auto max-w-5xl px-4">
                    <div className="grid gap-8 md:grid-cols-2">
                        {/* WhatsApp CTA — Main */}
                        <a
                            href={WHATSAPP_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative rounded-3xl bg-gradient-to-br from-[#25D366] to-[#128C7E] p-8 md:p-10 text-white overflow-hidden hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-2"
                        >
                            <div className="absolute top-0 right-0 h-40 w-40 bg-white/5 rounded-full -mr-10 -mt-10" />
                            <div className="absolute bottom-0 left-0 h-24 w-24 bg-white/5 rounded-full -ml-10 -mb-10" />

                            <div className="relative space-y-4">
                                <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                    <svg viewBox="0 0 24 24" className="h-8 w-8 fill-current" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold">Escríbenos por WhatsApp</h3>
                                <p className="text-white/80 text-lg">
                                    Respuesta directa y personalizada. Cuéntanos sobre tu negocio y te ayudamos.
                                </p>
                                <div className="flex items-center gap-2 text-white/90 font-medium">
                                    <Phone size={16} />
                                    +51 926 285 289
                                </div>
                                <div className="flex items-center gap-2 pt-2 text-sm text-white/70">
                                    <Clock size={14} />
                                    Respondemos en menos de 2 horas
                                </div>
                                <div className="inline-flex items-center gap-2 mt-4 bg-white/20 px-4 py-2 rounded-full text-sm font-medium group-hover:bg-white/30 transition-colors">
                                    Iniciar conversación <ArrowRight size={16} />
                                </div>
                            </div>
                        </a>

                        {/* Nilah Demo CTA */}
                        <a
                            href={WHATSAPP_NILAH_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 p-8 md:p-10 text-white overflow-hidden hover:shadow-2xl hover:shadow-violet-500/20 transition-all duration-300 hover:-translate-y-2"
                        >
                            <div className="absolute top-0 right-0 h-40 w-40 bg-white/5 rounded-full -mr-10 -mt-10" />
                            <div className="absolute bottom-0 left-0 h-24 w-24 bg-white/5 rounded-full -ml-10 -mb-10" />

                            <div className="relative space-y-4">
                                <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                    <Bot size={32} className="text-white" />
                                </div>
                                <h3 className="text-2xl font-bold">Agenda un Demo de Nilah IA</h3>
                                <p className="text-white/80 text-lg">
                                    ¿Tienes un salón de belleza? Pide una demostración personalizada de Nilah IA sin compromiso.
                                </p>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {['Gratis', 'Sin compromiso', '15 min'].map((tag, i) => (
                                        <span key={i} className="px-3 py-1 rounded-full bg-white/15 text-xs font-medium">{tag}</span>
                                    ))}
                                </div>
                                <div className="inline-flex items-center gap-2 mt-4 bg-white/20 px-4 py-2 rounded-full text-sm font-medium group-hover:bg-white/30 transition-colors">
                                    Solicitar demo <Sparkles size={16} />
                                </div>
                            </div>
                        </a>
                    </div>

                    {/* Additional Info */}
                    <div className="mt-16 grid gap-8 md:grid-cols-3">
                        {[
                            {
                                icon: MapPin,
                                title: 'Ubicación',
                                lines: ['Lima, Perú 🇵🇪', 'Operamos remotamente en toda Latinoamérica'],
                            },
                            {
                                icon: Mail,
                                title: 'Email',
                                lines: ['hola@koratflow.agency', 'Respuesta en 24h hábiles'],
                            },
                            {
                                icon: Clock,
                                title: 'Horario',
                                lines: ['Lunes a Viernes', '9:00 AM - 6:00 PM (PET)'],
                            },
                        ].map((item, i) => (
                            <div key={i} className="rounded-2xl bg-gray-50 dark:bg-[#0F1A0F] border border-gray-100 dark:border-white/5 p-6 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                                <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                                    <item.icon size={24} className="text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                                {item.lines.map((line, j) => (
                                    <p key={j} className="text-sm text-gray-500 dark:text-gray-400">{line}</p>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* === CTA === */}
            <section className="py-20 bg-gradient-to-br from-emerald-600 via-teal-600 to-green-600 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
                <div className="mx-auto max-w-3xl px-4 text-center text-white relative">
                    <h2 className="text-3xl font-bold mb-4 md:text-4xl">La automatización empieza con una conversación</h2>
                    <p className="text-white/80 mb-8">No importa el tamaño de tu negocio. Si quieres crecer, podemos ayudarte.</p>
                    <a
                        href={WHATSAPP_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full bg-white px-10 py-4 font-bold text-emerald-700 hover:bg-gray-100 shadow-2xl transition-all hover:scale-105"
                    >
                        💬 Hablemos por WhatsApp
                    </a>
                </div>
            </section>
        </>
    );
};

export default KoratContacto;
