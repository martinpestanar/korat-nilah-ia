import fs from 'fs';
import path from 'path';

const webpFiles = fs.readdirSync('public/servicios')
  .filter(f => f.endsWith('.webp'))
  .map(f => path.parse(f).name);

console.log(JSON.stringify(webpFiles, null, 2));
