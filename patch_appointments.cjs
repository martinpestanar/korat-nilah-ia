const fs = require('fs');

const path = 'services/api.js';
let content = fs.readFileSync(path, 'utf8');

// Encontrar el bloque a reemplazar
const startMarker = '// ===========================================\r\n// Servicios de Citas/Appointments';
const endMarker = '\r\n};\r\n\r\n\r\n// ===========================================\r\n// Servicios de Retenci\u00f3n';

const startIdx = content.indexOf(startMarker);
const endIdx   = content.indexOf(endMarker, startIdx);

if (startIdx === -1 || endIdx === -1) {
  console.error('Markers not found. startIdx=' + startIdx + ' endIdx=' + endIdx);
  // Try showing what's around line 495-500
  const lines = content.split('\n');
  console.log('Lines 493-503:', lines.slice(492, 503).map((l,i)=>(493+i)+': '+JSON.stringify(l)));
  process.exit(1);
}

const newBlock = `// ===========================================
// Servicios de Citas/Appointments
// ===========================================
// MIGRADO: Llama directamente a Supabase RPCs (sin n8n)

export const appointments = {
  /**
   * Crear una nueva cita via Supabase RPC crear_cita_segura.
   * La funcion en Supabase:
   *   1. Detecta solapamientos con duracion_min real del servicio
   *   2. Inserta la cita en tabla Citas
   *   3. Actualiza ultimo_servicio del cliente
   *   4. Acumula puntos de fidelidad (1 pt por cada S/10)
   */
  create: async (appointmentData) => {
    const businessId = localStorage.getItem('korat_business_id');
    const { data, error } = await supabase.rpc('crear_cita_segura', {
      p_business_id:  businessId,
      p_fecha:        appointmentData.fecha || appointmentData.start_time,
      p_duracion_min: appointmentData.duracion_min || 60,
      p_cliente_id:   appointmentData.cliente_id || appointmentData.client_id || null,
      p_nombre:       appointmentData.nombre || appointmentData.client_name || '',
      p_servicio:     appointmentData.servicio || appointmentData.service_name || '',
      p_precio:       appointmentData.precio || 0,
      p_staff_id:     appointmentData.staff_id || null,
      p_categoria:    appointmentData.categoria || null,
    });
    if (error) throw new Error(error.message || 'Error al crear la cita');
    const result = Array.isArray(data) ? data[0] : data;
    if (result && result.success === false) {
      const err = new Error(result.message || 'Este horario ya esta ocupado');
      err.code = result.error;
      err.status = 409;
      throw err;
    }
    return result;
  },

  /**
   * Actualizar / reagendar una cita via Supabase RPC actualizar_cita_segura.
   * Revalida solapamientos con duracion real.
   * Actualiza ultimo_servicio del cliente si cambia el servicio.
   */
  update: async (citaId, data) => {
    const businessId = localStorage.getItem('korat_business_id');
    const { data: result, error } = await supabase.rpc('actualizar_cita_segura', {
      p_business_id:     businessId,
      p_cita_id:         citaId,
      p_nueva_fecha:     data.nueva_fecha || data.fecha || null,
      p_duracion_min:    data.duracion_min || 60,
      p_nuevo_servicio:  data.nuevo_servicio || data.servicio || null,
      p_nuevo_precio:    (data.nuevo_precio !== undefined && data.nuevo_precio !== null) ? data.nuevo_precio : (data.precio !== undefined ? data.precio : null),
      p_nuevo_estado:    data.nuevo_estado || data.estado || null,
      p_nuevo_staff_id:  data.staff_id !== undefined ? data.staff_id : null,
      p_nueva_categoria: data.categoria || null,
    });
    if (error) throw new Error(error.message || 'Error al actualizar la cita');
    const r = Array.isArray(result) ? result[0] : result;
    if (r && r.success === false) {
      const err = new Error(r.message || 'No se pudo actualizar la cita');
      err.code = r.error;
      err.status = r.error === 'STAFF_CONFLICT' ? 409 : 400;
      throw err;
    }
    return r;
  },

  /**
   * Eliminar una cita -> DELETE directo en tabla Citas
   */
  delete: async (citaId) => {
    const businessId = localStorage.getItem('korat_business_id');
    const { error } = await supabase
      .from('Citas')
      .delete()
      .eq('id', citaId)
      .eq('business_id', businessId);
    if (error) throw new Error(error.message || 'Error al eliminar la cita');
    return { success: true, message: 'Cita cancelada con exito' };
  },

  /**
   * Actualizar estado de una cita -> UPDATE directo en Supabase
   */
  updateStatus: async (citaId, nuevoEstado) => {
    const businessId = localStorage.getItem('korat_business_id');
    const { data, error } = await supabase
      .from('Citas')
      .update({ estado: nuevoEstado })
      .eq('id', citaId)
      .eq('business_id', businessId)
      .select()
      .single();
    if (error) throw new Error(error.message || 'Error al actualizar estado de cita');
    return { success: true, data };
  },

  /**
   * Verificar deposito de una cita -> UPDATE directo en Supabase
   */
  verifyDeposit: async (citaId) => {
    const businessId = localStorage.getItem('korat_business_id');
    const { data, error } = await supabase
      .from('Citas')
      .update({ deposito_verificado: true })
      .eq('id', citaId)
      .eq('business_id', businessId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Obtener citas de un dia -> SELECT directo en Supabase
   * Ya no depende del endpoint GET /citas de n8n.
   */
  getAvailability: async (fecha, duracionMin, staffId) => {
    duracionMin = duracionMin || 60;
    staffId = staffId || null;
    const businessId = localStorage.getItem('korat_business_id');
    const fechaInicio = fecha + 'T00:00:00';
    const fechaFin    = fecha + 'T23:59:59';
    let query = supabase
      .from('Citas')
      .select('id, fecha, duracion_min, nombre, servicio, estado, staff_id')
      .eq('business_id', businessId)
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin)
      .not('estado', 'in', '("Cancelada","No-Show")');
    if (staffId) query = query.eq('staff_id', staffId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  },
}`;

const toReplace = content.substring(startIdx, endIdx + 3); // +3 for '};'
content = content.replace(toReplace, newBlock);
fs.writeFileSync(path, content, 'utf8');
console.log('OK - appointments migrado a Supabase directo. Chars reemplazados:', toReplace.length);
