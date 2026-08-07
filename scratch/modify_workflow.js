import fs from 'fs';
import path from 'path';

const inputPath = 'C:/Users/Martin/.gemini/antigravity/brain/983d1254-6e5d-4408-9f2e-9c48b6015439/.system_generated/steps/439/output.txt';
const outputPath = 'c:/Users/Martin/Documents/Korat-Flow-Agencia/Korat_MVP/scratch/modified_workflow.json';

const rawData = fs.readFileSync(inputPath, 'utf8');
const data = JSON.parse(rawData);

// Get the actual workflow data
const workflow = data.data;

// Define the two new nodes
const actualizarLogEnviado = {
  "parameters": {
    "operation": "update",
    "tableId": "nilah_autopilot_log",
    "matchType": "allFilters",
    "filters": {
      "conditions": [
        {
          "keyName": "id",
          "condition": "eq",
          "keyValue": "={{ $('📝 Registrar Intención').item.json.id }}"
        }
      ]
    },
    "fieldsUi": {
      "fieldValues": [
        {
          "fieldId": "estado",
          "fieldValue": "enviado"
        },
        {
          "fieldId": "mensaje_completo",
          "fieldValue": "={{ $('Limpiar Respuesta IA').item.json.mensaje_limpio }}"
        }
      ]
    }
  },
  "id": "actualizar-log-enviado-001",
  "name": "Actualizar Log Enviado",
  "type": "n8n-nodes-base.supabase",
  "typeVersion": 1,
  "position": [
    4300,
    -480
  ],
  "credentials": {
    "supabaseApi": {
      "id": "YlSUI38ukE7hX1FQ",
      "name": "Supabase account"
    }
  }
};

const actualizarLogBloqueado = {
  "parameters": {
    "operation": "update",
    "tableId": "nilah_autopilot_log",
    "matchType": "allFilters",
    "filters": {
      "conditions": [
        {
          "keyName": "id",
          "condition": "eq",
          "keyValue": "={{ $('📝 Registrar Intención').item.json.id }}"
        }
      ]
    },
    "fieldsUi": {
      "fieldValues": [
        {
          "fieldId": "estado",
          "fieldValue": "bloqueado"
        },
        {
          "fieldId": "razon_bloqueo",
          "fieldValue": "={{ $json.razon_bloqueo || 'cooldown' }}"
        }
      ]
    }
  },
  "id": "actualizar-log-bloqueado-001",
  "name": "Actualizar Log Bloqueado",
  "type": "n8n-nodes-base.supabase",
  "typeVersion": 1,
  "position": [
    4096,
    -300
  ],
  "credentials": {
    "supabaseApi": {
      "id": "YlSUI38ukE7hX1FQ",
      "name": "Supabase account"
    }
  }
};

// Replace incorrect El Cerebro de Retencion in 💾 Guardar Simulación
const guardarSimulacion = workflow.nodes.find(n => n.name === "💾 Guardar Simulación");
if (guardarSimulacion) {
  guardarSimulacion.parameters.filters.conditions = [
    {
      "keyName": "id",
      "condition": "eq",
      "keyValue": "={{ $('📝 Registrar Intención').item.json.id }}"
    }
  ];
  console.log("Updated 💾 Guardar Simulación filters successfully!");
}

// Add the new nodes to the nodes array
workflow.nodes.push(actualizarLogEnviado);
workflow.nodes.push(actualizarLogBloqueado);

// Modify connections
const conn = workflow.connections;

// 1. Change recordatorio_enviado output to go to Actualizar Log Enviado instead of Wait
// Find: recordatorio_enviado.main[0] should be Actualizar Log Enviado
conn["recordatorio_enviado"] = {
  "main": [
    [
      {
        "node": "Actualizar Log Enviado",
        "type": "main",
        "index": 0
      }
    ]
  ]
};

// 2. Actualizar Log Enviado output should go to Wait
conn["Actualizar Log Enviado"] = {
  "main": [
    [
      {
        "node": "Wait",
        "type": "main",
        "index": 0
      }
    ]
  ]
};

// 3. ¿Enviado? False branch (index 1) should go to Actualizar Log Bloqueado instead of Loop Clientes
conn["¿Enviado?"] = {
  "main": [
    [
      {
        "node": "recordatorio_enviado",
        "type": "main",
        "index": 0
      }
    ],
    [
      {
        "node": "Actualizar Log Bloqueado",
        "type": "main",
        "index": 0
      }
    ]
  ]
};

// 4. Actualizar Log Bloqueado output should go to Loop Clientes
conn["Actualizar Log Bloqueado"] = {
  "main": [
    [
      {
        "node": "Loop Clientes",
        "type": "main",
        "index": 0
      }
    ]
  ]
};

fs.writeFileSync(outputPath, JSON.stringify(workflow, null, 2), 'utf8');
console.log("Modified workflow JSON written to:", outputPath);
