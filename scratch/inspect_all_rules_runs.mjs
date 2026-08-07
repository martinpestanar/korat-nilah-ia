import fs from 'fs';

const data = JSON.parse(fs.readFileSync('C:/Users/Martin/.gemini/antigravity/brain/983d1254-6e5d-4408-9f2e-9c48b6015439/.system_generated/steps/979/output.txt', 'utf8'));
const loopReglasNode = data.data.nodes["Loop Reglas"];
console.log("Loop Reglas data:", JSON.stringify(loopReglasNode, null, 2));
