const fs = require('fs');

const raw = fs.readFileSync('C:/Users/Martin/.gemini/antigravity/brain/98d4cf91-f5c9-4cd1-a376-905ce6470218/.system_generated/steps/1102/output.txt', 'utf8');
const res = JSON.parse(raw);
const wf = res.data;

const node = wf.nodes.find(n => n.name === 'clasificar_intencion_ia');
console.log('Old jsonBody:', node.parameters.jsonBody);

node.parameters.jsonBody = "={\n  \"p_business_id\": \"{{ $('Unificar Texto- Identidad Cliente').first().json.business_id }}\",\n  \"p_telefono\": \"{{ $('Unificar Texto- Identidad Cliente').first().json.sender_phone }}\",\n  \"p_mensaje_entrante\": \"{{ $('Unificar Texto- Identidad Cliente').first().json.input_final }}\",\n  \"p_intencion\": \"positiva\"\n}";

console.log('New jsonBody:', node.parameters.jsonBody);

fs.writeFileSync('scripts/fixed_wf_nilah.json', JSON.stringify({
  nodes: wf.nodes,
  connections: wf.connections,
  settings: wf.settings,
  name: wf.name
}, null, 2));

console.log('Written scripts/fixed_wf_nilah.json');
