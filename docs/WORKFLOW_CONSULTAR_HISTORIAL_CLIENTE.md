# Workflow: consultarHistorialCliente

## Descripción
Este workflow permite al chatbot consultar el historial de servicios de un cliente para personalizar la conversación.

---

## PASO 0: Crear la Vista en Supabase

No necesitas crear una tabla nueva. Vamos a consultar las tablas existentes (`appointments` y `clientes`).

Pero si quieres optimizar las consultas, puedes crear una **Vista** en Supabase.

### SQL para crear la Vista:

Ve a Supabase > SQL Editor > New Query y ejecuta:

```sql
-- Vista para historial de cliente (con notas)
DROP VIEW IF EXISTS vista_historial_cliente;

CREATE OR REPLACE VIEW vista_historial_cliente AS
SELECT 
    c.id AS cliente_id,
    c.nombre AS cliente_nombre,
    c.telefono,
    c.categoria,
    c.total_visitas,
    c.puntos_acumulados,
    c.primera_visita,
    c.ultima_visita AS ultima_visita_registrada,
    c.estado_lifecycle,
    c.notas AS notas_cliente,
    a.id AS cita_id,
    a.servicio,
    a.fecha AS fecha_cita,
    a.precio,
    a.estado AS estado_cita
FROM "Clientes" c
LEFT JOIN "Citas" a ON c.id = a.cliente AND a.estado = 'Completada'
ORDER BY c.id, a.fecha DESC;

-- Dar permisos de lectura
GRANT SELECT ON vista_historial_cliente TO anon, authenticated;
```

**IMPORTANTE:** Las tablas se llaman "Clientes" y "Citas" con mayúscula.

---

## PASO 1: Crear el Workflow en n8n

1. Abre n8n
2. Clic en **"Create new workflow"**
3. Nombra el workflow: `Consultar Historial Cliente_chatbot`

---

## PASO 2: Nodo "When Executed by Another Workflow"

Este nodo recibe la llamada del agente.

### Configuración:

1. Busca el nodo **"Execute Workflow Trigger"**
2. Arrástralo al canvas
3. Configura:

| Campo | Valor |
|-------|-------|
| **Define using** | JSON Example |

4. En **JSON Example**, pega:
```json
{
  "telefono": "+51987654321"
}
```

5. Clic en **"Sync from JSON"** para crear el parámetro automáticamente

---

## PASO 3: Nodo "Supabase - Buscar Cliente"

Este nodo busca el cliente por teléfono.

### Configuración:

1. Busca el nodo **"Supabase"**
2. Arrástralo y conéctalo al trigger
3. Configura:

| Campo | Valor |
|-------|-------|
| **Credential** | Tu Supabase account |
| **Resource** | Row |
| **Operation** | Get Many |
| **Table Name** | Clientes |
| **Return All** | ❌ OFF |
| **Limit** | 1 |

4. En **Filters**, haz clic en **"Add Filter"**:

| Field Name or ID | Condition | Field Value |
|------------------|-----------|-------------|
| telefono | Equal | `{{ $json.telefono }}` |

5. Nombra el nodo: `Buscar Cliente`

---

## PASO 4: Nodo "IF - Cliente Existe?"

Verificamos si encontramos al cliente.

### Configuración:

1. Busca el nodo **"IF"**
2. Arrástralo y conéctalo a "Buscar Cliente"
3. Configura:

| Campo | Valor |
|-------|-------|
| **Condition** | Boolean |

4. En **Value 1** (Expression):
```
{{ $json.id !== undefined && $json.id !== null }}
```

5. Nombra el nodo: `Cliente Existe?`

---

## PASO 5: Nodo "Supabase - Obtener Citas del Cliente" (rama TRUE)

Este nodo obtiene las citas completadas del cliente.

### Configuración:

1. Busca el nodo **"Supabase"**
2. Arrástralo y conéctalo a la rama **TRUE** del IF
3. Configura:

| Campo | Valor |
|-------|-------|
| **Credential** | Tu Supabase account |
| **Resource** | Row |
| **Operation** | Get Many |
| **Table Name** | Citas |
| **Return All** | ✅ ON |

4. En **Filters**, haz clic en **"Add Filter"**:

**Filtro 1:**
| Field Name or ID | Condition | Field Value |
|------------------|-----------|-------------|
| cliente | Equal | `{{ $('Buscar Cliente').item.json.id }}` |

5. Haz clic en **"Add Filter"** de nuevo:

**Filtro 2:**
| Field Name or ID | Condition | Field Value |
|------------------|-----------|-------------|
| estado | Equal | Completada |

