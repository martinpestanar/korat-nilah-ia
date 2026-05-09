import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = 'dark' | 'light';
type ThemeMode = 'dark' | 'light' | 'auto';

// ═══════════════════════════════════════════════════════════
// PALETAS DE MARCA PREDEFINIDAS (4 temas para salones de belleza)
// ═══════════════════════════════════════════════════════════
export interface BrandPalette {
  id: string;
  name: string;
  emoji: string;
  description: string;
  // Colores primarios
  primary: string;       // HEX — color principal de la marca
  primaryLight: string;  // HEX — versión clara (hover, badges)
  primaryDark: string;   // HEX — versión oscura (pressed, shadows)
  // Gradiente del hero/botones
  gradientFrom: string;
  gradientTo: string;
  // Shadow color (RGB para CSS box-shadow rgba)
  shadowRgb: string;
}

export const BRAND_PALETTES: BrandPalette[] = [
  {
    id: 'default',
    name: 'Nilah Violet',
    emoji: '✨',
    description: 'El clásico violeta vibrante de Nilah. Moderno y premium.',
    primary: '#7c3aed',
    primaryLight: '#a78bfa',
    primaryDark: '#5b21b6',
    gradientFrom: '#7c3aed',
    gradientTo: '#db2777',
    shadowRgb: '124,58,237',
  },
  {
    id: 'blush',
    name: 'Blush & Blossom',
    emoji: '🌸',
    description: 'Rosa suave y melocotón dorado. Ideal para nail salons y beauty bars.',
    primary: '#e11d7a',
    primaryLight: '#f472b6',
    primaryDark: '#9d174d',
    gradientFrom: '#e11d7a',
    gradientTo: '#f97316',
    shadowRgb: '225,29,122',
  },
  {
    id: 'lash',
    name: 'Lash Luxe',
    emoji: '🖤',
    description: 'Negro intenso con dorado y burdeos. Para lashistas y cejas de lujo.',
    primary: '#b45309',
    primaryLight: '#fbbf24',
    primaryDark: '#78350f',
    gradientFrom: '#b45309',
    gradientTo: '#9f1239',
    shadowRgb: '180,83,9',
  },
  {
    id: 'peach',
    name: 'Vibrant Peach',
    emoji: '🍑',
    description: 'Melocotón vibrante y coral energético. Para estudios modernos y frescos.',
    primary: '#ea580c',
    primaryLight: '#fb923c',
    primaryDark: '#9a3412',
    gradientFrom: '#ea580c',
    gradientTo: '#ec4899',
    shadowRgb: '234,88,12',
  },
  {
    id: 'glamour',
    name: 'Glamour Violet',
    emoji: '💜',
    description: 'Violeta profundo y esmeralda. Para salones de estética general de alto nivel.',
    primary: '#7c3aed',
    primaryLight: '#a78bfa',
    primaryDark: '#4c1d95',
    gradientFrom: '#7c3aed',
    gradientTo: '#059669',
    shadowRgb: '124,58,237',
  },
];

// Paleta custom vacía
export const EMPTY_CUSTOM_PALETTE: BrandPalette = {
  id: 'custom',
  name: 'Mi Marca',
  emoji: '🎨',
  description: 'Tu combinación de colores única y personalizada.',
  primary: '#7c3aed',
  primaryLight: '#a78bfa',
  primaryDark: '#5b21b6',
  gradientFrom: '#7c3aed',
  gradientTo: '#db2777',
  shadowRgb: '124,58,237',
};

// ═══════════════════════════════════════════════════════════
// UTILIDADES DE COLOR
// ═══════════════════════════════════════════════════════════

/** Convierte HEX a { r, g, b } */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : null;
}

/** Oscurece un color HEX en un porcentaje (0–1) */
export function darkenHex(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const r = Math.max(0, Math.round(rgb.r * (1 - amount)));
  const g = Math.max(0, Math.round(rgb.g * (1 - amount)));
  const b = Math.max(0, Math.round(rgb.b * (1 - amount)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/** Aclara un color HEX mezclándolo con blanco */
export function lightenHex(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * amount));
  const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * amount));
  const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/** Extrae el RGB en formato "r,g,b" para usar en box-shadow rgba() */
