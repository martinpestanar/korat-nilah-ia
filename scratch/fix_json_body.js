import fs from 'fs';

const filePath = 'c:/Users/Martin/Documents/Korat-Flow-Agencia/Korat_MVP/scratch/modified_workflow.json';
const workflow = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Find "Obtener Clientes a Enviar" node
const obtenerClientesNode = workflow.nodes.find(n => n.name === 'Obtener Clientes a Enviar');
if (obtenerClientesNode) {
  obtenerClientesNode.parameters.jsonBody = '={{ { p_business_id: $json.business_id || null, p_dias_min: $json.dias_min || 0, p_dias_max: $json.dias_max || 0, p_keywords: $json.keywords || "" } }}';
  console.log('Fixed "Obtener Clientes a Enviar" jsonBody to use clean object expression successfully!');
}

fs.writeFileSync(filePath, JSON.stringify(workflow, null, 2), 'utf8');
