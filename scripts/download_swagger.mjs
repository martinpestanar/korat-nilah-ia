import https from 'node:https';

const req = https.request('https://evo.koratflow.agency/docs-json', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    if (res.statusCode === 200) {
      import('node:fs').then(fs => fs.writeFileSync('evolution_swagger.json', body));
      console.log('Wrote evolution_swagger.json');
    } else {
      console.log(body);
    }
  });
});
req.end();
