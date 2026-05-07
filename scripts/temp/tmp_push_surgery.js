const fs = require('fs');
const https = require('https');

const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjNjEyNDA3Zi0wY2Y5LTQ0NDktOThmYi1jZDdhODFmMTFhZmUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNTlmMGU4ZGEtYjU4Yi00ODA3LTk5MmQtNjNmZGYxYWM5YmJjIiwiaWF0IjoxNzcwNzQxMDM4fQ.lvFKb5WhiLRYNjA0l-LPTuc7f6_AT-mcFkPUpFjyXD4";
const HOST = "n8n.koratflow.agency";
const PATH = "/api/v1/workflows/czOqiIFhDACyB6Yy";

const payload = fs.readFileSync('C:/Users/Martin/Documents/Korat-Flow-Agencia/Korat_MVP/czO_surgery.json', 'utf-8');

const options = {
  hostname: HOST,
  path: PATH,
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'X-N8N-API-KEY': API_KEY
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log("EXITO! Workflow actualizado.");
    } else {
      console.error("Error: " + res.statusCode, data);
      process.exit(1);
    }
  });
});

req.on('error', (e) => {
  console.error("Problema con la peticion: " + e.message);
  process.exit(1);
});

req.write(payload);
req.end();
