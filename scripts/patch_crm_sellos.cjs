const fs = require('fs');

const path = 'src/pages/CRM.tsx';
let content = fs.readFileSync(path, 'utf-8');

// 1. Reemplazar sub-tabs de navegación
const oldTabsBlock = `                    {/* Sub-pestañas de Navegación Post-Cita - 100% Mobile First con Scroll Horizontal */}
                    <div className="flex gap-1.5 rounded-2xl bg-gray-100/90 dark:bg-white/5 p-1.5 border border-gray-200/60 dark:border-white/10 overflow-x-auto no-scrollbar scrollbar-hide max-w-full sm:max-w-xl pb-1" style={{ scrollbarWidth: 'none' }}>
                        {([
                            { id: 'calificaciones', label: 'Calificaciones', icon: MessageSquare, badge: '⭐', featureKey: 'feedback' },
                            { id: 'puntos', label: 'Puntos & Ranking', icon: Crown, badge: '🏆', featureKey: 'fidelizacion' },
                            { id: 'premios', label: 'Premios & Canjes', icon: Gift, badge: '🎁', featureKey: 'fidelizacion' },
                            { id: 'inteligencia', label: 'Análisis', icon: Brain, badge: '📊', featureKey: 'analisis' },
                        ] as const)
                        .filter(tab => hasSaaSFeature('crm', tab.featureKey))`;

const newTabsBlock = `                    {/* Sub-pestañas de Navegación Post-Cita - 100% Mobile First con Scroll Horizontal */}
                    <div className="flex gap-1.5 rounded-2xl bg-gray-100/90 dark:bg-white/5 p-1.5 border border-gray-200/60 dark:border-white/10 overflow-x-auto no-scrollbar scrollbar-hide max-w-full sm:max-w-xl pb-1" style={{ scrollbarWidth: 'none' }}>
                        {(isSellosMode ? [
                            { id: 'calificaciones' as const, label: 'Calificaciones & Staff', icon: MessageSquare, badge: '⭐', featureKey: 'feedback' },
                            { id: 'sellos' as const, label: 'Club Glow Sellos', icon: Crown, badge: '👑', featureKey: 'fidelizacion' },
                            { id: 'inteligencia' as const, label: 'Análisis', icon: Brain, badge: '📊', featureKey: 'analisis' },
                        ] : [
                            { id: 'calificaciones' as const, label: 'Calificaciones', icon: MessageSquare, badge: '⭐', featureKey: 'feedback' },
                            { id: 'puntos' as const, label: 'Puntos & Ranking', icon: Crown, badge: '🏆', featureKey: 'fidelizacion' },
                            { id: 'premios' as const, label: 'Premios & Canjes', icon: Gift, badge: '🎁', featureKey: 'fidelizacion' },
                            { id: 'inteligencia' as const, label: 'Análisis', icon: Brain, badge: '📊', featureKey: 'analisis' },
                        ])
                        .filter(tab => hasSaaSFeature('crm', tab.featureKey))`;

if (content.includes(oldTabsBlock.replace(/\r?\n/g, '\n'))) {
    content = content.replace(oldTabsBlock.replace(/\r?\n/g, '\n'), newTabsBlock);
    console.log('1. Sub-tabs reemplazadas con éxito (LF)');
} else if (content.includes(oldTabsBlock.replace(/\r?\n/g, '\r\n'))) {
    content = content.replace(oldTabsBlock.replace(/\r?\n/g, '\r\n'), newTabsBlock.replace(/\n/g, '\r\n'));
    console.log('1. Sub-tabs reemplazadas con éxito (CRLF)');
} else {
    console.warn('1. Warning: oldTabsBlock no encontrado literalmente');
}

