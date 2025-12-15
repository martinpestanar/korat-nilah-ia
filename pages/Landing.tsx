
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Video, 
  TrendingUp, 
  ArrowRight, 
  CheckCircle2, 
  Bot,
  Zap,
  Leaf,
  Sun,
  Moon,
  Star,
  Quote,
  LayoutDashboard,
  Calendar,
  Users,
  Search,
  Bell,
  MoreHorizontal
} from 'lucide-react';
import { APP_NAME } from '../constants';
import { useTheme } from '../context/ThemeContext';

const LandingPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 selection:bg-primary selection:text-black font-sans dark:bg-[#0A0A0A] dark:text-white transition-colors duration-300">
      
      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-white/10 dark:bg-[#0A0A0A]/80 transition-colors duration-300">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
             <div className="h-8 w-8 text-primary flex items-center justify-center">
                <Leaf className="h-full w-full" />
             </div>
             <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                {APP_NAME}
             </span>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#servicios" className="text-sm font-medium text-gray-600 hover:text-primary dark:text-gray-300 transition">Servicios</a>
            <a href="#testimonios" className="text-sm font-medium text-gray-600 hover:text-primary dark:text-gray-300 transition">Casos de Éxito</a>
            <a href="#precios" className="text-sm font-medium text-gray-600 hover:text-primary dark:text-gray-300 transition">Planes</a>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <Link 
              to="/login"
              className="group relative overflow-hidden rounded-full bg-primary px-6 py-2 text-sm font-bold text-black transition-transform hover:scale-105"
            >
              <span className="relative z-10 flex items-center gap-2">
                Acceso <span className="hidden sm:inline">Clientes</span> <ArrowRight size={16} />
              </span>
            </Link>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-20 text-center">
        {/* Abstract Background Elements */}
        <div className="absolute top-1/4 -left-20 h-96 w-96 rounded-full bg-primary/20 blur-[100px] dark:bg-primary/10"></div>
        <div className="absolute bottom-1/4 -right-20 h-96 w-96 rounded-full bg-purple-500/20 blur-[100px] dark:bg-purple-500/10"></div>

        <div className="relative z-10 max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-primary shadow-sm dark:border-white/10 dark:bg-white/5 backdrop-blur-sm">
            <Zap size={12} className="fill-current" />
            Agencia de Automatización & Growth
          </div>
          
          <h1 className="text-5xl font-extrabold leading-tight tracking-tight md:text-7xl text-gray-900 dark:text-white">
            Automatización Creativa e <br />
            <span className="bg-gradient-to-r from-primary via-emerald-500 to-primary bg-clip-text text-transparent dark:via-emerald-400">Inteligencia Artificial</span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-gray-600 md:text-xl leading-relaxed dark:text-gray-400">
            Escalamos negocios wellness y de servicios mediante flujos automatizados (n8n), 
            producción audiovisual estratégica y publicidad digital de alto impacto.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a href="#precios" className="w-full rounded-full bg-black px-8 py-3.5 text-sm font-bold text-white transition hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 sm:w-auto shadow-lg">
              Ver Planes
            </a>
            <Link to="/login" className="w-full rounded-full border border-gray-300 bg-white px-8 py-3.5 text-sm font-bold text-gray-900 backdrop-blur-sm transition hover:bg-gray-50 dark:border-white/20 dark:bg-transparent dark:text-white dark:hover:bg-white/10 sm:w-auto">
              Ver Demo Dashboard
            </Link>
          </div>
        </div>

        {/* --- CUSTOM CSS DASHBOARD MOCKUP (SPANISH) --- */}
        <div className="relative mt-16 w-full max-w-5xl group">
             {/* Main Window Frame */}
             <div className="overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#121212] dark:shadow-primary/5 transition-colors duration-300">
                 
                 {/* Window Header / Browser Bar */}
                 <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3 dark:border-white/5 dark:bg-[#1A1A1A]">
                     <div className="flex gap-1.5">
                         <div className="h-3 w-3 rounded-full bg-red-400"></div>
                         <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
                         <div className="h-3 w-3 rounded-full bg-green-400"></div>
                     </div>
                     <div className="mx-auto w-1/3 rounded-md bg-white py-1 text-center text-[10px] text-gray-400 shadow-sm dark:bg-[#252525]">
                         app.koratflow.com/dashboard
                     </div>
                 </div>

                 {/* App Interface */}
                 <div className="flex h-96 md:h-[500px]">
                     {/* Sidebar Mock */}
                     <div className="hidden w-16 flex-col items-center gap-6 border-r border-gray-100 bg-white py-6 md:flex dark:border-white/5 dark:bg-[#121212]">
                         <div className="h-8 w-8 rounded-lg bg-primary text-black flex items-center justify-center"><Leaf size={16}/></div>
                         <div className="flex flex-col gap-4 text-gray-400">
                             <div className="p-2 text-primary bg-primary/10 rounded-lg"><LayoutDashboard size={20}/></div>
                             <div className="p-2 hover:text-gray-600 dark:hover:text-gray-200"><Calendar size={20}/></div>
                             <div className="p-2 hover:text-gray-600 dark:hover:text-gray-200"><Users size={20}/></div>
                             <div className="p-2 hover:text-gray-600 dark:hover:text-gray-200"><Bot size={20}/></div>
                         </div>
                     </div>

                     {/* Main Content Mock */}
                     <div className="flex-1 bg-gray-50 p-6 dark:bg-[#0A0A0A]">
                         {/* Header Mock */}
                         <div className="mb-6 flex items-center justify-between">
                             <div>
                                 <h3 className="text-xl font-bold text-gray-900 dark:text-white">Buenos días, Admin</h3>
                                 <p className="text-xs text-gray-500">Resumen de hoy</p>
                             </div>
                             <div className="flex items-center gap-3">
                                 <div className="rounded-full bg-white p-2 shadow-sm dark:bg-[#1E1E1E] text-gray-400"><Search size={16}/></div>
                                 <div className="rounded-full bg-white p-2 shadow-sm dark:bg-[#1E1E1E] text-gray-400"><Bell size={16}/></div>
                                 <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500"></div>
                             </div>
                         </div>

                         {/* Stats Grid */}
                         <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                             <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-[#1E1E1E]">
                                 <div className="flex items-center justify-between mb-2">
                                     <span className="text-xs font-bold text-gray-500">Ingresos Hoy</span>
                                     <TrendingUp size={16} className="text-green-500"/>
                                 </div>
                                 <p className="text-2xl font-bold text-gray-900 dark:text-white">S/ 1,240</p>
                                 <p className="text-[10px] text-green-500">+15% vs ayer</p>
                             </div>
                             <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-[#1E1E1E]">
                                 <div className="flex items-center justify-between mb-2">
                                     <span className="text-xs font-bold text-gray-500">Citas Activas</span>
                                     <Calendar size={16} className="text-primary"/>
                                 </div>
                                 <p className="text-2xl font-bold text-gray-900 dark:text-white">12</p>
                                 <p className="text-[10px] text-gray-400">4 pendientes</p>
                             </div>
                             <div className="rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 p-4 text-white shadow-lg">
                                 <div className="flex items-center gap-2 mb-2">
                                     <Bot size={16} />
                                     <span className="text-xs font-bold opacity-80">Nilah AI</span>
                                 </div>
                                 <p className="text-xs leading-relaxed opacity-90">
                                     "Detecto 2 huecos libres mañana a las 3PM. ¿Activo una promo flash?"
                                 </p>
                                 <button className="mt-3 w-full rounded bg-white/20 py-1 text-[10px] font-bold hover:bg-white/30">Activar Campaña</button>
                             </div>
                         </div>

                         {/* Charts Area */}
                         <div className="grid grid-cols-3 gap-4 h-48">
                             <div className="col-span-2 rounded-xl bg-white p-4 shadow-sm dark:bg-[#1E1E1E] flex flex-col">
                                 <div className="flex justify-between items-center mb-4">
                                     <h4 className="text-sm font-bold text-gray-800 dark:text-white">Rendimiento Semanal</h4>
                                     <MoreHorizontal size={16} className="text-gray-400"/>
                                 </div>
                                 <div className="flex-1 flex items-end justify-between gap-2 px-2">
                                     {/* Fixed: Added h-full to containers so bars are visible */}
                                     {[40, 65, 34, 78, 55, 89, 23].map((h, i) => (
                                         <div key={i} className="w-full h-full bg-gray-100 rounded-t-sm dark:bg-white/5 relative group overflow-hidden">
                                             <div 
                                                className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-sm transition-all duration-500 group-hover:bg-primary-dim" 
                                                style={{height: `${h}%`}}
                                             ></div>
                                         </div>
                                     ))}
                                 </div>
                                 <div className="mt-2 flex justify-between text-[10px] text-gray-400">
                                     <span>Lun</span><span>Mar</span><span>Mie</span><span>Jue</span><span>Vie</span><span>Sab</span><span>Dom</span>
                                 </div>
                             </div>

                             <div className="col-span-1 rounded-xl bg-white p-4 shadow-sm dark:bg-[#1E1E1E] flex flex-col">
                                 <h4 className="text-sm font-bold text-gray-800 dark:text-white mb-3">Próximas Citas</h4>
                                 <div className="space-y-3 overflow-hidden">
                                     {[
                                         {name: "Ana P.", service: "Manicura", time: "10:00", status: "Confirmada", color: "text-green-500 bg-green-500/10"},
                                         {name: "Carla T.", service: "Facial", time: "11:30", status: "Pendiente", color: "text-yellow-500 bg-yellow-500/10"},
                                         {name: "Luis R.", service: "Corte", time: "13:00", status: "En Curso", color: "text-blue-500 bg-blue-500/10"},
                                     ].map((appt, i) => (
                                         <div key={i} className="flex items-center justify-between text-xs">
                                             <div>
                                                 <p className="font-bold text-gray-700 dark:text-gray-200">{appt.name}</p>
                                                 <p className="text-[10px] text-gray-400">{appt.service}</p>
                                             </div>
                                             <div className="text-right">
                                                 <p className="text-gray-500">{appt.time}</p>
                                                 <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${appt.color}`}>
                                                     {appt.status}
                                                 </span>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             </div>
                         </div>
                     </div>
                 </div>
             </div>
             
             {/* Bottom Fade for dramatic effect */}
             <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-gray-50 to-transparent dark:from-[#0A0A0A]"></div>
        </div>
      </section>

      {/* --- SERVICES SECTION --- */}
      <section id="servicios" className="py-24 bg-white dark:bg-[#0F0F0F] transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">Nuestras Soluciones</h2>
            <p className="mt-4 text-gray-500 dark:text-gray-400">Tecnología y creatividad unidas para escalar tu facturación.</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Service 1 */}
            <div className="group rounded-2xl border border-gray-100 bg-gray-50 p-8 transition hover:border-primary/50 hover:bg-white hover:shadow-lg dark:border-white/5 dark:bg-[#141414] dark:hover:bg-white/5 dark:hover:shadow-none">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Bot size={28} />
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">Automatización IA (n8n)</h3>
              <p className="mb-6 text-sm text-gray-600 leading-relaxed dark:text-gray-400">
                Olvídate de las tareas repetitivas. Creamos chatbots inteligentes, bases de datos autogestionadas y flujos de venta que funcionan 24/7. Especialistas en el sector Wellness.
              </p>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-500">
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-primary"/> Chatbots de WhatsApp</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-primary"/> Agendamiento Automático</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-primary"/> Reactivación de Clientes</li>
              </ul>
            </div>

            {/* Service 2 */}
            <div className="group rounded-2xl border border-gray-100 bg-gray-50 p-8 transition hover:border-purple-500/50 hover:bg-white hover:shadow-lg dark:border-white/5 dark:bg-[#141414] dark:hover:bg-white/5 dark:hover:shadow-none">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                <Video size={28} />
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">Estudio Audiovisual</h3>
              <p className="mb-6 text-sm text-gray-600 leading-relaxed dark:text-gray-400">
                Contenido que detiene el scroll. Producción de video profesional, fotografía y edición estratégica para Reels y TikToks que conectan con tu audiencia.
              </p>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-500">
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-purple-500 dark:text-purple-400"/> Filmmaking Profesional</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-purple-500 dark:text-purple-400"/> Edición Dinámica (Short-form)</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-purple-500 dark:text-purple-400"/> Dirección Creativa</li>
              </ul>
            </div>

            {/* Service 3 */}
            <div className="group rounded-2xl border border-gray-100 bg-gray-50 p-8 transition hover:border-blue-500/50 hover:bg-white hover:shadow-lg dark:border-white/5 dark:bg-[#141414] dark:hover:bg-white/5 dark:hover:shadow-none">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <TrendingUp size={28} />
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">Growth & Ads</h3>
              <p className="mb-6 text-sm text-gray-600 leading-relaxed dark:text-gray-400">
                No quemes tu presupuesto. Gestionamos campañas publicitarias en Meta Ads y TikTok Ads con segmentación precisa para atraer clientes cualificados.
              </p>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-500">
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-blue-500 dark:text-blue-400"/> Estrategia de Funnels</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-blue-500 dark:text-blue-400"/> A/B Testing Constante</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-blue-500 dark:text-blue-400"/> Reportes de ROI en vivo</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* --- TESTIMONIALS SECTION (NEW) --- */}
      <section id="testimonios" className="py-24 bg-gray-50 dark:bg-[#0A0A0A] transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 flex flex-col items-center text-center">
            <span className="mb-2 rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">Resultados Reales</span>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">Lo que dicen nuestros partners</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             {/* Testimonial 1 */}
             <div className="relative rounded-2xl bg-white p-8 shadow-sm dark:bg-[#141414] dark:shadow-none">
                <Quote className="absolute right-6 top-6 h-8 w-8 text-gray-200 dark:text-gray-800" />
                <div className="mb-4 flex gap-1 text-yellow-400">
                   {[1,2,3,4,5].map(i => <Star key={i} size={16} fill="currentColor" />)}
                </div>
                <p className="mb-6 text-gray-600 dark:text-gray-300">
                   "Implementar Korat Flow redujo nuestro 'No-Show' en un 40%. La IA de recordatorios por WhatsApp es simplemente mágica, los clientes aman la atención inmediata."
                </p>
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-400"></div>
                   <div>
                      <p className="font-bold text-gray-900 dark:text-white">Elena Rojas</p>
                      <p className="text-xs text-gray-500">Dueña de Glow Spa, Lima</p>
                   </div>
                </div>
             </div>

             {/* Testimonial 2 */}
             <div className="relative rounded-2xl bg-white p-8 shadow-sm dark:bg-[#141414] dark:shadow-none">
                <Quote className="absolute right-6 top-6 h-8 w-8 text-gray-200 dark:text-gray-800" />
                <div className="mb-4 flex gap-1 text-yellow-400">
                   {[1,2,3,4,5].map(i => <Star key={i} size={16} fill="currentColor" />)}
                </div>
                <p className="mb-6 text-gray-600 dark:text-gray-300">
                   "Antes perdía horas agendando manualmente. Ahora el sistema llena los huecos vacíos con ofertas flash automáticas. Mi facturación subió un 25% el primer mes."
                </p>
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400"></div>
                   <div>
                      <p className="font-bold text-gray-900 dark:text-white">Carlos M.</p>
                      <p className="text-xs text-gray-500">Director, Barbería Capital</p>
                   </div>
                </div>
             </div>

             {/* Testimonial 3 */}
             <div className="relative rounded-2xl bg-white p-8 shadow-sm dark:bg-[#141414] dark:shadow-none">
                <Quote className="absolute right-6 top-6 h-8 w-8 text-gray-200 dark:text-gray-800" />
                <div className="mb-4 flex gap-1 text-yellow-400">
                   {[1,2,3,4,5].map(i => <Star key={i} size={16} fill="currentColor" />)}
                </div>
                <p className="mb-6 text-gray-600 dark:text-gray-300">
                   "El dashboard financiero me abrió los ojos. Sabía que ganaba dinero, pero no sabía qué servicios eran los más rentables hasta que vi el mapa de calor."
                </p>
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-full bg-gradient-to-br from-rose-400 to-orange-400"></div>
                   <div>
                      <p className="font-bold text-gray-900 dark:text-white">Sofia V.</p>
                      <p className="text-xs text-gray-500">Manager, Clínica SkinCare</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* --- PRICING SECTION (NEW) --- */}
      <section id="precios" className="py-24 bg-white dark:bg-[#0F0F0F] transition-colors duration-300">
         <div className="mx-auto max-w-7xl px-6">
            <div className="mb-16 text-center">
               <h2 className="text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">Planes diseñados para crecer</h2>
               <p className="mt-4 text-gray-500 dark:text-gray-400">Elige la herramienta que mejor se adapte a tu etapa actual.</p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3 items-center">
               {/* STARTER */}
               <div className="rounded-2xl border border-gray-200 bg-white p-8 dark:border-white/10 dark:bg-[#141414]">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Starter</h3>
                  <div className="my-4 flex items-baseline">
                     <span className="text-4xl font-extrabold text-gray-900 dark:text-white">S/ 199</span>
                     <span className="ml-2 text-gray-500">/mes</span>
                  </div>
                  <p className="mb-6 text-sm text-gray-500">Ideal para profesionales independientes o consultorios pequeños.</p>
                  <ul className="mb-8 space-y-3 text-sm text-gray-600 dark:text-gray-400">
                     <li className="flex gap-2"><CheckCircle2 size={16} className="text-green-500"/> Agenda Digital</li>
                     <li className="flex gap-2"><CheckCircle2 size={16} className="text-green-500"/> Base de Clientes (CRM)</li>
                     <li className="flex gap-2"><CheckCircle2 size={16} className="text-green-500"/> Reportes Básicos</li>
                     <li className="flex gap-2"><CheckCircle2 size={16} className="text-green-500"/> 1 Usuario</li>
                  </ul>
                  <button className="w-full rounded-lg border border-gray-300 bg-white py-2.5 text-sm font-bold text-gray-900 hover:bg-gray-50 dark:border-white/20 dark:bg-transparent dark:text-white dark:hover:bg-white/10">Empezar Gratis</button>
               </div>

               {/* PRO (Highlighted) */}
               <div className="relative rounded-2xl border-2 border-primary bg-gray-50 p-8 shadow-xl dark:bg-[#1A1A1A] transform lg:-translate-y-4">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-black shadow-md">
                     MÁS POPULAR
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Growth Pro</h3>
                  <div className="my-4 flex items-baseline">
                     <span className="text-4xl font-extrabold text-gray-900 dark:text-white">S/ 499</span>
                     <span className="ml-2 text-gray-500">/mes</span>
                  </div>
                  <p className="mb-6 text-sm text-gray-500">Para salones y clínicas en expansión que necesitan automatizar.</p>
                  <ul className="mb-8 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                     <li className="flex gap-2"><CheckCircle2 size={16} className="text-primary"/> Todo lo de Starter</li>
                     <li className="flex gap-2"><CheckCircle2 size={16} className="text-primary"/> <strong>Nilah AI Marketing</strong></li>
                     <li className="flex gap-2"><CheckCircle2 size={16} className="text-primary"/> Bot de WhatsApp incluido</li>
                     <li className="flex gap-2"><CheckCircle2 size={16} className="text-primary"/> Usuarios Ilimitados</li>
                  </ul>
                  <button className="w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-black hover:bg-primary-dim shadow-lg shadow-primary/20">Prueba de 14 días</button>
               </div>

               {/* AGENCY */}
               <div className="rounded-2xl border border-gray-200 bg-white p-8 dark:border-white/10 dark:bg-[#141414]">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Agency Custom</h3>
                  <div className="my-4 flex items-baseline">
                     <span className="text-2xl font-bold text-gray-900 dark:text-white">A medida</span>
                  </div>
                  <p className="mb-6 text-sm text-gray-500">Para cadenas o franquicias que requieren soluciones complejas.</p>
                  <ul className="mb-8 space-y-3 text-sm text-gray-600 dark:text-gray-400">
                     <li className="flex gap-2"><CheckCircle2 size={16} className="text-purple-500"/> Multi-Sede Dashboard</li>
                     <li className="flex gap-2"><CheckCircle2 size={16} className="text-purple-500"/> API Personalizada</li>
                     <li className="flex gap-2"><CheckCircle2 size={16} className="text-purple-500"/> Consultoría de Ads Mensual</li>
                     <li className="flex gap-2"><CheckCircle2 size={16} className="text-purple-500"/> Account Manager Dedicado</li>
                  </ul>
                  <button className="w-full rounded-lg border border-gray-300 bg-white py-2.5 text-sm font-bold text-gray-900 hover:bg-gray-50 dark:border-white/20 dark:bg-transparent dark:text-white dark:hover:bg-white/10">Contactar Ventas</button>
               </div>
            </div>
         </div>
      </section>

      {/* --- ABOUT SECTION --- */}
      <section id="metodo" className="py-24 relative overflow-hidden bg-gray-50 dark:bg-[#0A0A0A] transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center gap-16">
          <div className="md:w-1/2 relative">
             <div className="absolute -inset-4 bg-gradient-to-r from-primary to-purple-600 rounded-2xl opacity-20 blur-lg"></div>
             <div className="relative rounded-2xl bg-white p-1 border border-gray-200 dark:bg-[#1A1A1A] dark:border-white/10">
                <img 
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80" 
                  alt="Team working" 
                  className="rounded-xl grayscale hover:grayscale-0 transition duration-500"
                />
             </div>
          </div>
          <div className="md:w-1/2 space-y-6">
             <h2 className="text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">La fusión entre <span className="text-primary">Código</span> y <span className="text-purple-500 dark:text-purple-400">Alma</span>.</h2>
             <p className="text-gray-600 text-lg leading-relaxed dark:text-gray-400">
               En Korat Flow, creemos que la automatización no debe sentirse robótica. Usamos la tecnología para liberar tu tiempo, permitiéndote enfocarte en lo que realmente importa: la experiencia humana de tus clientes.
             </p>
             <p className="text-gray-600 text-lg leading-relaxed dark:text-gray-400">
               No somos solo programadores, ni solo creativos. Somos estrategas híbridos que entienden que un buen algoritmo necesita un gran diseño para funcionar.
             </p>
             <div className="pt-4 flex gap-4">
                <div className="text-center">
                   <p className="text-3xl font-bold text-gray-900 dark:text-white">+50</p>
                   <p className="text-xs uppercase text-gray-500 tracking-wider">Clientes Felices</p>
                </div>
                <div className="h-12 w-px bg-gray-300 dark:bg-white/10"></div>
                <div className="text-center">
                   <p className="text-3xl font-bold text-gray-900 dark:text-white">15k+</p>
                   <p className="text-xs uppercase text-gray-500 tracking-wider">Leads Generados</p>
                </div>
                <div className="h-12 w-px bg-gray-300 dark:bg-white/10"></div>
                <div className="text-center">
                   <p className="text-3xl font-bold text-gray-900 dark:text-white">24/7</p>
                   <p className="text-xs uppercase text-gray-500 tracking-wider">Soporte Activo</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="border-t border-gray-200 bg-white py-12 dark:border-white/10 dark:bg-[#050505] transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                 <Leaf className="text-primary" size={24}/>
                 <span className="text-xl font-bold text-gray-900 dark:text-white">Korat Flow</span>
              </div>
              <p className="max-w-xs text-sm text-gray-500">
                Impulsando la próxima generación de negocios wellness con tecnología invisible y resultados visibles.
              </p>
            </div>
            
            <div>
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">Explorar</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#" className="hover:text-primary transition">Inicio</a></li>
                <li><a href="#servicios" className="hover:text-primary transition">Servicios</a></li>
                <li><a href="#metodo" className="hover:text-primary transition">Nosotros</a></li>
                <li><Link to="/login" className="hover:text-primary transition">Área Clientes</Link></li>
              </ul>
            </div>

            <div id="contacto">
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition">Privacidad</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition">Términos</a></li>
                <li><span className="opacity-50">Lima, Perú</span></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-200 pt-8 text-center text-xs text-gray-500 dark:border-white/10">
            © {new Date().getFullYear()} Korat Flow Agency. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
