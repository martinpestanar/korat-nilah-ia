import fs from 'fs';

async function check() {
    let env = '';
    try {
        env = fs.readFileSync('.env.local', 'utf8');
    } catch (e) {
        env = fs.readFileSync('.env', 'utf8');
    }
    const lines = env.split('\n').filter(l => l.includes('='));
    const envMap = {};
    lines.forEach(l => {
        const [k, ...v] = l.split('=');
        envMap[k.trim()] = v.join('=').trim().replace(/['"]/g, '').replace('\r', '');
    });

    const url = envMap.VITE_SUPABASE_URL;
    const key = envMap.VITE_SUPABASE_ANON_KEY;

    try {
        const response = await fetch(url + '/rest/v1/rpc/verify_super_admin', {
            method: 'POST',
            headers: {
                'apikey': key,
                'Authorization': 'Bearer ' + key,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ p_email: 'martin@koratflow.com', p_password: 'mar' })
        });
        const text = await response.text();
        console.log('Status:', response.status);
        console.log('Data:', text);
    } catch (err) {
        console.error('Error fetching Data:', err);
    }
}

check();
