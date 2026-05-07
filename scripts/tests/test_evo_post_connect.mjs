import https from 'node:https';

const EVOLUTION_URL = 'https://evo.koratflow.agency';
const EVOLUTION_API_KEY = '76778d9719d9c1a0b7a604c5d960d8c5';
const instanceName = `kr${Date.now()}`;

const createPayload = {
  instanceName,
  token: '',
  qrcode: true,
  integration: 'WHATSAPP-BAILEYS',
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
    // wait for instance to init
    setTimeout(() => {
      // Test POST connect
      const connectData = JSON.stringify({ number: "51981482289" });
      const postReq = https.request(`${EVOLUTION_URL}/instance/connect/${instanceName}`, {
        method: 'POST',
        headers: {
           'apikey': EVOLUTION_API_KEY,
           'Content-Type': 'application/json',
           'Content-Length': Buffer.byteLength(connectData)
        }
      }, (res2) => {
        let body2 = '';
        res2.on('data', chunk => body2 += chunk);
        res2.on('end', () => {
           console.log('Connect POST Status:', res2.statusCode);
           console.log('Connect POST Body:', body2);
        });
      });
      postReq.write(connectData);
      postReq.end();
    }, 4000);
  });
});
req.write(data);
req.end();
