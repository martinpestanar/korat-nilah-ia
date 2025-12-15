
import { Client, Appointment, MarketingCampaign, FinancialDataPoint } from '../types';
import { SIMULATION_DATE } from '../constants';

// HELPER: Generar fechas relativas a la fecha de simulación (Jueves 4 Dic 2025)
const getDate = (daysDiff: number): string => {
  const date = new Date(SIMULATION_DATE);
  date.setDate(date.getDate() + daysDiff);
  return date.toISOString().split('T')[0];
};

const getDateTime = (daysDiff: number, hour: number): string => {
  const date = new Date(SIMULATION_DATE);
  date.setDate(date.getDate() + daysDiff);
  date.setHours(hour, 0, 0, 0);
  
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
};

// --- FINANCIAL FLOW DATA (STORYTELLING) ---
export const MOCK_FINANCIAL_HISTORY: FinancialDataPoint[] = [
    { day: 'Lun 01', revenue: 800, projection: 950, event: null },
    { day: 'Mar 02', revenue: 750, projection: 900, event: null }, // Bajón
    { day: 'Mie 03', revenue: 1500, projection: 1100, event: { name: 'Promo Flash WhatsApp: 2x1', impact: 35 } }, // BOOM por la campaña
    { day: 'Jue 04', revenue: 1200, projection: 1250, event: null }, // Hoy (Aquí caerá la nueva campaña)
    { day: 'Vie 05', revenue: null, projection: 1800, event: { name: 'Recordatorio Fin de Semana', impact: 20 } }, // Futuro (Solo proyección)
    { day: 'Sab 06', revenue: null, projection: 2200, event: null },
    { day: 'Dom 07', revenue: null, projection: 1900, event: null },
];

// --- MARKETING CAMPAIGNS (NILAH'S SUGGESTIONS) ---
export const MOCK_CAMPAIGNS: MarketingCampaign[] = [
    {
        id: 'c1',
        title: 'Glow Navideño Anticipado',
        description: 'Oferta exclusiva de tratamientos faciales para preparar la piel antes de las fiestas.',
        aiRationale: 'Tus citas de faciales han bajado un 15% esta semana. Esta campaña reactivará esa categoría.',
        channel: 'WhatsApp',
        predictedRevenue: 1200,
        cost: 0,
        status: 'Draft',
        targetSegment: 'Clientes VIP'
    },
    {
        id: 'c2',
        title: 'Rescate de Viernes',
        description: '20% OFF en manicura si vienes mañana (Viernes 05) entre 10am y 2pm.',
        aiRationale: 'Detecto 4 huecos libres mañana viernes. Llenarlos aumentará la eficiencia del staff.',
        channel: 'Instagram',
        predictedRevenue: 450,
        cost: 20, // Ads boost
        status: 'Draft',
        targetSegment: 'Todos'
    },
    {
        id: 'c3',
        title: 'Pack Relax Fin de Año',
        description: 'Masaje + Pedicura con aromaterapia de regalo.',
        aiRationale: 'El ticket promedio es bajo los jueves. Este pack aumenta el valor por visita.',
        channel: 'Email',
        predictedRevenue: 2500,
        cost: 0,
        status: 'Draft',
        targetSegment: 'Clientes > 30 años'
    }
];

// --- 10 CLIENTES FICTICIOS ---

