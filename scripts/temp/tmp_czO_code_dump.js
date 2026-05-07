
/* === Node: Unificar Texto- Identidad Cliente === */
// === Unificar Texto - Identidad Cliente ===
// Unifica el contenido de texto de distintos inputs (audio, foto, texto)
// y agrega la identidad del cliente si se encontró en Supabase.

const items = $input.all();
const configTenant = $('Combinar Config Tenant').first().json;

// Obtener todos los mensajes acumulados en Redis
const allMessages = $('Redis').first().json;
let textoUnificado = '';

// SOLUCIÓN: Buscar tanto en 'value' como en 'propertyName'
const redisContent = allMessages ? (allMessages.value || allMessages.propertyName) : null;

if (redisContent) {
  try {
    const mensajes = JSON.parse(redisContent);
    textoUnificado = mensajes.join('\n');
  } catch(e) {
    textoUnificado = redisContent;
  }
} else {
  textoUnificado = configTenant.content || 'Hola';
}

// Buscar si se encontró al cliente en Supabase
let nombreDetectado = null;
let idClienteDetectado = null;
let categoriaCliente = 'Nuevo';
let telefonoCliente = configTenant.sender_phone || null;

try {
  const clienteInicial = $('Buscar cliente inicial').first().json;
  if (clienteInicial && clienteInicial.id) {
    nombreDetectado = clienteInicial.nombre || null;
    idClienteDetectado = clienteInicial.id;
    categoriaCliente = clienteInicial.categoria || 'Frecuente';
    telefonoCliente = clienteInicial.telefono || telefonoCliente;
  }
} catch(e) {
  // No se encontró cliente, queda como Nuevo
}

return [{
  json: {
    input_final: textoUnificado,
    chat_id: String(configTenant.conversation_id),
    nombre_cliente_detectado: nombreDetectado,
    id_cliente_detectado: idClienteDetectado,
    categoria_cliente: categoriaCliente,
    telefono_cliente: telefonoCliente,
    business_id: configTenant.business_id,
    nombre_negocio: configTenant.nombre_negocio,
    nombre_bot: configTenant.nombre_bot,
    timezone: configTenant.timezone,
    moneda: configTenant.moneda,
    idioma: configTenant.idioma,
    chatwoot_api_url: configTenant.chatwoot_api_url,
    chatwoot_api_token: configTenant.chatwoot_api_token,
    chatwoot_account_id: configTenant.chatwoot_account_id,
    chatbot_tipo: configTenant.chatbot_tipo || 'autonomo',
    recursos_saas: configTenant.recursos_saas || {}
  }
}];

/* === Node: recuperar datos webhook === */
// =============================================
// RECUPERAR DATOS WEBHOOK - Multi-Tenant
// Lee datos del tenant config + webhook original
// =============================================

// 1. RECUPERAR DATOS DEL TENANT CONFIG
const tenantConfig = $('Combinar Config Tenant').first().json;

// 3. LÓGICA DE ESTADO (Bot On/Off)
let isBotOn = tenantConfig.bot_active;

// 4. SALIDA FINAL
return {
  json: {
    bot_active: isBotOn,
    // Datos del mensaje (ya normalizados)
    message_content: tenantConfig.content,
    conversation_id: tenantConfig.conversation_id,
    contact_id: tenantConfig.contact_id,
    sender_name: tenantConfig.sender_name,
    attachments: tenantConfig.attachments || [],
    

    // === DATOS DEL TENANT (propagados) ===
    business_id: tenantConfig.business_id,
    nombre_negocio: tenantConfig.nombre_negocio,
    nombre_bot: tenantConfig.nombre_bot,
    timezone: tenantConfig.timezone,
    moneda: tenantConfig.moneda,
    idioma: tenantConfig.idioma,
    chatwoot_api_url: tenantConfig.chatwoot_api_url,
    chatwoot_api_token: tenantConfig.chatwoot_api_token,
    chatwoot_account_id: tenantConfig.chatwoot_account_id,
    sender_phone: (tenantConfig.sender_phone || '').replace('+', ''),
    inbox_id: tenantConfig.inbox_id,
    canal: tenantConfig.canal, 
    telefono_recepcionista: tenantConfig.telefono_recepcionista,
    marca_identidad: tenantConfig.marca_identidad,
     // --- NUEVO: Estado del bot por cliente ---
    bot_cliente_pausado: tenantConfig.bot_cliente_pausado,
    bot_pausado_hasta: tenantConfig.bot_pausado_hasta,
    bot_pausado_razon: tenantConfig.bot_pausado_razon
  }
};
/* === Node: Combinar Config Tenant === */
// === Combinar Config Tenant ===
// Fusiona datos del webhook normalizado + datos del negocio desde Supabase
// + estado del bot por cliente (bot_pausado)

const canal = $('Resolver Tenant').first().json;
const negocio = $('Buscar Negocio').first().json;

// Leer bot_pausado del cliente (si existe el registro)
let botPausadoCliente = false;
let botPausadoHasta = null;
let botPausadoRazon = null;
try {
  const items = $('Buscar Bot Cliente').all();
  if (items && items.length > 0 && items[0].json && items[0].json.id) {
    const cli = items[0].json;
    botPausadoCliente = cli.bot_pausado === true;
    botPausadoHasta = cli.bot_pausado_hasta || null;
    botPausadoRazon = cli.bot_pausado_razon || null;
    // Si la fecha ya paso, tratamos como activo
    if (botPausadoCliente && botPausadoHasta) {
      const ahora = new Date();
      const hasta = new Date(botPausadoHasta);
      if (hasta <= ahora) {
        botPausadoCliente = false;
        botPausadoHasta = null;
        botPausadoRazon = null;
      }
    }
  }
} catch(e) {
  botPausadoCliente = false;
}

// Extraer recursos_saas (Feature Flags SaaS)
const recursosSaaS = negocio.recursos_saas || {
  plan_base: 'automatico',
  chatbot: { tipo: 'autonomo', activo: true },
  modulos: {},
  limites: { max_staff: 3 }
};

return [{
  json: {
    ...canal,
    business_id: negocio.id,
    nombre_bot: negocio.marca_identidad?.adn_json?.nombre_bot || recursosSaaS.chatbot?.nombre || negocio.bot_config?.nombre || 'Nilah',
    nombre_negocio: negocio.nombre,
    timezone: negocio.timezone || 'America/Lima',
    moneda: negocio.moneda || 'S/.',
    idioma: negocio.idioma || 'es-PE',
    bot_config: negocio.bot_config || {},
    recursos_saas: recursosSaaS,
    chatbot_tipo: recursosSaaS.chatbot?.tipo || 'autonomo',
    chatwoot_api_url: negocio.chatwoot_api_url || 'https://chat.koratflow.agency',
    chatwoot_api_token: negocio.chatwoot_api_token || '',
    chatwoot_account_id: negocio.chatwoot_account_id || canal.account_id,
    telefono_recepcionista: negocio.telefono_recepcionista,
    marca_identidad: negocio.marca_identidad || null,
    // --- NUEVO: Estado del bot por cliente ---
    bot_cliente_pausado: botPausadoCliente,
    bot_pausado_hasta: botPausadoHasta,
    bot_pausado_razon: botPausadoRazon
  }
}];