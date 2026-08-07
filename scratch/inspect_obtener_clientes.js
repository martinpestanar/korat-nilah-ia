import fs from 'fs';

const filePath = 'C:/Users/Martin/.gemini/antigravity/brain/983d1254-6e5d-4408-9f2e-9c48b6015439/.system_generated/steps/554/output.txt';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const nodes = data.data.nodes;
const nodeData = nodes["Obtener Clientes a Enviar"];
if (nodeData && nodeData.data && nodeData.data.output) {
  const outputs = nodeData.data.output;
  console.log("Number of outputs:", outputs.length);
  for (let i = 0; i < outputs.length; i++) {
    const list = outputs[i];
    const nonEntries = list.filter(item => Object.keys(item.json).length > 0);
    if (nonEntries.length > 0) {
      console.log(`Output index ${i} has non-empty JSON entries:`, JSON.stringify(nonEntries));
    }
  }
} else {
  console.log("Node Obtener Clientes a Enviar not found or has no output data");
}