export const MOCK_CLIENTS: Client[] = [
  // 1. CARLA VEGA: RIESGO TOTAL (No-Show crónico) -> Escudo Rosa
  { id: 901, nombre: "Carla Vega", telefono: "+51991000001", fecha_registro: "2024-01-15", primera_visita: "2024-01-20", ultima_visita: getDate(-10), categoria: "Regular", puntos_acumulados: 10, total_visitas: 3, Estado: "Activo" },
  
  // 2. VALENTINA RUIZ: LA IDEAL (Siempre cumple) -> Escudo Índigo
  { id: 902, nombre: "Valentina Ruiz", telefono: "+51992000002", fecha_registro: "2024-03-10", primera_visita: "2024-03-12", ultima_visita: getDate(-15), categoria: "VIP", puntos_acumulados: 500, total_visitas: 12, Estado: "Activo" },
  
  // 3. SOFIA LOPEZ: LA NUEVA (Sin historial) -> Escudo Gris
  { id: 903, nombre: "Sofia Lopez", telefono: "+51993000003", fecha_registro: getDate(-1), primera_visita: "-", ultima_visita: "-", categoria: "Nuevo", puntos_acumulados: 0, total_visitas: 0, Estado: "Activo" },

  // 4. ANA MORALES: RIESGO FUGA (No viene hace 60 días) -> Semáforo Rojo
  { id: 904, nombre: "Ana Morales", telefono: "+51994000004", fecha_registro: "2024-05-20", primera_visita: "2024-05-22", ultima_visita: getDate(-60), categoria: "Regular", puntos_acumulados: 150, total_visitas: 8, Estado: "Activo" },

  // 5. LUCIA GOMEZ: ALERTA (No viene hace 30 días) -> Semáforo Amarillo
  { id: 905, nombre: "Lucia Gomez", telefono: "+51995000005", fecha_registro: "2024-08-01", primera_visita: "2024-08-05", ultima_visita: getDate(-30), categoria: "Regular", puntos_acumulados: 50, total_visitas: 4, Estado: "Activo" },

  // 6. MARIA FERNANDEZ: REGULAR
  { id: 906, nombre: "Maria Fernandez", telefono: "+51996000006", fecha_registro: "2024-09-10", primera_visita: "2024-09-12", ultima_visita: getDate(-20), categoria: "Regular", puntos_acumulados: 80, total_visitas: 5, Estado: "Activo" },

  // 7. GABRIELA TORRES: REAGENDADORA (Cancela mucho) -> Escudo Gris/Rosa
  { id: 907, nombre: "Gabriela Torres", telefono: "+51997000007", fecha_registro: "2024-10-01", primera_visita: "2024-10-05", ultima_visita: getDate(-5), categoria: "Regular", puntos_acumulados: 30, total_visitas: 2, Estado: "Activo" },

  // 8. PATRICIA DIAZ: VIP
  { id: 908, nombre: "Patricia Diaz", telefono: "+51998000008", fecha_registro: "2024-02-15", primera_visita: "2024-02-20", ultima_visita: getDate(-3), categoria: "VIP", puntos_acumulados: 320, total_visitas: 15, Estado: "Activo" },

  // 9. CLAUDIA SOTO: INACTIVA
  { id: 909, nombre: "Claudia Soto", telefono: "+51999000009", fecha_registro: "2023-11-01", primera_visita: "2023-11-05", ultima_visita: getDate(-100), categoria: "Regular", puntos_acumulados: 10, total_visitas: 2, Estado: "Inactivo" },

  // 10. ROBERTO CAMPOS: EL CASO DE MALA REPUTACIÓN (Nuevo Ejemplo)
  { id: 911, nombre: "Roberto Campos", telefono: "+51990000011", fecha_registro: getDate(-40), primera_visita: getDate(-35), ultima_visita: getDate(-10), categoria: "Regular", puntos_acumulados: 0, total_visitas: 3, Estado: "Activo" },
];

