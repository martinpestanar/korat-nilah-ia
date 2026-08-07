import fs from 'fs';

const inputPath = 'C:/Users/Martin/.gemini/antigravity/brain/983d1254-6e5d-4408-9f2e-9c48b6015439/.system_generated/steps/937/output.txt';
const rawData = fs.readFileSync(inputPath, 'utf8');
const data = JSON.parse(rawData);

// The workflow data is in data.data
const workflow = data.data;

// Update connections in the draft version
if (workflow.connections["Loop Clientes"]) {
  workflow.connections["Loop Clientes"].main[0][0].node = "Loop Reglas";
  console.log("Updated draft connections for Loop Clientes.");
}

// Update connections in the active version
if (workflow.activeVersion && workflow.activeVersion.connections["Loop Clientes"]) {
  workflow.activeVersion.connections["Loop Clientes"].main[0][0].node = "Loop Reglas";
  console.log("Updated activeVersion connections for Loop Clientes.");
}

// Write the modified workflow data to modified_workflow.json
fs.writeFileSync('C:/Users/Martin/Documents/Korat-Flow-Agencia/Korat_MVP/scratch/modified_workflow.json', JSON.stringify(workflow, null, 2), 'utf8');
console.log("Written modified workflow successfully.");
