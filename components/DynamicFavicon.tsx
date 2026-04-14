import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * DynamicFavicon
 * Este componente escucha los cambios de ruta y actualiza el Favicon de la ventana
 * para que haga match con el color temático de cada módulo.
 */
export const DynamicFavicon = () => {
  const location = useLocation();

  useEffect(() => {
    // 1. Definir los colores base por módulo
    let color1 = '#10B981'; // Emerald 500 (Por defecto)
    let color2 = '#34D399'; // Emerald 400

    const path = location.pathname.toLowerCase();
    
    // 2. Mapear rutas a paletas de colores
    if (path.includes('nilah')) {
      // Nilah IA - Violet Theme
      color1 = '#8B5CF6'; // Violet 500
      color2 = '#A78BFA'; // Violet 400
    } else if (path.includes('marketing') || path.includes('creative')) {
      color1 = '#EC4899'; // Pink 500
      color2 = '#F472B6'; // Pink 400
    } else if (path.includes('inbox') || path.includes('clients') || path.includes('crm')) {
      color1 = '#3B82F6'; // Blue 500
      color2 = '#60A5FA'; // Blue 400
    } else if (path.includes('calendar')) {
      color1 = '#8B5CF6'; // Violet 500
      color2 = '#A78BFA'; // Violet 400
    } else if (path.includes('finances')) {
      color1 = '#EAB308'; // Yellow 500
      color2 = '#FDE047'; // Yellow 400
    } else if (path.includes('growth') || path.includes('loyalty') || path.includes('engagement')) {
      color1 = '#F97316'; // Orange 500
      color2 = '#FB923C'; // Orange 400
    } else if (path.includes('dashboard')) {
      color1 = '#10B981'; // Emerald
      color2 = '#34D399'; 
    } else if (path.includes('god-mode') || path.includes('superadmin')) {
      color1 = '#6366F1'; // Indigo 500
      color2 = '#818CF8'; // Indigo 400
    }

    // 2.5 Actualizar el theme-color de los móviles (barra de direcciones)
    const isDark = document.documentElement.classList.contains('dark');
    const themeColor = isDark ? '#0A0A0A' : color1;
    let metaTheme = document.querySelector('meta[name="theme-color"]');
    if (!metaTheme) {
      metaTheme = document.createElement('meta');
      metaTheme.setAttribute('name', 'theme-color');
      document.head.appendChild(metaTheme);
    }
    metaTheme.setAttribute('content', themeColor);

    // 3. Crear el SVG como un string (Hoja dentro de un cuadrado blanco)
    const svg = `
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Background square (Light version) -->
        <rect width="32" height="32" rx="9" fill="white"/>
        
        <!-- Icon centered (scaled to fit) -->
        <g transform="translate(4, 4)">
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" fill="url(#leaf-gradient)"/>
          <path d="M3 21L12 12" stroke="${color1}" stroke-width="2.5" stroke-linecap="round" opacity="0.8"/>
        </g>

        <defs>
          <linearGradient id="leaf-gradient" x1="2" y1="22" x2="19" y2="2" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="${color1}"/>
            <stop offset="100%" stop-color="${color2}"/>
          </linearGradient>
        </defs>
      </svg>
    `;

    // 4. Codificar el SVG para usarlo como URL
    const encodedSvg = encodeURIComponent(svg.trim());
    const dataUri = `data:image/svg+xml;charset=utf-8,${encodedSvg}`;

    // 5. Encontrar el <link rel="icon"> y actualizarlo
    let link: HTMLLinkElement | null = document.querySelector('link[rel="icon"]');
    
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/svg+xml';
      document.head.appendChild(link);
    }
    
    // Solo cambiar si es diferente para evitar flashes
    if (link.href !== dataUri) {
      link.href = dataUri;
    }

  }, [location.pathname]); // Se re-ejecuta cada vez que cambia la ruta

  // Tab Re-engagement
  useEffect(() => {
    let originalTitle = document.title;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        originalTitle = document.title;
        document.title = '¡Tu salón te espera! 💜';
      } else {
        document.title = originalTitle;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Este componente es invisible, no renderiza nada en el DOM
  return null;
};
