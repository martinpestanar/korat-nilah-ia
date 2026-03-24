import fs from 'fs';

const fileContent = fs.readFileSync('C:/Users/Martin/.gemini/antigravity/brain/2ec1937e-4ceb-4093-b71c-94fb3a92b204/.system_generated/steps/279/output.txt', 'utf8');
const data = JSON.parse(fileContent);

const nodes = data.data.nodes;

const summary = nodes.map(n => ({
  id: n.id,
  name: n.name,
  type: n.type
}));

fs.writeFileSync('C:/Users/Martin/Documents/Korat-Flow-Agencia/Korat_MVP/tmp_nodes_summary.json', JSON.stringify(summary, null, 2));
