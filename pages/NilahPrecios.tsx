
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Bot, Sparkles, MessageCircle, Phone } from 'lucide-react';

const WHATSAPP_NUMBER = '51926285289';
const WHATSAPP_URL = (plan: string) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hola! Quiero contratar el plan ${plan} de Nilah IA para mi salón`)}`;

const NilahPrecios: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-white via-violet-50/20 to-white dark:from-[#0A0A0A] dark:via-[#0F0F0F] dark:to-[#0A0A0A] font-sans">
            {/* Hero */}
            <section className="pt-32 pb-16 px-4 text-center">
                <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
                    <Link to="/nilah" className="inline-flex items-center gap-2 text-sm text-violet-500 hover:text-violet-600 mb-4 transition-colors">
                        ← Volver a Nilah IA
                    </Link>
                    <h1 className="text-4xl font-extrabold md:text-5xl lg:text-6xl">
                        Elige tu plan{' '}
                        <span className="bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-transparent">perfecto</span>
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
                        Inversión que se paga sola. Sin compromisos a largo plazo.
                    </p>
                </div>
            </section>

            {/* Pricing Cards */}
            <section className="py-16 px-4">
                <div className="max-w-5xl mx-auto grid gap-8 lg:grid-cols-2">
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
                        <a
                            href={WHATSAPP_URL('Starter')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full text-center rounded-xl border-2 border-gray-200 dark:border-white/20 py-4 font-bold text-gray-700 dark:text-gray-300 hover:border-violet-300 hover:text-violet-600 dark:hover:border-violet-500/50 dark:hover:text-violet-400 transition-all"
                        >
                            Empezar con Starter
                        </a>
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
                        <a
                            href={WHATSAPP_URL('Pro')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-cta-primary block w-full text-center rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 py-4 font-bold text-white hover:from-violet-600 hover:to-violet-700 shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40"
                        >
                            🚀 Empezar con Pro
                        </a>
                        <p className="text-xs text-center text-gray-400 mt-4">El 80% de nuestros clientes eligen Pro</p>
                    </div>
                </div>

                {/* ROI Comparison */}
                <div className="mt-12 text-center max-w-2xl mx-auto">
                    <div className="inline-block rounded-2xl bg-gradient-to-r from-violet-50 to-pink-50 dark:from-violet-500/10 dark:to-pink-500/10 border border-violet-100 dark:border-violet-500/20 p-6 text-left">
                        <p className="font-bold text-violet-600 dark:text-violet-400 mb-3 text-lg">💡 Ponlo en perspectiva:</p>
                        <div className="space-y-2 text-gray-600 dark:text-gray-300">
                            <p>Recepcionista medio tiempo: <span className="font-semibold">S/ 1,200/mes</span></p>
                            <p>Nilah Pro: <span className="font-semibold">S/ 597/mes</span> → <span className="font-bold text-emerald-500">Ahorro: S/ 600+</span></p>
                        </div>
                    </div>
                </div>

                {/* Guarantee */}
                <div className="mt-16 text-center max-w-2xl mx-auto">
                    <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-8">
                        <p className="text-2xl font-bold mb-2">🛡️ Garantía de 30 Días</p>
                        <p className="text-gray-600 dark:text-gray-300">Si no ves resultados, te devolvemos el 100% de tu dinero. Sin preguntas.</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default NilahPrecios;
