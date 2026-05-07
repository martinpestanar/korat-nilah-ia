const fs = require('fs');
const http = require('http');

// Read API Key
const env = fs.readFileSync('.env', 'utf8');
const match = env.match(/N8N_API_KEY=(.*)/);
if(!match) {
    console.error("No API key");
    process.exit(1);
}
const key = match[1].trim();

const options = {
    hostname: 'localhost',
    port: 5678,
    path: '/api/v1/workflows/iT3Ql0LwitRoIuQZ',
    method: 'GET',
    headers: {
        'X-N8N-API-KEY': key,
        'Content-Type': 'application/json'
    }
};

const req = http.request(options, (res) => {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
        try {
            const parsedData = JSON.parse(rawData);
            let nodes = parsedData.nodes;
            
            // 1. Update Edit Fields
            let editNode = nodes.find(n => n.name === 'Edit Fields');
            editNode.parameters.assignments.assignments.push(
                {
                    "id": "e_estilo",
                    "name": "estilo",
                    "value": "={{ $json.body.estilo || 'Modern' }}",
                    "type": "string"
                },
                {
                    "id": "e_formato",
                    "name": "formato",
                    "value": "={{ $json.body.formato || '1:1' }}",
                    "type": "string"
                },
                {
                    "id": "e_promptextra",
                    "name": "promptExtra",
                    "value": "={{ $json.body.promptExtra || '' }}",
                    "type": "string"
                },
                {
                    "id": "e_copy",
                    "name": "copy_texto",
                    "value": "={{ $json.body.copy_texto || '' }}",
                    "type": "string"
                },
                {
                    "id": "e_unique",
                    "name": "unique_id",
                    "value": "={{ $now.toFormat('yyMMddHHmmss') }}",
                    "type": "string"
                }
            );

            // 2. Update Gemini - Copy WhatsApp User Prompt
            let geminiNode = nodes.find(n => n.name === 'Gemini - Copy WhatsApp');
            geminiNode.parameters.responses.values[1].content = 
`=Genera el prompt visual para el flyer publicitario ejecutando la dirección de arte con los siguientes datos:

CONTEXTO DE LA MARCA (Identidad visual y estilo):
Tipo de Negocio: {{ $('Supabase - Traer KPIs').item.json.identidad_marca.adn_json.tipo_negocio }}
Personalidad de Marca: {{ $('Supabase - Traer KPIs').item.json.identidad_marca.adn_json.personalidad }}
Contexto Temporal: {{ $('Supabase - Traer KPIs').item.json.contexto_temporal.estacion }}

DATOS DE LA CAMPAÑA ACTUAL:
Título de la Campaña: {{ $('obtener campana').item.json.titulo }}

Mensaje y Ofertas (Extrae de aquí los precios/servicios para el flyer):
{{ $('Edit Fields').item.json.copy_texto != '' ? $('Edit Fields').item.json.copy_texto : $('obtener campana').item.json.mensaje }}

PREFERENCIAS DEL USUARIO:
Formato (Aspect Ratio): {{ $('Edit Fields').item.json.formato }}
Estilo Visual: {{ $('Edit Fields').item.json.estilo }}
Instrucciones Adicionales: {{ $('Edit Fields').item.json.promptExtra || 'Ninguna' }}

INSTRUCCIÓN:
Analiza el "Mensaje y Ofertas".
Selecciona las 3 piezas de texto en ESPAÑOL más importantes e impactantes (Ej: El título "FLASH FRIDAY", el servicio "Cejas y Pestañas", y el precio más llamativo "Desde S/15").
Construye el prompt en INGLÉS siguiendo estrictamente la estructura de tu System Prompt, asegurando que el diseño luzca como un flyer profesional de alta calidad que comunique urgencia y lujo estético. ADAPTA EL ASPECT RATIO Y ESTILO VISUAL a lo solicitado por el usuario.
Devuelve SOLO el JSON puro sin markdown blocks.`;

            // 3. Update Supabase - guardar imagen URL
            let saveImageNode = nodes.find(n => n.name === 'Supabase - guardar imagen');
            saveImageNode.parameters.url = `=https://cfggpqpbqqeavdbdzwoz.supabase.co/storage/v1/object/nilah_assets/campana_{{ $('obtener campana').item.json.id }}_{{ $('Edit Fields').item.json.unique_id }}.png`;

            // 4. Update Supabase - Guardar Activos
            let storeAssetsNode = nodes.find(n => n.name === 'Supabase - Guardar Activos');
            let imgUrlField = storeAssetsNode.parameters.fieldsUi.fieldValues.find(f => f.fieldId === 'imagen_url');
            if(imgUrlField) {
                imgUrlField.fieldValue = `=https://cfggpqpbqqeavdbdzwoz.supabase.co/storage/v1/object/public/nilah_assets/campana_{{ $('obtener campana').item.json.id }}_{{ $('Edit Fields').item.json.unique_id }}.png`;
            }

            // 5. Update Respond to Webhook
            let respondNode = nodes.find(n => n.name === 'Respond to Webhook');
            if(!respondNode.parameters.options) respondNode.parameters.options = {};
            respondNode.parameters.respondWith = "json";
            respondNode.parameters.responseBody = `={\n  "success": true,\n  "imagen_url": "https://cfggpqpbqqeavdbdzwoz.supabase.co/storage/v1/object/public/nilah_assets/campana_{{ $('obtener campana').item.json.id }}_{{ $('Edit Fields').item.json.unique_id }}.png",\n  "prompt_usado": "{{ $('formateo json').item.json.prompt_visual }}"\n}`;
            respondNode.parameters.options.responseCode = 200;

            // Update it back via PUT
            const putOptions = {
                hostname: 'localhost',
                port: 5678,
                path: '/api/v1/workflows/iT3Ql0LwitRoIuQZ',
                method: 'PUT',
                headers: {
                    'X-N8N-API-KEY': key,
                    'Content-Type': 'application/json'
                }
            };
            
            const putReq = http.request(putOptions, (putRes) => {
                let putData = '';
                putRes.on('data', (d) => putData+=d);
                putRes.on('end', () => { 
                    console.log('UPDATE STATUS:', putRes.statusCode); 
                    console.log('Update Complete.');
                });
            });
            putReq.write(JSON.stringify(parsedData));
            putReq.end();

        } catch (e) {
            console.error(e.message);
        }
    });
});

req.on('error', (e) => console.error(e));
req.end();
