import fs from 'fs';

const filePath = 'C:/Users/Martin/.gemini/antigravity/brain/983d1254-6e5d-4408-9f2e-9c48b6015439/.system_generated/steps/724/output.txt';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const nodeData = data.data.nodes["Obtener Clientes a Enviar"];
if (nodeData && nodeData.data && nodeData.data.output) {
  console.log("Number of execution runs (outer list):", nodeData.data.output.length);
  nodeData.data.output.forEach((runOutputs, runIdx) => {
    console.log(`\n--- Run ${runIdx} has ${runOutputs?.length || 0} items ---`);
    runOutputs.forEach((item, itemIdx) => {
      console.log(`  Item ${itemIdx}:`, JSON.stringify(item.json));
    });
  });
} else {
  console.log("No output array found.");
}
