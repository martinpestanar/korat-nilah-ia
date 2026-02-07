/**
 * useDailyBriefing Hook
 * Controla cuándo mostrar el Daily Briefing modal
 */

import { useState, useEffect, useCallback } from 'react';

interface UseDailyBriefingReturn {
    shouldShow: boolean;
    showBriefing: () => void;
    dismissBriefing: () => void;
    resetForToday: () => void;
}

const STORAGE_KEY = 'lastBriefingDate';

export const useDailyBriefing = (): UseDailyBriefingReturn => {
    const [shouldShow, setShouldShow] = useState(false);

    // Verificar si debe mostrar el briefing
    const checkShouldShow = useCallback(() => {
        const lastBriefingDate = localStorage.getItem(STORAGE_KEY);
        const today = new Date().toDateString();

        // Si ya vio el briefing hoy, no mostrar
        if (lastBriefingDate === today) {
            return false;
        }

        // Verificar hora del día (opcional: solo mostrar en horarios específicos)
        const hour = new Date().getHours();

        // Mostrar si:
        // - Es la primera visita del día
        // - Está entre 6 AM y 10 PM (horario razonable)
        if (hour >= 6 && hour <= 22) {
            return true;
        }

        return true; // Mostrar siempre si no ha visto hoy
    }, []);

    useEffect(() => {
        // Pequeño delay para que la app cargue primero
        const timer = setTimeout(() => {
            const show = checkShouldShow();
            setShouldShow(show);
        }, 1000); // 1 segundo de delay

        return () => clearTimeout(timer);
    }, [checkShouldShow]);

    const showBriefing = useCallback(() => {
        setShouldShow(true);
    }, []);

    const dismissBriefing = useCallback(() => {
        setShouldShow(false);
        localStorage.setItem(STORAGE_KEY, new Date().toDateString());
    }, []);

    const resetForToday = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        setShouldShow(true);
    }, []);

    return {
        shouldShow,
        showBriefing,
        dismissBriefing,
        resetForToday
    };
};

export default useDailyBriefing;