6. En **Options** > **Sort**, configura:

| Field Name | Order |
|------------|-------|
| fecha | Descending |

7. Nombra el nodo: `Obtener Citas Cliente`

---

## PASO 6: Nodo "Code - Procesar Historial"

Este nodo procesa las citas y calcula estadísticas.

### Configuración:

1. Busca el nodo **"Code"**
2. Arrástralo y conéctalo a "Obtener Citas Cliente"
3. Configura:

| Campo | Valor |
|-------|-------|
| **Mode** | Run Once for All Items |
| **Language** | JavaScript |

4. En **JavaScript**, pega este código:

```javascript
// Obtener datos del cliente y citas
const cliente = $('Buscar Cliente').first().json;
const citas = $input.all().map(item => item.json);

// Si no hay citas, retornar cliente con sus datos pero sin historial
if (citas.length === 0 || !citas[0].servicio) {
  return [{
    json: {
      cliente_id: cliente.id,
      nombre: cliente.nombre,
      telefono: cliente.telefono,
      notas_cliente: cliente.notas || null,
      categoria: cliente.categoria || null,
      es_cliente_nuevo: true,
      total_visitas: 0,
      ultimos_servicios: [],
      servicio_favorito: null,
      ultima_visita: null,
      dias_sin_venir: null,
      total_gastado: 0,
      es_cliente_frecuente: false,
      mensaje: "Cliente sin historial de citas completadas"
    }
  }];
}

// Calcular últimos servicios (máximo 5)
const ultimosServicios = citas
  .slice(0, 5)
  .map(c => c.servicio);

// Calcular servicio favorito (el más repetido)
const conteoServicios = {};
citas.forEach(c => {
  if (c.servicio) {
    conteoServicios[c.servicio] = (conteoServicios[c.servicio] || 0) + 1;
  }
});

let servicioFavorito = null;
let maxCount = 0;
for (const [servicio, count] of Object.entries(conteoServicios)) {
  if (count > maxCount) {
    maxCount = count;
    servicioFavorito = servicio;
  }
}

// Calcular última visita y días sin venir
const ultimaCita = citas[0];
const ultimaVisita = ultimaCita.fecha;
const fechaUltima = new Date(ultimaVisita);
const hoy = new Date();
const diasSinVenir = Math.floor((hoy - fechaUltima) / (1000 * 60 * 60 * 24));

// Calcular total gastado
const totalGastado = citas.reduce((sum, c) => {
  return sum + (parseFloat(c.precio) || 0);
}, 0);

// Retornar resultado con notas_cliente
return [{
  json: {
    cliente_id: cliente.id,
    nombre: cliente.nombre,
    telefono: cliente.telefono,
    notas_cliente: cliente.notas || null,
    categoria: cliente.categoria || null,
    es_cliente_nuevo: false,
    total_visitas: citas.length,
    ultimos_servicios: ultimosServicios,
    servicio_favorito: servicioFavorito,
    veces_servicio_favorito: maxCount,
    ultima_visita: ultimaVisita,
    dias_sin_venir: diasSinVenir,
    total_gastado: Math.round(totalGastado * 100) / 100,
    es_cliente_frecuente: citas.length >= 3,
    historial_detallado: citas.slice(0, 5).map(c => ({
      servicio: c.servicio,
      fecha: c.fecha,
      precio: c.precio
    }))
  }
}];
```

5. Nombra el nodo: `Procesar Historial`

---

## PASO 7: Nodo "Code - Cliente No Encontrado" (rama FALSE)

Este nodo maneja cuando el cliente no existe.

### Configuración:

1. Busca el nodo **"Code"**
2. Arrástralo y conéctalo a la rama **FALSE** del IF "Cliente Existe?"
3. Configura:

| Campo | Valor |
|-------|-------|
| **Mode** | Run Once for All Items |
| **Language** | JavaScript |

4. En **JavaScript**, pega:

```javascript
const telefono = $('When Executed by Another Workflow').first().json.telefono;

return [{
  json: {
    cliente_id: null,
    nombre: null,
    telefono: telefono,
    notas_cliente: null,
    categoria: null,
    es_cliente_nuevo: true,
    total_visitas: 0,
    ultimos_servicios: [],
    servicio_favorito: null,
    ultima_visita: null,
    dias_sin_venir: null,
    total_gastado: 0,
    es_cliente_frecuente: false,
    mensaje: "Cliente no encontrado en la base de datos"
  }
}];
```

5. Nombra el nodo: `Cliente No Encontrado`

---

