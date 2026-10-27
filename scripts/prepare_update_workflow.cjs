const fs = require('fs');

const path = 'C:/Users/Martin/.gemini/antigravity/brain/98d4cf91-f5c9-4cd1-a376-905ce6470218/.system_generated/steps/164/output.txt';
const raw = fs.readFileSync(path, 'utf8');
const data = JSON.parse(raw);
const wf = data.data || data;

// Agregar nodo HTTP Request que llama a fn_procesar_calificacion_cliente
const nuevoNodo = {
  parameters: {
    method: 'POST',
    url: 'https://cfggpqpbqqeavdbdzwoz.supabase.co/rest/v1/rpc/fn_procesar_calificacion_cliente',
    authentication: 'predefinedCredentialType',
    nodeCredentialType: 'supabaseApi',
    sendHeaders: true,
    headerParameters: {
      parameters: [
        {
          name: 'apikey',
          value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmZ2dwcXBicXFlYXZkYmR6d296Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDI4MzUzNSwiZXhwIjoyMDU1ODU5NTM1fQ.t9G-hO_WqYwzL_iF3a2M1g5mKk7nQ8p_dummy_token'
        }
      ]
    },
    sendBody: true,
    specifyBody: 'json',
    jsonBody: '={\n  "p_telefono": "{{ $(\'When Executed by Another Workflow\').first().json.telefono }}",\n  "p_calificacion": {{ $(\'When Executed by Another Workflow\').first().json.calificacion }},\n  "p_cita_id": {{ $(\'Buscar la Cita Pendiente\').first().json.id }}\n}',
    options: {}
  },
  id: 'd9b0e123-4567-489a-bcde-f123456789ab',
  name: 'Procesar Fidelizacion y Sellos RPC',
  type: 'n8n-nodes-base.httpRequest',
  typeVersion: 4.2,
  position: [
    (wf.nodes.find(n => n.name === 'Actualizar Registro')?.position[0] || 900) + 250,
    wf.nodes.find(n => n.name === 'Actualizar Registro')?.position[1] || 300
  ]
};

// Verificar si ya existe
if (!wf.nodes.some(n => n.name === nuevoNodo.name)) {
  wf.nodes.push(nuevoNodo);
}

// Conectar "Actualizar Registro" -> "Procesar Fidelizacion y Sellos RPC"
if (!wf.connections['Actualizar Registro']) {
  wf.connections['Actualizar Registro'] = { main: [[]] };
}
wf.connections['Actualizar Registro'].main = [
  [
    {
      node: nuevoNodo.name,
      type: 'main',
      index: 0
    }
  ]
];

console.log('Nodos resultantes:', wf.nodes.map(n => n.name));
console.log('Conexión:', JSON.stringify(wf.connections['Actualizar Registro']));

fs.writeFileSync('scripts/updated_wf_guardarCalificacion.json', JSON.stringify({
  nodes: wf.nodes,
  connections: wf.connections,
  settings: wf.settings,
  name: wf.name
}, null, 2));
console.log('✓ Archivo updated_wf_guardarCalificacion.json generado.');
