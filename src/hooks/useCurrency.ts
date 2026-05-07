import { useCallback } from 'react';
import { useDashboardData } from '../context/DashboardDataContext';

export const useCurrency = () => {
    const { businessConfig } = useDashboardData();

    // Default to 'USD' or '$' if config is not yet loaded, but prefer the business's currency.
    // The db should store something like 'PEN' for Soles, 'USD' for dollars, 'COP' for Colombian Pesos.
    // If it stores symbols like 'S/' or '$', we can just prefix it.
    
    // As in DashboardDataContext, businessConfig defaults to { moneda: 'S/.', idioma: 'es-PE' }.
    const symbol = businessConfig?.moneda || 'S/.';
    const locale = businessConfig?.idioma || 'es-PE';

    const formatMoney = useCallback((amount: number) => {
        const validAmount = Number(amount) || 0;
        
        // Define options for Intl.NumberFormat based on whether the number is whole
        const hasDecimals = validAmount % 1 !== 0;
        const fractionDigits = hasDecimals ? 2 : 0;
        
        const formatOptions: Intl.NumberFormatOptions = {
            minimumFractionDigits: fractionDigits,
            maximumFractionDigits: fractionDigits
        };

        const formattedNumber = new Intl.NumberFormat(locale, formatOptions).format(validAmount);

        if (symbol.length === 3 && symbol === symbol.toUpperCase() && !symbol.includes('/')) {
            return new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: symbol,
                ...formatOptions
            }).format(validAmount);
        }

        return `${symbol} ${formattedNumber}`;
    }, [symbol, locale]);

    return { 
        formatMoney, 
        formatValue: formatMoney, // alias for backwards compatibility
        symbol, 
        locale,
        moneda: symbol, // alias
        idioma: locale // alias
    };
};
