const fs = require('fs');
const rawData = fs.readFileSync('C:/Users/Martin/.gemini/antigravity/brain/1006e7ee-257b-44c3-89f6-cbe06862fb7a/.system_generated/steps/2219/output.txt', 'utf8');
const data = JSON.parse(rawData).data;

let nodes = data.nodes;
let connections = data.connections;

function updateNode(name, updates) {
    const node = nodes.find(n => n.name === name);
    if (node) Object.assign(node, updates);
}

// 1. Modificar Filtrar por hora_fin y Calcular Puntos
const calcPuntos = nodes.find(n => n.name === 'Filtrar por hora_fin y Calcular Puntos');
let jsCodePuntos = calcPuntos.parameters.jsCode;
jsCodePuntos = jsCodePuntos.replace(
    /nombre_cliente: cita.nombre_cliente \|\| cita.nombre,[\s\S]*?id_cliente_enlace: clienteId,/s,
    `nombre_cliente: cita.nombre_cliente || cita.nombre,
            telefono_cliente: cita.telefono || cita.cliente_telefono,
            id_cliente_enlace: clienteId,
            categoria_id: cita.categoria_id || cita.categoria || null,
            staff_id: cita.staff_id || null,`
);
calcPuntos.parameters.jsCode = jsCodePuntos;

// 2. Renombrar y actualizar Leer Premios -> Leer Premios Global
updateNode('Leer Premios', {
    name: 'Leer Premios Global',
    parameters: {
        operation: 'getAll',
        tableId: 'Premios',
        returnAll: true,
        matchType: 'allFilters',
        filters: {
            conditions: [
                {
                    keyName: 'business_id',
                    condition: 'eq',
                    keyValue: '={{ $(\'Obtener Datos del Cliente\').first().json.business_id }}'
                },
                {
                    keyName: 'activo',
                    condition: 'eq',
                    keyValue: '={{ true }}'
                }
            ]
        }
    }
});

// 3. Renombrar y actualizar Code (Preparar Mensaje y Suma) -> Code (Preparar Mensaje Global)
updateNode('Code (Preparar Mensaje y Suma)', {
    name: 'Code (Preparar Mensaje Global)'
});
// Reemplazar la referencia en Enviar Mensaje a Code (Preparar Mensaje y Suma)
updateNode('Enviar Mensaje', {
    parameters: {
        ...nodes.find(n => n.name === 'Enviar Mensaje').parameters,
        bodyParameters: {
            parameters: [
                { name: 'message_type', value: 'outgoing' },
                { name: 'private', value: 'false' },
                { name: 'content', value: '={{\n{\n  "content": `${$(\'Code (Preparar Mensaje Global)\')?.item?.json?.saludo_dinamico || $(\'Code (Preparar Mensaje Staff)\')?.item?.json?.saludo_dinamico || \'¡Hola!\'}\n\n✨ **¡Sumaste ${$(\'Code (Preparar Mensaje Global)\')?.item?.json?.puntos_nuevos || $(\'Code (Preparar Mensaje Staff)\')?.item?.json?.puntos_nuevos || 0} Puntos!**\nTu saldo actual es: *${$(\'Code (Preparar Mensaje Global)\')?.item?.json?.puntos_totales || $(\'Code (Preparar Mensaje Staff)\')?.item?.json?.puntos_totales || 0} puntos*.\n\n${$(\'Code (Preparar Mensaje Global)\')?.item?.json?.lista_premios || $(\'Code (Preparar Mensaje Staff)\')?.item?.json?.lista_premios || \'\'}\n\n${$(\'Code (Preparar Mensaje Global)\')?.item?.json?.mensaje_accion || $(\'Code (Preparar Mensaje Staff)\')?.item?.json?.mensaje_accion || \'\'}`,\n  "message_type": "outgoing",\n  "private": false\n}\n}}' }
            ]
        }
    }
});


// 4. Renombrar Actualizar puntos -> Actualizar puntos Global
updateNode('Actualizar puntos', {
    name: 'Actualizar puntos Global',
    parameters: {
        operation: 'update',
        tableId: 'Clientes',
        matchType: 'allFilters',
        filters: {
            conditions: [
                {
                    keyName: 'id',
                    condition: 'eq',
                    keyValue: '={{ $(\'Obtener Datos del Cliente\').first().json.id }}'
                }
            ]
        },
        fieldsUi: {
            fieldValues: [
                { fieldId: 'puntos_acumulados', fieldValue: '={{ $json.puntos_totales }}' },
                { fieldId: 'total_visitas', fieldValue: '={{ $json.visitas_totales }}' },
                { fieldId: 'categoria', fieldValue: '={{ $json.nueva_categoria }}' }
            ]
        }
    }
});

connections['Leer Premios Global'] = connections['Leer Premios'];
delete connections['Leer Premios'];
connections['Obtener Datos del Cliente'].main[0][0].node = 'Leer Premios Global';

