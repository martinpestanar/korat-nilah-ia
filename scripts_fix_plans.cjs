const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf8');
let supabaseUrl = 'https://cfggpqpbqqeavdbdzwoz.supabase.co';
let anonKey = '';
envFile.split('\n').forEach(line => {
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
    anonKey = line.replace('VITE_SUPABASE_ANON_KEY=', '').trim();
  }
});

async function main() {
  console.log('Fetching users from Supabase REST API...');
  const res = await fetch(`${supabaseUrl}/rest/v1/Usuarios?select=*`, {
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
      'Content-Type': 'application/json'
    }
  });
  const users = await res.json();
  console.log('Users found:', users.map(u => ({ id: u.id, username: u.username, email: u.email, nombre: u.nombre, plan: u.plan, business_id: u.business_id })));

  // Update lashpro to Glow
  for (const u of users) {
    const isLash = (u.username && u.username.toLowerCase().includes('lashpro')) || (u.email && u.email.toLowerCase().includes('lashpro'));
    const isPaola = (u.nombre && u.nombre.toLowerCase().includes('paola chau')) || (u.email && u.email.toLowerCase().includes('paola'));
    
    if (isLash) {
      console.log(`Setting ${u.username || u.email} to Glow...`);
      const updateRes = await fetch(`${supabaseUrl}/rest/v1/Usuarios?id=eq.${u.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ plan: 'Glow' })
      });
      console.log('Update lashpro user status:', updateRes.status);
      
      if (u.business_id) {
        const updateNeg = await fetch(`${supabaseUrl}/rest/v1/negocios?id=eq.${u.business_id}`, {
          method: 'PATCH',
          headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({ plan: 'glow' })
        });
        console.log('Update lashpro business status:', updateNeg.status);
      }
    } else if (isPaola) {
      console.log(`Setting ${u.nombre} to Glow Pro...`);
      await fetch(`${supabaseUrl}/rest/v1/Usuarios?id=eq.${u.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plan: 'Glow Pro' })
      });
    }
  }

  // Also check businesses in negocios table
  const resB = await fetch(`${supabaseUrl}/rest/v1/negocios?select=*`, {
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
      'Content-Type': 'application/json'
    }
  });
  const negocios = await resB.json();
  console.log('Negocios found:', negocios.map(n => ({ id: n.id, nombre: n.nombre, plan: n.plan })));

  console.log('Finished updating plans.');
}

main().catch(console.error);
