const fs = require('fs');
let code = fs.readFileSync('src/context/DashboardDataContext.tsx', 'utf8');

const beforeRatings = 'const ratingsAll: Rating[] = (rawData.citas || [])';
const mapDef = `const staffMapGlobal = new Map((rawData.staff || []).map((s: any) => [Number(s.id), String(s.nombre)]));\r\n                ${beforeRatings}`;

if (code.includes(beforeRatings) && !code.includes('staffMapGlobal')) {
  code = code.replace(beforeRatings, mapDef);
}

const targetOld = "staffId: row.staff_id,\r\n                            date: fechaRaw";
const targetNew = "staffId: row.staff_id,\r\n                            staffName: staffMapGlobal.get(Number(row.staff_id)) || (row.staff_id ? ('Staff #' + row.staff_id) : 'Atención General'),\r\n                            date: fechaRaw";

if (code.includes(targetOld)) {
  code = code.replace(targetOld, targetNew);
  fs.writeFileSync('src/context/DashboardDataContext.tsx', code, 'utf8');
  console.log('DashboardDataContext.tsx: staffName y staffMapGlobal agregados con éxito.');
} else {
  console.log('Target old CRLF no coincide.');
}
