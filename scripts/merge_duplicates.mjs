import https from 'https';

const project_id = 'cfggpqpbqqeavdbdzwoz';
// Using anon key - will try REST PATCH directly
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmZ2dwcXBicXFlYXZkYmR6d296Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2ODMwMjEsImV4cCI6MjA4MjI1OTAyMX0.hko2l8IaJjbHLnGI8j_8czxC6q_b--hliidWbg2a8fM';

async function restPatch(path, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    const options = {
      hostname: 'cfggpqpbqqeavdbdzwoz.supabase.co',
      path,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Prefer': 'return=minimal',
        'Content-Length': Buffer.byteLength(bodyStr)
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

async function restDelete(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'cfggpqpbqqeavdbdzwoz.supabase.co',
      path,
      method: 'DELETE',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Prefer': 'return=minimal'
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log('=== Step 1: Reasignar mensajes de Gabriella (1553 -> 1217) ===');
  const r1 = await restPatch('/rest/v1/mensajes?cliente_id=eq.1553', { cliente_id: 1217 });
  console.log('Status:', r1.status, r1.body || '(ok)');

  console.log('=== Step 2: Reasignar mensajes de Marianne (1450 -> 1202) ===');
  const r2 = await restPatch('/rest/v1/mensajes?cliente_id=eq.1450', { cliente_id: 1202 });
  console.log('Status:', r2.status, r2.body || '(ok)');

  console.log('=== Step 3: Eliminar cliente duplicado Gabriella (1553) ===');
  const r3 = await restDelete('/rest/v1/Clientes?id=eq.1553');
  console.log('Status:', r3.status, r3.body || '(ok)');

  console.log('=== Step 4: Eliminar cliente duplicado Marianne (1450) ===');
  const r4 = await restDelete('/rest/v1/Clientes?id=eq.1450');
  console.log('Status:', r4.status, r4.body || '(ok)');

  console.log('=== Verificacion: Contar mensajes ahora en IDs principales ===');
  // Quick GET to verify
  const verify = await new Promise((resolve, reject) => {
    const options = {
      hostname: 'cfggpqpbqqeavdbdzwoz.supabase.co',
      path: '/rest/v1/mensajes?select=id&cliente_id=in.(1217,1553,1202,1450)&limit=1',
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Prefer': 'count=exact'
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, range: res.headers['content-range'], body: data }));
    });
    req.on('error', reject);
    req.end();
  });
  console.log('Verify status:', verify.status, 'Content-Range:', verify.range);
}

main().catch(console.error);
