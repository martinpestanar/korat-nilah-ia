import { useDashboardData } from '../context/DashboardDataContext';

export const useCurrency = () => {
    const { businessConfig } = useDashboardData();

    const moneda = businessConfig?.moneda || 'S/.';
    const idioma = businessConfig?.idioma || 'es-PE';

    const formatValue = (value: number | string | null | undefined): string => {
        if (value === null || value === undefined || isNaN(Number(value))) {
            return `${moneda} 0.00`;
        }

        const numValue = Number(value);

        try {
            // Using Intl.NumberFormat for proper locale formatting.
            // Since we might not have a strong mapping from 'S/.' to ISO currency codes for all cases,
            // we can format the number with the locale and prepend/append the currency symbol manually
            // to ensure it matches exactly what's in the DB.
            const formattedNumber = new Intl.NumberFormat(idioma, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(numValue);

            // Special case for formats where currency symbol might go at the end, 
            // but for simplicity and common MVP requested format, we put it at the front.
            return `${moneda} ${formattedNumber}`;
        } catch (e) {
            console.warn('Error formatting currency', e);
            // Fallback
            return `${moneda} ${numValue.toFixed(2)}`;
        }
    };

    return { formatValue, moneda, idioma };
};
