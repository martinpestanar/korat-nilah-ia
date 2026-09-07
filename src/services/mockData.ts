import { Client, Appointment, MarketingCampaign, FinancialDataPoint, StaffMember } from '../types';
import { SIMULATION_DATE } from '../constants';

// HELPER: Generar fechas relativas a la fecha de simulación actual
const getDate = (daysDiff: number): string => {
  const date = new Date(SIMULATION_DATE);
  date.setDate(date.getDate() + daysDiff);
  return date.toISOString().split('T')[0];
};

const getDateTime = (daysDiff: number, hour: number, minute: number = 0): string => {
  const date = new Date(SIMULATION_DATE);
  date.setDate(date.getDate() + daysDiff);
  date.setHours(hour, minute, 0, 0);
  
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
};

// --- FINANCIAL FLOW DATA (STORYTELLING BRILLA STUDIO) ---
// Ingresos en Soles (PEN)
export const MOCK_FINANCIAL_HISTORY: FinancialDataPoint[] = [
    { day: 'Lun', revenue: 650, projection: 800, event: null },
    { day: 'Mar', revenue: 580, projection: 850, event: null }, // Bajón
    { day: 'Mie', revenue: 1600, projection: 1200, event: { name: 'Promo Flash WhatsApp: Botox Capilar', impact: 40 } }, // BOOM por la campaña
    { day: 'Jue', revenue: 1450, projection: 1500, event: null }, // Hoy
    { day: 'Vie', revenue: null, projection: 2500, event: { name: 'Recordatorio Previo Fin de Semana', impact: 25 } }, // Futuro (Solo proyección)
    { day: 'Sab', revenue: null, projection: 3200, event: null },
    { day: 'Dom', revenue: null, projection: 1800, event: null },
];

// --- MARKETING CAMPAIGNS (NILAH'S SUGGESTIONS) ---
export const MOCK_CAMPAIGNS: MarketingCampaign[] = [
    {
        id: 'c1',
        title: 'Retoque de Balayage Ausente',
        description: 'Reactivamos a las clientas que se hicieron Balayage hace más de 3 meses para su retoque de color.',
        aiRationale: 'Identifiqué a 12 clientas VIP de Miraflores que ya necesitan retoque urgentemente.',
        channel: 'WhatsApp',
        predictedRevenue: 3500,
        cost: 0,
        status: 'Draft',
        targetSegment: 'Clientas VIP - Tinte'
    },
    {
        id: 'c2',
        title: 'Llenado de Agenda Viernes',
        description: '20% Dscto. en Manicura Acrílica este Viernes de 10am a 2pm.',
        aiRationale: 'Camila (Manicurista) tiene 3 horas libres mañana. Esta promo asegura llenar esos vacíos.',
        channel: 'Instagram',
        predictedRevenue: 450,
        cost: 30, // Ads boost
        status: 'Draft',
        targetSegment: 'Base General'
    },
    {
        id: 'c3',
        title: 'Pack Glow Up Fin de Mes',
        description: 'Corte + Cepillado + Tratamiento de Ozono con S/ 50 off.',
        aiRationale: 'Aumenta el ticket promedio cruzando servicios de cabello.',
        channel: 'Email',
        predictedRevenue: 2800,
        cost: 0,
        status: 'Draft',
        targetSegment: 'Clientas Recurrentes'
    }
];

export const MOCK_STAFF: StaffMember[] = [
  { id: 1, nombre: 'Sofía Torres', rol: 'Staff', especialidad: 'cabello', color: '#3b82f6', activo: true },
  { id: 2, nombre: 'Camila Montes', rol: 'Staff', especialidad: 'rostro', color: '#10b981', activo: true },
  { id: 3, nombre: 'Valeria Rojas', rol: 'Staff', especialidad: 'manos', color: '#ec4899', activo: true },
  { id: 4, nombre: 'Ana Paredes', rol: 'Staff', especialidad: 'pestañas', color: '#8b5cf6', activo: true },
];

