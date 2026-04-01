import https from 'node:https';

const EVOLUTION_URL = 'https://evo.koratflow.agency';
const EVOLUTION_API_KEY = '76778d9719d9c1a0b7a604c5d960d8c5';
const instanceName = `kr${Date.now()}`;

const createPayload = {
  instanceName,
  token: '',
  qrcode: true,
  integration: 'WHATSAPP-BAILEYS',
  webhook: { enabled: false }
};

const data = JSON.stringify(createPayload);

const reqOptions = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': EVOLUTION_API_KEY,
    'Content-Length': Buffer.byteLength(data),
  },
};

const req = https.request(`${EVOLUTION_URL}/instance/create`, reqOptions, (res) => {
  res.on('data', () => {});
  res.on('end', () => {
    // Poll the connect endpoint
    setInterval(() => {
      const getReq = https.request(`${EVOLUTION_URL}/instance/connect/${instanceName}?number=%2B51981482289`, {
        method: 'GET',
        headers: { 'apikey': EVOLUTION_API_KEY }
      }, (res2) => {
        let body2 = '';
        res2.on('data', chunk => body2 += chunk);
        res2.on('end', () => {
           console.log('Connect Status:', res2.statusCode);
           try {
             const json = JSON.parse(body2);
             console.log('Connect Body Keys:', Object.keys(json));
             if (json.pairingCode) console.log('GOT IT:', json.pairingCode);
           } catch(e) { console.log(body2); }
        });
      });
      getReq.end();
    }, 2000);
  });
});
req.write(data);
req.end();
