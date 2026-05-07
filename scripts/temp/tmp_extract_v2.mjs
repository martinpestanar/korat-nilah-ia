import fs from 'fs';

const v2 = JSON.parse(fs.readFileSync('C:/Users/Martin/Documents/Korat-Flow-Agencia/Korat_MVP/NilahIA_Evolution_v2.json', 'utf8'));

const nodesToKeep = v2.nodes.filter(n => 
  n.name === 'Edit Fields' || 
  n.name === 'Enviar Parte 1' || 
  n.name === 'Enviar Parte 2' || 
  n.name === 'Encender Bot' || 
  n.name === 'Firmar Mensaje AI DB' ||
  n.name === 'Buscar Bot Cliente' ||
  n.type.includes('httpRequest') ||
  n.type.includes('supabase')
);

fs.writeFileSync('C:/Users/Martin/Documents/Korat-Flow-Agencia/Korat_MVP/tmp_v2_nodes.json', JSON.stringify(nodesToKeep, null, 2));
