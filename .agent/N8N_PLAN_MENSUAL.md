# Documentación: Flujo n8n - Plan Mensual de Marketing

## Endpoint
**POST** `/marketing/plan-mensual`

## Descripción
Genera o recupera el plan mensual de marketing con IA. El plan consiste en 4-5 campañas de WhatsApp sugeridas, una por semana, personalizadas según el brief del negocio, métricas del dashboard, y fechas especiales.

---

## Request Body

```json
{
  "business_id": "biz-demo",
  "mes": 1,
  "anio": 2026,
  "regenerar": false
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `business_id` | string | ID único del negocio |
| `mes` | integer | Mes (1-12) |
| `anio` | integer | Año (ej: 2026) |
| `regenerar` | boolean | Si es `true`, regenera el plan aunque exista uno en caché |

---

## Response (Éxito)

```json
{
  "success": true,
  "source": "generated",
  "business_id": "biz-demo",
  "mes": 1,
  "anio": 2026,
  "total_semanas": 4,
  "semanas": [
    {
      "semana": 1,
      "fechaInicio": "2026-01-01",
      "fechaFin": "2026-01-07",
      "fechaSugeridaEnvio": "2026-01-05",
      "titulo": "Año Nuevo, Look Nuevo",
      "objetivo": "recuperar_inactivos",
      "segmento": "inactivas_30",
      "tipoPromo": "descuento_15",
      "promoLabel": "15% OFF",
      "mensaje": "¡Hola {nombre}! 👋 ¿Lista para empezar el 2026 con el mejor look? ...",
      "ideaImagen": {
        "descripcion": "Imagen de transformación before/after",
        "elementosClaves": "Fondo festivo, globos dorados",
        "textoSugerido": "Año Nuevo, Tú Nueva 💫"
      },
      "tipsWhatsApp": [
        "Enviar entre 10-11am",
        "Usar estado de WhatsApp 1h antes",
        "Responder rápido a las primeras respuestas"
      ],
      "ideaVideo": {
        "titulo": "Transformaciones 2025",
        "concepto": "Compilado de mejores looks del año",
        "estructura": "Hook → Transformaciones → CTA reserva"
      },
      "razon": "Inicio de año es momento ideal para recuperar clientas inactivas con promoción suave.",
      "clientesObjetivo": 23,
      "ingresoEstimado": 276.00
    }
  ]
}
```

---

## Flujo de Nodos n8n

### Diagrama

```
[1. Webhook POST /marketing/plan-mensual]
    ↓
[2. Supabase: Verificar plan existente]
    ↓
[3. IF: ¿Existe plan y no regenerar?]
    ├─ TRUE → [4a. Respond: Devolver plan existente]
    └─ FALSE → continúa ↓
                  ↓
[5. Supabase: Obtener Brief del negocio]
    ↓
[6. Supabase: Obtener Clientes (vista clientes_con_calculos)]
    ↓
[7. Code: Calcular Métricas y Semanas]
    ↓
[8. Code: Construir Prompt PRO]
    ↓
[9. OpenAI/Gemini: Generar Plan con IA]
    ↓
[10. Code: Parsear y Validar JSON]
    ↓
[11. Loop: Por cada semana]
         ↓
     [12a. Supabase: Buscar existente]
         ↓
     [12b. IF: ¿Existe?]
         ├─ TRUE → [12c. Supabase: Update]
         └─ FALSE → [12d. Supabase: Create]
         ↓
