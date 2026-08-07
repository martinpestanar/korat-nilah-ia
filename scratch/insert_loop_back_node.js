import fs from 'fs';

const filePath = 'C:/Users/Martin/Documents/Korat-Flow-Agencia/Korat_MVP/scratch/modified_workflow.json';
const workflow = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// 1. Create the new node
const newCodeNode = {
  "parameters": {
    "jsCode": "// Retornar las reglas originales para que Loop Reglas no se reinicie\ntry {\n    return $(\"Cargar Reglas de Recordatorio\").all();\n} catch (e) {\n    return $nodes[\"Cargar Reglas de Recordatorio\"].all();\n}"
  },
  "id": "pasar-reglas-de-vuelta-001",
  "name": "Pasar Reglas de Vuelta",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [
    1800,
    100
  ]
};

// Add to nodes list (both primary and activeVersion if present)
workflow.nodes.push(newCodeNode);
if (workflow.activeVersion) {
  workflow.activeVersion.nodes.push(newCodeNode);
}

// 2. Update connections in primary connections
// A. Loop Clientes output 0 (Done) goes to Pasar Reglas de Vuelta
workflow.connections["Loop Clientes"].main[0] = [
  {
    "node": "Pasar Reglas de Vuelta",
    "type": "main",
    "index": 0
  }
];

// B. Pasar Reglas de Vuelta output 0 goes to Loop Reglas
workflow.connections["Pasar Reglas de Vuelta"] = {
  "main": [
    [
      {
        "node": "Loop Reglas",
        "type": "main",
        "index": 0
      }
    ]
  ]
};

// 3. Update connections in activeVersion if present
if (workflow.activeVersion) {
  workflow.activeVersion.connections["Loop Clientes"].main[0] = [
    {
      "node": "Pasar Reglas de Vuelta",
      "type": "main",
      "index": 0
    }
  ];
  workflow.activeVersion.connections["Pasar Reglas de Vuelta"] = {
    "main": [
      [
        {
          "node": "Loop Reglas",
          "type": "main",
          "index": 0
        }
      ]
    ]
  };
}

fs.writeFileSync(filePath, JSON.stringify(workflow, null, 2), 'utf8');
console.log("Successfully inserted loop back node and updated connections.");
