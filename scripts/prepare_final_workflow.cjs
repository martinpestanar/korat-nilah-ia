const fs = require('fs');

const path = 'C:/Users/Martin/.gemini/antigravity/brain/98d4cf91-f5c9-4cd1-a376-905ce6470218/.system_generated/steps/164/output.txt';
const raw = fs.readFileSync(path, 'utf8');
const data = JSON.parse(raw);
const wf = data.data || data;

const credId = wf.nodes.find(n => n.type === 'n8n-nodes-base.supabase')?.credentials?.supabaseApi?.id || 'YlSUI38ukE7hX1FQ';

const nuevoNodo = {
  parameters: {
    method: 'POST',
    url: 'https://cfggpqpbqqeavdbdzwoz.supabase.co/rest/v1/rpc/fn_procesar_calificacion_cliente',
    authentication: 'predefinedCredentialType',
    nodeCredentialType: 'supabaseApi',
    sendBody: true,
    specifyBody: 'json',
    jsonBody: '={\n  "p_telefono": "{{ $(\'When Executed by Another Workflow\').first().json.telefono }}",\n  "p_calificacion": {{ $(\'When Executed by Another Workflow\').first().json.calificacion }},\n  "p_cita_id": {{ $(\'Buscar la Cita Pendiente\').first().json.id }}\n}',
    options: {}
  },
  credentials: {
    supabaseApi: {
      id: credId,
      name: 'Supabase account'
    }
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

// Reemplazar o insertar
const idx = wf.nodes.findIndex(n => n.name === nuevoNodo.name);
if (idx >= 0) {
  wf.nodes[idx] = nuevoNodo;
} else {
  wf.nodes.push(nuevoNodo);
}

// Conectar "Actualizar Registro" -> "Procesar Fidelizacion y Sellos RPC"
wf.connections['Actualizar Registro'] = {
  main: [
    [
      {
        node: nuevoNodo.name,
        type: 'main',
        index: 0
      }
    ]
  ]
};

fs.writeFileSync('scripts/updated_wf_guardarCalificacion.json', JSON.stringify({
  nodes: wf.nodes,
  connections: wf.connections,
  settings: wf.settings,
  name: wf.name
}, null, 2));

console.log('✓ Archivo final con credenciales listo.');
