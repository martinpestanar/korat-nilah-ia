const fs = require('fs');

const data = JSON.parse(fs.readFileSync('C:/Users/Martin/.gemini/antigravity/brain/2ec1937e-4ceb-4093-b71c-94fb3a92b204/.system_generated/steps/279/output.txt', 'utf8'));

const nodes = data.data.nodes;
const connections = data.data.connections;

console.log('--- NODES WITH CHATWOOT ---');
nodes.forEach(n => {
  const str = JSON.stringify(n).toLowerCase();
  if (str.includes('chatwoot') || n.name.toLowerCase().includes('chatwoot')) {
    console.log(\`- \${n.name} (\${n.type}) [id: \${n.id}]\`);
  }
});

console.log('\\n--- WEBHOOK NODES ---');
nodes.filter(n => n.type.includes('webhook')).forEach(n => {
  console.log(\`- \${n.name} [id: \${n.id}]\`);
});

console.log('\\n--- POST-AI SENDING NODES ---');
// Nodos que envían la respuesta, suelen ser HTTP Request cerca del final
nodes.filter(n => n.type === 'n8n-nodes-base.httpRequest' && !JSON.stringify(n).toLowerCase().includes('chatwoot')).forEach(n => {
  console.log(\`- \${n.name} [id: \${n.id}]\`);
});

// Edit Fields
console.log('\\n--- SET/EDIT FIELDS NODES ---');
nodes.filter(n => n.type.includes('set')).forEach(n => {
  console.log(\`- \${n.name} [id: \${n.id}]\`);
});
