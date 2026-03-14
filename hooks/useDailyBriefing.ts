/**
 * useDailyBriefing Hook — v2
 *
 * Controla cuándo mostrar el Briefing Matutino y el Cierre de Caja Nocturno,
 * y trackea la racha de días activos (streak).
 */

import { useState, useEffect, useCallback } from 'react';

const MORNING_KEY = 'nilah_morning_date';
const EVENING_KEY = 'nilah_evening_date';
const STREAK_KEY = 'nilah_streak_days';
const LAST_ACTIVE_KEY = 'nilah_last_active_date';

export type BriefingType = 'morning' | 'evening' | null;

interface UseDailyBriefingReturn {
    shouldShow: boolean;
    briefingType: BriefingType;
    streakDays: number;
    // Morning
    showMorning: () => void;
    dismissMorning: () => void;
    // Evening
    showEvening: () => void;
    dismissEvening: () => void;
    // Dev
    resetForToday: () => void;
}

const getToday = () => new Date().toDateString();

const calcStreak = (): number => {
    const lastActive = localStorage.getItem(LAST_ACTIVE_KEY);
    const storedStreak = parseInt(localStorage.getItem(STREAK_KEY) || '0', 10);
    const today = getToday();

    if (!lastActive) return 1;

    const lastDate = new Date(lastActive);
    const todayDate = new Date(today);
    const diffMs = todayDate.getTime() - lastDate.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return storedStreak; // Same day
    if (diffDays === 1) return storedStreak + 1; // Consecutive day
    return 1; // Streak broken
};

export const useDailyBriefing = (): UseDailyBriefingReturn => {
    const [shouldShow, setShouldShow] = useState(false);
    const [briefingType, setBriefingType] = useState<BriefingType>(null);
    const [streakDays, setStreakDays] = useState(1);

    const checkShouldShow = useCallback(() => {
        const today = getToday();
        const hour = new Date().getHours();

        // Morning: 5 AM — 3 PM, first time today
        if (hour >= 5 && hour < 15) {
            const lastMorning = localStorage.getItem(MORNING_KEY);
            if (lastMorning !== today) {
                return 'morning' as BriefingType;
            }
        }

        // Evening: 8 PM — 11 PM (salon closing hours), first time today in this block
        if (hour >= 20 && hour <= 23) {
            const lastEvening = localStorage.getItem(EVENING_KEY);
            if (lastEvening !== today) {
                return 'evening' as BriefingType;
            }
        }

        return null;
    }, []);

    useEffect(() => {
        // Update streak on mount
        const newStreak = calcStreak();
        setStreakDays(newStreak);
        localStorage.setItem(STREAK_KEY, String(newStreak));
        localStorage.setItem(LAST_ACTIVE_KEY, getToday());

        // Small delay so the app loads first before showing modal
        const timer = setTimeout(() => {
            const type = checkShouldShow();
            if (type) {
                setBriefingType(type);
                setShouldShow(true);
            }
        }, 1200);

        return () => clearTimeout(timer);
    }, [checkShouldShow]);

    const showMorning = useCallback(() => {
        setBriefingType('morning');
        setShouldShow(true);
    }, []);

    const dismissMorning = useCallback(() => {
        setShouldShow(false);
        setBriefingType(null);
        localStorage.setItem(MORNING_KEY, getToday());
    }, []);

    const showEvening = useCallback(() => {
        setBriefingType('evening');
        setShouldShow(true);
    }, []);

    const dismissEvening = useCallback(() => {
        setShouldShow(false);
        setBriefingType(null);
        localStorage.setItem(EVENING_KEY, getToday());
    }, []);

    // Dev utility: force show both (clears storage)
    const resetForToday = useCallback(() => {
        localStorage.removeItem(MORNING_KEY);
        localStorage.removeItem(EVENING_KEY);
        const type = checkShouldShow();
        const show = type || 'morning';
        setBriefingType(show);
        setShouldShow(true);
    }, [checkShouldShow]);

    return {
        shouldShow,
        briefingType,
        streakDays,
        showMorning,
        dismissMorning,
        showEvening,
        dismissEvening,
        resetForToday,
    };
};

export default useDailyBriefing;
