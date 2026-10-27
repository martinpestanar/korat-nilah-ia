const fs = require('fs');
let code = fs.readFileSync('src/components/Engagement/RatingsList.tsx', 'utf8');

// Reemplazar la renderización de la tarjeta para mostrar:
// 1. Staff Name en una pill sutil
// 2. Comentario del feedback en cursiva si existe
const targetOld = `<p className="text-xs text-gray-400 truncate">{rating.serviceName || 'Servicio'}</p>
                                </div>`;

const targetNew = `<div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{rating.serviceName || 'Servicio'}</p>
                                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200/50 dark:border-violet-800/40">
                                            👤 {rating.staffName || 'Atención General'}
                                        </span>
                                    </div>
                                    {rating.comment && rating.comment.trim() && (
                                        <p className="mt-1.5 text-xs text-gray-700 dark:text-gray-200 italic bg-white/70 dark:bg-black/20 p-2 rounded-lg border border-gray-100 dark:border-white/5">
                                            "{rating.comment}"
                                        </p>
                                    )}
                                </div>`;

// Manejar saltos de línea Windows o Linux
if (code.includes(targetOld)) {
  code = code.replace(targetOld, targetNew);
  fs.writeFileSync('src/components/Engagement/RatingsList.tsx', code, 'utf8');
  console.log('RatingsList.tsx: Comentario y StaffName agregados a cada tarjeta.');
} else {
  // Intentar con CRLF
  const targetOldCRLF = targetOld.replace(/\n/g, '\r\n');
  const targetNewCRLF = targetNew.replace(/\n/g, '\r\n');
  if (code.includes(targetOldCRLF)) {
    code = code.replace(targetOldCRLF, targetNewCRLF);
    fs.writeFileSync('src/components/Engagement/RatingsList.tsx', code, 'utf8');
    console.log('RatingsList.tsx (CRLF): Comentario y StaffName agregados con éxito.');
  } else {
    console.log('No se encontró el target en RatingsList.tsx.');
  }
}
