const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Leer templates de scripts/populate_brilla_services.cjs
const scriptContent = fs.readFileSync('scripts/populate_brilla_services.cjs', 'utf8');

const evalFn = new Function('require', 'module', 'exports', scriptContent.replace('populateBrillaStudio();', 'exports.SERVICE_TEMPLATES = SERVICE_TEMPLATES; exports.CATEGORY_DEFAULT_DESCRIPTIONS = CATEGORY_DEFAULT_DESCRIPTIONS;'));
const exp = {};
evalFn(require, { exports: exp }, exp);

const catNombres = {
  pestanas: 'Pestañas',
  cejas: 'Cejas',
  manos: 'Manos & Uñas',
  pies: 'Pies & Pedicure',
  facial: 'Rostro & Facial',
  cabello: 'Cabello & Peluquería',
  general: 'General'
};

const inserts = exp.SERVICE_TEMPLATES.map(t => {
  const nom = t.keywords[0].split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const catNom = catNombres[t.categoriaKey] || 'General';
  const desc = t.descripcion.replace(/'/g, "''");
  const img = t.imagen.replace(/'/g, "''");
  const kw = `ARRAY[${t.keywords.map(k => `'${k.replace(/'/g, "''")}'`).join(',')}]::text[]`;
  return `INSERT INTO plantillas_servicios (categoria_key, categoria_nombre, nombre, descripcion, media_url, keywords) VALUES ('${t.categoriaKey}', '${catNom}', '${nom}', '${desc}', '${img}', ${kw});`;
});

fs.writeFileSync('scripts/insert_plantillas.sql', inserts.join('\n'), 'utf8');
console.log(`Generados ${inserts.length} inserts para plantillas_servicios.`);
