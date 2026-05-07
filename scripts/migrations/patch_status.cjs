// Fix E3: updateStatus debe llamar a actualizar_estado_cita_y_puntos
// Fix E3/E4: Los errores de staff inactivo y fecha pasada deben llegar al frontend
const fs = require('fs');
const path = 'services/api.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix updateStatus: llamar al RPC en vez de UPDATE directo
const oldUpdateStatus = `  updateStatus: async (citaId, nuevoEstado) => {
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
  },`;

const newUpdateStatus = `  /**
   * Actualizar estado de una cita via RPC actualizar_estado_cita_y_puntos.
   * FIX E3: El RPC calcula puntos de fidelidad correctamente al pasar a Completada.
   * FIX E4: Al revertir de Completada, el RPC quita los puntos acumulados.
   */
  updateStatus: async (citaId, nuevoEstado) => {
    const businessId = localStorage.getItem('korat_business_id');
    const { data, error } = await supabase.rpc('actualizar_estado_cita_y_puntos', {
      p_cita_id:    citaId,
      p_estado:     nuevoEstado,
      p_business_id: businessId,
    });
    if (error) throw new Error(error.message || 'Error al actualizar estado de cita');
    const result = Array.isArray(data) ? data[0] : data;
    if (result && result.success === false) {
      throw new Error(result.error || result.message || 'No se pudo actualizar el estado');
    }
    return result;
  },`;

if (!content.includes(oldUpdateStatus)) {
  console.error('Target updateStatus not found — showing surrounding context:');
  const idx = content.indexOf('updateStatus: async (citaId, nuevoEstado)');
  console.log('Position:', idx);
  console.log('Context:', JSON.stringify(content.substring(idx, idx+400)));
  process.exit(1);
}

content = content.replace(oldUpdateStatus, newUpdateStatus);
fs.writeFileSync(path, content, 'utf8');
console.log('OK - updateStatus migrado a actualizar_estado_cita_y_puntos RPC');
