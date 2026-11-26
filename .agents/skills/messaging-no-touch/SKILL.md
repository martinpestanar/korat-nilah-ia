---
name: messaging-no-touch
description: Regla estricta de protección (Zona Prohibida) para impedir que cualquier agente o cambio de UI/UX modifique, dispare o altere la lógica de mensajería automática de WhatsApp (calificación post-cita, sellos, cumpleaños, recordatorios y webhooks n8n/Evolution) en producción.
---

# Escudo de Mensajería y Automatizaciones (Modo UI-Only)

Este proyecto (`Korat_MVP` / Nilah IA) cuenta con **clientes reales en producción**. El objetivo de este skill es garantizar que ninguna mejora visual, de diseño o de UX pueda tocar ni disparar mensajes reales a clientas de los salones.

## 1. Qué está TERMINANTEMENTE PROHIBIDO tocar (sin autorización explícita)

1. **Flujos de mensajería automática:**
   - Calificación y reseñas post-cita.
   - Mensajes de sellos y fidelización (`Club Glow` / `Loyalty`).
   - Mensajes de cumpleaños, rescate y recordatorios automáticos.
   - Envíos masivos (`Broadcasts`) y envío saliente en `Inbox`.
2. **Archivos y capas protegidas:**
   - `supabase/functions/**` (todas las Edge Functions).
   - `supabase/migrations/**` y cualquier función RPC, trigger o `pg_cron` en PostgreSQL.
   - `src/services/autopilot.ts`, `src/services/resenasService.ts`, `src/services/api.js` (llamadas a `fetchN8n`/webhooks), `src/services/supabase.ts`.
   - Cualquier llamada `fetch` hacia URLs de **n8n** (`/webhook/...`) o **Evolution API** (`evo.koratflow.agency`, `sendText`, `/inbox-enviar`).
   - Mutaciones o lecturas de disparo hacia las tablas: `cola_mensajes_salientes`, `citas_seguimiento_cuidados`, `sellos_movimientos`, `sellos_premios_ganados`, `resenas_config`, `plantillas_automatizacion`, `configuracion_recordatorios`, `instancias_evolution`, `mensajes`, `mensaje_log`.
3. **Pruebas en base de datos de producción (`cfggpqpbqqeavdbdzwoz`):**
   - Prohibido ejecutar scripts (`node`, `curl`) o SQL de escritura (`INSERT`, `UPDATE`, `DELETE`) que cambien estados de citas (especialmente a `Completada`), registren sellos o inserten en colas de mensajes.

## 2. Qué SÍ está permitido en tareas de UI/UX

Al mejorar interfaces y submódulos, el trabajo debe limitarse estrictamente a la **capa visual**:
- Tokens CSS y estilos globales en `src/index.css` y `index.html`.
- Navegación, layout y responsive en `Layout.tsx`, `Sidebar.tsx`, `Header.tsx`, `BottomNavBar.tsx`.
- Componentes visuales puros (`Button`, `Card`, `SegmentedTabs`, `SkeletonLoaders`, `BottomSheet`, `ConfirmSheet`, `ToastProvider`, `EmptyState`).
- Clases Tailwind, espaciados, tipografía, iconos y estructura JSX dentro de páginas (`Calendar.tsx`, `Automatizaciones.tsx`, `Marketing.tsx`, `ClubGlow.tsx`, `CRM.tsx`, `Settings.tsx`, etc.) **preservando intactos** los `useEffect`, `onSubmit`, handlers de red y payloads enviados a Supabase o n8n.

## 3. Verificación obligatoria antes de terminar cualquier cambio UI/UX

Ejecutar siempre en terminal:
```powershell
git diff --name-only
```
Confirmar que:
- Ningún archivo de `src/services/`, `supabase/` ni `scripts/` fue modificado.
- Ningún `fetch` a n8n/Evolution ni ninguna mutación a `cola_mensajes_salientes` o RPCs de citas/sellos fue alterado (`git diff` sobre los archivos tocados).
- `npx tsc --noEmit` / `npm run build` compilan sin nuevos errores.
