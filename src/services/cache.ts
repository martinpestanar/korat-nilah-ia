// =====================================================
// DATA CACHE SERVICE
// Caché local con TTL para reducir llamadas a n8n
// =====================================================

interface CacheItem<T> {
    data: T;
    timestamp: number;
}

class DataCache {
    private storage = new Map<string, CacheItem<any>>();
    private defaultTTL = 5 * 60 * 1000; // 5 minutos por defecto

    /**
     * Obtener item del caché
     * @param key - Clave del item
     * @param ttl - TTL personalizado (opcional)
     * @returns Datos o null si expiró/no existe
     */
    get<T>(key: string, ttl?: number): T | null {
        const item = this.storage.get(key);
        if (!item) return null;

        const maxAge = ttl || this.defaultTTL;
        if (Date.now() - item.timestamp > maxAge) {

            this.storage.delete(key);
            return null;
        }


        return item.data as T;
    }

    /**
     * Guardar item en caché
     * @param key - Clave del item
     * @param data - Datos a guardar
     */
    set<T>(key: string, data: T): void {

        this.storage.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Invalidar caché
     * @param key - Clave específica o undefined para limpiar todo
     */
    invalidate(key?: string): void {
        if (key) {

            this.storage.delete(key);
        } else {

            this.storage.clear();
        }
    }

    /**
     * Verificar si un item existe y está fresco
     */
    has(key: string, ttl?: number): boolean {
        return this.get(key, ttl) !== null;
    }

    /**
     * Obtener edad del caché en segundos
     */
    getAge(key: string): number | null {
        const item = this.storage.get(key);
        if (!item) return null;
        return Math.round((Date.now() - item.timestamp) / 1000);
    }
}

// Singleton instance
export const cache = new DataCache();

// Cache keys constants
export const CACHE_KEYS = {
    DASHBOARD_ALL: 'dashboard_all',
    CLIENTS: 'clients',
    APPOINTMENTS: 'appointments',
    ENGAGEMENT: 'engagement',
    STATS: 'stats'
} as const;

export default cache;
