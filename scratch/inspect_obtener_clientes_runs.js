import fs from 'fs';

const filePath = 'C:/Users/Martin/.gemini/antigravity/brain/983d1254-6e5d-4408-9f2e-9c48b6015439/.system_generated/steps/554/output.txt';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const nodeData = data.data.nodes["Obtener Clientes a Enviar"];
if (nodeData && nodeData.data && nodeData.data.output) {
  // Let's print the input items if they are stored in the execution data
  // Wait, execution data shows the inputs or outputs. Let's inspect the keys of nodeData.data
  console.log("Keys of nodeData.data:", Object.keys(nodeData.data));
  if (nodeData.data.input) {
    console.log("Input data exists, length:", nodeData.data.input.length);
  }
} else {
  console.log("Node Obtener Clientes a Enviar not found or has no output data");
}
