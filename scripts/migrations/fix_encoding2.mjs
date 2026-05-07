import fs from 'fs';

const file = 'c:/Users/Martin/Documents/Korat-Flow-Agencia/Korat_MVP/pages/Landing.tsx';
let c = fs.readFileSync(file, 'utf8');

const map = {
  '\?\\x1d': '—',
  '\\?x\\?\\?': '🤖',
  '\\?x\\?': '📱',
  '\\?x"': '✋',
  '\\?xS': '💜',
  '\\?\\x1c': '→',
  '\\?\\x19': '→',
  '\\?altimo': 'Último',
  'CAMPA\\?\\x18AS': 'CAMPAÑAS',
  '\\?xR\\&': '👀',
  '\\?x\\x18\\x18': '⭐',
  '\\?S\\?': '👋',
  '\\?xR~': '🔄',
  '\\?x\\x19\\?': '💸',
  '\\?x\\x1c0': '🔥',
  '\\?S\\x1c': '📈',
  '\\?x': '📊',
};

// General string replacements based on literal question marks left by the \uFFFD conversion
c = c.replace(/SECCI\?N/g, 'SECCIÓN')
     .replace(/SECCI\?\x1cN/g, 'SECCIÓN')
     .replace(/QU\?0 HACEMOS/g, 'QUÉ HACEMOS')
     .replace(/QU\? HACEMOS/g, 'QUÉ HACEMOS');

// Replace the literal "?" and its adjacent corrupted chars based on context clues:
c = c.replace(/\?x\?\?/g, '🤖');
c = c.replace(/\?x\?/g, '📱');
c = c.replace(/\?x"/g, '✋');
c = c.replace(/\?xS/g, '💜');
c = c.replace(/\?altimo/g, 'Último');
c = c.replace(/CAMPA\?\x18AS/g, 'CAMPAÑAS');

// Replace literal "?" characters acting as bullets or emojis by testing context
c = c.replace(/icon: '\?xR\&'/g, "icon: '👀'");
c = c.replace(/icon: '\?x\x18\x18'/g, "icon: '⭐'");
c = c.replace(/icon: '\?S\?'/g, "icon: '👋'");
c = c.replace(/icon: '\?xR~'/g, "icon: '🔄'");
c = c.replace(/icon: '\?x\x19\?'/g, "icon: '💸'");
c = c.replace(/icon: '\?x\x1c0'/g, "icon: '🔥'");
c = c.replace(/icon: '\?x'/g, "icon: '📊'");

c = c.replace(/esperan recibir \?\x1d/g, 'esperan recibir —');
c = c.replace(/hace 60 días \?\x1d/g, 'hace 60 días —');
c = c.replace(/una estimación \?\x1d/g, 'una estimación —');
c = c.replace(/tu cita es mañana a las 3pm" \?\x1d/g, 'tu cita es mañana a las 3pm" —');
c = c.replace(/alguien \?\x1d disponible/g, 'alguien — disponible');
c = c.replace(/Lumina es ese alguien \?\x1d/g, 'Lumina es ese alguien —');
c = c.replace(/Vas bien." \?S\x1c"/g, 'Vas bien." 📈"');
c = c.replace(/\?x NUEVA SOLICITUD/g, '📲 NUEVA SOLICITUD');
c = c.replace(/\?x\x19\? Lo que pierde/g, '💸 Lo que pierde');

c = c.replace(/Ver planes de nuevo ↑\?4\} \/> Quiero una demo →ahora/g, 'Ver planes →');

fs.writeFileSync(file, c, 'utf8');
console.log('Fixed broken emojis and characters.');
