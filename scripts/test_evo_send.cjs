const https = require('https');

const postData = JSON.stringify({
  number: '51981482289',
  linkPreview: false,
  text: '¡Hola Martin! ✨ Para tu cita de Extensiones de Pestañas mañana en Paola Chau Beauty Studio, por favor completa tu ficha médica y consentimiento informado antes de tu sesión:\n\n👉 https://koratflow.agency/c/paola-chau/7k2m9x\n\n⏱️ Solo toma 1 minuto y tiene vigencia de 1 año (no tendrás que volver a llenarlo en tus próximos retoques).\n\n🌸 Recomendaciones: Recuerda venir con tus ojos limpios, sin rímel ni maquillaje, y retirar lentes de contacto antes de la aplicación.'
});

const options = {
  hostname: 'evo.koratflow.agency',
  port: 443,
  path: '/message/sendText/paola',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': 'CCC8FC0AA9B0-4989-BD27-0E3FB9C32604',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', (e) => {
  console.error('Error:', e);
});

req.write(postData);
req.end();
