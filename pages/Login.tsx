
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Leaf, ArrowLeft, Info, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { APP_NAME } from '../constants';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  // Pre-fill credentials for demo convenience (Default to Pro for immediate value)
  const [email, setEmail] = useState('pro@koratflow.com');
  const [password, setPassword] = useState('123456');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(email && password) {
       login(email);
       // Redirect to the internal dashboard app, not the landing page
       navigate('/app');
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gray-100 dark:bg-dark-bg">
      
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

      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-dark-card border border-gray-100 dark:border-dark-border">
        <div className="mb-8 flex flex-col items-center">
           <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-[0_0_30px_rgba(52,211,153,0.2)]">
              {/* Restored Leaf Icon */}
              <Leaf className="h-10 w-10" />
           </div>
           <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{APP_NAME}</h1>
           <p className="text-gray-500 dark:text-gray-400 mt-2">Wellness Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
           <div>
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Email</label>
              <input 
                 type="email" 
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-3 text-gray-900 focus:border-primary focus:ring-primary dark:border-dark-border dark:bg-dark-bg dark:text-white dark:placeholder-gray-400 transition-all" 
                 placeholder="admin@koratflow.com" 
                 required 
              />
           </div>
           <div>
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Password</label>
              <input 
                 type="password" 
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-3 text-gray-900 focus:border-primary focus:ring-primary dark:border-dark-border dark:bg-dark-bg dark:text-white dark:placeholder-gray-400 transition-all" 
                 placeholder="••••••••" 
                 required 
              />
           </div>
           
           <div className="space-y-2">
               <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 flex items-start gap-2">
                  <Info size={16} className="shrink-0 mt-0.5" />
                  <p>
                     <strong>Plan Pro (IA + Reputación):</strong> Usa <code>pro@koratflow.com</code>
                  </p>
               </div>
               <div className="rounded-lg bg-gray-100 p-3 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400 flex items-start gap-2">
                  <Info size={16} className="shrink-0 mt-0.5" />
                  <p>
                     <strong>Plan Starter:</strong> Usa <code>admin@koratflow.com</code>
                  </p>
               </div>
           </div>

           <button 
              type="submit" 
              className="w-full rounded-lg bg-primary px-5 py-3 text-center text-sm font-bold text-black hover:opacity-90 focus:outline-none focus:ring-4 focus:ring-primary/30 shadow-[0_0_20px_rgba(52,211,153,0.3)] transition-all transform hover:scale-[1.02]"
           >
              Iniciar Sesión
           </button>
        </form>
        <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">Sistema protegido por Korat Security.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
