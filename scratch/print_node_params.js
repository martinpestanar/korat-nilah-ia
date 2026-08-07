import fs from 'fs';

const filePath = 'c:/Users/Martin/Documents/Korat-Flow-Agencia/Korat_MVP/scratch/modified_workflow.json';
const workflow = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const node = workflow.nodes.find(n => n.name === 'Obtener Clientes a Enviar');
console.log(JSON.stringify(node, null, 2));
