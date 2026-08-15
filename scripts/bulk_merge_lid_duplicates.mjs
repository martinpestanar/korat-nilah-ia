/**
 * Script para fusionar todos los clientes duplicados con @lid en el telefono.
 * Para cada cliente @lid:
 *   1. Busca un cliente con el mismo nombre y telefono SIN @lid
 *   2. Si existe, reasigna todos sus mensajes al cliente real
 *   3. Elimina el cliente @lid duplicado
 */

const BASE = 'https://cfggpqpbqqeavdbdzwoz.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmZ2dwcXBicXFlYXZkYmR6d296Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2ODMwMjEsImV4cCI6MjA4MjI1OTAyMX0.hko2l8IaJjbHLnGI8j_8czxC6q_b--hliidWbg2a8fM';

import https from 'https';

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'cfggpqpbqqeavdbdzwoz.supabase.co',
      path,
      method,
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        Prefer: 'return=minimal',
        ...(bodyStr ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyStr) } : {})
      }
    };
    const req = https.request(opts, r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => resolve({ status: r.statusCode, range: r.headers['content-range'], body: d }));
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

const get = path => request('GET', path + (path.includes('?') ? '&' : '?') + 'dummy=1');

async function main() {
  // 1. Obtener todos los @lid
  const lidRes = await request('GET', '/rest/v1/Clientes?select=id,nombre,telefono&telefono=ilike.*@lid*&limit=100');
  const lids = JSON.parse(lidRes.body);
  console.log(`Encontrados ${lids.length} clientes @lid\n`);

  let merged = 0, skipped = 0, errors = 0;

  for (const lid of lids) {
    const nombre = lid.nombre?.trim();
    if (!nombre) { skipped++; continue; }

    // Buscar cliente real con mismo nombre pero sin @lid
    const nameEncoded = encodeURIComponent(nombre);
    const searchRes = await request('GET', `/rest/v1/Clientes?select=id,nombre,telefono&nombre=eq.${nameEncoded}&telefono=not.ilike.*@lid*&limit=5`);
    
    let realClients = [];
    try { realClients = JSON.parse(searchRes.body); } catch {}

    if (!Array.isArray(realClients) || realClients.length === 0) {
      console.log(`⚠️  Sin match real para "${nombre}" (ID ${lid.id}) — saltando`);
      skipped++;
      continue;
    }

    // Elegir el cliente real con ID más bajo (el más antiguo)
    const realClient = realClients.sort((a, b) => a.id - b.id)[0];

    if (realClient.id === lid.id) { skipped++; continue; }

    console.log(`🔀 Fusionando "${nombre}": ID ${lid.id} (@lid) → ID ${realClient.id} (${realClient.telefono})`);

    try {
      // Reasignar mensajes
      const patchRes = await request('PATCH', `/rest/v1/mensajes?cliente_id=eq.${lid.id}`, { cliente_id: realClient.id });
      if (patchRes.status !== 204) {
        console.log(`   ❌ Error PATCH mensajes: ${patchRes.status} ${patchRes.body}`);
        errors++;
        continue;
      }

      // Reasignar tags si existen
      await request('PATCH', `/rest/v1/chat_tags?cliente_id=eq.${lid.id}`, { cliente_id: realClient.id });

      // Eliminar cliente duplicado
      const delRes = await request('DELETE', `/rest/v1/Clientes?id=eq.${lid.id}`);
      if (delRes.status !== 204) {
        console.log(`   ⚠️  No se pudo eliminar cliente ${lid.id}: ${delRes.status} ${delRes.body}`);
      } else {
        console.log(`   ✅ Fusionado y eliminado correctamente`);
        merged++;
      }
    } catch (e) {
      console.log(`   ❌ Error: ${e.message}`);
      errors++;
    }
  }

  console.log(`\n📊 Resumen:`);
  console.log(`   ✅ Fusionados: ${merged}`);
  console.log(`   ⚠️  Saltados (sin match): ${skipped}`);
  console.log(`   ❌ Errores: ${errors}`);
  console.log(`\n⚠️  Los saltados son clientes SOLO con @lid (sin historial con telefono real) — no requieren acción.`);
}

main().catch(console.error);