// 2. Reemplazar columna derecha en calificaciones
const oldRightCol = `                                <div className="xl:col-span-2 space-y-4">
                                    <ClientesCercaDePremio clientes={currentCercaDePremio} maxItems={4} umbralPuntos={50} />
                                    <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-purple-500/10 to-pink-500/5 border border-amber-500/20">
                                        <div className="flex items-center gap-2 mb-2 text-amber-700 dark:text-amber-300 text-xs font-bold">
                                            <Sparkles size={14} />
                                            <span>¿Cómo funciona el flujo post-cita?</span>
                                        </div>
                                        <p className="text-[11px] leading-relaxed text-gray-600 dark:text-gray-300">
                                            30 minutos después de terminar la cita, Nilah envía una encuesta de satisfacción (1 al 5). 
                                            Si responden <b>4 o 5 estrellas</b>, reciben puntos automáticos y el avance hacia su premio. 
                                            Si responden <b>1, 2 o 3</b>, el bot se pausa para que puedas comunicarte y solucionar la queja de inmediato.
                                        </p>
                                    </div>
                                </div>`;

const newRightCol = `                                <div className="xl:col-span-2 space-y-4">
                                    {isSellosMode ? (
                                        <>
                                            {/* ── RENDIMIENTO Y RANKING DEL STAFF ── */}
                                            <StaffRankingWidget rankings={statsReal?.staffRanking || []} />

                                            {/* ── MÉTRICAS VISUALES DE SATISFACCIÓN DEL EQUIPO ── */}
                                            <div className="p-4 rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border shadow-xs space-y-3">
                                                <div className="flex items-center justify-between border-b border-gray-100 dark:border-dark-border pb-2">
                                                    <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                                                        <span>📊</span> Desempeño del Equipo
                                                    </span>
                                                    <span className="text-[10px] bg-amber-100 text-amber-800 font-black px-2 py-0.5 rounded-full">
                                                        Club Glow VIP
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 dark:bg-amber-500/10 dark:border-amber-500/20">
                                                        <span className="text-[10px] text-amber-800 dark:text-amber-300 font-bold block">Promedio Calidad</span>
                                                        <span className="text-base font-black text-amber-950 dark:text-amber-200 flex items-center gap-1">
                                                            {statsReal?.promedio ? statsReal.promedio.toFixed(1) : '5.0'}
                                                            <span className="text-xs text-amber-500">⭐</span>
                                                        </span>
                                                    </div>
                                                    <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/60 dark:bg-emerald-500/10 dark:border-emerald-500/20">
                                                        <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold block">Satisfacción Positiva</span>
                                                        <span className="text-base font-black text-emerald-950 dark:text-emerald-200">
                                                            {statsReal?.total ? Math.round(((calificaciones.filter(c => (c.score || 0) >= 4).length) / Math.max(1, statsReal.total)) * 100) : 100}%
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => navigate('/loyalty')}
                                                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-black text-xs shadow-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                                                >
                                                    <span>👑</span>
                                                    <span>Ver Tarjeta Digital Club Glow</span>
                                                </button>
                                            </div>

                                            {/* Banner explicativo del flujo de Sellos */}
                                            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-purple-500/10 to-pink-500/5 border border-amber-500/20">
                                                <div className="flex items-center gap-2 mb-2 text-amber-700 dark:text-amber-300 text-xs font-bold">
                                                    <Sparkles size={14} />
                                                    <span>Flujo de Sellos & Calificación Activo</span>
                                                </div>
                                                <p className="text-[11px] leading-relaxed text-gray-600 dark:text-gray-300">
                                                    Al terminar cada cita, se envía la encuesta 1 a 5 ⭐ por WhatsApp. Si califican <b>4 o 5 estrellas</b>, suman +1 sello a su tarjeta digital hacia su próximo premio hito y suman puntuación al staff. Si califican <b>1, 2 o 3</b>, el bot se pausa 24 horas para dar paso a atención humana y programa su reconciliación.
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <ClientesCercaDePremio clientes={currentCercaDePremio} maxItems={4} umbralPuntos={50} />
                                            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-purple-500/10 to-pink-500/5 border border-amber-500/20">
                                                <div className="flex items-center gap-2 mb-2 text-amber-700 dark:text-amber-300 text-xs font-bold">
                                                    <Sparkles size={14} />
                                                    <span>¿Cómo funciona el flujo post-cita?</span>
                                                </div>
                                                <p className="text-[11px] leading-relaxed text-gray-600 dark:text-gray-300">
                                                    30 minutos después de terminar la cita, Nilah envía una encuesta de satisfacción (1 al 5). 
                                                    Si responden <b>4 o 5 estrellas</b>, reciben puntos automáticos y el avance hacia su premio. 
                                                    Si responden <b>1, 2 o 3</b>, el bot se pausa para que puedas comunicarte y solucionar la queja de inmediato.
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>`;

