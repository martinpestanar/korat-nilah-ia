/**
 * bi.ts — Business Intelligence analysis engines for Korat CRM
 * 3 features:
 *   1. RFM Cadence Predictor  → per-client "overdue" detection based on personal rhythm
 *   2. Valley Hours           → identify slow day/time slots for targeted campaigns
 *   3. Staff Affinity Risk    → detect dangerous dependency on specific staff members
 *
 * Nilah IA · Korat Flow
 */

import { RFMClientProfile, ValleySlot, StaffAffinityResult } from '../types/crm';
import { SegmentClientProfile } from '../types/crm';

// ══════════════════════════════════════════════════════════════
// 1. RFM CADENCE PREDICTOR
//    Instead of a fixed 45-day generic threshold, we compute
//    each client's personal visit rhythm and flag them when
//    they are overdue relative to THEIR OWN pattern.
// ══════════════════════════════════════════════════════════════

export function computeRFMCadences(
    profiles: Map<number, SegmentClientProfile>
): RFMClientProfile[] {
    const today = new Date();
    const results: RFMClientProfile[] = [];

    profiles.forEach(profile => {
        const history = profile.serviceHistory || [];
        if (history.length === 0) return;

        // Sort by date ascending
        const sorted = [...history]
            .map(h => ({ ...h, d: new Date(h.fecha) }))
            .filter(h => !isNaN(h.d.getTime()))
            .sort((a, b) => a.d.getTime() - b.d.getTime());

        if (sorted.length === 0) return;

        // Compute average gap between consecutive visits
        const gaps: number[] = [];
        for (let i = 1; i < sorted.length; i++) {
            const diffMs = sorted[i].d.getTime() - sorted[i - 1].d.getTime();
            const diffDays = diffMs / (1000 * 60 * 60 * 24);
            if (diffDays > 0) gaps.push(diffDays);
        }

        // Need at least 2 visits to compute cadence
        const avgCadenceDays = gaps.length >= 1
            ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length)
            : 60; // default fallback

        const lastVisitDate = sorted[sorted.length - 1].d;
        const daysSinceLastVisit = Math.round(
            (today.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // overdueByDays:  >0 means they are past their normal window
        const overdueByDays = daysSinceLastVisit - avgCadenceDays;

        // Pick top service by frequency
        const svcCounts: Record<string, number> = {};
        history.forEach(h => { svcCounts[h.servicio] = (svcCounts[h.servicio] || 0) + 1; });
        const topService = Object.entries(svcCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';

        // Risk levels
        let riskLevel: RFMClientProfile['riskLevel'];
        if (overdueByDays > avgCadenceDays) riskLevel = 'lost';
        else if (overdueByDays > 7) riskLevel = 'overdue';
        else if (overdueByDays > -7) riskLevel = 'due-soon';
        else riskLevel = 'on-time';

        results.push({
            clientId: profile.clientId,
            nombre: profile.nombre,
            telefono: profile.telefono,
            ltv: profile.ltv,
            avgCadenceDays,
            daysSinceLastVisit,
            overdueByDays,
            topService,
            totalVisits: sorted.length,
            riskLevel,
        });
    });

    // Sort: most overdue first
    return results.sort((a, b) => b.overdueByDays - a.overdueByDays);
}

// ══════════════════════════════════════════════════════════════
// 2. VALLEY HOURS ANALYSIS
//    Builds a frequency map of (dayOfWeek × hour) slots.
//    Classifies slots as "valley" if their count is ≤ 40% of
//    the average busy slot count.
// ══════════════════════════════════════════════════════════════

const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function computeValleyHours(appointments: any[]): {
    slots: ValleySlot[];
    valleyDays: { dayLabel: string; dayOfWeek: number; totalBookings: number; isValley: boolean }[];
    peakDays: { dayLabel: string; dayOfWeek: number; totalBookings: number }[];
} {
    // Count bookings per day-of-week × hour
    const matrix: Record<string, number> = {};
    const completed = appointments.filter(a => {
        const st = (a.estado || '').toLowerCase();
        return st === 'completada' || st === 'completado';
    });

    completed.forEach(a => {
        const rawDate = a.fecha || a.start_time;
        if (!rawDate) return;
        const d = new Date(rawDate);
        if (isNaN(d.getTime())) return;
        const key = `${d.getDay()}_${d.getHours()}`;
        matrix[key] = (matrix[key] || 0) + 1;
    });

    if (Object.keys(matrix).length === 0) {
        return { slots: [], valleyDays: [], peakDays: [] };
    }

    const counts = Object.values(matrix);
    const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
    const valleyThreshold = mean * 0.4; // slots at ≤ 40% of avg are "valleys"

    // Build slots list (only work hours 8–20)
    const slots: ValleySlot[] = [];
    for (let day = 0; day <= 6; day++) {
        for (let hour = 8; hour <= 20; hour++) {
            const key = `${day}_${hour}`;
            const count = matrix[key] || 0;
            slots.push({
                dayOfWeek: day,
                dayLabel: DAY_LABELS[day],
                hour,
                bookingCount: count,
                isValley: count <= valleyThreshold,
            });
        }
    }

    // Per-day aggregation
    const dayTotals: Record<number, number> = {};
    for (let day = 0; day <= 6; day++) {
        let tot = 0;
        for (let h = 8; h <= 20; h++) { tot += (matrix[`${day}_${h}`] || 0); }
        dayTotals[day] = tot;
    }
    const dayMean = Object.values(dayTotals).reduce((a, b) => a + b, 0) / 7;
    const dayValleyThreshold = dayMean * 0.6;

    const valleyDays = Array.from({ length: 7 }, (_, i) => ({
        dayOfWeek: i,
        dayLabel: DAY_LABELS[i],
        totalBookings: dayTotals[i] || 0,
        isValley: (dayTotals[i] || 0) <= dayValleyThreshold,
    })).filter(d => d.dayOfWeek >= 1); // skip Sunday if closed

    const peakDays = [...valleyDays]
        .sort((a, b) => b.totalBookings - a.totalBookings)
        .slice(0, 3);

    return { slots, valleyDays, peakDays };
}

// ══════════════════════════════════════════════════════════════
// 3. STAFF AFFINITY RISK
//    Determines which staff members hold a dangerous level of
//    exclusive client relationships. If that staff member left,
//    which clients would the business lose?
//
//    Uses `staffList` from DashboardDataContext to get exact
//    names and matches appointments via staff_id/empleada_id.
// ══════════════════════════════════════════════════════════════

export function computeStaffAffinity(
    appointments: any[],
    staffList: { id: number | string; nombre: string }[],
    profiles: Map<number, SegmentClientProfile>
): StaffAffinityResult[] {
    // Map: staffKey → { name, clientIds: Set<clientId> }
    const staffMap: Map<string, { name: string; clientIds: Set<number> }> = new Map();
    // Map: clientId → Set<staffKey>
    const clientStaffMap: Map<number, Set<string>> = new Map();

    const completed = appointments.filter(a => {
        const st = (a.estado || '').toLowerCase();
        return st === 'completada' || st === 'completado';
    });

    completed.forEach(a => {
        const clientId = Number(a.cliente || a.cliente_id);
        if (!clientId) return;

        // Determine staff identifier: prefer numeric ID
        const rawStaffId = a.staff_id || a.empleada_id;
        const rawStaffName = a.nombre_empleada || a.empleada_nombre || a.staff_nombre || a.empleada || '';

        // If no ID and no Name in the appointment, skip
        if (!rawStaffId && !rawStaffName) return;

        let staffKey = '';
        let staffDisplayName = '';

        if (rawStaffId) {
            staffKey = `id_${rawStaffId}`;
            // Lookup real name from staffList if we have an ID
            const foundStaff = staffList.find(s => String(s.id) === String(rawStaffId));
            staffDisplayName = foundStaff ? foundStaff.nombre : (rawStaffName || `Empleada #${rawStaffId}`);
        } else {
            // Fallback for older appointments without numeric ID
            staffKey = `name_${rawStaffName.trim().toLowerCase()}`;
            staffDisplayName = rawStaffName;
        }

        if (!staffMap.has(staffKey)) {
            staffMap.set(staffKey, { name: staffDisplayName, clientIds: new Set() });
        }
        staffMap.get(staffKey)!.clientIds.add(clientId);

        if (!clientStaffMap.has(clientId)) clientStaffMap.set(clientId, new Set());
        clientStaffMap.get(clientId)!.add(staffKey);
    });

    if (staffMap.size === 0) return [];

    const results: StaffAffinityResult[] = [];

    staffMap.forEach((info, staffKey) => {
        const totalClients = info.clientIds.size;
        if (totalClients === 0) return;

        // Exclusive = clients who ONLY visited this staff member
        const exclusiveClientIds = Array.from(info.clientIds).filter(cId => {
            const staffsForClient = clientStaffMap.get(cId);
            return staffsForClient && staffsForClient.size === 1 && staffsForClient.has(staffKey);
        });
        const exclusiveClients = exclusiveClientIds.length;
        const exclusivePct = Math.round((exclusiveClients / totalClients) * 100);

        // Risk level based on exclusive percentage
        let riskLevel: StaffAffinityResult['riskLevel'];
        if (exclusivePct >= 70) riskLevel = 'critical';
        else if (exclusivePct >= 50) riskLevel = 'high';
        else if (exclusivePct >= 25) riskLevel = 'medium';
        else riskLevel = 'low';

        // Top exclusive clients by LTV
        const topExclusiveClients = exclusiveClientIds
            .map(cId => {
                const p = profiles.get(cId);
                return p ? { clientId: cId, nombre: p.nombre, ltv: p.ltv } : null;
            })
            .filter((x): x is NonNullable<typeof x> => x !== null)
            .sort((a, b) => b.ltv - a.ltv)
            .slice(0, 5);

        results.push({
            staffId: staffKey.replace('id_', '').replace('name_', ''),
            staffName: info.name,
            totalClients,
            exclusiveClients,
            exclusivePct,
            riskLevel,
            topExclusiveClients,
        });
    });

    // Sort by risk level (critical → high → medium → low), then by exclusivePct desc
    const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return results.sort((a, b) => {
        const rd = riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
        if (rd !== 0) return rd;
        return b.exclusivePct - a.exclusivePct;
    });
}

