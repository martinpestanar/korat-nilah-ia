import { supabase } from '@/services/supabase';
/**
 * ===========================================
 * Super Admin Login — Korat Flow Agency
 * ===========================================
 * Ruta oculta: /#/god-mode
 * Solo accesible por email/pass de un super_admin registrado en Supabase.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Eye, EyeOff, Loader2, Lock } from 'lucide-react';


const SuperAdminLogin: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // Simple hash check via Supabase RPC or direct query
            // For security, we compare against the super_admins table

            // Query using the secure RPC function to bypass RLS restrictions safely
            const { data, error: dbError } = await supabase.rpc('verify_super_admin', {
                p_email: email.toLowerCase().trim(),
                p_password: password
            });

            if (dbError || !data) {
                console.error("Login attempt failed:", dbError || "User not found or password incorrect");
                setError('Acceso denegado. Credenciales inválidas.');
                setIsLoading(false);
                return;
            }

            // Store super admin session
            const superAdminSession = {
                id: data.id,
                email: data.email,
                nombre: data.nombre,
                loginAt: new Date().toISOString()
            };

            sessionStorage.setItem('korat_super_admin', JSON.stringify(superAdminSession));

            // Redirect to admin dashboard
            navigate('/god-mode/dashboard');

        } catch (err) {
            console.error('Super Admin login error:', err);
            setError('Error de conexión. Intenta de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-[100dvh] overflow-y-auto overflow-x-hidden items-center justify-center p-4 bg-gradient-to-br from-zinc-950 via-violet-950/30 to-zinc-950">
            {/* Background effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-morph-blob" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-500/8 rounded-full blur-3xl animate-morph-blob" style={{ animationDelay: '4s' }} />
            </div>

            <div className="relative w-full max-w-sm">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center mb-4 shadow-premium-lg">
                        <ShieldAlert className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Korat Flow</h1>
                    <p className="text-zinc-400 text-sm mt-1">Panel de Administración Global</p>
                </div>

                {/* Login Card */}
                <form onSubmit={handleLogin} className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-5 shadow-2xl">

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@koratflow.agency"
                            required
                            className="w-full rounded-xl bg-zinc-800/80 border border-white/10 px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Contraseña</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full rounded-xl bg-zinc-800/80 border border-white/10 px-4 py-3 pr-12 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !email || !password}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 px-4 py-3.5 text-sm font-bold text-white hover:from-violet-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-premium tap-feedback"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Lock className="w-4 h-4" />
                                Acceder al Panel
                            </>
                        )}
                    </button>
                </form>

                {/* Footer */}
                <p className="text-center text-zinc-600 text-xs mt-6">
                    Acceso restringido • Solo administradores autorizados
                </p>
            </div>

            {/* Guía de Instalación PWA para Safari (God Mode Directo) */}
            <InstallGuide />
        </div>
    );
};

/**
 * Componente interno para guiar la instalación de la App de Super Admin
 */
const InstallGuide: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    React.useEffect(() => {
        // Detectar si ya es app instalada
        const isStandalone = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches;
        // Detectar si es iOS
        const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);

        setIsIOS(ios);
        if (ios && !isStandalone) {
            // Mostrar después de un breve delay
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 left-4 right-4 z-50 animate-fade-in-up">
            <div className="bg-zinc-900/95 backdrop-blur-2xl border border-violet-500/30 rounded-3xl p-5 shadow-2xl shadow-violet-500/20">
                <button
                    onClick={() => setIsVisible(false)}
                    className="absolute top-3 right-4 text-zinc-500 hover:text-white"
                >
                    ✕
                </button>

                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shrink-0 shadow-lg">
                        <ShieldAlert className="w-6 h-6 text-white" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-white font-bold text-sm">Instalar App God-Mode</h4>
                        <p className="text-zinc-400 text-xs leading-relaxed">
                            Para entrar directo al Super Admin desde tu celular:
                        </p>
                        <div className="flex flex-col gap-2 mt-3 text-[11px] text-zinc-300">
                            <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-violet-400 border border-violet-500/20">1</span>
                                <span>Toca el botón de <b>Compartir</b></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-violet-400 border border-violet-500/20">2</span>
                                <span>Selecciona <b>"Añadir a pantalla de inicio"</b></span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-zinc-900 rotate-45 border-r border-b border-violet-500/30" />
            </div>
        </div>
    );
};

export default SuperAdminLogin;
