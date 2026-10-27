const fs = require('fs');

const raw = fs.readFileSync('C:/Users/Martin/.gemini/antigravity/brain/98d4cf91-f5c9-4cd1-a376-905ce6470218/.system_generated/steps/1582/output.txt', 'utf8');
const data = JSON.parse(raw);
const wf = data.data || data;

const norm = wf.nodes.find(n => n.name === 'Normalizar Entrada');

norm.parameters.jsCode = `const body = $input.first().json.body;

if (!body || body.event !== 'messages.upsert' || !body.data) {
  return [];
}

const data = body.data;
const isFromMe = data.key?.fromMe === true;
const remoteJid = data.key?.remoteJid || '';

if (remoteJid.endsWith('@g.us') || remoteJid.endsWith('@newsletter') || remoteJid.includes('status@broadcast')) {
  return [];
}

const rawId = remoteJid.split('@')[0];
const senderPhone = rawId.replace(/\\D/g, '');

if (!senderPhone || senderPhone.length < 7) {
  return [];
}

let content = '';
let tipo = 'texto';
let urlArchivo = null;

if (data.message) {
  if (data.message.conversation) {
    content = data.message.conversation;
  } else if (data.message.extendedTextMessage?.text) {
    content = data.message.extendedTextMessage.text;
  } else if (data.message.imageMessage) {
    content = data.message.imageMessage.caption || '[Imagen]';
    tipo = 'imagen';
  } else if (data.message.audioMessage) {
    content = '[Audio]';
    tipo = 'audio';
  } else if (data.message.videoMessage) {
    content = data.message.videoMessage.caption || '[Video]';
    tipo = 'video';
  } else if (data.message.documentMessage) {
    content = data.message.documentMessage.fileName || '[Documento]';
    tipo = 'documento';
  }
}

if (data.message?.base64) {
  urlArchivo = 'data:image/jpeg;base64,' + data.message.base64;
}

return [
  {
    json: {
      instance_name: body.instance || '',
      sender_phone: senderPhone,
      sender_name: isFromMe ? 'Recepcionista' : (data.pushName || 'Cliente'),
      content: content,
      tipo: tipo,
      url_archivo: urlArchivo,
      direccion: isFromMe ? 'saliente' : 'entrante',
      estado: isFromMe ? 'enviado' : 'recibido',
      message_id: data.key?.id
    }
  }
];`;

fs.writeFileSync('scripts/fixed_logger_workflow.json', JSON.stringify({ nodes: wf.nodes, connections: wf.connections }, null, 2));
console.log('OK created scripts/fixed_logger_workflow.json');
