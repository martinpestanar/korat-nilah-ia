const fs = require('fs');
const filepath = 'C:/Users/Martin/.gemini/antigravity/brain/ce08d61b-bd99-4c13-9d54-fdc58bf6cf77/.system_generated/steps/108/output.txt';
const txt = fs.readFileSync(filepath, 'utf8');
const start = txt.indexOf('{');
const wf = JSON.parse(txt.slice(start)).data;

console.log("Nodes targeting 'Enviar Parte 1':");
const incomingConns = Object.entries(wf.connections).filter(([nodeName, conns]) => {
  return JSON.stringify(conns).includes('Enviar Parte 1');
});
console.log(JSON.stringify(incomingConns, null, 2));

console.log("Nodes targeting 'Enviar Parte 2':");
const incomingConns2 = Object.entries(wf.connections).filter(([nodeName, conns]) => {
  return JSON.stringify(conns).includes('Enviar Parte 2');
});
console.log(JSON.stringify(incomingConns2, null, 2));
