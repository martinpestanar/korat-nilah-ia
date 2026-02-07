
import React, { useState, useEffect, useCallback } from 'react';
import { Users, AlertTriangle, CheckCircle, XCircle, TrendingUp, RefreshCw, Loader2 } from 'lucide-react';
import { crm } from '../../services/api';

// ===========================================
// Types
// ===========================================

interface ClientStats {
    status_color: 'success' | 'warning' | 'error' | 'critical' | 'neutral';
    nivel_riesgo: 'Bajo' | 'Medio' | 'Alto' | 'Crítico';
    label: string;
    dias_ausente: number;
}

interface Client {
    id: number;
    nombre: string;
    stats?: ClientStats;
}

interface HealthMetrics {
    total: number;
    activos: number;
    enAlerta: number;
    enRiesgo: number;
    criticos: number;
    tasaRetencion: number;
}

// ===========================================
// Component
// ===========================================

const ClientHealthCard: React.FC = () => {
    const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Caché compartido con página de Clientes
    const CACHE_KEY = 'korat_clients_cache';
    const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutos

    const loadFromCache = (): any[] | null => {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (!cached) return null;
            const { clients } = JSON.parse(cached);
            return clients;
        } catch {
            return null;
        }
    };

    const isCacheFresh = (): boolean => {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (!cached) return false;
            const { timestamp } = JSON.parse(cached);
            return Date.now() - timestamp < CACHE_EXPIRY_MS;
        } catch {
            return false;
        }
    };

    const saveToCache = (clients: any[]) => {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                timestamp: Date.now(),
                clients
            }));
        } catch (e) {
            console.warn('Error saving to cache:', e);
        }
    };

    const calculateMetrics = (clientsArray: any[]) => {
        const total = clientsArray.length;
        const activos = clientsArray.filter((c: any) =>
            c.stats?.nivel_riesgo === 'Bajo' || c.stats?.status_color === 'success'
        ).length;
        const enAlerta = clientsArray.filter((c: any) =>
            c.stats?.nivel_riesgo === 'Medio' || c.stats?.status_color === 'warning'
        ).length;
        const enRiesgo = clientsArray.filter((c: any) =>
            c.stats?.nivel_riesgo === 'Alto' || c.stats?.status_color === 'error'
        ).length;
        const criticos = clientsArray.filter((c: any) =>
            c.stats?.nivel_riesgo === 'Crítico' || c.stats?.status_color === 'critical'
        ).length;

        return {
            total,
            activos,
            enAlerta,
            enRiesgo,
            criticos,
            tasaRetencion: total > 0 ? (activos / total) * 100 : 0
        };
    };

    const loadData = useCallback(async (forceRefresh = false) => {
        // 1. Intentar cargar del caché primero
        if (!forceRefresh) {
            const cachedClients = loadFromCache();
            if (cachedClients && cachedClients.length > 0) {
                setMetrics(calculateMetrics(cachedClients));
                setIsLoading(false);

                if (isCacheFresh()) {
                    console.log('📦 ClientHealthCard: datos desde caché (fresco)');
                    return;
                }
                console.log('📦 ClientHealthCard: datos desde caché (actualizando...)');
            }
        }

        if (!loadFromCache()) {
            setIsLoading(true);
        }

        try {
            const data = await crm.getClients();

            // Normalizar array
            let clientsArray: any[] = [];
            if (Array.isArray(data)) {
                clientsArray = data.filter((item: any) => item._tipo !== 'resumen');
            } else if (data && typeof data === 'object') {
                const dataObj = data as any;
                clientsArray = dataObj.clients || dataObj.data || [dataObj];
            }

            setMetrics(calculateMetrics(clientsArray));
            saveToCache(clientsArray);
            console.log('✅ ClientHealthCard: datos actualizados desde API');
        } catch (error) {
            console.warn('Error loading client health:', error);
            // Usar caché aunque haya error
            const cachedClients = loadFromCache();
            if (cachedClients) {
                setMetrics(calculateMetrics(cachedClients));
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!metrics) return null;

    // Calcular porcentajes para la barra
    const pctActivos = metrics.total > 0 ? (metrics.activos / metrics.total) * 100 : 0;
    const pctAlerta = metrics.total > 0 ? (metrics.enAlerta / metrics.total) * 100 : 0;
    const pctRiesgo = metrics.total > 0 ? (metrics.enRiesgo / metrics.total) * 100 : 0;
    const pctCriticos = metrics.total > 0 ? (metrics.criticos / metrics.total) * 100 : 0;

    return (
        <div className="h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-gray-900 dark:text-white">Salud de Cartera</h3>
                </div>
                <button
                    onClick={() => loadData(true)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    <RefreshCw size={14} className="text-gray-400" />
                </button>
            </div>

            {/* Tasa de Retención Grande */}
            <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2">
                    <span className={`text-4xl font-bold ${metrics.tasaRetencion >= 70 ? 'text-green-500' :
                        metrics.tasaRetencion >= 50 ? 'text-yellow-500' : 'text-red-500'
                        }`}>
                        {metrics.tasaRetencion.toFixed(0)}%
                    </span>
                    <TrendingUp className={`h-6 w-6 ${metrics.tasaRetencion >= 70 ? 'text-green-500' :
                        metrics.tasaRetencion >= 50 ? 'text-yellow-500' : 'text-red-500'
                        }`} />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Tasa de Retención</p>
            </div>

            {/* Barra de Distribución */}
            <div className="mb-4">
                <div className="flex h-4 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                    {pctActivos > 0 && (
                        <div
                            className="bg-green-500 transition-all duration-500"
                            style={{ width: `${pctActivos}%` }}
                            title={`Activos: ${metrics.activos}`}
                        />
                    )}
                    {pctAlerta > 0 && (
                        <div
                            className="bg-yellow-500 transition-all duration-500"
                            style={{ width: `${pctAlerta}%` }}
                            title={`En Alerta: ${metrics.enAlerta}`}
                        />
                    )}
                    {pctRiesgo > 0 && (
                        <div
                            className="bg-red-500 transition-all duration-500"
                            style={{ width: `${pctRiesgo}%` }}
                            title={`En Riesgo: ${metrics.enRiesgo}`}
                        />
                    )}
                    {pctCriticos > 0 && (
                        <div
                            className="bg-purple-600 transition-all duration-500"
                            style={{ width: `${pctCriticos}%` }}
                            title={`Críticos: ${metrics.criticos}`}
                        />
                    )}
                </div>
            </div>

            {/* Leyenda */}
            <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <CheckCircle size={16} className="text-green-500" />
                    <div>
                        <p className="text-lg font-bold text-green-700 dark:text-green-400">{metrics.activos}</p>
                        <p className="text-[10px] uppercase text-green-600 dark:text-green-500">Activos</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                    <AlertTriangle size={16} className="text-yellow-500" />
                    <div>
                        <p className="text-lg font-bold text-yellow-700 dark:text-yellow-400">{metrics.enAlerta}</p>
                        <p className="text-[10px] uppercase text-yellow-600 dark:text-yellow-500">En Alerta</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                    <XCircle size={16} className="text-red-500" />
                    <div>
                        <p className="text-lg font-bold text-red-700 dark:text-red-400">{metrics.enRiesgo}</p>
                        <p className="text-[10px] uppercase text-red-600 dark:text-red-500">En Riesgo</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                    <XCircle size={16} className="text-purple-500" />
                    <div>
                        <p className="text-lg font-bold text-purple-700 dark:text-purple-400">{metrics.criticos}</p>
                        <p className="text-[10px] uppercase text-purple-600 dark:text-purple-500">Críticos</p>
                    </div>
                </div>
            </div>

            {/* Alerta si hay clientes críticos */}
            {(metrics.enRiesgo + metrics.criticos) > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
                    <p className="text-xs font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
                        <AlertTriangle size={14} />
                        {metrics.enRiesgo + metrics.criticos} cliente(s) requieren atención urgente
                    </p>
                </div>
            )}
        </div>
    );
};

export default ClientHealthCard;