connections['Code (Preparar Mensaje Global)'] = connections['Code (Preparar Mensaje y Suma)'];
delete connections['Code (Preparar Mensaje y Suma)'];
connections['Leer Premios Global'].main[0][0].node = 'Code (Preparar Mensaje Global)';

connections['Actualizar puntos Global'] = connections['Actualizar puntos'];
delete connections['Actualizar puntos'];
connections['Code (Preparar Mensaje Global)'].main[0][0].node = 'Actualizar puntos Global';
connections['Actualizar puntos Global'].main[0][0].node = 'buscar contacto';

// 5. Configurar Sumar Puntos Categoría (Staff)
updateNode('Sumar Puntos Categoría (Staff)', {
    parameters: {
        operation: 'upsert',
        tableId: 'PuntosCategoria',
        columns: 'cliente_id,categoria_id',
        fieldsUi: {
            fieldValues: [
                { fieldId: 'cliente_id', fieldValue: '={{ $(\'Obtener Datos del Cliente\').first().json.id }}' },
                { fieldId: 'categoria_id', fieldValue: '={{ $(\'Loop Over Items\').item.json.categoria_id }}' },
                { fieldId: 'business_id', fieldValue: '={{ $(\'Obtener Datos del Cliente\').first().json.business_id }}' },
                { fieldId: 'puntos_categoria', fieldValue: '={{ (parseFloat($(\'Leer Puntos Categoria Actualizados (Antes)\')?.first()?.json?.puntos_categoria || 0) + parseFloat($(\'Loop Over Items\').item.json.puntos_nuevos || 0)) }}' },
                { fieldId: 'visitas_categoria', fieldValue: '={{ (parseInt($(\'Leer Puntos Categoria Actualizados (Antes)\')?.first()?.json?.visitas_categoria || 0) + 1) }}' },
                { fieldId: 'estado', fieldValue: 'activo' }
            ]
        }
    }
});

// AÑADIR NUEVOS NODOS STAFF
const newNodes = [
    {
        parameters: {
            operation: 'getAll',
            tableId: 'PuntosCategoria',
            limit: 1,
            matchType: 'allFilters',
            filters: {
                conditions: [
                    { keyName: 'cliente_id', condition: 'eq', keyValue: '={{ $(\'Obtener Datos del Cliente\').first().json.id }}' },
                    { keyName: 'categoria_id', condition: 'eq', keyValue: '={{ $(\'Loop Over Items\').item.json.categoria_id }}' }
                ]
            }
        },
        name: 'Leer Puntos Categoria Actualizados (Antes)',
        type: 'n8n-nodes-base.supabase',
        typeVersion: 1,
        position: [2000, 480],
        id: 'read-puntos-cat-antes',
        credentials: { supabaseApi: { id: 'YlSUI38ukE7hX1FQ', name: 'Supabase account' } }
    },
    {
        parameters: {
            operation: 'getAll',
            tableId: 'PuntosCategoria',
            limit: 1,
            matchType: 'allFilters',
            filters: {
                conditions: [
                    { keyName: 'cliente_id', condition: 'eq', keyValue: '={{ $(\'Obtener Datos del Cliente\').first().json.id }}' },
                    { keyName: 'categoria_id', condition: 'eq', keyValue: '={{ $(\'Loop Over Items\').item.json.categoria_id }}' }
                ]
            }
        },
        name: 'Leer Puntos Categoria Actualizados (Despues)',
        type: 'n8n-nodes-base.supabase',
        typeVersion: 1,
        position: [2400, 480],
        id: 'read-puntos-cat-despues',
        credentials: { supabaseApi: { id: 'YlSUI38ukE7hX1FQ', name: 'Supabase account' } }
    },
    {
        parameters: {
            operation: 'getAll',
            tableId: 'Premios',
            returnAll: true,
            matchType: 'allFilters',
            filters: {
                conditions: [
                    { keyName: 'business_id', condition: 'eq', keyValue: '={{ $(\'Obtener Datos del Cliente\').first().json.business_id }}' },
                    { keyName: 'categoria_id', condition: 'eq', keyValue: '={{ $(\'Loop Over Items\').item.json.categoria_id }}' },
                    { keyName: 'activo', condition: 'eq', keyValue: '={{ true }}' }
                ]
            }
        },
        name: 'Leer Premios Staff',
        type: 'n8n-nodes-base.supabase',
        typeVersion: 1,
        position: [2600, 480],
        id: 'read-premios-staff',
        credentials: { supabaseApi: { id: 'YlSUI38ukE7hX1FQ', name: 'Supabase account' } }
    },
    {
        parameters: {
            jsCode: `// PREPARAR MENSAJE DE FIDELIZACIÓN (STAFF)
const LINK_GOOGLE_MAPS = "https://g.page/r/TU_LINK_AQUI/review"; 
const NOMBRE_NEGOCIO = $('Obtener Tipo Fidelización').first().json.nombre || "nuestro salón";

const cliente = $('Obtener Datos del Cliente').first().json;
const datosLoop = $('Loop Over Items').item.json;
const puntosCat = $('Leer Puntos Categoria Actualizados (Despues)').first()?.json || { puntos_categoria: 0, visitas_categoria: 1 };
const categoriaNombre = datosLoop.categoria_id || "el servicio";

const puntosNuevos = Math.floor(parseFloat(datosLoop.puntos_nuevos || 0));
const puntosTotales = Math.floor(parseFloat(puntosCat.puntos_categoria || 0));
const visitasActuales = parseInt(puntosCat.visitas_categoria || 1);

const nombreCorto = (cliente.nombre || 'Cliente').split(' ')[0];
let saludo_dinamico = "¡Hola " + nombreCorto + "! 👑\\n\\nGracias por atenderte en la categoría " + categoriaNombre + ".";
let mensaje_accion = "⭐ *Ayúdanos a crecer:*\\n¿Nos regalarías una reseña en Google?\\n👉 " + LINK_GOOGLE_MAPS;

const premiosRaw = $('Leer Premios Staff').all().map(p => p.json);

let mapaPremios = premiosRaw.map(p => {
    const nombre = p['Nombre del Premio'] || p.nombre || "Premio";
    const costo = parseInt(p['Puntos Requeridos'] || p.costo_puntos || 0);
    return { nombre, costo, faltan: costo - puntosTotales, esGanado: costo <= puntosTotales };
});

const ganados = mapaPremios.filter(m => m.esGanado).sort((a, b) => b.costo - a.costo);
const pendientes = mapaPremios.filter(m => !m.esGanado).sort((a, b) => a.faltan - b.faltan);

let textoPremios = "";
if (ganados.length > 0) {
    textoPremios += "🎁 *¡YA PUEDES CANJEAR EN ESTA CATEGORÍA!* 👇\\n";
    ganados.slice(0, 3).forEach(m => { textoPremios += \`✅ \${m.nombre} *(\${m.costo} pts)*\\n\`; });
    textoPremios += "\\n";
}
if (pendientes.length > 0) {
    textoPremios += ganados.length > 0 ? "🚀 *Tu siguiente meta:*\\n" : "🎯 *Estás muy cerca de:*\\n";
    pendientes.slice(0, 2).forEach(m => { textoPremios += \`🔒 \${m.nombre} *(Te faltan +\${m.faltan} pts)*\\n\`; });
}

return {
    json: {
        saludo_dinamico,
        puntos_nuevos: puntosNuevos,
        puntos_totales: puntosTotales,
        lista_premios: textoPremios,
        mensaje_accion
    }
};`
        },
        name: 'Code (Preparar Mensaje Staff)',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [2800, 480],
        id: 'code-prep-msg-staff'
    }
];
nodes.push(...newNodes);

