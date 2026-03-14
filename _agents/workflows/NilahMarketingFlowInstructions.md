# Nilah Marketing - Master n8n Flow (Roadmap Semanal)

Este documento describe la arquitectura del nuevo flujo maestro de n8n para el módulo de Marketing Inteligente de Nilah, alineado con el modelo de datos unificado en Supabase (tabla `campanas`).

## 1. El Concepto del "Router" (Múltiples Acciones, Un Endpoint)

En lugar de tener múltiples webhooks (`/marketing/generate-plan`, `/marketing/generate-campaign`, `/marketing/send-campaign`), centralizaremos la lógica en un solo Webhook de n8n con una estructura de "Router".

**Endpoint:** `POST https://{tu-n8n}/webhook/nilah-marketing-flow`

**Payload esperado (Base):**
```json
{
  "business_id": "uuid-del-salon",
  "action": "generate_month" | "generate_assets" | "schedule" | "execute",
  "payload": { ...datos especificos de la accion... }
}
```

## 2. Las 4 RutAS (Actions) del Flujo Maestro

### A. Action: `generate_month`
**Cuándo ocurre:** Cuando la dueña entra a un mes sin ideas (ej: Mayo 2026) y presiona "Generar Plan".
1. **Entrada:** `business_id`, `month`, `year`.
2. **Lógica AI:** Un nodo OpenAI/Anthropic analiza el business brief del salón, la temporada del año y genera 4 ideas (1 por semana).
3. **Database (Supabase):**
   * Usando el nodo Supabase, se hacen **4 Inserts** en la tabla `campanas`.
   * Campos clave insertados: `business_id`, `mes`, `anio`, `semana_del_mes` (1, 2, 3, 4), `status = 'sugerida'`, `titulo_idea`, etc.
4. **Salida al Frontend:** Retorna el array con las 4 campañas creadas para pintar en el `WeeklyRoadmap.tsx`.

### B. Action: `generate_assets`
**Cuándo ocurre:** Cuando la dueña hace clic en una "Idea Sugerida" (botón *Generar Activos*) y entra al Wizard Inferior (Paso 2).
1. **Entrada:** `campaign_id` (ID de supabase), datos del objetivo `objective`, `segment`, `promo`.
2. **Lógica AI:**
   * Nodo de texto: Genera el copy final de WhatsApp basado en el tono y el segmento.
   * Nodo de imagen: (DALL-E 3) Genera la imagen promocional.
3. **Database (Supabase):**
   * Actualiza el registro en `campanas` donde `id = campaign_id`
   * Setea `mensaje_whatsapp`, `imagen_url`, `ai_analysis`.
4. **Salida al Frontend:** Retorna el mensaje y la URL de la imagen para que la dueña revise.

### C. Action: `schedule` (y ejecución diferida)
**Cuándo ocurre:** En el último paso del Wizard Inferior, cuando la dueña presiona "Programar" o "Lanzar Ahora".
1. **Entrada:** `campaign_id`, `scheduled_at` (timestamp, puede ser para ahora o a futuro).
2. **Database (Supabase):**
   * Actualiza `campanas` estableciendo `fecha_programada = scheduled_at` y cambiando `status = 'programada'`.
3. **Salida Inmediata al Frontend (n8n Respond Node):** Retorna `{"success": true}` para que la app no se quede cargando.
4. **Lógica de Ejecución (En Segundo Plano dentro del mismo flujo):**
   * **Wait Node (Esperar):** El flujo entra a un nodo "Wait" (Esperar). Si la fecha programada es hoy/ahora, el Wait node pasa de inmediato. Si es la próxima semana, el flujo "duerme" sin consumir CPU hasta la fecha exacta `scheduled_at`.
   * **Ejecutar Envío:** Cuando despierta, conecta con la API de WhatsApp, recupera los clientes del segmento indicado, y lanza la campaña masiva.
   * **Database (Supabase):** Actualiza el registro a `status = 'enviada'` y guarda `mensajes_enviados = X`.

## 3. Beneficios de esta Arquitectura Optimizada
- **Cero Recursos Desperdiciados (No CRON):** Al usar el nodo `Wait` de n8n, n8n suspende el proceso en disco y solo lo despierta al segundo exacto de mandar la campaña. No hay servidores preguntándole a la base de datos "ya es hora?" cada 5 minutos.
- **Flujo 100% Unificado:** Todo (generar ideas, crear imágenes, programar y enviar) vive en un solo canvas de n8n que reacciona a un único Webhook HTTP (`POST /marketing/flow`).
- **Código Frontend simplificado:** Solo llamas a 1 función en React: `campaignsApi.flow(action, payload)`.
- **BI Perfecto:** Todo estado queda en Supabase. Puedes calcular ratios de campañas sugeridas vs activadas.
