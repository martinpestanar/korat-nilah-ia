import { readFileSync, writeFileSync } from 'fs';

const file = 'pages/Landing.tsx';
let c = readFileSync(file, 'utf8');

// Fix section comments (control char 0x1C broke SECCIÓN)
c = c.replace(/SECCI\?\x1cN/g, 'SECCIÓN');
c = c.replace(/SECCI\?N/g, 'SECCIÓN');

// Fix QUÉ
c = c.replace(/QU\?0 HACEMOS/g, 'QUÉ HACEMOS');
c = c.replace(/QU\? HACEMOS/g, 'QUÉ HACEMOS');

// Fix heart emoji in footer
c = c.replace(/Hecho con \?xS en/g, 'Hecho con 💜 en');
c = c.replace(/Hecho con \? en/g, 'Hecho con 💜 en');

// Fix the broken CTA line at the end (garbled merge)
c = c.replace(/Ver planes de nuevo ↑\?4\} \/> Quiero una demo →ahora/g, 'Ver planes →');

// Fix emoji icon entries in chatbot section (lines 913-916)
c = c.replace(/icon: '\?x\?\?'/g, "icon: '🤖'");
c = c.replace(/icon: '\?x\?'/g,   "icon: '📱'");
c = c.replace(/icon: '\?x\"'/g,   "icon: '✋'");
c = c.replace(/icon: '\?x'/g,     "icon: '📊'");

// Fix chatbot section header mock (line 943)
c = c.replace(/\?x NUEVA SOLICITUD/g, '📲 NUEVA SOLICITUD');

// Fix any remaining isolated ? that came from the emoji mangling after the section comment fix
c = c.replace(/SECCI\?N/g, 'SECCIÓN');

writeFileSync(file, c, 'utf8');
console.log('Landing.tsx encoding fixed successfully.');
