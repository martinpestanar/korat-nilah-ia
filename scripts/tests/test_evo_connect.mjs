import https from 'node:https';

const EVOLUTION_URL = 'https://evo.koratflow.agency';
const EVOLUTION_API_KEY = '76778d9719d9c1a0b7a604c5d960d8c5';
const instanceName = `kr${Date.now()}`;

const createPayload = {
  instanceName,
  token: '',
  qrcode: true,
  integration: 'WHATSAPP-BAILEYS'
};

const data = JSON.stringify(createPayload);

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': EVOLUTION_API_KEY,
    'Content-Length': Buffer.byteLength(data),
  },
};

const req = https.request(`${EVOLUTION_URL}/instance/create`, options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Create Status:', res.statusCode);
    
    // Now request pairing code via /instance/connect
    setTimeout(() => {
      const getOptions = {
        method: 'GET',
        headers: { 'apikey': EVOLUTION_API_KEY }
      };
      const getReq = https.request(`${EVOLUTION_URL}/instance/connect/${instanceName}?number=51981482289`, getOptions, (res2) => {
        let body2 = '';
        res2.on('data', chunk => body2 += chunk);
        res2.on('end', () => {
           console.log('Connect Status:', res2.statusCode);
           console.log('Connect Body:', body2);
        });
      });
      getReq.end();
    }, 4000);
  });
});

req.on('error', (e) => console.error(e));
req.write(data);
req.end();
