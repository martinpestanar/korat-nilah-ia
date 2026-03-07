
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, ArrowLeft, AlertCircle, Loader2, Eye, EyeOff, LogOut, Download, Apple, Smartphone, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
   const { login, logout, isLoading, error, clearError, isAuthenticated, user } = useAuth();
   const navigate = useNavigate();

   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [showPassword, setShowPassword] = useState(false);

   // PWA Installation state
   const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
   const [showPWAHint, setShowPWAHint] = useState(false);
   const [isIOS, setIsIOS] = useState(false);
   const [isInstalled, setIsInstalled] = useState(false);

   useEffect(() => {
      // Detect iOS
      const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      setIsIOS(ios);

      // Detect if already installed (standalone)
      if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
         setIsInstalled(true);
      }

      // Capture beforeinstallprompt event (Android/Chrome)
      const handler = (e: any) => {
         e.preventDefault();
         setDeferredPrompt(e);
         // Show hint if NOT already installed
         if (!isInstalled) {
            setShowPWAHint(true);
         }
      };

      window.addEventListener('beforeinstallprompt', handler);

      // For iOS, show hint after a small delay if NOT installed
      if (ios && !isInstalled) {
         const timer = setTimeout(() => setShowPWAHint(true), 1500);
         return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            clearTimeout(timer);
         };
      }

      return () => window.removeEventListener('beforeinstallprompt', handler);
   }, [isInstalled]);

   const handlePWAInstall = async () => {
      if (!deferredPrompt) return;

      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
         setDeferredPrompt(null);
         setShowPWAHint(false);
      }
   };

   // Si el usuario ya está autenticado, redirigir al dashboard
   useEffect(() => {
      if (isAuthenticated && user && !isLoading) {
         console.log('🔐 Usuario ya autenticado, redirigiendo al dashboard...');
         navigate('/nilah/app');
      }
   }, [isAuthenticated, user, isLoading, navigate]);

   // Si el usuario está autenticado y llega a login, mostrar opción de logout
   const handleLogoutAndStay = () => {
      logout();
      window.location.hash = '#/nilah/login';
      window.location.reload();
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      clearError();

      if (!email || !password) return;

      const success = await login({ email, password });
      console.log('🔐 Login attempt result:', success ? 'SUCCESS' : 'FAILED');
   };

   // Limpiar error cuando el usuario empieza a escribir
   const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setEmail(e.target.value);
      if (error) clearError();
   };

   const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setPassword(e.target.value);
      if (error) clearError();
   };

   // Formatear mensaje de error para mejor UX
   const getErrorMessage = (errorText: string | null): { title: string; description: string } => {
      if (!errorText) return { title: '', description: '' };

      if (errorText.toLowerCase().includes('fetch') ||
         errorText.toLowerCase().includes('network') ||
         errorText.toLowerCase().includes('conexión')) {
         return {
            title: 'Error de conexión',
            description: 'No se pudo conectar con el servidor. Verifica tu conexión a internet e intenta nuevamente.'
         };
      }

      if (errorText.toLowerCase().includes('invalid') ||
         errorText.toLowerCase().includes('incorrecta') ||
         errorText.toLowerCase().includes('password') ||
         errorText.toLowerCase().includes('usuario')) {
         return {
            title: 'Credenciales incorrectas',
            description: 'El email o la contraseña son incorrectos. Por favor, verifica tus datos.'
         };
      }

      if (errorText.toLowerCase().includes('not found') ||
         errorText.toLowerCase().includes('no existe') ||
         errorText.toLowerCase().includes('no encontrado')) {
         return {
            title: 'Usuario no encontrado',
            description: 'No existe una cuenta con este email. Contacta al administrador.'
         };
      }

      if (errorText.toLowerCase().includes('blocked') ||
         errorText.toLowerCase().includes('inactive') ||
         errorText.toLowerCase().includes('bloqueado')) {
         return {
            title: 'Cuenta suspendida',
            description: 'Tu cuenta está temporalmente suspendida. Contacta al soporte.'
         };
      }

      if (errorText.toLowerCase().includes('timeout')) {
         return {
            title: 'Tiempo de espera agotado',
            description: 'El servidor tardó demasiado en responder. Intenta nuevamente.'
         };
      }

      return {
         title: 'No se pudo iniciar sesión',
         description: errorText
      };
   };

   const formattedError = getErrorMessage(error);

   return (
      <div className="relative flex h-[100dvh] overflow-y-auto overflow-x-hidden items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-dark-bg dark:via-dark-bg dark:to-gray-900">

         {/* PWA Install Banner (Premium iPhone/Android style) */}
         {showPWAHint && !isInstalled && (
            <div className="fixed bottom-6 left-4 right-4 z-[100] animate-fade-in-up">
               <div className="mx-auto max-w-sm rounded-2xl border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur-2xl dark:bg-black/40">
                  <div className="flex items-center gap-4">
                     <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-premium-lg">
                        <img src="/pwa-192x192.png" alt="App Icon" className="h-10 w-10 rounded-xl" />
                     </div>
                     <div className="flex-1">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">Instalar Nilah IA</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Accede más rápido y recibe notificaciones.</p>
                     </div>
                     <button
                        onClick={() => setShowPWAHint(false)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white"
                     >
                        <X size={18} />
                     </button>
                  </div>
                  <div className="mt-4 flex flex-col gap-2">
                     {isIOS ? (
                        <div className="flex items-center gap-2 rounded-xl bg-violet-500/10 px-3 py-2 text-[10px] text-violet-600 dark:text-violet-400">
                           <Apple size={14} className="shrink-0" />
                           <span>Toca <Download size={12} className="inline mx-0.5 rotate-180" /> y luego "Añadir a pantalla de inicio"</span>
                        </div>
                     ) : (
                        <button
                           onClick={handlePWAInstall}
                           className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/20 active:scale-95 transition-all"
                        >
                           <Smartphone size={16} />
                           Instalar Ahora
                        </button>
                     )}
                  </div>
               </div>
            </div>
         )}

         {/* Decorative background — violet/pink blobs */}
         <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-violet-500/10 blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-pink-500/8 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-500/5 blur-3xl" />
         </div>

         {/* Botón para regresar al Home */}
         <div className="absolute top-6 left-6 md:top-10 md:left-10">
            <Link
               to="/"
               className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-violet-500 transition-colors dark:text-gray-400 dark:hover:text-violet-400"
            >
               <ArrowLeft size={20} />
               Volver al inicio
            </Link>
         </div>

         {/* Banner si ya hay sesión activa */}
         {isAuthenticated && user && (
            <div className="absolute top-6 right-6 md:top-10 md:right-10">
               <div className="flex items-center gap-3 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 px-4 py-2">
                  <span className="text-sm text-violet-700 dark:text-violet-300">
                     Sesión activa: <strong>{user.email}</strong>
                  </span>
                  <button
                     onClick={handleLogoutAndStay}
                     className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-200 underline"
                  >
                     <LogOut size={14} />
                     Cerrar sesión
                  </button>
               </div>
            </div>
         )}

         <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl shadow-violet-500/5 dark:bg-dark-card border border-gray-100 dark:border-dark-border">
            <div className="mb-8 flex flex-col items-center">
               <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-pink-500/10 text-violet-500 shadow-lg shadow-violet-500/10">
                  <Bot className="h-10 w-10" />
               </div>
               <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Nilah IA</h1>
               <p className="text-gray-500 dark:text-gray-400 mt-2">Inicia sesión en tu cuenta</p>
            </div>

            {/* Error Alert */}
            {error && (
               <div className="mb-6 rounded-xl bg-red-50 p-4 border border-red-100 dark:bg-red-900/20 dark:border-red-900/30 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-start gap-3">
                     <div className="shrink-0 p-1 rounded-full bg-red-100 dark:bg-red-900/30">
                        <AlertCircle size={18} className="text-red-600 dark:text-red-400" />
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="font-semibold text-red-800 dark:text-red-300">{formattedError.title}</p>
                        <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">{formattedError.description}</p>
                     </div>
                  </div>
               </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
               <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                     Email
                  </label>
                  <input
                     type="email"
                     value={email}
                     onChange={handleEmailChange}
                     disabled={isLoading}
                     className="block w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-gray-900 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-dark-border dark:bg-dark-bg dark:text-white dark:placeholder-gray-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed outline-none"
                     placeholder="tu@email.com"
                     autoComplete="email"
                     required
                  />
               </div>

               <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                     Contraseña
                  </label>
                  <div className="relative">
                     <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={handlePasswordChange}
                        disabled={isLoading}
                        className="block w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 pr-12 text-gray-900 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-dark-border dark:bg-dark-bg dark:text-white dark:placeholder-gray-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed outline-none"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        required
                     />
                     <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        tabIndex={-1}
                     >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                     </button>
                  </div>
               </div>

               <button
                  type="submit"
                  disabled={isLoading || !email || !password}
                  className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 px-5 py-3.5 text-center text-sm font-bold text-white hover:from-violet-600 hover:to-violet-700 focus:outline-none focus:ring-4 focus:ring-violet-500/30 shadow-lg shadow-violet-500/25 transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center gap-2"
               >
                  {isLoading ? (
                     <>
                        <Loader2 size={18} className="animate-spin" />
                        Iniciando sesión...
                     </>
                  ) : (
                     'Iniciar Sesión'
                  )}
               </button>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-dark-border text-center">
               <p className="text-xs text-gray-400 dark:text-gray-500">
                  © {new Date().getFullYear()} Nilah IA by Korat Flow. Todos los derechos reservados.
               </p>
            </div>
         </div>
      </div>
   );
};

export default LoginPage;
