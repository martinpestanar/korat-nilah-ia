import fs from 'fs';

const originalData = fs.readFileSync('C:/Users/Martin/.gemini/antigravity/brain/2ec1937e-4ceb-4093-b71c-94fb3a92b204/.system_generated/steps/279/output.txt', 'utf8');
const original = JSON.parse(originalData).data;

const v2Data = fs.readFileSync('C:/Users/Martin/Documents/Korat-Flow-Agencia/Korat_MVP/tmp_v2_nodes.json', 'utf8');
const v2Nodes = JSON.parse(v2Data);

const getV2Node = (name) => v2Nodes.find(n => n.name === name);

let operations = [];

// 1. Remove Buscar Canal
operations.push({
  type: "removeNode",
  nodeName: "Buscar Canal"
});

// 2. Rewire Normalizar Entrada to the targets of Buscar Canal
if (original.connections["Buscar Canal"]) {
  const mainConns = original.connections["Buscar Canal"]["main"];
  if (mainConns && mainConns[0]) {
    for (let target of mainConns[0]) {
      operations.push({
        type: "rewireConnection",
        source: "Normalizar Entrada",
        from: "Buscar Canal",
        to: target.node
      });
    }
  }
}

// 3. Update Edit Fields
operations.push({
  type: "updateNode",
  nodeName: "Edit Fields",
  updates: {
    "parameters.assignments": {
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
    }
  }
});

// 4. Update Sending Nodes
const updateHttpNode = (originalName, v2Name) => {
  const v2 = getV2Node(v2Name);
  if (v2) {
    operations.push({
      type: "updateNode",
      nodeName: originalName,
      updates: {
        "parameters.method": v2.parameters.method,
        "parameters.url": v2.parameters.url,
        "parameters.authentication": v2.parameters.authentication,
        "parameters.genericAuthType": Object.keys(v2.credentials || {})[0] || undefined,
        "parameters.sendBody": v2.parameters.sendBody,
        "parameters.bodyParameters": v2.parameters.bodyParameters,
        "parameters.headerParameters": v2.parameters.headerParameters,
        "credentials": v2.credentials
      }
    });
  }
};

updateHttpNode('Enviar Parte 1', 'Evolution - Enviar Parte 1');
updateHttpNode('Enviar Parte 2', 'Evolution - Enviar Parte 2');
updateHttpNode('Enviar Media', 'Evolution - Enviar Media');
updateHttpNode('Confirmación al Humano', 'Evolution - Confirmar Humano');

// 5. Update Encender Bot
operations.push({
  type: "updateNode",
  nodeName: "Encender Bot",
  updates: {
    type: "n8n-nodes-base.supabase",
    typeVersion: 1,
    parameters: {
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
    },
    credentials: { supabaseApi: { id: "YlSUI38ukE7hX1FQ", name: "Supabase account" } }
  }
});

fs.writeFileSync('C:/Users/Martin/Documents/Korat-Flow-Agencia/Korat_MVP/tmp_operations.json', JSON.stringify(operations, null, 2));

console.log('Operaciones generadas! Total:', operations.length);
