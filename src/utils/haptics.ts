/**
 * Haptic feedback utility for mobile devices (iOS / Android)
 * Safe fallback for non-supported browsers/desktop.
 */

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

export const triggerHaptic = (type: HapticType = 'light') => {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) {
    return;
  }

  try {
    switch (type) {
      case 'selection':
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(20);
        break;
      case 'heavy':
        navigator.vibrate(35);
        break;
      case 'success':
        navigator.vibrate([15, 40, 20]);
        break;
      case 'warning':
        navigator.vibrate([25, 50, 25]);
        break;
      case 'error':
        navigator.vibrate([40, 60, 40, 60, 40]);
        break;
      default:
        navigator.vibrate(15);
        break;
    }
  } catch {
    // Silently ignore if blocked by browser policy (e.g. requires user interaction)
  }
};
