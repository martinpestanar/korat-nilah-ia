/**
 * useDashboardMode
 *
 * Controla el modo de visualización del dashboard: 'simple' o 'avanzado'.
 * - Modo Simple (Binance Lite): solo las métricas y acciones más importantes del día.
 * - Modo Avanzado (Binance Pro): todos los widgets, gráficos y paneles IA.
 *
 * La preferencia persiste en localStorage por email de usuario para que
 * cada cuenta mantenga su propia configuración.
 */

import { useState, useCallback } from 'react';

export type DashboardMode = 'simple' | 'avanzado';

const STORAGE_KEY = 'nilah_dashboard_mode';

function getStoredMode(userEmail?: string): DashboardMode {
  try {
    const key = userEmail ? `${STORAGE_KEY}_${userEmail}` : STORAGE_KEY;
    const stored = localStorage.getItem(key);
    if (stored === 'simple' || stored === 'avanzado') return stored;
  } catch {
    // localStorage no disponible
  }
  return 'avanzado'; // Modo por defecto: mostrar todo
}

function saveMode(mode: DashboardMode, userEmail?: string): void {
  try {
    const key = userEmail ? `${STORAGE_KEY}_${userEmail}` : STORAGE_KEY;
    localStorage.setItem(key, mode);
  } catch {
    // localStorage no disponible
  }
}

export function useDashboardMode(userEmail?: string) {
  const [mode, setModeState] = useState<DashboardMode>(() => getStoredMode(userEmail));

  const setMode = useCallback((newMode: DashboardMode) => {
    setModeState(newMode);
    saveMode(newMode, userEmail);
  }, [userEmail]);

  const toggleMode = useCallback(() => {
    setModeState(prev => {
      const newMode: DashboardMode = prev === 'simple' ? 'avanzado' : 'simple';
      saveMode(newMode, userEmail);
      return newMode;
    });
  }, [userEmail]);

  const isSimple = mode === 'simple';
  const isAdvanced = mode === 'avanzado';

  return { mode, setMode, toggleMode, isSimple, isAdvanced };
}