[13. Respond: Plan generado]
```

---

## Configuración de Nodos

### Nodo 1: Webhook

| Campo | Valor |
|-------|-------|
| HTTP Method | `POST` |
| Path | `marketing/plan-mensual` |
| Response Mode | Using "Respond to Webhook" node |

---

### Nodo 2: Supabase - Verificar Plan Existente

| Campo | Valor |
|-------|-------|
| Operation | `Get Many` |
| Table | `planes_marketing` |
| Return All | ✅ |
| Filter 1 | `business_id` = `{{ $json.body.business_id }}` |
| Filter 2 | `mes` = `{{ $json.body.mes }}` |
| Filter 3 | `anio` = `{{ $json.body.anio }}` |
| Must Match | All Filters |

---

### Nodo 3: IF - ¿Existe Plan?

**Condición (Expression):**
```javascript
{{ $json.length > 0 && !$('Webhook').first().json.body.regenerar }}
```

---

### Nodo 5: Supabase - Obtener Brief

| Campo | Valor |
|-------|-------|
| Operation | `Get Many` |
| Table | `business_briefs` (o tu tabla de brief) |
| Limit | 1 |
| Filter | `business_id` = `{{ $('Webhook').first().json.body.business_id }}` |

**Nota:** Si no tienes tabla de brief, puedes enviarlo en el body del webhook.

---

### Nodo 6: Supabase - Obtener Clientes

| Campo | Valor |
|-------|-------|
| Operation | `Get Many` |
| Table | `clientes_con_calculos` (tu VIEW) |
| Return All | ✅ |
| Filter | `Estado` = `Activo` |

---

### Nodo 7: Code - Calcular Métricas y Semanas

Ver código en el archivo de implementación original.

---

### Nodo 8: Code - Construir Prompt PRO

Ver código en el archivo de implementación original.

---

### Nodo 9: OpenAI / Gemini

| Campo | Valor |
|-------|-------|
| Model | `gpt-4o` o `gemini-pro` |
| Temperature | 0.7 |
| Max Tokens | 3000 |

---

### Nodo 12: Upsert (IF + Create/Update)

Como Supabase en n8n no tiene operación Upsert directa, usamos:

1. **Supabase Get Many** - Buscar por business_id, mes, año, semana
2. **IF** - ¿Tiene resultados?
3. **TRUE** → Supabase Update (usar el ID encontrado)
4. **FALSE** → Supabase Create

---

## Tabla Supabase: `planes_marketing`

```sql
CREATE TABLE planes_marketing (
  id SERIAL PRIMARY KEY,
  business_id TEXT NOT NULL,
  mes INTEGER NOT NULL,
  anio INTEGER NOT NULL,
  semana INTEGER NOT NULL,
  fecha_inicio DATE,
  fecha_fin DATE,
  fecha_sugerida_envio DATE,
  titulo TEXT NOT NULL,
  objetivo TEXT NOT NULL,
  segmento TEXT NOT NULL,
  mensaje_sugerido TEXT,
  idea_imagen JSONB,
  tips_whatsapp JSONB,
  idea_video JSONB,
  tipo_promo TEXT,
  promo_label TEXT,
  clientes_objetivo INTEGER,
  ingreso_estimado DECIMAL(10,2),
  razon_ia TEXT,
  estado TEXT DEFAULT 'sugerida',
  campana_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, anio, mes, semana)
);
```

---

## Frontend: API Methods

```javascript
// services/api.js

campaigns: {
  // Obtener plan mensual (genera si no existe)
  getMonthlyPlan: async (businessId, mes, anio, regenerar = false) => {
    return await fetchN8n('/marketing/plan-mensual', 'POST', {
      business_id: businessId,
      mes,
      anio,
      regenerar
    });
  },

  // Regenerar plan (fuerza nueva generación)
  regenerateMonthlyPlan: async (businessId, mes, anio) => {
    return await fetchN8n('/marketing/plan-mensual', 'POST', {
      business_id: businessId,
      mes,
      anio,
      regenerar: true
    });
  }
}
```

---

## Componentes Frontend

| Componente | Ubicación | Descripción |
|------------|-----------|-------------|
| `MonthlyPlanView` | `components/Marketing/MonthlyPlanView.tsx` | Modal que muestra el plan mensual completo |
| `WeeklyCampaignCard` | `components/Marketing/WeeklyCampaignCard.tsx` | Tarjeta de cada semana con su campaña sugerida |
| `MonthCard` | `components/Marketing/MonthCard.tsx` | Ahora tiene botón "Ver Plan Semanal" |
| `MonthlyCarousel` | `components/Marketing/MonthlyCarousel.tsx` | Pasa el handler al MonthCard |

---

## Flujo de Usuario

1. Usuario abre módulo Marketing
2. Ve las tarjetas de meses (Enero, Febrero, Marzo)
3. Hace clic en "Ver Plan Semanal" en una tarjeta
4. Se abre el modal `MonthlyPlanView`
5. Si no hay plan, se genera con IA (5-10 seg)
6. Se muestran las 4-5 campañas por semana
7. El usuario hace clic en "Usar esta campaña"
8. Se abre el builder Express con los datos pre-cargados
