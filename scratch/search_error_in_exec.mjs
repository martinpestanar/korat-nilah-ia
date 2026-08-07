import fs from 'fs';

const filePath = 'C:/Users/Martin/.gemini/antigravity/brain/983d1254-6e5d-4408-9f2e-9c48b6015439/.system_generated/steps/724/output.txt';
const fileContent = fs.readFileSync(filePath, 'utf8');

// 1. Simple search
console.log("Includes 'invalid input syntax':", fileContent.includes("invalid input syntax"));
console.log("Includes 'undefined':", fileContent.includes('"undefined"'));
console.log("Includes 'error':", fileContent.includes('"error"'));

// 2. Parse and search nodes
const data = JSON.parse(fileContent);
const nodes = data.data.nodes;

for (const [nodeName, nodeVal] of Object.entries(nodes)) {
  const nodeValStr = JSON.stringify(nodeVal);
  if (nodeValStr.includes("invalid input syntax") || nodeValStr.includes('"undefined"')) {
    console.log(`\nFound match in node: "${nodeName}"`);
    console.log(`Status: ${nodeVal.status}`);
    // Print a snippet of where the error is
    const idx = nodeValStr.indexOf("invalid input syntax");
    if (idx !== -1) {
      console.log("Snippet:", nodeValStr.substring(Math.max(0, idx - 100), Math.min(nodeValStr.length, idx + 200)));
    } else {
      const idx2 = nodeValStr.indexOf('"undefined"');
      console.log("Snippet (undefined):", nodeValStr.substring(Math.max(0, idx2 - 100), Math.min(nodeValStr.length, idx2 + 200)));
    }
  }
}
