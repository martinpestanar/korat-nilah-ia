import https from 'node:https';
import fs from 'node:fs';

const url = 'https://cfggpqpbqqeavdbdzwoz.supabase.co/functions/v1/create-evo-instance';
const data = JSON.stringify({ businessId: 'test-cli-001', phoneNumber: '51981482289', mode: 'pairing' });

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
};

const req = https.request(url, options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(body);
      fs.writeFileSync('evo_debug.json', JSON.stringify(json.debug, null, 2));
      console.log('Wrote evo_debug.json');
    } catch(e) {
      console.log('Raw body:', body);
    }
  });
});

req.on('error', (e) => console.error(e));
req.write(data);
req.end();
