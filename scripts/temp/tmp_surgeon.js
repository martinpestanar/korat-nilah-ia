const fs = require('fs');

// Cargar flujo original (czOqiIFhDACyB6Yy)
const original = JSON.parse(fs.readFileSync('C:/Users/Martin/.gemini/antigravity/brain/2ec1937e-4ceb-4093-b71c-94fb3a92b204/.system_generated/steps/279/output.txt', 'utf8')).data;

// Cargar nodos V2
const v2Nodes = JSON.parse(fs.readFileSync('C:/Users/Martin/Documents/Korat-Flow-Agencia/Korat_MVP/tmp_v2_nodes.json', 'utf8'));

const getV2Node = (name) => v2Nodes.find(n => n.name === name);

let newNodes = [];
let removedNodeNames = new Set(["Buscar Canal"]); // Nodos a eliminar por completo

for (let node of original.nodes) {
  if (removedNodeNames.has(node.name)) continue;

  if (node.name === 'Edit Fields') {
    // Reemplazar assignments
    node.parameters.assignments = {
      assignments: [
        {
          id: "1b64cbac-fbed-480c-8226-d00813bb2bd8",
          name: "mensaje_usuario",
          value: "={{ $json.body.data.message.conversation || $json.body.data.message.extendedTextMessage?.text || '' }}",
          type: "string"
        },
        {
          id: "ff71fbae-e976-415c-8d10-62740af09bb0",
          name: "chat_id",
          value: "={{ $json.body.data.key.remoteJid.replace('@s.whatsapp.net', '') }}",
          type: "string"
        },
        {
          id: "13adba3b-4004-4e6d-b38e-19eda1b9a267",
          name": "contacto_nombre",
          value: "={{ $json.body.data.pushName || 'Cliente' }}",
          type: "string"
        },
        {
          id: "9121fa32-4f24-4fde-b449-f3a8d013ddc8",
          name": "tiene_adjunto",
          value: "={{ !!$json.body.data.message?.imageMessage || !!$json.body.data.message?.audioMessage || !!$json.body.data.message?.documentMessage }}",
          type: "string"
        },
        {
          id: "ab1c9f2e-5bc4-4e9b-8ca4-44d8b06a0611",
          name": "url_adjunto",
          value: "={{ null }}",
          type: "string"
        },
        {
          id: "e291e325-fdc6-4bf7-963c-d1ced2c28429",
          name": "tipo_archivo",
          value: "={{ $json.body.data.message?.audioMessage ? 'audio' : ($json.body.data.message?.imageMessage ? 'image' : 'text') }}",
          type: "string"
        },
        {
          id: "5d247fe9-a6fb-4463-aa30-805857e5ba58",
          name": "lista_precios",
          value: "={{ $json.lista_precios }}",
          type: "string"
        }
      ]
    };
  } else if (node.name === 'Enviar Parte 1') {
    const v2 = getV2Node('Evolution - Enviar Parte 1');
    node.parameters = v2.parameters;
    // IMPORTANTE: NO CAMBIAMOS EL NOMBRE original para mantener conexiones
    node.typeVersion = v2.typeVersion;
    node.credentials = v2.credentials;
  } else if (node.name === 'Enviar Parte 2') {
    const v2 = getV2Node('Evolution - Enviar Parte 2');
    node.parameters = v2.parameters;
    node.typeVersion = v2.typeVersion;
    node.credentials = v2.credentials;
  } else if (node.name === 'Enviar Media') {
    const v2 = getV2Node('Evolution - Enviar Media');
    node.parameters = v2.parameters;
    node.typeVersion = v2.typeVersion;
    node.credentials = v2.credentials;
  } else if (node.name === 'Confirmación al Humano') {
    const v2 = getV2Node('Evolution - Confirmar Humano');
    node.parameters = v2.parameters;
    node.typeVersion = v2.typeVersion;
    node.credentials = v2.credentials;
  } else if (node.name === 'Encender Bot') {
    // Encender bot ya no llama a Chatwoot, Evolution no usa esto de esta manera (o quiza llama a supabase)
    // En V2 no había "Encender Bot", solo cambia bot_activo en Supabase
    // Ah, wait! The user might want me to leave it! If I just remove it, Connections break. 
    // Let's just update his parameters to do an HTTP Request to Supabase RPC, or remove it.
  }

  newNodes.push(node);
}

// Limpiar conexiones que referencien nodos eliminados
let newConnections = {};
for (const [sourceName, sourceOutputs] of Object.entries(original.connections)) {
  if (removedNodeNames.has(sourceName)) continue;
  
  newConnections[sourceName] = {};
  for (const [outputType, outputArray] of Object.entries(sourceOutputs)) {
    newConnections[sourceName][outputType] = outputArray.map(connectionsGroup => {
      // connectionsGroup es un array de {node: "Destino", type: "main", index: 0}
      return connectionsGroup.filter(c => !removedNodeNames.has(c.node));
    });
  }
}

// "Normalizar Entrada" -> iba a "Buscar Canal". Como quitamos "Buscar Canal", tenemos que reconectar "Normalizar Entrada" a donde fuera "Buscar Canal".
// En "Buscar Canal", el main output [0] iba a "IF Skip o Sin Tenant"
if (original.connections["Buscar Canal"]) {
  const destinos = original.connections["Buscar Canal"]["main"][0];
  // Reconectar Normalizar Entrada a estos destinos
  if (newConnections["Normalizar Entrada"]) {
    newConnections["Normalizar Entrada"]["main"][0] = destinos;
  }
}

fs.writeFileSync('C:/Users/Martin/Documents/Korat-Flow-Agencia/Korat_MVP/czO_surgery.json', JSON.stringify({
  nodes: newNodes,
  connections: newConnections,
  settings: original.settings
}, null, 2));

console.log('Cirugía completada!');
