import fs from 'fs';

// Cargar flujo original (czOqiIFhDACyB6Yy)
const originalData = fs.readFileSync('C:/Users/Martin/.gemini/antigravity/brain/2ec1937e-4ceb-4093-b71c-94fb3a92b204/.system_generated/steps/279/output.txt', 'utf8');
const original = JSON.parse(originalData).data;

// Cargar nodos V2
const v2Data = fs.readFileSync('C:/Users/Martin/Documents/Korat-Flow-Agencia/Korat_MVP/tmp_v2_nodes.json', 'utf8');
const v2Nodes = JSON.parse(v2Data);

const getV2Node = (name) => v2Nodes.find(n => n.name === name);

let newNodes = [];
let removedNodeNames = new Set(["Buscar Canal"]); // Nodos a eliminar por completo

for (let node of original.nodes) {
  if (removedNodeNames.has(node.name)) continue;

  if (node.name === 'Edit Fields') {
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
          name: "contacto_nombre",
          value: "={{ $json.body.data.pushName || 'Cliente' }}",
          type: "string"
        },
        {
          id: "9121fa32-4f24-4fde-b449-f3a8d013ddc8",
          name: "tiene_adjunto",
          value: "={{ !!$json.body.data.message?.imageMessage || !!$json.body.data.message?.audioMessage || !!$json.body.data.message?.documentMessage }}",
          type: "string"
        },
        {
          id: "ab1c9f2e-5bc4-4e9b-8ca4-44d8b06a0611",
          name: "url_adjunto",
          value: "={{ null }}",
          type: "string"
        },
        {
          id: "e291e325-fdc6-4bf7-963c-d1ced2c28429",
          name: "tipo_archivo",
          value: "={{ $json.body.data.message?.audioMessage ? 'audio' : ($json.body.data.message?.imageMessage ? 'image' : 'text') }}",
          type: "string"
        },
        {
          id: "5d247fe9-a6fb-4463-aa30-805857e5ba58",
          name: "lista_precios",
          value: "={{ $json.lista_precios }}",
          type: "string"
        }
      ]
    };
  } else if (node.name === 'Enviar Parte 1') {
    const v2 = getV2Node('Evolution - Enviar Parte 1');
    if (v2) {
      node.parameters = v2.parameters;
      node.typeVersion = v2.typeVersion;
      node.credentials = v2.credentials;
    }
  } else if (node.name === 'Enviar Parte 2') {
    const v2 = getV2Node('Evolution - Enviar Parte 2');
    if (v2) {
      node.parameters = v2.parameters;
      node.typeVersion = v2.typeVersion;
      node.credentials = v2.credentials;
    }
  } else if (node.name === 'Enviar Media') {
    const v2 = getV2Node('Evolution - Enviar Media');
    if (v2) {
      node.parameters = v2.parameters;
      node.typeVersion = v2.typeVersion;
      node.credentials = v2.credentials;
    }
  } else if (node.name === 'Confirmación al Humano') {
    const v2 = getV2Node('Evolution - Confirmar Humano');
    if (v2) {
      node.parameters = v2.parameters;
      node.typeVersion = v2.typeVersion;
      node.credentials = v2.credentials;
    }
  } else if (node.name === 'Encender Bot') {
    node.type = 'n8n-nodes-base.supabase';
    node.typeVersion = 1;
    node.parameters = {
      operation: "update",
      tableId: "Clientes",
      matchType: "allFilters",
      filters: {
        conditions: [
          {
            keyName: "telefono",
            condition: "eq",
            keyValue: "={{ $('Resolver Tenant').first().json.sender_phone }}"
          },
          {
            keyName: "business_id",
            condition: "eq",
            keyValue: "={{ $('Resolver Tenant').first().json.business_id }}"
          }
        ]
      },
      fieldsUi: {
        fieldValues: [
          {
            fieldId: "bot_pausado",
            fieldValue: "false"
          }
        ]
      }
    };
    node.credentials = { supabaseApi: { id: "YlSUI38ukE7hX1FQ", name: "Supabase account" } };
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
      return connectionsGroup ? connectionsGroup.filter(c => !removedNodeNames.has(c.node)) : [];
    });
  }
}

// "Normalizar Entrada" -> iba a "Buscar Canal". Como quitamos "Buscar Canal", tenemos que reconectar "Normalizar Entrada" a donde fuera "Buscar Canal".
if (original.connections["Buscar Canal"]) {
  const mainConns = original.connections["Buscar Canal"]["main"];
  if (mainConns && mainConns[0] && newConnections["Normalizar Entrada"]) {
    // Apuntar el main output de Normalizar Entrada a las salidas que tuviera Buscar Canal
    newConnections["Normalizar Entrada"]["main"][0] = mainConns[0];
  }
}

// Ensure the updated workflow object matches what n8n API expects
const finalWorkflow = {
  id: original.id,
  name: original.name,
  nodes: newNodes,
  connections: newConnections,
  settings: original.settings
};

fs.writeFileSync('C:/Users/Martin/Documents/Korat-Flow-Agencia/Korat_MVP/czO_surgery.json', JSON.stringify(finalWorkflow, null, 2));

console.log('Cirugía completada!');
