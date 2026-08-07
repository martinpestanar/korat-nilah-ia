import fs from 'fs';

const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjNjEyNDA3Zi0wY2Y5LTQ0NDktOThmYi1jZDdhODFmMTFhZmUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNTlmMGU4ZGEtYjU4Yi00ODA3LTk5MmQtNjNmZGYxYWM5YmJjIiwiaWF0IjoxNzcwNzQxMDM4fQ.lvFKb5WhiLRYNjA0l-LPTuc7f6_AT-mcFkPUpFjyXD4';
const apiUrl = 'https://n8n.koratflow.agency';
const workflowId = 'M0wWce2FoGLMKbjfym5RN';

const workflowJson = fs.readFileSync('c:/Users/Martin/Documents/Korat-Flow-Agencia/Korat_MVP/scratch/modified_workflow.json', 'utf8');
const workflowData = JSON.parse(workflowJson);

const payload = {
  name: workflowData.name,
  nodes: workflowData.nodes,
  connections: workflowData.connections,
  settings: {}
};

async function execute() {
  const headers = {
    'Content-Type': 'application/json',
    'X-N8N-API-KEY': apiKey
  };

  try {
    // 1. Deactivate
    console.log('Deactivating workflow...');
    const deactRes = await fetch(`${apiUrl}/api/v1/workflows/${workflowId}/deactivate`, {
      method: 'POST',
      headers
    });
    console.log('Deactivate Status:', deactRes.status);
    console.log('Deactivate Msg:', await deactRes.text());

    // 2. Update
    console.log('Updating workflow JSON...');
    const updateRes = await fetch(`${apiUrl}/api/v1/workflows/${workflowId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload)
    });
    console.log('Update Status:', updateRes.status);
    console.log('Update Msg:', (await updateRes.text()).substring(0, 200));

    // 3. Activate
    console.log('Re-activating workflow...');
    const actRes = await fetch(`${apiUrl}/api/v1/workflows/${workflowId}/activate`, {
      method: 'POST',
      headers
    });
    console.log('Activate Status:', actRes.status);
    console.log('Activate Msg:', await actRes.text());

  } catch (error) {
    console.error('Error during activation sequence:', error);
  }
}

execute();