export function hexToRgbString(hex: string): string {
  const rgb = hexToRgb(hex);
  return rgb ? `${rgb.r},${rgb.g},${rgb.b}` : '124,58,237';
}

// ═══════════════════════════════════════════════════════════
// CONTEXT TYPE
// ═══════════════════════════════════════════════════════════
interface ThemeContextType {
  // Modo de brillo (dark / light / auto)
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;

  // Paleta de marca
  activePaletteId: string;           // 'default' | 'blush' | ... | 'custom'
  activePalette: BrandPalette;
  setActivePalette: (paletteId: string, customPalette?: BrandPalette) => void;
  customPalette: BrandPalette;
  setCustomPalette: (palette: BrandPalette) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ═══════════════════════════════════════════════════════════
// HELPERS DOM
// ═══════════════════════════════════════════════════════════
const getThemeBySystemPreference = (): Theme => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark';
};

/** Aplica el tema al DOM:
 *  - Temas predefinidos: usa data-theme en <html> → CSS puro remapea toda la escala violet
 *  - Tema custom: inyecta las variables directamente via style.setProperty
 */
function applyPaletteToDOM(palette: BrandPalette) {
  const root = document.documentElement;

  if (palette.id !== 'custom') {
    // Modo: data-theme attribute — el CSS en index.css hace el resto automáticamente
    root.setAttribute('data-theme', palette.id === 'default' ? '' : palette.id);
    // Limpiar variables inline que pudiera haber dejado un tema custom previo
    root.style.removeProperty('--color-violet-50');
    root.style.removeProperty('--color-violet-100');
    root.style.removeProperty('--color-violet-200');
    root.style.removeProperty('--color-violet-300');
    root.style.removeProperty('--color-violet-400');
    root.style.removeProperty('--color-violet-500');
    root.style.removeProperty('--color-violet-600');
    root.style.removeProperty('--color-violet-700');
    root.style.removeProperty('--color-violet-800');
    root.style.removeProperty('--color-violet-900');
    root.style.removeProperty('--color-violet-950');
    root.style.removeProperty('--color-brand');
    root.style.removeProperty('--color-brand-light');
    root.style.removeProperty('--color-primary');
    root.style.removeProperty('--color-primary-600');
    root.style.removeProperty('--color-primary-700');
    root.style.removeProperty('--color-primary-500');
    root.style.removeProperty('--shadow-brand');
    root.style.removeProperty('--shadow-glow-sm');
    root.style.removeProperty('--shadow-glow-md');
  } else {
    // Modo custom: inyectar la escala entera via style inline
    root.setAttribute('data-theme', 'custom');
    // La escala violet entera (calculada desde el HEX primario)
    root.style.setProperty('--color-violet-50',  lightenHexStatic(palette.primary, 0.92));
    root.style.setProperty('--color-violet-100', lightenHexStatic(palette.primary, 0.85));
    root.style.setProperty('--color-violet-200', lightenHexStatic(palette.primary, 0.72));
    root.style.setProperty('--color-violet-300', lightenHexStatic(palette.primary, 0.55));
    root.style.setProperty('--color-violet-400', palette.primaryLight);
    root.style.setProperty('--color-violet-500', palette.primary);
    root.style.setProperty('--color-violet-600', palette.primary);
    root.style.setProperty('--color-violet-700', palette.primaryDark);
    root.style.setProperty('--color-violet-800', darkenHexStatic(palette.primary, 0.35));
    root.style.setProperty('--color-violet-900', darkenHexStatic(palette.primary, 0.50));
    root.style.setProperty('--color-violet-950', darkenHexStatic(palette.primary, 0.65));
    // Tokens semánticos
    root.style.setProperty('--color-brand',        palette.primary);
    root.style.setProperty('--color-brand-light',  palette.primaryLight);
    root.style.setProperty('--color-primary',      palette.primary);
    root.style.setProperty('--color-primary-500',  palette.primaryLight);
    root.style.setProperty('--color-primary-600',  palette.primary);
    root.style.setProperty('--color-primary-700',  palette.primaryDark);
    root.style.setProperty('--shadow-brand',
      `0 8px 32px rgba(${palette.shadowRgb},0.28), 0 2px 8px rgba(${palette.shadowRgb},0.18)`);
    root.style.setProperty('--shadow-glow-sm', `0 0 20px rgba(${palette.shadowRgb},0.22)`);
    root.style.setProperty('--shadow-glow-md', `0 0 40px rgba(${palette.shadowRgb},0.32)`);
  }
}

