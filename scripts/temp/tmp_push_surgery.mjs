import fs from 'fs';
import https from 'https';

const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjNjEyNDA3Zi0wY2Y5LTQ0NDktOThmYi1jZDdhODFmMTFhZmUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNTlmMGU4ZGEtYjU4Yi00ODA3LTk5MmQtNjNmZGYxYWM5YmJjIiwiaWF0IjoxNzcwNzQxMDM4fQ.lvFKb5WhiLRYNjA0l-LPTuc7f6_AT-mcFkPUpFjyXD4";
const API_URL = "https://n8n.koratflow.agency";
const WORKFLOW_ID = "czOqiIFhDACyB6Yy";

const workflowData = JSON.parse(fs.readFileSync('C:/Users/Martin/Documents/Korat-Flow-Agencia/Korat_MVP/czO_surgery.json', 'utf-8'));

async function updateWorkflow() {
  console.log("Iniciando actualización de " + WORKFLOW_ID + "...");
  try {
    const response = await fetch(\`\${API_URL}/api/v1/workflows/\${WORKFLOW_ID}\`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-N8N-API-KEY": API_KEY
      },
      body: JSON.stringify(workflowData)
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Error actualizando: " + response.status, err);
      process.exit(1);
    }

    const data = await response.json();
    console.log("EXITO! Workflow actualizado. Nodos: " + data.nodes.length);
  } catch(e) {
    console.error("Fetch Exception: ", e.message);
    process.exit(1);
  }
}

updateWorkflow();
