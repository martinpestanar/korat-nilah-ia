
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
  Quote
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

        {/* Hero Image / Dashboard Preview */}
        <div className="relative mt-16 w-full max-w-5xl rounded-t-2xl border border-gray-200 bg-white p-2 shadow-2xl dark:border-white/10 dark:bg-[#121212] dark:shadow-primary/10 transition-colors duration-300">
           <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-transparent to-transparent z-10 dark:from-[#0A0A0A]"></div>
           <div className="h-64 md:h-96 w-full rounded-lg bg-gray-100 overflow-hidden relative dark:bg-gray-900">
              {/* Mockup visual elements representing the dashboard */}
              <div className="flex h-full">
                 <div className="w-16 border-r border-gray-200 bg-white dark:bg-black/40 dark:border-white/5"></div>
                 <div className="flex-1 p-6">
                    <div className="mb-6 flex gap-4">
                       <div className="h-32 w-1/4 rounded bg-gray-200 dark:bg-white/5 animate-pulse"></div>
                       <div className="h-32 w-1/4 rounded bg-gray-200 dark:bg-white/5 animate-pulse delay-75"></div>
                       <div className="h-32 w-1/4 rounded bg-gray-200 dark:bg-white/5 animate-pulse delay-100"></div>
                       <div className="h-32 w-1/4 rounded bg-gray-200 dark:bg-white/5 animate-pulse delay-150"></div>
                    </div>
                    <div className="flex gap-4">
                       <div className="h-64 w-2/3 rounded bg-gray-200 dark:bg-white/5"></div>
                       <div className="h-64 w-1/3 rounded bg-gray-200 dark:bg-white/5"></div>
                    </div>
                 </div>
              </div>
           </div>
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
