import fs from 'fs';

const filePath = 'c:/Users/Martin/Documents/Korat-Flow-Agencia/Korat_MVP/scratch/modified_workflow.json';
const workflow = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Find "Esta activado?" node
const estaActivadoNode = workflow.nodes.find(n => n.name === 'Esta activado?');
if (estaActivadoNode) {
  estaActivadoNode.parameters.conditions.conditions = [
    {
      "id": "9f038bd5-ca1a-4b88-ae60-b03b6deb0182",
      "leftValue": "={{ $json.automatizaciones.mantenimiento_activo }}",
      "rightValue": true,
      "operator": {
        "type": "boolean",
        "operation": "equals"
      }
    },
    {
      "id": "39bdfb2d-aea2-4ffc-b098-947ae295bacc",
      "leftValue": "={{ $json.automatizaciones.permitir_mantenimiento }}",
      "rightValue": true,
      "operator": {
        "type": "boolean",
        "operation": "equals"
      }
    }
  ];
  console.log('Fixed "Esta activado?" node paths successfully!');
}

fs.writeFileSync(filePath, JSON.stringify(workflow, null, 2), 'utf8');
