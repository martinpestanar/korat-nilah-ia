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
        // Here we handle cases where the db explicitly stores a currency code (e.g. 'PEN', 'USD')
        // vs a raw symbol (e.g. 'S/', '$').
        // Since the prompt suggests it is 'S/' at the moment, let's prefix it.
        const validAmount = Number(amount) || 0;
        
        // Use Intl.NumberFormat for thousands separators, 2 decimals
        const formattedNumber = new Intl.NumberFormat(locale, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(validAmount);

        // If 'moneda' looks like an ISO code (length 3, uppercase), we could format properly.
        // But assuming it's a symbol like 'S/' or 'COP ' or '$':
        if (symbol.length === 3 && symbol === symbol.toUpperCase() && !symbol.includes('/')) {
            // It's likely an ISO code like PEN or COP
            return new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: symbol,
                minimumFractionDigits: 2
            }).format(validAmount);
        }

        // Just prefix the symbol
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
