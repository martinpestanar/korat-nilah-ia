import fs from 'fs';

const filePath = 'C:/Users/Martin/.gemini/antigravity/brain/983d1254-6e5d-4408-9f2e-9c48b6015439/.system_generated/steps/554/output.txt';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const nodes = data.data.nodes;
for (const [nodeName, nodeData] of Object.entries(nodes)) {
  const jsonStr = JSON.stringify(nodeData);
  if (jsonStr.includes('929') || jsonStr.includes('Alexa')) {
    console.log(`Found match in node: ${nodeName}`);
  }
}
