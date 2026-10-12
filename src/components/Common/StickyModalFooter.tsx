import React from 'react';
import { triggerHaptic } from '../../utils/haptics';

interface StickyModalFooterProps {
  onCancel?: () => void;
  onSubmit?: () => void;
  cancelText?: string;
  submitText?: string;
  isSubmitting?: boolean;
  submitDisabled?: boolean;
  submitIcon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Sticky action footer for mobile forms and drawers.
 * Stays pinned at the bottom of the viewport with safe-area spacing and thumb-friendly sizing.
 */
export const StickyModalFooter: React.FC<StickyModalFooterProps> = ({
  onCancel,
  onSubmit,
  cancelText = 'Cancelar',
  submitText = 'Guardar Cambios',
  isSubmitting = false,
  submitDisabled = false,
  submitIcon,
  children,
  className = '',
}) => {
  return (
    <div
      className={`sticky bottom-0 z-20 w-full px-4 sm:px-6 py-3.5 bg-white/95 dark:bg-dark-850/95 backdrop-blur-md border-t border-gray-100 dark:border-white/10 flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3 justify-end safe-pb shadow-[0_-8px_20px_-6px_rgba(0,0,0,0.06)] dark:shadow-[0_-8px_20px_-6px_rgba(0,0,0,0.4)] ${className}`}
    >
      {children ? (
        children
      ) : (
        <>
          {onCancel && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onCancel();
              }}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-4 py-3 sm:py-2.5 rounded-xl font-medium text-xs sm:text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-dark-750 hover:bg-gray-200 dark:hover:bg-dark-700 active:scale-98 transition-all text-center order-2 sm:order-1 min-h-[44px]"
            >
              {cancelText}
            </button>
          )}

          {onSubmit && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                onSubmit();
              }}
              disabled={submitDisabled || isSubmitting}
              className="w-full sm:w-auto px-6 py-3 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white gradient-brand shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2 min-h-[44px]"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                submitIcon
              )}
              <span>{isSubmitting ? 'Guardando...' : submitText}</span>
            </button>
          )}
        </>
      )}
    </div>
  );
};
export default StickyModalFooter;
