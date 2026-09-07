import { FichaTecnicaData } from './FichaTecnicaEditor';

export interface BeautyInsight {
    id: string;
    specialty: 'lash' | 'nails' | 'brows' | 'general';
    type: 'warning' | 'tip' | 'success' | 'info';
    title: string;
    message: string;
    badgeText?: string;
}

/**
 * Intelligent Beauty Advisor Engine (Copiloto Inteligente de Cabina)
 * Evaluates combinations of morphology, sensitivities, natural hair/nail condition,
 * and treatment parameters to generate proactive professional advice.
 */
export function evaluateBeautyInsights(ficha?: FichaTecnicaData | null): BeautyInsight[] {
    if (!ficha) return [];
    const insights: BeautyInsight[] = [];

    // ─────────────────────────────────────────────
    // 👁️ PESTAÑAS (LASH ENGINE)
    // ─────────────────────────────────────────────
    if (ficha.lash) {
        const { lash } = ficha;
        const maxZoneLength = lash.zonas_mapeo && lash.zonas_mapeo.length > 0 
            ? Math.max(...lash.zonas_mapeo) 
            : 0;

        // 1. Sobrecarga Folicular (Pestaña Fina + Longitud Larga o Volumen Pesado)
        if (lash.salud_pestana === 'Fina / Dañada' && (maxZoneLength >= 13 || lash.tecnica?.includes('Volumen') || lash.tecnica?.includes('Mega'))) {
            insights.push({
                id: 'lash-overload',
                specialty: 'lash',
                type: 'warning',
                title: 'Riesgo de Sobrecarga Folicular',
                badgeText: '⚠️ Daño Folicular',
                message: `Pestaña natural fina con longitud ${maxZoneLength ? `${maxZoneLength}mm` : 'alta'}. Se recomienda bajar a 9-11mm o usar microfibras 0.05/0.07 para evitar caída prematura.`
            });
        }

        // 2. Ojo Encapotado + Curvatura C
        if (lash.morfologia_ojo === 'Encapotado (Párpado Caído)' && (lash.curvatura === 'C' || lash.curvatura === 'CC')) {
            insights.push({
                id: 'lash-hooded-curve',
                specialty: 'lash',
                type: 'tip',
                title: 'Curvatura Oculta en Párpado Caído',
                badgeText: '💡 Tip Curvatura',
                message: 'La curvatura C/CC suele esconderse bajo el pliegue del párpado. Te recomendamos curvas L, M o D para elevar y proyectar la mirada.'
            });
        }

        // 3. Ojo Redondo + Efecto Foxy / Cat Eye (Match Positivo)
        if (lash.morfologia_ojo === 'Redondo' && (lash.efecto?.includes('Cat Eye') || lash.efecto?.includes('Foxy'))) {
            insights.push({
                id: 'lash-round-match',
                specialty: 'lash',
                type: 'success',
                title: 'Efecto Visual Elongador',
                badgeText: '✨ Match de Diseño',
                message: 'Excelente elección: el diseño Cat/Foxy en ojos redondos genera un efecto almendrado muy armonioso.'
            });
        }

        // 4. Ojo Hundido + Curvatura DD
        if (lash.morfologia_ojo === 'Hundido' && (lash.curvatura === 'DD' || lash.curvatura === 'D')) {
            insights.push({
                id: 'lash-deep-set',
                specialty: 'lash',
                type: 'tip',
                title: 'Posible Roce con el Párpado',
                badgeText: '💡 Proyección',
                message: 'En ojos hundidos, una curva muy cerrada puede rozar el párpado superior. Curvaturas C o L aportan mayor comodidad.'
            });
        }

        // 5. Ojos Llorosos / Sensibilidad Química
        if (lash.sensibilidad === 'Ojos Llorosos' || lash.sensibilidad === 'Sensible al Cianoacrilato') {
            insights.push({
                id: 'lash-watery-eyes',
                specialty: 'lash',
                type: 'warning',
                title: 'Sensibilidad a Vapores / Lagrimeo',
                badgeText: '🛡️ Cuidado Químico',
                message: 'El lagrimeo puede cristalizar el adhesivo (shock curing). Usa adhesivo de secado rápido (0.5-1s), ventilador suave y parches anti-vapores.'
            });
        } else if (lash.sensibilidad === 'Lentes de Contacto') {
            insights.push({
                id: 'lash-contacts',
                specialty: 'lash',
                type: 'info',
                title: 'Uso de Lentes de Contacto',
                badgeText: '👁️ Lentes',
                message: 'Verificar retiro de lentes antes de aplicar adhesivo y separar 1mm el parche de la línea de agua.'
            });
        }
    }

    // ─────────────────────────────────────────────
    // 💅 UÑAS (NAILS ENGINE)
    // ─────────────────────────────────────────────
    if (ficha.nails) {
        const { nails } = ficha;

        // 1. Sensibilidad UV & Uña Fina (Pico de Calor Exotérmico)
        if (nails.tipo_una === 'Frágil / Quebradiza' || nails.lampara?.toLowerCase().includes('sensib') || nails.lampara?.toLowerCase().includes('quema') || nails.lampara?.toLowerCase().includes('ardor')) {
            insights.push({
                id: 'nails-low-heat',
                specialty: 'nails',
                type: 'warning',
                title: 'Pico Exotérmico en Lámpara UV',
                badgeText: '🔥 Cuidado en Lámpara',
                message: 'Uña frágil o sensible al calor: Activa el modo "Low Heat" (curado progresivo 99s) y aplica capas delgadas de Rubber Base.'
            });
        }

        // 2. Uña Grasa / Húmeda (Retención)
        if (nails.tipo_una === 'Grasa / Húmeda') {
            insights.push({
                id: 'nails-oily-bed',
                specialty: 'nails',
                type: 'tip',
                title: 'Protocolo Anti-Desprendimiento',
                badgeText: '🛡️ Retención',
                message: 'Uña con alto contenido lipídico: Aplica doble capa de Nail Prep/Deshidratador + Primer sin ácido con secado al aire 60s.'
            });
        }

        // 3. Largo Extremo sin Estructura Rígida
        const isLong = nails.largo?.includes('Largo') || nails.largo?.includes('Extralargo') || nails.largo?.includes('#4') || nails.largo?.includes('#5') || nails.largo?.includes('#6');
        if (isLong && nails.sistema?.includes('Semipermanente')) {
            insights.push({
                id: 'nails-long-structure',
                specialty: 'nails',
                type: 'warning',
                title: 'Estructura Insuficiente para Largo Extremo',
                badgeText: '⚠️ Riesgo de Rotura',
                message: 'Largo #4 o superior sobre esmaltado semipermanente corre alto riesgo de quiebre. Se recomienda reforzar con Capping, Polygel o Acrílico.'
            });
        }
    }

    // ─────────────────────────────────────────────
    // 🌿 CEJAS (BROWS ENGINE)
    // ─────────────────────────────────────────────
    if (ficha.brows) {
        const { brows } = ficha;

        // 1. Vello Rebelde en Laminado
        if (brows.grosor_vello === 'Grueso / Rebelde' && brows.servicio?.toLowerCase().includes('lamin')) {
            insights.push({
                id: 'brows-thick-time',
                specialty: 'brows',
                type: 'tip',
                title: 'Tiempo de Pose Extendido en Laminado',
                badgeText: '⏱️ Tiempos de Pose',
                message: 'Vello grueso: Deja el Paso 1 entre 10-12 min cubierto con film osmótico para ablandar adecuadamente los puentes disulfuro.'
            });
        } else if (brows.grosor_vello === 'Fino / Delicado' && brows.servicio?.toLowerCase().includes('lamin')) {
            insights.push({
                id: 'brows-thin-caution',
                specialty: 'brows',
                type: 'warning',
                title: 'Monitoreo Rápido en Vello Fino',
                badgeText: '⚠️ Vello Delicado',
                message: 'Vello fino y poroso: Revisar elasticidad al minuto 4-6 para evitar sobreprocesamiento o quemado de puntas.'
            });
        }
    }

    return insights;
}