// Tiny helpers para la escala custom (sin importar los de afuera para no crear dep circular)
function lightenHexStatic(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lr = Math.min(255, Math.round(r + (255 - r) * amount));
  const lg = Math.min(255, Math.round(g + (255 - g) * amount));
  const lb = Math.min(255, Math.round(b + (255 - b) * amount));
  return `#${lr.toString(16).padStart(2,'0')}${lg.toString(16).padStart(2,'0')}${lb.toString(16).padStart(2,'0')}`;
}
function darkenHexStatic(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const dr = Math.max(0, Math.round(r * (1 - amount)));
  const dg = Math.max(0, Math.round(g * (1 - amount)));
  const db = Math.max(0, Math.round(b * (1 - amount)));
  return `#${dr.toString(16).padStart(2,'0')}${dg.toString(16).padStart(2,'0')}${db.toString(16).padStart(2,'0')}`;
}

// ═══════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ── Modo (dark / light / auto) ──────────────────────────
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('korat-theme-mode');
    return (saved === 'dark' || saved === 'light' || saved === 'auto') ? saved : 'auto';
  });
  const [theme, setTheme] = useState<Theme>(() => {
    const savedMode = localStorage.getItem('korat-theme-mode');
    if (savedMode === 'dark') return 'dark';
    if (savedMode === 'light') return 'light';
    return getThemeBySystemPreference();
  });

  // ── Paleta activa ────────────────────────────────────────
  const [activePaletteId, setActivePaletteId] = useState<string>(() =>
    localStorage.getItem('korat-brand-palette') ?? 'default'
  );
  const [customPalette, setCustomPaletteState] = useState<BrandPalette>(() => {
    try {
      const saved = localStorage.getItem('korat-brand-custom');
      return saved ? JSON.parse(saved) : EMPTY_CUSTOM_PALETTE;
    } catch {
      return EMPTY_CUSTOM_PALETTE;
    }
  });

  const activePalette: BrandPalette = (() => {
    if (activePaletteId === 'custom') return customPalette;
    return BRAND_PALETTES.find(p => p.id === activePaletteId) ?? BRAND_PALETTES[0];
  })();

  // ── Aplicar paleta al DOM cuando cambia ─────────────────
  useEffect(() => {
    applyPaletteToDOM(activePalette);
  }, [activePalette]);

  // ── Lógica de modo dark/light ────────────────────────────
  const updateTheme = useCallback(() => {
    const newTheme: Theme = mode === 'auto' ? getThemeBySystemPreference() : mode;
    setTheme(newTheme);
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(newTheme);

    // Sincronizar theme-color para PWA (barra de estado móvil)
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', newTheme === 'dark' ? '#0a0a0a' : '#ffffff');
    }
  }, [mode]);

  useEffect(() => {
    updateTheme();
    localStorage.setItem('korat-theme-mode', mode);
  }, [mode, updateTheme]);

  useEffect(() => {
    if (mode !== 'auto' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const newTheme: Theme = e.matches ? 'dark' : 'light';
      setTheme(newTheme);
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(newTheme);
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [mode]);

  // ── API pública ──────────────────────────────────────────
  const setMode = (newMode: ThemeMode) => setModeState(newMode);

  const toggleTheme = () => {
    setModeState((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'auto';
      return 'light';
    });
  };

  const setActivePalette = (paletteId: string, cp?: BrandPalette) => {
    setActivePaletteId(paletteId);
    localStorage.setItem('korat-brand-palette', paletteId);
    if (paletteId === 'custom' && cp) {
      setCustomPaletteState(cp);
      localStorage.setItem('korat-brand-custom', JSON.stringify(cp));
    }
  };

  const setCustomPalette = (palette: BrandPalette) => {
    setCustomPaletteState(palette);
    localStorage.setItem('korat-brand-custom', JSON.stringify(palette));
    if (activePaletteId === 'custom') applyPaletteToDOM(palette);
  };

  return (
    <ThemeContext.Provider value={{
      theme, mode, setMode, toggleTheme,
      activePaletteId, activePalette,
      setActivePalette, customPalette, setCustomPalette,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