// --- 20 CLIENTES FICTICIOS (MIRAFLORES, LIMA) ---
// Precios en Soles. Teléfonos +51.

export const MOCK_CLIENTS: any[] = [
  // --- CLIENTES CONFIABLES (VERDE: Score 85-100) ---
  { id: 901, nombre: "Valeria Brescia", telefono: "+51991000001", fecha_registro: "2023-01-15", primera_visita: "2023-01-20", ultima_visita: getDate(-12), categoria: "VIP", puntos_acumulados: 1250, total_visitas: 18, Estado: "Activo", LTV: 4500, estado_lifecycle: 'Activo', fiabilidad_score: 98 },
  { id: 902, nombre: "Luciana Fernandini", telefono: "+51992000002", fecha_registro: "2023-03-10", primera_visita: "2023-03-12", ultima_visita: getDate(-5), categoria: "VIP", puntos_acumulados: 850, total_visitas: 14, Estado: "Activo", LTV: 3200, estado_lifecycle: 'Activo', fiabilidad_score: 95 },
  { id: 903, nombre: "Camila Wiese", telefono: "+51993000003", fecha_registro: "2023-06-20", primera_visita: "2023-06-25", ultima_visita: getDate(-25), categoria: "VIP", puntos_acumulados: 900, total_visitas: 10, Estado: "Activo", LTV: 2800, estado_lifecycle: 'Activo', fiabilidad_score: 92 },
  { id: 904, nombre: "Sofía Benavides", telefono: "+51994000004", fecha_registro: "2024-02-15", primera_visita: "2024-02-18", ultima_visita: getDate(-18), categoria: "Regular", puntos_acumulados: 250, total_visitas: 5, Estado: "Activo", LTV: 950, estado_lifecycle: 'Activo', fiabilidad_score: 88 },
  { id: 905, nombre: "Andrea Llosa", telefono: "+51995000005", fecha_registro: "2024-05-10", primera_visita: "2024-05-10", ultima_visita: getDate(-22), categoria: "Regular", puntos_acumulados: 180, total_visitas: 6, Estado: "Activo", LTV: 800, estado_lifecycle: 'Activo', fiabilidad_score: 85 },
  { id: 906, nombre: "Macarena Paz", telefono: "+51996000006", fecha_registro: "2024-07-05", primera_visita: "2024-07-08", ultima_visita: getDate(-8), categoria: "Regular", puntos_acumulados: 120, total_visitas: 3, Estado: "Activo", LTV: 450, estado_lifecycle: 'Activo', fiabilidad_score: 90 },
  { id: 907, nombre: "Renata Ortiz", telefono: "+51997000007", fecha_registro: "2024-08-12", primera_visita: "2024-08-15", ultima_visita: getDate(-2), categoria: "Regular", puntos_acumulados: 90, total_visitas: 2, Estado: "Activo", LTV: 300, estado_lifecycle: 'Activo', fiabilidad_score: 94 },
  { id: 916, nombre: "Alessandra Denegri", telefono: "+51991234567", fecha_registro: "2024-01-20", primera_visita: "2024-01-22", ultima_visita: getDate(-10), categoria: "VIP", puntos_acumulados: 1100, total_visitas: 12, Estado: "Activo", LTV: 3400, estado_lifecycle: 'Activo', fiabilidad_score: 96 },
  { id: 917, nombre: "Mariana Costa", telefono: "+51992345678", fecha_registro: "2024-03-15", primera_visita: "2024-03-18", ultima_visita: getDate(-14), categoria: "Regular", puntos_acumulados: 320, total_visitas: 7, Estado: "Activo", LTV: 1100, estado_lifecycle: 'Activo', fiabilidad_score: 89 },
  { id: 918, nombre: "Fiorella Rodriguez", telefono: "+51993456789", fecha_registro: "2024-04-10", primera_visita: "2024-04-12", ultima_visita: getDate(-7), categoria: "Regular", puntos_acumulados: 210, total_visitas: 4, Estado: "Activo", LTV: 680, estado_lifecycle: 'Activo', fiabilidad_score: 87 },
  
  // --- CLIENTES CON PRECAUCIÓN (AMARILLO: Score 50-79 - Reagendamientos / Tardanzas) ---
  { id: 908, nombre: "Micaela Pardo", telefono: "+51998000008", fecha_registro: "2023-11-20", primera_visita: "2023-11-25", ultima_visita: getDate(-50), categoria: "Regular", puntos_acumulados: 400, total_visitas: 8, Estado: "Activo", LTV: 1400, estado_lifecycle: 'En Riesgo', fiabilidad_score: 68 },
  { id: 909, nombre: "Jimena Castro", telefono: "+51999000009", fecha_registro: "2024-01-10", primera_visita: "2024-01-12", ultima_visita: getDate(-55), categoria: "Regular", puntos_acumulados: 150, total_visitas: 4, Estado: "Activo", LTV: 520, estado_lifecycle: 'En Riesgo', fiabilidad_score: 62 },
  { id: 910, nombre: "Rafaela Miró Quesada", telefono: "+51990000010", fecha_registro: "2024-03-01", primera_visita: "2024-03-05", ultima_visita: getDate(-48), categoria: "VIP", puntos_acumulados: 600, total_visitas: 6, Estado: "Activo", LTV: 2100, estado_lifecycle: 'En Riesgo', fiabilidad_score: 74 },
  { id: 919, nombre: "Claudia De la Puente", telefono: "+51994567890", fecha_registro: "2023-09-12", primera_visita: "2023-09-15", ultima_visita: getDate(-35), categoria: "Regular", puntos_acumulados: 280, total_visitas: 5, Estado: "Activo", LTV: 890, estado_lifecycle: 'En Riesgo', fiabilidad_score: 58 },
  { id: 920, nombre: "Natalia Berckemeyer", telefono: "+51995678901", fecha_registro: "2024-02-01", primera_visita: "2024-02-05", ultima_visita: getDate(-40), categoria: "Regular", puntos_acumulados: 190, total_visitas: 4, Estado: "Activo", LTV: 620, estado_lifecycle: 'En Riesgo', fiabilidad_score: 72 },
  { id: 921, nombre: "Ariana Romero", telefono: "+51996789012", fecha_registro: "2024-06-18", primera_visita: "2024-06-20", ultima_visita: getDate(-28), categoria: "Regular", puntos_acumulados: 130, total_visitas: 3, Estado: "Activo", LTV: 410, estado_lifecycle: 'Activo', fiabilidad_score: 55 },
  
  // --- CLIENTES DE ALTO RIESGO / NO-SHOW (ROJO: Score < 50 - Requiere Anticipo/Confirmación) ---
  { id: 915, nombre: "Carolina de la Flor", telefono: "+51995550015", fecha_registro: "2024-05-01", primera_visita: "2024-05-05", ultima_visita: getDate(-15), categoria: "Regular", puntos_acumulados: 20, total_visitas: 2, Estado: "Activo", LTV: 180, estado_lifecycle: 'Activo', fiabilidad_score: 35 },
  { id: 911, nombre: "Diana Salazar", telefono: "+51991110011", fecha_registro: "2023-08-15", primera_visita: "2023-08-20", ultima_visita: getDate(-95), categoria: "Regular", puntos_acumulados: 110, total_visitas: 3, Estado: "Activo", LTV: 400, estado_lifecycle: 'Perdido', fiabilidad_score: 25 },
  { id: 912, nombre: "Paola Vargas", telefono: "+51992220012", fecha_registro: "2023-10-05", primera_visita: "2023-10-10", ultima_visita: getDate(-110), categoria: "Regular", puntos_acumulados: 300, total_visitas: 5, Estado: "Activo", LTV: 850, estado_lifecycle: 'Perdido', fiabilidad_score: 40 },
  { id: 922, nombre: "Lucía Montero", telefono: "+51997890123", fecha_registro: "2024-01-05", primera_visita: "2024-01-08", ultima_visita: getDate(-60), categoria: "Regular", puntos_acumulados: 70, total_visitas: 2, Estado: "Activo", LTV: 240, estado_lifecycle: 'Perdido', fiabilidad_score: 30 },
  { id: 923, nombre: "Gabriela Prado", telefono: "+51998901234", fecha_registro: "2024-04-22", primera_visita: "2024-04-25", ultima_visita: getDate(-70), categoria: "Regular", puntos_acumulados: 50, total_visitas: 1, Estado: "Activo", LTV: 160, estado_lifecycle: 'Perdido', fiabilidad_score: 20 },

  // --- CLIENTAS NUEVAS (Score inicial 100) ---
  { id: 913, nombre: "Antonella Ríos", telefono: "+51993330013", fecha_registro: getDate(-5), primera_visita: getDate(-2), ultima_visita: getDate(-2), categoria: "Nuevo", puntos_acumulados: 40, total_visitas: 1, Estado: "Activo", LTV: 150, estado_lifecycle: 'Nuevo', fiabilidad_score: 100 },
  { id: 914, nombre: "Fátima Sánchez", telefono: "+51994440014", fecha_registro: getDate(-1), primera_visita: "-", ultima_visita: "-", categoria: "Nuevo", puntos_acumulados: 0, total_visitas: 0, Estado: "Activo", LTV: 0, estado_lifecycle: 'Nuevo', fiabilidad_score: 100 },
  { id: 924, nombre: "Camila Arana", telefono: "+51999012345", fecha_registro: getDate(-3), primera_visita: "-", ultima_visita: "-", categoria: "Nuevo", puntos_acumulados: 0, total_visitas: 0, Estado: "Activo", LTV: 0, estado_lifecycle: 'Nuevo', fiabilidad_score: 100 },
];