## PASO 8: Nodo "Merge" (unir resultados)

Este nodo une las dos ramas (cliente encontrado y no encontrado).

### Configuración:

1. Busca el nodo **"Merge"**
2. Arrástralo al canvas
3. Conecta:
   - "Procesar Historial" → Input 1
   - "Cliente No Encontrado" → Input 2
4. Configura:

| Campo | Valor |
|-------|-------|
| **Mode** | Append |

5. Nombra el nodo: `Unir Resultados`

---

## PASO 9: Nodo "Set - Formatear Respuesta Final"

Este nodo formatea la respuesta para el agente.

### Configuración:

1. Busca el nodo **"Set"**
2. Arrástralo y conéctalo a "Unir Resultados"
3. Configura:

| Campo | Valor |
|-------|-------|
| **Mode** | Manual Mapping |
| **Include Other Input Fields** | ❌ OFF |

4. Haz clic en **"Add Field"** y agrega:

| Name | Type | Value |
|------|------|-------|
| resultado | String | (ver abajo) |

5. En el campo **Value** de "resultado", usa esta expresión:
```
{{ JSON.stringify($json) }}
```

6. Nombra el nodo: `Formatear Respuesta`

---

## ESTRUCTURA FINAL DEL WORKFLOW:

```
[When Executed by Another Workflow]
           ↓
    [Buscar Cliente]
           ↓
    [Cliente Existe?]
        ↙     ↘
  TRUE          FALSE
    ↓              ↓
[Obtener Citas]  [Cliente No Encontrado]
    ↓              ↓
[Procesar Historial]
        ↘     ↙
     [Unir Resultados]
           ↓
   [Formatear Respuesta]
```

---

## PASO 10: Guardar y Activar

1. Haz clic en **"Save"**
2. Haz clic en el toggle **"Active"** para activar el workflow

---

## PASO 11: Registrar como Herramienta en el Agente

Ahora debes agregar esta herramienta al agente de chat en n8n.

1. Abre el workflow del agente (donde está el AI Agent)
2. Busca el nodo **"Call n8n Workflow Tool"**
3. Arrástralo y conéctalo como herramienta del agente
4. Configura:

| Campo | Valor |
|-------|-------|
| **Name** | consultarHistorialCliente |
| **Description** | HERRAMIENTA para consultar el historial de citas y servicios de un cliente existente. Retorna: últimos servicios, servicio favorito, última visita, días sin venir y total gastado. Usar al inicio de conversación con cliente existente. |
| **Source** | Database |
| **Workflow** | Consultar Historial Cliente_chatbot |

5. En **Workflow Inputs**, configura:

**Agregar input 1:**
| Name | Description |
|------|-------------|
| telefono | Número de teléfono del cliente con código de país |

---

## EJEMPLO DE RESPUESTA DEL WORKFLOW:

```json
{
  "cliente_id": 716,
  "nombre": "María García",
  "telefono": "+51987654321",
  "notas_cliente": "Prefiere música suave. Alérgica al acrílico.",
  "categoria": "Bronze",
  "es_cliente_nuevo": false,
  "total_visitas": 5,
  "ultimos_servicios": ["Polygel", "Polygel", "Manicura Rusa", "Polygel", "Lifting"],
  "servicio_favorito": "Polygel",
  "veces_servicio_favorito": 3,
  "ultima_visita": "2024-01-15",
  "dias_sin_venir": 15,
  "total_gastado": 450.00,
  "es_cliente_frecuente": true,
  "historial_detallado": [
    {"servicio": "Polygel", "fecha": "2024-01-15", "precio": 90},
    {"servicio": "Polygel", "fecha": "2024-01-01", "precio": 90},
    {"servicio": "Manicura Rusa", "fecha": "2023-12-20", "precio": 55}
  ]
}
```

---

## TESTING:

Para probar el workflow:

1. Haz clic en el nodo "When Executed by Another Workflow"
2. Haz clic en **"Test Workflow"**
3. Ingresa un teléfono de prueba que exista en tu base de datos
4. Verifica que retorne el historial correctamente

---

## SOLUCIÓN DE PROBLEMAS:

**Error: "Cannot read property of undefined"**
- Verifica que el teléfono tenga el formato correcto (+51...)
- Verifica que la tabla `appointments` tenga la columna `cliente_id`

**Error: "No items to process"**
- El cliente no tiene citas completadas
- Verifica que tengas citas con estado = "completada"

**El workflow no retorna nada**
- Verifica que el workflow esté activo
- Verifica las conexiones entre nodos

---

## FIN DE LA GUÍA ✅
