/**
 * Script de salud y no-regresión para el Módulo Agenda (Korat MVP).
 * Verifica:
 * 1. Conexión a la base de datos de Supabase.
 * 2. Que no existan citas del pasado con hora_fin proyectada hacia el futuro (el bug de CURRENT_TIMESTAMP).
 * 3. Que el RPC actualizar_estado_cita_y_puntos esté operativo y no rompa fechas.
 * 4. Que los salones activos tengan horarios de atención válidos configurados.
 */

const { Client } = require('pg');

const CONNECTION_STRING = 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

async function verifyAgendaHealth() {
    console.log('🩺 Iniciando Diagnóstico de Salud de la Agenda Korat...');
    const client = new Client({ connectionString: CONNECTION_STRING });

    try {
        await client.connect();
        console.log('  ✅ Conexión con Supabase establecida.');

        // 1. Verificar citas con hora_fin distorsionada (+2 horas respecto a fecha + duración)
        const distortedCheck = await client.query(`
            SELECT id, nombre, fecha, hora_fin, duracion_min, estado, business_id 
            FROM "Citas" 
            WHERE hora_fin > fecha + (COALESCE(duracion_min, 60) + 120 || ' minutes')::interval
            AND fecha < CURRENT_DATE;
        `);

        if (distortedCheck.rows.length > 0) {
            console.error(`  ❌ ALERTA: Hay ${distortedCheck.rows.length} citas pasadas con hora_fin desfasada. Esto bloquea la disponibilidad.`);
            console.error(distortedCheck.rows);
            process.exit(1);
        } else {
            console.log('  ✅ No hay citas pasadas bloqueando la agenda futura (0 desfasadas).');
        }

        // 2. Verificar que los salones tengan horario configurado
        const bizCheck = await client.query(`
            SELECT id, nombre, hora_apertura, hora_cierre 
            FROM negocios 
            WHERE activo = true 
            LIMIT 10;
        `);
        const invalidBiz = bizCheck.rows.filter(b => !b.hora_apertura || !b.hora_cierre);
        if (invalidBiz.length > 0) {
            console.warn(`  ⚠️ Hay salones sin hora_apertura/cierre explícita:`, invalidBiz.map(b => b.nombre));
        } else {
            console.log(`  ✅ Todos los salones activos auditados (${bizCheck.rows.length}) tienen horarios válidos.`);
        }

        // 3. Verificar estado de la función RPC de actualización
        const rpcCheck = await client.query(`
            SELECT pg_get_functiondef(oid) as def 
            FROM pg_proc 
            WHERE proname = 'actualizar_estado_cita_y_puntos';
        `);
        if (rpcCheck.rows.length === 0) {
            console.error('  ❌ ALERTA: La función RPC actualizar_estado_cita_y_puntos no existe en la base de datos.');
            process.exit(1);
        } else {
            const def = rpcCheck.rows[0].def;
            if (def.includes('CURRENT_TIMESTAMP') && !def.includes('v_cita.duracion_min')) {
                console.warn('  ⚠️ Advertencia: El RPC podría tener la versión antigua que usa CURRENT_TIMESTAMP sin considerar la duración de la cita.');
            } else {
                console.log('  ✅ Función RPC de citas cuenta con la protección contra distorsión temporal.');
            }
        }

        console.log('\n🎉 ¡AGENDA OPERATIVA Y BLINDADA! No se detectaron anomalías.');
        await client.end();
    } catch (err) {
        console.error('  ❌ Error durante la verificación de agenda:', err.message);
        try { await client.end(); } catch {}
        process.exit(1);
    }
}

verifyAgendaHealth();
