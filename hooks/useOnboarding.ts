import { useState, useEffect } from 'react';

const ONBOARDING_KEY = 'korat_onboarding_completed';

export const useOnboarding = () => {
    const [isOnboardingActive, setIsOnboardingActive] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const checkOnboardingStatus = () => {
            const hasCompleted = localStorage.getItem(ONBOARDING_KEY) === 'true';
            setIsOnboardingActive(!hasCompleted);
            setIsLoaded(true);
        };

        // Small delay to ensure the app has rendered its elements before starting the tour
        const timer = setTimeout(checkOnboardingStatus, 500);
        return () => clearTimeout(timer);
    }, []);

    const completeOnboarding = () => {
        localStorage.setItem(ONBOARDING_KEY, 'true');
        setIsOnboardingActive(false);
    };

    const resetOnboarding = () => {
        localStorage.removeItem(ONBOARDING_KEY);
        setIsOnboardingActive(true);
    };

    return {
        isOnboardingActive,
        isLoaded,
        completeOnboarding,
        resetOnboarding
    };
};
