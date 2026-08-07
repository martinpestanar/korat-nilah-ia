import fs from 'fs';

const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjNjEyNDA3Zi0wY2Y5LTQ0NDktOThmYi1jZDdhODFmMTFhZmUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNTlmMGU4ZGEtYjU4Yi00ODA3LTk5MmQtNjNmZGYxYWM5YmJjIiwiaWF0IjoxNzcwNzQxMDM4fQ.lvFKb5WhiLRYNjA0l-LPTuc7f6_AT-mcFkPUpFjyXD4';
const apiUrl = 'https://n8n.koratflow.agency';
const workflowId = 'M0wWce2FoGLMKbjfym5RN';

const workflowJson = fs.readFileSync('c:/Users/Martin/Documents/Korat-Flow-Agencia/Korat_MVP/scratch/modified_workflow.json', 'utf8');
const workflowData = JSON.parse(workflowJson);

// Put payload for n8n public api (v1)
const payload = {
  name: workflowData.name,
  nodes: workflowData.nodes,
  connections: workflowData.connections,
  settings: {}
};

async function upload() {
  const url = `${apiUrl}/api/v1/workflows/${workflowId}`;
  console.log('Uploading and activating workflow to:', url);
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-N8N-API-KEY': apiKey
    },
    body: JSON.stringify(payload)
  });

  const resText = await response.text();
  console.log('Response Status:', response.status);
  console.log('Response Text:', resText.substring(0, 300));
}

upload();
