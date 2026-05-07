import { supabase } from '../services/supabase';
import { CountryCode, KeyDate, MonthCard } from '../types/campaignBuilderTypes';
import { KEY_DATES_BY_COUNTRY, createContentIdeas } from './campaignMockData';

/**
 * Fetches KeyDates from Supabase for a given country and businessId.
 * Merges them with dynamic contentIdeas and falls back to MockData if DB fails or is empty.
 */
export const fetchKeyDates = async (country: CountryCode, businessId: string | null): Promise<KeyDate[]> => {
    try {
        // Query global dates (business_id is null) or specific to this business
        let query = supabase
            .from('calendario_festivos')
            .select('*')
            .eq('pais', getCountryName(country));
            
        // If businessId exists, we get both global and business-specific dates
        // Since Supabase RPC or complex mixed queries are sometimes tricky from client,
        // we fetch by country and then filter locally to ensure maximum compatibility.
        // Wait, actually `or` syntax:
        if (businessId) {
            query = query.or(`business_id.is.null,business_id.eq.${businessId}`);
        } else {
            query = query.is('business_id', null);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching calendario_festivos:', error);
            // Fallback to mock data
            return KEY_DATES_BY_COUNTRY[country] || [];
        }

        if (!data || data.length === 0) {
            console.warn(`No key dates found in Supabase for country ${country}, using fallback`);
            return KEY_DATES_BY_COUNTRY[country] || [];
        }

        // Map Supabase response to KeyDate interface
        const DB_DATES: KeyDate[] = data.map((item: any) => {
            // Transform YYYY-MM-DD to MM-DD
            const dateParts = item.fecha.split('-');
            const mdDate = dateParts.length === 3 ? `${dateParts[1]}-${dateParts[2]}` : item.fecha;

            return {
                id: item.id,
                date: mdDate,
                name: item.nombre_festividad,
                category: item.tipo === 'comercial' ? 'commercial' : item.tipo === 'religioso' || item.tipo === 'nacional' ? 'holiday' : 'cultural',
                description: `Festividad ${item.estacion}`,
                contentIdeas: createContentIdeas(item.nombre_festividad, item.tipo)
            } as KeyDate;
        });

        // Filter out duplicate dates handling local priorities (business specific over global if same date)
        const uniqueDatesMap = new Map<string, KeyDate>();
        DB_DATES.forEach(d => {
            uniqueDatesMap.set(d.date + d.name, d);
        });

        return Array.from(uniqueDatesMap.values());

    } catch (err) {
        console.error('Exception fetching KeyDates:', err);
        return KEY_DATES_BY_COUNTRY[country] || [];
    }
};

/**
 * Helper to map country code to DB name
 */
const getCountryName = (code: CountryCode): string => {
    switch(code) {
        case 'PE': return 'Perú';
        case 'MX': return 'México';
        case 'CO': return 'Colombia';
        case 'AR': return 'Argentina';
        case 'CL': return 'Chile';
        case 'EC': return 'Ecuador';
        default: return 'Perú';
    }
};

/**
 * Generates the 3 month cards dynamically based on real DB data
 */
export const fetchMonthCardsAsync = async (country: CountryCode, businessId: string | null): Promise<MonthCard[]> => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const cards: MonthCard[] = [];
    const keyDates = await fetchKeyDates(country, businessId);

    for (let i = 0; i < 3; i++) {
        let month = currentMonth + i;
        let year = currentYear;

        if (month > 11) {
            month = month - 12;
            year = currentYear + 1;
        }

        // Filter dates for this month
        const monthDates = keyDates.filter(date => {
            const [mm] = date.date.split('-');
            return parseInt(mm) === month + 1;
        });

        cards.push({
            month,
            year,
            status: i === 0 ? 'active' : i === 1 ? 'planning' : 'preview',
            keyDates: monthDates,
            weeks: [],
            campaignsCreated: 0,
            campaignsPending: monthDates.length,
        });
    }

    return cards;
};
