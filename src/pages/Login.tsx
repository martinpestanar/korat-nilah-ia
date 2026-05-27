
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Bot, ArrowLeft, AlertCircle, Loader2, Eye, EyeOff, LogOut, CheckCircle, Wand2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
   const { login, logout, isLoading, error, clearError, isAuthenticated, user, isOrphaned } = useAuth();
   const navigate = useNavigate();
   const location = useLocation();
   
   // If redirected from a protected route (e.g. on page refresh), go back there after login
   const fromState = (location.state as any)?.from;
   const from = fromState ? `${fromState.pathname}${fromState.search || ''}${fromState.hash || ''}` : '/nilah/app';

   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [showPassword, setShowPassword] = useState(false);

   // Params de bienvenida post-onboarding
   const [searchParams] = useSearchParams();
   const isWelcome = searchParams.get('welcome') === '1';
   const welcomeEmail = searchParams.get('email') || '';

   // Pre-llenar email si viene del onboarding
   useEffect(() => {
     if (welcomeEmail) setEmail(decodeURIComponent(welcomeEmail));
   }, [welcomeEmail]);

   // Si el usuario ya está autenticado y tiene perfil, redirigir al destino original (o dashboard)
   useEffect(() => {
      if (isAuthenticated && user && !isLoading && !isOrphaned) {
         navigate(from, { replace: true });
      }
   }, [isAuthenticated, user, isLoading, navigate, from, isOrphaned]);


   // Si el usuario está autenticado y llega a login, mostrar opción de logout
   const handleLogoutAndStay = () => {
      logout();
      window.location.hash = '#/nilah/login';
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      clearError();

      if (!email || !password) return;

      const success = await login({ email, password });
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

   const handleFinishSetup = () => {
      navigate('/nilah/onboarding/free');
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

   const handleFillDemo = () => {
      setEmail('demo@brillastudio.com');
      setPassword('korat123');
   };

   return (
      <div className="relative flex h-[100dvh] overflow-y-auto overflow-x-hidden items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-dark-bg dark:via-dark-bg dark:to-gray-900">


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

             {/* Banner de bienvenida post-onboarding */}
             {isWelcome && (
                <div className="mb-6 rounded-xl bg-emerald-50 p-4 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 animate-in fade-in slide-in-from-top-2 duration-300">
                   <div className="flex items-start gap-3">
                      <CheckCircle size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                         <p className="font-semibold text-emerald-800 dark:text-emerald-300">¡Tu cuenta está lista! 🎉</p>
                         <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-0.5">Inicia sesión con el email y contraseña que acabas de crear.</p>
                      </div>
                   </div>
                </div>
             )}

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

               {isOrphaned && (
                  <div className="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 animate-in fade-in slide-in-from-top-2 duration-300">
                     <div className="flex items-start gap-3">
                        <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                           <p className="font-semibold text-amber-800 dark:text-amber-300">Cuenta no configurada</p>
                           <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 mb-3">
                              Tu cuenta existe pero no se ha terminado de configurar tu espacio de trabajo.
                           </p>
                           <button
                              type="button"
                              onClick={handleFinishSetup}
                              className="w-full py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm"
                           >
                              Terminar configuración
                           </button>
                        </div>
                     </div>
                  </div>
               )}
               
               {/* Demo Button */}
               <div className="relative flex items-center justify-center py-2">
                  <div className="absolute inset-0 flex items-center">
                     <div className="w-full border-t border-gray-200 dark:border-dark-border"></div>
                  </div>
                  <div className="relative bg-white dark:bg-dark-card px-4 text-xs text-gray-500 uppercase tracking-wider font-medium">
                     O si eres visitante
                  </div>
               </div>
               
               <button
                  type="button"
                  onClick={handleFillDemo}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-200 dark:border-amber-900/30 px-5 py-3 text-sm font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 transition-all active:scale-[0.99]"
               >
                  <Wand2 size={16} />
                  Probar Demo Interactiva
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
