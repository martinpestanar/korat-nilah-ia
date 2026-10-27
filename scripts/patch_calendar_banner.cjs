const fs = require('fs');
let code = fs.readFileSync('src/pages/Calendar.tsx', 'utf8');

const target = '{/* TARJETA ESCUDO ANTI NO-SHOW: CASO ALTO RIESGO */}';
const bannerHtml = `{/* BANNER VIP SUTIL: PREMIO DISPONIBLE EN CLUB GLOW (Mobile First) */}
                            {clientPendingPrize && (
                              <div className="rounded-xl border border-amber-300/80 dark:border-amber-500/40 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50/50 dark:from-amber-950/40 dark:to-yellow-950/20 px-3 py-2 flex items-center justify-between gap-2 shadow-xs animate-in slide-in-from-top-1 duration-150">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                                    <Gift size={13} />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-[11px] font-black tracking-tight text-amber-900 dark:text-amber-200">
                                        ¡Regalo Club Glow Pendiente!
                                      </span>
                                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-amber-200/80 dark:bg-amber-400/20 text-amber-800 dark:text-amber-300">
                                        Sello #{clientPendingPrize.hito_sello}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-amber-800/90 dark:text-amber-300/80 font-medium truncate">
                                      {clientPendingPrize.nombre}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-white/80 dark:bg-black/30 border border-amber-300/60 dark:border-amber-500/30 px-2 py-1 rounded-lg shrink-0">
                                  Recuérdaselo ✨
                                </span>
                              </div>
                            )}

                            ${target}`;

if (code.includes(target)) {
  code = code.replace(target, bannerHtml);
  fs.writeFileSync('src/pages/Calendar.tsx', code, 'utf8');
  console.log('Calendar.tsx: Banner VIP sutil insertado con éxito.');
} else {
  console.log('Target no encontrado.');
}
