-- ================================================
-- GUÍA: Cómo insertar notificaciones reales
-- Para usar desde n8n (nodo Supabase/Postgres)
-- ================================================

-- TIPOS DISPONIBLES: 'ai' | 'success' | 'warning' | 'info'
-- EMOJIS: coloca el emoji que quieras mostrar en la alerta nativa del móvil

-- Nueva cita agendada por el chatbot
INSERT INTO public.notificaciones (business_id, type, title, message, emoji, action_url)
VALUES (
  '{{negocio_id}}',      -- reemplazar con el business_id del cliente
  'ai',
  'Nueva Cita Agendada',
  'Nilah agendó cita para {{nombre_cliente}} el {{fecha}} a las {{hora}}.',
  '📅',
  '/#/nilah/app/calendar'
);

-- Cliente recuperado
INSERT INTO public.notificaciones (business_id, type, title, message, emoji, action_url)
VALUES (
  '{{negocio_id}}',
  'ai',
  '¡Cliente Recuperado! 🎉',
  '{{nombre_cliente}} aceptó tu mensaje de rescate y agendó una cita.',
  '🎉',
  '/#/nilah/app/clients'
);

-- Feedback negativo recibido
INSERT INTO public.notificaciones (business_id, type, title, message, emoji)
VALUES (
  '{{negocio_id}}',
  'warning',
  'Feedback Negativo',
  '{{nombre_cliente}} dejó {{estrellas}} estrellas: "{{comentario}}"',
  '⚠️'
);

-- Premio canjeado
INSERT INTO public.notificaciones (business_id, type, title, message, emoji)
VALUES (
  '{{negocio_id}}',
  'success',
  'Premio Canjeado',
  '{{nombre_cliente}} canjeó: {{nombre_premio}}.',
  '🎁'
);

-- Stock bajo de producto
INSERT INTO public.notificaciones (business_id, type, title, message, emoji, action_url)
VALUES (
  '{{negocio_id}}',
  'warning',
  'Stock Bajo',
  'Quedan pocas unidades de {{producto}}. Considera reabastecer.',
  '📦',
  '/#/nilah/app/settings'
);

-- Campaña enviada exitosamente
INSERT INTO public.notificaciones (business_id, type, title, message, emoji)
VALUES (
  '{{negocio_id}}',
  'success',
  'Campaña Enviada',
  'Tu campaña "{{nombre_campaña}}" fue enviada a {{cantidad}} clientas.',
  '🚀'
);
