import fs from 'fs';

let txt = fs.readFileSync('./pages/Landing.tsx', 'utf8');

const replacements = [
  ['?  Dormant', '— Dormant'],
  ['?x ?', '🎨'],
  ['?x ?', '🎨'],
  ['?xܬ', '✍️'],
  ['?x "', '📉'],
  ['?  leído', '— leído'],
  ['?S? Baseline', '💡 Baseline'],
  ['CONTINUACI? N', 'CONTINUACIÓN'],
  ['SOLUCI? N', 'SOLUCIÓN'],
  ['?x &', '🎯'],
  ['RETENCI? N', 'RETENCIÓN'],
  ['leer ?  y responder', 'leer — y responder'],
  ['LUMINA ?  Full', 'LUMINA — Full'],
  ['? ?? ?', '✨'],
  ['?S ', '⚡'],
  ['por qué ?  y', 'por qué — y'],
  ['?a?', '🚀'],
  ['hacer ?  te', 'hacer — te'],
  ['disponibilidad ?  sin', 'disponibilidad — sin'],
  ['?x `', '📊'],
  ['días ?ܬ️', 'días ☀️'],
  ['?ܬ️', '☀️'],
  ['?S  Vas bien', '⚡ Vas bien'],
  ['?a?️', '⚠️'],
  ['?S ', '⚡'],
  ['?x  ️', '⚡️'],
  ['nuevo ?  también', 'nuevo — también'],
  ['?S  En', '⚡ En'],
  ['?x 9', '📋'],
  ['?x ?', '💬'],
  ['?x "', '⏸️'],
  ['solo ?  tú', 'solo — tú'],
  ['?x  ', '🕐'],
  ['?x   ', '🟢'],
  ['?x & Casual', '⭐ Casual'],
  ['bajo ?  Pedir', 'bajo — Pedir'],
  ['2:47 PM ?S ?S ', '2:47 PM ✓✓'],
  ['?x " Bot', '⏸️ Bot'],
  ['contigo ?  no', 'contigo — no'],
  ['adicional ?  es', 'adicional — es'],
  ['marca ?  y crea', 'marca — y crea'],
  ['acrílicas ?  julio', 'acrílicas — julio'],
  ['?x & Pestañas', '🎯 Pestañas'],
  ['?xR? Clientas', '🌟 Clientas'],
  ['?x } Todas', '👥 Todas'],
  ['?x ? Realista', '📸 Realista'],
  ['?S? Minimal', '✨ Minimal'],
  ['?x ? Glamour', '💎 Glamour'],
  ['?S& Paleta', '🎨 Paleta'],
  ['?S& Voz', '🗣️ Voz'],
  ['?S& Listo', '✅ Listo'],
  ['GLOW ?S?', 'GLOW VIP'],
  ['?xR?', '✨'],
  ['?x ?', '📸'],
  ['?x ?', '🎨'],
  ['?x ?️', '🖼️'],
  ['estilo ?  Realista', 'estilo — Realista'],
  ['formato ?  Post', 'formato — Post'],
  ['?S? Minimalista', '✨ Minimalista'],
  ['tienes ?  con', 'tienes — con'],
  ['DESPU?0S', 'DESPUÉS'],
  ['?xRx Exclusivo', '💎 Exclusivo'],
  ['quieras ?  Nilah', 'quieras — Nilah'],
  ['libre ?  ejemplos', 'libre — ejemplos'],
  ['semana ?  sin', 'semana — sin'],
  ['?x & Jun', '📅 Jun'],
  ['?x & May', '📅 May'],
  ['?x & Abr', '📅 Abr'],
  ['$100? $200', '$100 - $200'],
  ['S/ 390? S/ 750', 'S/ 390 - S/ 750'],
  ['C? MO FUNCIONA', 'CÓMO FUNCIONA'],
  ['?x ?', '⚙️'],
  ['?a"️', '👀'],
  ['?xa?', '🚀'],
  ['activo ?  primeros', 'activo — primeros'],
  ['inteligente ?  ninguna', 'inteligente — ninguna'],
  ['?S? Nilah Creative', '🎨 Nilah Creative'],
  ['?x ?️', '⚡'],
  ['$15 USD ?  pago', '$15 USD — pago'],
  ['hacer ?  y lo', 'hacer — y lo'],
  ['Lumina ?  Ejecutivo', 'Lumina — Ejecutivo'],
  ['?x S', '❤️'],
  ['?S\u001c', '⚡'],
  ['?\x1d', '—'],
  ['?x\x1c`', '📊'],
  ['?a?️', '⚠️'],
  ['?x\x1c0', '⚙️'],
  ['?x\x19&', '🎯'],
  ['?S\x1c&', '✅']
];

replacements.forEach(([broken, fixed]) => {
  txt = txt.replaceAll(broken, fixed);
});

// General cleanup for lingering ones
txt = txt.replace(/\?[a-zA-Z\W]{1,3}(?=\s| [a-z]|\")/g, '✨');

// Remove the creative markup
const animStartRegex = /\{\/\* ✨ Animated Mockup Central ✨ \*\/\}[\s\S]*?\{\/\* ✨ Tabs Navigation ✨ \*\/\}/;
txt = txt.replace(animStartRegex, '{/* ✨ Tabs Navigation ✨ */}');

fs.writeFileSync('./pages/Landing.tsx', txt);
console.log('Fixed file');
