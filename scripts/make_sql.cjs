const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env', 'utf8');
let url = '', key = '';
envFile.split('\n').forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim();
});
const supabase = createClient(url, key);

// Importar módulo de templates ya creado en CJS
const scriptContent = fs.readFileSync('scripts/populate_brilla_services.cjs', 'utf8');

// Ejecutar para extraer resolveServiceMediaAndDesc
const evalFn = new Function('require', 'module', 'exports', scriptContent.replace('populateBrillaStudio();', 'exports.resolveServiceMediaAndDesc = resolveServiceMediaAndDesc;'));
const exp = {};
evalFn(require, { exports: exp }, exp);

async function main() {
  const bId = '10db8ed7-fa79-4092-9bae-760fdad63c75';
  const { data: srvs } = await supabase.from('carta_servicios').select('id, nombre, descripcion, media_url, categoria_id').eq('business_id', bId);
  const { data: cats } = await supabase.from('carta_categorias').select('id, nombre').eq('business_id', bId);
  const catMap = {};
  (cats || []).forEach(c => { catMap[c.id] = c.nombre; });

  const sqlStatements = [];
  for (const s of srvs) {
    const catNom = catMap[s.categoria_id] || '';
    const res = exp.resolveServiceMediaAndDesc(s.nombre, s.descripcion, s.media_url, catNom);
    const safeDesc = res.descripcion.replace(/'/g, "''");
    const safeUrl = res.mediaUrl.replace(/'/g, "''");
    sqlStatements.push(`UPDATE carta_servicios SET descripcion = '${safeDesc}', media_url = '${safeUrl}' WHERE id = '${s.id}';`);
  }

  fs.writeFileSync('scripts/update_brilla.sql', sqlStatements.join('\n'), 'utf8');
  console.log(`Generadas ${sqlStatements.length} sentencias SQL.`);
}

main();
