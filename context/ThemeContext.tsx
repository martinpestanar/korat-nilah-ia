import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = 'dark' | 'light';
type ThemeMode = 'dark' | 'light' | 'auto';

interface ThemeContextType {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Determinar tema según la hora del día
const getThemeByTime = (): Theme => {
  const hour = new Date().getHours();
  // Light mode: 6 AM - 6 PM
  // Dark mode: 6 PM - 6 AM
  return (hour >= 6 && hour < 18) ? 'light' : 'dark';
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Cargar preferencia guardada o usar 'auto' por defecto
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('korat-theme-mode');
    return (saved === 'dark' || saved === 'light' || saved === 'auto') ? saved : 'auto';
  });

  // El tema actual aplicado
  const [theme, setTheme] = useState<Theme>(() => {
    const savedMode = localStorage.getItem('korat-theme-mode');
    if (savedMode === 'dark') return 'dark';
    if (savedMode === 'light') return 'light';
    return getThemeByTime();
  });

  // Actualizar tema cuando cambia el modo
  const updateTheme = useCallback(() => {
    let newTheme: Theme;

    if (mode === 'auto') {
      newTheme = getThemeByTime();
    } else {
      newTheme = mode;
    }

    setTheme(newTheme);

    // Aplicar al DOM
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(newTheme);
  }, [mode]);

  // Efecto para aplicar tema inicial y cuando cambia el modo
  useEffect(() => {
    updateTheme();
    localStorage.setItem('korat-theme-mode', mode);
  }, [mode, updateTheme]);

  // Efecto para actualizar automáticamente cada minuto si está en modo auto
  useEffect(() => {
    if (mode !== 'auto') return;

    const interval = setInterval(() => {
      const newTheme = getThemeByTime();
      if (newTheme !== theme) {
        setTheme(newTheme);
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(newTheme);
      }
    }, 60000); // Verificar cada minuto

    return () => clearInterval(interval);
  }, [mode, theme]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
  };

  // Toggle simple para compatibilidad con código existente
  const toggleTheme = () => {
    setModeState((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'auto';
      return 'light';
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, mode, setMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
