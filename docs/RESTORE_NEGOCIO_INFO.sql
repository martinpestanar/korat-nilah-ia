-- Script para restaurar los valores de negocio_info para Brilla Studio
-- VERSION SIN business_id (filtra solo por clave)
-- Ejecutar en Supabase SQL Editor

UPDATE negocio_info SET valor_texto = '📍 UBICACIÓN: Calle Ficticia 123, Palermo Zona: Cerca de estación de subte y líneas de colectivos.' WHERE clave = 'ubicacion_contacto';

UPDATE negocio_info SET valor_texto = '🕐 HORARIOS: Lunes a Viernes: 9am-8pm. Sábados: 10am-6pm. Domingos: CERRADO. Último turno: 1 hora antes del cierre.' WHERE clave = 'horarios';

UPDATE negocio_info SET valor_texto = '📋 REGLAS: Anticipación 24hs. Cancelación GRATIS hasta 12hs antes. No-show: Se cobra 50%. Seña: $3 para servicios > $20.' WHERE clave = 'politicas_reserva';

UPDATE negocio_info SET valor_texto = '💳 PAGOS: Efectivo (10% descuento extra), Tarjetas (Visa/Master), Mercado Pago, Cuenta DNI, Transferencia.' WHERE clave = 'metodos_pago';

UPDATE negocio_info SET valor_texto = '❓ PREGUNTAS: - Domicilios: Solo eventos especiales. - Duración Gel: 2-3 semanas. - Vegano: Sí, tenemos productos cruelty-free. - Estacionamiento: Cocheras públicas a 2 cuadras.' WHERE clave = 'faq';

UPDATE negocio_info SET valor_texto = '+51981482289' WHERE clave = 'whatsapp';

UPDATE negocio_info SET valor_texto = '@brillastudio.pe' WHERE clave = 'Instagram';

UPDATE negocio_info SET valor_texto = '@brillastudio.pe' WHERE clave = 'Facebook';

UPDATE negocio_info SET valor_texto = '@brillastudio.pe' WHERE clave = 'Tiktok';

UPDATE negocio_info SET valor_texto = 'Primera Visita: 15% OFF en cualquier servicio' WHERE clave = 'Promociones General';

UPDATE negocio_info SET valor_texto = '- Lunes de Manos: 15% OFF en manicura - Duo Manos: 25% OFF para 2 amigas (acrílicas, polygel)' WHERE clave = 'Promociones Uñas';

UPDATE negocio_info SET valor_texto = '- Combo Belleza: Manos + Pies 20% OFF - Miércoles Spa: Pedicura + Masaje GRATIS' WHERE clave = 'Promociones Pies';

UPDATE negocio_info SET valor_texto = '(Sin promos activas actualmente)' WHERE clave = 'Promociones Pestañas';

UPDATE negocio_info SET valor_texto = '(Sin promos activas actualmente)' WHERE clave = 'Promociones Cabello';

UPDATE negocio_info SET valor_texto = '(Sin promos activas actualmente)' WHERE clave = 'Promociones Rostro';
