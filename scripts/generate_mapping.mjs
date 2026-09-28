import fs from 'fs';

const servicesRaw = JSON.parse(fs.readFileSync('scripts/db_services.json', 'utf8'));
const webpList = JSON.parse(fs.readFileSync('scripts/webp_list.json', 'utf8'));

// Helper to normalize strings
function norm(str) {
  return str
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9]/g, ""); // only alphanumeric
}

const manualMap = {
  "alisadoorganico": "alisado-organico",
  "babylights": "baby-light",
  "balayagesunkissedglossnutritivo": "balalage-gloss",
  "botoxcapilar": "botox-capilar",
  "colorfantasia": "color-fantasia",
  "decoloracion": "decoloracion",
  "definicionderizos": "definicion-rizos",
  "depilaciondecejasconcera": "depilacion-cera",
  "depilacionlabiosuperior": "depilacion-labio-superior",
  "depilacionmenton": "depilacion-menton",
  "depilacionrostrocompleto": "depilacion-rostro-completo",
  "dermaplaning": "dermaplanin",
  "disenodecejas": "diseno-cejas",
  "efectocateye": "efecto-cat-eye",
  "efectofoxeye": "efecto-fox-eye",
  "efectowispy": "efecto-wispy",
  "esmaltadosemipermanente": "esmaltado-semipermanente",
  "esmaltadosemipermanentepies": "esmaltado-semipermanente-pies",
  "esmaltadotradicionalpies": "esmaltado-traadicional-pies",
  "extensionesclasicas": "extensiones-clasicas",
  "extensionesdecolores": "extensiones-colores",
  "extensioneshibridas": "extensiones-hibridas",
  "extensionesmegavolumen": "extensiones-volumen-ruso",
  "extensionesvolumenrusovelvet4d": "volumen-ruso-velvet",
  "hidratacionfacial": "hidratacion-facial",
  "hidratacionprofunda": "hidratacion-profunda",
  "keratinabrasilena": "keratina-brasilera",
  "laminadotintecombo": "laminado-tinte-combo",
  "laminadodecejashdvisagismotinte": "laminado-visagismo-tinte",
  "liftingtintecombo": "liftin-tinte-combo",
  "liftingdepestanasconkeratinabotox": "lifting-pestanas-keratina-botox",
  "limpiezafacialbasica": "limpieza-facial-basica",
  "limpiezafacialexpress": "facial-express",
  "limpiezafacialprofunda": "limpieza-facial-profunda",
  "manicurarusasoftgelnails": "manicura-rusa-soft-gel",
  "manicurarusavipsoftgelnails": "manicura-rusa-soft-gel",
  "manicuratradicional": "manicura-tradicional",
  "mechashighlights": "mechas-hihglight",
  "ombre": "ombre",
  "patchtestpruebaalergia": "patch-test",
  "pedicuraexpress": "pedicura-express",
  "pedicuratradicional": "pedicura-ttradicional",
  "pedicurespadetoxjellyrelax": "pedicure-spa-jelly",
  "peinadodeevento": "peinado-evento",
  "peinadonovia": "peinado-novia",
  "permanentederizos": "permanente-rizos",
  "pigmentaciondecejas": "pigmentacion-cejas",
  "planchado": "planchado",
  "recogido": "recogido",
  "relleno3semanas": "relleno-3-semanas",
  "remocionsemipermanente": "remocion-semipermanente",
  "reparaciondeunaporuna": "reparacion-una-por-una",
  "retirodeextensiones": "retiro-extensiones",
  "retirodesistema": "retiro-sistema",
  "retoque2semanas": "retoque-2-semanas",
  "retoqueacrilicopolygel": "retoque-acrilico-poligel",
  "rubberbase": "rubber-base",
  "secadobrushing": "secado-brushing",
  "sistemapolygel": "sistema-poligel",
  "tintecompletocabellocorto": "tinte-completo-cabello-corto",
  "tintecompletocabellolargo": "tinte-completo-cabello-largo",
  "tintedecejas": "tinte-cejas",
  "tintedepestanas": "tinte-pestanas",
  "trenzas": "trenzas",
  "unasacrilicas": "unas-acrilicas"
};

const sqlStatements = [];
const matches = [];

for (const srv of servicesRaw) {
  const n = norm(srv.nombre);
  let matchedFile = manualMap[n];
  if (!matchedFile) {
    // Try fuzzy match
    matchedFile = webpList.find(w => norm(w) === n || n.includes(norm(w)) || norm(w).includes(n));
  }

  if (matchedFile) {
    const url = `/servicios/${matchedFile}.webp`;
    matches.push({ id: srv.id, nombre: srv.nombre, url });
    // UPDATE carta_servicios
    sqlStatements.push(`UPDATE carta_servicios SET media_url = '${url}', media_tipo = 'imagen' WHERE id = '${srv.id}' AND business_id = '10db8ed7-fa79-4092-9bae-760fdad63c75';`);
  } else {
    console.warn(`No match found for: "${srv.nombre}" (normalized: ${n})`);
  }
}

console.log(`Matched ${matches.length} of ${servicesRaw.length} services.`);
fs.writeFileSync('scripts/update_servicios.sql', sqlStatements.join('\n'));
console.log('SQL generated at scripts/update_servicios.sql');
