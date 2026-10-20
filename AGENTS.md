# Supabase & Architecture Guidelines for Korat_MVP

## 1. Contexto de la Base de Datos del Proyecto
Este proyecto (`Korat_MVP`) utiliza una base de datos de Supabase **independiente y aislada**:
- **Project ID**: `cfggpqpbqqeavdbdzwoz`
- **URL**: `https://cfggpqpbqqeavdbdzwoz.supabase.co`
- **Cadena de Conexión Postgres**:
  `postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres`

## 2. Regla Estricta para Herramientas de Base de Datos y Supabase
1. **NO usar la cuenta global de Supabase:** Si existe una conexión MCP oficial global de Supabase (`https://mcp.supabase.com/mcp`), esta pertenece a otro proyecto de restaurantes (`koratflow-suna's Project`). **NUNCA** utilices las tablas de restaurantes (`restaurantes`, `categorias_menu`, `items_menu`, etc.) para este proyecto.
2. **Acceso a Datos y Tablas:**
   - Cuando se consulte tablas, SQL, esquemas o migraciones en este workspace, utiliza siempre la base de datos de este proyecto (`cfggpqpqpbqqeavdbdzwoz`).
   - El workspace cuenta con la librería `pg` instalada y la cadena de conexión configurada en [.vscode/mcp.json](.vscode/mcp.json) y [mcp_config.json](mcp_config.json).
3. **Tablas Principales:**
   - `Citas`, `Clientes`, `Usuarios`, `campanas`, `negocios`, `staff`, `servicios`, `copilot_conversations`, `plantillas_automatizacion`, etc.

---

## 3. PROTOCOLO OBLIGATORIO DE NO REGRESIÓN (BLINDAJE DE CÓDIGO)

### Regla 1: Enfoque Quirúrgico (Surgical Scope)
- Modifica **únicamente** el archivo, función o componente directamente relacionado con la solicitud del usuario o el bug reportado.
- **PROHIBIDO** refactorizar archivos no relacionados, reformatear estilos globales o alterar la estructura de componentes que no tengan que ver con la tarea.
- Preserva siempre comentarios, tipos y props existentes.

### Regla 2: Prioridad Absoluta: MÓDULO AGENDA & CITAS
El módulo de agenda es el núcleo operativo de los salones.
Cualquier cambio que toque la tabla `Citas` o los componentes de agendamiento debe cumplir:
1. **Los 4 Puntos de Entrada de Citas son Intocables:**
   - `src/pages/Calendar.tsx` (Agenda interna / recepción)
   - `src/pages/PublicBooking/BookingPortal.tsx` (Portal público de clientes)
   - `src/pages/CartaPublica.tsx` (Carrito y reserva desde carta digital)
   - `src/pages/KoratPosExpress.tsx` (Cobro express y reserva rápida en caja)
2. **Cálculo de Disponibilidad y Fechas:**
   - **NUNCA** comparar fechas sin considerar la zona horaria (`America/Lima`, UTC-5).
   - En cálculos de disponibilidad, si `hora_fin` es nulo o ausente en una cita, **siempre** usar fallback: `fecha + duracion_min` (default 30-60 min). Nunca dejar `new Date(null)` ni `new Date(undefined)` porque genera `NaN` y bloquea todo el día.
   - En filtros por staff/especialidad, **siempre** normalizar tildes y caracteres diacríticos (`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()`).

### Regla 3: Protección de Supabase y Lógica de Negocio (Blast Radius)
Antes de modificar cualquier función RPC, trigger o migración en Postgres:
1. **Verificar quién lo consume:** Hacer búsqueda en el código (`grep`) de todos los archivos que llamen al RPC o consulten la columna.
2. **Compatibilidad hacia atrás (Backward Compatibility):** Si agregas parámetros a un RPC, asígnales `DEFAULT NULL` para no quebrar llamadas de otros componentes o webhooks de n8n.
3. **Prohibido alterar fechas históricas con `CURRENT_TIMESTAMP`:**
   - Cuando una cita pasada se actualice a `Completada`, su `hora_fin` debe calcularse en base a `v_cita.fecha + (duracion_min || 60)` y **NUNCA** con `CURRENT_TIMESTAMP`. Usar la fecha actual en citas pasadas bloquea los días futuros en los algoritmos de disponibilidad.

### Regla 4: Verificación Obligatoria Post-Cambio
Antes de dar por terminada cualquier tarea:
1. Ejecutar verificación de build (`npm run build` o `npx tsc --noEmit`) para confirmar 0 errores de tipos y compilación.
2. Si se tocó el módulo de citas o disponibilidad, ejecutar el script de verificación rápida:
   ```bash
   node scripts/verify_agenda_health.cjs
   ```
   para asegurar que las citas y los slots de disponibilidad sigan respondiendo correctamente.
