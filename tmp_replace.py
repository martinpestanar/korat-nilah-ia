import sys

file_path = r'c:\Users\Martin\Documents\Korat-Flow-Agencia\Korat_MVP\pages\Landing.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if '{/* Pricing Grid: Glow & Glow Pro */}' in line:
        start_idx = i
        break

for i in range(start_idx, len(lines)):
    if '{/* ROI Calculator Nota */}' in line:
        end_idx = i
        break

if start_idx != -1 and end_idx != -1:
    new_content = """          {/* Pricing Grid: Glow, Glow Pro, & Glow Elite */}
          <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6 mb-12 max-w-[85rem] px-4 mx-auto">
            
            {/* PLAN GLOW (Starter) */}
            <div className="h-full relative">
              <ParallaxTiltWrapper className="h-full">
                <div className="neon-border-container relative bg-white dark:bg-[#040f0a] rounded-[2rem] p-0.5 shadow-xl ultra-card-shadow-emerald h-full overflow-hidden group hover:shadow-emerald-500/30 transition-shadow">
                  <div className="neon-border-glow-emerald" />
                
                <div className="relative z-10 bg-white dark:bg-[#040f0a] rounded-[1.95rem] p-6 lg:p-8 flex flex-col h-full">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-5">
                      <div>
                        <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Glow</h3>
                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Organización y control</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                        <Calendar size={20} className="text-white" />
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <div className="flex items-baseline gap-1.5 mb-1">
                        <span className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tighter">${planPrices.basico}</span>
                        <span className="text-gray-500 font-semibold text-xs">USD/mes</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">S/ {planPrices.basico_pen}<span className="text-xs font-normal">/mes</span></p>
                        <span className="text-xs text-gray-400 line-through font-medium">S/ {planPrices.basico_reg_pen}</span>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex gap-4 p-3.5 rounded-2xl glass-widget border border-emerald-500/20 shadow-sm hover:scale-[1.01] transition-all group">
                        <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                          <Calendar size={20} className="text-white" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-gray-900 dark:text-white leading-tight">Agenda visual completa</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug mt-1">Drag & drop, automática.</p>
                        </div>
                      </div>

                      <div className="flex gap-4 p-3.5 rounded-2xl glass-widget border border-cyan-500/20 shadow-sm hover:scale-[1.01] transition-all group">
                        <div className="w-10 h-10 rounded-lg bg-cyan-500 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                          <Bot size={20} className="text-white" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-gray-900 dark:text-white leading-tight">Chatbot On Demand</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug mt-1">Nilah informa, tú cierras.</p>
                        </div>
                      </div>

                      <div className="flex gap-4 p-3.5 rounded-2xl glass-widget border border-emerald-500/20 shadow-sm hover:scale-[1.01] transition-all group">
                        <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                          <Bell size={20} className="text-white" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-gray-900 dark:text-white leading-tight">Recordatorios automáticos</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug mt-1">24h y 3h antes de cita.</p>
                        </div>
                      </div>

                      <div className="flex gap-4 p-3.5 rounded-2xl glass-widget border border-blue-500/20 shadow-sm hover:scale-[1.01] transition-all group">
                        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                          <BarChart3 size={20} className="text-white" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-gray-900 dark:text-white leading-tight">Métricas en tiempo real</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug mt-1">Ingresos y confirmadas.</p>
                        </div>
                      </div>
                    </div>

                    <Link 
                      to="/auth?plan=glow"
                      className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-bold text-base hover:bg-emerald-50 hover:border-emerald-200 dark:hover:bg-emerald-500/10 dark:hover:border-emerald-500/30 hover:scale-[1.02] active:scale-95 transition-all mb-6 relative z-10"
                    >
                      Elegir Glow
                      <ArrowRight size={20} />
                    </Link>

                    <div className="mt-auto">
                      <button 
                        onClick={() => setShowMoreBenefits(prev => ({ ...prev, glow: !prev.glow }))}
                        className="flex items-center justify-between w-full text-emerald-600 dark:text-emerald-400 font-bold text-[13px] py-3.5 border-t border-gray-100 dark:border-white/5 group"
                      >
                        <span className="uppercase tracking-widest">Ver todo lo incluido</span>
                        <ChevronDown size={18} className={`transition-transform duration-500 ${showMoreBenefits.glow ? 'rotate-180' : ''}`} />
                      </button>

                      <div className={`overflow-hidden transition-all duration-700 ease-in-out ${showMoreBenefits.glow ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                        <div className="space-y-6 pb-6">
                          <div>
                            <div className="grid grid-cols-1 gap-2">
                              {[
                                'Historial completo de cada clienta', 
                                'Cliente Shield — score de fiabilidad', 
                                'Vista Simple / Avanzado por rol', 
                                'Validación anti doble booking', 
                                'Quick Booking — agenda ultra rápida', 
                                'Bandeja de mensajes centralizada', 
                                'Gestión de equipo y permisos', 
                                'Configuración de servicios y precios', 
                                'Personalidad del bot configurable'
                              ].map((f, i) => (
                                <div key={i} className="flex items-start gap-3 text-sm font-medium text-gray-700 dark:text-gray-300 leading-snug">
                                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                                  <span>{f}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              </ParallaxTiltWrapper>
            </div>

            {/* PLAN GLOW PRO */}
            <div className="h-full relative">
              {/* MÁS VENDIDO BADGE (Fuera del overflow y 3D context para visibilidad total) */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap z-50 tracking-widest animate-pulse border border-white/20">
                MÁS VENDIDO — EL ESTÁNDAR PRO
              </div>

              <ParallaxTiltWrapper className="h-full">
                <div className="neon-border-container relative bg-white dark:bg-[#06040f] rounded-[2rem] p-0.5 shadow-2xl ultra-card-shadow h-full overflow-hidden group">
                  {/* ANIMATED NEON BORDER */}
                  <div className="neon-border-glow" />
                
                <div className="relative z-10 bg-white dark:bg-[#06040f] rounded-[1.95rem] p-6 lg:p-8 flex flex-col h-full">
                  {/* GLOSS EFFECT OVERLAY */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="relative z-10 flex flex-col h-full">
                    {/* PLAN HEADER */}
                    <div className="flex justify-between items-start mb-5">
                      <div>
                        <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Glow Pro</h3>
                        <p className="text-[10px] font-bold text-violet-500 uppercase tracking-widest mt-1">Ecosistema Completo</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                        <Rocket size={20} className="text-white" />
                      </div>
                    </div>
                    
                    {/* Price Display */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-1.5 mb-1">
                        <span className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tighter">${planPrices.pro}</span>
                        <span className="text-gray-500 font-semibold text-xs">USD/mes</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-base font-bold text-violet-600 dark:text-violet-400">S/ {planPrices.pro_pen}<span className="text-xs font-normal">/mes</span></p>
                        <span className="text-xs text-gray-400 line-through font-medium">S/ {planPrices.pro_reg_pen}</span>
                      </div>
                    </div>

                    {/* CORE FEATURES: ULTRA WIDGETS */}
                    <div className="space-y-3 mb-6">
                      {/* #1: EL CORAZÓN */}
                      <div className="flex gap-4 p-3.5 rounded-2xl glass-widget border border-violet-500/20 shadow-sm hover:scale-[1.01] transition-all group">
                        <div className="w-10 h-10 rounded-lg bg-violet-600 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform">
                          <Zap size={20} className="text-white" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-gray-900 dark:text-white leading-tight">Sistema 35/60/90 días</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug mt-1">Rescata clientas olvidadas.</p>
                        </div>
                      </div>

                      {/* #2: VENTAS */}
                      <div className="flex gap-4 p-3.5 rounded-2xl glass-widget border border-amber-500/20 shadow-sm hover:scale-[1.01] transition-all group">
                        <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
                          <Megaphone size={20} className="text-white" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-gray-900 dark:text-white leading-tight">Publicidad WhatsApp</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug mt-1">Lanza ofertas en 2 clicks.</p>
                        </div>
                      </div>

                      {/* #3: DISEÑO */}
                      <div className="flex gap-4 p-3.5 rounded-2xl glass-widget border border-fuchsia-500/20 shadow-sm hover:scale-[1.01] transition-all group">
                        <div className="w-10 h-10 rounded-lg bg-fuchsia-600 flex items-center justify-center shrink-0 shadow-lg shadow-fuchsia-500/20 group-hover:scale-105 transition-transform">
                          <Camera size={20} className="text-white" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-gray-900 dark:text-white leading-tight">Flyers con IA</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug mt-1">Imágenes para tus Historias.</p>
                        </div>
                      </div>
                    </div>

                    {/* STRATEGIC CTA BUTTON */}
                    <Link 
                      to="/auth?plan=pro"
                      className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-base shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-[1.02] active:scale-95 transition-all mb-6 relative z-10"
                    >
                      Agendar mi Demo Glow Pro
                      <ArrowRight size={20} />
                    </Link>

                    {/* CATEGORIZED FULL ECOSYSTEM */}
                    <div className="mt-auto">
                      <button 
                        onClick={() => setShowMoreBenefits(prev => ({ ...prev, pro: !prev.pro }))}
                        className="flex items-center justify-between w-full text-violet-600 dark:text-violet-400 font-bold text-[13px] py-3.5 border-t border-gray-100 dark:border-white/5 group"
                      >
                        <span className="uppercase tracking-widest">Explorar el Ecosistema Pro</span>
                        <ChevronDown size={18} className={`transition-transform duration-500 ${showMoreBenefits.pro ? 'rotate-180' : ''}`} />
                      </button>

                      <div className={`overflow-hidden transition-all duration-700 ease-in-out ${showMoreBenefits.pro ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                        <div className="space-y-6 pb-6">
                          {/* CATEGORY 1 */}
                          <div>
                            <p className="text-[11px] font-bold text-amber-600 uppercase tracking-[0.2em] mb-2.5 flex items-center gap-2">
                              <Target size={14} /> Crecimiento y Escala
                            </p>
                            <div className="grid grid-cols-1 gap-2">
                              {['4 Campañas WhatsApp / mes', 'Asistente de Redacción IA', 'Segmentación de Públicos Pro', 'Medición de Ganancia Real'].map((f, i) => (
                                <div key={i} className="flex items-start gap-3 text-sm font-medium text-gray-700 dark:text-gray-300 leading-snug">
                                  <CheckCircle2 size={15} className="text-amber-500 shrink-0 mt-0.5" />
                                  <span>{f}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* CATEGORY 2 */}
                          <div>
                            <p className="text-[11px] font-bold text-violet-600 uppercase tracking-[0.2em] mb-2.5 flex items-center gap-2">
                              <Settings size={14} /> Operativa Inteligente
                            </p>
                            <div className="grid grid-cols-1 gap-2">
                              {['Tablero de Métricas en Vivo', 'Tu Agenda Priorizada IA', 'Cierre de Caja Automático', 'Manual y Control de Stock'].map((f, i) => (
                                <div key={i} className="flex items-start gap-3 text-sm font-medium text-gray-700 dark:text-gray-300 leading-snug">
                                  <CheckCircle2 size={15} className="text-violet-500 shrink-0 mt-0.5" />
                                  <span>{f}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* CATEGORY 3 */}
                          <div>
                            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-[0.2em] mb-2.5 flex items-center gap-2">
                              <Heart size={14} /> Fidelidad Premium
                            </p>
                            <div className="grid grid-cols-1 gap-2">
                              {['Encuestas de Satisfacción', 'Puntajes de Fidelidad', 'Editor de Fotos Studio', 'Ranking de Personal'].map((f, i) => (
                                <div key={i} className="flex items-start gap-3 text-sm font-medium text-gray-700 dark:text-gray-300 leading-snug">
                                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                                  <span>{f}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              </ParallaxTiltWrapper>
            </div>

            {/* PLAN GLOW ELITE */}
            <div className="h-full relative">
              <ParallaxTiltWrapper className="h-full">
                <div className="neon-border-container relative bg-white dark:bg-[#040b0f] rounded-[2rem] p-0.5 shadow-2xl ultra-card-shadow-cyan h-full overflow-hidden group hover:shadow-cyan-500/30 transition-shadow">
                  <div className="neon-border-glow-cyan" />
                
                <div className="relative z-10 bg-white dark:bg-[#040b0f] rounded-[1.95rem] p-6 lg:p-8 flex flex-col h-full">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-5">
                      <div>
                        <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Glow Elite</h3>
                        <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest mt-1">Operativa sin manual</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                        <Sparkles size={20} className="text-white" />
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <div className="flex items-baseline gap-1.5 mb-1">
                        <span className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tighter">${planPrices.copilot}</span>
                        <span className="text-gray-500 font-semibold text-xs">USD/mes</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-base font-bold text-cyan-600 dark:text-cyan-400">S/ {planPrices.copilot_pen}<span className="text-xs font-normal">/mes</span></p>
                        <span className="text-xs text-gray-400 line-through font-medium">S/ {planPrices.copilot_reg_pen}</span>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex gap-4 p-3.5 rounded-2xl glass-widget border border-cyan-500/20 shadow-sm hover:scale-[1.01] transition-all group">
                        <div className="w-10 h-10 rounded-lg bg-cyan-600 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                          <Bot size={20} className="text-white" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-gray-900 dark:text-white leading-tight">Nilah Lumina</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug mt-1">Briefing y alertas VIP.</p>
                        </div>
                      </div>

                      <div className="flex gap-4 p-3.5 rounded-2xl glass-widget border border-blue-500/20 shadow-sm hover:scale-[1.01] transition-all group">
                        <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                          <MessageCircle size={20} className="text-white" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-gray-900 dark:text-white leading-tight">Inbox 2.0 Premium</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug mt-1">Carpetas, Perfil 360°, Whisper.</p>
                        </div>
                      </div>

                      <div className="flex gap-4 p-3.5 rounded-2xl glass-widget border border-teal-500/20 shadow-sm hover:scale-[1.01] transition-all group">
                        <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center shrink-0 shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
                          <Settings size={20} className="text-white" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-gray-900 dark:text-white leading-tight">Nómina Automática</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug mt-1">Comisiones y reportes reales.</p>
                        </div>
                      </div>

                      <div className="flex gap-4 p-3.5 rounded-2xl glass-widget border border-fuchsia-500/20 shadow-sm hover:scale-[1.01] transition-all group">
                        <div className="w-10 h-10 rounded-lg bg-cyan-600 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                          <Camera size={20} className="text-white" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-gray-900 dark:text-white leading-tight">Estudio Libre Premium</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug mt-1">Visuales IA sin plantillas.</p>
                        </div>
                      </div>
                    </div>

                    <Link 
                      to="/auth?plan=elite"
                      className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-base shadow-xl shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.02] active:scale-95 transition-all mb-6 relative z-10"
                    >
                      Aplicar a Glow Elite
                      <ArrowRight size={20} />
                    </Link>

                    <div className="mt-auto">
                      <button 
                        onClick={() => setShowMoreBenefits(prev => ({ ...prev, elite: !prev.elite }))}
                        className="flex items-center justify-between w-full text-cyan-600 dark:text-cyan-400 font-bold text-[13px] py-3.5 border-t border-gray-100 dark:border-white/5 group"
                      >
                        <span className="uppercase tracking-widest">Ver todo lo incluido</span>
                        <ChevronDown size={18} className={`transition-transform duration-500 ${showMoreBenefits.elite ? 'rotate-180' : ''}`} />
                      </button>

                      <div className={`overflow-hidden transition-all duration-700 ease-in-out ${showMoreBenefits.elite ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                        <div className="space-y-6 pb-6">
                          <div>
                            <div className="grid grid-cols-1 gap-2">
                              {[
                                'LTV Impact Analysis: fidelidad sube el ticket', 
                                'Alerta temprana: clienta VIP en riesgo', 
                                'NPS con segmentación de promotoras', 
                                'Alerta de tasa de canje estancada', 
                                'Bóveda VIP Autónoma (galería asistida)', 
                                'Soporte Prioritario 1 a 1'
                              ].map((f, i) => (
                                <div key={i} className="flex items-start gap-3 text-sm font-medium text-gray-700 dark:text-gray-300 leading-snug">
                                  <CheckCircle2 size={16} className="text-cyan-500 shrink-0 mt-0.5" />
                                  <span>{f}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              </ParallaxTiltWrapper>
            </div>
            
          </div>\n"""
    lines[start_idx:end_idx] = [new_content]
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print('Done replacing.')
else:
    print('Could not find start or end index')