export const MOCK_APPOINTMENTS: any[] = [
  // --- HISTORIAL CAROLINA DE LA FLOR (NO SHOWS) ---
  { id: 701, fecha: getDateTime(-30, 10, 0), cliente_id: 915, nombre_cliente: "Carolina de la Flor", servicio: "Botox Capilar", precio: 180.00, estado: "No-Show", calificacion: 0, feedback_cliente: "", staff_id: 2, categoria: 'rostro' },
  { id: 702, fecha: getDateTime(-20, 16, 0), cliente_id: 915, nombre_cliente: "Carolina de la Flor", servicio: "Manicura Acrílica", precio: 120.00, estado: "No-Show", calificacion: 0, feedback_cliente: "", staff_id: 3, categoria: 'manos' },
  { id: 703, fecha: getDateTime(-15, 11, 0), cliente_id: 915, nombre_cliente: "Carolina de la Flor", servicio: "Corte de Puntas", precio: 60.00, estado: "Completada", calificacion: 3, feedback_cliente: "Llegó tarde.", staff_id: 1, categoria: 'cabello' },

  // --- HISTORIAL RECIENTE (AYER - Completadas) ---
  { id: 101, fecha: getDateTime(-1, 10, 0), cliente_id: 901, nombre_cliente: "Valeria Brescia", servicio: "Secado y Ondas", precio: 80.00, estado: "Completada", calificacion: 5, feedback_cliente: "Sofía siempre me deja el cabello hermoso.", staff_id: 1, categoria: 'cabello' },
  { id: 102, fecha: getDateTime(-1, 11, 30), cliente_id: 905, nombre_cliente: "Andrea Llosa", servicio: "Manicura Gel", precio: 70.00, estado: "Completada", calificacion: 4, feedback_cliente: "", staff_id: 3, categoria: 'manos' },
  { id: 103, fecha: getDateTime(-1, 15, 0), cliente_id: 906, nombre_cliente: "Macarena Paz", servicio: "Pedicura Spa", precio: 90.00, estado: "Completada", calificacion: 5, feedback_cliente: "Súper relajante el masaje de pies.", staff_id: 3, categoria: 'manos' },
  { id: 104, fecha: getDateTime(-1, 16, 0), cliente_id: 907, nombre_cliente: "Renata Ortiz", servicio: "Balayage", precio: 350.00, estado: "Completada", calificacion: 5, feedback_cliente: "El rubio quedó exacto como quería.", staff_id: 1, categoria: 'cabello' },

  // --- HOY (OPERATIVA ACTUAL - 10 citas para que se vea lleno) ---
  { id: 201, fecha: getDateTime(0, 9, 30), cliente_id: 902, nombre_cliente: "Luciana Fernandini", servicio: "Tratamiento Ozono", precio: 150.00, estado: "Completada", calificacion: 5, feedback_cliente: "Me encantó el resultado.", isAiGenerated: true, staff_id: 2, categoria: 'rostro' },
  { id: 202, fecha: getDateTime(0, 10, 0), cliente_id: 913, nombre_cliente: "Antonella Ríos", servicio: "Manicura Rusa", precio: 140.00, estado: "Completada", calificacion: 5, feedback_cliente: "Valeria es muy detallista.", staff_id: 3, categoria: 'manos' },
  { id: 203, fecha: getDateTime(0, 11, 0), cliente_id: 904, nombre_cliente: "Sofía Benavides", servicio: "Uñas Acrílicas", precio: 130.00, estado: "Completada", calificacion: 4, feedback_cliente: "", staff_id: 3, categoria: 'manos' },
  { id: 204, fecha: getDateTime(0, 12, 0), cliente_id: 914, nombre_cliente: "Fátima Sánchez", servicio: "Corte y Cepillado", precio: 100.00, estado: "Completada", calificacion: 5, feedback_cliente: "", staff_id: 1, categoria: 'cabello' },
  { id: 205, fecha: getDateTime(0, 13, 30), cliente_id: 901, nombre_cliente: "Valeria Brescia", servicio: "Lifting Pestañas", precio: 120.00, estado: "Confirmada", calificacion: 0, feedback_cliente: "", staff_id: 4, categoria: 'pestañas' },
  { id: 206, fecha: getDateTime(0, 14, 0), cliente_id: 909, nombre_cliente: "Jimena Castro", servicio: "Retoque Color", precio: 180.00, estado: "Confirmada", calificacion: 0, feedback_cliente: "", isAiGenerated: true, staff_id: 1, categoria: 'cabello' },
  { id: 207, fecha: getDateTime(0, 15, 0), cliente_id: 907, nombre_cliente: "Renata Ortiz", servicio: "Pedicura Jelly Spa", precio: 110.00, estado: "Pendiente", calificacion: 0, feedback_cliente: "", staff_id: 3, categoria: 'manos' },
  { id: 208, fecha: getDateTime(0, 16, 0), cliente_id: 906, nombre_cliente: "Macarena Paz", servicio: "Limpieza Facial Profunda", precio: 220.00, estado: "Reagendada", calificacion: 0, feedback_cliente: "", staff_id: 2, categoria: 'rostro' },
  { id: 209, fecha: getDateTime(0, 17, 0), cliente_id: 903, nombre_cliente: "Camila Wiese", servicio: "Masaje Relajante", precio: 160.00, estado: "Pendiente", calificacion: 0, feedback_cliente: "", staff_id: 2, categoria: 'rostro' },
  { id: 210, fecha: getDateTime(0, 18, 0), cliente_id: 905, nombre_cliente: "Andrea Llosa", servicio: "Mechas Babylights", precio: 450.00, estado: "Reagendada", calificacion: 0, feedback_cliente: "", staff_id: 1, categoria: 'cabello' },

  // --- MAÑANA (VIERNES ALTO TRÁFICO) ---
  { id: 301, fecha: getDateTime(1, 10, 0), cliente_id: 914, nombre_cliente: "Fátima Sánchez", servicio: "Consulta Decoloración", precio: 0.00, estado: "Confirmada", calificacion: 0, feedback_cliente: "", isAiGenerated: true, staff_id: 1, categoria: 'cabello' },
  { id: 302, fecha: getDateTime(1, 11, 0), cliente_id: 908, nombre_cliente: "Micaela Pardo", servicio: "Balayage", precio: 380.00, estado: "Pendiente", calificacion: 0, feedback_cliente: "", staff_id: 1, categoria: 'cabello' },
  { id: 303, fecha: getDateTime(1, 15, 0), cliente_id: 910, nombre_cliente: "Rafaela Miró Q.", servicio: "Lifting Pestañas", precio: 120.00, estado: "Confirmada", calificacion: 0, feedback_cliente: "", staff_id: 4, categoria: 'pestañas' },
  { id: 304, fecha: getDateTime(1, 16, 0), cliente_id: 901, nombre_cliente: "Valeria Brescia", servicio: "Pedicura Jelly Spa", precio: 110.00, estado: "Pendiente", calificacion: 0, feedback_cliente: "", staff_id: 3, categoria: 'manos' },
  { id: 305, fecha: getDateTime(1, 17, 30), cliente_id: 905, nombre_cliente: "Andrea Llosa", servicio: "Retoque Gel", precio: 60.00, estado: "Pendiente", calificacion: 0, feedback_cliente: "", staff_id: 3, categoria: 'manos' },
  { id: 306, fecha: getDateTime(1, 18, 0), cliente_id: 915, nombre_cliente: "Carolina de...", servicio: "Depilación Cejas", precio: 35.00, estado: "Confirmada", calificacion: 0, feedback_cliente: "", staff_id: 4, categoria: 'pestañas' },

  // --- SÁBADO (LLENO TOTAL) ---
  { id: 501, fecha: getDateTime(2, 9, 0), cliente_id: 902, nombre_cliente: "Luciana Fernandini", servicio: "Mechas Babylights", precio: 450.00, estado: "Pendiente", calificacion: 0, feedback_cliente: "", staff_id: 1, categoria: 'cabello' },
  { id: 502, fecha: getDateTime(2, 10, 30), cliente_id: 906, nombre_cliente: "Macarena Paz", servicio: "Extensión Pestañas", precio: 180.00, estado: "Pendiente", calificacion: 0, feedback_cliente: "", staff_id: 4, categoria: 'pestañas' },
  { id: 503, fecha: getDateTime(2, 12, 0), cliente_id: 907, nombre_cliente: "Renata Ortiz", servicio: "Manicura Rusa", precio: 140.00, estado: "Pendiente", calificacion: 0, feedback_cliente: "", staff_id: 3, categoria: 'manos' },
  { id: 504, fecha: getDateTime(2, 13, 0), cliente_id: 903, nombre_cliente: "Camila Wiese", servicio: "Laceado Orgánico", precio: 300.00, estado: "Pendiente", calificacion: 0, feedback_cliente: "", staff_id: 2, categoria: 'rostro' },
  { id: 505, fecha: getDateTime(2, 15, 0), cliente_id: 904, nombre_cliente: "Sofía Benavides", servicio: "Masaje Descontracturante", precio: 180.00, estado: "Pendiente", calificacion: 0, feedback_cliente: "", staff_id: 2, categoria: 'rostro' },
].map(apt => {
  const parts = apt.fecha.split(' ');
  if (parts.length === 2) {
    return { ...apt, fecha: parts[0], hora: parts[1] };
  }
  return apt;
});