if (content.includes(oldRightCol.replace(/\r?\n/g, '\n'))) {
    content = content.replace(oldRightCol.replace(/\r?\n/g, '\n'), newRightCol);
    console.log('2. Columna derecha reemplazada con éxito (LF)');
} else if (content.includes(oldRightCol.replace(/\r?\n/g, '\r\n'))) {
    content = content.replace(oldRightCol.replace(/\r?\n/g, '\r\n'), newRightCol.replace(/\n/g, '\r\n'));
    console.log('2. Columna derecha reemplazada con éxito (CRLF)');
} else {
    console.warn('2. Warning: oldRightCol no encontrado literalmente');
}

// 3. Renderizar subpestaña 'sellos'
const sellosTabBlock = `                    {/* SUB-PESTAÑA CLUB GLOW SELLOS (SOLO EN MODO SELLOS) */}
                    {isSellosMode && postCitaTab === 'sellos' && (
                        <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-white dark:to-dark-card border border-amber-500/20 shadow-xs space-y-5">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <span className="p-3 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-black text-2xl font-black shadow-xs">👑</span>
                                    <div>
                                        <h3 className="text-base font-black text-gray-900 dark:text-white">Programa de Sellos Digitales Club Glow Activo</h3>
                                        <p className="text-xs text-gray-600 dark:text-gray-300">Este salón opera en el sistema de Sellos VIP por visitas en lugar de puntos tradicionales.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate('/loyalty')}
                                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs shadow-md hover:from-amber-600 hover:to-yellow-500 active:scale-95 transition-all cursor-pointer"
                                >
                                    Abrir Gestor de Sellos & Premios →
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                                <div className="p-4 rounded-2xl bg-white dark:bg-dark-bg border border-slate-200/60 dark:border-dark-border">
                                    <span className="text-xs font-bold text-slate-500 block">Formato Activo</span>
                                    <span className="text-sm font-black text-amber-900 dark:text-amber-300">12 Sellos Progresivos</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-white dark:bg-dark-bg border border-slate-200/60 dark:border-dark-border">
                                    <span className="text-xs font-bold text-slate-500 block">Hitos con Premio</span>
                                    <span className="text-sm font-black text-amber-900 dark:text-amber-300">Sellos 4, 8 y 12 (3D)</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-white dark:bg-dark-bg border border-slate-200/60 dark:border-dark-border">
                                    <span className="text-xs font-bold text-slate-500 block">Acreditación</span>
                                    <span className="text-sm font-black text-emerald-800 dark:text-emerald-300">Automática tras 4-5 ⭐</span>
                                </div>
                            </div>
                        </div>
                    )}`;

const marker = '{/* SUB-PESTAÑA 2: PUNTOS & RANKING */}';
if (content.includes(marker)) {
    content = content.replace(marker, `${sellosTabBlock}\n\n                    ${marker}`);
    console.log('3. Sub-pestaña sellos agregada con éxito');
}

fs.writeFileSync(path, content, 'utf-8');
console.log('CRM.tsx actualizado exitosamente.');
