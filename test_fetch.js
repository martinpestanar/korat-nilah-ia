const URL = 'https://cfggpqpbqqeavdbdzwoz.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmZ2dwcXBicXFlYXZkYmR6d296Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2ODMwMjEsImV4cCI6MjA4MjI1OTAyMX0.hko2l8IaJjbHLnGI8j_8czxC6q_b--hliidWbg2a8fM';

async function test() {
  const urls = [
    URL + '/rest/v1/mensajes?select=id,business_id,contenido,cliente_id,cliente:Clientes(id,nombre)&limit=1',
    URL + '/rest/v1/mensajes?select=id,business_id,contenido,cliente_id,Clientes(id,nombre)&limit=1',
    URL + '/rest/v1/mensajes?select=id,business_id,contenido,cliente_id,clientes:Clientes(id,nombre)&limit=1',
    URL + '/rest/v1/mensajes?select=*,cliente:cliente_id(id,nombre)&limit=1',
  ];

  for (const u of urls) {
    console.log("Testing:", u);
    try {
      const res = await fetch(u, {
        headers: { 'apikey': KEY, 'Authorization': 'Bearer ' + KEY }
      });
      const data = await res.json();
      console.log(JSON.stringify(data, null, 2));
    } catch(err) {
      console.error(err);
    }
  }
}
test();
