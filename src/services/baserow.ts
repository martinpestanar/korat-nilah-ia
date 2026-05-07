import { Client, Appointment } from '../types';

/**
 * CONFIGURACIÓN BASEROW
 * ---------------------
 * Para conectar tu base de datos:
 * 1. Crea una cuenta en Baserow.io y crea una base de datos.
 * 2. Ve a Settings -> Database Tokens y crea un token nuevo.
 * 3. Reemplaza BASEROW_API_TOKEN con tu token.
 * 4. Reemplaza los TABLE IDs con los IDs de tus tablas (se ven en la URL o docs de API).
 */

const BASEROW_API_TOKEN = 'TU_TOKEN_AQUI'; 
const BASEROW_URL = 'https://api.baserow.io/api';

// IDs de tus Tablas (Obtenlos de la documentación de API de tu proyecto en Baserow)
const CLIENTS_TABLE_ID = 'TU_ID_TABLA_CLIENTES'; 
const APPOINTMENTS_TABLE_ID = 'TU_ID_TABLA_CITAS';

/**
 * Helper para hacer fetch con los headers de autorización
 */
const fetchBaserow = async (endpoint: string) => {
  try {
    const response = await fetch(`${BASEROW_URL}${endpoint}`, {
      headers: {
        'Authorization': `Token ${BASEROW_API_TOKEN}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Baserow API Error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching Baserow data:", error);
    return null;
  }
};

export const BaserowService = {
  /**
   * Obtener todos los clientes
   */
  getClients: async (): Promise<Client[]> => {
    // Usamos ?user_field_names=true para que la respuesta use los nombres de columnas reales 
    // en lugar de field_123, etc.
    const data = await fetchBaserow(`/database/rows/table/${CLIENTS_TABLE_ID}/?user_field_names=true&size=200`);
    
    if (!data || !data.results) return [];

    // Mapeo opcional si los nombres en Baserow difieren ligeramente de los de Typescript
    // Si usas exactamente los mismos nombres que definimos en `types.ts`, no necesitas mapear mucho.
    return data.results.map((row: any) => ({
      id: row.id,
      nombre: row.nombre || "Sin Nombre",
      telefono: row.telefono || "",
      fecha_registro: row.fecha_registro,
      primera_visita: row.primera_visita,
      ultima_visita: row.ultima_visita,
      categoria: row.categoria?.value || row.categoria, // Baserow select fields return object or value
      puntos_acumulados: parseInt(row.puntos_acumulados) || 0,
      total_visitas: parseInt(row.total_visitas) || 0,
      Estado: row.Estado?.value || row.Estado || 'Inactivo'
    }));
  },

  /**
   * Obtener todas las citas
   */
  getAppointments: async (): Promise<Appointment[]> => {
    const data = await fetchBaserow(`/database/rows/table/${APPOINTMENTS_TABLE_ID}/?user_field_names=true&size=200`);

    if (!data || !data.results) return [];

    return data.results.map((row: any) => ({
      id: row.id,
      fecha: row.fecha, // Asegurate que en Baserow sea texto o fecha compatible
      cliente_id: row.cliente_id?.[0]?.id || 0, // Si usas Link Row, Baserow devuelve array
      nombre_cliente: row.nombre_cliente, // Si usas lookup o texto directo
      servicio: row.servicio,
      precio: parseFloat(row.precio) || 0,
      estado: row.estado?.value || row.estado || 'Pendiente',
      calificacion: parseInt(row.calificacion) || 0,
      feedback_cliente: row.feedback_cliente || ''
    }));
  },

  /**
   * Crear nueva cita
   */
  createAppointment: async (appointment: Partial<Appointment>) => {
    // Implementación POST para crear registro
    try {
        const response = await fetch(`${BASEROW_URL}/database/rows/table/${APPOINTMENTS_TABLE_ID}/?user_field_names=true`, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${BASEROW_API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                // Asegúrate de enviar solo los campos que Baserow espera
                fecha: appointment.fecha,
                servicio: appointment.servicio,
                precio: appointment.precio,
                estado: 'Pendiente',
                // Para relaciones (Link Row) en Baserow, usualmente envías el ID en un array
                cliente_id: [appointment.cliente_id] 
            })
        });
        return await response.json();
    } catch(e) {
        console.error(e);
        return null;
    }
  }
};