# Configurar CRUD en /negocio-info

## 1. Webhook - Métodos habilitados

En el nodo **Webhook**, configura:
- Path: `/negocio-info`
- HTTP Method: `GET, PUT, POST`

> ⚠️ **No incluir DELETE** - El admin no puede eliminar campos

---

## 2. Rama GET (Leer datos)

### Nodo: Extraer Business ID
```javascript
const businessId = $('Webhook').first().json.headers['x-business-id'];
return [{ json: { businessId } }];
```

### Nodo: Supabase - Get Many Rows
- **Table Name**: negocio_info
- **Filter**: business_id = `{{ $json.businessId }}`

---

## 3. Rama PUT (Actualizar)

### Nodo: Extraer datos
```javascript
const businessId = $('Webhook').first().json.headers['x-business-id'];
const body = $('Webhook').first().json.body;
return [{ json: { businessId, ...body } }];
```

### Nodo: Supabase - Update Row
**Select Conditions** (AMBOS requeridos):
1. `business_id` = `{{ $json.businessId }}`
2. `clave` = `{{ $('Webhook').first().json.body.clave }}`

**Fields to Send**:
- `valor_texto` = `{{ $('Webhook').first().json.body.valor }}`

---

## 4. Rama POST (Crear nuevos campos)

### Nodo: Extraer datos POST
```javascript
const businessId = $('Webhook').first().json.headers['x-business-id'];
const body = $('Webhook').first().json.body;

return [{
  json: {
    businessId,
    clave: body.clave,
    valor_texto: body.valor_texto || null,
    descripcion: body.descripcion || null
  }
}];
```

### Nodo: Supabase - Insert Row
- **Table Name**: negocio_info
- **Columns to Send**: 
  - clave: `{{ $json.clave }}`
  - valor_texto: `{{ $json.valor_texto }}`
  - descripcion: `{{ $json.descripcion }}`
  - business_id: `{{ $json.businessId }}`

---

## Flujo visual:

```
                    ┌─ GET ─→ [Extract] → [Get Many]  → [Respond]
                    │
[Webhook] ─────────│─ PUT ─→ [Extract] → [Update Row] → [Respond]
                    │
                    └─ POST → [Extract] → [Insert Row] → [Respond]
```
