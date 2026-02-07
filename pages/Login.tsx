
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, ArrowLeft, AlertCircle, Loader2, Eye, EyeOff, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { APP_NAME } from '../constants';


const LoginPage: React.FC = () => {
   const { login, logout, isLoading, error, clearError, isAuthenticated, user } = useAuth();
   const navigate = useNavigate();

   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [showPassword, setShowPassword] = useState(false);

   // Si el usuario ya está autenticado, redirigir al dashboard
   useEffect(() => {
      if (isAuthenticated && user && !isLoading) {
         console.log('🔐 Usuario ya autenticado, redirigiendo al dashboard...');
         navigate('/app');
      }
   }, [isAuthenticated, user, isLoading, navigate]);

   // Si el usuario está autenticado y llega a login, mostrar opción de logout
   // Esto permite "cambiar de cuenta" o probar con otras credenciales
   const handleLogoutAndStay = () => {
      logout();
      // El logout redirige automáticamente, pero queremos quedarnos en login
      window.location.hash = '#/login';
      window.location.reload();
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      clearError();

      if (!email || !password) return;

      const success = await login({ email, password });

      // Solo mostrar en consola para debug
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

      // Errores de conexión
      if (errorText.toLowerCase().includes('fetch') ||
         errorText.toLowerCase().includes('network') ||
         errorText.toLowerCase().includes('conexión')) {
         return {
            title: 'Error de conexión',
            description: 'No se pudo conectar con el servidor. Verifica tu conexión a internet e intenta nuevamente.'
         };
      }

      // Credenciales inválidas
      if (errorText.toLowerCase().includes('invalid') ||
         errorText.toLowerCase().includes('incorrecta') ||
         errorText.toLowerCase().includes('password') ||
         errorText.toLowerCase().includes('usuario')) {
         return {
            title: 'Credenciales incorrectas',
            description: 'El email o la contraseña son incorrectos. Por favor, verifica tus datos.'
         };
      }

      // Usuario no encontrado
      if (errorText.toLowerCase().includes('not found') ||
         errorText.toLowerCase().includes('no existe') ||
         errorText.toLowerCase().includes('no encontrado')) {
         return {
            title: 'Usuario no encontrado',
            description: 'No existe una cuenta con este email. Contacta al administrador.'
         };
      }

      // Cuenta bloqueada o inactiva
      if (errorText.toLowerCase().includes('blocked') ||
         errorText.toLowerCase().includes('inactive') ||
         errorText.toLowerCase().includes('bloqueado')) {
         return {
            title: 'Cuenta suspendida',
            description: 'Tu cuenta está temporalmente suspendida. Contacta al soporte.'
         };
      }

      // Timeout
      if (errorText.toLowerCase().includes('timeout')) {
         return {
            title: 'Tiempo de espera agotado',
            description: 'El servidor tardó demasiado en responder. Intenta nuevamente.'
         };
      }

      // Error genérico
      return {
         title: 'No se pudo iniciar sesión',
         description: errorText
      };
   };

   const formattedError = getErrorMessage(error);

   return (
      <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-dark-bg dark:via-dark-bg dark:to-gray-900">

         {/* Decorative background */}
         <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
         </div>

         {/* Botón para regresar al Home */}
         <div className="absolute top-6 left-6 md:top-10 md:left-10">
            <Link
               to="/"
               className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary transition-colors dark:text-gray-400 dark:hover:text-primary"
            >
               <ArrowLeft size={20} />
               Volver al inicio
            </Link>
         </div>

         {/* Banner si ya hay sesión activa */}
         {isAuthenticated && user && (
            <div className="absolute top-6 right-6 md:top-10 md:right-10">
               <div className="flex items-center gap-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-2">
                  <span className="text-sm text-amber-700 dark:text-amber-300">
                     Sesión activa: <strong>{user.email}</strong>
                  </span>
                  <button
                     onClick={handleLogoutAndStay}
                     className="flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 underline"
                  >
                     <LogOut size={14} />
                     Cerrar sesión
                  </button>
               </div>
            </div>
         )}

         <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl dark:bg-dark-card border border-gray-100 dark:border-dark-border">
            <div className="mb-8 flex flex-col items-center">
               <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary shadow-lg">
                  <Leaf className="h-10 w-10" />
               </div>
               <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{APP_NAME}</h1>
               <p className="text-gray-500 dark:text-gray-400 mt-2">Inicia sesión en tu cuenta</p>
            </div>

            {/* Error Alert - Mejorado */}
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
                     className="block w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-bg dark:text-white dark:placeholder-gray-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed outline-none"
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
                        className="block w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 pr-12 text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-bg dark:text-white dark:placeholder-gray-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed outline-none"
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
                  className="w-full rounded-xl bg-gradient-to-r from-primary to-emerald-400 px-5 py-3.5 text-center text-sm font-bold text-black hover:opacity-90 focus:outline-none focus:ring-4 focus:ring-primary/30 shadow-lg shadow-primary/20 transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center gap-2"
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
                  © {new Date().getFullYear()} {APP_NAME}. Todos los derechos reservados.
               </p>
            </div>
         </div>
      </div>
   );
};

export default LoginPage;