// Limpiar y reconectar rama Staff
delete connections['¿Modo Staff?'].main[0][0]; // Quitar Code (Preparar Mensaje...) de Staff (TRUE) branch
if (connections['¿Modo Staff?'].main[0][1]) delete connections['¿Modo Staff?'].main[0][1];

connections['¿Modo Staff?'].main[0] = [{ node: 'Leer Puntos Categoria Actualizados (Antes)', type: 'main', index: 0 }];
connections['¿Modo Staff?'].main[1] = [{ node: 'Leer Premios Global', type: 'main', index: 0 }]; // FALSE branch

connections['Leer Puntos Categoria Actualizados (Antes)'] = { main: [[{ node: 'Sumar Puntos Categoría (Staff)', type: 'main', index: 0 }]] };
connections['Sumar Puntos Categoría (Staff)'] = { main: [[{ node: 'Leer Puntos Categoria Actualizados (Despues)', type: 'main', index: 0 }]] };
connections['Leer Puntos Categoria Actualizados (Despues)'] = { main: [[{ node: 'Leer Premios Staff', type: 'main', index: 0 }]] };
connections['Leer Premios Staff'] = { main: [[{ node: 'Code (Preparar Mensaje Staff)', type: 'main', index: 0 }]] };
connections['Code (Preparar Mensaje Staff)'] = { main: [[{ node: 'buscar contacto', type: 'main', index: 0 }]] };

// También limpiar de Loop Over al tipo_fidelizacion y luego modo staff
// Wait, in original, Loop Over items goes to Obtener Datos del Cliente -> Leer Premios -> Code / Obtener Tipo Fidelización
// We need Obtener Tipo Fidelización right after Obtener Datos del Cliente to branch BEFORE Reading Rewards.

connections['Obtener Datos del Cliente'].main[0] = [{ node: 'Obtener Tipo Fidelización', type: 'main', index: 0 }];
connections['Obtener Tipo Fidelización'].main = [[{ node: '¿Modo Staff?', type: 'main', index: 0 }]];

fs.writeFileSync('C:/Users/Martin/Documents/Korat-Flow-Agencia/Korat_MVP/workflow_updated.json', JSON.stringify({ nodes, connections }, null, 2));
console.log('Done!');