export const MOCK_APPOINTMENTS: Appointment[] = [
  // --- HISTORIAL ROBERTO CAMPOS (MALA REPUTACIÓN) ---
  { id: 701, fecha: getDateTime(-30, 10), cliente_id: 911, nombre_cliente: "Roberto Campos", servicio: "Corte", precio: 40.00, estado: "No-Show", calificacion: 0, feedback_cliente: "" },
  { id: 702, fecha: getDateTime(-20, 16), cliente_id: 911, nombre_cliente: "Roberto Campos", servicio: "Masaje", precio: 90.00, estado: "No-Show", calificacion: 0, feedback_cliente: "" },
  { id: 703, fecha: getDateTime(-10, 11), cliente_id: 911, nombre_cliente: "Roberto Campos", servicio: "Corte", precio: 40.00, estado: "Completada", calificacion: 3, feedback_cliente: "Llegó tarde." },

  // --- HISTORIAL (Pasado - Miércoles 3, Martes 2...) ---
  
  // Gabriela (Cancela y Reagenda)
  { id: 101, fecha: getDateTime(-2, 10), cliente_id: 907, nombre_cliente: "Gabriela Torres", servicio: "Manicura Gel", precio: 50.00, estado: "Cancelada", calificacion: 0, feedback_cliente: "Enfermedad" },
  { id: 102, fecha: getDateTime(-1, 15), cliente_id: 907, nombre_cliente: "Gabriela Torres", servicio: "Manicura Gel", precio: 50.00, estado: "Completada", calificacion: 4, feedback_cliente: "Buena atención, pero demoró un poco." },

  // Carla Vega (No-Shows Históricos)
  { id: 103, fecha: getDateTime(-5, 11), cliente_id: 901, nombre_cliente: "Carla Vega", servicio: "Pedicura Spa", precio: 65.00, estado: "No-Show", calificacion: 0, feedback_cliente: "" },
  { id: 104, fecha: getDateTime(-10, 16), cliente_id: 901, nombre_cliente: "Carla Vega", servicio: "Corte", precio: 40.00, estado: "No-Show", calificacion: 0, feedback_cliente: "" },

  // Valentina (Historial Perfecto)
  { id: 105, fecha: getDateTime(-1, 12), cliente_id: 902, nombre_cliente: "Valentina Ruiz", servicio: "Facial Hidratante", precio: 80.00, estado: "Completada", calificacion: 5, feedback_cliente: "Excelente como siempre, me encantó el aroma." },
  { id: 106, fecha: getDateTime(-3, 16), cliente_id: 902, nombre_cliente: "Valentina Ruiz", servicio: "Masaje Relajante", precio: 90.00, estado: "Completada", calificacion: 5, feedback_cliente: "" },

  // --- HOY (Jueves 4 Dic 2025) ---
  { id: 201, fecha: getDateTime(0, 9), cliente_id: 902, nombre_cliente: "Valentina Ruiz", servicio: "Masaje Relajante", precio: 90.00, estado: "Pendiente", calificacion: 0, feedback_cliente: "", isAiGenerated: true },
  { id: 202, fecha: getDateTime(0, 11), cliente_id: 908, nombre_cliente: "Patricia Diaz", servicio: "Pedicura Spa", precio: 65.00, estado: "Completada", calificacion: 5, feedback_cliente: "La mejor pedicura de la zona." }, 
  { id: 203, fecha: getDateTime(0, 15), cliente_id: 901, nombre_cliente: "Carla Vega", servicio: "Manicura Gel", precio: 50.00, estado: "Pendiente", calificacion: 0, feedback_cliente: "", isAiGenerated: true }, // Recuperada por IA
  { id: 204, fecha: getDateTime(0, 17), cliente_id: 906, nombre_cliente: "Maria Fernandez", servicio: "Corte", precio: 45.00, estado: "Reagendada", calificacion: 0, feedback_cliente: "" },

  // --- MAÑANA (Viernes 5 Dic 2025) - DÍA DE ALTO TRAFICO TARDE ---
  { id: 301, fecha: getDateTime(1, 10), cliente_id: 903, nombre_cliente: "Sofia Lopez", servicio: "Consulta", precio: 0.00, estado: "Pendiente", calificacion: 0, feedback_cliente: "", isAiGenerated: true }, // Agendada por Bot
  { id: 302, fecha: getDateTime(1, 14), cliente_id: 905, nombre_cliente: "Lucia Gomez", servicio: "Manicura Gel", precio: 50.00, estado: "Pendiente", calificacion: 0, feedback_cliente: "" },
  { id: 303, fecha: getDateTime(1, 16), cliente_id: 908, nombre_cliente: "Patricia Diaz", servicio: "Facial Hidratante", precio: 80.00, estado: "Pendiente", calificacion: 0, feedback_cliente: "" },
  { id: 304, fecha: getDateTime(1, 17), cliente_id: 902, nombre_cliente: "Valentina Ruiz", servicio: "Corte y Peinado", precio: 70.00, estado: "Pendiente", calificacion: 0, feedback_cliente: "" },
  { id: 305, fecha: getDateTime(1, 18), cliente_id: 910, nombre_cliente: "Estefania Reyes", servicio: "Manicura Gel", precio: 50.00, estado: "Pendiente", calificacion: 0, feedback_cliente: "" },
  // Cita futura para Roberto (Riesgo)
  { id: 306, fecha: getDateTime(1, 19), cliente_id: 911, nombre_cliente: "Roberto Campos", servicio: "Corte", precio: 40.00, estado: "Pendiente", calificacion: 0, feedback_cliente: "" },

  // --- RELLENO PARA HEATMAP (DISTRIBUCIÓN DE COLORES) ---
  
  // 1. LUNES (Dec 1): Tráfico Medio (Amarillo/Verde disperso)
  { id: 401, fecha: getDateTime(-3, 10), cliente_id: 906, nombre_cliente: "Maria F.", servicio: "Manicura", precio: 50.00, estado: "Completada", calificacion: 4, feedback_cliente: "Todo ok" },
  { id: 402, fecha: getDateTime(-3, 11), cliente_id: 908, nombre_cliente: "Patricia D.", servicio: "Corte", precio: 45.00, estado: "Completada", calificacion: 5, feedback_cliente: "" },
  { id: 403, fecha: getDateTime(-3, 17), cliente_id: 902, nombre_cliente: "Valentina R.", servicio: "Masaje", precio: 90.00, estado: "Completada", calificacion: 5, feedback_cliente: "" },
  
  // 2. MARTES (Dec 2): ZONA MUERTA MAÑANA (Para probar la IA)
  // Solo citas en la tarde
  { id: 404, fecha: getDateTime(-2, 16), cliente_id: 905, nombre_cliente: "Lucia G.", servicio: "Pedicura", precio: 65.00, estado: "Completada", calificacion: 3, feedback_cliente: "El agua estaba un poco fría." },
  { id: 405, fecha: getDateTime(-2, 17), cliente_id: 903, nombre_cliente: "Sofia L.", servicio: "Manicura", precio: 50.00, estado: "Completada", calificacion: 5, feedback_cliente: "" },

  // 3. SÁBADO (Dec 6): HIGH PROFIT (Todo Verde)
  { id: 501, fecha: getDateTime(2, 9), cliente_id: 902, nombre_cliente: "Valentina R.", servicio: "Pack Spa Completo", precio: 150.00, estado: "Pendiente", calificacion: 0, feedback_cliente: "" },
  { id: 502, fecha: getDateTime(2, 10), cliente_id: 908, nombre_cliente: "Patricia D.", servicio: "Tinte y Corte", precio: 120.00, estado: "Pendiente", calificacion: 0, feedback_cliente: "" },
  { id: 503, fecha: getDateTime(2, 11), cliente_id: 906, nombre_cliente: "Maria F.", servicio: "Alisado", precio: 200.00, estado: "Pendiente", calificacion: 0, feedback_cliente: "" },
  { id: 504, fecha: getDateTime(2, 12), cliente_id: 910, nombre_cliente: "Estefania R.", servicio: "Facial", precio: 80.00, estado: "Pendiente", calificacion: 0, feedback_cliente: "" },
  { id: 505, fecha: getDateTime(2, 15), cliente_id: 905, nombre_cliente: "Lucia G.", servicio: "Masaje", precio: 90.00, estado: "Pendiente", calificacion: 0, feedback_cliente: "" },
  { id: 506, fecha: getDateTime(2, 16), cliente_id: 901, nombre_cliente: "Carla V.", servicio: "Uñas Esculpidas", precio: 110.00, estado: "Pendiente", calificacion: 0, feedback_cliente: "" },

  // 4. MIÉRCOLES (Dec 3): HORA DE ALMUERZO LLENA
  { id: 601, fecha: getDateTime(-1, 13), cliente_id: 907, nombre_cliente: "Gabriela T.", servicio: "Manicura", precio: 50.00, estado: "Completada", calificacion: 5, feedback_cliente: "" },
  { id: 602, fecha: getDateTime(-1, 14), cliente_id: 906, nombre_cliente: "Maria F.", servicio: "Pedicura", precio: 65.00, estado: "Completada", calificacion: 4, feedback_cliente: "" },
];
