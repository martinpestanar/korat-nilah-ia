const fs = require('fs');
const content = fs.readFileSync('src/pages/CRM.tsx', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes("postCitaTab === 'calificaciones'"));
console.log(lines.slice(start, start + 120).join('\n'));
