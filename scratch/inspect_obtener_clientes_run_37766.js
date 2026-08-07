import fs from 'fs';

const filePath = 'C:/Users/Martin/.gemini/antigravity/brain/983d1254-6e5d-4408-9f2e-9c48b6015439/.system_generated/steps/724/output.txt';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const nodes = data.data.nodes;
console.log("Nodes list in execution:", Object.keys(nodes));

const nodeData = nodes["Obtener Clientes a Enviar"];
if (nodeData) {
  console.log("Obtener Clientes a Enviar execution data keys:", Object.keys(nodeData));
  if (Array.isArray(nodeData)) {
    console.log(`Runs array length: ${nodeData.length}`);
    nodeData.forEach((run, i) => {
      console.log(`\nRun ${i}:`);
      console.log("Input data (main branch):");
      console.log(JSON.stringify(run.input, null, 2));
      console.log("Output data (main branch):");
      console.log(JSON.stringify(run.output, null, 2));
      console.log("Execution time:", run.executionTime);
    });
  } else {
    // Single object structure
    console.log("Raw nodeData:", JSON.stringify(nodeData, null, 2));
  }
} else {
  console.log("Obtener Clientes a Enviar not found in nodes list.");
}
