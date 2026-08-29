
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Sparkles, MessageCircle, Calendar, Users, Zap, Camera, Megaphone, Shield, ArrowRight } from 'lucide-react';
import { fetchPrecios, type PrecioSuscripcion } from '../services/godmode';

const WHATSAPP_NUMBER = '51926285289';
const WHATSAPP_URL = (plan: string) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hola! Quiero saber más sobre el plan ${plan} de Nilah IA para mi salón`)}`;

const NilahPrecios: React.FC = () => {
    const [precios, setPrecios] = useState<Record<string, { precio: number; precio_pen: number; precio_regular?: number; precio_regular_pen?: number }>>({
        glow: { precio: 0, precio_pen: 0 },
        glow_pro: { precio: 39, precio_pen: 149, precio_regular: 65, precio_regular_pen: 249 },
        glow_elite: { precio: 89, precio_pen: 349, precio_regular: 149, precio_regular_pen: 549 },
    });

    useEffect(() => {
        fetchPrecios().then(data => {
            const map: any = {};
            data.forEach(p => {
                map[p.id] = {
                    precio: p.precio,
                    precio_pen: p.precio_pen,
                    precio_regular: p.precio_regular,
                    precio_regular_pen: p.precio_regular_pen
                };
            });
            setPrecios(prev => ({ ...prev, ...map }));
        }).catch(err => console.warn('Error loading dynamic prices:', err));
    }, []);

    const proPrice = precios['glow_pro'] || { precio: 39, precio_pen: 149 };
    const elitePrice = precios['glow_elite'] || { precio: 89, precio_pen: 349 };

    return (
        <div className="min-h-[100dvh] overflow-x-hidden bg-gradient-to-b from-white via-violet-50/20 to-white dark:from-[#0A0A0A] dark:via-[#0F0F0F] dark:to-[#0A0A0A] font-sans">

            {/* Hero */}
            <section className="pt-28 pb-10 px-4 text-center">
                <div className="max-w-3xl mx-auto space-y-4 animate-fade-in-up">
                    <Link to="/" className="inline-flex items-center gap-2 text-sm text-violet-500 hover:text-violet-600 mb-2 transition-colors">
                        ← Volver
                    </Link>
                    <h1 className="text-3xl font-extrabold md:text-5xl text-gray-900 dark:text-white leading-tight">
                        Empieza gratis.{' '}
                        <span className="bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-transparent">Crece cuando estés lista.</span>
                    </h1>
                    <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
                        Sin contratos. Sin tarjeta de crédito. Hasta 100 clientas gratis para que veas el resultado antes de pagar.
                    </p>
                </div>
            </section>

            {/* GANCHO FREE */}
            <section className="px-4 pb-8">
                <div className="max-w-2xl mx-auto rounded-3xl bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-500/10 dark:to-fuchsia-500/10 border border-violet-200 dark:border-violet-500/30 p-6 md:p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-violet-300/10 rounded-full blur-3xl" />
                    <div className="relative z-10">
                        <span className="inline-flex items-center gap-1.5 bg-white dark:bg-violet-500/20 text-violet-600 dark:text-violet-300 text-xs font-bold px-3 py-1.5 rounded-full border border-violet-200 dark:border-violet-500/30 mb-3">
                            ✨ Sin tarjeta · Sin compromisos
                        </span>
                        <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 dark:text-white mb-2">
                            ¿Quieres probarlo antes de pagar?
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base mb-5 leading-relaxed">
                            Organiza tu agenda y tus clientas completamente gratis. Cuando veas cuánto dinero tienes dormido en tu lista de contactos, vas a entender sola por qué existe el plan Pro.
                        </p>
                        <Link
                            to="/auth?plan=free"
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold px-7 py-3 rounded-full shadow-lg shadow-violet-500/30 hover:scale-105 hover:shadow-violet-500/50 active:scale-95 transition-all text-sm md:text-base"
                        >
                            <Sparkles size={17} /> Empezar gratis ahora →
                        </Link>
                        <p className="mt-3 text-xs text-gray-400">
                            Hasta 100 clientas gratis. Sin automatizaciones de marketing (eso es Pro).
                        </p>
                    </div>
                </div>
            </section>

            {/* Pricing Cards */}
            <section className="py-8 px-4">
                <div className="max-w-5xl mx-auto grid gap-6 md:grid-cols-3">

                    {/* NILAH FREE */}
                    <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141414] p-6 md:p-7 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col">
                        <div className="flex items-center gap-3 mb-1">
                            <span className="text-xl">🌱</span>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Nilah Free</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-5">Para empezar a organizarte</p>
                        <div className="mb-5">
                            <span className="text-4xl font-extrabold text-gray-900 dark:text-white">$0</span>
                            <span className="text-gray-500 text-sm ml-1">/mes para siempre</span>
                            <div className="mt-1 flex items-center gap-2">
                                <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                                    S/ 0 PEN
                                </span>
                                <span className="text-xs text-gray-400">Sin tarjeta</span>
                            </div>
                        </div>
                        <ul className="space-y-3 text-sm mb-6 flex-1">
                            {[
                                { icon: <Calendar size={16} className="text-emerald-500 shrink-0 mt-0.5" />, text: 'Agenda completa de citas' },
                                { icon: <Users size={16} className="text-emerald-500 shrink-0 mt-0.5" />, text: 'Ficha de cada clienta (hasta 100)' },
                                { icon: <MessageCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />, text: 'Asesora informativa básica' },
                            ].map((f, i) => (
                                <li key={i} className="flex gap-3 text-gray-600 dark:text-gray-300">
                                    {f.icon} {f.text}
                                </li>
                            ))}
                        </ul>
                        {/* Muro */}
                        <div className="mb-5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-3 text-center">
                            <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-0.5">Cuando llegues a 100 clientas...</p>
                            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">Nilah te muestra cuánto puedes recuperar. El Pro se paga solo.</p>
                        </div>
                        <Link
                            to="/auth?plan=free"
                            className="block w-full text-center rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3.5 font-bold text-white shadow-md hover:scale-[1.02] active:scale-95 transition-all text-sm"
                        >
                            <Sparkles size={15} className="inline mr-1.5 -mt-0.5" />Empezar gratis
                        </Link>
                    </div>

                    {/* GLOW PRO */}
                    <div className="relative rounded-3xl border-2 border-violet-500 bg-white dark:bg-[#1A1A1A] p-6 md:p-7 shadow-2xl shadow-violet-500/10 hover:shadow-violet-500/20 transition-all duration-300 hover:-translate-y-1 flex flex-col">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-1.5 text-xs font-black text-white shadow-lg whitespace-nowrap animate-pulse">
                            MÁS ELEGIDO — EL QUE SE PAGA SOLO
                        </div>
                        <div className="flex items-center gap-3 mb-1 mt-2">
                            <span className="text-xl">⭐</span>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Glow Pro</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-5">Para salones que quieren crecer</p>
                        <div className="mb-5">
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-gray-900 dark:text-white">${proPrice.precio}</span>
                                <span className="text-gray-500 text-sm">USD/mes</span>
                                {proPrice.precio_regular ? (
                                    <span className="text-xs text-gray-400 line-through">${proPrice.precio_regular}</span>
                                ) : null}
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                                <span className="text-xs px-2.5 py-0.5 rounded-md bg-violet-500/15 text-violet-600 dark:text-violet-400 font-bold border border-violet-500/30">
                                    ~ S/ {proPrice.precio_pen} PEN/mes
                                </span>
                                <span className="text-[11px] text-gray-400">Referencial</span>
                            </div>
                        </div>
                        <ul className="space-y-3 text-sm mb-6 flex-1">
                            {[
                                { icon: <Zap size={16} className="text-violet-500 shrink-0 mt-0.5" />, text: 'Todo lo del plan Free, ilimitado' },
                                { icon: <Zap size={16} className="text-violet-500 shrink-0 mt-0.5" />, text: 'Rescate inteligente de clientas inactivas (45d/75d/120d)' },
                                { icon: <Zap size={16} className="text-violet-500 shrink-0 mt-0.5" />, text: 'Recordatorios de cita 24h y 3h antes' },
                                { icon: <Zap size={16} className="text-violet-500 shrink-0 mt-0.5" />, text: 'Disparador de retoques (18-24 días)' },
                                { icon: <Megaphone size={16} className="text-violet-500 shrink-0 mt-0.5" />, text: 'Mensajes masivos y promociones por WhatsApp' },
                                { icon: <Camera size={16} className="text-violet-500 shrink-0 mt-0.5" />, text: 'Flyers IA & Fidelización por puntos' },
                                { icon: <CheckCircle2 size={16} className="text-violet-500 shrink-0 mt-0.5" />, text: 'Pantalla de facturación y ROI en vivo' },
                            ].map((f, i) => (
                                <li key={i} className="flex gap-3 text-gray-600 dark:text-gray-300">
                                    {f.icon} {f.text}
                                </li>
                            ))}
                        </ul>
                        <a
                            href={WHATSAPP_URL('Glow Pro')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full text-center rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 py-3.5 font-bold text-white hover:from-violet-600 hover:to-violet-700 shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-95 text-sm"
                        >
                            Quiero el Glow Pro →
                        </a>
                        <p className="text-xs text-center text-gray-400 mt-3">El 80% de nuestras clientas eligen Pro</p>
                    </div>

                    {/* GLOW ELITE */}
                    <div className="rounded-3xl border border-cyan-200 dark:border-cyan-500/30 bg-white dark:bg-[#141414] p-6 md:p-7 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 hover:-translate-y-1 flex flex-col">
                        <div className="flex items-center gap-3 mb-1">
                            <span className="text-xl">👑</span>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Glow Elite</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-5">Para salones que quieren todo</p>
                        <div className="mb-5">
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-gray-900 dark:text-white">${elitePrice.precio}</span>
                                <span className="text-gray-500 text-sm">USD/mes</span>
                                {elitePrice.precio_regular ? (
                                    <span className="text-xs text-gray-400 line-through">${elitePrice.precio_regular}</span>
                                ) : null}
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                                <span className="text-xs px-2.5 py-0.5 rounded-md bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-bold border border-cyan-500/30">
                                    ~ S/ {elitePrice.precio_pen} PEN/mes
                                </span>
                                <span className="text-[11px] text-gray-400">Referencial</span>
                            </div>
                        </div>
                        <ul className="space-y-3 text-sm mb-6 flex-1">
                            {[
                                { icon: <CheckCircle2 size={16} className="text-cyan-500 shrink-0 mt-0.5" />, text: 'Todo lo del Glow Pro' },
                                { icon: <Sparkles size={16} className="text-cyan-500 shrink-0 mt-0.5" />, text: 'Asistente personal ejecutivo 24/7 (Nilah Copilot)' },
                                { icon: <CheckCircle2 size={16} className="text-cyan-500 shrink-0 mt-0.5" />, text: 'Inbox multicanal con asignación de asesores' },
                                { icon: <CheckCircle2 size={16} className="text-cyan-500 shrink-0 mt-0.5" />, text: 'Capacidad de Staff ilimitado' },
                                { icon: <CheckCircle2 size={16} className="text-cyan-500 shrink-0 mt-0.5" />, text: 'Soporte prioritario 1 a 1 directo con fundadores' },
                            ].map((f, i) => (
                                <li key={i} className="flex gap-3 text-gray-600 dark:text-gray-300">
                                    {f.icon} {f.text}
                                </li>
                            ))}
                        </ul>
                        <a
                            href={WHATSAPP_URL('Glow Elite')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full text-center rounded-xl border-2 border-cyan-500 py-3.5 font-bold text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 transition-all hover:scale-[1.02] active:scale-95 text-sm"
                        >
                            Quiero el Glow Elite →
                        </a>
                    </div>
                </div>

                {/* ROI Comparison */}
                <div className="mt-10 text-center max-w-2xl mx-auto">
                    <div className="rounded-2xl bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-500/10 dark:to-fuchsia-500/10 border border-violet-100 dark:border-violet-500/20 p-6 text-left">
                        <p className="font-bold text-violet-600 dark:text-violet-400 mb-3 text-base">💡 Ponlo en perspectiva:</p>
                        <div className="space-y-2 text-gray-600 dark:text-gray-300 text-sm">
                            <p>Recepcionista medio tiempo: <span className="font-semibold">S/ 1,200/mes</span></p>
                            <p>Nilah Glow Pro: <span className="font-semibold">S/ 449/mes</span> → <span className="font-bold text-emerald-500">Ahorro: S/ 750+ al mes</span></p>
                            <p className="mt-3 text-xs text-gray-400">Y Nilah no falta, no llega tarde y responde a las 11 PM.</p>
                        </div>
                    </div>
                </div>

                {/* Guarantee */}
                <div className="mt-8 text-center max-w-2xl mx-auto">
                    <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-6 flex items-start gap-4 text-left">
                        <Shield size={32} className="text-emerald-500 shrink-0 mt-1" />
                        <div>
                            <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">Garantía de 7 días</p>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">Si en los primeros 7 días el sistema no funciona como prometimos, te devolvemos el costo del setup completo. Sin preguntas.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default NilahPrecios;
