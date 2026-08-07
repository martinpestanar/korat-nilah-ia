import fs from 'fs';

const data = JSON.parse(fs.readFileSync('C:/Users/Martin/.gemini/antigravity/brain/983d1254-6e5d-4408-9f2e-9c48b6015439/.system_generated/steps/979/output.txt', 'utf8'));
const nodeData = data.data.nodes["Loop Reglas"];
console.log("Status:", nodeData.status);
console.log("Output data:", JSON.stringify(nodeData.data.output, null, 2).substring(0, 1500));
